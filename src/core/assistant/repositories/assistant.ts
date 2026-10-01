/**
 * core/assistant/repositories/assistant.ts — the assistant's key and its
 * conversations (ADR-0018), always owner-filtered.
 *
 * The key is stored encrypted (crypto.ts) with the server secret passed in;
 * reads return only "set or not" and its last 4 characters, except
 * `getApiKey`, which the server uses to call the model and never sends on.
 *
 * Tested in: assistant.test.ts.
 */
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  assistantConversations,
  assistantMessages,
  userSettings,
  type AssistantRole,
} from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { fail, ok, type Result } from "../../shared/result";
import { live } from "../../shared/trash";
import { decryptSecret, encryptSecret } from "../crypto";

export type KeyStatus = { set: boolean; last4: string | null; model: string };

export async function getKeyStatus(db: Db, owner: Owner): Promise<KeyStatus> {
  const [s] = await db
    .select({
      enc: userSettings.assistantKeyEnc,
      last4: userSettings.assistantKeyLast4,
      model: userSettings.assistantModel,
    })
    .from(userSettings)
    .where(ownedBy(userSettings, owner));
  return {
    set: Boolean(s?.enc),
    last4: s?.last4 ?? null,
    model: s?.model ?? "openrouter/free",
  };
}

export async function saveKey(
  db: Db,
  owner: Owner,
  input: { key: string | null; model: string },
  secret: string,
): Promise<void> {
  const values =
    input.key === null
      ? { assistantModel: input.model }
      : {
          assistantKeyEnc: encryptSecret(input.key, secret),
          assistantKeyLast4: input.key.slice(-4),
          assistantModel: input.model,
        };
  await db
    .insert(userSettings)
    .values({ userId: owner.id, ...values })
    .onConflictDoUpdate({ target: userSettings.userId, set: values });
}

export async function clearKey(db: Db, owner: Owner): Promise<void> {
  await db
    .update(userSettings)
    .set({ assistantKeyEnc: null, assistantKeyLast4: null })
    .where(ownedBy(userSettings, owner));
}

/** The plain key, for the server's call to the model only; null if unset or unreadable. */
export async function getApiKey(
  db: Db,
  owner: Owner,
  secret: string,
): Promise<string | null> {
  const [s] = await db
    .select({ enc: userSettings.assistantKeyEnc })
    .from(userSettings)
    .where(ownedBy(userSettings, owner));
  return s?.enc ? decryptSecret(s.enc, secret) : null;
}

export type Conversation = typeof assistantConversations.$inferSelect;
export type Message = typeof assistantMessages.$inferSelect;

export async function listConversations(db: Db, owner: Owner): Promise<Conversation[]> {
  return db
    .select()
    .from(assistantConversations)
    .where(and(ownedBy(assistantConversations, owner), live(assistantConversations)))
    .orderBy(desc(assistantConversations.updatedAt));
}

export async function createConversation(
  db: Db,
  owner: Owner,
  title: string,
): Promise<{ id: string }> {
  const [c] = await db
    .insert(assistantConversations)
    .values({ userId: owner.id, title: title.slice(0, 80) })
    .returning({ id: assistantConversations.id });
  return { id: c!.id };
}

export async function getConversation(
  db: Db,
  owner: Owner,
  id: string,
): Promise<(Conversation & { messages: Message[] }) | null> {
  const [c] = await db
    .select()
    .from(assistantConversations)
    .where(
      and(
        ownedBy(assistantConversations, owner),
        live(assistantConversations),
        eq(assistantConversations.id, id),
      ),
    );
  if (!c) return null;
  const messages = await db
    .select()
    .from(assistantMessages)
    .where(
      and(ownedBy(assistantMessages, owner), eq(assistantMessages.conversationId, id)),
    )
    .orderBy(asc(assistantMessages.createdAt));
  return { ...c, messages };
}

export async function addMessage(
  db: Db,
  owner: Owner,
  conversationId: string,
  m: {
    role: AssistantRole;
    content: string;
    toolCalls?: unknown;
    toolCallId?: string | null;
    attachments?: unknown;
  },
): Promise<Result<{ id: string }>> {
  if (!(await getConversation(db, owner, conversationId)))
    return fail({ _form: "not_found" });
  const [row] = await db
    .insert(assistantMessages)
    .values({
      userId: owner.id,
      conversationId,
      role: m.role,
      content: m.content,
      toolCalls: m.toolCalls ?? null,
      toolCallId: m.toolCallId ?? null,
      attachments: m.attachments ?? null,
    })
    .returning({ id: assistantMessages.id });
  // Touch the conversation, so the list shows the latest first.
  await db
    .update(assistantConversations)
    .set({ updatedAt: new Date() })
    .where(
      and(
        ownedBy(assistantConversations, owner),
        eq(assistantConversations.id, conversationId),
      ),
    );
  return ok({ id: row!.id });
}

export async function deleteConversation(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const done = await db
    .update(assistantConversations)
    .set({ deletedAt: new Date() })
    .where(
      and(
        ownedBy(assistantConversations, owner),
        live(assistantConversations),
        eq(assistantConversations.id, id),
      ),
    )
    .returning({ id: assistantConversations.id });
  return done.length ? ok(null) : fail({ _form: "not_found" });
}

export async function restoreConversation(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const done = await db
    .update(assistantConversations)
    .set({ deletedAt: null })
    .where(
      and(
        ownedBy(assistantConversations, owner),
        isNotNull(assistantConversations.deletedAt),
        eq(assistantConversations.id, id),
      ),
    )
    .returning({ id: assistantConversations.id });
  return done.length ? ok(null) : fail({ _form: "not_found" });
}
