/**
 * «Nuova marca» of a food (V-07, ADR-0055): `/cibo/cibo/<id>/prodotto`. From a
 * scan (`?barcode=`, «È una marca di un tuo cibo?», ADR-0060) it comes filled
 * from Open Food Facts: the brand, the label's values, the package and the code.
 */
import { notFound } from "next/navigation";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import { readFoodChoices } from "@/core/food/catalog";
import { FoodForm } from "@/features/library/FoodForm";
import { foodPage } from "@/features/library/library";
import { saveProduct } from "../modifica/actions";
import { F } from "@lifeos/kit";
import { fetchOff } from "@/app/_server/openfoodfacts";
import { isValidGtin } from "@/core/food/barcode";
import { SNAPSHOT_FIELDS } from "@/core/food/choices";

export default async function NewProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ barcode?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { id } = await params;
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  const page = foodPage(await readFoodChoices(db, owner, today), [], id);
  if (!page) notFound();
  const { barcode } = await searchParams;
  const code = typeof barcode === "string" && isValidGtin(barcode) ? barcode : null;
  const lookup = code ? await fetchOff(code) : null;
  const off = lookup?.status === "found" ? lookup.prefill : null;
  const initial: Record<string, string> = {
    ...(code ? { barcode: code } : {}),
    ...(off
      ? {
          name: off.description.slice(0, 80),
          ...(off.packageSize
            ? { packageSize: F.input(Number(off.packageSize), 2) }
            : {}),
          ...Object.fromEntries(
            SNAPSHOT_FIELDS.flatMap((f) =>
              off[f as keyof typeof off] && f !== "nova"
                ? [[f, F.input(Number(off[f as keyof typeof off]), 2)]]
                : [],
            ),
          ),
        }
      : {}),
  };
  return (
    <FoodForm
      initial={initial}
      unit={page.unit}
      isNew
      productOf={page.name}
      backHref={"/cibo/cibo/" + id}
      action={saveProduct.bind(null, id)}
    />
  );
}
