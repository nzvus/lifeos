/** An area's Andamento (map D, ADR-0059): `../area-index`; Soldi's is the month of money itself. */
import { AreaIndex } from "../area-index";
import { MoneyPage } from "./money-page";

export default async function Page(props: {
  params: Promise<{ area: string }>;
  searchParams: Promise<{ mese?: string | string[] }>;
}) {
  const { area } = await props.params;
  if (area === "soldi") return <MoneyPage searchParams={props.searchParams} />;
  return <AreaIndex params={props.params} tab="andamento" />;
}
