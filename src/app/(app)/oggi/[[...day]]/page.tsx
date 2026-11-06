/** V-01, Oggi · Diario (screens.md, ADR-0059): every area's day; the logic is `../day-page`. */
import { DayPage } from "../day-page";

export default function OggiPage(props: {
  params: Promise<{ day?: string[] }>;
  searchParams: Promise<{ fatto?: string | string[] }>;
}) {
  return <DayPage area="oggi" {...props} />;
}
