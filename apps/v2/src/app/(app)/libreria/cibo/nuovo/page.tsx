/**
 * «Nuovo cibo» (V-07): `/libreria/cibo/nuovo`, the food's editor with its
 * unit to choose; from the composer's search, `?nome=` and `?torna=` (back
 * to the composer once made); `?barcode=` fills it from Open Food Facts
 * (values to check against the label before saving), the camera or the
 * digits giving the code (features/library/BarcodeBox).
 */
import { F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { fetchOff } from "@/app/_server/openfoodfacts";
import { isValidGtin } from "@/core/food/barcode";
import { BarcodeBox } from "@/features/library/BarcodeBox";
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
  await requireOwner();
  const { nome, torna, barcode } = await searchParams;
  const back = typeof torna === "string" && BACK.test(torna) ? torna : null;
  const code = typeof barcode === "string" && isValidGtin(barcode) ? barcode : null;
  const off = code ? await fetchOff(code) : null;
  const initial: Record<string, string> = off
    ? {
        unit: off.unit,
        // The brand in the name: a product of its own comes later, from the food's page.
        name: (off.name + (off.description ? " · " + off.description : "")).slice(0, 80),
        ...Object.fromEntries(
          FIELDS.flatMap((f) =>
            off[f] === ""
              ? []
              : [[f, f === "nova" ? off[f] : F.input(Number(off[f]), 2)]],
          ),
        ),
      }
    : { unit: "g", name: typeof nome === "string" ? nome.slice(0, 80) : "" };
  return (
    <FoodForm
      key={code ?? "new"}
      initial={initial}
      unit={initial["unit"] ?? "g"}
      isNew
      backHref={back ?? "/libreria?vista=cibi"}
      action={saveFood.bind(null, null, back)}
      top={<BarcodeBox code={code} found={off !== null} />}
    />
  );
}
