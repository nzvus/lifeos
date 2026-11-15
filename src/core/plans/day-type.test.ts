import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readBlocks } from "./blocks";
import { readCycleBook } from "./cycles-repo";
import { saveDayToStep } from "./day-type";
import { addStep, createCycle } from "./test-cycles";

describe("«Salva come giornata tipo» (MOD-30…32, proposal §28)", () => {
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

  const item = async (catalog: string, name: string) =>
    (
      await db
        .insert(s.catalogItems)
        .values({ userId: a.id, catalog, name })
        .returning({ id: s.catalogItems.id })
    )[0]!.id;
  const voce = async (kind: string, utc: string, itemId: string | null = null) =>
    (
      await db
        .insert(s.entries)
        .values({
          userId: a.id,
          kind,
          day: "2026-11-16",
          status: "done",
          startAt: new Date(utc),
          itemId,
        })
        .returning({ id: s.entries.id })
    )[0]!.id;
  const opts = {
    timeZone: "Europe/Rome",
    nameOf: (k: string) => ({ water: "Acqua", weigh_in: "Peso" })[k] ?? k,
    areaOf: () => "Oggi",
  };

  it("the day's voci become the step's lines, at their times; the step's scheda and repeats are one", async () => {
    const legs = await item("routine", "Legs");
    const porridge = await item("recipe", "Porridge");
    const cycle = await createCycle(db, a, "PPLCR", "2026-11-10");
    expect(await addStep(db, a, cycle, legs)).toBe(true);
    const ids = [
      await voce("weigh_in", "2026-11-16T06:50:00Z"), // 07:50 in Rome
      await voce("meal", "2026-11-16T07:00:00Z", porridge),
      await voce("water", "2026-11-16T09:00:00Z"),
      await voce("water", "2026-11-16T10:00:00Z"), // a second glass: the same line
      await voce("session", "2026-11-16T17:00:00Z", legs), // the step's own scheda
    ];
    expect(
      await saveDayToStep(db, a, { cycleId: cycle, position: 0, voceIds: ids, ...opts }),
    ).toEqual({ added: 3 });
    const step = (await readCycleBook(db, a)).cycles.find((c) => c.id === cycle)!
      .steps[0]!;
    const blocks = await readBlocks(db, a);
    const lines = step.items
      .map((i) => blocks.find((x) => x.id === i.id))
      .filter((x) => x !== undefined)
      .map((x) => [x.name, x.when.kind === "time" ? x.when.atMin : null]);
    expect(lines).toEqual(
      expect.arrayContaining([
        ["Peso", 7 * 60 + 50],
        ["Porridge", 8 * 60],
        ["Acqua", 10 * 60],
      ]),
    );
    // Saved again: nothing twice.
    expect(
      await saveDayToStep(db, a, { cycleId: cycle, position: 0, voceIds: ids, ...opts }),
    ).toEqual({ added: 0 });
    // Not his ciclo: nothing.
    expect(
      await saveDayToStep(db, b, { cycleId: cycle, position: 0, voceIds: ids, ...opts }),
    ).toBe("gone");
  });

  it("a step holding its scheda directly (his older cicli) keeps planning it, and its name", async () => {
    const pull = await item("routine", "Pull");
    const cycle = await createCycle(db, a, "PL", "2026-11-10");
    const [st] = await db
      .insert(s.cycleSteps)
      .values({ userId: a.id, cycleId: cycle, position: 0, label: "" })
      .returning({ id: s.cycleSteps.id });
    await db
      .insert(s.cycleStepItems)
      .values({ userId: a.id, stepId: st!.id, position: 0, itemId: pull });
    const ids = [await voce("weigh_in", "2026-11-16T06:50:00Z")];
    expect(
      await saveDayToStep(db, a, {
        cycleId: cycle,
        position: 0,
        voceIds: ids,
        label: "Pull",
        ...opts,
      }),
    ).toEqual({ added: 1 });
    const step = (await readCycleBook(db, a)).cycles.find((c) => c.id === cycle)!
      .steps[0]!;
    expect(step.label).toBe("Pull");
    const blocks = await readBlocks(db, a);
    const held = step.items.map((i) => blocks.find((x) => x.id === i.id));
    // Every item is a blocco now; one of them holds the scheda.
    expect(held.every((x) => x !== undefined)).toBe(true);
    expect(held.some((x) => x!.items.some((o) => o.itemId === pull))).toBe(true);
  });
});
