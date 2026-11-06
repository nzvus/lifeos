"use client";
/**
 * «Come valutiamo»'s sliders (V-16): each part's weight within its range
 * (the green stretch), its share of the total as it moves, «Salva» (a dated
 * set of weights: every score is recomputed with it and says since when) and
 * «Valori consigliati» (back to the model's). A locked part cannot go under
 * its minimum.
 */
import { useState } from "react";
import { F, Glyph, type GlyphOf } from "@lifeos/kit";

export type WeightPart = {
  key: string;
  name: string;
  why: string;
  min: number;
  max: number;
  value: number;
  def: number;
  locked: boolean;
  now?: number | null;
};

export function WeightsForm({
  parts,
  of,
  since,
  save,
  reset,
}: {
  parts: WeightPart[];
  of: GlyphOf;
  /** The person's weights' date, null when the model's own apply. */
  since: string | null;
  save: (d: FormData) => Promise<void>;
  reset: () => Promise<void>;
}) {
  const [w, setW] = useState<Record<string, number>>(
    Object.fromEntries(parts.map((p) => [p.key, p.value])),
  );
  const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const changed = parts.some((p) => w[p.key] !== p.value);
  return (
    <form action={save} className="k-stack g3">
      {parts.map((p) => (
        <div key={p.key} className="k-field k-stack g1">
          <div className="k-line between">
            <label className="k-label k-line g1" htmlFor={"w-" + p.key}>
              <Glyph of={of} size="s" />
              {p.name}
              {p.locked && (
                <span role="img" aria-label="minimo bloccato">
                  <Glyph of={{ ui: "lock" }} size="xs" />
                </span>
              )}
            </label>
            <span className="k-num d4">{F.num((w[p.key]! / total) * 100, "%")}</span>
          </div>
          <div className="k-range">
            <span
              className="ok"
              style={{ left: p.min + "%", width: p.max - p.min + "%" }}
            />
            <input
              id={"w-" + p.key}
              name={p.key}
              type="range"
              min={0}
              max={100}
              step={1}
              value={w[p.key]}
              aria-label={"Peso di " + p.name + ", tra " + p.min + " e " + p.max}
              onChange={(e) =>
                setW({
                  ...w,
                  [p.key]: Math.min(p.max, Math.max(p.min, Number(e.target.value))),
                })
              }
            />
          </div>
          <span className="k-body">{p.why}</span>
          {p.now != null && (
            <span className="k-help">
              Voto ora: <span className="k-num">{Math.round(p.now * 100)}</span>
            </span>
          )}
        </div>
      ))}
      <span className="k-help">
        I pesi si muovono solo dentro il tratto verde; le parti col lucchetto non scendono
        sotto il loro minimo.{" "}
        {since
          ? "I tuoi pesi valgono dal " +
            F.date(since) +
            ": i voti sono ricalcolati con questi."
          : "Ora valgono i valori consigliati."}
      </span>
      <div className="k-line wrap g2">
        <button type="submit" className="k-btn primary" disabled={!changed}>
          Salva i pesi
        </button>
        {since && (
          <button type="submit" formAction={reset} className="k-btn secondary">
            Valori consigliati
          </button>
        )}
      </div>
    </form>
  );
}
