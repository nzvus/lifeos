/** Tests for the sleep repository (ADR-0031). */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { clearSleep, listSleep, setSleep } from "./sleep";

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

const night = (
  day: string,
  bed: string,
  wake: string,
  quality: number | null = null,
) => ({
  day,
  bed,
  wake,
  quality,
  notes: "",
});

describe("sleep repository", () => {
  it("one night per wake-up day, replaced when set again; mine only; cleared", async () => {
    await setSleep(db, me, night("2026-10-02", "23:40", "07:00", 4), "Europe/Rome");
    await setSleep(db, me, night("2026-10-02", "00:30", "07:30"), "Europe/Rome");
    await setSleep(db, me, night("2026-10-01", "23:00", "06:00"), "Europe/Rome");
    expect(
      (await listSleep(db, me, "2026-10-01", "2026-10-02")).map((n) => [
        n.day,
        n.hours,
        n.quality,
      ]),
    ).toEqual([
      ["2026-10-01", 7, null],
      ["2026-10-02", 7, null],
    ]);
    expect(await listSleep(db, other, "2026-10-01", "2026-10-02")).toEqual([]);
    await clearSleep(db, other, "2026-10-01"); // not theirs: nothing happens
    await clearSleep(db, me, "2026-10-01");
    expect(
      (await listSleep(db, me, "2026-10-01", "2026-10-02")).map((n) => n.day),
    ).toEqual(["2026-10-02"]);
  });
});
