/** Doses (ADR-0039): from eaten lines of ingredients with compounds. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import {
  createIngredient,
  updateIngredient,
} from "../../nutrition/repositories/ingredients";
import { logIngredient } from "../../nutrition/repositories/log";
import { createTestDb, createTestUser, ingredientFixture } from "../../testing/test-db";
import { supplementsDay } from "../day";
import { dosesBetween } from "./doses";

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

describe("doses", () => {
  it("come from eaten lines × the compound per 100, mine only, planned not counted", async () => {
    const redBull = await createIngredient(db, me, {
      ...ingredientFixture({ name: "Red Bull", unit: "ml", kcal: "45" }),
      caffeineMg: "32",
    });
    const creatine = await createIngredient(db, me, {
      ...ingredientFixture({ name: "Creatina" }),
      creatineG: "100",
    });
    if (!redBull.ok || !creatine.ok) throw new Error("setup failed");
    const at = new Date("2026-10-04T08:00:00Z");
    await logIngredient(db, me, {
      day: "2026-10-04",
      ingredientId: redBull.value.id,
      quantity: "250",
      status: "eaten",
      at,
    });
    await logIngredient(db, me, {
      day: "2026-10-04",
      ingredientId: creatine.value.id,
      quantity: "5",
      status: "eaten",
      at,
    });
    await logIngredient(db, me, {
      day: "2026-10-04",
      ingredientId: redBull.value.id,
      quantity: "250",
      status: "planned",
      at: null,
    });

    const doses = await dosesBetween(db, me, "2026-10-01", "2026-10-04");
    expect(doses.map((d) => [d.compound, d.amount])).toEqual(
      expect.arrayContaining([
        ["caffeine", 80],
        ["creatine", 5],
      ]),
    );
    expect(doses).toHaveLength(2);
    expect(await dosesBetween(db, other, "2026-10-01", "2026-10-04")).toEqual([]);

    const s = supplementsDay({
      doses,
      day: "2026-10-04",
      now: Date.parse("2026-10-04T09:00:00Z"),
      bedtime: Date.parse("2026-10-04T21:00:00Z"),
    });
    expect(s.any).toBe(true);
    expect(s.caffeine.dayMg).toBe(80);
    expect(s.caffeine.nowMg).toBeGreaterThan(60);
    expect(s.caffeine.bedMg).toBeLessThan(s.caffeine.nowMg);
    expect(s.creatine).toMatchObject({ dayG: 5, daysTaken30: 1 });
    expect(s.creatine.saturation).toBeCloseTo(1 / 28);

    // Saving the form without the compound fields keeps them; empty clears them.
    const {
      caffeineMg: _c,
      creatineG: _g,
      ...plain
    } = {
      ...ingredientFixture({ name: "Red Bull", unit: "ml", kcal: "45" }),
      caffeineMg: undefined,
      creatineG: undefined,
    };
    await updateIngredient(db, me, redBull.value.id, plain);
    expect(await dosesBetween(db, me, "2026-10-04", "2026-10-04")).toHaveLength(2);
    await updateIngredient(db, me, redBull.value.id, { ...plain, caffeineMg: null });
    expect(await dosesBetween(db, me, "2026-10-04", "2026-10-04")).toHaveLength(1);
  });
});
