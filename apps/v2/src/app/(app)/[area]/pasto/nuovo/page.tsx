/** «+ Nuovo pasto» and «Parti da…» (`?da=<saved meal>`): `/cibo/pasto/nuovo` (FOOD-42). */
import { createSaved } from "../saved-actions";
import { SavedComposer } from "../saved-composer";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewSavedMealPage({
  searchParams,
}: {
  searchParams: Promise<{ da?: string | string[] }>;
}) {
  const { da } = await searchParams;
  const from = typeof da === "string" && UUID.test(da) ? da : null;
  return (
    <SavedComposer
      from={from}
      editing={false}
      backHref={from ? "/cibo/pasto/" + from : "/cibo/elenco?vista=pasti"}
      action={createSaved.bind(null, from)}
    />
  );
}
