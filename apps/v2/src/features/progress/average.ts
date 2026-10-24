/**
 * features/progress/average.ts — a period's score from its days' (Andamento:
 * the period box and «Gli ambiti», the Progress board): each part's mean
 * over the days that had it, the weights as the model gives them, the total
 * as the parts' weighted mean. A part no day had is named missing. A part
 * named with what decided it («limiti · sale») counts as its part («limiti»).
 */
import type { BoxEntry } from "@lifeos/kit";

type Score = NonNullable<BoxEntry["score"]>;

export function averageScore(
  scores: readonly (Score | undefined | null)[],
): Score | undefined {
  const got = scores.filter((s): s is Score => !!s && s.value !== null);
  if (got.length === 0) return undefined;
  const names = new Map<string, { sum: number; n: number; weight: number }>();
  const base = (name: string) => name.split(" · ")[0]!;
  for (const s of got)
    for (const p of s.parts) {
      const x = names.get(base(p.name)) ?? { sum: 0, n: 0, weight: p.weight };
      names.set(base(p.name), { sum: x.sum + p.score, n: x.n + 1, weight: x.weight });
    }
  const parts = [...names].map(([name, x]) => ({
    name,
    score: x.sum / x.n,
    weight: x.weight,
  }));
  const total = parts.reduce((a, p) => a + p.weight, 0) || 1;
  const all = new Set(
    got.flatMap((s) => [...s.parts.map((p) => base(p.name)), ...s.missing]),
  );
  return {
    value: Math.round((parts.reduce((a, p) => a + p.score * p.weight, 0) / total) * 100),
    parts: parts.map((p) => ({ ...p, weight: p.weight / total })),
    missing: [...all].filter((n) => !names.has(n)),
  };
}
