/** Tests for getHistory: per-day totals equal the day view; targets; isolation. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser, ingredientFixture } from "../../testing/test-db";
import { getHistory } from "./history";
import { createIngredient } from "./ingredients";
import { getDay, logIngredient } from "./log";
import { createProfile } from "./profiles";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
});
afterEach(() => close());

describe("an entry's database sums, scaled (scaleTotals)", () => {
  it("no line is zeros; servings multiply; a missing price stays said", async () => {
    const { scaleTotals } = await import("./history");
    const { emptyTotals } = await import("../totals");
    const none = scaleTotals(null, "2");
    expect(none.nutrients.kcal.toString()).toBe("0");
    expect(none.costComplete).toBe(true);
    const sum = emptyTotals();
    sum.nutrients.kcal = new (await import("big.js")).default("36000"); // 360 kcal/100 g × 100 g
    sum.costCents = new (await import("big.js")).default("12.5");
    sum.costComplete = false;
    const t = scaleTotals(sum, "1.5");
    expect(t.nutrients.kcal.toString()).toBe("540");
    expect(t.costCents.toString()).toBe("18.75");
    expect(t.costComplete).toBe(false);
  });
});

describe("getHistory", () => {
  it("gives every day in the range, with the same totals as the day view", async () => {
    await createProfile(db, me, {
      name: "Standard",
      kcal: "2400",
      protein: null,
      carbs: null,
      sugars: null,
      fat: null,
      saturatedFat: null,
      fiber: null,
      salt: null,
    });
    const oats = await createIngredient(db, me, ingredientFixture());
    if (!oats.ok) throw new Error("setup failed");
    await logIngredient(db, me, {
      day: "2026-09-28",
      ingredientId: oats.value.id,
      quantity: "50",
    });
    await logIngredient(db, me, {
      day: "2026-09-28",
      ingredientId: oats.value.id,
      quantity: "30",
    });
    await logIngredient(db, me, {
      day: "2026-09-30",
      ingredientId: oats.value.id,
      quantity: "100",
    });

    const h = await getHistory(db, me, "2026-09-28", "2026-09-30");
    expect(h.map((d) => [d.day, d.logged, d.totals.nutrients.kcal])).toEqual([
      ["2026-09-28", true, "297.6"],
      ["2026-09-29", false, "0.0"],
      ["2026-09-30", true, "372.0"],
    ]);
    expect(h[0]!.totals).toEqual((await getDay(db, me, "2026-09-28")).totals);
    expect(h[1]!.targets?.kcal).toBe("2400.000"); // unfixed day: default profile

    // CROSS-USER: another user's history is empty days only.
    const theirs = await getHistory(db, other, "2026-09-28", "2026-09-30");
    expect(theirs.every((d) => !d.logged && d.targets === null)).toBe(true);
  });

  it("gives the day type, when each eaten entry was eaten, and unconfirmed plans", async () => {
    const gym = await createProfile(db, me, {
      name: "Palestra",
      kcal: "2600",
      protein: null,
      carbs: null,
      sugars: null,
      fat: null,
      saturatedFat: null,
      fiber: null,
      salt: null,
    });
    if (!gym.ok) throw new Error("setup failed");
    const oats = await createIngredient(db, me, ingredientFixture());
    if (!oats.ok) throw new Error("setup failed");
    const at = new Date("2026-09-28T06:30:00Z");
    await logIngredient(db, me, {
      day: "2026-09-28",
      ingredientId: oats.value.id,
      quantity: "100",
      status: "eaten",
      at,
    });
    await logIngredient(db, me, {
      day: "2026-09-28",
      ingredientId: oats.value.id,
      quantity: "50",
      status: "planned",
      at: null,
    });

    const [d] = await getHistory(db, me, "2026-09-28", "2026-09-28");
    expect(d!.dayType).toBe("Palestra"); // the default profile
    expect(d!.eaten).toEqual([{ at: at.toISOString(), kcal: "372", estimated: false }]);
    expect(d!.plannedLeft).toBe(1);
    expect(d!.totals.nutrients.kcal).toBe("372.0"); // plans are not eaten
  });
});
