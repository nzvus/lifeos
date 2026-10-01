/**
 * features/account/assistant/Chat.tsx — the conversation with the assistant
 * (ADR-0018): messages, the tools it used, each change with Undo, a pending
 * confirmation with Confirm / Leave it, and the composer.
 *
 * Attachments: photos from the camera, the gallery or files; JSON, TXT,
 * CSV, MD. By default a photo's TEXT is read here, on the phone
 * (tesseract.js, loaded only when needed, Italian + English), and only the
 * text is sent; "send the photo" sends the picture itself, shrunk to 1280 px.
 * Client component.
 */
"use client";

import {
  Check,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Send,
  Undo2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { CARD } from "@/ui/Card";
import { FormAlert } from "@/ui/FormAlert";
import { toast } from "@/ui/Toast";

export type ChatItem =
  | { id: string; role: "user"; text: string; attachments: string[] }
  | { id: string; role: "assistant"; text: string; tools: string[] }
  | { id: string; role: "change"; change: { kind: string; id: string; label: string } }
  | { id: string; role: "pending"; toolCallId: string; preview: string; open: boolean };

type Attachment = {
  name: string;
  kind: "text" | "image";
  text?: string;
  dataUrl?: string;
};
type Outcome = { ok: boolean; message?: string };

const TEXT_FILES = /\.(json|txt|csv|md)$/i;

/** A photo shrunk to `max` px on its long side, as a JPEG data URL. */
async function shrink(file: File, max = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

/** The text in a photo, read on this device (no upload). */
async function readText(file: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(["ita", "eng"]);
  try {
    const { data } = await worker.recognize(file);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}

export function Chat({
  conversationId,
  items,
  enabled,
  send,
  confirm,
  undo,
  t,
}: {
  conversationId: string | null;
  items: ChatItem[];
  enabled: boolean;
  send: (input: {
    conversationId: string | null;
    text: string;
    attachments: Attachment[];
  }) => Promise<{ ok: boolean; conversationId?: string; message?: string }>;
  confirm: (conversationId: string, toolCallId: string, yes: boolean) => Promise<Outcome>;
  undo: (kind: string, id: string) => Promise<Outcome>;
  t: Pick<Messages, "assistant" | "trash">;
}) {
  const a = t.assistant;
  const router = useRouter();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [sendPhoto, setSendPhoto] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const attach = async (list: FileList | null) => {
    if (!list) return;
    setError(null);
    for (const file of Array.from(list).slice(0, 4)) {
      if (TEXT_FILES.test(file.name)) {
        const content = (await file.text()).slice(0, 20000);
        setFiles((f) => [...f, { name: file.name, kind: "text", text: content }]);
      } else if (file.type.startsWith("image/")) {
        if (sendPhoto) {
          setFiles((f) => [...f, { name: file.name, kind: "image", dataUrl: "" }]);
          const dataUrl = await shrink(file);
          setFiles((f) =>
            f.map((x) =>
              x.name === file.name && x.kind === "image" ? { ...x, dataUrl } : x,
            ),
          );
        } else {
          setReading(true);
          try {
            const read = await readText(file);
            setFiles((f) => [...f, { name: file.name, kind: "text", text: read }]);
          } catch {
            setError(fill(a.readFailed, { name: file.name }));
          } finally {
            setReading(false);
          }
        }
      }
    }
    if (input.current) input.current.value = "";
  };

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const r = await send({ conversationId, text, attachments: files });
      if (r.message) setError(r.message);
      if (r.ok || r.conversationId) {
        setText("");
        setFiles([]);
      }
      if (r.conversationId && r.conversationId !== conversationId)
        router.push(`/assistant?c=${r.conversationId}`);
      else router.refresh();
    });

  const kindName = (k: string) => (t.trash.kinds as Record<string, string>)[k] ?? k;

  return (
    <section className={CARD} aria-label={a.title}>
      <ol className="flex flex-col gap-3">
        {items.map((it) => {
          if (it.role === "user")
            return (
              <li
                key={it.id}
                className="ml-8 flex flex-col gap-1 self-end rounded-surface bg-paper p-3"
              >
                <span className="text-meta font-semibold text-muted">{a.you}</span>
                {it.text && <p className="whitespace-pre-wrap">{it.text}</p>}
                {it.attachments.map((n) => (
                  <span
                    key={n}
                    className="inline-flex items-center gap-1 text-meta text-muted"
                  >
                    <FileText size={14} aria-hidden="true" />
                    {fill(a.attached, { name: n })}
                  </span>
                ))}
              </li>
            );
          if (it.role === "assistant")
            return (
              <li key={it.id} className="mr-8 flex flex-col gap-1">
                <span className="text-meta font-semibold text-herb">{a.me}</span>
                {it.text && <p className="whitespace-pre-wrap">{it.text}</p>}
                {it.tools.length > 0 && (
                  <span className="text-meta text-muted">
                    {fill(a.toolUsed, { name: it.tools.join(", ") })}
                  </span>
                )}
              </li>
            );
          if (it.role === "change")
            return (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 rounded-control border border-hairline px-3 py-2 text-meta"
              >
                <span>
                  {fill(a.done, {
                    what: `${kindName(it.change.kind)} «${it.change.label}»`,
                  })}
                </span>
                <button
                  type="button"
                  className={buttonClass({ variant: "subtle", size: "sm" })}
                  onClick={async () => {
                    const r = await undo(it.change.kind, it.change.id);
                    toast({
                      message: r.ok
                        ? fill(a.undone, { name: it.change.label })
                        : (r.message ?? ""),
                    });
                    router.refresh();
                  }}
                >
                  <Undo2 size={16} aria-hidden="true" />
                  {a.undo}
                </button>
              </li>
            );
          return (
            <li
              key={it.id}
              className="flex flex-col gap-2 rounded-control border border-warn p-3 text-meta"
            >
              <span className="font-semibold">{a.pendingTitle}</span>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-muted">
                {it.preview}
              </pre>
              {it.open && conversationId && (
                <div className="flex gap-2">
                  {[true, false].map((yes) => (
                    <button
                      key={String(yes)}
                      type="button"
                      className={buttonClass({
                        variant: yes ? "primary" : "quiet",
                        size: "sm",
                      })}
                      onClick={() =>
                        startTransition(async () => {
                          await confirm(conversationId, it.toolCallId, yes);
                          router.refresh();
                        })
                      }
                    >
                      {yes ? (
                        <Check size={16} aria-hidden="true" />
                      ) : (
                        <X size={16} aria-hidden="true" />
                      )}
                      {yes ? a.confirm : a.cancel}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
        {pending && <li className="text-meta text-muted">{a.thinking}</li>}
      </ol>

      {error && <FormAlert tone="error">{error}</FormAlert>}
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (enabled) submit();
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={a.placeholder}
          disabled={!enabled}
          className="rounded-control rule-b-medium border-ink bg-sheet px-2 py-1.5 text-body"
        />
        {(files.length > 0 || reading) && (
          <ul className="flex flex-wrap gap-2 text-meta">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="inline-flex items-center gap-1 rounded-badge border border-hairline px-2 py-1"
              >
                {f.kind === "image" ? (
                  <ImageIcon size={14} aria-hidden="true" />
                ) : (
                  <FileText size={14} aria-hidden="true" />
                )}
                {f.name}
                <button
                  type="button"
                  aria-label={a.removeAttachment}
                  onClick={() => setFiles((all) => all.filter((_, j) => j !== i))}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
            {reading && <li className="text-muted">{a.reading}</li>}
          </ul>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={input}
              type="file"
              multiple
              accept="image/*,.json,.txt,.csv,.md"
              className="hidden"
              onChange={(e) => void attach(e.target.files)}
            />
            <button
              type="button"
              disabled={!enabled}
              onClick={() => input.current?.click()}
              className={buttonClass({ variant: "subtle", size: "sm" })}
            >
              <Paperclip size={16} aria-hidden="true" />
              {a.attach}
            </button>
            <label className="inline-flex items-center gap-2 text-meta">
              <input
                type="checkbox"
                checked={sendPhoto}
                onChange={(e) => setSendPhoto(e.target.checked)}
                className="h-4 w-4 accent-herb"
              />
              {a.sendPhoto}
            </label>
          </div>
          <button
            type="submit"
            disabled={
              !enabled || pending || reading || (!text.trim() && files.length === 0)
            }
            className={buttonClass({ variant: "primary" })}
          >
            <Send size={18} aria-hidden="true" />
            {a.send}
          </button>
        </div>
      </form>
    </section>
  );
}
