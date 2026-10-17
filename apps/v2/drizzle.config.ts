/**
 * drizzle.config.ts — v2's migrations (ADR-0057, v1's ADR-0003 pipeline).
 *   npm run db:generate -w apps/v2   writes the next SQL file into apps/v2/drizzle/;
 *                                    read it, then commit it.
 * They are applied nowhere until the Neon branch `v2` exists; every `npm test`
 * applies them to PGlite from zero. Never `drizzle-kit push` on a shared database.
 */
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/core/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env["DATABASE_URL"] ?? "" },
  verbose: true,
  strict: true,
});
