/**
 * Gym mode's small parts (V-05): «Poi»'s line for an exercise and the pills
 * under the one in progress; split from Gym.tsx to keep it readable.
 */
import { F, type State } from "@lifeos/kit";
import type { GymExercise } from "./Gym";

/** «Poi»: the plan (3 × 10 · 60 kg) or, once begun, the sets done of those planned. */
export function planText(e: GymExercise): string {
  const done = workDone(e);
  const first = e.proposed[0];
  const plan = first
    ? e.proposed.length +
      " × " +
      (first.durationS !== null && first.reps === null
        ? F.num(first.durationS, "") + " s"
        : String(first.reps ?? "–")) +
      (first.loadKg !== null ? " · " + F.num(Number(first.loadKg), "kg") : "")
    : "";
  if (done === 0) return plan;
  return (
    done +
    " di " +
    Math.max(e.proposed.length, done) +
    " serie fatte" +
    (plan ? " · " + plan : "")
  );
}

/** The working sets done: warm-ups do not count towards the proposed ones. */
export const workDone = (x: GymExercise) => x.done.filter((d) => !d.warmup).length;

/** The board's context pills: a state gives the colour (content.md §3). */
export function ContextPills({ pills }: { pills: { t: string; state: State }[] }) {
  if (pills.length === 0) return null;
  return (
    <div className="k-chips" aria-label="Il contesto">
      {pills.map((p) => (
        <span
          key={p.t}
          className="k-pill"
          style={{
            color: F.tone(p.state),
            borderColor: p.state === "info" ? "var(--hairline)" : F.tone(p.state),
          }}
        >
          {p.t}
        </span>
      ))}
    </div>
  );
}
