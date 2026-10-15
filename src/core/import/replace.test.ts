/**
 * The replace (ADR-0052 A): export → replace another account → export gives
 * the same data, ids aside; a bad file changes nothing; nobody else is touched.
 */
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import { ingredients, userSettings } from "../db/schema";
import { exportUserData, type UserExport } from "../export/export";
import type { Owner } from "../identity/owner";
import { createTestDb, createTestUser } from "../testing/test-db";
import { seedEverything } from "../testing/seed-all";
import { planReplace, readExport, replaceAll, type ImportFile } from "./replace";

let db: Db;
let close: () => Promise<void>;
let source: Owner;
let target: Owner;
let bystander: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  source = await createTestUser(db, "source@example.com");
  target = await createTestUser(db, "target@example.com");
  bystander = await createTestUser(db, "bystander@example.com");
});
afterEach(() => close());

/** A file as it would arrive: through JSON. */
const asFile = (e: UserExport) => JSON.parse(JSON.stringify(e)) as unknown;

function read(raw: unknown): ImportFile {
  const r = readExport(raw);
  if (!r.ok) throw new Error(JSON.stringify(r.problems));
  return r.file;
}

/** The data without ids, and without what a replace keeps from the account. */
function comparable(e: UserExport) {
  const strip = (x: unknown): unknown =>
    Array.isArray(x)
      ? x.map(strip)
      : x && typeof x === "object"
        ? Object.fromEntries(
            Object.entries(x)
              .filter(([k]) => !/^(id|.*Id|locale|assistant.*)$/.test(k))
              .map(([k, v]) => [k, strip(v)]),
          )
        : x;
  const tables = strip(JSON.parse(JSON.stringify(e.tables))) as Record<string, unknown[]>;
  // New ids reorder rows ordered by id: compare as sorted sets.
  return Object.fromEntries(
    Object.entries(tables).map(([k, rows]) => [
      k,
      rows.map((r) => JSON.stringify(r)).sort(),
    ]),
  );
}

describe("replaceAll", () => {
  it("round-trips every table, renewing ids and keeping references", async () => {
    await seedEverything(db, source);
    await seedEverything(db, target); // replaced, not added to
    await seedEverything(db, bystander);
    const original = await exportUserData(db, source);
    const at = new Date("2026-10-15T10:00:00Z");
    const before = await exportUserData(db, bystander, at);

    const done = await replaceAll(db, target, read(asFile(original)));
    expect(done.ok ? "ok" : JSON.stringify(done.problems)).toBe("ok");

    const again = await exportUserData(db, target);
    expect(comparable(again)).toEqual(comparable(original));
    // New ids: the source's rows are still in place, nothing collided.
    expect(again.tables.meals![0]!.id).not.toBe(original.tables.meals![0]!.id);
    expect(again.tables.meal_items![0]!.mealId).toBe(again.tables.meals![0]!.id);
    expect(await exportUserData(db, bystander, at)).toEqual(before);
  });

  it("can replace an account with its own file while it is in place", async () => {
    await seedEverything(db, source);
    const original = await exportUserData(db, source);
    expect((await replaceAll(db, source, read(asFile(original)))).ok).toBe(true);
    expect(comparable(await exportUserData(db, source))).toEqual(comparable(original));
  });

  it("keeps the account's language and assistant key", async () => {
    await seedEverything(db, source);
    await seedEverything(db, target);
    await db
      .update(userSettings)
      .set({ locale: "en", assistantKeyEnc: "TARGET-KEY" })
      .where(eq(userSettings.userId, target.id));
    await replaceAll(db, target, read(asFile(await exportUserData(db, source))));
    const [s] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, target.id));
    expect(s).toMatchObject({
      locale: "en",
      assistantKeyEnc: "TARGET-KEY",
      theme: "quaderno",
    });
  });

  it("plans: rows now and after per table, nothing written", async () => {
    await seedEverything(db, source);
    const file = read(asFile(await exportUserData(db, source)));
    const plan = await planReplace(db, target, file);
    expect(plan.lost).toEqual([]);
    expect(plan.kept).toEqual([]);
    expect(plan.replaced.find((r) => r.table === "ingredients")).toEqual({
      table: "ingredients",
      now: 0,
      after: 2,
    });
    expect(
      await db.select().from(ingredients).where(eq(ingredients.userId, target.id)),
    ).toEqual([]);
  });

  it("rolls everything back when a row breaks a rule", async () => {
    await seedEverything(db, source);
    await seedEverything(db, target);
    const file = asFile(await exportUserData(db, source)) as UserExport;
    file.tables.sets![0]!.rir = 9; // 0–4 only
    const before = await exportUserData(db, target);
    const r = await replaceAll(db, target, read(file));
    expect(r).toEqual({
      ok: false,
      problems: [{ code: "rejected", detail: "sets_rir_ck" }],
    });
    expect(await exportUserData(db, target)).toEqual({
      ...before,
      exportedAt: expect.any(String),
    });
  });
});

describe("readExport", () => {
  it("names what is wrong with a file before anything is written", async () => {
    await seedEverything(db, source);
    const good = asFile(await exportUserData(db, source)) as UserExport;
    const problems = (raw: unknown) => {
      const r = readExport(raw);
      return r.ok ? [] : r.problems;
    };
    expect(problems({ hello: 1 })).toEqual([{ code: "not_export" }]);
    expect(problems({ ...good, version: 99 })).toEqual([
      { code: "newer_version", version: 99 },
    ]);

    const broken = structuredClone(good);
    broken.tables.nope = [];
    delete broken.tables.sets;
    broken.tables.meals![0]!.colour = "red";
    broken.tables.meal_items![0]!.ingredientId = "not-in-the-file";
    broken.tables.meal_items![0]!.quantity = "80.123"; // the column keeps 2 decimals
    expect(problems(broken)).toEqual([
      { code: "unknown_column", table: "meals", column: "colour" },
      { code: "invalid_number", table: "meal_items", row: 0, column: "quantity" },
      { code: "unknown_table", table: "nope" },
      { code: "missing_table", table: "sets" },
      {
        code: "dangling_ref",
        table: "meal_items",
        row: 0,
        column: "ingredientId",
        target: "ingredients",
      },
    ]);
  });
});
