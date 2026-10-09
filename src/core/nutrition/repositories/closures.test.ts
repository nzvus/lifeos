/** Closing a day (ADR-0042) against a real Postgres (PGlite): set, change, clear, mine only. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { listClosures, setDayClosure } from "./closures";

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

describe("day closures", () => {
  it("sets, changes and clears a day; another user sees only theirs", async () => {
    await setDayClosure(db, me, "2026-10-08", "partial");
    await setDayClosure(db, me, "2026-10-08", "complete");
    await setDayClosure(db, me, "2026-10-09", "complete");
    await setDayClosure(db, other, "2026-10-08", "partial");
    expect(await listClosures(db, me, "2026-10-01", "2026-10-31")).toEqual(
      new Map([
        ["2026-10-08", "complete"],
        ["2026-10-09", "complete"],
      ]),
    );
    await setDayClosure(db, me, "2026-10-09", null);
    expect([...(await listClosures(db, me, "2026-10-01", "2026-10-31")).keys()]).toEqual([
      "2026-10-08",
    ]);
    expect(await listClosures(db, other, "2026-10-01", "2026-10-31")).toEqual(
      new Map([["2026-10-08", "partial"]]),
    );
  });

  it("refuses a state outside the list", async () => {
    await expect(
      setDayClosure(db, me, "2026-10-08", "maybe" as "complete"),
    ).rejects.toThrow();
  });
});
