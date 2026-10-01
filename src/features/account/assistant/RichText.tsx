/**
 * features/account/assistant/RichText.tsx — the little Markdown models
 * write (paragraphs, "- " and "1. " lists, **bold**, `code`, ### headings)
 * turned into React elements. Never HTML: the text is the model's, so it
 * is rendered as text, piece by piece, and nothing in it can run.
 */
import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    out.push(
      tok.startsWith("**") ? (
        <strong key={m.index}>{tok.slice(2, -2)}</strong>
      ) : (
        <code key={m.index} className="rounded-badge bg-paper px-1 font-display">
          {tok.slice(1, -1)}
        </code>
      ),
    );
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
          const ordered = /^\s*\d/.test(lines[0]!);
          const items = lines.map((l) => l.replace(/^\s*([-*•]|\d+[.)])\s+/, ""));
          const List = ordered ? "ol" : "ul";
          return (
            <List
              key={i}
              className={`flex flex-col gap-1 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}
            >
              {items.map((it, j) => (
                <li key={j}>{inline(it)}</li>
              ))}
            </List>
          );
        }
        const heading = /^#{1,4}\s+/.test(lines[0]!);
        if (heading && lines.length === 1)
          return (
            <p key={i} className="font-display text-item font-semibold">
              {inline(lines[0]!.replace(/^#{1,4}\s+/, ""))}
            </p>
          );
        return (
          <p key={i} className="whitespace-pre-wrap">
            {inline(block.replace(/^#{1,4}\s+/gm, ""))}
          </p>
        );
      })}
    </div>
  );
}
