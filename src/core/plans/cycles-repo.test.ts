import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { act } from "../verbs";
import { IN_CYCLE, readCycleBook, setCycleSteps } from "./cycles-repo";
import { readBlocks } from "./blocks";
import { readDayPlans } from "./read";
import { addStep, createCycle } from "./test-cycles";

describe("cicli, written and read back (MOD-36, PL-30)", () => {
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

  const routine = async (o: Owner, name: string) =>
    (
      await db
        .insert(s.catalogItems)
        .values({ userId: o.id, catalog: "routine", name })
        .returning({ id: s.catalogItems.id })
    )[0]!.id;
  const book = async (id: string) =>
    (await readCycleBook(db, a)).cycles.find((c) => c.id === id)!;
  const names = async (id: string) =>
    (await book(id)).steps.map((x) => x.items[0]?.name ?? x.label);

  it("Q-16: the steps in his order — the same scheda twice, rests; kept steps keep id and label", async () => {
    const push = await routine(a, "Push");
    const pull = await routine(a, "Pull");
    const id = await createCycle(db, a, "PPR", "2026-10-20");
    expect(
      await setCycleSteps(db, a, id, [
        { item: push },
        { item: pull },
        { rest: true },
        { item: push },
      ]),
    ).toBe("ok");
    expect(await names(id)).toEqual(["Push", "Pull", "Riposo", "Push"]);
    const before = (await book(id)).steps;
    // The rest first, the last Push out: the same rows, new positions.
    expect(
      await setCycleSteps(db, a, id, [
        { step: before[2]!.id },
        { step: before[0]!.id },
        { step: before[1]!.id },
      ]),
    ).toBe("ok");
    const after = (await book(id)).steps;
    expect(after.map((x) => [x.position, x.id])).toEqual([
      [0, before[2]!.id],
      [1, before[0]!.id],
      [2, before[1]!.id],
    ]);
    expect(await names(id)).toEqual(["Riposo", "Push", "Pull"]);
    // His rules from the page (core/verbs): by date from the 20th, the 21st holds step 2.
    expect(
      (await act(db, a, "edit", "cycle", id, { values: { advance: "date" } })).ok,
    ).toBe(true);
    const plans = await readDayPlans(db, a, "2026-10-21", "2026-10-21", "2026-10-21");
    expect(plans.get("2026-10-21")!.cycles[0]).toMatchObject({
      cycle: "PPR",
      label: "Push",
    });
    expect((await readCycleBook(db, a)).routines.map((r) => r.name)).toEqual([
      "Pull",
      "Push",
    ]);
  });

  it("refuses what is not his: another's ciclo, scheda or step; nothing changes", async () => {
    const legs = await routine(a, "Legs");
    const theirs = await routine(b, "Loro");
    const id = await createCycle(db, a, "Gambe", "2026-11-02");
    await addStep(db, a, id, legs);
    const other = await createCycle(db, a, "Altro", "2026-11-02");
    await addStep(db, a, other, null);
    const step = (await book(other)).steps[0]!.id;
    expect(await setCycleSteps(db, b, id, [{ rest: true }])).toBe("gone");
    expect(await setCycleSteps(db, a, id, [{ item: theirs }])).toBe("invalid");
    expect(await setCycleSteps(db, a, id, [{ step }])).toBe("invalid");
    expect(await names(id)).toEqual(["Legs"]);
    expect((await readCycleBook(db, b)).cycles).toEqual([]);
  });

  it("PL-70: archived from its page (core/verbs), the ciclo leaves the Piano; restored, it is back", async () => {
    const legs = await routine(a, "Gambe dure");
    const id = await createCycle(db, a, "Solo gambe", "2026-11-02");
    await addStep(db, a, id, legs);
    const due = async () =>
      (await readDayPlans(db, a, "2026-11-10", "2026-11-10", "2026-11-10"))
        .get("2026-11-10")!
        .cycles.map((c) => c.cycle);
    expect(await due()).toContain("Solo gambe");
    expect((await act(db, a, "archive", "cycle", id, {})).ok).toBe(true);
    expect(await due()).not.toContain("Solo gambe");
    expect((await book(id)).active).toBe(false);
    expect((await act(db, a, "restore", "cycle", id, {})).ok).toBe(true);
    expect(await due()).toContain("Solo gambe");
  });
  it("Q-18 (a) / PL-30 / PL-31: a scheda picked becomes one blocco «nel ciclo» holding it, reused; a session of it advances the step", async () => {
    const legs = await routine(a, "Squat");
    // A daily blocco «Squat» of his already: the new one takes « (ciclo)», names stay unique.
    const daily = await act(db, a, "create", "block", null, {
      name: "Squat",
      values: { area: "Corpo", recurrence: '{"type":"daily"}' },
    });
    expect(daily.ok).toBe(true);
    const id = await createCycle(db, a, "LR", "2026-10-20");
    expect(
      await setCycleSteps(db, a, id, [{ item: legs }, { rest: true }, { item: legs }]),
    ).toBe("ok");
    const steps = (await book(id)).steps;
    const held = steps.flatMap((x) => x.items.map((i) => i.id));
    expect(held).toHaveLength(2);
    expect(new Set(held).size).toBe(1); // one blocco, held twice
    const [blocco] = (await readBlocks(db, a)).filter((x) => x.id === held[0]);
    expect(blocco).toMatchObject({
      name: "Squat (ciclo)",
      area: "Corpo",
      recurrence: { type: "inCycle" },
      items: [{ itemId: legs }],
    });
    // The step's keys are the blocco's objects: the 20th's step is Squat, with its blocco.
    const plans = await readDayPlans(db, a, "2026-10-20", "2026-10-21", "2026-10-20");
    expect(plans.get("2026-10-20")!.cycles[0]).toMatchObject({
      label: "Squat (ciclo)",
      itemId: legs,
      blockIds: [held[0]],
    });
    // A session of the scheda on the 20th advances it: the 21st is the rest.
    await db.insert(s.entries).values({
      userId: a.id,
      day: "2026-10-20",
      kind: "session",
      itemId: legs,
      status: "done",
    });
    const next = await readDayPlans(db, a, "2026-10-21", "2026-10-21", "2026-10-21");
    expect(next.get("2026-10-21")!.cycles[0]).toMatchObject({ rest: true });
    // The blocco «nel ciclo» posted as it is; a daily blocco is not a step's line.
    expect(await setCycleSteps(db, a, id, [{ item: held[0]! }])).toBe("ok");
    expect(daily.ok && (await setCycleSteps(db, a, id, [{ item: daily.id }]))).toBe(
      "invalid",
    );
    expect(IN_CYCLE).toBe('{"type":"inCycle"}');
  });
});
