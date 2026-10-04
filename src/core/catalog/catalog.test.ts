/** Packs (ADR-0034): validated, added only where missing, references by name. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import type { Owner } from "../identity/owner";
import { listIngredients } from "../nutrition/repositories/ingredients";
import { getDay } from "../nutrition/repositories/log";
import { listMeals } from "../nutrition/repositories/meals";
import { createTestDb, createTestUser } from "../testing/test-db";
import { createExercise, listExercises } from "../training/repositories/exercises";
import { listPrograms } from "../training/repositories/programs";
import { listRoutines } from "../training/repositories/routines";
import { applyPack } from "./apply";
import { nameKey, parsePack, type PackInput } from "./pack";
import { STARTER, starterPack } from "./starter";

const food = {
  kcal: "100",
  protein: "1",
  carbs: "20",
  sugars: "1",
  fat: "1",
  saturatedFat: "0.2",
  fiber: "2",
  salt: "0.01",
};

const PACK: PackInput = {
  format: "lifeos-pack",
  version: 1,
  name: "Test",
  exercises: [
    { name: "Panca piana", kind: "strength", muscleGroups: ["chest", "triceps"] },
    { name: "Plank", kind: "bodyweight", muscleGroups: ["abs"], pattern: "plank" },
  ],
  routines: [
    {
      name: "Push",
      items: [
        { exercise: "Panca piana", sets: 3, reps: 8, loadKg: "60" },
        { exercise: "Plank", sets: 3, durationS: 45 },
        { exercise: "Nowhere", sets: 3, reps: 10 },
      ],
    },
  ],
  programs: [
    {
      name: "Ciclo",
      slots: [{ routine: "Push" }, { label: "Riposo" }, { exercise: "Plank" }],
    },
    { name: "Rotto", slots: [{ routine: "Pull" }] },
  ],
  ingredients: [
    { name: "Avena", ...food },
    { name: "Origano secco", ...food, nova: 1, origin: "plant" },
  ],
  meals: [
    { name: "Porridge", items: [{ ingredient: "Avena", quantity: "60" }] },
    { name: "Senza", items: [{ ingredient: "Missing", quantity: "10" }] },
  ],
};

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

const parsed = (input: unknown) => {
  const r = parsePack(input);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.value;
};

describe("parsePack", () => {
  it("accepts a pack and fills the defaults", () => {
    const p = parsed(PACK);
    expect(p.exercises[0]!.pattern).toBeNull();
    expect(p.routines[0]!.items[1]!.reps).toBeNull();
  });

  it("refuses two records of a kind with the same name, accents and case aside", () => {
    const r = parsePack({
      ...PACK,
      ingredients: [
        { name: "Caffè", ...food },
        { name: "caffe", ...food },
      ],
    });
    expect(r).toEqual({ ok: false, errors: { "ingredients.1.name": "duplicate_name" } });
  });

  it("refuses more decimals than the column keeps, and other files", () => {
    expect(
      parsePack({ ...PACK, ingredients: [{ name: "X", ...food, kcal: "1.2345" }] }).ok,
    ).toBe(false);
    expect(parsePack({ format: "lifeos-export", version: 1 }).ok).toBe(false);
  });

  it("compares names without case, accents or punctuation", () => {
    expect(nameKey("  Caffè-Latte ")).toBe(nameKey("caffe latte"));
  });
});

describe("applyPack", () => {
  it("adds what is missing and reports what it could not link", async () => {
    const r = await applyPack(db, me, parsed(PACK), "2026-10-03");
    expect(r.added).toEqual({
      exercises: 2,
      routines: 1,
      programs: 1,
      ingredients: 2,
      meals: 1,
      estimates: 0,
    });
    expect(r.missing.sort()).toEqual([
      "Push → Nowhere",
      "Rotto → Pull",
      "Senza → Missing",
    ]);

    const [push] = await listRoutines(db, me);
    expect(push!.items.map((i) => i.name)).toEqual(["Panca piana", "Plank"]);
    const [program] = await listPrograms(db, me);
    expect(program).toMatchObject({
      name: "Ciclo",
      active: false,
      startDay: "2026-10-03",
    });
    expect((await listMeals(db, me))[0]!.name).toBe("Porridge");
    expect(await listExercises(db, other)).toEqual([]); // only my account
  });

  it("is idempotent, and keeps what the account already has", async () => {
    await createExercise(db, me, {
      name: "panca PIANA",
      kind: "strength",
      muscleGroups: [],
      pattern: null,
      equipment: null,
      unilateral: false,
      notes: "mine",
    });
    const first = await applyPack(db, me, parsed(PACK), "2026-10-03");
    expect(first.kept.exercises).toBe(1);
    const again = await applyPack(db, me, parsed(PACK), "2026-10-03");
    expect(again.added).toEqual({
      exercises: 0,
      routines: 0,
      programs: 0,
      ingredients: 0,
      meals: 0,
      estimates: 0,
    });
    const names = (await listExercises(db, me)).map((e) => [e.name, e.notes]);
    expect(names).toContainEqual(["panca PIANA", "mine"]);
    expect(await listIngredients(db, me)).toHaveLength(2);
  });
});

describe("estimates in a pack", () => {
  const MENU: PackInput = {
    format: "lifeos-pack",
    version: 1,
    name: "Menu",
    day: "2026-10-04",
    estimates: [
      { name: "Chicken tikka masala", moment: "dinner", ...food, kcal: "820" },
      { name: "Garlic naan", kcal: "450", carbs: "70", cost: "3.50" },
    ],
  };

  it("plans them on the pack's day as estimates, adding nothing to the catalog", async () => {
    const r = await applyPack(db, me, parsed(MENU), "2026-10-03");
    expect(r.added.estimates).toBe(2);
    const day = await getDay(db, me, "2026-10-04");
    expect(day.entries.map((e) => [e.label, e.status, e.estimated, e.moment])).toEqual(
      expect.arrayContaining([
        ["Chicken tikka masala", "planned", true, "dinner"],
        ["Garlic naan", "planned", true, null],
      ]),
    );
    expect(day.totals.nutrients.kcal).toBe("0.0"); // nothing eaten yet
    expect(day.withPlanned.nutrients).toMatchObject({
      kcal: "1270.0",
      saturatedFat: "0.2", // every nutrient kept; the naan's missing ones are 0
    });
    expect(day.withPlanned.costCents).toBe(350);
    expect(await listIngredients(db, me)).toEqual([]);
    expect(await listMeals(db, me)).toEqual([]);
    expect((await getDay(db, other, "2026-10-04")).entries).toEqual([]);
  });

  it("goes on today without a day, and a second import adds nothing", async () => {
    const today = parsed({ ...MENU, day: undefined });
    await applyPack(db, me, today, "2026-10-03");
    const again = await applyPack(db, me, today, "2026-10-03");
    expect(again.added.estimates).toBe(0);
    expect(again.kept.estimates).toBe(2);
    expect((await getDay(db, me, "2026-10-03")).entries).toHaveLength(2);
  });

  it("refuses a dish without energy and two dishes with one name", () => {
    expect(parsePack({ ...MENU, estimates: [{ name: "X" }] }).ok).toBe(false);
    expect(
      parsePack({
        ...MENU,
        estimates: [
          { name: "Naan", kcal: "1" },
          { name: "naan", kcal: "2" },
        ],
      }),
    ).toEqual({ ok: false, errors: { "estimates.1.name": "duplicate_name" } });
  });
});

describe("the starter pack", () => {
  it("is a valid pack whose every reference resolves", async () => {
    const r = await applyPack(db, me, starterPack(), "2026-10-03");
    expect(r.missing).toEqual([]);
    expect(r.added.exercises).toBeGreaterThan(40);
    expect(r.added.routines).toBe(STARTER.routines!.length);
    expect(r.added.programs).toBe(STARTER.programs!.length);
    expect(r.added.meals).toBe(STARTER.meals!.length);
  });

  it("has energy that matches its macros (4/4/9 kcal per g, fibre 2)", () => {
    for (const i of starterPack().ingredients) {
      const n = (k: keyof typeof i) => Number(i[k]);
      const fromMacros =
        4 * n("protein") + 4 * n("carbs") + 9 * n("fat") + 2 * n("fiber");
      // Labels round, and herbs carry acids and polyols: a loose check that
      // catches a swapped column, not the last kcal.
      expect(Math.abs(fromMacros - n("kcal")), i.name).toBeLessThan(
        Math.max(25, n("kcal") * 0.2),
      );
    }
  });
});
