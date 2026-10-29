/**
 * Gym mode's small parts (V-05): «Poi»'s line for an exercise and the pills
 * under the one in progress; split from Gym.tsx to keep it readable.
 */
import { F, type State } from "@lifeos/kit";
import type { DoneSet, GymExercise } from "./Gym";
import { setText } from "./present";

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

/**
 * The warm-up rows (session.md §5.1): those done («Togli»), then those
 * proposed, the first one «adesso» with «Salta» for the whole ramp.
 */
export function WarmupRows({
  done,
  next,
  live,
  onRemove,
  onSkip,
}: {
  done: DoneSet[];
  next: { reps: number; loadKg: string; durationS: null }[];
  live: boolean;
  onRemove: (d: DoneSet) => void;
  onSkip: () => void;
}) {
  return (
    <>
      {done.map((d) => (
        <li key={"w" + d.position} className="done warm">
          <span className="n">R</span>
          <b>{setText(d)}</b>
          <em>riscaldamento</em>
          {live && (
            <button
              type="button"
              className="k-btn act"
              aria-label="Togli il riscaldamento"
              onClick={() => onRemove(d)}
            >
              Togli
            </button>
          )}
        </li>
      ))}
      {next.map((w, k) => (
        <li key={"pw" + k} className={(k === 0 ? "now" : "next") + " warm"}>
          <span className="n">R</span>
          <b>{setText(w)}</b>
          <em>{k === 0 ? "riscaldamento · adesso" : "riscaldamento"}</em>
          {k === 0 && (
            <button
              type="button"
              className="k-btn act"
              aria-label="Salta il riscaldamento"
              onClick={onSkip}
            >
              Salta
            </button>
          )}
        </li>
      ))}
    </>
  );
}

type Begun = { entryId: string; from: number };
const KEY = (sessionId: string) => "lifeos:gym:" + sessionId;

/** The set in progress, kept on the phone (null clears it); never needed to train. */
export function rememberSet(sessionId: string, begun: Begun | null): void {
  try {
    if (begun) localStorage.setItem(KEY(sessionId), JSON.stringify(begun));
    else localStorage.removeItem(KEY(sessionId));
  } catch {
    // Private mode or blocked storage: a reload just starts idle.
  }
}

export function recallSet(sessionId: string): Begun | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY(sessionId)) ?? "null") as Begun | null;
    return v && typeof v.entryId === "string" && typeof v.from === "number" ? v : null;
  } catch {
    return null;
  }
}

/** Overtime a resumed rest may still show: past this, the page opens idle. */
const RESUME_OVER_S = 120;

/**
 * The rest after the last saved set, rebuilt from its end (session.md §5.6):
 * a warm-up's rest, the change of exercise after the last planned set, else
 * the exercise's own rest. Null when it ended too long ago.
 */
export function restAfterLast(
  exercises: GymExercise[],
  s: { warmupRestS: number; transitionS: number },
  now = Date.now(),
): { from: number; seconds: number; words: string } | null {
  let last: { e: GymExercise; d: DoneSet } | null = null;
  for (const e of exercises)
    for (const d of e.done)
      if (d.endedAt !== null && (!last || d.endedAt > last.d.endedAt!)) last = { e, d };
  if (!last) return null;
  const { e, d } = last;
  const finished = !d.warmup && workDone(e) >= e.proposed.length;
  const rest = d.warmup
    ? { seconds: s.warmupRestS, words: "dopo il riscaldamento" }
    : finished
      ? { seconds: s.transitionS, words: "cambio esercizio · tua media" }
      : { seconds: e.restS, words: e.restWords };
  return now - d.endedAt! < (rest.seconds + RESUME_OVER_S) * 1000
    ? { from: d.endedAt!, ...rest }
    : null;
}

/** The toast after a saved set: its words and «Annulla» (44 high, above the footer). */
export function UndoToast({ text, onUndo }: { text: string; onUndo: () => void }) {
  return (
    <div className="k-toastbar">
      <div className="k-toast" role="status">
        <span>{text}</span>
        <button type="button" className="k-btn link" onClick={onUndo}>
          Annulla
        </button>
      </div>
    </div>
  );
}
