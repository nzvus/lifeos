/**
 * «+ Nuovo pasto», «Parti da…» (`?da=<saved meal>`, a copy) and «+ Variante»
 * (`?variante=<saved meal>`, ADR-0060: it keeps following its base):
 * `/cibo/pasto/nuovo` (FOOD-42).
 */
import { createSaved, createVariantSaved } from "../saved-actions";
import { SavedComposer } from "../saved-composer";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewSavedMealPage({
  searchParams,
}: {
  searchParams: Promise<{ da?: string | string[]; variante?: string | string[] }>;
}) {
  const { da, variante } = await searchParams;
  const base = typeof variante === "string" && UUID.test(variante) ? variante : null;
  const from = base ?? (typeof da === "string" && UUID.test(da) ? da : null);
  return (
    <SavedComposer
      from={from}
      editing={false}
      variantOf={base}
      backHref={from ? "/cibo/pasto/" + from : "/cibo/elenco?vista=pasti"}
      action={base ? createVariantSaved.bind(null, base) : createSaved.bind(null, from)}
    />
  );
}
