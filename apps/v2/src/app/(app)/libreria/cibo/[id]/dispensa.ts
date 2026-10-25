"use server";
/**
 * A food's «Comprato» and «Ne ho…» (dossiers/pantry.md §6): the typed
 * values checked, written now, back to the food's Dispensa box; a wrong
 * value comes back as `?dispensa=<field>` for the page to say.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import { logCount, logPurchase } from "@/core/pantry";
import { typedAmount, typedCents } from "@/features/library/pantry";

const back = (foodId: string, error?: string) =>
  "/libreria/cibo/" + foodId + (error ? "?dispensa=" + error : "") + "#dispensa";

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
