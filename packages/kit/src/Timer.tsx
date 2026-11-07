/**
 * Timer (PAT-63): the state box of a running interval — what the clock is now, big, with its
 * label, a bar of the expected length and one line of words; «Ferma il tempo» while it runs by
 * hand. The kit knows no type: the label, the words and the tone come from the caller (the gym:
 * setup · set · rest).
 */
import { F } from "./format";
import { timerClock, type TimerPhase } from "./timer";

const clock = (s: number) => F.clock(Math.max(0, Math.floor(s)));

export function Timer({
  phase,
  elapsed,
  idle = null,
  tone,
  label,
  help,
  stop,
}: {
  phase: TimerPhase;
  /** Seconds since the phase began. */
  elapsed: number;
  /** At rest, the caller's own clock in seconds (a session's time so far). */
  idle?: number | null;
  /** Its class: the caller's name for the phase («rest», «setup», «set», «idle»). */
  tone: string;
  label: string;
  help: string;
  /** «Ferma il tempo» and what it does; none in auto mode or at rest. */
  stop?: { label: string; onStop: () => void } | null;
}) {
  const c = timerClock(phase, elapsed, idle);
  return (
    <div className={"k-gstate " + tone} role="timer" aria-live="off">
      <span className="lab">{label}</span>
      <span className="clk">
        {c.over !== null ? "+" + clock(c.over) : c.shown === null ? "–" : clock(c.shown)}
        {c.of !== null && <small> di {clock(c.of)}</small>}
      </span>
      {c.share !== null && (
        <span className="bar">
          <i style={{ width: Math.round(c.share * 100) + "%" }} />
        </span>
      )}
      <span className="k-help">{help}</span>
      {stop && phase.kind !== "idle" && (
        <button type="button" className="k-btn secondary" onClick={stop.onStop}>
          {stop.label}
        </button>
      )}
    </div>
  );
}
