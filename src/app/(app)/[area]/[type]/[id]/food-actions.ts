"use server";
/**
 * A cibo's and a prodotto's create forms (`/cibo/cibo/nuovo`, `/cibo/prodotto/nuovo?di=`; PAT-04,
 * PAT-11) and the food page's «In casa» (dossiers/pantry.md §6): the form checked by core, then
 * written. Its values are edited in place through `core/verbs` (PAT-13), not here.
 */
import { revalidatePath } from "next/cache";
import { F } from "@lifeos/kit";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { typedAmount, typedCents } from "@/features/library/pantry";
import { logCount, logPurchase } from "@/core/pantry";
import { SNAPSHOT_FIELDS } from "@/core/food/choices";
import {
  checkFood,
  createFood,
  createFormat,
  createProduct,
  productByBrand,
  type FoodValueError,
} from "@/core/food/edit";
import { isValidGtin } from "@/core/food/barcode";
import { OFF_EXTRAS } from "@/core/food/off";
import { ownerClock } from "@/app/_server/clock";
import { logicalDay } from "@/core/engines/time";
import { readFoodChoices } from "@/core/food/catalog";
import { likelyFoods } from "@/features/library/library";
import { RECIPE_WORDS } from "@/features/food/composer";
import type { FoodFormState } from "@/features/library/FoodForm";

const WORDS: Record<FoodValueError, string> = {
  number: "Scrivi un numero, per esempio 13 o 13,5.",
  too_much: "È troppo per 100 g: controlla il numero.",
  nova: "NOVA va da 1 a 4.",
};

