/**
 * E7 Judgements — scoring models (engines.md E7, concepts §7). A score is a
 * declared model: parts, each a metric against a band; weights with an
 * allowed range; locked health limits; sources; a version and a date.
 * - The person moves weights within their range; a health limit cannot go
 *   under its minimum, so it can never be switched off. An edit is dated,
 *   and every score says which version and which weights made it.
 * - A part that cannot be computed is left out and named; the others are
 *   weighed among themselves.
 * - Scores of different domains are never mixed: a model has one domain.
 */

export type WeightRange = { default: number; min: number; max: number };

export type PartDef = {
  key: string;
  weight: WeightRange;
  /** A health limit: shown as locked; its minimum is above zero. */
  locked?: boolean | undefined;
  /** Why it is there, for the score's page ("Come valutiamo"). */
  why: string;
};

export type ScoringModel = {
  id: string;
  domain: string;
  version: number;
  /** When this version was declared. */
  date: string;
  parts: readonly PartDef[];
  sources: readonly string[];
};

/** The person's weights for a model, dated; parts left out keep their default. */
export type Weights = {
  model: string;
  version: number;
  since: string;
  values: Readonly<Record<string, number>>;
};

export type WeightEdit = {
  weights: Weights;
  rejected: { key: string; asked: number; kept: number }[];
};

/** Applies an edit within each part's range; what falls outside is clamped and listed. */
export function editWeights(
  model: ScoringModel,
  asked: Readonly<Record<string, number>>,
  since: string,
): WeightEdit {
  const values: Record<string, number> = {};
  const rejected: WeightEdit["rejected"] = [];
  for (const p of model.parts) {
    const want = asked[p.key];
    if (want === undefined) continue;
    const kept = Math.min(p.weight.max, Math.max(p.weight.min, want));
    if (kept !== want) rejected.push({ key: p.key, asked: want, kept });
    values[p.key] = kept;
  }
  for (const key of Object.keys(asked))
    if (!model.parts.some((p) => p.key === key))
      rejected.push({ key, asked: asked[key]!, kept: 0 });
  return {
    weights: { model: model.id, version: model.version, since, values },
    rejected,
  };
}

export type Score = {
  model: string;
  version: number;
  /** The weights' date, or the model's when the defaults were used. */
  weightsSince: string;
  /** 0–100; null when no part could be computed. */
  value: number | null;
  parts: { key: string; score: number; weight: number; contribution: number }[];
  /** Parts left out because they could not be computed. */
  missing: string[];
};

/**
 * The score from each part's 0–1 value (null = cannot be computed). Weights come from the person's
 * edit when it is for this model and version, else the defaults; they are normalised over the parts
 * present. A part outside 0–1 is an error of its scorer.
 */
export function score(
  model: ScoringModel,
  parts: Readonly<Record<string, number | null>>,
  weights?: Weights,
): Score {
  const mine =
    weights && weights.model === model.id && weights.version === model.version
      ? weights
      : null;
  const present = model.parts.filter((p) => parts[p.key] != null);
  const missing = model.parts.filter((p) => parts[p.key] == null).map((p) => p.key);
  for (const p of present) {
    const s = parts[p.key]!;
    if (!(s >= 0 && s <= 1))
      throw new RangeError(`part ${p.key} of ${model.id} is out of 0–1: ${s}`);
  }
  const w = (p: PartDef) => mine?.values[p.key] ?? p.weight.default;
  const total = present.reduce((a, p) => a + w(p), 0);
  const out = present.map((p) => {
    const weight = total > 0 ? w(p) / total : 0;
    return {
      key: p.key,
      score: parts[p.key]!,
      weight,
      contribution: weight * parts[p.key]! * 100,
    };
  });
  return {
    model: model.id,
    version: model.version,
    weightsSince: mine?.since ?? model.date,
    value:
      present.length && total > 0
        ? Math.round(out.reduce((a, p) => a + p.contribution, 0))
        : null,
    parts: out,
    missing,
  };
}

/**
 * A metric against its band, 0–1: 1 inside; outside, it falls linearly to 0 at `tolerance` beyond
 * the edge (in the metric's unit). "at least" has no upper edge, "at most" no lower one.
 */
export function bandScore(
  value: number,
  band: { low?: number | undefined; high?: number | undefined },
  tolerance: number,
): number {
  if (!(tolerance > 0))
    throw new RangeError(`tolerance must be positive, got ${tolerance}`);
  const below = band.low !== undefined && value < band.low ? band.low - value : 0;
  const above = band.high !== undefined && value > band.high ? value - band.high : 0;
  return Math.max(0, 1 - (below + above) / tolerance);
}

/** Checks a model's declaration: defaults within ranges, locked parts with a minimum above zero. */
export function checkModel(m: ScoringModel): string[] {
  const errors: string[] = [];
  for (const p of m.parts) {
    const w = p.weight;
    if (!(w.min <= w.default && w.default <= w.max))
      errors.push(`${m.id}.${p.key}: default outside its range`);
    if (p.locked && w.min <= 0)
      errors.push(`${m.id}.${p.key}: a locked limit needs a minimum above 0`);
  }
  if (new Set(m.parts.map((p) => p.key)).size !== m.parts.length)
    errors.push(`${m.id}: duplicated part`);
  return errors;
}
