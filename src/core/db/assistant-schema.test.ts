/**
 * Tests for migration 0015 (ADR-0018): a message belongs to a conversation
 * of the same user — the database refuses anything else — and has a role.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "./client";
import { assistantConversations, assistantMessages } from "./schema";
import type { Owner } from "../identity/owner";
import { createTestDb, createTestUser } from "../testing/test-db";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
});
afterEach(() => close());

describe("assistant schema (migration 0015)", () => {
  it("keeps messages inside their owner's conversation", async () => {
    const [c] = await db
      .insert(assistantConversations)
      .values({ userId: me.id, title: "Spesa" })
      .returning();
    await db
      .insert(assistantMessages)
      .values({ userId: me.id, conversationId: c!.id, role: "user", content: "ciao" });
    // Someone else's message can't be attached to my conversation.
    await expect(
      db
        .insert(assistantMessages)
        .values({ userId: other.id, conversationId: c!.id, role: "user", content: "x" }),
    ).rejects.toThrow();
    // Roles are closed.
    await expect(
      db
        .insert(assistantMessages)
        .values({ userId: me.id, conversationId: c!.id, role: "system" as "user" }),
    ).rejects.toThrow();
  });
});