/** «Nuovo cibo»: creates it, then its page (or back to the composer). */
export async function saveFood(
  /** Where a new food goes once made (the composer), checked by the page. */
  back: string | null,
  prev: FoodFormState,
  data: FormData,
): Promise<FoodFormState> {
  const owner = await requireOwner();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const again = (errors: Record<string, string>) => ({
    errors,
    values: form,
    n: prev.n + 1,
  });
  const checked = checkFood(
    form["name"] ?? "",
    Object.fromEntries(SNAPSHOT_FIELDS.map((f) => [f, form[f] ?? ""])),
  );
  if (!checked.ok) {
    const errors: Record<string, string> = {};
    if (checked.name)
      errors["name"] = RECIPE_WORDS[checked.name].replace("pasto", "cibo");
    for (const [f, code] of Object.entries(checked.at)) errors[f] = WORDS[code];
    return again(errors);
  }
  const db = await getDb();
  if (form["twinOk"] !== "yes") {
    // A likely duplicate is said once (ADR-0060 slice f); saving again goes on.
    const { clock } = await ownerClock();
    const near = likelyFoods(
      checked.name,
      await readFoodChoices(db, owner, logicalDay(new Date(), clock)),
    );
    if (near.length > 0)
      return {
        errors: {
          name:
            "Esiste già «" +
            near[0]!.name +
            "»: se è una sua marca, aggiungila dalla sua pagina («+ Marca»). Se è un’altra cosa, premi di nuovo Salva.",
        },
        values: { ...form, twinOk: "yes" },
        n: prev.n + 1,
      };
  }
  // What the barcode filled beyond the label (FOOD-48): micros, caffeine, the package.
  const extra: Record<string, string> = {};
  const bad: Record<string, string> = {};
  for (const k of [...Object.keys(OFF_EXTRAS).map((x) => "x." + x), "packageSize"]) {
    const raw = (form[k] ?? "").trim().replace(",", ".");
    if (raw === "") continue;
    if (!/^\d{1,6}(\.\d{1,3})?$/.test(raw)) bad[k] = WORDS.number;
    else extra[k.replace(/^x\./, "")] = raw;
  }
  const brand = (form["brand"] ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  if (Object.keys(bad).length > 0) return again(bad);
  const unit = form["unit"] === "ml" ? "ml" : "g";
  const barcode = isValidGtin(form["barcode"] ?? "") ? form["barcode"]! : null;
  const { packageSize, ...values } = extra;
  const made = await createFood(
    db,
    owner,
    checked.name,
    unit,
    checked.values,
    null,
    values,
  );
  if (made === "taken") return again({ name: "Hai già un cibo con questo nome." });
  // The brand is the food's first product (its values are the food's); the package and
  // the barcode are its format (ADR-0060: a barcode is one size of one product).
  await addBrandFormat(db, owner, made.id, unit, brand, packageSize ?? null, barcode);
  revalidatePath("/", "layout");
  redirect(back ?? "/cibo/cibo/" + made.id);
}

/** Saves «Nuovo prodotto» of a food: the brand and the label's values. */
export async function saveProduct(
  foodId: string,
  prev: FoodFormState,
  data: FormData,
): Promise<FoodFormState> {
  const owner = await requireOwner();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const again = (errors: Record<string, string>) => ({
    errors,
    values: form,
    n: prev.n + 1,
  });
  const checked = checkFood(
    form["name"] ?? "",
    Object.fromEntries(SNAPSHOT_FIELDS.map((f) => [f, form[f] ?? ""])),
  );
  if (!checked.ok) {
    const errors: Record<string, string> = {};
    if (checked.name) errors["name"] = "Scrivi la marca, per esempio Lidl.";
    for (const [f, code] of Object.entries(checked.at)) errors[f] = WORDS[code];
    return again(errors);
  }
  const db = await getDb();
  const barcode = isValidGtin(form["barcode"] ?? "") ? form["barcode"]! : null;
  const size = (form["packageSize"] ?? "").trim().replace(",", ".");
  // From a scan («È una marca di un tuo cibo?»): a brand it already has gets a new format.
  const known = barcode ? await productByBrand(db, owner, foodId, checked.name) : null;
  if (!known) {
    const made = await createProduct(db, owner, foodId, checked.name, checked.values);
    if (made === "gone") return again({ form: "Questo cibo non c’è più." });
    if (made === "taken")
      return again({ name: "Questo cibo ha già un prodotto con questa marca." });
  }
  if (barcode || /^\d+(\.\d+)?$/.test(size))
    await addBrandFormat(
      db,
      owner,
      foodId,
      form["unit"] === "ml" ? "ml" : "g",
      checked.name,
      /^\d+(\.\d+)?$/.test(size) ? size : null,
      barcode,
    );
  revalidatePath("/", "layout");
  redirect("/cibo/cibo/" + foodId);
}

/**
 * The format a scan or a package brings (ADR-0060): under the food's product of
 * that brand (made when missing; «marca non indicata» with no brand), named by
 * its size («500 g»), with the barcode. Nothing when there is neither.
 */
async function addBrandFormat(
  db: Awaited<ReturnType<typeof getDb>>,
  owner: Awaited<ReturnType<typeof requireOwner>>,
  foodId: string,
  unit: "g" | "ml",
  brand: string,
  size: string | null,
  barcode: string | null,
): Promise<void> {
  if (!brand && !size && !barcode) return;
  const name = brand || "marca non indicata";
  let product = await productByBrand(db, owner, foodId, name);
  if (!product) {
    const made = await createProduct(db, owner, foodId, name, {});
    if (typeof made !== "object") return;
    product = made.id;
  }
  if (!size && !barcode) return;
  await createFormat(db, owner, product, {
    name: size ? F.num(Number(size), unit) : "confezione",
    unit,
    size,
    barcode,
  });
}

/** «In casa»: back to the food's page; a wrong value comes back as `?dispensa=<field>`. */
const back = (foodId: string, error?: string) =>
  "/cibo/cibo/" + foodId + (error ? "?dispensa=" + error : "") + "#dispensa";

export async function bought(
  foodId: string,
  itemId: string,
  data: FormData,
): Promise<void> {
  const owner = await requireOwner();
  const str = (k: string) =>
    typeof data.get(k) === "string" ? (data.get(k) as string) : "";
  const quantity = typedAmount(str("quantity"));
  const packages = typedAmount(str("packages"));
  const price = typedCents(str("price"));
  if (typeof quantity !== "string" || Number(quantity) <= 0)
    redirect(back(foodId, "quantity"));
  if (typeof packages === "number") redirect(back(foodId, "packages"));
  if (Number.isNaN(price)) redirect(back(foodId, "price"));
  const shop = str("shop").trim().slice(0, 60) || null;
  const { clock } = await ownerClock();
  const now = new Date();
  await logPurchase(await getDb(), owner, {
    itemId,
    day: logicalDay(now, clock),
    at: now,
    quantity,
    packages: packages as string | null,
    priceCents: price,
    shop,
  });
  revalidatePath("/", "layout");
  redirect(back(foodId));
}

export async function counted(foodId: string, data: FormData): Promise<void> {
  const owner = await requireOwner();
  const q = typedAmount(
    typeof data.get("left") === "string" ? (data.get("left") as string) : "",
  );
  if (typeof q !== "string") redirect(back(foodId, "left"));
  const { clock } = await ownerClock();
  const now = new Date();
  await logCount(await getDb(), owner, {
    foodId,
    day: logicalDay(now, clock),
    at: now,
    quantity: q,
  });
  revalidatePath("/", "layout");
  redirect(back(foodId));
}
