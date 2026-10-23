/**
 * The converter on v1's "everything" fixture (one row in every table, made by
 * v1's seedEverything and exporter): it reads every column that holds a value
 * or says why not, and its file loads into the real schema.
 */
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as s from "../db/schema";
import { createTestDb, createTestUser, type TestDb } from "../db/test-db";
import type { V1Export, V1Row } from "./context";
import { convert, ConvertError } from "./convert";
import { loadFile, parentsFirst, replaceFile } from "./load";

const fixture = (): V1Export =>
  JSON.parse(
    readFileSync(new URL("./fixtures/v1-everything.json", import.meta.url), "utf8"),
  ) as V1Export;
const NOW = new Date("2026-10-17T12:00:00Z");

/** Columns the converter does not read on purpose, and why. */
const NOT_READ: Record<string, string> = {
  "*.updatedAt": "v2 rows get their own",
  "*.id": "read through the maps (kept as the v2 id)",
  "user_settings.assistantKeyLast4": "the assistant is parked",
  "user_settings.assistantModel": "the assistant is parked",
  "user_settings.energyCorrection": "learnt by E4 (counted in the report)",
  "energy_corrections.*": "learnt by E4 (counted in the report)",
  "assistant_conversations.*": "parked (counted in the report)",
  "assistant_messages.*": "parked (counted in the report)",
  "log_entry_items.fiberTypes": "kept on the food: a snapshot holds numbers",
  "log_entry_items.origin": "kept on the food: a snapshot holds numbers",
  "batch_lines.fiberTypes": "kept on the food: a snapshot holds numbers",
  "batch_lines.origin": "kept on the food: a snapshot holds numbers",
  "log_entry_left_out.createdAt": "the flag is what matters",
  "money_lines.createdAt": "its movement has the time",
  "program_overrides.createdAt": "a decision has its own",
  "program_skips.createdAt": "a decision has its own",
  "week_checkins.createdAt": "a decision has its own",
  "goals.createdAt": "the history is by since_day",
  "sleep_logs.createdAt": "kept",
  "products.createdAt": "kept",
  "ingredients.packagePriceCents":
    "a price observation (with the refined layer, from it)",
  "ingredients.packageSize": "a price observation (with the refined layer, from it)",
};

function traced(v1: V1Export): { v1: V1Export; read: Set<string> } {
  const read = new Set<string>();
  const tables: Record<string, V1Row[]> = {};
  for (const [t, rows] of Object.entries(v1.tables))
    tables[t] = (rows ?? []).map(
      (r) =>
        new Proxy(r, {
          get(target, key) {
            if (typeof key === "string") read.add(`${t}.${key}`);
            return target[key as string];
          },
        }),
    );
  return { v1: { ...v1, tables }, read };
}

describe("convert", () => {
  it("refuses another format or an older version", () => {
    expect(() => convert({ ...fixture(), version: 20 })).toThrow(ConvertError);
    expect(() => convert({ ...fixture(), format: "x" })).toThrow(ConvertError);
  });

  it("reads every v1 column that holds a value, or says why not", () => {
    const { v1, read } = traced(fixture());
    convert(v1, NOW);
    const missing: string[] = [];
    for (const [t, rows] of Object.entries(fixture().tables))
      for (const r of rows ?? [])
        for (const [k, v] of Object.entries(r)) {
          if (
            v === null ||
            v === undefined ||
            v === "" ||
            (Array.isArray(v) && v.length === 0)
          )
            continue;
          const key = `${t}.${k}`;
          if (read.has(key) || NOT_READ[key] || NOT_READ[`*.${k}`] || NOT_READ[`${t}.*`])
            continue;
          missing.push(key);
        }
    expect([...new Set(missing)]).toEqual([]);
  });

  it("is repeatable: the same export gives the same file", () => {
    expect(JSON.stringify(convert(fixture(), NOW))).toBe(
      JSON.stringify(convert(fixture(), NOW)),
    );
  });

  it("keeps the snapshot exactly and the ids of v1 rows", () => {
    const v1 = fixture();
    const f = convert(v1, NOW);
    const item = v1.tables["log_entry_items"]![0]!;
    const values = f.tables.entry_line_values.filter((v) => v.lineId === item["id"]);
    expect(values.find((v) => v.field === "kcal")?.num).toBe(
      String(Number(item["kcal"])),
    );
    expect(
      f.tables.entries.some((e) => e.id === v1.tables["log_entries"]![0]!["id"]),
    ).toBe(true);
  });

  it("reports what it drops and why", () => {
    const r = convert(fixture(), NOW).report;
    const why = (t: string) => r.dropped.find((d) => d.table === t)?.why;
    expect(why("energy_corrections")).toMatch(/E4/);
    expect(why("assistant_conversations, assistant_messages")).toMatch(/parked/);
    expect(r.from).toEqual({
      format: "lifeos-export",
      version: 21,
      exportedAt: fixture().exportedAt,
      refined: false,
    });
  });
});

