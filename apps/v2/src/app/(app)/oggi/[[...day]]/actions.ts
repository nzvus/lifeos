"use server";
/**
 * Oggi's row actions (V-01): tick a planned entry done, skip it, remove it
 * to the trash, and their Undo. Each is a public endpoint: the session's
 * owner, the arguments checked, then core's repository (ownedBy). They
 * answer what Undo needs: the status it had, or whether it happened.
 */
import { revalidatePath } from "next/cache";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { dayMinute, setClosure, type Closure } from "@/core/day";
import {
  checkEntry,
  createEntry,
  restoreEntry,
  setEntryStatus,
  trashEntry,
  trashPlanned,
  type Status,
} from "@/core/entries";
import { logicalDay } from "@/core/engines/time";
import { recomputeWeekTargets } from "@/core/energy";
import { kindRegistry } from "@/core/kinds";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: readonly Status[] = ["planned", "done", "skipped"];

export async function changeStatus(id: string, status: Status): Promise<Status | null> {
  if (!UUID.test(id) || !STATUSES.includes(status)) return null;
  const { clock } = await ownerClock();
  const at = new Date();
  // «Ora della spunta»: a planned instant entry of today ticked done takes now.
  const before = await setEntryStatus(await getDb(), await requireOwner(), id, status, {
    at,
    today: logicalDay(at, clock),
  });
  revalidatePath("/oggi", "layout");
  return before;
}

export async function removeEntry(id: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const done = await trashEntry(await getDb(), await requireOwner(), id);
  revalidatePath("/oggi", "layout");
  return done;
}

export async function bringBack(id: string): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const done = await restoreEntry(await getDb(), await requireOwner(), id);
  revalidatePath("/oggi", "layout");
  return done;
}

/** «Togli i previsti (n)»: the day's planned rows to the trash; answers which went, for Undo. */
export async function removePlanned(ids: string[]): Promise<string[]> {
  if (!Array.isArray(ids) || ids.length > 200 || !ids.every((i) => UUID.test(i)))
    return [];
  const gone = await trashPlanned(await getDb(), await requireOwner(), ids);
  revalidatePath("/oggi", "layout");
  return gone;
}

/** Undo of «Togli i previsti»: each one back. */
export async function bringBackAll(ids: string[]): Promise<boolean> {
  if (!Array.isArray(ids) || ids.length > 200 || !ids.every((i) => UUID.test(i)))
    return false;
  const db = await getDb();
  const owner = await requireOwner();
  for (const id of ids) await restoreEntry(db, owner, id);
  revalidatePath("/oggi", "layout");
  return true;
}

/** «Chiudi la giornata» (S-T28): complete, partial, or reopened (null); never a day still to come. */
export async function closeDay(day: string, state: Closure | null): Promise<boolean> {
  if (!ISO.test(day) || ![null, "complete", "partial"].includes(state)) return false;
  const { clock } = await ownerClock();
  if (day > logicalDay(new Date(), clock)) return false;
  await setClosure(await getDb(), await requireOwner(), day, state);
  revalidatePath("/oggi", "layout");
  return true;
}

/** «+250 ml», «+500 ml» (kinds.md: water is quick): a water entry, now today, else the day only. */
export async function addWater(day: string, ml: 250 | 500): Promise<void> {
  if (!ISO.test(day) || (ml !== 250 && ml !== 500)) return;
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const now = new Date();
  const today = logicalDay(now, clock);
  if (day > today) return;
  const checked = checkEntry(
    kindRegistry().get("water"),
    {
      day,
      status: "done",
      startMin: day === today ? dayMinute(now, day, clock) : null,
      endMin: null,
      values: { ml: String(ml) },
      note: "",
    },
    clock,
  );
  if (!checked.ok) return;
  await createEntry(db, owner, checked.entry);
  revalidatePath("/oggi", "layout");
}

/** «Ricalcola»: this week's automatic targets made again (core/energy; a v1 check-in stays). */
export async function recomputeTargets(): Promise<void> {
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  await recomputeWeekTargets(db, owner, logicalDay(new Date(), clock), clock);
  revalidatePath("/oggi", "layout");
}
