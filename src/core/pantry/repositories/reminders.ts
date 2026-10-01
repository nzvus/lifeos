/**
 * core/pantry/repositories/reminders.ts — reminders (ADR-0017): the ones set
 * by hand ("clean the fridge", every 7 days), stored; and the derived ones,
 * computed from the pantry and the batches, never stored (derivedReminders).
 *
 * Doing a repeating reminder moves its due day forward; doing a one-off
 * marks it done. Delete = trash (ADR-0015).
 *
 * Tested in: reminders.test.ts.
 */
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import type { Db } from "../../db/client";
import { reminders } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { addDays } from "../../shared/dates";
import { Big } from "../../shared/decimal";
import { fail, ok, type Result } from "../../shared/result";
import { live } from "../../shared/trash";
import type { ReminderInput } from "../validation";
import type { PantryItem } from "./stock";

export type Reminder = typeof reminders.$inferSelect;

/** My open reminders: not done, soonest first, those without a day last. */
export async function listReminders(db: Db, owner: Owner): Promise<Reminder[]> {
  const rows = await db
    .select()
    .from(reminders)
    .where(and(ownedBy(reminders, owner), live(reminders), isNull(reminders.doneAt)))
    .orderBy(asc(reminders.dueDay), asc(reminders.createdAt));
  // Postgres sorts nulls last in ascending order already; kept explicit here.
  return [...rows.filter((r) => r.dueDay), ...rows.filter((r) => !r.dueDay)];
}

export async function createReminder(
  db: Db,
  owner: Owner,
  input: ReminderInput,
): Promise<Result<{ id: string }>> {
  const [row] = await db
    .insert(reminders)
    .values({ ...input, userId: owner.id })
    .returning({ id: reminders.id });
  return ok({ id: row!.id });
}

/**
 * Done. A repeating reminder comes back `repeatDays` after `today`; a
 * one-off is closed.
 */
export async function completeReminder(
  db: Db,
  owner: Owner,
  id: string,
  today: string,
): Promise<Result<null>> {
  const [r] = await db
    .select()
    .from(reminders)
    .where(and(ownedBy(reminders, owner), live(reminders), eq(reminders.id, id)));
  if (!r) return fail({ _form: "not_found" });
  await db
    .update(reminders)
    .set(r.repeatDays ? { dueDay: addDays(today, r.repeatDays) } : { doneAt: new Date() })
    .where(and(ownedBy(reminders, owner), eq(reminders.id, id)));
  return ok(null);
}

export async function deleteReminder(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const done = await db
    .update(reminders)
    .set({ deletedAt: new Date() })
    .where(and(ownedBy(reminders, owner), live(reminders), eq(reminders.id, id)))
    .returning({ id: reminders.id });
  return done.length ? ok(null) : fail({ _form: "not_found" });
}

export async function restoreReminder(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const done = await db
    .update(reminders)
    .set({ deletedAt: null })
    .where(
      and(
        ownedBy(reminders, owner),
        isNotNull(reminders.deletedAt),
        eq(reminders.id, id),
      ),
    )
    .returning({ id: reminders.id });
  return done.length ? ok(null) : fail({ _form: "not_found" });
}

export type DerivedReminder =
  | { kind: "runOut"; id: string; name: string; daysLeft: number }
  | { kind: "gone"; id: string; name: string }
  | { kind: "portions"; id: string; name: string; portionsLeft: string };

/**
 * Reminders that come from the data, never stored: food or products that
 * are gone or run out within `horizonDays`, and batches down to their last
 * portion. The UI words them.
 */
export function derivedReminders(
  pantry: readonly PantryItem[],
  batchList: readonly { id: string; label: string; portionsLeft: string }[],
  horizonDays = 3,
): DerivedReminder[] {
  const out: DerivedReminder[] = [];
  for (const i of pantry) {
    if (new Big(i.quantity).eq(0)) out.push({ kind: "gone", id: i.id, name: i.name });
    else if (i.daysLeft !== null && i.daysLeft <= horizonDays)
      out.push({ kind: "runOut", id: i.id, name: i.name, daysLeft: i.daysLeft });
  }
  for (const b of batchList) {
    const left = new Big(b.portionsLeft);
    if (left.gt(0) && left.lte(1))
      out.push({
        kind: "portions",
        id: b.id,
        name: b.label,
        portionsLeft: b.portionsLeft,
      });
  }
  return out;
}
