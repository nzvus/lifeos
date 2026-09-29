/** Tests for the user-facing export: complete for me, nothing of anyone else, no secrets. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import { account } from "../db/schema";
import type { Owner } from "../identity/owner";
import { createIngredient } from "../nutrition/repositories/ingredients";
import { logIngredient } from "../nutrition/repositories/log";
import { createProfile } from "../nutrition/repositories/profiles";
import { saveSettings } from "../nutrition/repositories/settings";
import { createTestDb, createTestUser, ingredientFixture } from "../testing/test-db";
import { EXPORT_FORMAT, exportUserData } from "./export";

let db: Db;
let close: () => Promise<void>;
let alice: Owner;
let bob: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  alice = await createTestUser(db, "alice@example.com");
  bob = await createTestUser(db, "bob@example.com");
});
afterEach(() => close());

describe("exportUserData", () => {
  it("contains my data, none of another user's, and no password hash", async () => {
    await createProfile(db, alice, {
      name: "Palestra",
      kcal: "2400",
      protein: null,
      carbs: null,
      sugars: null,
      fat: null,
      saturatedFat: null,
      fiber: null,
      salt: null,
    });
    const ing = await createIngredient(db, alice, ingredientFixture());
    if (!ing.ok) throw new Error("setup failed");
    await logIngredient(db, alice, {
      day: "2026-09-29",
      ingredientId: ing.value.id,
      quantity: "50",
    });
    await saveSettings(db, alice, { timezone: "Europe/Rome", locale: "it" });
    await createIngredient(db, bob, ingredientFixture({ name: "Bob's secret" }));
    await db.insert(account).values({
      accountId: "a",
      providerId: "credential",
      userId: alice.id,
      password: "HASH-SHOULD-NOT-LEAK",
    });

    const data = await exportUserData(db, alice, new Date("2026-09-29T10:00:00Z"));
    const text = JSON.stringify(data);

    expect(data.format).toBe(EXPORT_FORMAT);
    expect(data.account?.email).toBe("alice@example.com");
    expect(data.ingredients.map((i) => i.name)).toEqual(["Oats"]);
    expect(data.log[0]?.items[0]?.quantity).toBe("50.00"); // exact, as stored
    expect(data.settings?.timezone).toBe("Europe/Rome");
    expect(data.dayProfiles.map((p) => [p.name, p.kcal, p.isDefault])).toEqual([
      ["Palestra", "2400.000", true],
    ]);
    // Logging food fixed the day to the default profile (ADR-0008):
    expect(data.dayPlans.map((d) => [d.day, d.profileName])).toEqual([
      ["2026-09-29", "Palestra"],
    ]);
    expect(text).not.toContain("Bob's secret");
    expect(text).not.toContain("HASH-SHOULD-NOT-LEAK");
    expect(text).not.toContain(alice.id); // user ids are stripped
  });
});
