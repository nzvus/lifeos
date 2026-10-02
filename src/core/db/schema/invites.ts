/**
 * core/db/schema/invites.ts — invitations to sign up (ADR-0034). An admin
 * creates one per friend and sends its link; it works once, until it
 * expires. Only a hash of the code is stored: whoever reads the database
 * cannot use an invitation. A new table rather than columns on `user`
 * (the migration-merge-order lesson).
 */
import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

const tstz = (name: string) => timestamp(name, { withTimezone: true });

export const invites = pgTable(
  "invites",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    /** SHA-256 of the code, hex. */
    codeHash: text("code_hash").notNull().unique(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: tstz("created_at").defaultNow().notNull(),
    expiresAt: tstz("expires_at").notNull(),
    /** Claimed: set atomically while the account is being created. */
    usedAt: tstz("used_at"),
    usedEmail: text("used_email"),
    /** The account it created, once it exists. */
    usedBy: uuid("used_by").references(() => user.id, { onDelete: "set null" }),
  },
  (t) => [index("invites_created_by_idx").on(t.createdBy)],
);
