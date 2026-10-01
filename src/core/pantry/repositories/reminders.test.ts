/** Tests for reminders (ADR-0017): by hand (once / repeating) and derived. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import {
  completeReminder,
  createReminder,
  deleteReminder,
  derivedReminders,
  listReminders,
  restoreReminder,
} from "./reminders";
import type { PantryItem } from "./stock";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
});
afterEach(() => close());

describe("reminders set by hand", () => {
  it("a one-off closes; a repeating one comes back after N days", async () => {
    const once = await createReminder(db, me, {
      text: "Comprare il sale",
      dueDay: "2026-10-02",
      repeatDays: null,
    });
    const weekly = await createReminder(db, me, {
      text: "Pulire il frigo",
      dueDay: "2026-10-04",
      repeatDays: 7,
    });
    if (!once.ok || !weekly.ok) throw new Error("setup failed");
    expect((await listReminders(db, me)).map((r) => r.text)).toEqual([
      "Comprare il sale",
      "Pulire il frigo",
    ]);

    await completeReminder(db, me, once.value.id, "2026-10-02");
    await completeReminder(db, me, weekly.value.id, "2026-10-05");
    expect((await listReminders(db, me)).map((r) => [r.text, r.dueDay])).toEqual([
      ["Pulire il frigo", "2026-10-12"],
    ]);
  });

  it("are mine only; the trash takes them and gives them back", async () => {
    const r = await createReminder(db, me, { text: "X", dueDay: null, repeatDays: null });
    if (!r.ok) throw new Error("setup failed");
    expect(await listReminders(db, other)).toEqual([]);
    expect((await completeReminder(db, other, r.value.id, "2026-10-01")).ok).toBe(false);
    expect((await deleteReminder(db, me, r.value.id)).ok).toBe(true);
    expect(await listReminders(db, me)).toEqual([]);
    expect((await restoreReminder(db, me, r.value.id)).ok).toBe(true);
    expect(await listReminders(db, me)).toHaveLength(1);
  });
});

describe("derivedReminders", () => {
  const item = (name: string, quantity: string, daysLeft: number | null): PantryItem => ({
    kind: "ingredient",
    id: name,
    name,
    unit: "g",
    quantity,
    dailyUse: daysLeft === null ? null : "10",
    daysLeft,
  });

  it("gone, running out soon, last portion — nothing else", () => {
    const out = derivedReminders(
      [
        item("Avena", "0", 0),
        item("Riso", "30", 3),
        item("Pasta", "900", 30),
        item("Sale", "50", null),
      ],
      [
        { id: "b1", label: "Chili", portionsLeft: "1" },
        { id: "b2", label: "Riso e pollo", portionsLeft: "3" },
      ],
    );
    expect(out).toEqual([
      { kind: "gone", id: "Avena", name: "Avena" },
      { kind: "runOut", id: "Riso", name: "Riso", daysLeft: 3 },
      { kind: "portions", id: "b1", name: "Chili", portionsLeft: "1" },
    ]);
  });
});
