/** An area's Andamento (map D, ADR-0059): `../area-index`. */
import { AreaIndex } from "../area-index";

export default function Page({ params }: { params: Promise<{ area: string }> }) {
  return <AreaIndex params={params} tab="andamento" />;
}
