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
import { dayMinute } from "@/core/day";
import {
  checkEntry,
  createEntry,
  restoreEntry,
  setEntryStatus,
  trashEntry,
  type Status,
} from "@/core/entries";
import { logicalDay } from "@/core/engines/time";
import { kindRegistry } from "@/core/kinds";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: readonly Status[] = ["planned", "done", "skipped"];

export async function changeStatus(id: string, status: Status): Promise<Status | null> {
  if (!UUID.test(id) || !STATUSES.includes(status)) return null;
  const before = await setEntryStatus(await getDb(), await requireOwner(), id, status);
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
