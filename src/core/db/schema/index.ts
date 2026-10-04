/**
 * core/db/schema/index.ts — the complete database schema, in one import.
 *
 * Who reads it:
 *   - drizzle.config.ts points drizzle-kit here to generate migrations;
 *   - core/db/client.ts passes it to Drizzle so queries are typed;
 *   - core/auth/auth.ts hands the auth tables to Better Auth.
 * Add a new schema file? Export it here, or drizzle-kit won't see it.
 */
export * from "./auth";
export * from "./nutrition";
export * from "./training";
export * from "./pantry";
export * from "./assistant";
export * from "./programs";
export * from "./invites";
export * from "./money";
export * from "./mind";
export * from "./supplements";
