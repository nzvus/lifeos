"use server";
/**
 * Oggi's «Cambia la giornata» and «Salta» (dossiers/day-templates.md slice
 * c): one day only; «Salva come modello»: the day as a new model. The session's owner, the arguments checked, then
 * core/plans (`ownedBy` there).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { F } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDay } from "@/core/day";
import { createModel, saveBlock, setCycleSkip, setDayModel } from "@/core/plans";
import { blocksFromDay } from "@/features/plan/from-day";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** The day's model; "" goes back to the week's. */
export async function changeDayModel(day: string, data: FormData): Promise<void> {
  const id = String(data.get("model") ?? "");
  if (!ISO.test(day) || (id !== "" && !UUID.test(id))) return;
  await setDayModel(await getDb(), await requireOwner(), day, id === "" ? null : id);
  revalidatePath("/oggi", "layout");
  revalidatePath("/piano", "layout");
}

export async function skipStep(
  day: string,
  cycleId: string,
  skipped: boolean,
): Promise<void> {
  if (!ISO.test(day) || !UUID.test(cycleId)) return;
  await setCycleSkip(await getDb(), await requireOwner(), day, cycleId, skipped);
  revalidatePath("/oggi", "layout");
  revalidatePath("/piano", "layout");
}

/** «Salva come modello»: a new day model from the day's meals and sessions; opens its editor. */
export async function saveDayAsModel(day: string): Promise<void> {
  if (!ISO.test(day)) return;
  const owner = await requireOwner();
  const db = await getDb();
  const d = await loadDay(db, owner, day, await ownerClock());
  const blocks = blocksFromDay([...d.timed, ...d.untimed]);
  if (blocks.length === 0) return;
  const id = await createModel(db, owner, "Come " + F.day(day), null);
  for (const b of blocks) await saveBlock(db, owner, id, null, b);
  revalidatePath("/piano", "layout");
  redirect("/piano/modello/" + id);
}
