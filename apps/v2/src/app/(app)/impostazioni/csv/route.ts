/** «Un foglio per tipo» (V-14, ADR-0052 C): one kind's entries as CSV to open in a spreadsheet. */
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readKindTable, toCsv } from "@/core/account/csv";
import { FIELDS } from "@/features/day/words";

export async function GET(request: Request): Promise<Response> {
  const owner = await requireOwner();
  const kind = new URL(request.url).searchParams.get("tipo") ?? "";
  if (!/^[a-z][a-z0-9_]{0,40}$/.test(kind)) return new Response("tipo?", { status: 400 });
  const { clock } = await ownerClock();
  const t = await readKindTable(await getDb(), owner, kind, clock.timeZone);
  // The columns in the app's words (a field of the person's own kind keeps its key).
  const header = t.header.map((h) => FIELDS[h] ?? h);
  const rows = t.rows;
  const day = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(header, rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="lifeos-${kind}-${day}.csv"`,
      "cache-control": "no-store",
    },
  });
}
