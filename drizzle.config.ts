/**
 * drizzle.config.ts — configuration for `drizzle-kit`, the migration tool.
 *
 * Two commands use it (see package.json scripts and ADR-0003):
 *   npm run db:generate   compares src/core/db/schema/* with the last migration
 *                         snapshot and WRITES a new numbered SQL file into
 *                         drizzle/. You read that SQL and commit it.
 *   npm run db:migrate    APPLIES the committed SQL files, in order, to the
 *                         database in DATABASE_URL. Against production this is
 *                         only ever run by .github/workflows/migrate.yml.
 *
 * `npm run db:push:local` (drizzle-kit push) skips migration files entirely;
 * ADR-0003 allows it ONLY against a throwaway local database.
 */
import "dotenv/config"; // loads .env.local-style variables from `.env` for local runs
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/core/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    // Empty string lets `generate` run without a database (it doesn't need one).
    url: process.env.DATABASE_URL ?? "",
  },
  // Print every SQL statement and ask before destructive changes.
  verbose: true,
  strict: true,
});
