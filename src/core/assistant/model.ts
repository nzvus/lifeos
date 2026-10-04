/**
 * core/assistant/model.ts — talking to the language model (ADR-0018).
 *
 * The agent depends only on the `Complete` function type, so tests pass a
 * fake one and never touch the network. `openRouterComplete` is the real
 * one: OpenRouter's OpenAI-compatible chat completions with tool calling.
 * `fetch` is the platform's (no SDK, no framework in core).
 */

/** A message as the model sees it (OpenAI chat format). */
export type ChatMessage =
  | { role: "system" | "user"; content: string | ContentPart[] }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string };

export type ContentPart =
  { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

/** A tool as described to the model (JSON schema parameters). */
export type ToolSpec = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

export type Completion = { content: string | null; toolCalls: ToolCall[] };

export type Complete = (req: {
  model: string;
  messages: ChatMessage[];
  tools: ToolSpec[];
}) => Promise<Completion>;

/** A failure the UI can explain: no key, the free plan's limit, the model failing. */
export class ModelError extends Error {
  constructor(
    readonly code: "rate_limited" | "unauthorized" | "model_failed",
    message: string,
  ) {
    super(message);
  }
}

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export function openRouterComplete(apiKey: string, appUrl: string): Complete {
  return async ({ model, messages, tools }) => {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter's app attribution (optional, harmless).
        "HTTP-Referer": appUrl,
        "X-Title": "Lifeos",
      },
      // No tools = a plain answer (e.g. a receipt read as JSON).
      body: JSON.stringify(
        tools.length
          ? { model, messages, tools, tool_choice: "auto" }
          : { model, messages },
      ),
    });
    if (res.status === 429) throw new ModelError("rate_limited", await res.text());
    if (res.status === 401 || res.status === 403)
      throw new ModelError("unauthorized", await res.text());
    if (!res.ok)
      throw new ModelError("model_failed", `${res.status} ${await res.text()}`);
    const body = (await res.json()) as {
      choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[];
      error?: { message?: string };
    };
    if (body.error) throw new ModelError("model_failed", body.error.message ?? "error");
    const msg = body.choices?.[0]?.message;
    return { content: msg?.content ?? null, toolCalls: msg?.tool_calls ?? [] };
  };
}
