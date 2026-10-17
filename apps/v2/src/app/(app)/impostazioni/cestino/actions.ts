"use server";
/** «Ripristina» from the trash: the session's owner, the id checked, then core's restore. */
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { restoreEntry } from "@/core/entries";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function restoreFromTrash(id: string): Promise<void> {
  if (!UUID.test(id)) return;
  await restoreEntry(await getDb(), await requireOwner(), id);
  revalidatePath("/impostazioni/cestino");
  revalidatePath("/oggi", "layout");
}
