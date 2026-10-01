/**
 * core/db/schema/assistant.ts — the assistant's conversations (ADR-0018).
 *
 *   assistant_conversations ──< assistant_messages
 *
 * A message is the user's text (with attachments turned into text, or a
 * note that a photo was sent), the assistant's reply, or a tool's result.
 * Tool calls and results are kept as JSON, so a conversation shows exactly
 * what the assistant did — and each change it made can be undone.
 */
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

const tstz = (name: string) => timestamp(name, { withTimezone: true });

export const assistantConversations = pgTable(
  "assistant_conversations",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    // ADR-0015: in the trash since then (null = live); purged after 30 days.
    deletedAt: tstz("deleted_at"),
  },
  (t) => [
    unique("assistant_conversations_id_user_uq").on(t.id, t.userId),
    index("assistant_conversations_user_idx").on(t.userId, t.updatedAt),
  ],
);

export const ASSISTANT_ROLES = ["user", "assistant", "tool"] as const;
export type AssistantRole = (typeof ASSISTANT_ROLES)[number];

export const assistantMessages = pgTable(
  "assistant_messages",
  {
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    userId: uuid("user_id").notNull(),
    conversationId: uuid("conversation_id").notNull(),
    role: text("role").$type<AssistantRole>().notNull(),
    content: text("content").notNull().default(""),
    // The model's tool calls (assistant) or the call this answers (tool).
    toolCalls: jsonb("tool_calls"),
    toolCallId: text("tool_call_id"),
    // Attachments as sent: [{ name, kind: "text" | "image", note }].
    attachments: jsonb("attachments"),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      name: "assistant_messages_conversation_fk",
      columns: [t.conversationId, t.userId],
      foreignColumns: [assistantConversations.id, assistantConversations.userId],
    }).onDelete("cascade"),
    check("assistant_messages_role_ck", sql`${t.role} in ('user', 'assistant', 'tool')`),
    index("assistant_messages_conversation_idx").on(t.conversationId, t.createdAt),
  ],
);
