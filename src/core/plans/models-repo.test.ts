import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { inheritedTargets, resolveModel, toModels } from "./models";
import {
  createModel,
  duplicateModel,
  readModelBook,
  readRoleDays,
  removeBlock,
  restoreBlock,
  saveBlock,
  saveModel,
  setModelActive,
  setWeekdays,
} from "./models-repo";

const meal = (role: string, atMin: number, kcalShare: string) => ({
  kind: "meal" as const,
  role,
  atMin,
  durationMin: null,
  kcalShare,
  proteinShare: null,
});

describe("day models, written and read back", () => {
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

  const resolved = async (owner: Owner, id: string) => {
    const book = await readModelBook(db, owner);
    return resolveModel(id, toModels(book.models, book.rows))!;
  };

  it("a base, a model on it: changes and hides inherited blocks, «torna alla base»", async () => {
    const rest = await createModel(db, a, "Rest", null);
    await saveModel(db, a, rest, {
      name: "Rest",
      extendsId: null,
      targets: { mode: "dynamic", deficitKcal: 200 },
    });
    expect(await saveBlock(db, a, rest, null, meal("breakfast", 480, "0.250"))).toBe(
      true,
    );
    expect(await saveBlock(db, a, rest, null, meal("dinner", 1200, "0.400"))).toBe(true);
    const [breakfast, dinner] = (await resolved(a, rest)).blocks;

    const gym = await createModel(db, a, "Gym", rest);
    await saveModel(db, a, gym, {
      name: "Gym",
      extendsId: rest,
      targets: { proteinGPerKg: "2.2" },
    });
    await saveBlock(db, a, gym, breakfast!.id, meal("breakfast", 450, "0.300"));
    await removeBlock(db, a, gym, dinner!.id);
    await saveBlock(db, a, gym, null, {
      kind: "session",
      role: null,
      atMin: 540,
      durationMin: 60,
      kcalShare: null,
      proteinShare: null,
    });
    let r = await resolved(a, gym);
    expect(r.blocks.map((x) => [x.kind, x.origin, x.when])).toEqual([
      ["meal", "changed", { type: "at", min: 450 }],
      ["session", "local", { type: "at", min: 540 }],
    ]);
    expect(r.removed.map((x) => x.id)).toEqual([dinner!.id]);
    expect(inheritedTargets(gym, (await readModelBook(db, a)).models).targets).toEqual({
      mode: "dynamic",
      deficitKcal: 200,
      proteinGPerKg: "2.2",
    });

    await restoreBlock(db, a, gym, dinner!.id);
    await restoreBlock(db, a, gym, breakfast!.id);
    r = await resolved(a, gym);
    expect(r.blocks.map((x) => x.origin)).toEqual(["base", "base", "local"]);

    // A base that would make a loop is refused; another person's model is untouched.
    expect(
      await saveModel(db, a, rest, { name: "Rest", extendsId: gym, targets: null }),
    ).toBe(false);
    expect(await saveBlock(db, b, rest, null, meal("lunch", 780, "0.3"))).toBe(false);
    expect(await removeBlock(db, b, rest, breakfast!.id)).toBe(false);
    expect((await readModelBook(db, b)).models).toEqual([]);

    // The week: each weekday one model; archiving takes it out of the week.
    await setWeekdays(db, a, rest, [1, 2, 3, 4, 5, 6, 7]);
    await setWeekdays(db, a, gym, [1, 3]);
    let week = (await readModelBook(db, a)).week;
    expect([week.get(1), week.get(2), week.get(3)]).toEqual([gym, rest, gym]);
    await setModelActive(db, a, gym, false);
    week = (await readModelBook(db, a)).week;
    expect(week.get(1)).toBeUndefined();
    expect(week.get(2)).toBe(rest);

    const copy = (await duplicateModel(db, a, gym, "Gym (copia)"))!;
    expect((await resolved(a, copy)).blocks.map((x) => x.kind)).toEqual([
      "meal",
      "meal",
      "session",
    ]);
    expect(await duplicateModel(db, b, gym, "x")).toBeNull();
  });

  it("each done meal's role, kcal and protein", async () => {
    const [m] = await db
      .insert(s.entries)
      .values({
        userId: a.id,
        kind: "meal",
        day: "2026-10-20",
        status: "done",
        startAt: new Date("2026-10-20T18:30:00Z"),
      })
      .returning({ id: s.entries.id });
    const [l] = await db
      .insert(s.entryLines)
      .values({
        userId: a.id,
        entryId: m!.id,
        position: 0,
        name: "Pasta",
        quantity: "200",
        unit: "g",
      })
      .returning({ id: s.entryLines.id });
    await db.insert(s.entryLineValues).values([
      { userId: a.id, lineId: l!.id, field: "kcal", num: "350" },
      { userId: a.id, lineId: l!.id, field: "protein", num: "12" },
    ]);
    const clock = { timeZone: "Europe/Rome", boundaryMin: 240 };
    const bounds = { lunchFrom: 660, snackFrom: 900, dinnerFrom: 1140 };
    expect(
      await readRoleDays(db, a, "2026-10-19", "2026-10-25", {
        clock,
        roleBounds: bounds,
      }),
      // 18:30 UTC is 20:30 in Rome.
    ).toEqual([
      { day: "2026-10-20", role: "dinner", kcal: 700, protein: 24, minute: 1230 },
    ]);
    expect(
      await readRoleDays(db, b, "2026-10-19", "2026-10-25", {
        clock,
        roleBounds: bounds,
      }),
    ).toEqual([]);
  });
});
