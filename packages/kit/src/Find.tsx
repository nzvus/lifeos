"use client";
/**
 * Find (PAT-41): every search in the app. One field, one matcher (`find.ts`), filters as chips;
 * the results are rows (8, then «Mostra altri»), the whole row the target. With nothing typed it
 * shows what he usually takes at this hour.
 */
import { useState } from "react";
import { find, type Findable } from "./find";
import { Glyph } from "./Glyph";
import { List } from "./List";
import { WORDS } from "./words";

export type FindItem = Findable & { meta?: string };

export function Find<T extends FindItem>({
  items,
  label,
  hour,
  filters = [],
  onPick,
  autoFocus = false,
  all = false,
  idle,
}: {
  items: readonly T[];
  /** What is searched, said in the field: «Cerca un cibo». */
  label: string;
  /** The hour now (0–23), for «di solito a quest'ora». */
  hour: number;
  filters?: readonly { key: string; label: string }[];
  onPick: (item: T) => void;
  autoFocus?: boolean;
  /** With nothing typed, every item, not only the habitual ones (a short choice: «Unisci»). */
  all?: boolean;
  /** With nothing typed, these rows instead (⊕'s types, PAT-60); typing searches `items`. */
  idle?: readonly T[];
}) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const found =
    idle && !q.trim()
      ? idle.filter((i) => !tag || (i.tags ?? []).includes(tag))
      : find(items, q, { hour, tag, all });
  return (
    <div className="k-stack g2 k-find">
      <label className="k-search">
        <Glyph of={{ ui: "search" }} decorative />
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          aria-label={label}
          placeholder={label}
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      {filters.length > 0 && (
        <div className="k-chips" role="group" aria-label={label}>
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className={"k-chip" + (tag === f.key ? " on" : "")}
              aria-pressed={tag === f.key}
              onClick={() => setTag(tag === f.key ? null : f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {found.length === 0 && q ? (
        <p className="k-meta">{WORDS.noMatch}</p>
      ) : (
        <List label={label}>
          {found.map((i) => (
            <button
              key={i.id}
              type="button"
              className="k-findrow"
              onClick={() => onPick(i)}
            >
              <span className="k-title">{i.name}</span>
              {i.meta && <span className="k-meta">{i.meta}</span>}
            </button>
          ))}
        </List>
      )}
    </div>
  );
}
