/** A food's editor (V-07): `/libreria/cibo/<id>/modifica`. */
import { notFound } from "next/navigation";
import { F } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import { readFoodChoices } from "@/core/food/catalog";
import { FoodForm } from "@/features/library/FoodForm";
import { FOOD_FIELDS, foodPage } from "@/features/library/library";
import { saveFood } from "./actions";

export default async function FoodEditPage({
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
      initial={{
        name: page.name,
        ...Object.fromEntries(
          FOOD_FIELDS.flatMap(([f]) =>
            page.per100[f] === undefined ? [] : [[f, F.input(Number(page.per100[f]), 4)]],
          ),
        ),
      }}
      unit={page.unit}
      backHref={"/libreria/cibo/" + id}
      action={saveFood.bind(null, id, null)}
    />
  );
}
