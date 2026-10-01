/**
 * features/training/live/LiveSession.tsx — the gym mode (core/training/live.ts):
 * one exercise open at a time, its sets prefilled from last time, each with a
 * big tick and −/+ steppers; ticking a set starts the rest timer (the
 * exercise's rest, else 90 s; it vibrates at zero) and, after the last set,
 * opens the next exercise. A header pinned to the top shows the time since
 * the start, the save state and the rest countdown, so nothing hides under
 * the phone's tab bar.
 *
 * Each set shows its change against the same set of last time (reps × kg,
 * core/training/live.ts setChange) as you edit, and ↺ puts last time's
 * numbers back. Exercises can be added (prefilled from last time), moved
 * and removed (while none of their sets is done).
 *
 * Saving: every change is saved whole, 0.5 s after the last edit, in order
 * (one promise chain), so the database always has what was done. Until the
 * server confirms it, the change is also kept in this browser (a draft in
 * localStorage) and saved at once when the page is hidden or left; a
 * reload restores the draft and saves it. Finishing waits for pending
 * saves, then the server keeps only the done sets.
 * The screen is kept awake while the page is open (Wake Lock, where the
 * browser has it).
 */
"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Plus,
  RotateCcw,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  baselineSet,
  copyLastSet,
  DEFAULT_REST_S,
  move,
  newExercise,
  nextSet,
  restoreSet,
  setChange,
  stepLoad,
  undoneCount,
  type LiveExercise,
  type LiveSession as Live,
  type LiveSet,
} from "@/core/training/live";
import { setText } from "@/core/training/display";
import type { ExerciseKind } from "@/core/training/kinds";
import type { Locale } from "@/core/shared/locales";
import { pickerSearch } from "@/core/shared/search";
import { fill, type Messages } from "@/i18n";
import { Change } from "@/ui/Change";
import { ExerciseIcon } from "@/ui/ExerciseIcon";
import { SearchSelect } from "@/ui/SearchSelect";
import { Stepper } from "./Stepper";
import { buttonClass } from "@/ui/button";

/** The time now, for event handlers (taps): never called while rendering. */
const wallClock = () => Date.now();

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
  /** Every exercise of mine: the session's, and those that can be added. */
  info: Record<string, LiveExerciseInfo>;
  /** Last time's working sets per exercise: what each set is compared with. */
  baseline: Record<string, LiveSet[]>;
  locale: Locale;
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

const draftKey = (id: string) => `lifeos.live.${id}`;
/** Browser storage can be missing or refuse (private mode): never fatal. */
const draft = {
  read(id: string): Live | null {
    try {
      const raw = localStorage.getItem(draftKey(id));
      return raw ? (JSON.parse(raw) as Live) : null;
    } catch {
      return null;
    }
  },
  write(id: string, live: Live) {
    try {
      localStorage.setItem(draftKey(id), JSON.stringify(live));
    } catch {}
  },
  clear(id: string) {
    try {
      localStorage.removeItem(draftKey(id));
    } catch {}
  },
};

