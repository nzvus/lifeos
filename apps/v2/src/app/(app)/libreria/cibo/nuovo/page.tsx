/**
 * «Nuovo cibo» (V-07): `/libreria/cibo/nuovo`, the food's editor with its
 * unit to choose; from the composer's search, `?nome=` and `?torna=` (back
 * to the composer once made).
 */
import { requireOwner } from "@/app/_server/owner";
import { FoodForm } from "@/features/library/FoodForm";
import { saveFood } from "../[id]/modifica/actions";

/** Only back to the composer: anything else in `torna` is ignored. */
const BACK = /^\/aggiungi\/pasto(\?giorno=\d{4}-\d{2}-\d{2})?$/;

export default async function NewFoodPage({
  searchParams,
}: {
  searchParams: Promise<{ nome?: string | string[]; torna?: string | string[] }>;
}) {
  await requireOwner();
  const { nome, torna } = await searchParams;
  const back = typeof torna === "string" && BACK.test(torna) ? torna : null;
  return (
    <FoodForm
      initial={{ unit: "g", name: typeof nome === "string" ? nome.slice(0, 80) : "" }}
      unit="g"
      isNew
      backHref={back ?? "/libreria?vista=cibi"}
      action={saveFood.bind(null, null, back)}
    />
  );
}
