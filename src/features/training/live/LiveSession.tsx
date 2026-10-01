/**
 * features/training/live/LiveSession.tsx — the gym mode (core/training/live.ts):
 * one exercise open at a time, its sets prefilled from last time, each with a
 * big tick and −/+ steppers; ticking a set starts the rest timer (the
 * exercise's rest, else 90 s; it vibrates at zero) and, after the last set,
 * opens the next exercise. A header pinned to the top shows the time since
 * the start, the save state and the rest countdown, so nothing hides under
 * the phone's tab bar.
 *
 * Saving: every change is saved whole, 0.7 s after the last edit, in order
 * (one promise chain), so the database always has what was done. Finishing
 * waits for pending saves, then the server keeps only the done sets.
 * The screen is kept awake while the page is open (Wake Lock, where the
 * browser has it).
 */
"use client";

import { Check, ChevronDown, Plus, Timer, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  copyLastSet,
  DEFAULT_REST_S,
  nextSet,
  stepLoad,
  undoneCount,
  type LiveExercise,
  type LiveSession as Live,
  type LiveSet,
} from "@/core/training/live";
import type { ExerciseKind } from "@/core/training/kinds";
import { fill, type Messages } from "@/i18n";
import { ExerciseIcon } from "@/ui/ExerciseIcon";
import { Stepper } from "./Stepper";

export type LiveExerciseInfo = {
  name: string;
  kind: ExerciseKind;
  pattern: string | null;
  region: string | null;
  /** "Last time (28/09): 3×10 @ 35" or null. */
  last: string | null;
};

