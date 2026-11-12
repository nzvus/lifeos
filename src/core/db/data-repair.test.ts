import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ownerFromVerifiedSession } from "../identity/owner";
import { readBlocks } from "../plans/blocks";
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

const FOOD = repair("0008_data_repair_food_goals");

describe("data repair PL-61, PL-72: «Rec» into Obiettivi, habits into blocchi (FD-20, PL-03)", () => {
  let t: Awaited<ReturnType<typeof createTestDb>>;
  let user: string;
  beforeAll(async () => {
    t = await createTestDb();
    user = await createTestUser(t.db, "e@example.test");
  });
  afterAll(() => t.close());

  const run = async () => {
    for (const q of FOOD) await t.client.exec(q);
  };
  const template = async (v: Partial<typeof s.templates.$inferInsert>) =>
    (
      await t.db
        .insert(s.templates)
        .values({ userId: user, scope: "day", name: "?", ...v })
        .returning({ id: s.templates.id })
    )[0]!.id;

  it("PL-61: «Rec»'s deficit, protein and fat become goals from its first day; «Rec» archived; twice = once", async () => {
    // His shape (export 6 Nov): «Rec» dynamic on all seven weekdays, created 1 Oct; the first
    // week of targets 5 Oct; «Come martedì 3» paused and in no week.
    const rec = await template({
      name: "Rec",
      targets: {
        mode: "dynamic",
        fatGPerKg: "0.8",
        deficitKcal: 200,
        proteinGPerKg: "2.2",
      },
      createdAt: new Date("2026-10-01T16:32:30Z"),
    });
    await template({ name: "Come martedì 3", active: false });
    await t.db.insert(s.weekLayouts).values(
      [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
        userId: user,
        weekday,
        templateId: rec,
      })),
    );
    await t.db.insert(s.decisions).values({
      userId: user,
      kind: "week_targets",
      day: "2026-10-05",
      key: "",
      payload: { source: "auto" },
    });

    await run();
    await run();

    const goals = await t.db.select().from(s.goals).where(eq(s.goals.userId, user));
    expect(
      goals
        .map((g) => [
          (g.metric as { source: string }).source,
          Number(g.value),
          g.sinceDay,
          g.target,
        ])
        .sort(),
    ).toEqual([
      ["fatPerKg", 0.8, "2026-10-01", "at_least"],
      ["foodDeficit", 200, "2026-10-01", "at_least"],
      ["proteinPerKg", 2.2, "2026-10-01", "at_least"],
    ]);
    const models = await t.db
      .select()
      .from(s.templates)
      .where(eq(s.templates.scope, "day"));
    expect(models.every((m) => !m.active)).toBe(true);
  });

  it("PL-03: a habit becomes a blocco of its type with its time, duration and category", async () => {
    const [h] = await t.db
      .insert(s.templates)
      .values({
        userId: user,
        scope: "block",
        name: "Studio",
        recurrence: { type: "weekdays", days: [1, 3, 5] },
      })
      .returning({ id: s.templates.id });
    await t.db.insert(s.templateBlocks).values({
      userId: user,
      templateId: h!.id,
      position: 0,
      kind: "activity",
      when: "absolute",
      atMin: 21 * 60 + 5,
      durationMin: 45,
      defaults: { category: "study" },
    });

    await run();
    await run();

    const [b] = await readBlocks(t.db, ownerFromVerifiedSession(user));
    expect(b).toMatchObject({
      id: h!.id,
      name: "Studio",
      area: "Oggi",
      kind: "activity",
      defaults: { category: "study" },
      when: { kind: "time", atMin: 21 * 60 + 5 },
      durationMin: 45,
      recurrence: { type: "weekdays", days: [1, 3, 5] },
      items: [],
    });
  });

  it("stops on a fixed day model in his week (its numbers have no goal: PL-72 «or nothing»)", async () => {
    const fixed = await template({
      name: "Rest",
      targets: { mode: "fixed", kcal: "2000" },
    });
    await t.db
      .update(s.weekLayouts)
      .set({ templateId: fixed })
      .where(eq(s.weekLayouts.weekday, 1));
    await expect(run()).rejects.toThrow(/fixed day model/);
  });
});

const STEPS = repair("0010_data_repair_step_blocks");

