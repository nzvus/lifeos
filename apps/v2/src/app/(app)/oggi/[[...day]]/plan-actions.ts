"use server";
/**
 * Oggi's «Cambia la giornata» and «Salta» (dossiers/day-templates.md slice
 * c): one day only. The session's owner, the arguments checked, then
 * core/plans (`ownedBy` there).
 */
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { setCycleSkip, setDayModel } from "@/core/plans";

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
