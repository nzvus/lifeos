/** Invitations (ADR-0034): one use, until they expire; only a hash stored. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import { invites } from "../db/schema";
import type { Owner } from "../identity/owner";
import { createTestDb, createTestUser } from "../testing/test-db";
import {
  claimInvite,
  createInvite,
  deleteInvite,
  inviteUsable,
  linkInvite,
  listInvites,
} from "./invites";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;
const now = new Date("2026-10-03T10:00:00Z");
const later = (days: number) => new Date(now.getTime() + days * 86_400_000);

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
});
afterEach(() => close());

describe("invitations", () => {
  it("work once: the second claim of the same code fails", async () => {
    const { code } = await createInvite(db, me, now);
    expect(await inviteUsable(db, code, now)).toBe(true);
    expect(await claimInvite(db, code, "friend@example.com", now)).toBe(true);
    expect(await claimInvite(db, code, "someone@example.com", now)).toBe(false);
    expect(await inviteUsable(db, code, now)).toBe(false);
    await linkInvite(db, code, other.id);
    const [row] = await listInvites(db, me);
    expect(row).toMatchObject({ usedEmail: "friend@example.com" });
  });

  it("expire after 14 days, and a wrong code is never usable", async () => {
    const { code } = await createInvite(db, me, now);
    expect(await inviteUsable(db, code, later(13))).toBe(true);
    expect(await claimInvite(db, code, "late@example.com", later(15))).toBe(false);
    expect(await inviteUsable(db, "not-a-code", now)).toBe(false);
  });

  it("store a hash, not the code", async () => {
    const { code } = await createInvite(db, me, now);
    const [row] = await db.select().from(invites);
    expect(row!.codeHash).not.toContain(code);
    expect(row!.codeHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("are listed and withdrawn by their creator only", async () => {
    const { id } = await createInvite(db, me, now);
    expect(await listInvites(db, other)).toEqual([]);
    await deleteInvite(db, other, id);
    expect(await listInvites(db, me)).toHaveLength(1);
    await deleteInvite(db, me, id);
    expect(await listInvites(db, me)).toEqual([]);
  });
});
