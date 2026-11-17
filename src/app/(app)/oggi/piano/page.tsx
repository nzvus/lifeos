/**
 * Oggi · Piano (PAT-97, proposal §42–§43): what repeats in every area — the same page as an
 * area's Piano. No days: every day lives in Oggi (his 15 Nov «in piano a questo punto è inutile
 * avere le giornate o cose simili»). An old link to a day here (`?giorno=`) opens that day in
 * Oggi.
 */
import { redirect } from "next/navigation";
import { PianoList } from "../../[area]/piano/piano-list";
import { oldDayLink } from "./old-day-link";

export default async function PianoPage({
  searchParams,
}: {
  searchParams: Promise<{ archiviati?: string | string[]; giorno?: string | string[] }>;
}) {
  const asked = await searchParams;
  const day = oldDayLink(asked.giorno);
  if (day) redirect(day);
  return <PianoList area="oggi" archived={asked.archiviati === "1"} />;
}
