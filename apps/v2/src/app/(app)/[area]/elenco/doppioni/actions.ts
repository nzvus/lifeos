"use server";
/** «Possibili doppioni» (ADR-0060 slice f): each answer, then the list again. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addNotTwins } from "@/core/account/not-twins";
import { makeBrandOf } from "@/core/catalog/brand-of";
import { mergeItems } from "@/core/catalog/merge";
import { makeVariantOf } from "@/core/food/recipes";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BACK = "/cibo/elenco/doppioni";
const done = () => {
  revalidatePath("/", "layout");
  redirect(BACK);
};

/** «È una marca di …»: `gone` becomes the brand `brand` of `keep`. */
export async function asBrand(gone: string, keep: string, data: FormData): Promise<void> {
  if (!UUID.test(gone) || !UUID.test(keep)) return;
  const brand = String(data.get("brand") ?? "");
  await makeBrandOf(await getDb(), await requireOwner(), gone, keep, brand);
  done();
}

/** «Uniscili»: one thing, the other's name an alias. */
export async function asOne(keep: string, gone: string): Promise<void> {
  if (!UUID.test(gone) || !UUID.test(keep)) return;
  await mergeItems(await getDb(), await requireOwner(), keep, gone);
  done();
}

/** «Variante di …»: the saved meal follows `base`, keeping its own foods. */
export async function asVariant(child: string, base: string): Promise<void> {
  if (!UUID.test(child) || !UUID.test(base)) return;
  await makeVariantOf(await getDb(), await requireOwner(), child, base);
  done();
}

/** «Sono diversi»: never asked again. */
export async function notTwins(a: string, b: string): Promise<void> {
  if (!UUID.test(a) || !UUID.test(b)) return;
  await addNotTwins(await getDb(), await requireOwner(), a, b);
  done();
}
