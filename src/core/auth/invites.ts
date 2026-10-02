/**
 * core/auth/invites.ts — invitations to sign up (ADR-0034).
 *
 * A code is 18 random bytes (base64url, 24 characters): unguessable, short
 * enough for a link. Only its SHA-256 is stored, as with a password reset
 * token. Using one is two steps, both called by core/auth/auth.ts:
 *   - claimInvite: while Better Auth creates the account, ONE conditional
 *     UPDATE marks it used. Two sign-ups with the same code cannot both
 *     win: the second updates no row and its account is not created.
 *   - linkInvite: once the account exists, its id is written in.
 */
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import type { Db } from "../db/client";
import { invites } from "../db/schema";
import type { Owner } from "../identity/owner";

export const INVITE_DAYS = 14;

const hash = (code: string) => createHash("sha256").update(code.trim()).digest("hex");

export type InviteView = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
  usedEmail: string | null;
};

/** A new invitation from `owner`; the code is returned once and never stored. */
export async function createInvite(
  db: Db,
  owner: Owner,
  now: Date,
): Promise<{ id: string; code: string; expiresAt: Date }> {
  const code = randomBytes(18).toString("base64url");
  const expiresAt = new Date(now.getTime() + INVITE_DAYS * 24 * 3600 * 1000);
  const [row] = await db
    .insert(invites)
    .values({ codeHash: hash(code), createdBy: owner.id, expiresAt })
    .returning({ id: invites.id });
  return { id: row!.id, code, expiresAt };
}

export async function listInvites(db: Db, owner: Owner): Promise<InviteView[]> {
  return db
    .select({
      id: invites.id,
      createdAt: invites.createdAt,
      expiresAt: invites.expiresAt,
      usedAt: invites.usedAt,
      usedEmail: invites.usedEmail,
    })
    .from(invites)
    .where(eq(invites.createdBy, owner.id))
    .orderBy(desc(invites.createdAt));
}

/** Withdraws an invitation (or forgets a used one). Mine only. */
export async function deleteInvite(db: Db, owner: Owner, id: string): Promise<void> {
  await db
    .delete(invites)
    .where(and(eq(invites.id, id), eq(invites.createdBy, owner.id)));
}

const open = (code: string, now: Date) =>
  and(
    eq(invites.codeHash, hash(code)),
    isNull(invites.usedAt),
    gt(invites.expiresAt, now),
  );

/** Unused and not expired: checked before the sign-up starts, for a clear error. */
export async function inviteUsable(db: Db, code: string, now: Date): Promise<boolean> {
  const [row] = await db.select({ id: invites.id }).from(invites).where(open(code, now));
  return Boolean(row);
}

/** Marks the invitation used, if it still can be. False: refuse the account. */
export async function claimInvite(
  db: Db,
  code: string,
  email: string,
  now: Date,
): Promise<boolean> {
  const rows = await db
    .update(invites)
    .set({ usedAt: now, usedEmail: email })
    .where(open(code, now))
    .returning({ id: invites.id });
  return rows.length === 1;
}

/** Writes the created account's id into the invitation it used. */
export async function linkInvite(db: Db, code: string, userId: string): Promise<void> {
  await db
    .update(invites)
    .set({ usedBy: userId })
    .where(and(eq(invites.codeHash, hash(code)), isNull(invites.usedBy)));
}
