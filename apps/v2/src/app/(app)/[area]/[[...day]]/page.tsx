/** An area's Diario (map D, ADR-0059): Corpo, Cibo, Mente, Soldi — the day of its own kinds. */
import { notFound } from "next/navigation";
import { isDomainArea } from "@/features/places";
import { DayPage } from "../../oggi/day-page";

export default async function AreaDayPage(props: {
  params: Promise<{ area: string; day?: string[] }>;
  searchParams: Promise<{ fatto?: string | string[] }>;
}) {
  const { area } = await props.params;
  if (!isDomainArea(area)) notFound();
  return <DayPage area={area} params={props.params} searchParams={props.searchParams} />;
}
