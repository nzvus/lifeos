/**
 * core/identity/owner.ts — the isolation gate, as v1's (ADR-0006, ADR-0057).
 *
 * `Owner` is a branded type: a plain `{ id }` or a raw string is refused
 * where an Owner is required, so a repository can only be called with one
 * made by `ownerFromVerifiedSession` (the app's composition root, right
 * after Better Auth checked the cookie; tests; local scripts by email).
 * `ownedBy` is the one `WHERE user_id = …` every query on an owned table
 * uses: the hook where row-level security would go (ADR-0006).
 */
import { eq, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

declare const ownerBrand: unique symbol;

export type Owner = {
  readonly id: string;
  readonly [ownerBrand]: true;
};

/** Only with an id that came out of a verified session (or in tests and local scripts). */
export function ownerFromVerifiedSession(userId: string): Owner {
  return { id: userId } as Owner;
}

/** `WHERE <table>.user_id = <owner>`: the single isolation predicate. */
export function ownedBy(table: { userId: PgColumn }, owner: Owner): SQL {
  return eq(table.userId, owner.id);
}
