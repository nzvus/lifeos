"use server";
/** Archiving an exercise (V-07): out of Libreria and gym mode; its sessions stay. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { archiveItem } from "@/core/catalog/archive";

export async function archiveExercise(id: string): Promise<void> {
  await archiveItem(await getDb(), await requireOwner(), id, "exercise");
  revalidatePath("/libreria", "layout");
  redirect("/libreria");
}
