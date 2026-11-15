/**
 * An area's Piano (PAT-03, PAT-97, PL-70): what repeats in that area, as `PianoList` — the cicli
 * (giornate tipo span every area) and the area's blocchi outside them. Oggi · Piano is the same
 * page with every area.
 */
import { notFound } from "next/navigation";
import { isDomainArea } from "@/features/places";
import { PianoList } from "./piano-list";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ area: string }>;
  searchParams: Promise<{ archiviati?: string | string[] }>;
}) {
  const { area } = await params;
  if (!isDomainArea(area)) notFound();
  return <PianoList area={area} archived={(await searchParams).archiviati === "1"} />;
}