export function LiveSession({
  id,
  initial,
  startedAt,
  info,
  baseline,
  locale,
  save,
  finish,
  t,
}: Props) {
  const [s, setS] = useState(initial);
  const [open, setOpen] = useState(() => nextSet(initial.exercises)?.exercise ?? 0);
  const [rest, setRest] = useState<{ ends: number; buzzed: boolean } | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // null until the first tick in the browser: the server's clock would not
  // match the browser's, and React would throw the page away (hydration).
  const [now, setNow] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restRef = useRef<{ ends: number; buzzed: boolean } | null>(null);
  const finishingRef = useRef(false);
  /** The newest state, for saving from timers and page events. */
  const latest = useRef(initial);
  const router = useRouter();
  const picker = pickerSearch(
    Object.entries(info).map(([eid, x]) => ({
      id: eid,
      name: x.name,
      notes: "",
      uses: 0,
      lastUsed: null,
    })),
    () => "",
  );

  // The clock of the timers; buzzes once when the rest is over.
  useEffect(() => {
    const tick = () => {
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
    };
    const first = setTimeout(tick, 0);
    const h = setInterval(tick, 500);
    return () => {
      clearTimeout(first);
      clearInterval(h);
    };
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

  /** Saves a state now, after any save already running; clears the draft if it is still the newest. */
  const saveNow = (snapshot: Live) => {
    chain.current = chain.current.then(async () => {
      try {
        const ok = (await save(id, snapshot)).ok;
        setState(ok ? "saved" : "error");
        if (ok && latest.current === snapshot) draft.clear(id);
      } catch {
        setState("error");
      }
    });
  };

  /** Every edit: show it, keep it in the browser, save it 0.5 s later. */
  const change = (next: Live) => {
    setS(next);
    latest.current = next;
    if (finishingRef.current) return;
    draft.write(id, next);
    setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      saveNow(next);
    }, 500);
  };

  // A reload restores what the server had not confirmed yet, and saves it.
  // (After mount: the server render cannot read this browser's storage.)
  useEffect(() => {
    const h = setTimeout(() => {
      const d = draft.read(id);
      if (!d || JSON.stringify(d) === JSON.stringify(initial)) return draft.clear(id);
      setS(d);
      latest.current = d;
      setOpen(nextSet(d.exercises)?.exercise ?? 0);
      setState("saving");
      saveNow(d);
    }, 0);
    return () => clearTimeout(h);
    // Once, on mount: `initial` is the server's state at load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaving or hiding the page: save the pending change at once.
  useEffect(() => {
    const flush = () => {
      if (!timer.current || finishingRef.current) return;
      clearTimeout(timer.current);
      timer.current = null;
      saveNow(latest.current);
    };
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    startRest({ ends: wallClock() + (e.restS ?? DEFAULT_REST_S) * 1000, buzzed: false });
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
        if (r.ok) {
          draft.clear(id);
          router.push(`/training/${id}`);
        } else {
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
  const restLeft = rest && now !== null ? rest.ends - now : 0;

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
                {now === null ? "–:––" : clock(now - Date.parse(startedAt))}
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
                startRest({
                  ends: Math.max(rest.ends, wallClock()) + 15000,
                  buzzed: false,
                })
              }
              className={buttonClass({ variant: "subtle" })}
            >
              {t.plus15}
            </button>
            <button
              type="button"
              onClick={() => startRest(null)}
              className={buttonClass({ variant: "subtle" })}
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
          <section key={`${e.exerciseId}-${ei}`} className="tile flex flex-col gap-3 p-3">
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
                {x?.kind === "cardio"
                  ? // Cardio is time, not sets: its minutes so far.
                    `${Math.round(e.sets.reduce((a, v) => a + (v.durationS ?? 0), 0) / 60)} ${t.min}`
                  : fill(t.progress, { done: String(done), all: String(e.sets.length) })}
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
                        {x?.kind !== "cardio" && (
                          <span className="font-display text-meta tabular-nums">
                            {si + 1}
                          </span>
                        )}
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
                        {(() => {
                          const b = baselineSet(baseline[e.exerciseId], si);
                          if (!b) return null;
                          return (
                            <div className="flex items-center justify-between gap-2 text-meta tabular-nums">
                              <span className="truncate text-muted">
                                {fill(t.before, { v: setText(b, locale) })}
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                <Change pct={setChange(x?.kind ?? "strength", v, b)} />
                                {JSON.stringify(restoreSet(v, b)) !==
                                  JSON.stringify(v) && (
                                  <button
                                    type="button"
                                    aria-label={t.restore}
                                    title={t.restore}
                                    onClick={() =>
                                      update(ei, (ex) => ({
                                        ...ex,
                                        sets: ex.sets.map((y, j) =>
                                          j === si ? restoreSet(y, b) : y,
                                        ),
                                      }))
                                    }
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
                  ))}
                </ol>
                <div className="flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      update(ei, (v) => ({ ...v, sets: [...v.sets, copyLastSet(v)] }))
                    }
                    className={buttonClass({ variant: "subtle" })}
                  >
                    <Plus size={18} aria-hidden="true" />
                    {t.addSet}
                  </button>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      aria-label={t.moveUp}
                      disabled={ei === 0}
                      onClick={() => {
                        change({ ...s, exercises: move(s.exercises, ei, -1) });
                        setOpen(ei - 1);
                      }}
                      className="tile inline-flex h-11 w-11 items-center justify-center rounded-control disabled:opacity-40"
                    >
                      <ArrowUp size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={t.moveDown}
                      disabled={ei === s.exercises.length - 1}
                      onClick={() => {
                        change({ ...s, exercises: move(s.exercises, ei, 1) });
                        setOpen(ei + 1);
                      }}
                      className="tile inline-flex h-11 w-11 items-center justify-center rounded-control disabled:opacity-40"
                    >
                      <ArrowDown size={18} aria-hidden="true" />
                    </button>
                    {!e.sets.some((v) => v.done) && (
                      <button
                        type="button"
                        aria-label={t.removeExercise}
                        title={t.removeExercise}
                        onClick={() => {
                          change({
                            ...s,
                            exercises: s.exercises.filter((_, i) => i !== ei),
                          });
                          setOpen(-1);
                        }}
                        className="tile inline-flex h-11 w-11 items-center justify-center rounded-control text-tomato"
                      >
                        <X size={18} aria-hidden="true" />
                      </button>
                    )}
                  </span>
                </div>
                <div className="flex justify-end">
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

      <div className="panel flex flex-col gap-2 p-3">
        <SearchSelect
          label={t.addExercise}
          name="add-exercise"
          value=""
          onChange={(eid) => {
            if (!eid || !info[eid]) return;
            const restS = s.exercises.find((x) => x.exerciseId === eid)?.restS ?? null;
            change({
              ...s,
              exercises: [...s.exercises, newExercise(eid, restS, baseline[eid])],
            });
            setOpen(s.exercises.length);
          }}
          search={picker.search}
          find={picker.find}
          placeholder={t.search}
          noResults={t.noResults}
        />
      </div>

      {s.exercises.length > 0 && left === 0 && (
        <p className="text-center font-semibold text-herb">{t.allDone}</p>
      )}
      <button
        type="button"
        onClick={onFinish}
        disabled={finishing}
        className={buttonClass({ variant: "primary", block: true })}
      >
        {left > 0 ? fill(t.finishDrop, { n: String(left) }) : t.finish}
      </button>
    </div>
  );
}
