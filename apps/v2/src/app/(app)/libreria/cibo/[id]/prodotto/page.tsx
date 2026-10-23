/** «Nuovo prodotto» of a food (V-07, ADR-0055): `/libreria/cibo/<id>/prodotto`. */
import { notFound } from "next/navigation";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import { readFoodChoices } from "@/core/food/catalog";
import { FoodForm } from "@/features/library/FoodForm";
import { foodPage } from "@/features/library/library";
import { saveProduct } from "../modifica/actions";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { id } = await params;
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  const page = foodPage(await readFoodChoices(db, owner, today), [], id);
  if (!page) notFound();
  return (
    <FoodForm
      initial={{}}
      unit={page.unit}
      isNew
      productOf={page.name}
      backHref={"/libreria/cibo/" + id}
      action={saveProduct.bind(null, id)}
    />
  );
}
