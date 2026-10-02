/**
 * Tests for the training repositories (ADR-0005), on real Postgres (PGlite)
 * with the real migrations: sessions with typed sets, per-kind rules,
 * routines, merging exercises, last sets, measurements — and cross-user
 * isolation everywhere, including the composite keys in the database.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import { sessionExercises, sets, weighInContext } from "../../db/schema";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import type { ExerciseInput, SessionInput } from "../validation";
import {
  createExercise,
  deleteExercise,
  restoreExercise,
  listExercises,
  mergeExercises,
} from "./exercises";
import {
  addMeasurement,
  deleteMeasurement,
  listMeasurements,
  restoreMeasurement,
  weightOn,
} from "./measurements";
import { createRoutine, deleteRoutine, listRoutines, restoreRoutine } from "./routines";
import {
  createSession,
  deleteSession,
  getSession,
  lastSets,
  listSessions,
  restoreSession,
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
  pattern: null,
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

  it("a planned session's sets are not done until ticked; a done session's are", async () => {
    const bike = await mine("Bike", "cardio");
    const sets20 = (v: Partial<ReturnType<typeof set>> & { done?: boolean } = {}) => [
      {
        exerciseId: bike,
        restS: null,
        notes: "",
        sets: [set({ durationS: 1200, ...v })],
      },
    ];
    const ticks = async (id: string) =>
      (await getSession(db, me, id))?.exercises.flatMap((e) => e.sets.map((x) => x.done));

    // The editor sends no tick: the set follows the session.
    const planned = await createSession(
      db,
      me,
      session("2026-09-28", sets20(), { status: "planned" }),
      "Europe/Rome",
    );
    const done = await createSession(
      db,
      me,
      session("2026-09-28", sets20()),
      "Europe/Rome",
    );
    if (!planned.ok || !done.ok) throw new Error("setup failed");
    expect(await ticks(planned.value.id)).toEqual([false]);
    expect(await ticks(done.value.id)).toEqual([true]);

    // A tick from gym mode is kept as it is.
    await updateSession(
      db,
      me,
      planned.value.id,
      session("2026-09-28", sets20({ done: true }), { status: "planned" }),
      "Europe/Rome",
    );
    expect(await ticks(planned.value.id)).toEqual([true]);
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

describe("training records in the trash (ADR-0015)", () => {
  it("an unused exercise goes to the trash and comes back; a used one is refused", async () => {
    const lat = await mine("Lat pulldown");
    const row = await mine("Pulley row");
    await createRoutine(db, me, {
      name: "Pull",
      notes: "",
      items: [
        {
          exerciseId: row,
          sets: 3,
          reps: 10,
          loadKg: "40",
          durationS: null,
          restS: null,
        },
      ],
    });
    expect(await deleteExercise(db, me, row)).toEqual({
      ok: false,
      errors: { _form: "in_use" },
    });
    expect((await deleteExercise(db, me, lat)).ok).toBe(true);
    expect((await listExercises(db, me)).map((e) => e.name)).toEqual(["Pulley row"]);
    expect((await restoreExercise(db, other, lat)).ok).toBe(false);
    expect((await restoreExercise(db, me, lat)).ok).toBe(true);
    expect((await listExercises(db, me)).map((e) => e.name).sort()).toEqual([
      "Lat pulldown",
      "Pulley row",
    ]);
  });

  it("a routine goes to the trash and comes back; its name is free meanwhile", async () => {
    const r = await createRoutine(db, me, { name: "Pull", notes: "", items: [] });
    if (!r.ok) throw new Error("setup");
    expect((await deleteRoutine(db, me, r.value.id)).ok).toBe(true);
    expect(await listRoutines(db, me)).toEqual([]);
    expect((await createRoutine(db, me, { name: "Pull", notes: "", items: [] })).ok).toBe(
      true,
    );
    expect(await restoreRoutine(db, me, r.value.id)).toEqual({
      ok: false,
      errors: { _form: "duplicate_name" },
    });
  });
});

describe("estimated sessions (ADR-0016)", () => {
  it("are saved without exercises and read back with their estimate", async () => {
    const r = await createSession(
      db,
      me,
      session("2026-10-01", [], {
        label: "Calcetto",
        durationMin: 90,
        intensity: "vigorous",
        kcalEstimate: null,
        muscleGroups: ["quads", "calves"],
      }),
      "Europe/Rome",
    );
    if (!r.ok) throw new Error("setup");
    const [s] = await listSessions(db, me, "2026-10-01", "2026-10-01");
    expect([
      s?.label,
      s?.exercises,
      s?.intensity,
      s?.kcalEstimate,
      s?.muscleGroups,
    ]).toEqual(["Calcetto", [], "vigorous", null, ["quads", "calves"]]);
  });
});

describe("sessions in the trash (ADR-0015)", () => {
  it("leave lists, lookups and 'last time', and come back", async () => {
    const lat = await mine("Lat pulldown");
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
      "Europe/Rome",
    );
    if (!r.ok) throw new Error("setup");
    expect((await deleteSession(db, me, r.value.id)).ok).toBe(true);
    expect(await listSessions(db, me, "2026-09-01", "2026-09-30")).toEqual([]);
    expect(await getSession(db, me, r.value.id)).toBeNull();
    expect((await lastSets(db, me, [lat])).size).toBe(0);
    expect((await restoreSession(db, other, r.value.id)).ok).toBe(false);
    expect((await restoreSession(db, me, r.value.id)).ok).toBe(true);
    expect((await lastSets(db, me, [lat])).get(lat)?.day).toBe("2026-09-28");
  });
});

describe("measurements in the trash (ADR-0015)", () => {
  it("leave the list and the burn weight; Undo brings them back", async () => {
    const m = (day: string, weightKg: string) =>
      addMeasurement(db, me, {
        day,
        weightKg,
        bodyFatPct: null,
        waistCm: null,
        notes: "",
      });
    await m("2026-09-01", "76");
    const r = await m("2026-09-20", "74.5");
    if (!r.ok) throw new Error("setup");
    const id = r.value.id;

    expect((await deleteMeasurement(db, me, id)).ok).toBe(true);
    expect((await listMeasurements(db, me)).map((x) => x.day)).toEqual(["2026-09-01"]);
    expect(await weightOn(db, me, "2026-09-28")).toBe("76.00"); // the older one again
    expect((await deleteMeasurement(db, me, id)).ok).toBe(false);

    // CROSS-USER: someone else can't restore it.
    expect((await restoreMeasurement(db, other, id)).ok).toBe(false);
    expect((await restoreMeasurement(db, me, id)).ok).toBe(true);
    expect(await weightOn(db, me, "2026-09-28")).toBe("74.50");
  });
});

describe("how a weigh-in was taken (ADR-0027)", () => {
  const weighIn = {
    day: "2026-10-02",
    weightKg: "76.4",
    bodyFatPct: null,
    waistCm: null,
    notes: "",
  };

  it("is saved with the weigh-in, its time in the user's zone; absent = not said", async () => {
    const tagged = await addMeasurement(
      db,
      me,
      {
        ...weighIn,
        context: { time: "07:15", fasted: true, afterToilet: true, afterTraining: false },
      },
      "Europe/Rome",
    );
    await addMeasurement(db, me, { ...weighIn, day: "2026-10-01" });
    if (!tagged.ok) throw new Error("setup failed");

    const list = await listMeasurements(db, me);
    expect(list.map((m) => [m.day, m.context])).toEqual([
      ["2026-10-01", null],
      [
        "2026-10-02",
        {
          measurementId: tagged.value.id,
          measuredAt: new Date("2026-10-02T05:15:00.000Z"), // 07:15 in Rome
          fasted: true,
          afterToilet: true,
          afterTraining: false,
        },
      ],
    ]);
  });

  it("can't hang on another user's weigh-in (the database refuses it)", async () => {
    const theirs = await addMeasurement(db, other, weighIn);
    if (!theirs.ok) throw new Error("setup failed");
    await expect(
      db.insert(weighInContext).values({ measurementId: theirs.value.id, userId: me.id }),
    ).rejects.toThrow();
    expect((await listMeasurements(db, me)).length).toBe(0);
  });
});
