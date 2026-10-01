/**
 * Tests for day profiles and day plans (ADR-0008), on real Postgres (PGlite):
 * default rules, the three sources of a day's targets, the snapshot that
 * keeps past days stable, and cross-user isolation.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser, ingredientFixture } from "../../testing/test-db";
import type { ProfileInput } from "../validation";
import { createIngredient } from "./ingredients";
import { logIngredient } from "./log";
import {
  createProfile,
  deleteProfile,
  getDayTargets,
  listProfiles,
  setDayProfile,
  setDefaultProfile,
  updateProfile,
  restoreProfile,
} from "./profiles";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;

/** A profile input: a name and a kcal target, other targets empty. */
function profile(name: string, kcal: string | null): ProfileInput {
  return {
    name,
    kcal,
    protein: "150",
    carbs: null,
    sugars: null,
    fat: null,
    saturatedFat: null,
    fiber: null,
    salt: null,
  };
}

async function make(owner: Owner, name: string, kcal: string) {
  const r = await createProfile(db, owner, profile(name, kcal));
  if (!r.ok) throw new Error("setup failed");
  return r.value;
}

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
});
afterEach(() => close());

const DAY = "2026-09-30";

describe("profiles", () => {
  it("the first profile becomes the default; later ones don't", async () => {
    await make(me, "Palestra", "2600");
    await make(me, "Riposo", "2200");
    expect((await listProfiles(db, me)).map((p) => [p.name, p.isDefault])).toEqual([
      ["Palestra", true], // default first
      ["Riposo", false],
    ]);
  });

  it("switching the default leaves exactly one default", async () => {
    await make(me, "Palestra", "2600");
    const rest = await make(me, "Riposo", "2200");
    expect((await setDefaultProfile(db, me, rest.id)).ok).toBe(true);
    const defaults = (await listProfiles(db, me)).filter((p) => p.isDefault);
    expect(defaults.map((p) => p.name)).toEqual(["Riposo"]);
  });

  it("refuses to delete the default, allows deleting the others", async () => {
    const gym = await make(me, "Palestra", "2600");
    const rest = await make(me, "Riposo", "2200");
    expect(await deleteProfile(db, me, gym.id)).toEqual({
      ok: false,
      errors: { _form: "is_default" },
    });
    expect((await deleteProfile(db, me, rest.id)).ok).toBe(true);
  });

  it("reports duplicate names", async () => {
    await make(me, "Palestra", "2600");
    expect(await createProfile(db, me, profile("Palestra", "1"))).toEqual({
      ok: false,
      errors: { name: "duplicate_name" },
    });
  });
});

describe("a day's targets", () => {
  it("none -> default (live) -> fixed on first food", async () => {
    expect(await getDayTargets(db, me, DAY)).toEqual({ source: "none" });

    const gym = await make(me, "Palestra", "2600");
    expect(await getDayTargets(db, me, DAY)).toMatchObject({
      source: "default",
      name: "Palestra",
    });

    // Editing the default before any food: the day follows it (still live).
    await updateProfile(db, me, gym.id, profile("Palestra", "2700"));
    expect(
      (await getDayTargets(db, me, DAY)) as { targets: { kcal: string } },
    ).toMatchObject({
      targets: { kcal: "2700.000" },
    });

    // First food of the day fixes it.
    const ing = await createIngredient(db, me, ingredientFixture());
    if (!ing.ok) throw new Error("setup failed");
    await logIngredient(db, me, { day: DAY, ingredientId: ing.value.id, quantity: "10" });
    expect(await getDayTargets(db, me, DAY)).toMatchObject({
      source: "fixed",
      name: "Palestra",
      targets: { kcal: "2700.000" },
    });
  });

  it("SNAPSHOT: editing or deleting a profile never changes a fixed day", async () => {
    await make(me, "Riposo", "2200"); // default
    const gym = await make(me, "Palestra", "2600");
    await setDayProfile(db, me, DAY, gym.id);

    await updateProfile(db, me, gym.id, profile("Palestra v2", "9999"));
    await deleteProfile(db, me, gym.id);

    expect(await getDayTargets(db, me, DAY)).toEqual({
      source: "fixed",
      // In the trash the link stays (ADR-0015; a purge sets it to null); the copy is what counts.
      profileId: gym.id,
      name: "Palestra",
      targets: expect.objectContaining({
        kcal: "2600.000",
        protein: "150.000",
        carbs: null,
      }),
    });
  });

  it("choosing the profile again refreshes the copy (the deliberate way)", async () => {
    const gym = await make(me, "Palestra", "2600");
    await setDayProfile(db, me, DAY, gym.id);
    await updateProfile(db, me, gym.id, profile("Palestra", "2800"));
    await setDayProfile(db, me, DAY, gym.id);
    expect(await getDayTargets(db, me, DAY)).toMatchObject({
      targets: { kcal: "2800.000" },
    });
  });
});

describe("CROSS-USER", () => {
  it("another user can't see, change, use or delete my profiles", async () => {
    const mine = await make(me, "Palestra", "2600");

    expect(await listProfiles(db, other)).toEqual([]);
    expect(await getDayTargets(db, other, DAY)).toEqual({ source: "none" });
    expect(await setDayProfile(db, other, DAY, mine.id)).toEqual({
      ok: false,
      errors: { profileId: "not_found" },
    });
    expect((await updateProfile(db, other, mine.id, profile("X", "1"))).ok).toBe(false);
    expect((await setDefaultProfile(db, other, mine.id)).ok).toBe(false);
    expect((await deleteProfile(db, other, mine.id)).ok).toBe(false);
    expect((await listProfiles(db, me))[0]).toMatchObject({
      name: "Palestra",
      isDefault: true,
    });

    // Their first profile is THEIR default: defaults are per user.
    await make(other, "Palestra", "1800");
    expect((await listProfiles(db, other))[0]?.isDefault).toBe(true);
  });
});

describe("day types in the trash (ADR-0015)", () => {
  it("leave the list, can't be the default, and come back", async () => {
    const rest = await make(me, "Riposo", "2200"); // default
    const gym = await make(me, "Palestra", "2600");
    expect(await deleteProfile(db, me, rest.id)).toEqual({
      ok: false,
      errors: { _form: "is_default" },
    });
    expect((await deleteProfile(db, me, gym.id)).ok).toBe(true);
    expect((await listProfiles(db, me)).map((p) => p.name)).toEqual(["Riposo"]);
    expect((await restoreProfile(db, other, gym.id)).ok).toBe(false);
    expect((await restoreProfile(db, me, gym.id)).ok).toBe(true);
    expect((await listProfiles(db, me)).map((p) => p.name).sort()).toEqual([
      "Palestra",
      "Riposo",
    ]);
  });
});
