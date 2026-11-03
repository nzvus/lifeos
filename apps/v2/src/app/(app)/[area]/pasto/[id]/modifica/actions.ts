"use server";
/** Archiving a saved meal from its page (V-07). */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { archiveRecipe } from "@/core/food/recipes";

export async function archiveSaved(id: string): Promise<void> {
  const owner = await requireOwner();
  await archiveRecipe(await getDb(), owner, id);
  revalidatePath("/", "layout");
  redirect("/cibo/elenco?vista=pasti");
}
