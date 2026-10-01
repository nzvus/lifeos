/**
 * app/(app)/assistant/actions.ts — the assistant's server actions (ADR-0018):
 * the key in Settings, sending a message (one agent turn), confirming or
 * dismissing a pending action, undoing a change. The model runs here, on
 * the server, with the user's own key; every tool acts as the session's
 * owner.
 */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { env } from "@/app/_server/env";
import { fetchOff } from "@/app/_server/openfoodfacts";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { runConfirmed, runTurn, systemPrompt } from "@/core/assistant/agent";
import {
  ModelError,
  openRouterComplete,
  type ChatMessage,
  type ContentPart,
} from "@/core/assistant/model";
import {
  addMessage,
  clearKey,
  createConversation,
  deleteConversation,
  getApiKey,
  getConversation,
  getKeyStatus,
  restoreConversation,
  saveKey,
  type Message,
} from "@/core/assistant/repositories/assistant";
import { todayIn } from "@/core/shared/dates";
import type { FormState } from "@/core/shared/result";
import { isTrashKind, moveToTrash } from "@/core/trash/trash";

type Outcome = { ok: boolean; message?: string };

const secret = () => env().ASSISTANT_KEY_SECRET ?? null;

export async function saveAssistantKeyAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const s = secret();
  // The card is hidden without the secret; this guards a forged request.
  if (!s) return { status: "error", errors: { _form: "not_found" }, values: {} };
  const v = formToObject(formData);
  const key = (v.key ?? "").trim();
  const model = (v.model ?? "").trim() || "openrouter/free";
  if (key && !/^[\w-]{10,300}$/.test(key))
    return { status: "error", errors: { key: "invalid_choice" }, values: { model } };
  if (model.length > 100)
    return { status: "error", errors: { model: "too_long" }, values: { model } };
  await saveKey(getDb(), owner, { key: key || null, model }, s);
  revalidatePath("/settings");
  revalidatePath("/assistant");
  return { status: "saved" };
}

export async function clearAssistantKeyAction(): Promise<Outcome> {
  const { owner } = await requireContext();
  await clearKey(getDb(), owner);
  revalidatePath("/settings");
  return { ok: true };
}

export type Attachment = {
  name: string;
  kind: "text" | "image";
  text?: string;
  dataUrl?: string;
};

/** Stored messages → what the model sees (photos of earlier turns become a note). */
function toChat(m: Message): ChatMessage | null {
  if (m.role === "user") {
    const notes = ((m.attachments as Attachment[] | null) ?? [])
      .map((a) =>
        a.kind === "text"
          ? `\n\n[${a.name}]\n${a.text ?? ""}`
          : `\n\n[photo sent: ${a.name}]`,
      )
      .join("");
    return { role: "user", content: m.content + notes };
  }
  if (m.role === "assistant")
    return {
      role: "assistant",
      content: m.content || null,
      ...(Array.isArray(m.toolCalls) && m.toolCalls.length
        ? { tool_calls: m.toolCalls as never }
        : {}),
    };
  if (m.role === "tool" && m.toolCallId)
    return { role: "tool", tool_call_id: m.toolCallId, content: m.content };
  return null;
}

/**
 * One turn: stores the user's message, runs the agent with the user's key,
 * stores what it said and did. Returns the conversation id (new or same).
 */
