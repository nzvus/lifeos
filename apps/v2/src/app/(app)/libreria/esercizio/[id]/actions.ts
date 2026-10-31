"use server";
/**
 * Archiving an exercise (V-07): out of Libreria and gym mode; its sessions stay.
 * «Unisci» (capture.md §4): another exercise's history moves onto this one.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { archiveItem } from "@/core/catalog/archive";
import { mergeItems } from "@/core/catalog/merge";

export async function archiveExercise(id: string): Promise<void> {
  await archiveItem(await getDb(), await requireOwner(), id, "exercise");
  revalidatePath("/", "layout");
  redirect("/oggi/elenco?vista=esercizi");
}

export async function mergeExercise(keepId: string, goneId: string): Promise<void> {
  await mergeItems(await getDb(), await requireOwner(), keepId, goneId);
  revalidatePath("/", "layout");
  revalidatePath("/", "layout");
  redirect("/libreria/esercizio/" + keepId);
}
