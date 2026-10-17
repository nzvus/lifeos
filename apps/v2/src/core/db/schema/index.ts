/**
 * core/db/schema/index.ts — v2's whole schema in one import (ADR-0057,
 * docs/spec/v2/schema.md). drizzle-kit reads it to generate migrations; the
 * client and the repositories read it for typed queries. A new schema file
 * is exported here, or drizzle-kit does not see it.
 */
export * from "./auth";
export * from "./account";
export * from "./definitions";
export * from "./facts";
export * from "./plans";
