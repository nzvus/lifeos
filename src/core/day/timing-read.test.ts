import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readTiming, saveTiming } from "../account/timing";
import { readDay } from "./read";
import { TIMING_DEFAULTS } from "../entries/timing";

// MOD-15 as amended (reframe §11, his 20 Nov): a previsto whose day is over follows his setting,
// derived when the day is read, never stored.
describe("a past previsto, as his setting says (MOD-15)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let id: string;

  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    // Written as a ritmo would: a previsto at 13:00 on a day long over.
    const [row] = await db
      .insert(s.entries)
      .values({
        userId: a.id,
        kind: "water",
        day: "2026-10-16",
        status: "planned",
        startAt: new Date("2026-10-16T11:00:00Z"),
        source: "template",
      })
      .returning({ id: s.entries.id });
    id = row!.id;
  });
  afterAll(() => close());

  const shown = async () =>
    (await readDay(db, a, "2026-10-16")).entries.find((e) => e.id === id)?.status;

  it("defaults: 20 minutes, and saltato", async () => {
    expect(await readTiming(db, a)).toEqual(TIMING_DEFAULTS);
    expect(await shown()).toBe("skipped");
  });

  it("confermato shows it fatto, da confermare leaves it previsto; the row never changes", async () => {
    await saveTiming(db, a, { slackMin: 10, pastPlanned: "confirmed" });
    expect(await readTiming(db, a)).toEqual({ slackMin: 10, pastPlanned: "confirmed" });
    expect(await shown()).toBe("done");
    await saveTiming(db, a, { slackMin: 10, pastPlanned: "unconfirmed" });
    expect(await shown()).toBe("planned");
    const [row] = await db.select().from(s.entries);
    expect(row!.status).toBe("planned");
  });
});
