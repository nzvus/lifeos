/**
 * app/api/health/route.ts — GET /api/health (ADR-0004).
 *
 * Answers two different questions, because "deployed" and "working" are
 * different claims:
 *   - commit: WHICH code is running (Vercel sets VERCEL_GIT_COMMIT_SHA);
 *   - database: can it actually run a query right now.
 * Status 200 if the database answered, 503 otherwise, so healthchecks.io can
 * alert on the status code alone.
 *
 * Unauthenticated on purpose (a monitor has no login), which is why it reveals
 * nothing but those two facts.
 */
import { checkDatabase } from "@/core/health";
import { env } from "@/app/_server/env";
import { getDb } from "@/app/_server/runtime";

// Never cache: a health check must reflect this moment.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const databaseOk = await checkDatabase(getDb());
  const body = {
    status: databaseOk ? "ok" : "degraded",
    database: databaseOk ? "ok" : "unreachable",
    commit: env().VERCEL_GIT_COMMIT_SHA ?? "local",
  };
  return Response.json(body, { status: databaseOk ? 200 : 503 });
}
