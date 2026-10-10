/** Tests for the user-facing export: complete for me, nothing of anyone else, no secrets. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import { eq } from "drizzle-orm";
import { account, userSettings } from "../db/schema";
import { createProgram } from "../training/repositories/programs";
import type { Owner } from "../identity/owner";
import { createIngredient } from "../nutrition/repositories/ingredients";
import { logIngredient } from "../nutrition/repositories/log";
import { saveSettings } from "../nutrition/repositories/settings";
import { createTestDb, createTestUser, ingredientFixture } from "../testing/test-db";
import { addPurchase, createProduct } from "../pantry/repositories/products";
import { createExercise } from "../training/repositories/exercises";
import { addMeasurement, deleteMeasurement } from "../training/repositories/measurements";
import { createSession } from "../training/repositories/sessions";
import { setEnergyCorrection } from "../energy/repositories/energy";
import { STARTERS } from "../nutrition/programs";
import { createProfile } from "../nutrition/repositories/profiles";
import { saveProgram } from "../nutrition/repositories/programs";
import { recordWeekCheckin, setGoal } from "../energy/repositories/goals";
import { setDayClosure } from "../nutrition/repositories/closures";
import { EXPORT_FORMAT, EXPORT_VERSION, exportUserData } from "./export";

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
    await saveSettings(db, alice, {
      timezone: "Europe/Rome",
      locale: "it",
      theme: "quaderno",
    });
    // ADR-0018: an assistant key set (encrypted) must never be exported.
    await db
      .update(userSettings)
      .set({
        assistantKeyEnc: "ENCRYPTED-KEY-SHOULD-NOT-LEAK",
        assistantKeyLast4: "ab12",
      })
      .where(eq(userSettings.userId, alice.id));
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
    expect(data.settings?.theme).toBe("quaderno");
    expect(data.dayProfiles.map((p) => [p.name, p.kcal, p.isDefault])).toEqual([
      ["Palestra", "2400.000", true],
    ]);
    // Logging food fixed the day to the default profile (ADR-0008):
    expect(data.dayPlans.map((d) => [d.day, d.profileName])).toEqual([
      ["2026-09-29", "Palestra"],
    ]);
    expect(text).not.toContain("Bob's secret");
    expect(text).not.toContain("HASH-SHOULD-NOT-LEAK");
    expect(text).not.toContain("ENCRYPTED-KEY-SHOULD-NOT-LEAK");
    expect(text).not.toContain(alice.id); // user ids are stripped
  });

  it("contains my training (version 6), live records only, nobody else's", async () => {
    const lat = await createExercise(db, alice, {
      name: "Lat pulldown",
      kind: "strength",
      muscleGroups: ["lats"],
      pattern: null,
      equipment: null,
      unilateral: false,
      notes: "",
    });
    if (!lat.ok) throw new Error("setup failed");
    const s = await createSession(
      db,
      alice,
      {
        label: "Pull",
        day: "2026-09-30",
        status: "done",
        time: "",
        durationMin: 60,
        notes: "",
        routineId: null,
        exercises: [
          {
            exerciseId: lat.value.id,
            notes: "",
            restS: null,
            sets: [
              {
                reps: 10,
                loadKg: "40",
                loadText: null,
                loadApprox: false,
                durationS: null,
                distanceM: null,
                speedKmh: null,
                inclinePct: null,
                warmup: false,
                done: true,
              },
            ],
          },
        ],
      },
      "Europe/Rome",
    );
    if (!s.ok) throw new Error("setup failed: " + JSON.stringify(s));
    const kept = await addMeasurement(db, alice, {
      day: "2026-09-30",
      weightKg: "75",
      bodyFatPct: null,
      waistCm: null,
      notes: "",
    });
    const trashed = await addMeasurement(db, alice, {
      day: "2026-09-29",
      weightKg: "99",
      bodyFatPct: null,
      waistCm: null,
      notes: "",
    });
    if (!kept.ok || !trashed.ok) throw new Error("setup failed");
    await deleteMeasurement(db, alice, trashed.value.id);
    await createExercise(db, bob, {
      name: "Bob's squat",
      kind: "strength",
      muscleGroups: [],
      pattern: null,
      equipment: null,
      unilateral: false,
      notes: "",
    });

    const data = await exportUserData(db, alice);
    expect(data.version).toBe(EXPORT_VERSION);
    expect(data.training.exercises.map((e) => e.name)).toEqual(["Lat pulldown"]);
    const [session] = data.training.sessions;
    expect(session?.label).toBe("Pull");
    expect(session?.exercises[0]?.sets.map((x) => [x.reps, x.loadKg])).toEqual([
      [10, "40.00"],
    ]);
    // The trash is not exported, like every other kind.
    expect(data.training.measurements.map((m) => [m.weightKg, m.context])).toEqual([
      ["75.00", null], // version 10: how it was taken, null = not said
    ]);
    expect(JSON.stringify(data)).not.toContain("Bob's squat");
  });

  it("contains my pantry (version 7): products with their purchases", async () => {
    const p = await createProduct(db, alice, {
      name: "Detersivo piatti",
      brand: "",
      unit: "piece",
      packageSize: "1",
      ingredientId: null,
      shop: "",
      notes: "",
    });
    if (!p.ok) throw new Error("setup failed");
    await addPurchase(db, alice, {
      productId: p.value.id,
      day: "2026-10-01",
      packages: "2",
      priceCents: 318,
      shop: "Lidl",
    });
    const data = await exportUserData(db, alice);
    expect(
      data.pantry.products.map((x) => [x.name, x.purchases.map((y) => y.priceCents)]),
    ).toEqual([["Detersivo piatti", [318]]]);
    expect((await exportUserData(db, bob)).pantry.products).toEqual([]);
  });

  it("contains my training programs with their slots (version 9)", async () => {
    const r = await createProgram(db, alice, {
      name: "Rest only",
      notes: "",
      startDay: "2026-10-01",
      active: true,
      slots: [{ label: "Rest", items: [] }],
    });
    if (!r.ok) throw new Error("setup failed");
    const data = await exportUserData(db, alice);
    expect(data.version).toBe(EXPORT_VERSION);
    expect(
      data.training.programs.map((x) => [x.name, x.slots.map((y) => y.label)]),
    ).toEqual([["Rest only", ["Rest"]]]);
    expect((await exportUserData(db, bob)).training.programs).toEqual([]);
  });

  it("contains my closed days (version 15), nobody else's", async () => {
    await setDayClosure(db, alice, "2026-10-08", "partial");
    await setDayClosure(db, alice, "2026-10-09", "complete");
    await setDayClosure(db, bob, "2026-10-08", "complete");
    const data = await exportUserData(db, alice);
    expect(data.version).toBeGreaterThanOrEqual(15);
    expect(data.dayClosures.map((x) => [x.day, x.state])).toEqual([
      ["2026-10-08", "partial"],
      ["2026-10-09", "complete"],
    ]);
    expect(JSON.stringify(data.dayClosures)).not.toContain("userId");
  });

  it("contains my goals and week check-ins (version 16), nobody else's", async () => {
    const goal = {
      ratePctWeek: "-0.50",
      targetKg: null,
      kcalFloor: "standard",
      protein: "high",
      split: "balanced",
      checkInWeekday: 1,
    } as const;
    await setGoal(db, alice, "2026-10-10", goal);
    await setGoal(db, bob, "2026-10-01", { ...goal, ratePctWeek: "0.25" });
    await recordWeekCheckin(db, alice, { startDay: "2026-10-12", decision: "skipped" });
    const data = await exportUserData(db, alice);
    expect(data.version).toBeGreaterThanOrEqual(16);
    expect(data.goals.map((x) => [x.sinceDay, x.ratePctWeek])).toEqual([
      ["2026-10-10", "-0.50"],
    ]);
    expect(data.weekCheckins.map((x) => [x.startDay, x.decision, x.kcal])).toEqual([
      ["2026-10-12", "skipped", null],
    ]);
    expect(JSON.stringify([data.goals, data.weekCheckins])).not.toContain("userId");
  });

  it("contains my accepted calibration factors (version 17), nobody else's", async () => {
    await setEnergyCorrection(db, alice, 1.04, "2026-09-20");
    await setEnergyCorrection(db, alice, 1.07, "2026-10-10");
    await setEnergyCorrection(db, bob, 0.95, "2026-10-01");
    const data = await exportUserData(db, alice);
    expect(data.version).toBeGreaterThanOrEqual(17);
    expect(data.energyCorrections.map((x) => [x.sinceDay, x.factor])).toEqual([
      ["2026-09-20", "1.04"],
      ["2026-10-10", "1.07"],
    ]);
    expect(JSON.stringify(data.energyCorrections)).not.toContain("userId");
  });

  it("contains each day type's program (version 18), nobody else's", async () => {
    const blank = {
      kcal: "2500",
      protein: null,
      carbs: null,
      sugars: null,
      fat: null,
      saturatedFat: null,
      fiber: null,
      salt: null,
    };
    const gym = await createProfile(db, alice, { name: "Gym", ...blank });
    const rest = await createProfile(db, alice, { name: "Rest", ...blank });
    const bobs = await createProfile(db, bob, { name: "Gym", ...blank });
    if (!gym.ok || !rest.ok || !bobs.ok) throw new Error("setup");
    await saveProgram(db, alice, gym.value.id, STARTERS.gymEvening);
    await saveProgram(db, bob, bobs.value.id, STARTERS.rest);
    const data = await exportUserData(db, alice);
    expect(data.version).toBe(18);
    const byName = new Map(data.dayProfiles.map((p) => [p.name, p.program]));
    expect(byName.get("Rest")).toBeNull();
    expect(byName.get("Gym")?.trainingAt).toBe(18 * 60);
    expect(byName.get("Gym")?.slots.map((s) => s.kind)).toEqual(
      STARTERS.gymEvening.slots.map((s) => s.kind),
    );
    expect(JSON.stringify(data.dayProfiles)).not.toContain("userId");
  });
});
