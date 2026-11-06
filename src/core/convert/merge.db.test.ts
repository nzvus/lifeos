import { readFileSync } from "node:fs";
import { and, eq, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import type { V1Export } from "./context";
import { convert } from "./convert";
import { loadFile } from "./load";
import { newFromV1, readHave } from "./merge";

const v1 = (): V1Export =>
  JSON.parse(
    readFileSync(new URL("./fixtures/v1-everything.json", import.meta.url), "utf8"),
  ) as V1Export;
const NOW = new Date("2026-10-19T12:00:00Z");

describe("«Porta i dati da v1»: only what v2 does not have", () => {
  // Two databases: the converter keeps v1's ids, and an id is one row in a database.
  let db: Db;
  let db2: Db;
  const closes: (() => Promise<void>)[] = [];
  let a: Owner;
  let b: Owner;
  beforeAll(async () => {
    const t = await createTestDb();
    const t2 = await createTestDb();
    db = t.db as unknown as Db;
    db2 = t2.db as unknown as Db;
    closes.push(t.close, t2.close);
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t2.db, "b@example.test"));
  });
  afterAll(() => Promise.all(closes.map((c) => c())));

  it("a second time adds nothing", async () => {
    const file = convert(v1(), NOW);
    await loadFile(db as never, file, a.id);
    const again = newFromV1(convert(v1(), NOW), await readHave(db as never, a.id));
    expect(again.summary.added).toEqual({});
    expect(Object.values(again.file.report.counts).every((n) => n === 0)).toBe(true);
  });

  it("keeps v2's day of a kind, points at v2's food of the same name, and loads", async () => {
    const file = convert(v1(), NOW);
    const meal = file.tables.entries.find((e) => e.kind === "meal" && !e.parentId)!;
    const line = file.tables.entry_lines.find((l) => l.itemId)!;
    const food = file.tables.catalog_items.find((i) => i.id === line.itemId)!;
    // v2 already has a meal on that day, and a food with that name (its own id).
    const [mine] = await db2
      .insert(s.catalogItems)
      .values({ userId: b.id, catalog: food.catalog, name: food.name.toUpperCase() })
      .returning({ id: s.catalogItems.id });
    await db2.insert(s.entries).values({
      userId: b.id,
      kind: "meal",
      day: meal.day,
      status: "done",
    });
    const { file: add, summary } = newFromV1(file, await readHave(db2 as never, b.id));
    expect(summary.kept["meal"]).toBeGreaterThan(0);
    expect(add.tables.entries.some((e) => e.kind === "meal" && e.day === meal.day)).toBe(
      false,
    );
    expect(summary.byName).toBeGreaterThan(0);
    expect(add.tables.catalog_items.some((i) => i.id === food.id)).toBe(false);
    await loadFile(db2 as never, add, b.id);
    const lines = await db2
      .select({ itemId: s.entryLines.itemId })
      .from(s.entryLines)
      .where(and(eq(s.entryLines.userId, b.id), eq(s.entryLines.itemId, mine!.id)));
    const usesTwin = add.tables.entry_lines.some((l) => l.itemId === mine!.id);
    expect(lines.length > 0).toBe(usesTwin);
    const live = await db2
      .select({ id: s.entries.id })
      .from(s.entries)
      .where(and(eq(s.entries.userId, b.id), isNull(s.entries.parentId)));
    expect(live.length).toBe(1 + Object.values(summary.added).reduce((x, y) => x + y, 0));
  });
});
