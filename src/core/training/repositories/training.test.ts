/**
 * Tests for the training repositories (ADR-0005), on real Postgres (PGlite)
 * with the real migrations: sessions with typed sets, per-kind rules,
 * routines, merging exercises, last sets, measurements — and cross-user
 * isolation everywhere, including the composite keys in the database.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import { sessionExercises, sets } from "../../db/schema";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import type { ExerciseInput, SessionInput } from "../validation";
import {
  createExercise,
  deleteExercise,
  listExercises,
  mergeExercises,
} from "./exercises";
import { addMeasurement, weightOn } from "./measurements";
import { createRoutine, listRoutines } from "./routines";
import {
  createSession,
  getSession,
  lastSets,
  listSessions,
  updateSession,
} from "./sessions";

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

const exercise = (
  name: string,
  kind: ExerciseInput["kind"] = "strength",
): ExerciseInput => ({
  name,
  kind,
  muscleGroups: [],
  equipment: null,
  unilateral: false,
  notes: "",
});
const set = (v: Partial<SessionInput["exercises"][number]["sets"][number]>) => ({
  reps: null,
  loadKg: null,
  loadText: null,
  loadApprox: false,
  durationS: null,
  distanceM: null,
  speedKmh: null,
  inclinePct: null,
  restS: null,
  warmup: false,
  ...v,
});
const session = (
  day: string,
  items: SessionInput["exercises"],
  v: Partial<SessionInput> = {},
): SessionInput => ({
  day,
  label: "PULL",
  status: "done",
  time: "11:27",
  durationMin: 60,
  notes: "",
  routineId: null,
  exercises: items,
  ...v,
});

async function mine(name: string, kind?: ExerciseInput["kind"]) {
  const r = await createExercise(db, me, exercise(name, kind));
  if (!r.ok) throw new Error("setup failed");
  return r.value.id;
}

describe("training sessions", () => {
  it("saves typed sets, reads them back in order, and replaces them on update", async () => {
    const lat = await mine("Lat pulldown");
    const legs = await mine("Hanging leg raises", "bodyweight");
    const r = await createSession(
      db,
      me,
      session("2026-09-28", [
        {
          exerciseId: lat,
          restS: 80,
          notes: "",
          sets: [set({ reps: 10, loadKg: "40" }), set({ reps: 9, loadKg: "40" })],
        },
        { exerciseId: legs, restS: null, notes: "", sets: [set({ reps: 8 })] },
      ]),
      "Europe/Rome",
    );
    if (!r.ok) throw new Error(JSON.stringify(r.errors));
    const s = await getSession(db, me, r.value.id);
    expect(s?.startedAt).toBe("2026-09-28T09:27:00.000Z"); // 11:27 in Rome
    expect(
      s?.exercises.map((e) => [e.name, e.kind, e.sets.map((x) => [x.reps, x.loadKg])]),
    ).toEqual([
      [
        "Lat pulldown",
        "strength",
        [
          [10, "40.00"],
          [9, "40.00"],
        ],
      ],
      ["Hanging leg raises", "bodyweight", [[8, null]]],
    ]);

    await updateSession(
      db,
      me,
      r.value.id,
      session("2026-09-28", [
        {
          exerciseId: lat,
          restS: null,
          notes: "",
          sets: [set({ reps: 12, loadKg: "35" })],
        },
      ]),
      "Europe/Rome",
    );
    expect(
      (await getSession(db, me, r.value.id))?.exercises.map((e) => e.sets.length),
    ).toEqual([1]);
  });

  it("applies the per-kind rules and refuses another user's exercise or routine", async () => {
    const lat = await mine("Lat pulldown");
    const bad = await createSession(
      db,
      me,
      session("2026-09-28", [
        { exerciseId: lat, restS: null, notes: "", sets: [set({ reps: 10 })] },
      ]),
      "UTC",
    );
    expect(bad).toEqual({
      ok: false,
      errors: { "exercises.0.sets.0.loadKg": "required" },
    });

    const theirs = await createExercise(db, other, exercise("Loro"));
    if (!theirs.ok) throw new Error("setup failed");
    const foreign = await createSession(
      db,
      me,
      session("2026-09-28", [
        { exerciseId: theirs.value.id, restS: null, notes: "", sets: [] },
      ]),
      "UTC",
    );
    expect(foreign).toEqual({
      ok: false,
      errors: { "exercises.0.exerciseId": "not_found" },
    });

    const theirRoutine = await createRoutine(db, other, {
      name: "R",
      notes: "",
      items: [],
    });
    if (!theirRoutine.ok) throw new Error("setup failed");
    const r = await createSession(
      db,
      me,
      session("2026-09-28", [], { routineId: theirRoutine.value.id }),
      "UTC",
    );
    expect(r).toEqual({ ok: false, errors: { routineId: "not_found" } });
  });

  it("finds the last done sets of each exercise, before a day", async () => {
    const lat = await mine("Lat pulldown");
    for (const [day, load, status] of [
      ["2026-09-15", "40", "done"],
      ["2026-09-21", "42.5", "done"],
      ["2026-09-29", "45", "planned"],
    ] as const)
      await createSession(
        db,
        me,
        session(
          day,
          [
            {
              exerciseId: lat,
              restS: null,
              notes: "",
              sets: [set({ reps: 10, loadKg: load })],
            },
          ],
          { status },
        ),
        "UTC",
      );
    const last = await lastSets(db, me, [lat]);
    expect([last.get(lat)?.day, last.get(lat)?.sets[0]?.loadKg]).toEqual([
      "2026-09-21",
      "42.50",
    ]);
    expect((await lastSets(db, me, [lat], "2026-09-20")).get(lat)?.day).toBe(
      "2026-09-15",
    );
  });

  it("merges a duplicate exercise, moving its history; refuses deleting one in use", async () => {
    const a = await mine("Peck back");
    const b = await mine("Pec deck");
    await createSession(
      db,
      me,
      session("2026-09-11", [
        {
          exerciseId: a,
          restS: null,
          notes: "",
          sets: [set({ reps: 10, loadKg: "35" })],
        },
      ]),
      "UTC",
    );
    expect(await deleteExercise(db, me, a)).toEqual({
      ok: false,
      errors: { _form: "in_use" },
    });
    expect((await mergeExercises(db, me, a, b)).ok).toBe(true);
    expect((await listExercises(db, me)).map((e) => e.name)).toEqual(["Pec deck"]);
    const [s] = await listSessions(db, me, "2026-09-01", "2026-09-30");
    expect(s?.exercises[0]?.name).toBe("Pec deck");
  });

  it("keeps routines, measurements and sessions per user; the database refuses cross-user links", async () => {
    const lat = await mine("Lat pulldown");
    await createRoutine(db, me, {
      name: "PULL",
      notes: "",
      items: [
        { exerciseId: lat, sets: 3, reps: 10, loadKg: "40", durationS: null, restS: 80 },
      ],
    });
    await addMeasurement(db, me, {
      day: "2026-05-31",
      weightKg: "76",
      bodyFatPct: "15.1",
      waistCm: null,
      notes: "",
    });
    await addMeasurement(db, me, {
      day: "2026-09-20",
      weightKg: "74.5",
      bodyFatPct: null,
      waistCm: null,
      notes: "",
    });
    const r = await createSession(
      db,
      me,
      session("2026-09-28", [
        {
          exerciseId: lat,
          restS: null,
          notes: "",
          sets: [set({ reps: 10, loadKg: "40" })],
        },
      ]),
      "UTC",
    );
    if (!r.ok) throw new Error("setup failed");

    expect(
      (await listRoutines(db, me))[0]?.items.map((i) => [i.name, i.sets, i.loadKg]),
    ).toEqual([["Lat pulldown", 3, "40.00"]]);
    expect(await weightOn(db, me, "2026-09-28")).toBe("74.50");
    expect(await weightOn(db, me, "2026-06-01")).toBe("76.00");

    // CROSS-USER: the other user sees none of it.
    expect(await listExercises(db, other)).toEqual([]);
    expect(await listRoutines(db, other)).toEqual([]);
    expect(await listSessions(db, other, "2026-01-01", "2026-12-31")).toEqual([]);
    expect(await weightOn(db, other, "2026-09-28")).toBeNull();
    expect(await getSession(db, other, r.value.id)).toBeNull();

    // DEFENCE IN DEPTH: even a raw insert can't attach my exercise to their data.
    const [item] = await db.select().from(sessionExercises);
    await expect(
      db
        .insert(sets)
        .values({ userId: other.id, sessionExerciseId: item!.id, position: 9, reps: 1 }),
    ).rejects.toThrow();
  });
});
