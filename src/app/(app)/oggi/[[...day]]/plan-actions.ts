"use server";
/**
 * Oggi's «Salta» (PL-43): one ciclo's step skipped this day only, or back. The session's owner,
 * the arguments checked, then core/plans (`ownedBy` there). «Cambia la giornata» and «Salva
 * come modello» went with the day models (PL-44, PL-61; change 2026-11-07-piano).
 */
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { setCycleSkip } from "@/core/plans";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function skipStep(
  day: string,
  cycleId: string,
  skipped: boolean,
): Promise<void> {
  if (!ISO.test(day) || !UUID.test(cycleId)) return;
  await setCycleSkip(await getDb(), await requireOwner(), day, cycleId, skipped);
  revalidatePath("/", "layout");
}
