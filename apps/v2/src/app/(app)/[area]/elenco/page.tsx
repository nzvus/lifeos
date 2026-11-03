/** An area's Elenco (map D, ADR-0059): Cibo and Corpo show their shelves (`./shelves`), the others `../area-index`. */
import { AreaIndex } from "../area-index";
import { AreaShelves, hasShelves } from "./shelves";

export default async function Page(props: {
  params: Promise<{ area: string }>;
  searchParams: Promise<{ vista?: string | string[] }>;
}) {
  const { area } = await props.params;
  if (hasShelves(area)) {
    const { vista } = await props.searchParams;
    return (
      <AreaShelves area={area} vista={typeof vista === "string" ? vista : undefined} />
    );
  }
  return <AreaIndex params={props.params} tab="elenco" />;
}
