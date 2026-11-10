import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as s from "./schema";
import { createTestDb, createTestUser } from "./test-db";

// A repair's SQL, as migrate applies it: statements split on drizzle's breakpoint.
const repair = (name: string) =>
  readFileSync(join(__dirname, "../../../drizzle/" + name + ".sql"), "utf8")
    .split("--> statement-breakpoint")
    .map((x) => x.trim())
    .filter(Boolean);
const SQL = repair("0002_data_repair_orphans");

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
const R6 = repair("0003_data_repair_intake");

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
const R2 = repair("0004_data_repair_roles");

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

// PL-72 (change 2026-11-07-piano, MOD-36): his cicli become catalog «cycle» rows, same id.
const CYCLES = repair("0006_data_repair_cycles_catalog");

describe("data repair PL-72: cicli into the catalog (MOD-36, ADR-0062)", () => {
  let t: Awaited<ReturnType<typeof createTestDb>>;
  let user: string;
  beforeAll(async () => {
    t = await createTestDb();
    user = await createTestUser(t.db, "d@example.test");
  });
  afterAll(() => t.close());

  const run = async () => {
    for (const q of CYCLES) await t.client.exec(q);
  };
  const template = async (v: Partial<typeof s.templates.$inferInsert>) =>
    (
      await t.db
        .insert(s.templates)
        .values({ userId: user, scope: "cycle", name: "?", ...v })
        .returning({ id: s.templates.id })
    )[0]!.id;
  const catalog = async () =>
    Object.fromEntries(
      (
        await t.db
          .select()
          .from(s.catalogItems)
          .where(eq(s.catalogItems.catalog, "cycle"))
      ).map((i) => [i.name, i]),
    );
  const values = async (id: string) =>
    Object.fromEntries(
      (
        await t.db.select().from(s.catalogValues).where(eq(s.catalogValues.itemId, id))
      ).map((v) => [v.field, v.text]),
    );

  it("PPLCR live with its rules, the paused ones archived, the deleted one deleted; same ids; twice = once", async () => {
    // His shape (export 6 Nov): PPLCR active from 8 Oct; «Nuovo ciclo» and the v1 programs
    // paused; RPPL deleted with no rules row.
    const pplcr = await template({ name: "PPLCR", startDay: "2026-10-08" });
    await t.db
      .insert(s.cyclesState)
      .values({ userId: user, cycleId: pplcr, advance: "occurrence", onSkip: "lose" });
    const empty = await template({
      name: "Nuovo ciclo",
      startDay: "2026-10-25",
      active: false,
    });
    await t.db
      .insert(s.cyclesState)
      .values({ userId: user, cycleId: empty, advance: "date", onSkip: "shift" });
    const gone = new Date("2026-10-01T22:56:49Z");
    const rppl = await template({ name: "RPPL", active: false, deletedAt: gone });

    await run();
    await run();

    const c = await catalog();
    expect(Object.keys(c).sort()).toEqual(["Nuovo ciclo", "PPLCR", "RPPL"]);
    expect(c["PPLCR"]).toMatchObject({ id: pplcr, archivedAt: null, deletedAt: null });
    expect(c["Nuovo ciclo"]!.id).toBe(empty);
    expect(c["Nuovo ciclo"]!.archivedAt).not.toBeNull();
    expect(c["RPPL"]).toMatchObject({ id: rppl, archivedAt: null, deletedAt: gone });
    expect(await values(pplcr)).toEqual({
      advance: "occurrence",
      onSkip: "lose",
      start: "2026-10-08",
    });
    expect(await values(empty)).toEqual({
      advance: "date",
      onSkip: "shift",
      start: "2026-10-25",
    });
    expect(await values(rppl)).toEqual({ advance: "occurrence", onSkip: "lose" });
    // 0007: a step points at the catalog «cycle» now.
    await t.db
      .insert(s.cycleSteps)
      .values({ userId: user, cycleId: pplcr, position: 0, label: "Push" });
  });

  it("stops, changing nothing, on a live habit or a planned day model's block (PL-72 «or nothing»)", async () => {
    const habit = await template({ scope: "block", name: "Acqua" });
    await expect(run()).rejects.toThrow(/live habit/);
    await t.db
      .update(s.templates)
      .set({ deletedAt: new Date() })
      .where(eq(s.templates.id, habit));
    await run();

    const base = await template({ scope: "day", name: "Base" });
    const rec = await template({ scope: "day", name: "Rec", extendsId: base });
    await t.db
      .insert(s.weekLayouts)
      .values({ userId: user, weekday: 1, templateId: rec });
    await run(); // models with no block carry nothing
    const [block] = await t.db
      .insert(s.templateBlocks)
      .values({
        userId: user,
        templateId: base,
        position: 0,
        kind: "meal",
        when: "unset",
      })
      .returning({ id: s.templateBlocks.id });
    await expect(run()).rejects.toThrow(/block\(s\) of a day model/);
    await t.db.delete(s.templateBlocks).where(eq(s.templateBlocks.id, block!.id));
    await run();
  });
});
