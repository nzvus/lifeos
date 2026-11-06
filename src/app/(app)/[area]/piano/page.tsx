/** An area's Piano (map D, ADR-0059): Corpo's cycles and Mente's habits (`piano/modelli/models`), the others `../area-index`. */
import { AreaIndex } from "../area-index";
import { ModelsPage } from "../../piano/modelli/models";

export default async function Page({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  if (area === "corpo" || area === "mente") return <ModelsPage area={area} />;
  return <AreaIndex params={params} tab="piano" />;
}
