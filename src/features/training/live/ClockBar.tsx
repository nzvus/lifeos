/**
 * features/training/live/ClockBar.tsx — the gym mode's clock row
 * (ADR-0037): the rest counting down, then on into overtime ("+0:12", warm
 * colour) until Go; the set counting up until ✓ ("Side 1 done" for the
 * first side of an unilateral set). Presentation: the numbers and the taps
 * come from LiveSession.
 */
"use client";

import { Check, Play, Timer } from "lucide-react";
import type { Clock } from "@/core/training/live";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function ClockBar({
  c,
  now,
  restLeft,
  sideNext,
  current,
  coming,
  onMore,
  onGo,
  onDone,
  t,
}: {
  c: Clock;
  /** null before the first tick in the browser. */
  now: number | null;
  /** Rest left in ms (negative = overtime). */
  restLeft: number;
  /** The running set is the first side of an unilateral set. */
  sideNext: boolean;
  /** The running set's exercise name. */
  current: string;
  /** What comes next: its exercise and set number. */
  coming: { name: string; n: number } | null;
  onMore: () => void;
  onGo: () => void;
  onDone: () => void;
  t: Messages["training"]["live"];
}) {
  const elapsed = (since: string) => (now === null ? 0 : now - Date.parse(since));
  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <Timer
        size={22}
        aria-hidden="true"
        className={
          c.phase === "set" ? "text-herb" : restLeft < 0 ? "text-warn" : "text-muted"
        }
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={`font-display text-title leading-none font-bold tabular-nums ${
            c.phase === "set" ? "text-herb" : restLeft < 0 ? "text-warn" : ""
          }`}
        >
          {now === null
            ? "–:––"
            : c.phase === "set"
              ? clock(elapsed(c.since))
              : c.phase === "rest"
                ? restLeft >= 0
                  ? clock(restLeft)
                  : `+${clock(-restLeft)}`
                : t.ready}
        </span>
        <span className="truncate text-meta text-muted">
          {c.phase === "set"
            ? c.side === 2 || sideNext
              ? fill(t.sideRunning, {
                  n: String(c.set + 1),
                  side: String(c.side),
                  name: current,
                })
              : fill(t.setRunning, {
                  n: String(c.set + 1),
                  name: current,
                })
            : c.phase === "rest" && c.half
              ? t.halfRest
              : coming
                ? fill(t.restNext, {
                    name: coming.name,
                    n: String(coming.n),
                  })
                : ""}
          {c.phase === "rest" && restLeft < 0 && ` · ${t.over}`}
        </span>
      </span>
      {c.phase === "rest" && restLeft > 0 && (
        <button
          type="button"
          onClick={onMore}
          className={buttonClass({ variant: "subtle", size: "sm" })}
        >
          {t.plus15}
        </button>
      )}
      {c.phase === "set" ? (
        <button
          type="button"
          onClick={onDone}
          className={buttonClass({ variant: "primary" })}
        >
          <Check size={18} aria-hidden="true" />
          {c.side === 1 && sideNext ? t.sideDone : t.setDone}
        </button>
      ) : (
        (coming || (c.phase === "rest" && c.half)) && (
          <button
            type="button"
            onClick={onGo}
            title={t.goHint}
            className={buttonClass({
              variant: restLeft <= 0 ? "primary" : "secondary",
            })}
          >
            <Play size={18} aria-hidden="true" />
            {t.go}
          </button>
        )
      )}
    </div>
  );
}
