/** `/oggi/{type}/{id}/componi` (PAT-04, PAT-62): Oggi's types with lines (a ciclo's steps). */
import { composeRoute } from "../../../../[area]/[type]/[id]/compose-route";

export default async function OggiComposeRoute({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  return composeRoute("oggi", type, id);
}
