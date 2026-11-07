/**
 * Timer (PAT-63): the clock of an interval type — a set, a rest, a run, a study block. A phase
 * is rebuilt from saved instants (`from`, epoch ms) on every load, so closing the app loses
 * nothing: a countdown (rest, setup) shows what is left, then how far past it is; a running
 * phase shows how long it has run against what it was expected to take; at rest the caller's
 * own clock (a session's time so far). Pure.
 */
export type TimerPhase =
  | { kind: "idle" }
  | { kind: "countdown"; from: number; seconds: number }
  | { kind: "running"; from: number; seconds: number | null };

export type TimerClock = {
  /** The big number, in seconds; null when there is none («–»). */
  shown: number | null;
  /** A countdown past its end: by how many seconds; else null. */
  over: number | null;
  /** Of a countdown still going: its whole length, said beside it («di 1:30»). */
  of: number | null;
  /** How much of the expected length is done, 0–1; null with none. */
  share: number | null;
};

export function timerClock(
  phase: TimerPhase,
  elapsed: number,
  idle: number | null,
): TimerClock {
  if (phase.kind === "idle") return { shown: idle, over: null, of: null, share: null };
  const share = phase.seconds ? Math.min(1, elapsed / phase.seconds) : null;
  if (phase.kind === "running") return { shown: elapsed, over: null, of: null, share };
  const over = elapsed > phase.seconds ? elapsed - phase.seconds : null;
  return {
    shown: over === null ? phase.seconds - elapsed : over,
    over,
    of: over === null ? phase.seconds : null,
    share,
  };
}
