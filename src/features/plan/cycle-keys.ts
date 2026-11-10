/**
 * A ciclo Composer's line keys (Q-16 (a)): a kept step is its id; a new one `new.N.<scheda id>`
 * or `new.N.rest`, so the same scheda may come back in one ciclo. Pure.
 */
import type { StepRef } from "@/core/plans";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The key of a new line: its counter and what it holds (a scheda's id, or null for a rest). */
export const newStepKey = (n: number, itemId: string | null) =>
  `new.${n}.${itemId ?? "rest"}`;

/** A posted key as a step: kept, a scheda's, a rest; null when it is none of them. */
export function stepOf(key: string): StepRef | null {
  if (UUID.test(key)) return { step: key };
  const m = /^new\.\d+\.(.+)$/.exec(key);
  if (!m) return null;
  if (m[1] === "rest") return { rest: true };
  return UUID.test(m[1]!) ? { item: m[1]! } : null;
}