describe("data repair PL-30: a step's scheda becomes a blocco «nel ciclo» (Q-18 (a))", () => {
  let t: Awaited<ReturnType<typeof createTestDb>>;
  let user: string;
  beforeAll(async () => {
    t = await createTestDb();
    user = await createTestUser(t.db, "f@example.test");
  });
  afterAll(() => t.close());

  const run = async () => {
    for (const q of STEPS) await t.client.exec(q);
  };
  const item = async (catalog: string, name: string) =>
    (
      await t.db
        .insert(s.catalogItems)
        .values({ userId: user, catalog, name })
        .returning({ id: s.catalogItems.id })
    )[0]!.id;
  const step = async (cycleId: string, position: number, itemId: string | null) => {
    const [st] = await t.db
      .insert(s.cycleSteps)
      .values({ userId: user, cycleId, position, label: "" })
      .returning({ id: s.cycleSteps.id });
    if (itemId)
      await t.db
        .insert(s.cycleStepItems)
        .values({ userId: user, stepId: st!.id, position: 0, itemId });
    return st!.id;
  };
  const held = async () =>
    (await t.db.select().from(s.cycleStepItems)).map((r) => [r.stepId, r.itemId]);

  it("each scheda once, named as it (« (ciclo)» on a taken name), the steps point at it; an exercise stays; twice = once", async () => {
    // His shape: PPLCR with Push, Pull, Legs, Cardio, Rest; Push twice in another ciclo; a
    // paused ciclo's scheda stays a scheda (it becomes a blocco when he saves its steps).
    const cycle = await item("cycle", "PPLCR");
    const paused = await item("cycle", "Full body");
    await t.db
      .update(s.catalogItems)
      .set({ archivedAt: new Date() })
      .where(eq(s.catalogItems.id, paused));
    const fullBody = await item("routine", "Full body A");
    const s6 = await step(paused, 0, fullBody);
    const other = await item("cycle", "Push twice");
    const push = await item("routine", "Push");
    const legs = await item("routine", "Legs");
    const squat = await item("exercise", "Squat");
    // A daily blocco «Legs» of his already: the new one is «Legs (ciclo)».
    await item("block", "Legs");
    const s1 = await step(cycle, 0, push);
    const s2 = await step(cycle, 1, legs);
    const s3 = await step(cycle, 2, null);
    const s4 = await step(other, 0, push);
    const s5 = await step(other, 1, squat);
    await run();
    const blocks = new Map(
      (await readBlocks(t.db as never, ownerFromVerifiedSession(user))).map((b) => [
        b.name,
        b,
      ]),
    );
    const bPush = blocks.get("Push")!;
    const bLegs = blocks.get("Legs (ciclo)")!;
    expect(bPush).toMatchObject({
      area: "Corpo",
      recurrence: { type: "inCycle" },
      when: { kind: "none" },
      items: [{ itemId: push, quantity: null }],
    });
    expect(bLegs.items).toEqual([{ itemId: legs, quantity: null }]);
    const after = new Map((await held()) as [string, string][]);
    expect(after.get(s1)).toBe(bPush.id);
    expect(after.get(s4)).toBe(bPush.id); // one blocco for the same scheda
    expect(after.get(s2)).toBe(bLegs.id);
    expect(after.get(s5)).toBe(squat); // an exercise stays
    expect(after.has(s3)).toBe(false); // the rest holds nothing
    expect(after.get(s6)).toBe(fullBody); // a paused ciclo's scheda stays
    expect(blocks.has("Full body A")).toBe(false);
    const before = await held();
    const count = (await t.db.select().from(s.catalogItems)).length;
    await run();
    expect(await held()).toEqual(before);
    expect((await t.db.select().from(s.catalogItems)).length).toBe(count);
  });

  it("stops, writing nothing, when «X» and «X (ciclo)» are both his blocchi already", async () => {
    const cycle = await item("cycle", "Corsa");
    const run1 = await item("routine", "Run");
    await item("block", "Run");
    await item("block", "Run (ciclo)");
    const st = await step(cycle, 0, run1);
    const count = (await t.db.select().from(s.catalogItems)).length;
    await expect(run()).rejects.toThrow(/taken by a blocco twice/);
    expect((await t.db.select().from(s.catalogItems)).length).toBe(count);
    expect(new Map((await held()) as [string, string][]).get(st)).toBe(run1);
  });
});
