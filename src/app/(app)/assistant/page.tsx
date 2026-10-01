/**
 * app/(app)/assistant/page.tsx — URL /assistant[?c=<conversation id>]: the
 * assistant (ADR-0018). The server turns stored messages into what the
 * chat shows: texts, which tools were used, the changes with Undo, and a
 * pending confirmation (until a later note answers it).
 */
import { MessagesSquare, Plus } from "lucide-react";
import Link from "next/link";
import { env } from "@/app/_server/env";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  getConversation,
  getKeyStatus,
  listConversations,
} from "@/core/assistant/repositories/assistant";
import { Chat, type ChatItem } from "@/features/account/assistant/Chat";
import { buttonClass, TEXT_LINK } from "@/ui/button";
import { CARD } from "@/ui/Card";
import { ListItem } from "@/ui/ListItem";
import { PageHeader } from "@/ui/PageHeader";
import { Collapsible } from "@/ui/Collapsible";
import { TrashMenu } from "@/ui/TrashMenu";
import {
  confirmPendingAction,
  deleteConversationAction,
  restoreConversationAction,
  sendMessageAction,
  undoChangeAction,
} from "./actions";

// Free models can be slow; a turn may take several calls.
export const maxDuration = 60;

type Props = { searchParams: Promise<{ c?: string }> };

export default async function AssistantPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const a = t.assistant;
  const db = getDb();
  const { c } = await searchParams;
  const [status, conversations, conversation] = await Promise.all([
    getKeyStatus(db, owner),
    listConversations(db, owner),
    c ? getConversation(db, owner, c) : null,
  ]);
  const enabled = Boolean(env().ASSISTANT_KEY_SECRET) && status.set;

  // Stored messages → chat items. A tool result carries its change (Undo)
  // or a pending confirmation; a later assistant note with the same call id
  // answers it.
  const answered = new Set(
    (conversation?.messages ?? [])
      .filter((m) => m.role === "assistant" && m.toolCallId)
      .map((m) => m.toolCallId),
  );
  const items: ChatItem[] = [];
  for (const m of conversation?.messages ?? []) {
    if (m.role === "user") {
      items.push({
        id: m.id,
        role: "user",
        text: m.content,
        attachments: ((m.attachments as { name: string }[] | null) ?? []).map(
          (x) => x.name,
        ),
      });
    } else if (m.role === "assistant") {
      const tools = Array.isArray(m.toolCalls)
        ? (m.toolCalls as { function: { name: string } }[]).map((x) => x.function.name)
        : [];
      if (m.content || tools.length)
        items.push({ id: m.id, role: "assistant", text: m.content, tools });
    } else {
      let parsed: {
        change?: { kind: string; id: string; label: string };
        waitingForUser?: boolean;
        preview?: unknown;
      } = {};
      try {
        parsed = JSON.parse(m.content);
      } catch {}
      if (parsed.change) items.push({ id: m.id, role: "change", change: parsed.change });
      if (parsed.waitingForUser && m.toolCallId)
        items.push({
          id: m.id,
          role: "pending",
          toolCallId: m.toolCallId,
          preview: JSON.stringify(parsed.preview, null, 1).slice(0, 1500),
          open: !answered.has(m.toolCallId),
        });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={a.title} subtitle={a.subtitle} />
      {!enabled && (
        <p className={`${CARD} text-meta`}>
          {env().ASSISTANT_KEY_SECRET ? a.noKey : a.noSecret}{" "}
          <Link href="/settings" className={TEXT_LINK}>
            {t.energy.openSettings}
          </Link>
        </p>
      )}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {/* Phone: the list folded above the chat; wide: open, on the left. */}
        <div className="min-w-0">
          <Collapsible
            id="assistant-conversations"
            title={a.conversations}
            icon={<MessagesSquare size={20} aria-hidden="true" />}
            defaultOpen={false}
            summary={<span className="text-meta text-muted">{conversations.length}</span>}
          >
            <Link
              href="/assistant"
              className={`self-start ${buttonClass({ size: "sm" })}`}
            >
              <Plus size={16} aria-hidden="true" />
              {a.newChat}
            </Link>
            {conversations.length === 0 ? (
              <p className="text-muted">{a.empty}</p>
            ) : (
              <ul className="flex flex-col">
                {conversations.map((x) => (
                  <ListItem
                    key={x.id}
                    href={`/assistant?c=${x.id}`}
                    title={x.title || a.newChat}
                    action={
                      <TrashMenu
                        id={x.id}
                        name={x.title}
                        trash={deleteConversationAction}
                        restore={restoreConversationAction}
                        labels={t.actions}
                      />
                    }
                  />
                ))}
              </ul>
            )}
          </Collapsible>
        </div>
        <div className="min-w-0 lg:col-span-2">
          <Chat
            key={conversation?.id ?? "new"}
            conversationId={conversation?.id ?? null}
            items={items}
            enabled={enabled}
            lang={settings.locale === "it" ? "it-IT" : "en-GB"}
            send={sendMessageAction}
            confirm={confirmPendingAction}
            undo={undoChangeAction}
            t={{ assistant: a, trash: t.trash }}
          />
        </div>
      </div>
    </div>
  );
}
