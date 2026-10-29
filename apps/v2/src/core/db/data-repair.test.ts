import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as s from "./schema";
import { createTestDb, createTestUser } from "./test-db";

// The repair's SQL, as migrate applies it: statements split on drizzle's breakpoint.
const SQL = readFileSync(
  join(__dirname, "../../../drizzle/0002_data_repair_orphans.sql"),
  "utf8",
)
  .split("--> statement-breakpoint")
  .map((x) => x.trim())
  .filter(Boolean);

describe("data repair R1, R3 (data-repair.md)", () => {
  let t: Awaited<ReturnType<typeof createTestDb>>;
  let user: string;
  beforeAll(async () => {
    t = await createTestDb();
    user = await createTestUser(t.db, "a@example.test");
  });
  afterAll(() => t.close());

  const entry = async (v: Partial<typeof s.entries.$inferInsert>) =>
    (
      await t.db
        .insert(s.entries)
        .values({
          userId: user,
          kind: "session",
          day: "2026-10-26",
          status: "done",
          ...v,
        })
        .returning({ id: s.entries.id })
    )[0]!.id;
  const row = async (id: string) =>
    (await t.db.select().from(s.entries).where(eq(s.entries.id, id)))[0]!;

  it("orphans leave with their trashed parent; empty exercises of a finished session are skipped", async () => {
    const gone = new Date("2026-10-26T06:30:00Z");
    const trashed = await entry({ deletedAt: gone });
    const orphan = await entry({
      kind: "session_exercise",
      status: "planned",
      parentId: trashed,
    });
    const done = await entry({});
    const empty = await entry({ kind: "session_exercise", parentId: done });
    const worked = await entry({ kind: "session_exercise", parentId: done });
    await t.db
      .insert(s.trainingSets)
      .values({ userId: user, entryId: worked, position: 0, reps: 8 });
    const open = await entry({ status: "planned" });
    const notYet = await entry({
      kind: "session_exercise",
      status: "planned",
      parentId: open,
    });

    for (let run = 0; run < 2; run++) for (const q of SQL) await t.client.exec(q);

    expect((await row(orphan)).deletedAt).toEqual(gone);
    expect((await row(empty)).status).toBe("skipped");
    expect((await row(worked)).status).toBe("done");
    expect((await row(notYet)).status).toBe("planned");
    expect((await row(notYet)).deletedAt).toBeNull();
  });
});
