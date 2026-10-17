import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import { createTestDb, createTestUser } from "../db/test-db";
import { loadDay } from "../day";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { kindRegistry, type KindInput, kindSchema } from "../kinds";
import { checkEntry, createEntry, enterable, type EntryInput } from "./index";

const reg = kindRegistry();
const rome = { timeZone: "Europe/Rome", boundaryMin: 240 };
const input = (over: Partial<EntryInput> = {}): EntryInput => ({
  day: "2026-10-15",
  status: "done",
  startMin: null,
  endMin: null,
  values: {},
  note: "",
  ...over,
});

describe("an entry typed by hand", () => {
  it("keeps numbers exact, with a decimal comma, and checks the kind's bounds", () => {
    const ok = checkEntry(
      reg.get("weigh_in"),
      input({ startMin: 8 * 60 + 14, values: { weightKg: "75,6", fasted: "true" } }),
      rome,
    );
    expect(ok).toEqual({
      ok: true,
      entry: {
        kind: "weigh_in",
        day: "2026-10-15",
        status: "done",
        startAt: new Date("2026-10-15T06:14:00Z"),
        endAt: null,
        note: "",
        values: [
          { field: "weightKg", num: "75.6" },
          { field: "fasted", bool: true },
        ],
      },
    });
    const bad = (values: Record<string, string>) =>
      checkEntry(reg.get("weigh_in"), input({ values }), rome);
    expect(bad({})).toEqual({ ok: false, errors: { weightKg: "required" } });
    expect(bad({ weightKg: "abc" })).toEqual({
      ok: false,
      errors: { weightKg: "number" },
    });
    expect(bad({ weightKg: "500" })).toEqual({ ok: false, errors: { weightKg: "max" } });
  });

  it("checks scales, integers and choices", () => {
    const c = (kind: string, values: Record<string, string>) =>
      checkEntry(reg.get(kind), input({ values }), rome);
    expect(c("checkin", { mood: "6" })).toEqual({ ok: false, errors: { mood: "max" } });
    expect(c("checkin", { mood: "3.5" })).toEqual({
      ok: false,
      errors: { mood: "integer" },
    });
    expect(c("water", { ml: "250.5" })).toEqual({ ok: false, errors: { ml: "integer" } });
    expect(
      checkEntry(
        reg.get("activity"),
        input({ startMin: 600, values: { category: "nap" } }),
        rome,
      ),
    ).toEqual({
      ok: false,
      errors: { category: "choice" },
    });
    expect(c("checkin", { mood: "4", moment: "morning" })).toMatchObject({ ok: true });
  });

  it("needs an interval's start, and its end after it; a night's bed is the day before", () => {
    const sleep = reg.get("sleep");
    expect(checkEntry(sleep, input(), rome)).toEqual({
      ok: false,
      errors: { start: "start_required" },
    });
    expect(checkEntry(sleep, input({ startMin: 480, endMin: 480 }), rome)).toEqual({
      ok: false,
      errors: { end: "end_before_start" },
    });
    const night = checkEntry(sleep, input({ startMin: -30, endMin: 7 * 60 }), rome);
    expect(night).toMatchObject({
      ok: true,
      entry: {
        startAt: new Date("2026-10-14T21:30:00Z"),
        endAt: new Date("2026-10-15T05:00:00Z"),
      },
    });
  });

  it("enters the plain kinds here, not the composite, child or pantry ones", () => {
    const keys = reg.all.filter(enterable).map((k) => k.key);
    expect(keys).toContain("water");
    expect(keys).toContain("sleep");
    for (const k of [
      "meal",
      "batch",
      "session",
      "session_exercise",
      "purchase",
      "movement",
    ])
      expect(keys).not.toContain(k);
  });

  it("takes a user's own kind by the same rules", () => {
    const def: KindInput = {
      key: "pushups",
      family: "train",
      domain: "training",
      shape: "instant",
      entry: "quick",
      fields: [{ key: "reps", type: "integer", min: 1, required: true }],
    };
    const kind = kindSchema.parse(def);
    expect(enterable(kind)).toBe(true);
    expect(checkEntry(kind, input({ values: { reps: "0" } }), rome)).toEqual({
      ok: false,
      errors: { reps: "min" },
    });
  });
});

describe("writing an entry", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;

  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
  });
  afterAll(() => close());

  it("writes it with its values; it shows on the owner's day only", async () => {
    const checked = checkEntry(
      reg.get("water"),
      input({ startMin: 10 * 60, values: { ml: "500" }, note: " dopo la corsa " }),
      { timeZone: "Europe/Rome", boundaryMin: 240 },
    );
    if (!checked.ok) throw new Error("expected a valid entry");
    const id = await createEntry(db, a, checked.entry);
    const day = await loadDay(db, a, "2026-10-15");
    expect(day.untimed).toEqual([]);
    expect(day.timed).toHaveLength(1);
    expect(day.timed[0]).toMatchObject({
      id,
      status: "done",
      source: "typed",
      note: "dopo la corsa",
      values: { ml: "500.0000" },
    });
    expect((await loadDay(db, b, "2026-10-15")).timed).toEqual([]);
  });
});
