/**
 * core/assistant/agent.ts — one turn of the assistant (ADR-0018): the model
 * answers, calling tools; read and write tools run at once (writes are
 * collected as changes the UI can undo); a "confirm" tool stops the turn
 * with a preview, and nothing happens until the user says yes. At most
 * `maxSteps` model calls per turn (free plans count every call).
 *
 * Pure orchestration: the model (`complete`) and the tools' context are
 * passed in, so tests run with a fake model and a PGlite database.
 */
import type { ChatMessage, Complete, ToolCall } from "./model";
import { TOOL_SPECS, TOOLS, type ToolContext } from "./tools";
import type { TrashKind } from "../trash/trash";

export type Change = { tool: string; kind: TrashKind; id: string; label: string };
export type Pending = {
  toolCallId: string;
  name: string;
  args: Record<string, unknown>;
  preview: unknown;
};

export type TurnResult = {
  /** What to store after the user's message: assistant and tool messages, in order. */
  messages: ChatMessage[];
  changes: Change[];
  /** A confirm tool waiting for the user's yes. */
  pending: Pending | null;
};

export function systemPrompt(today: string, locale: string): string {
  return [
    `You are the assistant inside Lifeos, a nutrition, training and pantry app. Today is ${today}.`,
    `Answer in ${locale === "it" ? "Italian" : "English"}, briefly.`,
    "You act through tools; you can only do what they allow. Look things up before creating (find_ingredients, find_meals) to avoid duplicates.",
    "Never invent nutrition values: use a label the user gives (text from a photo is fine), or ask.",
    "Creating and logging happen at once and the user can undo them; deleting and importing show a preview the user confirms.",
    "For advice, read the data first (get_recent_days, get_day, get_pantry) and be concrete and kind; you are not a doctor.",
    "Quantities are per 100 g/ml for ingredients and per serving for meals.",
    "Receipts: for each line find_products; if it is not there, create_product (food linked to its ingredient via find_ingredients; detergents etc. in pieces, no ingredient), then add_purchase with the line's total price.",
    "Planning: read get_targets and get_pantry, prefer my meals (find_meals), then log_food with planned: true for the planned day; say what totals the plan reaches.",
    "Weekly review: get_recent_days(7), get_pantry and get_calibration (weight trend vs intake); compare with the targets, note training, and give 2–3 concrete suggestions.",
  ].join("\n");
}

function parseArgs(call: ToolCall): Record<string, unknown> {
  try {
    const v = JSON.parse(call.function.arguments || "{}");
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function runTurn(opts: {
  complete: Complete;
  model: string;
  /** System prompt + earlier messages + the user's new message. */
  messages: ChatMessage[];
  ctx: ToolContext;
  maxSteps?: number;
}): Promise<TurnResult> {
  const { complete, model, ctx } = opts;
  const history = [...opts.messages];
  const added: ChatMessage[] = [];
  const changes: Change[] = [];
  for (let step = 0; step < (opts.maxSteps ?? 6); step++) {
    const answer = await complete({ model, messages: history, tools: TOOL_SPECS });
    const msg: ChatMessage = {
      role: "assistant",
      content: answer.content,
      ...(answer.toolCalls.length ? { tool_calls: answer.toolCalls } : {}),
    };
    history.push(msg);
    added.push(msg);
    if (answer.toolCalls.length === 0) return { messages: added, changes, pending: null };

    let pending: Pending | null = null;
    for (const call of answer.toolCalls) {
      const tool = TOOLS[call.function.name];
      const args = parseArgs(call);
      let content: string;
      if (pending) {
        // One confirmation at a time; every call still gets an answer.
        content = JSON.stringify({
          ok: false,
          error: "skipped: waiting for the user's confirmation",
        });
      } else if (!tool) {
        content = JSON.stringify({
          ok: false,
          error: `unknown tool ${call.function.name}`,
        });
      } else {
        const r = await tool.run(ctx, args).catch((e: unknown) => ({
          ok: false as const,
          error: e instanceof Error ? e.message : "failed",
        }));
        if (tool.effect === "confirm" && r.ok) {
          pending = {
            toolCallId: call.id,
            name: call.function.name,
            args,
            preview: r.data,
          };
          content = JSON.stringify({ ok: true, waitingForUser: true, preview: r.data });
        } else {
          if (r.ok && r.change) changes.push({ tool: call.function.name, ...r.change });
          // The change rides along: the chat shows Undo next to it.
          content = JSON.stringify(
            r.ok ? { ok: true, data: r.data, change: r.change } : r,
          );
        }
      }
      const toolMsg: ChatMessage = { role: "tool", tool_call_id: call.id, content };
      history.push(toolMsg);
      added.push(toolMsg);
    }
    if (pending) return { messages: added, changes, pending };
  }
  return { messages: added, changes, pending: null };
}

/** The user said yes to a pending confirm tool: do it. */
export async function runConfirmed(
  ctx: ToolContext,
  pending: { name: string; args: Record<string, unknown> },
) {
  const tool = TOOLS[pending.name];
  if (!tool?.confirmed) return { ok: false as const, error: "not_found" };
  return tool.confirmed(ctx, pending.args);
}
