/**
 * The create forms of cibo and prodotto (PAT-04, PAT-11, PAT-61; change 2026-11-07-food-meal),
 * the food's specialised editor (`FoodForm`: unit, label values, barcode):
 * - `/cibo/cibo/nuovo`: `?nome=` and `?torna=` from the composer's search (back to it once
 *   made); `?barcode=` fills it from Open Food Facts (FD-90), a known code opens its food;
 *   `?da=<cibo>` starts from another food's values (PAT-16).
 * - `/cibo/prodotto/nuovo?di=<cibo>`: a brand of that food; from a scan (`&barcode=`, «È una
 *   marca di un tuo cibo?», ADR-0060) filled from Open Food Facts.
 */
import { notFound, redirect } from "next/navigation";
import { F } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { fetchOff } from "@/app/_server/openfoodfacts";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import { isValidGtin } from "@/core/food/barcode";
import { readFoodChoices } from "@/core/food/catalog";
import { SNAPSHOT_FIELDS } from "@/core/food/choices";
import { readFoodByBarcode } from "@/core/food/edit";
import { BarcodeBox } from "@/features/library/BarcodeBox";
import { FoodForm } from "@/features/library/FoodForm";
import { foodPage, likelyFoods } from "@/features/library/library";
import { saveFood, saveProduct } from "./food-actions";
import type { NewFormRender } from "./new-forms";

/** Only back to the composer: anything else in `torna` is ignored. */
const BACK = /^\/aggiungi\/pasto(\?giorno=\d{4}-\d{2}-\d{2})?$/;

const today = async () => logicalDay(new Date(), (await ownerClock()).clock);

/** A food's own values per 100 as the form's starting text («Parti da», PAT-16). */
async function valuesOf(id: string): Promise<Record<string, string> | null> {
  const owner = await requireOwner();
  const page = foodPage(
    await readFoodChoices(await getDb(), owner, await today()),
    [],
    id,
  );
  if (!page) return null;
  return {
    unit: page.unit,
    ...Object.fromEntries(
      SNAPSHOT_FIELDS.flatMap((f) =>
        page.per100[f] === undefined ? [] : [[f, F.input(Number(page.per100[f]), 4)]],
      ),
    ),
  };
}

export const newFood: NewFormRender = async (back, q) => {
  const torna = q["torna"];
  const after = torna && BACK.test(torna) ? torna : null;
  const code = q["barcode"] && isValidGtin(q["barcode"]) ? q["barcode"] : null;
  const owner = await requireOwner();
  const db = await getDb();
  // A code already saved with a food opens that food; else Open Food Facts.
  const known = code ? await readFoodByBarcode(db, owner, code) : null;
  if (known) redirect("/cibo/cibo/" + known);
  const lookup = code ? await fetchOff(code) : null;
  const off = lookup?.status === "found" ? lookup.prefill : null;
  // «È una marca di un tuo cibo?» (ADR-0060): the foods this product likely is a brand of.
  const candidates =
    off && code
      ? likelyFoods(off.name, await readFoodChoices(db, owner, await today()))
      : [];
  const from = q["da"] ? await valuesOf(q["da"]) : null;
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
          SNAPSHOT_FIELDS.flatMap((f) =>
            off[f] === ""
              ? []
              : [[f, f === "nova" ? off[f] : F.input(Number(off[f]), 2)]],
          ),
        ),
      }
    : {
        unit: "g",
        ...(from ?? {}),
        name: q["nome"] ? q["nome"].slice(0, 80) : "",
        ...(code ? { barcode: code } : {}),
      };
  return (
    <FoodForm
      key={code ?? "new"}
      initial={initial}
      unit={initial["unit"] ?? "g"}
      isNew
      backHref={after ?? (q["da"] ? "/cibo/cibo/" + q["da"] : back.href)}
      action={saveFood.bind(null, after)}
      top={
        <BarcodeBox code={code} result={lookup?.status ?? null} candidates={candidates} />
      }
    />
  );
};

export const newProduct: NewFormRender = async (_back, q) => {
  const id = q["di"];
  if (!id) notFound();
  const owner = await requireOwner();
  const page = foodPage(
    await readFoodChoices(await getDb(), owner, await today()),
    [],
    id,
  );
  if (!page) notFound();
  const code = q["barcode"] && isValidGtin(q["barcode"]) ? q["barcode"] : null;
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
              off[f] && f !== "nova" ? [[f, F.input(Number(off[f]), 2)]] : [],
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
};
