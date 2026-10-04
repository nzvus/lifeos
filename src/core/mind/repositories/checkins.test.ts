/** The day's check-in (ADR-0038): saved, replaced, cleared, mine only. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { parseInput } from "../../shared/validation";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { mindSummary } from "../summary";
import { checkinInput } from "../validation";
import { getCheckin, listCheckins, saveCheckin } from "./checkins";

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

const input = (v: Record<string, string>) => {
  const r = parseInput(checkinInput, { day: "2026-10-04", ...v });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.value;
};

describe("check-ins", () => {
  it("refuses values off the 1–5 scale", () => {
    expect(parseInput(checkinInput, { day: "2026-10-04", mood: "6" }).ok).toBe(false);
    expect(parseInput(checkinInput, { day: "2026-10-04", mood: "0" }).ok).toBe(false);
  });

  it("saves, replaces and clears one day, mine only", async () => {
    await saveCheckin(
      db,
      me,
      input({ mood: "4", energy: "3", note: "Indiano a pranzo" }),
    );
    expect(await getCheckin(db, me, "2026-10-04")).toEqual({
      day: "2026-10-04",
      mood: 4,
      energy: 3,
      stress: null,
      note: "Indiano a pranzo",
    });
    expect(await getCheckin(db, other, "2026-10-04")).toBeNull();
    await saveCheckin(db, me, input({ mood: "5" }));
    expect((await getCheckin(db, me, "2026-10-04"))?.mood).toBe(5);
    await saveCheckin(db, me, input({}));
    expect(await getCheckin(db, me, "2026-10-04")).toBeNull();
  });

  it("sums a period up", async () => {
    await saveCheckin(db, me, input({ day: "2026-10-01", mood: "2", stress: "4" }));
    await saveCheckin(db, me, input({ day: "2026-10-02", mood: "4", stress: "2" }));
    await saveCheckin(db, me, input({ day: "2026-10-03", note: "solo nota" }));
    const list = await listCheckins(db, me, "2026-10-01", "2026-10-31");
    expect(mindSummary(list)).toEqual({ days: 3, mood: 3, energy: null, stress: 3 });
  });
});
