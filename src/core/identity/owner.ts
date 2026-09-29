/**
 * core/identity/owner.ts — the isolation gate (ADR-0003 part 3, ADR-0006).
 *
 * Invariant (PROJECT.md): a user can never read another user's data.
 * Where it is enforced: HERE and in the repositories that use this file —
 * never in middleware (CVE-2025-29927 showed middleware can be bypassed).
 *
 * Two mechanisms:
 *
 * 1. `Owner` is a "branded" type. Structurally it's just { id: string }, but
 *    the invisible brand means TypeScript will NOT accept a plain object or a
 *    raw string where an Owner is required. Every repository function takes an
 *    Owner, so the only way to call one is to get an Owner from
 *    `ownerFromVerifiedSession` — which only src/app/_server/owner.ts calls,
 *    right after Better Auth validated the session cookie. (Tests call it too,
 *    to impersonate two users in the cross-user test.)
 *
 * 2. `ownedBy(table, owner)` is the ONE helper that builds the
 *    `WHERE user_id = ...` condition. Every query on a user-owned table uses
 *    it. ADR-0006 deferred Postgres Row Level Security "behind a single hook":
 *    this is that hook. Adopting RLS later means changing how queries run for
 *    an Owner in one place, not hunting through every file.
 */
import { eq, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

// `unique symbol` exists only at type level; no value is created at runtime.
declare const ownerBrand: unique symbol;

export type Owner = {
  readonly id: string;
  readonly [ownerBrand]: true;
};

/**
 * Turns a user id into an Owner. Name is deliberately explicit: call it ONLY
 * with an id that came out of a verified session (or in tests).
 */
export function ownerFromVerifiedSession(userId: string): Owner {
  return { id: userId } as Owner;
}

/** `WHERE <table>.user_id = <owner>` — the single isolation predicate. */
export function ownedBy(table: { userId: PgColumn }, owner: Owner): SQL {
  return eq(table.userId, owner.id);
}
