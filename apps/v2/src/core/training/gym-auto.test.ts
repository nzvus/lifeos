import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { readEntry } from "../entries";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import {
  checkSet,
  confirmSets,
  finishSession,
  readExercises,
  readTrainingHistory,
  saveExerciseSettings,
  saveSet,
  setReadiness,
  startSession,
} from "./index";

const set = (reps: string, kg: string) => {
  const c = checkSet({ reps, loadKg: kg, rir: "", durationS: "", warmup: false });
  if (!c.ok) throw new Error(c.error);
  return c.set;
};

describe("auto mode, timing, readiness and an exercise's own settings", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  let bench: string;

  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
    bench = (
      await db
        .insert(s.catalogItems)
        .values({ userId: a.id, catalog: "exercise", name: "Panca piana" })
        .returning({ id: s.catalogItems.id })
    )[0]!.id;
  });
  afterAll(() => close());

  it("keeps a set's start when it is before the end; assumed sets wait for «Fine»", async () => {
    const t = new Date("2026-10-20T07:00:00Z");
    const sid = await startSession(db, a, {
      day: "2026-10-20",
      startAt: t,
      routineId: null,
      exerciseIds: [bench],
    });
    const ex = (await readEntry(db, a, sid))!.children[0]!.id;
    const at = (sec: number) => new Date(t.getTime() + sec * 1000);
    expect(
      await saveSet(db, a, ex, 0, set("10", "60"), at(40), { startedAt: at(0) }),
    ).toBe(true);
    // A start after the end is not kept.
    expect(
      await saveSet(db, a, ex, 1, set("9", "60"), at(160), {
        startedAt: at(200),
        assumed: true,
      }),
    ).toBe(true);
    const rows = (await readEntry(db, a, sid))!.children[0]!.sets;
    expect(rows.map((r) => [r.startedAt?.toISOString() ?? null, r.done])).toEqual([
      [at(0).toISOString(), true],
      [null, false],
    ]);
    await finishSession(db, a, sid, at(600));
    // History reads done sets only: the assumed one is not there until confirmed.
    const h1 = await readTrainingHistory(
      db,
      a,
      [bench],
      "00000000-0000-0000-0000-000000000000",
      "2026-10-21",
    );
    expect(h1.byExercise.get(bench)![0]!.sets.map((x) => x.reps)).toEqual([10]);
    expect(await confirmSets(db, b, sid)).toBe(0);
    expect(await confirmSets(db, a, sid)).toBe(1);
    const h2 = await readTrainingHistory(
      db,
      a,
      [bench],
      "00000000-0000-0000-0000-000000000000",
      "2026-10-21",
    );
    expect(h2.byExercise.get(bench)![0]!.sets.map((x) => x.reps)).toEqual([10, 9]);
    expect(h2.sessions[0]![0]![0]!.startedAt).toBe(at(0).getTime());
  });

  it("stores readiness 1–5 on the session, the owner's only", async () => {
    const sid = await startSession(db, a, {
      day: "2026-10-22",
      startAt: new Date("2026-10-22T07:00:00Z"),
      routineId: null,
      exerciseIds: [],
    });
    expect(await setReadiness(db, b, sid, 3)).toBe(false);
    expect(await setReadiness(db, a, sid, 6)).toBe(false);
    expect(await setReadiness(db, a, sid, 2)).toBe(true);
    expect(Number((await readEntry(db, a, sid))!.values["readiness"])).toBe(2);
    expect(await setReadiness(db, a, sid, null)).toBe(true);
    expect((await readEntry(db, a, sid))!.values["readiness"]).toBeUndefined();
  });

  it("an exercise's own rest and setup: set, read back, cleared; bounds and owner checked", async () => {
    expect(await saveExerciseSettings(db, b, bench, { restS: 90, setupS: 5 })).toBe(
      false,
    );
    expect(await saveExerciseSettings(db, a, bench, { restS: 900, setupS: 5 })).toBe(
      false,
    );
    expect(await saveExerciseSettings(db, a, bench, { restS: 90, setupS: 8 })).toBe(true);
    expect((await readExercises(db, a))[0]).toMatchObject({ restS: 90, setupS: 8 });
    expect(await saveExerciseSettings(db, a, bench, { restS: null, setupS: 8 })).toBe(
      true,
    );
    expect((await readExercises(db, a))[0]).toMatchObject({ restS: null, setupS: 8 });
  });
});
