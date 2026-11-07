"use client";
/**
 * Gym mode's state box (the developer's pick, 2026-10-25: «una cosa alla
 * volta»): what the clock is now — the rest counting down (and its
 * overtime), the setup delay, the set running against its expected length
 * (one side at a time), else the session's time and the minutes left.
 * Split from Gym.tsx; the phase itself lives there. Drawn by the kit `Timer` (PAT-63); the
 * gym's words and phases are this file's.
 */
import { F, Timer, type TimerPhase } from "@lifeos/kit";
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
  // The gym's phases as the kit Timer's (PAT-63): setup and rest count down, a set runs.
  const timer: TimerPhase =
    phase.kind === "idle"
      ? { kind: "idle" }
      : phase.kind === "set"
        ? { kind: "running", from: phase.from, seconds: phase.seconds }
        : { kind: "countdown", from: phase.from, seconds: phase.seconds };
  return (
    <Timer
      phase={timer}
      elapsed={elapsed}
      idle={sessionElapsed}
      tone={phase.kind}
      label={label}
      help={help}
      stop={auto ? null : { label: "Ferma il tempo", onStop }}
    />
  );
}