export async function sendMessageAction(input: {
  conversationId: string | null;
  text: string;
  attachments: Attachment[];
}): Promise<{ ok: boolean; conversationId?: string; message?: string }> {
  const { owner, settings, t } = await requireContext();
  const a = t.assistant;
  const s = secret();
  if (!s) return { ok: false, message: a.noSecret };
  const db = getDb();
  const apiKey = await getApiKey(db, owner, s);
  if (!apiKey) return { ok: false, message: a.noKey };
  const text = input.text.trim().slice(0, 8000);
  const attachments = input.attachments.slice(0, 4).map((x) => ({
    name: String(x.name).slice(0, 120),
    kind: x.kind === "image" ? ("image" as const) : ("text" as const),
    text: x.kind === "text" ? String(x.text ?? "").slice(0, 40000) : undefined,
    dataUrl:
      x.kind === "image" &&
      typeof x.dataUrl === "string" &&
      x.dataUrl.startsWith("data:image/")
        ? x.dataUrl
        : undefined,
  }));
  if (!text && attachments.length === 0) return { ok: false };

  const conversationId =
    input.conversationId && (await getConversation(db, owner, input.conversationId))
      ? input.conversationId
      : (await createConversation(db, owner, text || attachments[0]?.name || a.newChat))
          .id;
  const before = (await getConversation(db, owner, conversationId))!.messages;
  // Photos are sent now, but only their names are stored.
  await addMessage(db, owner, conversationId, {
    role: "user",
    content: text,
    attachments: attachments.map(({ dataUrl: _d, ...rest }) => rest),
  });

  const today = todayIn(settings.timezone);
  const notes = attachments
    .filter((x) => x.kind === "text")
    .map((x) => `\n\n[${x.name}]\n${x.text}`)
    .join("");
  const images = attachments.filter((x) => x.dataUrl);
  const userContent: string | ContentPart[] = images.length
    ? [
        { type: "text", text: text + notes },
        ...images.map((x) => ({
          type: "image_url" as const,
          image_url: { url: x.dataUrl! },
        })),
      ]
    : text + notes;
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(today, settings.locale) },
    ...before.map(toChat).filter((m): m is ChatMessage => m !== null),
    { role: "user", content: userContent },
  ];
  const status = await getKeyStatus(db, owner);
  try {
    const turn = await runTurn({
      complete: openRouterComplete(apiKey, env().baseURL),
      model: status.model,
      messages,
      ctx: { db, owner, today, timeZone: settings.timezone, lookupBarcode: fetchOff },
    });
    for (const m of turn.messages) {
      if (m.role === "assistant")
        await addMessage(db, owner, conversationId, {
          role: "assistant",
          content: m.content ?? "",
          toolCalls: m.tool_calls ?? null,
        });
      else if (m.role === "tool")
        await addMessage(db, owner, conversationId, {
          role: "tool",
          content: m.content,
          toolCallId: m.tool_call_id,
        });
    }
  } catch (e) {
    const code = e instanceof ModelError ? e.code : "model_failed";
    await addMessage(db, owner, conversationId, {
      role: "assistant",
      content: a.errors[code],
    });
    revalidatePath("/assistant");
    return { ok: false, conversationId, message: a.errors[code] };
  }
  revalidatePath("/", "layout"); // what it created shows everywhere
  return { ok: true, conversationId };
}

/** The pending action, recovered from the stored tool call (never from the browser). */
async function pendingCall(conversationId: string, toolCallId: string) {
  const { owner } = await requireContext();
  const c = await getConversation(getDb(), owner, conversationId);
  if (!c) return null;
  for (const m of c.messages) {
    const call = (
      Array.isArray(m.toolCalls)
        ? (m.toolCalls as { id: string; function: { name: string; arguments: string } }[])
        : []
    ).find((x) => x.id === toolCallId);
    if (call) {
      try {
        return {
          name: call.function.name,
          args: JSON.parse(call.function.arguments || "{}") as Record<string, unknown>,
        };
      } catch {
        return null;
      }
    }
  }
  return null;
}

export async function confirmPendingAction(
  conversationId: string,
  toolCallId: string,
  yes: boolean,
): Promise<Outcome> {
  const { owner, settings, t } = await requireContext();
  const db = getDb();
  const call = await pendingCall(conversationId, toolCallId);
  if (!call) return { ok: false, message: t.errors.not_found };
  let content = t.assistant.cancelled;
  if (yes) {
    const r = await runConfirmed(
      {
        db,
        owner,
        today: todayIn(settings.timezone),
        timeZone: settings.timezone,
        lookupBarcode: fetchOff,
      },
      call,
    );
    content = r.ok
      ? t.assistant.confirmed
      : `${t.assistant.errors.model_failed} ${JSON.stringify(r.error)}`;
  }
  // An assistant note answering that call: the pending card closes.
  await addMessage(db, owner, conversationId, { role: "assistant", content, toolCallId });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Undo something the assistant created: to the trash, like everywhere. */
export async function undoChangeAction(kind: string, id: string): Promise<Outcome> {
  const { owner, t } = await requireContext();
  if (!isTrashKind(kind)) return { ok: false, message: t.errors.not_found };
  const r = await moveToTrash(getDb(), owner, kind, id);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteConversationAction(id: string): Promise<Outcome> {
  const { owner, t } = await requireContext();
  const r = await deleteConversation(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  revalidatePath("/assistant");
  return { ok: true };
}

export async function restoreConversationAction(id: string): Promise<Outcome> {
  const { owner, t } = await requireContext();
  const r = await restoreConversation(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  revalidatePath("/assistant");
  return { ok: true };
}
