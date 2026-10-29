"use client";
/**
 * Gym mode's state box (the developer's pick, 2026-10-25: «una cosa alla
 * volta»): what the clock is now — the rest counting down (and its
 * overtime), the setup delay, the set running against its expected length
 * (one side at a time), else the session's time and the minutes left.
 * Split from Gym.tsx; the phase itself lives there.
 */
import { F } from "@lifeos/kit";
import type { Phase } from "./Gym";

const clock = (s: number) => F.clock(Math.max(0, Math.floor(s)));

export function GymClock({
  phase,
  elapsed,
  sessionElapsed,
  side,
  sideS,
  started,
  leftMin,
  auto,
  onStop,
}: {
  phase: Phase;
  /** Seconds since the phase began. */
  elapsed: number;
  sessionElapsed: number | null;
  /** One side at a time: 1, 0 (changing side), 2; null for both together. */
  side: number | null;
  sideS: number | null;
  started: boolean;
  leftMin: number | null;
  auto: boolean;
  onStop: () => void;
}) {
  const big =
    phase.kind === "rest" || phase.kind === "setup"
      ? phase.seconds - elapsed
      : phase.kind === "set"
        ? elapsed
        : sessionElapsed;
  const over = phase.kind === "rest" && elapsed > phase.seconds;
  const help =
    phase.kind === "rest"
      ? over
        ? "recupero finito da " + clock(elapsed - phase.seconds)
        : "recupero " + clock(phase.seconds) + " · " + phase.words
      : phase.kind === "setup"
        ? "mettiti in posizione"
        : phase.kind === "set"
          ? side === 1
            ? "lato 1 · " + clock(sideS ?? 0)
            : side === 0
              ? "cambia lato"
              : side === 2
                ? "lato 2 · " + clock(sideS ?? 0)
                : "in serie" +
                  (phase.seconds !== null ? " · prevista " + clock(phase.seconds) : "")
          : "dall’inizio" + (leftMin ? " · ne restano circa " + F.hm(leftMin) : "");
  const label =
    phase.kind === "rest"
      ? over
        ? "Riposo finito"
        : "Riposo"
      : phase.kind === "setup"
        ? "Preparati"
        : phase.kind === "set"
          ? "Serie in corso"
          : started
            ? "Pronto per la serie"
            : "Prima di iniziare";
  const tone = phase.kind === "idle" ? "idle" : phase.kind;
  const share =
    phase.kind !== "idle" && phase.seconds ? Math.min(1, elapsed / phase.seconds) : null;
  return (
    <div className={"k-gstate " + tone} role="timer" aria-live="off">
      <span className="lab">{label}</span>
      <span className="clk">
        {over ? "+" + clock(elapsed - phase.seconds) : big === null ? "–" : clock(big)}
        {(phase.kind === "rest" || phase.kind === "setup") && !over && (
          <small> di {clock(phase.seconds)}</small>
        )}
      </span>
      {share !== null && (
        <span className="bar">
          <i style={{ width: Math.round(share * 100) + "%" }} />
        </span>
      )}
      <span className="k-help">{help}</span>
      {phase.kind !== "idle" && !auto && (
        <button type="button" className="k-btn secondary" onClick={onStop}>
          Ferma il tempo
        </button>
      )}
    </div>
  );
}
