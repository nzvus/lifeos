/** «Esporta i dati» (V-14): the owner's whole export as a JSON file to save. */
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { exportAll } from "@/core/account/export";

export async function GET(): Promise<Response> {
  const owner = await requireOwner();
  const now = new Date();
  const out = await exportAll(await getDb(), owner, now);
  return new Response(JSON.stringify(out), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="lifeos-${now.toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
