/**
 * Oggi · Piano (PAT-97, proposal §42–§43): what repeats in every area — the same page as an
 * area's Piano. No days: every day lives in Oggi (his 15 Nov «in piano a questo punto è inutile
 * avere le giornate o cose simili»).
 */
import { PianoList } from "../../[area]/piano/piano-list";

export default async function PianoPage({
  searchParams,
}: {
  searchParams: Promise<{ archiviati?: string | string[] }>;
}) {
  return <PianoList area="oggi" archived={(await searchParams).archiviati === "1"} />;
}
