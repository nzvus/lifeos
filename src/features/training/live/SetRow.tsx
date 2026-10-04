/**
 * features/training/live/SetRow.tsx — one set on the gym-mode screen: the
 * round tick (a half-done unilateral set shows "n½"), its numbers with
 * −/+ steppers, warm-up, the time it took, a bin, and its change against
 * the same set of last time (↺ puts last time's numbers back).
 */
"use client";

import { Check, RotateCcw, Trash2 } from "lucide-react";
import {
  baselineSet,
  restoreSet,
  setChange,
  stepLoad,
  type LiveSet,
} from "@/core/training/live";
import { setText } from "@/core/training/display";
import type { ExerciseKind } from "@/core/training/kinds";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { Change } from "@/ui/Change";
import { Stepper } from "./Stepper";

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
/** "37,5" or "37.5" typed -> "37.5"; "" stays empty (null). */
const decimal = (raw: string) => raw.replace(",", ".").trim() || null;
const whole = (raw: string) => (/^\d+$/.test(raw.trim()) ? Number(raw.trim()) : null);
const shown = (v: string | null) => (v === null ? "" : v.replace(".", ","));

export function SetRow({
  v,
  si,
  kind,
  running,
  half,
  routineMode,
  base,
  before,
  locale,
  t,
  onTick,
  onPatch,
  onDelete,
}: {
  v: LiveSet;
  /** Its position in the exercise, from 0. */
  si: number;
  kind: ExerciseKind | undefined;
  running: boolean;
  /** An unilateral set with its first side done. */
  half: boolean;
  routineMode: boolean;
  /** Last time's sets of the exercise, and how many working sets come before this one. */
  base: LiveSet[] | undefined;
  before: number;
  locale: Locale;
  t: Messages["training"]["live"];
  onTick: () => void;
  onPatch: (v: Partial<LiveSet>) => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={`tile flex items-stretch gap-2 p-2 ${v.done ? "border-herb" : running ? "border-ink" : ""}`}
    >
      {!routineMode && (
        <button
          type="button"
          onClick={onTick}
          aria-pressed={v.done}
          aria-label={fill(v.done ? t.untick : t.tick, {
            n: String(si + 1),
          })}
          className={`flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-control ${
            v.done
              ? "bg-herb text-sheet"
              : half
                ? "rule-strong border-herb text-herb"
                : "border border-hairline"
          }`}
        >
          <Check size={24} aria-hidden="true" />
          {kind !== "cardio" && (
            <span className="font-display text-meta tabular-nums">
              {half ? `${si + 1}½` : si + 1}
            </span>
          )}
        </button>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {kind === "cardio" ? (
          <>
            <Stepper
              value={v.durationS === null ? "" : String(Math.round(v.durationS / 60))}
              unit={t.min}
              less={fill(t.less, { what: t.min })}
              more={fill(t.more, { what: t.min })}
              onStep={(d) =>
                onPatch({
                  durationS: Math.max(60, (v.durationS ?? 0) + d * 60),
                })
              }
              onType={(r) => {
                const m = whole(r);
                onPatch({
                  durationS: m === null ? null : m * 60,
                });
              }}
            />
            <Stepper
              decimal
              value={v.distanceM === null ? "" : shown(String(v.distanceM / 1000))}
              unit={t.km}
              less={fill(t.less, { what: t.km })}
              more={fill(t.more, { what: t.km })}
              onStep={(d) =>
                onPatch({
                  distanceM: Math.max(0, (v.distanceM ?? 0) + d * 500),
                })
              }
              onType={(r) => {
                const km = decimal(r);
                onPatch({
                  distanceM: km === null ? null : Math.round(Number(km) * 1000),
                });
              }}
            />
          </>
        ) : (
          <>
            {(kind === "strength" || v.loadKg !== null) && (
              <Stepper
                decimal
                value={shown(v.loadKg)}
                unit={t.kg}
                less={fill(t.less, { what: t.kg })}
                more={fill(t.more, { what: t.kg })}
                onStep={(d) => onPatch({ loadKg: stepLoad(v.loadKg, d) })}
                onType={(r) => onPatch({ loadKg: decimal(r) })}
              />
            )}
            <Stepper
              value={v.reps === null ? "" : String(v.reps)}
              unit={t.reps}
              less={fill(t.less, { what: t.reps })}
              more={fill(t.more, { what: t.reps })}
              onStep={(d) => onPatch({ reps: Math.max(1, (v.reps ?? 0) + d) })}
              onType={(r) => onPatch({ reps: whole(r) })}
            />
          </>
        )}
        <div className="flex items-center justify-between gap-2 text-meta tabular-nums">
          <span className="flex min-w-0 items-center gap-2">
            {kind !== "cardio" && (
              <button
                type="button"
                aria-pressed={v.warmup}
                onClick={() => onPatch({ warmup: !v.warmup })}
                className={`rounded-badge px-2 py-0.5 ${
                  v.warmup ? "bg-warn text-sheet" : "border border-hairline text-muted"
                }`}
              >
                {t.warmup}
              </button>
            )}
            {v.startedAt && v.endedAt && (
              <span className="truncate text-muted">
                {fill(t.setTime, {
                  t: clock(Date.parse(v.endedAt) - Date.parse(v.startedAt)),
                })}
              </span>
            )}
          </span>
          <button
            type="button"
            aria-label={fill(t.deleteSet, { n: String(si + 1) })}
            title={fill(t.deleteSet, { n: String(si + 1) })}
            onClick={onDelete}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted hover:text-tomato"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
        {(() => {
          // Warm-ups aren't compared; working sets by their own order.
          const b = v.warmup
            ? null
            : baselineSet(
                base?.filter((y) => !y.warmup),
                before,
              );
          if (!b) return null;
          return (
            <div className="flex items-center justify-between gap-2 text-meta tabular-nums">
              <span className="truncate text-muted">
                {fill(t.before, { v: setText(b, locale) })}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <Change pct={setChange(kind ?? "strength", v, b)} />
                {JSON.stringify(restoreSet(v, b)) !== JSON.stringify(v) && (
                  <button
                    type="button"
                    aria-label={t.restore}
                    title={t.restore}
                    onClick={() => onPatch(restoreSet(v, b))}
                    className="tile inline-flex h-8 w-8 items-center justify-center rounded-control text-muted"
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                  </button>
                )}
              </span>
            </div>
          );
        })()}
      </div>
    </li>
  );
}
