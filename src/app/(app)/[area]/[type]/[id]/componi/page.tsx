/** `/{area}/{type}/{id}/componi` (PAT-04, PAT-62): see `compose-route.tsx`. */
import { composeRoute } from "../compose-route";

export default async function ComposeRoute({
  params,
}: {
  params: Promise<{ area: string; type: string; id: string }>;
}) {
  const { area, type, id } = await params;
  return composeRoute(area, type, id);
}
