import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { loadDay } from "../day";
import { readEntry, restoreEntry, trashEntry, trashPlanned } from "../entries";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import {
  addExercise,
  checkSet,
  createExercise,
  finishSession,
  reopenSession,
  readExercises,
  readHistory,
  readRoutines,
  readWeekWork,
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
      set: {
        reps: 8,
        loadKg: "62.5",
        loadEntry: "total",
        rir: 2,
        durationS: null,
        warmup: false,
      },
    });
    expect(checkSet({ ...typed("10", "12,5"), perDumbbell: true })).toMatchObject({
      ok: true,
      set: { loadKg: "25", loadEntry: "per_dumbbell" },
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
        {
          reps: 9,
          loadKg: "60",
          rir: 1,
          durationS: null,
          warmup: false,
          loadEntry: "total",
        },
        start,
      ),
    ).toBe(true);
    await saveSet(
      db,
      a,
      x.id,
      1,
      {
        reps: 8,
        loadKg: "60",
        rir: 1,
        durationS: null,
        warmup: false,
        loadEntry: "total",
      },
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
        {
          reps: 1,
          loadKg: null,
          rir: null,
          durationS: null,
          warmup: false,
          loadEntry: "total",
        },
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
      ["Curl con manubri", "skipped", []],
    ]);
  });

  it("reopens a finished session: in progress again, no end, no minutes", async () => {
    const id = await startSession(db, a, {
      day: "2026-10-17",
      startAt: new Date("2026-10-17T16:00:00Z"),
      routineId: push,
      exerciseIds: [bench],
    });
    expect(await reopenSession(db, a, id)).toBe(false); // not finished yet
    await finishSession(db, a, id, new Date("2026-10-17T16:30:00Z"));
    expect(await reopenSession(db, b, id)).toBe(false);
    expect(await reopenSession(db, a, id)).toBe(true);
    const open = (await readEntry(db, a, id))!;
    expect(open.status).toBe("planned");
    const [row] = await db.select().from(s.entries).where(eq(s.entries.id, id));
    expect(row!.endAt).toBeNull();
    expect(open.values.durationMin).toBeUndefined();
    expect(open.children.map((c) => c.status)).toEqual(["planned"]);
  });

  it("takes a session's exercises to the trash with it, and brings them back", async () => {
    const id = await startSession(db, a, {
      day: "2026-10-19",
      startAt: new Date("2026-10-19T16:00:00Z"),
      routineId: push,
      exerciseIds: [bench, curl],
    });
    const live = async () =>
      (
        await db
          .select({ id: s.entries.id })
          .from(s.entries)
          .where(eq(s.entries.parentId, id))
      ).length;
    const trashed = async () =>
      (
        await db
          .select({ d: s.entries.deletedAt })
          .from(s.entries)
          .where(eq(s.entries.parentId, id))
      ).filter((r) => r.d !== null).length;
    expect(await live()).toBe(2);
    expect(await trashEntry(db, a, id)).toBe(true);
    expect(await trashed()).toBe(2);
    expect(await restoreEntry(db, a, id)).toBe(true);
    expect(await trashed()).toBe(0);
    // A planned session removed by «Togli i previsti» takes its exercises too.
    expect(await trashPlanned(db, a, [id])).toEqual([id]);
    expect(await trashed()).toBe(2);
    // Orphans left by the old trash (parent gone, children live) are not on the day.
    await db.update(s.entries).set({ deletedAt: null }).where(eq(s.entries.parentId, id));
    const day = await loadDay(db, a, "2026-10-19");
    expect([...day.timed, ...day.untimed].map((i) => i.kind.key)).not.toContain(
      "session_exercise",
    );
  });

  it("counts the week's working sets per exercise, for «cosa aggiungere»", async () => {
    const week = await readWeekWork(db, a, "2026-10-19");
    expect(week.find((w) => w.exerciseId === bench)?.sets).toBe(1);
    // A week later the bench is still known (28 days), with no sets this week.
    expect(
      (await readWeekWork(db, a, "2026-10-26")).find((w) => w.exerciseId === bench),
    ).toEqual({
      exerciseId: bench,
      sets: 0,
    });
    expect(await readWeekWork(db, b, "2026-10-19")).toEqual([]);
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

  it("creates an exercise gym mode can read, unless the name is taken", async () => {
    const made = await createExercise(db, a, "Alzate laterali ai cavi", {
      pattern: "lateral_raise",
      equipment: "cable",
      unilateral: true,
    });
    expect(made).not.toBe("taken");
    expect(
      await createExercise(db, a, "alzate laterali ai cavi", {
        pattern: null,
        equipment: null,
        unilateral: false,
      }),
    ).toBe("taken");
    expect(
      (await readExercises(db, a)).find((e) => e.name === "Alzate laterali ai cavi"),
    ).toMatchObject({
      pattern: "lateral_raise",
      equipment: "cable",
      unilateral: true,
    });
  });
});
