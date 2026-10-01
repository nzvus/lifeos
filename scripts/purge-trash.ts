/**
 * scripts/purge-trash.ts — deletes for good what has been in the trash for
 * more than 30 days, for every user (ADR-0015; core/trash purgeExpiredTrash).
 * Run daily by .github/workflows/backup.yml, only after that day's dump is
 * stored, so anything purged is still in the backups for 30 days more.
 *
 *   npm run trash:purge
 *
 * The database is DATABASE_URL (from .env locally; the workflow passes the
 * production URL). The first line names the host; then one line per kind.
 */
import "dotenv/config";
import { openDb } from "../src/core/db/client";
import { purgeExpiredTrash } from "../src/core/trash/trash";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (see .env.example)");
  process.exit(2);
}
let host = "(invalid DATABASE_URL)";
try {
  host = new URL(process.env.DATABASE_URL).hostname;
} catch {}

const { db, close } = openDb(process.env.DATABASE_URL);
try {
  console.log(`Purging the trash (older than 30 days) on ${host}`);
  const counts = await purgeExpiredTrash(db);
  for (const [kind, n] of Object.entries(counts)) console.log(`  ${kind.padEnd(12)} ${n}`);
} finally {
  await close();
}
