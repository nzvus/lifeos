"use server";
/**
 * Oggi's row actions (V-01): tick a planned entry done, skip it, remove it
 * to the trash, and their Undo. Each is a public endpoint: the session's
 * owner, the arguments checked, then core's repository (ownedBy). They
 * answer what Undo needs: the status it had, or whether it happened.
 */
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { restoreEntry, setEntryStatus, trashEntry, type Status } from "@/core/entries";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
