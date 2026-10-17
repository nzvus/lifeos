/** «Nuovo cibo» (V-07): `/libreria/cibo/nuovo`, the food's editor with its unit to choose. */
import { requireOwner } from "@/app/_server/owner";
import { FoodForm } from "@/features/library/FoodForm";
import { saveFood } from "../[id]/modifica/actions";

export default async function NewFoodPage() {
  await requireOwner();
  return (
    <FoodForm
      initial={{ unit: "g" }}
      unit="g"
      isNew
      backHref="/libreria"
      action={saveFood.bind(null, null)}
    />
  );
}
