/**
 * GET /api/health (DT-34, ADR-0004), as v1's: which code runs (commit) and whether the
 * database answers a query now. 200 if it did, 503 otherwise, so the monitor alerts on the
 * status alone. No login on purpose (a monitor has none): it reveals only those two facts.
 */
import { checkDatabase } from "@/core/health";
import { getDb } from "@/app/_server/runtime";

// Never cached: a health check reflects this moment.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const databaseOk = await checkDatabase(Promise.resolve().then(getDb));
  const body = {
    status: databaseOk ? "ok" : "degraded",
    database: databaseOk ? "ok" : "unreachable",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
  };
  return Response.json(body, { status: databaseOk ? 200 : 503 });
}
