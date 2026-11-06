"use client";
/**
 * ObjectActions (PAT-16…20, PAT-22, PAT-23): the actions row at the end of an object page —
 * the everyday verbs, then «⋯ Altro» with the rare ones in a sheet, destructive last in tomato.
 * Which verbs exist comes from the registry (MOD-01); what each does, from `core/verbs`.
 */
import { useState } from "react";
import { DESTRUCTIVE, splitActions, type ObjectVerb } from "./actions";
import { Glyph } from "./Glyph";
import { Sheet } from "./Sheet";
import { WORDS } from "./words";

export function ObjectActions({
  verbs,
  archived = false,
  title,
  onVerb,
  labels = {},
  initiallyOpen = false,
}: {
  /** The type's verbs, as the registry declares them. */
  verbs: readonly string[];
  archived?: boolean;
  /** The object's name, for the sheet's title. */
  title: string;
  onVerb: (verb: ObjectVerb) => void;
  /** A type's own words for a verb («Salva come scheda»). */
  labels?: Partial<Record<ObjectVerb, string>>;
  /** «Altro» open from the start (the gallery's photos). */
  initiallyOpen?: boolean;
}) {
  const [more, setMore] = useState(initiallyOpen);
  const { row, more: rare } = splitActions(verbs, archived);
  const say = (v: ObjectVerb) => labels[v] ?? WORDS.verbs[v];
  return (
    <div className="k-actions">
      {row.map((v) => (
        <button key={v} type="button" className="k-btn act" onClick={() => onVerb(v)}>
          {say(v)}
        </button>
      ))}
      {rare.length > 0 && (
        <button
          type="button"
          className="k-btn act icon"
          aria-label={WORDS.more}
          onClick={() => setMore(true)}
        >
          <Glyph of={{ ui: "more" }} decorative />
        </button>
      )}
      <Sheet open={more} title={title} meta={WORDS.more} onClose={() => setMore(false)}>
        {rare.map((v) => (
          <button
            key={v}
            type="button"
            className={"k-btn act" + (DESTRUCTIVE.has(v) ? " danger" : "")}
            onClick={() => {
              setMore(false);
              onVerb(v);
            }}
          >
            {say(v)}
          </button>
        ))}
      </Sheet>
    </div>
  );
}
