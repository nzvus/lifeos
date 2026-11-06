/**
 * core/db/db.ts — the database type every repository takes: Drizzle over
 * any Postgres driver (pg on Neon, PGlite in tests and local runs), with
 * v2's schema. Making the client is the app's composition root, not core's.
 */
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
