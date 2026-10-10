/** A day type's program (ADR-0044) against a real Postgres (PGlite). */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { STARTERS } from "../programs";
import { createProfile, deleteProfile } from "./profiles";
import { getProgram, listPrograms, saveProgram } from "./programs";

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
async function profile(owner: Owner, name: string) {
  const p = await createProfile(db, owner, { name, ...blank });
  if (!p.ok) throw new Error("setup");
  return p.value.id;
}

describe("day programs", () => {
  it("saves, replaces and removes a type's program", async () => {
    const gym = await profile(me, "Gym");
    expect(await getProgram(db, me, gym)).toBeNull();

    expect(await saveProgram(db, me, gym, STARTERS.gymEvening)).toEqual({
      ok: true,
      value: null,
    });
    expect(await getProgram(db, me, gym)).toEqual(STARTERS.gymEvening);

    await saveProgram(db, me, gym, { ...STARTERS.rest, shiftKcal: -150 });
    const p = await getProgram(db, me, gym);
    expect(p?.shiftKcal).toBe(-150);
    expect(p?.slots.map((s) => s.kind)).toEqual([
      "breakfast",
      "lunch",
      "snack",
      "dinner",
    ]);

    await saveProgram(db, me, gym, { trainingAt: null, shiftKcal: 0, slots: [] });
    expect(await getProgram(db, me, gym)).toBeNull();
  });

  it("only on my own live day types; another user sees only theirs", async () => {
    const mine = await profile(me, "Gym");
    const theirs = await profile(other, "Gym");
    expect(await saveProgram(db, other, mine, STARTERS.rest)).toEqual({
      ok: false,
      errors: { _form: "not_found" },
    });
    await saveProgram(db, other, theirs, STARTERS.longCardio);
    await saveProgram(db, me, mine, STARTERS.gymMorning);
    expect([...(await listPrograms(db, me)).keys()]).toEqual([mine]);
    expect([...(await listPrograms(db, other)).keys()]).toEqual([theirs]);

    const rest = await profile(me, "Rest"); // the default is "Gym": this one can go
    await deleteProfile(db, me, rest);
    expect(await saveProgram(db, me, rest, STARTERS.rest)).toMatchObject({ ok: false });
  });
});
