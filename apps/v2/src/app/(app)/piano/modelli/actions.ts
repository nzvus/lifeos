"use server";
/** «Usa questo ciclo» (V-08): the session's owner, then core puts it in use from today. */
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readClock } from "@/core/day";
import { logicalDay } from "@/core/engines/time";
import { useCycle } from "@/core/plans";

export async function chooseCycle(id: string): Promise<void> {
  const owner = await requireOwner();
  const db = await getDb();
  const today = logicalDay(new Date(), (await readClock(db, owner)).clock);
  await useCycle(db, owner, id, today);
  revalidatePath("/piano", "layout");
}
