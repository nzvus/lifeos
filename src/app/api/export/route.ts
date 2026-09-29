/**
 * app/api/export/route.ts — GET /api/export: download all my data as JSON
 * (PROJECT.md v1 §5 "data is exportable/ownable"; ADR-0003).
 *
 * The browser receives a file (Content-Disposition: attachment) named with
 * today's date, e.g. lifeos-export-2026-09-29.json. The content comes from
 * core/export/export.ts, which only ever reads the owner's rows.
 */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { exportUserData } from "@/core/export/export";
import { todayIn } from "@/core/shared/dates";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const { owner, settings } = await requireContext(); // no session -> redirect to sign-in
  const data = await exportUserData(getDb(), owner);
  const filename = `lifeos-export-${todayIn(settings.timezone)}.json`;
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store", // personal data: never kept by any cache
    },
  });
}
