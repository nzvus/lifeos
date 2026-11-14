import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { cleanPins, dockRow, DOCK_MAX, readDock, saveDock } from "./dock";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("the dock he edits (PAT-99)", () => {
  it("pins are ids, once each, at most the dock's length", () => {
    expect(cleanPins(null)).toEqual([]);
    expect(cleanPins([id(1), "x", 3, id(1), id(2)])).toEqual([id(1), id(2)]);
    expect(cleanPins(Array.from({ length: 12 }, (_, i) => id(i)))).toHaveLength(DOCK_MAX);
  });

  it("the row: his pins in his order, then the guesses he did not pin, up to four chips", () => {
    const known = new Set([1, 2, 3, 4, 5, 6].map(id));
    expect(dockRow([], [id(1), id(2), id(3), id(4), id(5)], known)).toEqual(
      [1, 2, 3, 4].map(id),
    );
    expect(dockRow([id(5), id(2)], [id(1), id(2), id(3), id(4)], known)).toEqual(
      [5, 2, 1, 3].map(id),
    );
    // More pins than four: all of them, no guess.
    expect(dockRow([1, 2, 3, 4, 5].map(id), [id(6)], known)).toEqual(
      [1, 2, 3, 4, 5].map(id),
    );
    // A pin that is no longer an «assunzione» (archived) is skipped, not shown broken.
    expect(dockRow([id(9), id(2)], [], known)).toEqual([id(2)]);
  });

  describe("kept in his settings", () => {
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

    it("saved with no settings row yet, next to what prefs hold, and his alone", async () => {
      expect(await readDock(db, a)).toEqual([]);
      expect(await saveDock(db, a, [id(2), id(1)])).toEqual([id(2), id(1)]);
      await db
        .update(s.settings)
        .set({ prefs: { lunchFrom: 690, dock: [id(2), id(1)] } })
        .where(eq(s.settings.userId, a.id));
      await saveDock(db, a, [id(1)]);
      expect(await readDock(db, a)).toEqual([id(1)]);
      const [row] = await db
        .select({ p: s.settings.prefs })
        .from(s.settings)
        .where(eq(s.settings.userId, a.id));
      expect(row?.p).toEqual({ lunchFrom: 690, dock: [id(1)] });
      expect(await readDock(db, b)).toEqual([]);
      await saveDock(db, a, []);
      expect(await readDock(db, a)).toEqual([]);
    });
  });
});