type Props = {
  id: string;
  initial: Live;
  /** ISO instant of the start, for the elapsed time; null when unknown. */
  startedAt: string | null;
  info: Record<string, LiveExerciseInfo>;
  save: (id: string, live: Live) => Promise<{ ok: boolean }>;
  finish: (id: string, live: Live) => Promise<{ ok: boolean }>;
  t: Messages["training"]["live"];
};

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const two = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${two(m)}:${two(s % 60)}` : `${m}:${two(s % 60)}`;
};

/** "37,5" or "37.5" typed -> "37.5"; "" stays empty (null). */
const decimal = (raw: string) => raw.replace(",", ".").trim() || null;
const whole = (raw: string) => (/^\d+$/.test(raw.trim()) ? Number(raw.trim()) : null);
const shown = (v: string | null) => (v === null ? "" : v.replace(".", ","));

export function LiveSession({ id, initial, startedAt, info, save, finish, t }: Props) {
  const [s, setS] = useState(initial);
  const [open, setOpen] = useState(() => nextSet(initial.exercises)?.exercise ?? 0);
  const [rest, setRest] = useState<{ ends: number; buzzed: boolean } | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [now, setNow] = useState(() => Date.now());
  const [finishing, setFinishing] = useState(false);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restRef = useRef<{ ends: number; buzzed: boolean } | null>(null);
  const finishingRef = useRef(false);
  const router = useRouter();

  // The clock of the timers; buzzes once when the rest is over.
  useEffect(() => {
    const h = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const r = restRef.current;
      if (r && !r.buzzed && t >= r.ends) {
        try {
          navigator.vibrate?.([200, 100, 200]);
        } catch {}
        restRef.current = { ...r, buzzed: true };
        setRest(restRef.current);
      }
    }, 500);
    return () => clearInterval(h);
  }, []);

  // Keep the screen on while training (not every browser has it).
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const request = async () => {
      try {
        const wl = (
          navigator as Navigator & {
            wakeLock?: {
              request: (t: "screen") => Promise<{ release: () => Promise<void> }>;
            };
          }
        ).wakeLock;
        if (wl && document.visibilityState === "visible")
          lock = await wl.request("screen");
      } catch {}
    };
    void request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      void lock?.release().catch(() => {});
    };
  }, []);

  const startRest = (r: { ends: number; buzzed: boolean } | null) => {
    restRef.current = r;
    setRest(r);
  };

  /** Every edit: show it, then save the whole session 0.7 s later, in order. */
  const change = (next: Live) => {
    setS(next);
    if (finishingRef.current) return;
    setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      chain.current = chain.current.then(async () => {
        try {
          setState((await save(id, next)).ok ? "saved" : "error");
        } catch {
          setState("error");
        }
      });
    }, 700);
  };

  const update = (ei: number, f: (e: LiveExercise) => LiveExercise) =>
    change({ ...s, exercises: s.exercises.map((e, i) => (i === ei ? f(e) : e)) });
  const patch = (ei: number, si: number, v: Partial<LiveSet>) =>
    update(ei, (e) => ({
      ...e,
      sets: e.sets.map((x, j) => (j === si ? { ...x, ...v } : x)),
    }));

  const tick = (ei: number, si: number) => {
    const e = s.exercises[ei]!;
    const was = e.sets[si]!.done;
    patch(ei, si, { done: !was });
    if (was) return;
    startRest({ ends: now + (e.restS ?? DEFAULT_REST_S) * 1000, buzzed: false });
    if (e.sets.every((x, j) => j === si || x.done) && ei + 1 < s.exercises.length)
      setOpen(ei + 1);
  };

  const onFinish = () => {
    finishingRef.current = true;
    setFinishing(true);
    if (timer.current) clearTimeout(timer.current);
    const snapshot = s;
    chain.current = chain.current.then(async () => {
      try {
        const r = await finish(id, snapshot);
        if (r.ok) router.push(`/training/${id}`);
        else {
          finishingRef.current = false;
          setFinishing(false);
          setState("error");
        }
      } catch {
        finishingRef.current = false;
        setFinishing(false);
        setState("error");
      }
    });
  };

  const left = undoneCount(s);
  const restLeft = rest ? rest.ends - now : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="panel sticky top-0 z-10 flex flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-section font-bold">{s.label}</span>
          <span className="flex items-center gap-3 text-meta tabular-nums">
            <span
              className={state === "error" ? "font-semibold text-tomato" : "text-muted"}
            >
              {state === "saving"
                ? t.saving
                : state === "saved"
                  ? t.saved
                  : state === "error"
                    ? t.notSaved
                    : ""}
            </span>
            {startedAt && (
              <span className="font-display text-item font-semibold">
                {clock(now - Date.parse(startedAt))}
              </span>
            )}
          </span>
        </div>
        {rest && (
          <div className="flex items-center gap-2">
            <Timer
              size={22}
              aria-hidden="true"
              className={restLeft > 0 ? "text-herb" : "text-warn"}
            />
            <span
              className={`flex-1 font-display text-title font-bold tabular-nums ${restLeft > 0 ? "" : "text-warn"}`}
              aria-live="polite"
            >
              {restLeft > 0 ? clock(restLeft) : t.restDone}
            </span>
            <button
              type="button"
              onClick={() =>
                startRest({ ends: Math.max(rest.ends, now) + 15000, buzzed: false })
              }
              className="tile h-11 rounded-control px-3 font-semibold"
            >
              {t.plus15}
            </button>
            <button
              type="button"
              onClick={() => startRest(null)}
              className="tile h-11 rounded-control px-3 font-semibold"
            >
              {t.skip}
            </button>
          </div>
        )}
      </div>

      {s.exercises.length === 0 && <p className="text-muted">{t.empty}</p>}

      {s.exercises.map((e, ei) => {
        const x = info[e.exerciseId];
        const done = e.sets.filter((v) => v.done).length;
        const isOpen = open === ei;
        return (
          <section
            key={`${e.exerciseId}-${ei}`}
            className="panel flex flex-col gap-3 p-3"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : ei)}
              aria-expanded={isOpen}
              className="flex items-center gap-3 text-left"
            >
              <ExerciseIcon pattern={x?.pattern ?? null} region={x?.region} size={28} />
              <span className="min-w-0 flex-1 truncate font-display text-item font-semibold">
                {x?.name}
              </span>
              <span
                className={`font-display text-item tabular-nums ${done === e.sets.length && done > 0 ? "text-herb" : "text-muted"}`}
              >
                {fill(t.progress, { done: String(done), all: String(e.sets.length) })}
              </span>
              <ChevronDown
                size={18}
                aria-hidden="true"
                className={isOpen ? "rotate-180" : ""}
              />
            </button>
            {isOpen && (
              <>
                {x?.last && <p className="text-meta text-muted">{x.last}</p>}
                <ol className="flex flex-col gap-2">
                  {e.sets.map((v, si) => (
                    <li
                      key={si}
                      className={`tile flex items-stretch gap-2 p-2 ${v.done ? "border-herb" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => tick(ei, si)}
                        aria-pressed={v.done}
                        aria-label={fill(v.done ? t.untick : t.tick, {
                          n: String(si + 1),
                        })}
                        className={`flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-control ${
                          v.done ? "bg-herb text-sheet" : "border border-hairline"
                        }`}
                      >
                        <Check size={24} aria-hidden="true" />
                        <span className="font-display text-meta tabular-nums">
                          {si + 1}
                        </span>
                      </button>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        {x?.kind === "cardio" ? (
                          <>
                            <Stepper
                              value={
                                v.durationS === null
                                  ? ""
                                  : String(Math.round(v.durationS / 60))
                              }
                              unit={t.min}
                              less={fill(t.less, { what: t.min })}
                              more={fill(t.more, { what: t.min })}
                              onStep={(d) =>
                                patch(ei, si, {
                                  durationS: Math.max(60, (v.durationS ?? 0) + d * 60),
                                })
                              }
                              onType={(r) => {
                                const m = whole(r);
                                patch(ei, si, { durationS: m === null ? null : m * 60 });
                              }}
                            />
                            <Stepper
                              decimal
                              value={
                                v.distanceM === null
                                  ? ""
                                  : shown(String(v.distanceM / 1000))
                              }
                              unit={t.km}
                              less={fill(t.less, { what: t.km })}
                              more={fill(t.more, { what: t.km })}
                              onStep={(d) =>
                                patch(ei, si, {
                                  distanceM: Math.max(0, (v.distanceM ?? 0) + d * 500),
                                })
                              }
                              onType={(r) => {
                                const km = decimal(r);
                                patch(ei, si, {
                                  distanceM:
                                    km === null ? null : Math.round(Number(km) * 1000),
                                });
                              }}
                            />
                          </>
                        ) : (
                          <>
                            {(x?.kind === "strength" || v.loadKg !== null) && (
                              <Stepper
                                decimal
                                value={shown(v.loadKg)}
                                unit={t.kg}
                                less={fill(t.less, { what: t.kg })}
                                more={fill(t.more, { what: t.kg })}
                                onStep={(d) =>
                                  patch(ei, si, { loadKg: stepLoad(v.loadKg, d) })
                                }
                                onType={(r) => patch(ei, si, { loadKg: decimal(r) })}
                              />
                            )}
                            <Stepper
                              value={v.reps === null ? "" : String(v.reps)}
                              unit={t.reps}
                              less={fill(t.less, { what: t.reps })}
                              more={fill(t.more, { what: t.reps })}
                              onStep={(d) =>
                                patch(ei, si, { reps: Math.max(1, (v.reps ?? 0) + d) })
                              }
                              onType={(r) => patch(ei, si, { reps: whole(r) })}
                            />
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      update(ei, (v) => ({ ...v, sets: [...v.sets, copyLastSet(v)] }))
                    }
                    className="tile inline-flex h-11 items-center gap-1.5 rounded-control px-3 font-semibold"
                  >
                    <Plus size={18} aria-hidden="true" />
                    {t.addSet}
                  </button>
                  {e.sets.length > 0 && !e.sets.at(-1)!.done && (
                    <button
                      type="button"
                      aria-label={t.removeSet}
                      onClick={() =>
                        update(ei, (v) => ({ ...v, sets: v.sets.slice(0, -1) }))
                      }
                      className="tile inline-flex h-11 w-11 items-center justify-center rounded-control text-muted"
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        );
      })}

      {s.exercises.length > 0 && left === 0 && (
        <p className="text-center font-semibold text-herb">{t.allDone}</p>
      )}
      <button
        type="button"
        onClick={onFinish}
        disabled={finishing}
        className="h-14 rounded-control bg-herb font-display text-section font-bold text-sheet disabled:opacity-60"
      >
        {left > 0 ? fill(t.finishDrop, { n: String(left) }) : t.finish}
      </button>
    </div>
  );
}
