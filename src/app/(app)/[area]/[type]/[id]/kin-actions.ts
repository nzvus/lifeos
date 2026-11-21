"use server";
/**
 * Kinship between pasti from their box in the Elenco (MOD-23, PAT-103, ADR-0065): a parent's
 * multiplier stepped, a parent added, a child made. Each checks the owner and refuses a loop.
 */
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addChild, addParent, readRecipeName, setParentK } from "@/core/food/kin";

export async function kinStep(
  childId: string,
  parentId: string,
  k: number,
): Promise<boolean> {
  const ok = await setParentK(await getDb(), await requireOwner(), childId, parentId, k);
  if (ok) revalidatePath("/", "layout");
  return ok;
}

export async function kinAddParent(childId: string, parentId: string): Promise<boolean> {
  const ok = await addParent(await getDb(), await requireOwner(), childId, parentId);
  if (ok) revalidatePath("/", "layout");
  return ok;
}

/** «+ figlio»: the new pasto's name, or null. */
export async function kinAddChild(parentId: string): Promise<string | null> {
  const db = await getDb();
  const owner = await requireOwner();
  const id = await addChild(db, owner, parentId);
  if (!id) return null;
  revalidatePath("/", "layout");
  return readRecipeName(db, owner, id);
}
