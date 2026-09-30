/**
 * Round-trip test for the lifeos importer: export an account, replace
 * another account's data with that export, export again — the two exports
 * must describe the same data (ids and timestamps aside). Also: validation
 * rejects bad files, and replacing never touches another user's rows.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import type { Owner } from "../identity/owner";
import { exportUserData } from "../export/export";
import { createIngredient } from "../nutrition/repositories/ingredients";
import { logMeal } from "../nutrition/repositories/log";
import { createMeal, listMeals } from "../nutrition/repositories/meals";
import { createProfile, setDayProfile } from "../nutrition/repositories/profiles";
import { createTestDb, createTestUser, ingredientFixture } from "../testing/test-db";
import { parseLifeosExport } from "./lifeos";
import { countOwned, replaceWithExport } from "./lifeos-apply";

let db: Db;
let close: () => Promise<void>;
let source: Owner;
let target: Owner;
let bystander: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  source = await createTestUser(db, "source@example.com");
  target = await createTestUser(db, "target@example.com");
  bystander = await createTestUser(db, "bystander@example.com");
});
afterEach(() => close());

/** An export with volatile fields (ids, timestamps) removed, for comparison. */
function comparable(e: Awaited<ReturnType<typeof exportUserData>>) {
  const strip = (x: unknown): unknown =>
    Array.isArray(x)
      ? x.map(strip)
      : x && typeof x === "object" && !(x instanceof Date)
        ? Object.fromEntries(
            Object.entries(x)
              .filter(
                ([k]) => !/^(id|.*Id|createdAt|updatedAt|exportedAt|account)$/.test(k),
              )
              .map(([k, v]) => [k, strip(v)]),
          )
        : x;
  return strip(e);
}

async function seed(owner: Owner) {
  const oats = await createIngredient(
    db,
    owner,
    ingredientFixture({ description: "Lidl" }),
  );
  if (!oats.ok) throw new Error("setup failed");
  const meal = await createMeal(db, owner, {
    name: "Porridge",
    notes: "with milk",
    items: [{ ingredientId: oats.value.id, quantity: "60" }],
  });
  if (!meal.ok) throw new Error("setup failed");
  const profile = await createProfile(db, owner, {
    name: "Palestra",
    kcal: "2600",
    protein: "150",
    carbs: null,
    sugars: null,
    fat: null,
    saturatedFat: null,
    fiber: null,
    salt: null,
  });
  if (!profile.ok) throw new Error("setup failed");
  await setDayProfile(db, owner, "2026-09-29", profile.value.id);
  await logMeal(db, owner, { day: "2026-09-29", mealId: meal.value.id, servings: "1.5" });
}

describe("lifeos import (replace)", () => {
  it("round-trips: export -> replace -> export gives the same data", async () => {
    await seed(source);
    await seed(target); // target already has data: it must be REPLACED, not merged
    await createIngredient(db, target, ingredientFixture({ name: "Old stuff" }));
    const original = JSON.parse(JSON.stringify(await exportUserData(db, source)));

    const parsed = parseLifeosExport(original);
    if (!parsed.ok) throw new Error("export should validate");
    await replaceWithExport(db, target, parsed.value);

    const again = JSON.parse(JSON.stringify(await exportUserData(db, target)));
    expect(comparable(again)).toEqual(comparable(original));
    expect((await listMeals(db, target)).map((m) => m.name)).toEqual(["Porridge"]); // "Old stuff" gone
  });

  it("never touches another user's rows", async () => {
    await seed(source);
    await seed(bystander);
    const before = await countOwned(db, bystander);
    const parsed = parseLifeosExport(
      JSON.parse(JSON.stringify(await exportUserData(db, source))),
    );
    if (!parsed.ok) throw new Error("export should validate");
    await replaceWithExport(db, target, parsed.value);
    expect(await countOwned(db, bystander)).toEqual(before);
  });

  it("rejects files that would lose precision or break rules", async () => {
    await seed(source);
    const file = JSON.parse(JSON.stringify(await exportUserData(db, source)));
    file.ingredients[0].kcal = "1.23456"; // more decimals than numeric(10,3)
    file.ingredients[0].packageSize = null; // half a price
    const r = parseLifeosExport(file);
    expect(r.ok).toBe(false);
    expect("problems" in r && r.problems.join(" ")).toMatch(/ingredients\.0\.kcal/);
    expect(parseLifeosExport({ hello: 1 }).ok).toBe(false);
  });
});
