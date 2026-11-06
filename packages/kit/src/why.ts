/**
 * Perché? (PAT-51) and «non so» (PAT-55): the sheet behind a number is generated from its
 * metric declaration (MOD-40) — formula in words, inputs with source and confidence, coverage,
 * the fascia's source, the formula's version — never written by hand on a page. Pure.
 */
import { WORDS } from "./words";

export type Confidence = keyof typeof WORDS.confidence;

export type WhyDeclaration = {
  /** What the number is («Proteine di oggi»). */
  title: string;
  /** The formula in his words. */
  formula: string;
  inputs: readonly {
    label: string;
    value: string;
    source?: string;
    confidence: Confidence;
  }[];
  /** Days (or voci) with data in the window, and how many the judgement needs. */
  coverage?: { have: number; of: number; need: number; unit: string };
  fascia?: { words: string; source: string };
  version: string;
};

export type WhySection = {
  title: string;
  rows: { label: string; value: string; note?: string }[];
};

/** The sheet's sections, in order; an assumed input says it waits for his confirmation. */
export function whySections(d: WhyDeclaration): WhySection[] {
  const out: WhySection[] = [
    { title: WORDS.whySheet.formula, rows: [{ label: d.formula, value: "" }] },
    {
      title: WORDS.whySheet.inputs,
      rows: d.inputs.map((i) => ({
        label: i.label,
        value: i.value,
        note: [WORDS.confidence[i.confidence], i.source].filter(Boolean).join(" · "),
      })),
    },
  ];
  if (d.coverage)
    out.push({
      title: WORDS.whySheet.coverage,
      rows: [
        {
          label: `${d.coverage.have} su ${d.coverage.of} ${d.coverage.unit}`,
          value: "",
          ...(isUnknown(d.coverage)
            ? { note: `${WORDS.unknown}: ne servono ${d.coverage.need}` }
            : {}),
        },
      ],
    });
  if (d.fascia)
    out.push({
      title: WORDS.whySheet.fascia,
      rows: [{ label: d.fascia.words, value: "", note: d.fascia.source }],
    });
  out.push({ title: WORDS.whySheet.version, rows: [{ label: d.version, value: "" }] });
  return out;
}

/** Below the declared threshold the judgement is «non so» (MOD-41, PRD-23). */
export const isUnknown = (c: { have: number; need: number }) => c.have < c.need;

/** «non so» with what is missing: «Manca: il peso di ieri, la cena». */
export function unknownWords(missing: readonly string[]): {
  word: string;
  missing: string | null;
} {
  return {
    word: WORDS.unknown,
    missing: missing.length ? `${WORDS.missing}: ${missing.join(", ")}` : null,
  };
}
