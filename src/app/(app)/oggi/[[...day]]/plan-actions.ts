"use server";
/**
 * Oggi's «Salta» (PL-43): one ciclo's step skipped this day only, or back. The session's owner,
 * the arguments checked, then core/plans (`ownedBy` there). «Cambia la giornata» and «Salva
 * come modello» went with the day models (PL-44, PL-61; change 2026-11-07-piano).
 */
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { setCycleOverride, setCycleSkip } from "@/core/plans";

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

/**
 * «Questa volta» on a ritmo's tag (proposal §32, slice 2): this day takes another step of the
 * ciclo (its position), a rest (null), or the ciclo's own again (undefined). Only that day.
 */
export async function chooseStep(
  day: string,
  cycleId: string,
  position: number | null | undefined,
): Promise<void> {
  if (!ISO.test(day) || !UUID.test(cycleId)) return;
  if (typeof position === "number" && !(Number.isInteger(position) && position >= 0))
    return;
  await setCycleOverride(await getDb(), await requireOwner(), day, cycleId, position);
  revalidatePath("/", "layout");
}
