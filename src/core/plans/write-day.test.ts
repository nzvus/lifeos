import { and, eq, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import type { DayClock } from "../engines/time";
import { createRecipe } from "../food/recipes";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { act } from "../verbs";
import { setBlockWhat } from "./blocks";
import { writeDayPlan } from "./write-day";

const clock: DayClock = { timeZone: "Europe/Rome", boundaryMin: 240 };
const DAY = "2026-11-11"; // a Wednesday

describe("today's Piano written as previsti (PL-40, MOD-33; Q-17 (a))", () => {
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

  const blocco = async (name: string, values: Record<string, string>) => {
    const r = await act(db, a, "create", "block", null, {
      name,
      values: { area: "Oggi", recurrence: '{"type":"daily"}', ...values },
    });
    if (!r.ok) throw new Error(r.refused);
    return r.id;
  };
  const voci = async (o: Owner) =>
    db
      .select()
      .from(s.entries)
      .where(and(eq(s.entries.userId, o.id), eq(s.entries.day, DAY)));

  it("each blocco due becomes one previsto with its blocco: a pasto with its foods, a scheda, a type", async () => {
    const [avena] = await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "food", name: "Avena" })
      .returning({ id: s.catalogItems.id });
    const porridge = await createRecipe(db, a, "Porridge", [
      {
        itemId: avena!.id,
        productId: null,
        name: "Avena",
        quantity: "50",
        unit: "g",
        per100: {},
      },
    ]);
    const [push] = await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "routine", name: "Push" })
      .returning({ id: s.catalogItems.id });
    const [route] = await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "route", name: "Casa → palestra" })
      .returning({ id: s.catalogItems.id });
    const colazione = await blocco("Colazione", { when: "time", at: "07:30" });
    await setBlockWhat(db, a, colazione, { items: [{ id: porridge, quantity: 2 }] });
    const palestra = await blocco("Palestra", { when: "time", at: "18:00" });
    await setBlockWhat(db, a, palestra, { items: [{ id: push!.id, quantity: null }] });
    const studio = await blocco("Studio", { when: "time", at: "21:00" });
    await setBlockWhat(db, a, studio, {
      kind: "activity",
      defaults: { category: "study" },
    });
    const tragitto = await blocco("Tragitto", {});
    await setBlockWhat(db, a, tragitto, { items: [{ id: route!.id, quantity: null }] });

    expect(await writeDayPlan(db, a, DAY, clock)).toBe(3);
    const written = await voci(a);
    const by = (id: string) => written.find((e) => e.blockId === id)!;
    expect(by(colazione)).toMatchObject({
      kind: "meal",
      status: "planned",
      itemId: porridge,
      source: "template",
    });
    // 07:30 in Rome on 11 Nov is 06:30 UTC.
    expect(by(colazione).startAt?.toISOString()).toBe("2026-11-11T06:30:00.000Z");
    const lines = await db
      .select()
      .from(s.entryLines)
      .where(eq(s.entryLines.entryId, by(colazione).id));
    expect(lines.map((l) => [l.name, Number(l.quantity)])).toEqual([["Avena", 50]]);
    const servings = await db
      .select()
      .from(s.entryValues)
      .where(eq(s.entryValues.entryId, by(colazione).id));
    expect(servings.find((v) => v.field === "servings")?.num).toBe("2.0000");
    expect(by(palestra)).toMatchObject({ kind: "session", itemId: push!.id });
    expect(by(studio)).toMatchObject({ kind: "activity" });
    // A tragitto makes no voce by itself: it stays a row of the Piano.
    expect(written.some((e) => e.blockId === tragitto)).toBe(false);
    expect(await voci(b)).toEqual([]);
  });

  it("never twice: a second read writes nothing, a voce removed («Togli») is not written again", async () => {
    expect(await writeDayPlan(db, a, DAY, clock)).toBe(0);
    const [one] = (await voci(a)).filter((e) => e.kind === "activity");
    await db
      .update(s.entries)
      .set({ deletedAt: new Date() })
      .where(eq(s.entries.id, one!.id));
    expect(await writeDayPlan(db, a, DAY, clock)).toBe(0);
    const live = await db
      .select()
      .from(s.entries)
      .where(
        and(
          eq(s.entries.userId, a.id),
          eq(s.entries.day, DAY),
          isNull(s.entries.deletedAt),
        ),
      );
    expect(live).toHaveLength(2);
  });

  it("PL-03: a voce he logged himself covers its blocco: nothing is written for it", async () => {
    const day = "2026-11-12";
    await db.insert(s.entries).values({
      userId: a.id,
      kind: "session",
      day,
      status: "done",
      itemId: (
        await db
          .select({ id: s.catalogItems.id })
          .from(s.catalogItems)
          .where(eq(s.catalogItems.name, "Push"))
      )[0]!.id,
    });
    expect(await writeDayPlan(db, a, day, clock)).toBe(2);
    const kinds = (
      await db
        .select({ kind: s.entries.kind, blockId: s.entries.blockId })
        .from(s.entries)
        .where(and(eq(s.entries.userId, a.id), eq(s.entries.day, day)))
    ).map((e) => [e.kind, e.blockId !== null]);
    expect(kinds.sort()).toEqual([
      ["activity", true],
      ["meal", true],
      ["session", false],
    ]);
  });
});
