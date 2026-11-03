/**
 * «Nuovo cibo» (V-07): `/cibo/cibo/nuovo`, the food's editor with its
 * unit to choose; from the composer's search, `?nome=` and `?torna=` (back
 * to the composer once made); `?barcode=` fills it from Open Food Facts
 * (values to check against the label before saving), the camera or the
 * digits giving the code (features/library/BarcodeBox).
 */
import { F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { fetchOff } from "@/app/_server/openfoodfacts";
import { redirect } from "next/navigation";
import { getDb } from "@/app/_server/runtime";
import { isValidGtin } from "@/core/food/barcode";
import { readFoodByBarcode } from "@/core/food/edit";
import { BarcodeBox } from "@/features/library/BarcodeBox";
import { likelyFoods } from "@/features/library/library";
import { readFoodChoices } from "@/core/food/catalog";
import { logicalDay } from "@/core/engines/time";
import { ownerClock } from "@/app/_server/clock";
import { FoodForm } from "@/features/library/FoodForm";
import { saveFood } from "../[id]/modifica/actions";

/** Only back to the composer: anything else in `torna` is ignored. */
const BACK = /^\/aggiungi\/pasto(\?giorno=\d{4}-\d{2}-\d{2})?$/;
const FIELDS = [
  "kcal",
  "protein",
  "carbs",
  "sugars",
  "fat",
  "saturatedFat",
  "fibre",
  "salt",
  "nova",
] as const;

export default async function NewFoodPage({
  searchParams,
}: {
  searchParams: Promise<{
    nome?: string | string[];
    torna?: string | string[];
    barcode?: string | string[];
  }>;
}) {
  const { nome, torna, barcode } = await searchParams;
  const back = typeof torna === "string" && BACK.test(torna) ? torna : null;
  const code = typeof barcode === "string" && isValidGtin(barcode) ? barcode : null;
  // A code already saved with a food opens that food; else Open Food Facts.
  const owner = await requireOwner();
  const known = code ? await readFoodByBarcode(await getDb(), owner, code) : null;
  if (known) redirect("/cibo/cibo/" + known);
  const lookup = code ? await fetchOff(code) : null;
  const off = lookup?.status === "found" ? lookup.prefill : null;
  // «È una marca di un tuo cibo?» (ADR-0060): the foods this product likely is a brand of.
  const candidates =
    off && code
      ? likelyFoods(
          off.name,
          await readFoodChoices(
            await getDb(),
            owner,
            logicalDay(new Date(), (await ownerClock()).clock),
          ),
        )
      : [];
  const initial: Record<string, string> = off
    ? {
        unit: off.unit,
        barcode: off.barcode,
        // The brand apart, prefilled and editable: it becomes the food's product (FOOD-48).
        name: off.name.slice(0, 80),
        brand: off.description.slice(0, 80),
        ...(off.packageSize ? { packageSize: F.input(Number(off.packageSize), 2) } : {}),
        ...Object.fromEntries(
          Object.entries(off.extras).map(([k, x]) => ["x." + k, F.input(Number(x), 2)]),
        ),
        ...Object.fromEntries(
          FIELDS.flatMap((f) =>
            off[f] === ""
              ? []
              : [[f, f === "nova" ? off[f] : F.input(Number(off[f]), 2)]],
          ),
        ),
      }
    : {
        unit: "g",
        name: typeof nome === "string" ? nome.slice(0, 80) : "",
        ...(code ? { barcode: code } : {}),
      };
  return (
    <FoodForm
      key={code ?? "new"}
      initial={initial}
      unit={initial["unit"] ?? "g"}
      isNew
      backHref={back ?? "/cibo/elenco"}
      action={saveFood.bind(null, null, back)}
      top={
        <BarcodeBox code={code} result={lookup?.status ?? null} candidates={candidates} />
      }
    />
  );
}
