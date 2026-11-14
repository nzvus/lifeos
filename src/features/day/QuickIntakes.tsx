"use client";
/**
 * «Al volo» (FOOD-44, FOOD-05, ADR-0060; the 26 Oct idea he did not contest):
 * the «assunzioni» he takes most, one tap each at its dose — no composer, no
 * role, no score — with «Annulla» for 5 s. Under the water on Oggi and Cibo.
 * The dock he edits (PAT-99, his O5): «Modifica» opens a sheet with what he pinned («Su»,
 * «Togli») and the other «assunzioni» («Fissa»); each tap saves, the row follows.
 */
import { useState } from "react";
import { Box, Glyph, Sheet, useToast, type GlyphOf } from "@lifeos/kit";

export type Quick = {
  foodId: string;
  name: string;
  /** «1 capsula», «3 g». */
  dose: string;
  of?: GlyphOf;
};

export function QuickIntakes({
  day,
  items,
  log,
  remove,
  all,
  pins,
  savePins,
}: {
  day: string;
  items: readonly Quick[];
  /** Every «assunzione» he could pin, and the ones he did, in his order. */
  all: readonly Quick[];
  pins: readonly string[];
  savePins: (pins: string[]) => Promise<string[]>;
  log: (day: string, foodId: string) => Promise<string | null>;
  remove: (id: string) => Promise<boolean>;
}) {
  const { say, toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [mine, setMine] = useState<string[]>([...pins]);
  if (all.length === 0) return null;
  const byId = new Map(all.map((q) => [q.foodId, q]));
  const pinned = mine.map((id) => byId.get(id)).filter((q): q is Quick => !!q);
  const others = all.filter((q) => !mine.includes(q.foodId));
  const keep = (next: string[]) => {
    setMine(next);
    void savePins(next).then(setMine, () => setMine([...pins]));
  };
  const row = (q: Quick) => ({
    fam: "drink",
    ...(q.of ? { of: q.of } : {}),
    title: q.name,
    meta: q.dose,
  });
  return (
    <div className="k-stack g1" aria-label="Al volo">
      <div className="k-line between">
        <span className="k-cap">Al volo</span>
        <button type="button" className="k-btn link" onClick={() => setEdit(true)}>
          Modifica
        </button>
      </div>
      <Sheet
        open={edit}
        title="Al volo"
        meta="Quello che fissi resta qui, nel tuo ordine. Il resto lo propone l'app."
        onClose={() => setEdit(false)}
      >
        <div className="k-stack g2">
          <span className="k-cap">Fissati</span>
          {pinned.length === 0 && <p className="k-meta">Niente di fissato.</p>}
          {pinned.map((q, i) => (
            <Box
              key={q.foodId}
              density="row"
              rail={false}
              entry={row(q)}
              acts={[
                ...(i > 0
                  ? [
                      {
                        label: "Su",
                        aria: "Sposta su " + q.name,
                        onClick: () =>
                          keep([
                            ...mine.slice(0, i - 1),
                            mine[i]!,
                            mine[i - 1]!,
                            ...mine.slice(i + 1),
                          ]),
                      },
                    ]
                  : []),
                {
                  label: "Togli",
                  aria: "Togli " + q.name + " da Al volo",
                  onClick: () => keep(mine.filter((id) => id !== q.foodId)),
                },
              ]}
            />
          ))}
          {others.length > 0 && <span className="k-cap">Altre assunzioni</span>}
          {others.map((q) => (
            <Box
              key={q.foodId}
              density="row"
              rail={false}
              entry={row(q)}
              acts={[
                {
                  label: "Fissa",
                  aria: "Fissa " + q.name + " in Al volo",
                  onClick: () => keep([...mine, q.foodId]),
                },
              ]}
            />
          ))}
        </div>
      </Sheet>
      <div className="k-chips">
        {items.map((q) => (
          <button
            key={q.foodId}
            type="button"
            className="k-chip"
            aria-busy={busy === q.foodId}
            aria-label={"Segna " + q.name + ", " + q.dose}
            onClick={async () => {
              setBusy(q.foodId);
              const id = await log(day, q.foodId).catch(() => null);
              setBusy(null);
              if (id) say(q.name + " · " + q.dose, () => remove(id));
              else say("Non è stato salvato. Riprova.");
            }}
          >
            {q.of && <Glyph of={q.of} size="s" />}
            {q.name}
            <span className="k-meta">{q.dose}</span>
          </button>
        ))}
      </div>
      {toast}
    </div>
  );
}
