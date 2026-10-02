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
  Loader2,
  Sparkles,
  Wrench,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Send,
  Undo2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { CARD } from "@/ui/Card";
import { FormAlert } from "@/ui/FormAlert";
import { toast } from "@/ui/Toast";
import { RichText } from "./RichText";
import { Thinking } from "./Thinking";
import {
  ocrImage,
  PDF_FILE,
  readPdf,
  readSpreadsheet,
  readTextFile,
  SHEET_FILE,
  shrinkImage,
  TEXT_FILE,
} from "./extract";

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
type SpeechLike = {
  lang: string;
  interimResults: boolean;
  onresult: (e: {
    results: { [i: number]: { [j: number]: { transcript: string } } };
  }) => void;
  onend: () => void;
  start: () => void;
};
type Outcome = { ok: boolean; message?: string };

export function Chat({
  conversationId,
  items,
  enabled,
  lang,
  send,
  confirm,
  undo,
  t,
}: {
  conversationId: string | null;
  items: ChatItem[];
  enabled: boolean;
  /** BCP-47 language for dictation, e.g. "it-IT". */
  lang: string;
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
  // The newest message, or the assistant at work, stays in view.
  const end = useRef<HTMLDivElement>(null);
  const count = items.length;
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    end.current?.scrollIntoView({ block: "end", behavior: reduce ? "auto" : "smooth" });
  }, [count, pending]);

  const attach = async (list: FileList | null) => {
    if (!list) return;
    setError(null);
    for (const file of Array.from(list).slice(0, 4)) {
      const add = (x: Attachment) => setFiles((f) => [...f, x]);
      try {
        if (file.type.startsWith("image/") && sendPhoto) {
          add({ name: file.name, kind: "image", dataUrl: await shrinkImage(file) });
          continue;
        }
        setReading(true);
        const text = TEXT_FILE.test(file.name)
          ? await readTextFile(file)
          : PDF_FILE.test(file.name) || file.type === "application/pdf"
            ? await readPdf(file)
            : SHEET_FILE.test(file.name)
              ? await readSpreadsheet(file)
              : file.type.startsWith("image/")
                ? await ocrImage(file)
                : null;
        if (text === null) setError(fill(a.readFailed, { name: file.name }));
        else add({ name: file.name, kind: "text", text });
      } catch {
        setError(fill(a.readFailed, { name: file.name }));
      } finally {
        setReading(false);
      }
    }
    if (input.current) input.current.value = "";
  };

  // Dictation (Web Speech API): where the browser has it, a microphone button.
  const [listening, setListening] = useState(false);
  const dictate = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechLike;
      webkitSpeechRecognition?: new () => SpeechLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return setError(a.noVoice);
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = false;
    rec.onresult = (e) =>
      setText((tx) => `${tx}${tx ? " " : ""}${e.results[0]?.[0]?.transcript ?? ""}`);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  // The message shows at once, as in every chat app, and the composer
  // empties; if sending fails, the text and files come back. It is drawn
  // only while pending (until the saved conversation replaces it), so it is
  // never cleared by hand.
  const [outgoing, setOutgoing] = useState<{ text: string; names: string[] } | null>(
    null,
  );
  const submit = () => {
    // Outside the transition: updates inside it show only when it ends.
    setError(null);
    const sent = { text, files };
    setOutgoing({ text, names: files.map((f) => f.name) });
    setText("");
    setFiles([]);
    startTransition(async () => {
      const r = await send({ conversationId, text: sent.text, attachments: sent.files });
      if (r.message) setError(r.message);
      if (!r.ok && !r.conversationId) {
        setText(sent.text);
        setFiles(sent.files);
      }
      if (r.conversationId && r.conversationId !== conversationId)
        router.push(`/assistant?c=${r.conversationId}`);
      else router.refresh();
    });
  };

  const kindName = (k: string) => (t.trash.kinds as Record<string, string>)[k] ?? k;

  const empty = items.length === 0 && !pending;
  return (
    <section className={`${CARD} gap-4`} aria-label={a.title}>
      {empty ? (
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 font-display text-item font-semibold">
            <Sparkles size={20} aria-hidden="true" className="text-herb" />
            {a.welcome}
          </p>
          <p className="text-meta text-muted">{a.welcomeHint}</p>
          <div className="grid grid-cols-1 gap-2 @lg:grid-cols-2">
            {a.quick.map((q) => (
              <button
                key={q}
                type="button"
                disabled={!enabled}
                onClick={() => setText(q)}
                className="tile px-3 py-2 text-left text-meta hover:border-ink disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ol className="flex flex-col gap-4">
          {items.map((it) => {
            if (it.role === "user")
              return (
                <li
                  key={it.id}
                  className="ml-10 flex flex-col gap-1 self-end rounded-surface bg-paper px-3 py-2"
                >
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
                <li key={it.id} className="mr-6 flex gap-2 motion-safe:animate-rise">
                  <span className="section-icon mt-0.5 shrink-0" aria-label={a.me}>
                    <Sparkles size={16} aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    {it.text && <RichText text={it.text} />}
                    {it.tools.length > 0 && (
                      <span className="flex flex-wrap gap-1">
                        {it.tools.map((tool, i) => (
                          <span
                            key={`${tool}-${i}`}
                            className="inline-flex items-center gap-1 rounded-badge border border-hairline px-1.5 text-meta text-muted"
                          >
                            <Wrench size={12} aria-hidden="true" />
                            {(a.tools as Record<string, string>)[tool] ?? tool}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </li>
              );
            if (it.role === "change")
              return (
                <li
                  key={it.id}
                  className="ml-10 flex items-center justify-between gap-3 rounded-control border border-hairline px-3 py-2 text-meta"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Check size={14} aria-hidden="true" className="text-herb" />
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
                className="ml-10 flex flex-col gap-2 rounded-control border border-warn p-3 text-meta"
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
                        disabled={pending}
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
          {pending && outgoing && (
            <li className="ml-10 flex flex-col gap-1 self-end rounded-surface bg-paper px-3 py-2 motion-safe:animate-rise">
              {outgoing.text && <p className="whitespace-pre-wrap">{outgoing.text}</p>}
              {outgoing.names.map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center gap-1 text-meta text-muted"
                >
                  <FileText size={14} aria-hidden="true" />
                  {fill(a.attached, { name: n })}
                </span>
              ))}
            </li>
          )}
          {pending && <Thinking t={a} />}
        </ol>
      )}
      <div ref={end} />

      {error && <FormAlert tone="error">{error}</FormAlert>}
      <form
        className="flex flex-col gap-2 rounded-surface border border-hairline bg-sheet p-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (enabled) submit();
        }}
      >
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
            {reading && (
              <li className="inline-flex items-center gap-1.5 text-muted">
                <Loader2
                  size={14}
                  aria-hidden="true"
                  className="motion-safe:animate-spin"
                />
                {a.reading}
              </li>
            )}
          </ul>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends on a computer; Shift+Enter is a new line.
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              window.matchMedia("(pointer: fine)").matches
            ) {
              e.preventDefault();
              if (enabled && (text.trim() || files.length)) submit();
            }
          }}
          rows={2}
          placeholder={a.placeholder}
          disabled={!enabled}
          aria-label={a.placeholder}
          className="w-full resize-y bg-transparent px-1 py-1 text-body outline-none"
        />
        <div className="flex items-center gap-1">
          <input
            ref={input}
            type="file"
            multiple
            accept="image/*,.pdf,application/pdf,.xlsx,.json,.txt,.csv,.md"
            className="hidden"
            onChange={(e) => void attach(e.target.files)}
          />
          <button
            type="button"
            disabled={!enabled}
            onClick={() => input.current?.click()}
            aria-label={a.attach}
            title={a.attach}
            className={buttonClass({ variant: "quiet", size: "sm", iconOnly: true })}
          >
            <Paperclip size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={!enabled || listening}
            onClick={dictate}
            aria-label={a.dictate}
            title={a.dictate}
            className={buttonClass({
              variant: listening ? "primary" : "quiet",
              size: "sm",
              iconOnly: true,
            })}
          >
            <Mic size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-pressed={sendPhoto}
            onClick={() => setSendPhoto((v) => !v)}
            title={a.sendPhoto}
            className={`${buttonClass({ variant: sendPhoto ? "subtle" : "quiet", size: "sm" })} ${sendPhoto ? "" : "text-muted"}`}
          >
            <ImageIcon size={16} aria-hidden="true" />
            {sendPhoto ? a.photoOn : a.photoOff}
          </button>
          <button
            type="submit"
            disabled={
              !enabled || pending || reading || (!text.trim() && files.length === 0)
            }
            aria-label={a.send}
            title={a.send}
            className={`ml-auto ${buttonClass({ variant: "primary", size: "sm", iconOnly: true })}`}
          >
            {pending ? (
              <Loader2
                size={18}
                aria-hidden="true"
                className="motion-safe:animate-spin"
              />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
      {!empty && (
        <div className="flex flex-wrap gap-2">
          {a.quick.map((q) => (
            <button
              key={q}
              type="button"
              disabled={!enabled}
              onClick={() => setText(q)}
              className="max-w-full truncate rounded-badge border border-hairline px-2 py-1 text-meta text-muted hover:text-ink"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
