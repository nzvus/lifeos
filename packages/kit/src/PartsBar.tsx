"use client";
/**
 * One bar for a thing made of parts (VIS-106) and its voto bar (VIS-107; his 21 Nov, §139–§141):
 * columns side by side like the voto's skyline, each as wide as its weight and as full as its
 * value, each column's fill split into blocks — by part (a meal's ingredients) or by kind (the
 * origins «Il giorno» draws). A touched part lights its blocks in every bar that shows it and
 * dims the rest (VIS-50's light). The macro bar is coloured by nutrient; the voto bar by band,
 * with the «bene» line at 70, so the two never read as one. The kit knows no type (PAT-81).
 */
import type { CSSProperties } from "react";
import { band } from "./Box";
import { F, MET } from "./format";
import { KINDS, MACRO_COLOR, NAME, type NutrientsData } from "./nutrient-rows";

export type PartsPiece = { part: string; share: number; tone: number };
export type PartsColumn = {
  key: string;
  label: string;
  /** Its width among the columns. */
  weight: number;
  /** 0…1 of its scale. */
  fill: number;
  color: string;
  pieces: PartsPiece[];
};

export type PartsMode = "parts" | "kinds";

/** The tones of the parts, by energy (the most first, darker): the food chips' ranks. */
const TONES = [1, 0.72, 0.5, 0.34, 0.22];
const mix = (color: string, tone: number) =>
  `color-mix(in srgb, ${color} ${Math.round(22 + tone * 78)}%, var(--sheet))`;

/**
 * A meal's macros as one bar (VIS-106): by part from `foods`, by kind from each macro's parts.
 * A column is full when the macro is in proportion to the meal's energy against the day's targets
 * (protein 20 g of 168 in a meal of 380 kcal of 2.105: 0,12 ÷ 0,18 = two thirds full) — the day's
 * whole target would leave every meal's column nearly empty. Without targets, one shared scale.
 */
export function macroColumns(d: NutrientsData, mode: PartsMode): PartsColumn[] {
  const share = d.kcal && d.kcal.t ? d.kcal.v / d.kcal.t : null;
  const shared = Math.max(0, ...d.macros.map((m) => m.v)) || 1;
  const foods = [...(d.foods ?? [])].sort((a, b) => b.kcal - a.kcal);
  const rank = new Map(
    foods.map((f, i) => [f.key, TONES[Math.min(i, TONES.length - 1)]!]),
  );
  return d.macros.map((m) => {
    const scale = m.t != null && share ? m.t * share : shared;
    const grams = (r: Record<string, number> | undefined) =>
      Object.values(r ?? {}).reduce((a, b) => a + b, 0);
    const byPart = (d.foods ?? [])
      .map((f) => ({
        part: f.key,
        g: grams(f.macros[m.key]),
        tone: rank.get(f.key) ?? 1,
      }))
      .filter((x) => x.g > 0);
    const byKind = KINDS[m.key]
      .map(([k, , tone]) => ({ part: k, g: m.parts?.[k] ?? 0, tone }))
      .filter((x) => x.g > 0);
    const list = mode === "parts" && byPart.length ? byPart : byKind;
    const sum = list.reduce((a, x) => a + x.g, 0);
    return {
      key: m.key,
      label:
        NAME[m.key] +
        " " +
        F.num(m.v, "g") +
        (m.t == null ? "" : " su " + F.num(m.t, "g")),
      weight: 1,
      fill: Math.min(1, m.v / scale),
      color: MACRO_COLOR[m.key],
      pieces:
        sum > 0
          ? list.map((x) => ({ part: x.part, share: x.g / sum, tone: x.tone }))
          : [],
    };
  });
}

/** A voto as its bar (VIS-107): a column per criterion, split by each part's share (MOD-61). */
export function votoColumns(
  score: {
    parts: {
      name: string;
      score: number;
      weight: number;
      split?: Record<string, number>;
    }[];
  },
  /** The parts' order and tones, the same as the macro bar's (by energy). */
  tones: Record<string, number> = {},
): PartsColumn[] {
  return score.parts.map((q) => ({
    key: q.name,
    label: q.name + " " + Math.round(q.score * 100),
    weight: q.weight,
    fill: q.score,
    color: band(q.score * 100),
    pieces: Object.entries(q.split ?? {})
      .filter(([, s]) => s > 0)
      .map(([part, share]) => ({ part, share, tone: tones[part] ?? 1 })),
  }));
}

/** The parts' tones by energy, for a voto bar drawn beside a macro bar. */
export function partTones(d: NutrientsData): Record<string, number> {
  return Object.fromEntries(
    [...(d.foods ?? [])]
      .sort((a, b) => b.kcal - a.kcal)
      .map((f, i) => [f.key, TONES[Math.min(i, TONES.length - 1)]!]),
  );
}

export function PartsBar({
  columns,
  label,
  kind,
  lit = null,
  onPart,
}: {
  columns: PartsColumn[];
  /** What it shows, for a screen reader («Macro», «Voto»). */
  label: string;
  kind: "amount" | "voto";
  /** The part lit (its key); the others dim. */
  lit?: string | null;
  onPart?: (part: string) => void;
}) {
  return (
    <div className={"k-pbar " + kind} role="group" aria-label={label}>
      {columns.map((c) => (
        <span
          key={c.key}
          className="col"
          role="img"
          aria-label={c.label}
          style={{ flexGrow: c.weight } as CSSProperties}
        >
          <span className="fill" style={{ height: (c.fill * 100).toFixed(1) + "%" }}>
            {c.pieces.length === 0 ? (
              <span className="pc" style={{ flexGrow: 1, background: mix(c.color, 1) }} />
            ) : (
              c.pieces.map((p) => (
                <span
                  key={p.part}
                  className={
                    "pc" +
                    (lit && lit !== p.part ? " dim" : "") +
                    (lit === p.part ? " lit" : "")
                  }
                  style={{ flexGrow: p.share, background: mix(c.color, p.tone) }}
                  {...(onPart ? { onClick: () => onPart(p.part) } : {})}
                />
              ))
            )}
          </span>
        </span>
      ))}
      {kind === "voto" && <span className="ln" style={{ bottom: MET + "%" }} />}
    </div>
  );
}