describe("the refined copy's identity layer (ADR-0055)", () => {
  const ing = (id: string, name: string, kcal: string, salt = "0.01") => ({
    id,
    name,
    kcal,
    protein: "13",
    carbs: "60",
    sugars: "1",
    fat: "7",
    saturatedFat: "1.2",
    fiber: "10",
    salt,
    unit: "g",
    createdAt: "2026-10-01T10:00:00Z",
    deletedAt: null,
  });
  const base = (): V1Export => ({
    format: "lifeos-export",
    version: 21,
    exportedAt: "2026-10-16T20:00:00Z",
    account: null,
    tables: {
      ingredients: [
        ing("i1", "Gnocchi", "160"),
        ing("i2", "Gnocchi Nonna Mia", "160", "0.9"),
      ],
    },
    _v2: {
      foods: [
        {
          id: "f1",
          name: "Gnocchi di patate",
          group: "starch",
          from: ["i1"],
          valuesFrom: "i1",
          archived: false,
        },
      ],
      products: [{ id: "p1", food: "f1", brand: "Nonna Mia", label: "i2", from: ["i2"] }],
      formats: [
        {
          id: "x1",
          product: "p1",
          name: "500 g",
          size: 500,
          unit: "g",
          barcode: "800123",
          from: "i2",
          shape: false,
          ownValues: null,
        },
      ],
      price_observations: [
        {
          format: "x1",
          shop: "Lidl",
          day: "2026-10-02",
          cents: 129,
          qty: 500,
          unit: "g",
          source: "v1",
        },
      ],
      pointers: {},
      goals: [
        {
          id: "steps",
          what: "passi",
          target: 8000,
          unit: "passi",
          per: "day",
          days: "weekdays",
          source: "the developer",
        },
      ],
      meal_merges: [],
    },
  });
  it("a product holds only what its label says differently; ingredients land on the most specific item", () => {
    const f = convert(base(), NOW);
    const of = (id: string) =>
      Object.fromEntries(
        f.tables.catalog_values
          .filter((v) => v.itemId === id)
          .map((v) => [v.field, v.num ?? v.text ?? v.bool]),
      );
    expect(of("p1")).toEqual({ salt: "0.9" });
    expect(of("x1")).toMatchObject({ size: "500", barcode: "800123" });
    expect(of("f1")).toMatchObject({ kcal: "160", salt: "0.01", group: "starch" });
    expect(f.tables.price_observations).toEqual([
      {
        formatId: "x1",
        shop: "Lidl",
        day: "2026-10-02",
        cents: 129,
        packageQty: "500",
        unit: "g",
        source: "import",
      },
    ]);
    expect(f.tables.goals.at(-1)).toMatchObject({ target: "at_least", value: "8000" });
  });
});

describe("parentsFirst", () => {
  it("orders rows so a parent comes before its children; a loop is an error", () => {
    const rows = [
      { id: "c", parentId: "b" },
      { id: "b", parentId: "a" },
      { id: "a", parentId: null },
    ];
    expect(parentsFirst(rows, ["parentId"]).map((r) => r.id)).toEqual(["a", "b", "c"]);
    expect(() =>
      parentsFirst(
        [
          { id: "x", parentId: "y" },
          { id: "y", parentId: "x" },
        ],
        ["parentId"],
      ),
    ).toThrow(/loop/);
  });
});

describe("loading the file", () => {
  let db: TestDb;
  let close: () => Promise<void>;
  beforeAll(async () => ({ db, close } = await createTestDb()));
  afterAll(() => close());

  it("every row of the fixture loads into the real schema, owned by the importer", async () => {
    const owner = await createTestUser(db, "importer@example.test");
    const f = convert(fixture(), NOW);
    await loadFile(db as never, f, owner);
    const entries = await db.select().from(s.entries).where(eq(s.entries.userId, owner));
    expect(entries.length).toBe(f.tables.entries.length);
    const items = await db
      .select()
      .from(s.catalogItems)
      .where(eq(s.catalogItems.userId, owner));
    expect(items.length).toBe(f.tables.catalog_items.length);
    expect(f.tables.entries.length).toBeGreaterThan(10);
  });

  it("replacing: the owner's rows out and the file in, one transaction; others untouched", async () => {
    const owner = (
      await db
        .select({ id: s.user.id })
        .from(s.user)
        .where(eq(s.user.email, "importer@example.test"))
    )[0]!.id;
    const bystander = await createTestUser(db, "bystander@example.test");
    await db
      .insert(s.catalogItems)
      .values({ userId: bystander, catalog: "food", name: "Mela" });
    const f = convert(fixture(), NOW);
    // Something of the owner's that the file does not have goes.
    await db
      .insert(s.catalogItems)
      .values({ userId: owner, catalog: "food", name: "Solo in v2" });
    await replaceFile(db as never, f, owner);
    const mine = await db
      .select()
      .from(s.catalogItems)
      .where(eq(s.catalogItems.userId, owner));
    expect(mine.length).toBe(f.tables.catalog_items.length);
    expect(mine.some((i) => i.name === "Solo in v2")).toBe(false);
    const entries = await db.select().from(s.entries).where(eq(s.entries.userId, owner));
    expect(entries.length).toBe(f.tables.entries.length);
    expect(
      (await db.select().from(s.catalogItems).where(eq(s.catalogItems.userId, bystander)))
        .length,
    ).toBe(1);
    // A file that breaks the schema replaces nothing: what was there stays.
    const broken = convert(fixture(), NOW);
    broken.tables.entries[0] = { ...broken.tables.entries[0]!, status: "nope" as never };
    await expect(replaceFile(db as never, broken, owner)).rejects.toThrow();
    expect(
      (await db.select().from(s.entries).where(eq(s.entries.userId, owner))).length,
    ).toBe(f.tables.entries.length);
  });

  it("the same file loads again for another person: ids are not shared across owners", async () => {
    const other = await createTestUser(db, "other@example.test");
    const f = convert(fixture(), NOW);
    await expect(loadFile(db as never, f, other)).rejects.toThrow();
  });
});
