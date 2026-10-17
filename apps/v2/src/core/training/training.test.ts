import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { readEntry } from "../entries";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import {
  addExercise,
  checkSet,
  finishSession,
  readExercises,
  readHistory,
  readRoutines,
  removeSet,
  saveSet,
  startSession,
} from "./index";

const typed = (reps: string, loadKg = "", rir = "", durationS = "") => ({
  reps,
  loadKg,
  rir,
  durationS,
  warmup: false,
});

describe("a set typed in the gym", () => {
  it("keeps the load exact with a comma, and needs reps or a time", () => {
    expect(checkSet(typed("8", "62,5", "2"))).toEqual({
      ok: true,
      set: { reps: 8, loadKg: "62.5", rir: 2, durationS: null, warmup: false },
    });
    expect(checkSet(typed("", "", "", "45"))).toMatchObject({
      ok: true,
      set: { durationS: 45 },
    });
    expect(checkSet(typed(""))).toEqual({ ok: false, error: "empty" });
    expect(checkSet(typed("8,5"))).toEqual({ ok: false, error: "reps" });
    expect(checkSet(typed("8", "2000"))).toEqual({ ok: false, error: "loadKg" });
    expect(checkSet(typed("8", "60", "11"))).toEqual({ ok: false, error: "rir" });
  });
});

describe("a session in gym mode", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  let bench: string;
  let curl: string;
  let push: string;

  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
    const item = async (catalog: string, name: string) =>
      (
        await db
          .insert(s.catalogItems)
          .values({ userId: a.id, catalog, name })
          .returning({ id: s.catalogItems.id })
      )[0]!.id;
    bench = await item("exercise", "Panca piana");
    curl = await item("exercise", "Curl con manubri");
    push = await item("routine", "Push");
    await db.insert(s.catalogValues).values([
      { userId: a.id, itemId: bench, field: "pattern", text: "horizontal_press" },
      { userId: a.id, itemId: curl, field: "equipment", text: "manubri" },
    ]);
    await db.insert(s.catalogParts).values([
      { userId: a.id, itemId: push, position: 0, partItemId: bench },
      { userId: a.id, itemId: push, position: 1, partItemId: curl },
    ]);
  });
  afterAll(() => close());

  it("reads the routines with their exercises, and the exercises with their pattern", async () => {
    const exercises = await readExercises(db, a);
    expect(exercises.map((e) => [e.name, e.pattern, e.equipment])).toEqual([
      ["Curl con manubri", null, "manubri"],
      ["Panca piana", "horizontal_press", null],
    ]);
    expect(await readRoutines(db, a, "2026-10-17", exercises)).toEqual([
      {
        id: push,
        name: "Push",
        uses: 0,
        exercises: [
          { exerciseId: bench, name: "Panca piana" },
          { exerciseId: curl, name: "Curl con manubri" },
        ],
      },
    ]);
    expect(await readExercises(db, b)).toEqual([]);
  });

  it("starts, saves each set as ticked, adds an exercise, and finishes with its minutes", async () => {
    const start = new Date("2026-10-16T16:00:00Z");
    const id = await startSession(db, a, {
      day: "2026-10-16",
      startAt: start,
      routineId: push,
      exerciseIds: [bench],
    });
    const x = (await readEntry(db, a, id))!.children[0]!;
    const first = checkSet(typed("8", "60", "2"));
    if (!first.ok) throw new Error("expected a valid set");
    expect(await saveSet(db, a, x.id, 0, first.set, start)).toBe(true);
    // ticked again with a correction: the same position is replaced
    expect(
      await saveSet(
        db,
        a,
        x.id,
        0,
        { reps: 9, loadKg: "60", rir: 1, durationS: null, warmup: false },
        start,
      ),
    ).toBe(true);
    await saveSet(
      db,
      a,
      x.id,
      1,
      { reps: 8, loadKg: "60", rir: 1, durationS: null, warmup: false },
      start,
    );
    expect(await removeSet(db, a, x.id, 1)).toBe(true);
    expect(await addExercise(db, a, id, curl)).not.toBeNull();
    expect(
      await saveSet(
        db,
        b,
        x.id,
        2,
        { reps: 1, loadKg: null, rir: null, durationS: null, warmup: false },
        start,
      ),
    ).toBe(false);
    expect(await finishSession(db, b, id, new Date("2026-10-16T17:00:00Z"))).toBe(false);
    expect(await finishSession(db, a, id, new Date("2026-10-16T16:52:00Z"))).toBe(true);

    const done = (await readEntry(db, a, id))!;
    expect(done).toMatchObject({ status: "done", values: { durationMin: "52.0000" } });
    expect(done.item?.name).toBe("Push");
    expect(
      done.children.map((c) => [
        c.item?.name,
        c.status,
        c.sets.map((t) => [t.reps, t.loadKg, t.rir]),
      ]),
    ).toEqual([
      ["Panca piana", "done", [[9, "60.00", 1]]],
      ["Curl con manubri", "done", []],
    ]);
  });

  it("gives each exercise its last two sessions, leaving out the one being trained", async () => {
    const next = await startSession(db, a, {
      day: "2026-10-18",
      startAt: new Date("2026-10-18T16:00:00Z"),
      routineId: push,
      exerciseIds: [bench],
    });
    const h = await readHistory(db, a, [bench, curl], next);
    expect(h.get(bench)).toEqual({
      last: [{ reps: 9, loadKg: "60.00", durationS: null, warmup: false, rir: 1 }],
      before: [],
      lastDay: "2026-10-16",
    });
    expect((await readHistory(db, b, [bench], next)).size).toBe(0);
  });
});
