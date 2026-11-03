import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readFoodChoices } from "./catalog";
import { createFood, setIntake } from "./edit";

describe("an «assunzione» as an item with its dose (FOOD-44)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
  });
  afterAll(() => close());

  it("a new one is offered at its named dose; a coffee proposed by the rule can be turned off", async () => {
    const mag = await createFood(db, a, "Magnesio", "g", { kcal: "0" });
    if (typeof mag !== "object") throw new Error("expected a food");
    await setIntake(db, a, mag.id, { intake: true, dose: "2", doseName: "bustina" });
    const coffee = await createFood(db, a, "Caffè", "g", { kcal: "2" }, null, {
      caffeine: "1389",
    });
    if (typeof coffee !== "object") throw new Error("expected a food");
    const juice = await createFood(db, a, "Bevanda ACE", "ml", { kcal: "12" });
    if (typeof juice !== "object") throw new Error("expected a food");
    let c = await readFoodChoices(db, a, "2026-11-03");
    const of = (id: string) => c.find((x) => x.key === id)?.intake;
    expect(of(mag.id)).toEqual({ dose: "2", doseName: "bustina", chosen: true });
    // Proposed by the rule, but never eaten: no dose to log yet.
    expect(of(coffee.id)).toBeUndefined();
    await setIntake(db, a, coffee.id, { intake: true, dose: "7.2", doseName: "capsula" });
    c = await readFoodChoices(db, a, "2026-11-03");
    expect(of(coffee.id)?.dose).toBe("7.2");
    expect(of(juice.id)).toBeUndefined();
    await setIntake(db, a, coffee.id, { intake: false, dose: null, doseName: null });
    c = await readFoodChoices(db, a, "2026-11-03");
    expect(of(coffee.id)).toBeUndefined();
  });
});
