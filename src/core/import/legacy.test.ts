/**
 * Older files (versions 1–20, nested) replace what they hold (ADR-0052):
 * a genuine version-20 file, made by that version's exporter, round-trips;
 * what it lacks is kept, or named as lost when it hangs off what it replaces.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import { exportUserData, type UserExport } from "../export/export";
import type { Owner } from "../identity/owner";
import { exportV20 } from "../testing/export-v20";
import { createTestDb, createTestUser } from "../testing/test-db";
import { seedEverything } from "../testing/seed-all";
import { readExport, replaceAll } from "./replace";

let db: Db;
let close: () => Promise<void>;
let source: Owner;
let target: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  source = await createTestUser(db, "source@example.com");
  target = await createTestUser(db, "target@example.com");
});
afterEach(() => close());

/** Times version 20 did not carry: the database sets them on import. */
const NOT_IN_V20 = new Set([
  "tags.createdAt",
  "day_programs.updatedAt",
  "log_entry_left_out.createdAt",
]);

/** Live rows without ids, sorted, per table. */
function comparable(e: UserExport, skip: string[]) {
  const json = JSON.parse(JSON.stringify(e.tables)) as Record<
    string,
    Record<string, unknown>[]
  >;
  return Object.fromEntries(
    Object.entries(json)
      .filter(([k]) => !skip.includes(k))
      .map(([k, rows]) => [
        k,
        rows
          .filter((r) => !r.deletedAt) // versions ≤ 20 left the trash out
          .map((r) =>
            JSON.stringify(
              Object.fromEntries(
                Object.entries(r).filter(
                  ([c]) =>
                    !/^(id|.*Id|locale|assistant.*)$/.test(c) &&
                    !NOT_IN_V20.has(`${k}.${c}`),
                ),
              ),
            ),
          )
          .sort(),
      ]),
  );
}

describe("a version-20 file", () => {
  it("replaces everything it holds; what hangs off it and it lacks is lost, by name", async () => {
    await seedEverything(db, source);
    await seedEverything(db, target);
    const old = JSON.parse(JSON.stringify(await exportV20(db, source))) as unknown;
    const read = readExport(old);
    if (!read.ok) throw new Error(JSON.stringify(read.problems));
    expect(read.file.version).toBe(20);

    const done = await replaceAll(db, target, read.file);
    if (!done.ok) throw new Error(JSON.stringify(done.problems));
    // Version 20 never carried caffeine/creatine amounts or a program's moved days.
    expect(done.plan.lost.map((l) => l.table).sort()).toEqual([
      "ingredient_compounds",
      "program_overrides",
    ]);
    expect(done.plan.kept).toEqual([]);

    const lacks = ["ingredient_compounds", "program_overrides"];
    expect(comparable(await exportUserData(db, target), lacks)).toEqual(
      comparable(await exportUserData(db, source), lacks),
    );
  });

  it("clears links into the trash, which versions ≤ 20 left out", async () => {
    await seedEverything(db, source);
    const old = JSON.parse(JSON.stringify(await exportV20(db, source))) as {
      meals: { id: string }[];
      log: { mealId: string | null }[];
      training: {
        programs: { slots: { items: { routineId: string | null }[] }[] }[];
        routines: unknown[];
      };
    };
    old.meals = []; // as if the meal were in the trash: its entries still point at it
    old.training.routines = []; // the program's slot item goes with its routine
    const read = readExport(old);
    if (!read.ok) throw new Error(JSON.stringify(read.problems));
    expect(read.file.repaired).toEqual(
      expect.arrayContaining([
        {
          table: "log_entries",
          column: "mealId",
          target: "meals",
          action: "unlinked",
          rows: 1,
        },
        {
          table: "program_slot_items",
          column: "routineId",
          target: "routines",
          action: "removed",
          rows: 1,
        },
      ]),
    );
    expect(read.file.tables.get("log_entries")!.every((e) => e.mealId === null)).toBe(
      true,
    );
    const done = await replaceAll(db, target, read.file);
    expect(done.ok).toBe(true);
  });

  it("keeps the areas an older version did not have", async () => {
    await seedEverything(db, source);
    await seedEverything(db, target);
    const old = JSON.parse(JSON.stringify(await exportV20(db, source))) as Record<
      string,
      unknown
    >;
    // As a version-12 file: no money, mind, closures, goals, check-ins, corrections.
    for (const k of [
      "money",
      "mind",
      "dayClosures",
      "goals",
      "weekCheckins",
      "energyCorrections",
    ])
      delete old[k];
    old.version = 12;
    const read = readExport(old);
    if (!read.ok) throw new Error(JSON.stringify(read.problems));
    const done = await replaceAll(db, target, read.file);
    if (!done.ok) throw new Error(JSON.stringify(done.problems));
    expect(done.plan.kept).toEqual(
      expect.arrayContaining(["money_movements", "money_lines", "day_checkins", "goals"]),
    );
    const after = await exportUserData(db, target);
    expect(after.tables.money_movements).toHaveLength(1);
    // A kept line that pointed at a replaced product loses only the link.
    expect(after.tables.money_lines![0]).toMatchObject({
      productId: null,
      purchaseId: null,
    });
  });
});
