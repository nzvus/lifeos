"use server";
/**
 * Piano's day sheet (the board Plan, dossiers/day-templates.md slice c): a
 * cycle's step chosen by hand for one day, or a rest, or back to the
 * cycle's own. The model of the day and «Salta» reuse Oggi's actions.
 */
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { setCycleOverride } from "@/core/plans";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** «step»: "" back to the cycle's, "rest", or a step's position. */
export async function overrideStep(
  day: string,
  cycleId: string,
  data: FormData,
): Promise<void> {
  if (!ISO.test(day) || !UUID.test(cycleId)) return;
  const v = String(data.get("step") ?? "");
  const position = v === "" ? undefined : v === "rest" ? null : Number(v);
  if (typeof position === "number" && !(Number.isInteger(position) && position >= 0))
    return;
  await setCycleOverride(await getDb(), await requireOwner(), day, cycleId, position);
  revalidatePath("/piano", "layout");
  revalidatePath("/oggi", "layout");
}
