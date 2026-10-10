/**
 * core/training/readiness.ts — how ready the body is today (ADR-0049, plan
 * §2.3: "check-in energy and stress, and sleep, never reach training").
 * Pure. A hint only: nothing changes by itself.
 *
 *   short night   under 6 h slept the night before
 *   low energy    the day's check-in at 1–2 of 5
 *   high stress   the day's check-in at 4–5 of 5
 *
 * Any of them: "keep the load, one set fewer" — the usual way to train
 * through a poor day without losing the week.
 */
export const SHORT_SLEEP_H = 6;

export type ReadinessReason = "short_night" | "low_energy" | "high_stress";

export function readiness(input: {
  sleptHours: number | null;
  energy: number | null;
  stress: number | null;
}): ReadinessReason[] {
  const out: ReadinessReason[] = [];
  if (input.sleptHours !== null && input.sleptHours < SHORT_SLEEP_H)
    out.push("short_night");
  if (input.energy !== null && input.energy <= 2) out.push("low_energy");
  if (input.stress !== null && input.stress >= 4) out.push("high_stress");
  return out;
}
