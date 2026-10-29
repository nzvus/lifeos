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

// R6: single-food «meals» with no energy become «assunzioni» (capture.md §4).
const R6 = readFileSync(
  join(__dirname, "../../../drizzle/0003_data_repair_intake.sql"),
  "utf8",
)
  .split("--> statement-breakpoint")
  .map((x) => x.trim())
  .filter(Boolean);

describe("data repair R6 (data-repair.md)", () => {
  let t: Awaited<ReturnType<typeof createTestDb>>;
  let user: string;
  beforeAll(async () => {
    t = await createTestDb();
    user = await createTestUser(t.db, "b@example.test");
  });
  afterAll(() => t.close());

  const food = async (name: string) =>
    (
      await t.db
        .insert(s.catalogItems)
        .values({ userId: user, catalog: "food", name })
        .returning({ id: s.catalogItems.id })
    )[0]!.id;
  const meal = async (lines: { item: string | null; kcal: number | null }[]) => {
    const id = (
      await t.db
        .insert(s.entries)
        .values({ userId: user, kind: "meal", day: "2026-10-27", status: "done" })
        .returning({ id: s.entries.id })
    )[0]!.id;
    await t.db.insert(s.entryValues).values([
      { userId: user, entryId: id, field: "role", text: "snack" },
      { userId: user, entryId: id, field: "roleSource", text: "auto" },
    ]);
    for (const [i, l] of lines.entries()) {
      const line = (
        await t.db
          .insert(s.entryLines)
          .values({
            userId: user,
            entryId: id,
            position: i,
            itemId: l.item,
            name: "x",
            quantity: "5",
            unit: "g",
          })
          .returning({ id: s.entryLines.id })
      )[0]!.id;
      if (l.kcal !== null)
        await t.db
          .insert(s.entryLineValues)
          .values({ userId: user, lineId: line, field: "kcal", num: String(l.kcal) });
    }
    return id;
  };
  const kind = async (id: string) =>
    (await t.db.select().from(s.entries).where(eq(s.entries.id, id)))[0]!.kind;
  const values = async (id: string) =>
    (await t.db.select().from(s.entryValues).where(eq(s.entryValues.entryId, id))).map(
      (v) => v.field,
    );

  it("creatine and coffee become intakes without a role; real meals stay meals", async () => {
    const creatina = await meal([{ item: await food("Creatina"), kcal: 0 }]);
    const caffe = await meal([{ item: await food("Caffè macinato"), kcal: null }]);
    const gallette = await meal([{ item: await food("Gallette di mais"), kcal: 77 }]);
    const two = await meal([
      { item: await food("Caffè"), kcal: 0 },
      { item: await food("Latte"), kcal: 0 },
    ]);
    const estimate = await meal([{ item: null, kcal: 0 }]);

    for (let run = 0; run < 2; run++) for (const q of R6) await t.client.exec(q);

    expect(await kind(creatina)).toBe("intake");
    expect(await kind(caffe)).toBe("intake");
    expect(await values(creatina)).toEqual([]);
    expect(await kind(gallette)).toBe("meal");
    expect(await values(gallette)).toHaveLength(2);
    expect(await kind(two)).toBe("meal");
    expect(await kind(estimate)).toBe("meal");
  });
});

// R2: a timed meal with no role takes its time's, `auto` (capture.md §4).
const R2 = readFileSync(
  join(__dirname, "../../../drizzle/0004_data_repair_roles.sql"),
  "utf8",
)
  .split("--> statement-breakpoint")
  .map((x) => x.trim())
  .filter(Boolean);

describe("data repair R2 (data-repair.md §3)", () => {
  let t: Awaited<ReturnType<typeof createTestDb>>;
  let user: string;
  beforeAll(async () => {
    t = await createTestDb();
    user = await createTestUser(t.db, "c@example.test");
    await t.db
      .insert(s.settings)
      .values({
        userId: user,
        prefs: { lunchFrom: 720, snackFrom: 900, dinnerFrom: 1110 },
      })
      .onConflictDoUpdate({
        target: s.settings.userId,
        set: { prefs: { lunchFrom: 720, snackFrom: 900, dinnerFrom: 1110 } },
      });
  });
  afterAll(() => t.close());

  const meal = async (at: string | null, role?: string) => {
    const id = (
      await t.db
        .insert(s.entries)
        .values({
          userId: user,
          kind: "meal",
          day: "2026-10-27",
          status: "done",
          startAt: at ? new Date(at) : null,
        })
        .returning({ id: s.entries.id })
    )[0]!.id;
    if (role !== undefined)
      await t.db
        .insert(s.entryValues)
        .values({ userId: user, entryId: id, field: "role", text: role });
    return id;
  };
  const vals = async (id: string) =>
    Object.fromEntries(
      (await t.db.select().from(s.entryValues).where(eq(s.entryValues.entryId, id))).map(
        (v) => [v.field, v.text],
      ),
    );

  it("27 Oct 11:09 UTC (12:09 in Rome) → lunch, auto; chosen roles and untimed meals untouched", async () => {
    const noon = await meal("2026-10-27T11:09:00Z");
    const evening = await meal("2026-10-27T19:30:00Z", "");
    const morning = await meal("2026-10-27T07:00:00Z");
    const chosen = await meal("2026-10-27T11:09:00Z", "breakfast");
    const untimed = await meal(null);

    for (let run = 0; run < 2; run++) for (const q of R2) await t.client.exec(q);

    expect(await vals(noon)).toEqual({ role: "lunch", roleSource: "auto" });
    expect(await vals(evening)).toEqual({ role: "dinner", roleSource: "auto" });
    expect(await vals(morning)).toEqual({ role: "breakfast", roleSource: "auto" });
    expect(await vals(chosen)).toEqual({ role: "breakfast" });
    expect(await vals(untimed)).toEqual({});
  });
});
