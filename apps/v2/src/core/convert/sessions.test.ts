import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import { createTestDb, createTestUser } from "../db/test-db";
import { readEntry } from "../entries";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import type { V1Export } from "./context";
import { convert } from "./convert";
import { loadFile } from "./load";
import { existingIds, sessionsSince } from "./sessions";

const fixture = (): V1Export =>
  JSON.parse(
    readFileSync(new URL("./fixtures/v1-everything.json", import.meta.url), "utf8"),
  ) as V1Export;
const NOW = new Date("2026-10-19T12:00:00Z");
const LAT = "9a1f0c1e-0000-4000-8000-000000000001";
const PULL = "9a1f0c1e-0000-4000-8000-000000000002";
const SESSION = "9a1f0c1e-0000-4000-8000-000000000003";
const BENCH = "eb24a179-8aad-4221-a18a-714928acf63e";

/** The same account a few days later: a new exercise, a new routine, a session on 18 Oct. */
function later(): V1Export {
  const v1 = fixture();
  const t = v1.tables;
  const ex = t["exercises"]!.find((e) => e["id"] === BENCH)!;
  t["exercises"]!.push({ ...ex, id: LAT, name: "Lat machine", pattern: "vertical_pull" });
  const r = t["routines"]![0]!;
  t["routines"]!.push({ ...r, id: PULL, name: "Pull" });
  const ri = t["routine_items"]![0]!;
  t["routine_items"]!.push({
    ...ri,
    id: "9a1f0c1e-0000-4000-8000-000000000004",
    routineId: PULL,
    exerciseId: LAT,
  });
  const s = t["training_sessions"]![0]!;
  t["training_sessions"]!.push({ ...s, id: SESSION, day: "2026-10-18", routineId: PULL });
  const x = t["session_exercises"]![0]!;
  const xs = [
    {
      ...x,
      id: "9a1f0c1e-0000-4000-8000-000000000005",
      sessionId: SESSION,
      exerciseId: LAT,
      position: 0,
    },
    {
      ...x,
      id: "9a1f0c1e-0000-4000-8000-000000000006",
      sessionId: SESSION,
      exerciseId: BENCH,
      position: 1,
    },
  ];
  t["session_exercises"]!.push(...xs);
  const set = t["sets"]![0]!;
  t["sets"]!.push(
    {
      ...set,
      id: "9a1f0c1e-0000-4000-8000-000000000007",
      sessionExerciseId: xs[0]!.id,
      position: 0,
      reps: 10,
      loadKg: "50.00",
    },
    {
      ...set,
      id: "9a1f0c1e-0000-4000-8000-000000000008",
      sessionExerciseId: xs[1]!.id,
      position: 0,
      reps: 8,
      loadKg: "62.50",
    },
  );
  return v1;
}

describe("the sessions logged in v1 after the load", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;

  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    await loadFile(db as never, convert(fixture(), NOW), a.id);
  });
  afterAll(() => close());

  it("keeps only the new sessions, with what they name that v2 lacks", async () => {
    const have = await existingIds(db as never, a.id);
    // from before the load: the session v2 already has is not taken again
    const only = sessionsSince(convert(later(), NOW), "2026-10-01", have);
    expect(only.tables.entries.map((e) => [e.kind, e.day])).toEqual([
      ["session", "2026-10-18"],
      ["session_exercise", "2026-10-18"],
      ["session_exercise", "2026-10-18"],
    ]);
    expect(only.tables.training_sets).toHaveLength(2);
    expect(only.tables.catalog_items.map((i) => [i.catalog, i.name]).sort()).toEqual([
      ["exercise", "Lat machine"],
      ["routine", "Pull"],
    ]);
    expect(only.tables.catalog_parts).toHaveLength(1);
    expect(only.tables.entry_lines).toEqual([]);
    expect(only.report.counts.entries).toBe(3);
  });

  it("loads them, and a second run finds nothing new", async () => {
    const file = sessionsSince(
      convert(later(), NOW),
      "2026-10-11",
      await existingIds(db as never, a.id),
    );
    await loadFile(db as never, file, a.id);
    const s = (await readEntry(db, a, SESSION))!;
    expect(s.item?.name).toBe("Pull");
    expect(
      s.children.map((c) => [c.item?.name, c.sets.map((x) => [x.reps, x.loadKg])]),
    ).toEqual([
      ["Lat machine", [[10, "50.00"]]],
      ["Bench press", [[8, "62.50"]]],
    ]);
    const again = sessionsSince(
      convert(later(), NOW),
      "2026-10-11",
      await existingIds(db as never, a.id),
    );
    expect(again.tables.entries).toEqual([]);
    expect(again.tables.catalog_items).toEqual([]);
  });
});
