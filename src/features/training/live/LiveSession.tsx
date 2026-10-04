/**
 * features/training/live/LiveSession.tsx — the gym mode (core/training/live.ts),
 * and the same screen to edit a routine without starting it (mode
 * "routine", 2026-10-04: one editor instead of two).
 *
 * The clock, pinned to the top (2026-10-04): rest counts down, passes zero
 * and keeps counting ("+0:12") until Go; then the set counts up until ✓;
 * then the rest… An exercise done one side at a time splits each set: side
 * 1, half the rest, side 2. Everything comes from the sets' saved instants
 * (core clockOf), so leaving the page or closing the app resumes where it
 * was, and the time away is simply rest. The round tick on a set still
 * marks it by hand.
 *
 * Exercises can be added, moved, removed; sets added, deleted one by one
 * (with Undo), warmed up (the ramp 50/70/85 %); an exercise's rest and its
 * "one side at a time" change here. With a routine behind the session,
 * "Save to the routine" makes this the next start.
 *
 * Saving (session mode): every change is saved whole, 0.5 s after the last
 * edit, in order; until confirmed it is also kept in this browser (a draft)
 * and saved at once when the page is hidden. Finishing keeps the done sets.
 * The screen stays awake while the page is open (Wake Lock).
 */
"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Minus,
  Play,
  Plus,
  Save,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  addWarmup,
  clockOf,
  completeRunning,
  copyLastSet,
  move,
  newExercise,
  startNext,
  timing,
  toggleDone,
  undoneCount,
  nextSet,
  type LiveExercise,
  type LiveSession as Live,
  type LiveSet,
} from "@/core/training/live";
import type { ExerciseKind } from "@/core/training/kinds";
import type { Locale } from "@/core/shared/locales";
import { pickerSearch } from "@/core/shared/search";
import { fill, type Messages } from "@/i18n";
import { ExerciseIcon } from "@/ui/ExerciseIcon";
import { GUIDES, guideKeyOf } from "@/core/training/guides";
import { nextTarget } from "@/core/training/targets";
import { ExerciseGuide } from "./ExerciseGuide";
import { SearchSelect } from "@/ui/SearchSelect";
import { ClockBar } from "./ClockBar";
import { SetRow } from "./SetRow";
import { buttonClass } from "@/ui/button";
import { toast } from "@/ui/Toast";

/** The time now, for event handlers (taps): never called while rendering. */
const wallClock = () => Date.now();
const iso = () => new Date(wallClock()).toISOString();

export type LiveExerciseInfo = {
  name: string;
  kind: ExerciseKind;
  pattern: string | null;
  region: string | null;
  /** One arm/leg at a time. */
  unilateral: boolean;
  /** "Last time (28/09): 3×10 @ 35" or null. */
  last: string | null;
};

type Outcome = { ok: boolean; message?: string };

type Props = {
  /** The session's id; null in routine mode (nothing saved as a session). */
  id: string | null;
  mode?: "session" | "routine";
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
  saveToRoutine: (routineId: string, live: Live) => Promise<Outcome>;
  setUnilateral: (exerciseId: string, on: boolean) => Promise<{ ok: boolean }>;
  /** Routine mode: the edited routine as a session, now or today. */
  startEdited?: (live: Live, mode: "live" | "plan") => Promise<{ ok: boolean }>;
  t: Messages["training"]["live"];
  /** ADR-0028: the exercise guides' words. */
  guides: Messages["guides"];
};

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const two = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${two(m)}:${two(s % 60)}` : `${m}:${two(s % 60)}`;
};

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
  mode = "session",
  initial,
  startedAt,
  info: initialInfo,
  baseline,
  locale,
  save,
  finish,
  saveToRoutine,
  setUnilateral,
  startEdited,
  t,
  guides,
}: Props) {
  const routineMode = mode === "routine" || id === null;
  const [s, setS] = useState(initial);
  const [info, setInfo] = useState(initialInfo);
  const [open, setOpen] = useState(() => nextSet(initial.exercises)?.exercise ?? 0);
  // Extra rest asked with +15 s, for the rest that began at `since`.
  const [bonus, setBonus] = useState<{ since: string; s: number } | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // null until the first tick in the browser: the server's clock would not
  // match the browser's, and React would throw the page away (hydration).
  const [now, setNow] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [pending, startTransition] = useTransition();
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buzzed = useRef<string | null>(null);
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
  const unilateral = (eid: string) => info[eid]?.unilateral ?? false;

  const c = clockOf(s);
  const restS =
    c.phase === "rest" ? c.restS + (bonus?.since === c.since ? bonus.s : 0) : 0;

  // The clock; buzzes once when a rest passes zero.
  useEffect(() => {
    if (routineMode) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const k = clockOf(latest.current);
      if (k.phase === "rest" && buzzed.current !== k.since) {
        const left = Date.parse(k.since) + k.restS * 1000 - t;
        if (left <= 0 && left > -2000) {
          try {
            navigator.vibrate?.([200, 100, 200]);
          } catch {}
          buzzed.current = k.since;
        }
      }
    };
    const first = setTimeout(tick, 0);
    const h = setInterval(tick, 500);
    return () => {
      clearTimeout(first);
      clearInterval(h);
    };
  }, [routineMode]);

  // Keep the screen on while training (not every browser has it).
  useEffect(() => {
    if (routineMode) return;
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
  }, [routineMode]);

  /** Saves a state now, after any save already running; clears the draft if it is still the newest. */
  const saveNow = (snapshot: Live) => {
    if (!id) return;
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

  /** Every edit: show it; in a session also keep it in the browser and save it 0.5 s later. */
  const change = (next: Live) => {
    setS(next);
    latest.current = next;
    if (routineMode || !id || finishingRef.current) return;
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
    if (!id || routineMode) return;
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
    if (!id || routineMode) return;
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

  /** The session starts with its first set: its time is "now" then. */
  const begun = (next: Live): Live =>
    next.time
      ? next
      : { ...next, time: new Date(wallClock()).toTimeString().slice(0, 5) };

  const go = () => change(begun(startNext(s, iso())));
  const complete = () => {
    const before = clockOf(s);
    const next = completeRunning(s, iso(), unilateral);
    change(next);
    // The last set of an exercise done: open the next exercise.
    if (before.phase === "set") {
      const e = next.exercises[before.exercise]!;
      if (e.sets.every((x) => x.done) && before.exercise + 1 < next.exercises.length)
        setOpen(before.exercise + 1);
    }
  };
  const tick = (ei: number, si: number) => change(begun(toggleDone(s, ei, si, iso())));

  const deleteSet = (ei: number, si: number) => {
    const before = s;
    update(ei, (e) => ({ ...e, sets: e.sets.filter((_, j) => j !== si) }));
    toast({
      message: t.setDeleted,
      action: { label: t.undo, run: () => change(before) },
    });
  };

  const switchUnilateral = (eid: string) => {
    const on = !unilateral(eid);
    setInfo((x) => ({ ...x, [eid]: { ...x[eid]!, unilateral: on } }));
    startTransition(async () => {
      const r = await setUnilateral(eid, on);
      if (!r.ok) setInfo((x) => ({ ...x, [eid]: { ...x[eid]!, unilateral: !on } }));
    });
  };

  const toRoutine = () =>
    startTransition(async () => {
      if (!s.routineId) return;
      const r = await saveToRoutine(s.routineId, s);
      toast({ message: r.ok ? t.savedRoutine : (r.message ?? t.notSaved) });
    });

  const onFinish = () => {
    if (!id) return;
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
  const coming = nextSet(s.exercises);
  const nameOf = (ei: number) => info[s.exercises[ei]?.exerciseId ?? ""]?.name ?? "";
  const elapsed = (since: string) => (now === null ? 0 : now - Date.parse(since));
  const restLeft = c.phase === "rest" ? restS * 1000 - elapsed(c.since) : 0;
  const firstStart = s.exercises
    .flatMap((e) => e.sets.map((x) => x.startedAt))
    .filter(Boolean)
    .sort()[0];
  const sessionStart = firstStart
    ? Date.parse(firstStart)
    : startedAt && s.time
      ? Date.parse(startedAt)
      : null;
  const times = timing(s);
  const mmss = (sec: number) => clock(sec * 1000);

  return (
    <div className="flex flex-col gap-4">
      {routineMode ? (
        <p className="tile p-3 text-meta text-muted">{t.routineMode}</p>
      ) : (
        <div className="panel sticky top-0 z-10 flex flex-col gap-2 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate font-display text-section font-bold">
              {s.label}
            </span>
            <span className="flex shrink-0 items-center gap-3 text-meta tabular-nums">
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
              {sessionStart !== null ? (
                <span className="font-display text-item font-semibold">
                  {now === null ? "–:––" : clock(Math.max(0, now - sessionStart))}
                </span>
              ) : (
                <span className="text-muted">{t.notStarted}</span>
              )}
            </span>
          </div>

          <ClockBar
            c={c}
            now={now}
            restLeft={restLeft}
            sideNext={
              c.phase === "set" && unilateral(s.exercises[c.exercise]!.exerciseId)
            }
            current={c.phase === "set" ? nameOf(c.exercise) : ""}
            coming={coming ? { name: nameOf(coming.exercise), n: coming.set + 1 } : null}
            onMore={() =>
              c.phase === "rest" &&
              setBonus({
                since: c.since,
                s: (bonus?.since === c.since ? bonus.s : 0) + 15,
              })
            }
            onGo={go}
            onDone={complete}
            t={t}
          />
        </div>
      )}

      {s.exercises.length === 0 && <p className="text-muted">{t.empty}</p>}

      {s.exercises.map((e, ei) => {
        const x = info[e.exerciseId];
        const done = e.sets.filter((v) => v.done).length;
        const isOpen = open === ei;
        const uni = unilateral(e.exerciseId);
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
                  ? `${Math.round(e.sets.reduce((a, v) => a + (v.durationS ?? 0), 0) / 60)} ${t.min}`
                  : routineMode
                    ? String(e.sets.length)
                    : fill(t.progress, {
                        done: String(done),
                        all: String(e.sets.length),
                      })}
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
                {x &&
                  !routineMode &&
                  (() => {
                    // ADR-0028: today's target from last time, and how to do it.
                    const key = guideKeyOf(x);
                    return (
                      <ExerciseGuide
                        guideKey={key}
                        target={
                          key ? nextTarget(GUIDES[key], baseline[e.exerciseId]) : null
                        }
                        locale={locale}
                        t={guides}
                      />
                    );
                  })()}
                {/* The exercise's rest and its "one side at a time", in one row. */}
                {x?.kind !== "cardio" && (
                  <div className="flex flex-wrap items-center gap-2 text-meta">
                    <span className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={t.restLess}
                        onClick={() =>
                          update(ei, (v) => ({
                            ...v,
                            restS: Math.max(15, (v.restS ?? 90) - 15),
                          }))
                        }
                        className="tile inline-flex h-9 w-9 items-center justify-center rounded-control"
                      >
                        <Minus size={14} aria-hidden="true" />
                      </button>
                      <span className="tabular-nums">
                        {fill(t.restOf, { s: String(e.restS ?? 90) })}
                      </span>
                      <button
                        type="button"
                        aria-label={t.restMore}
                        onClick={() =>
                          update(ei, (v) => ({
                            ...v,
                            restS: Math.min(900, (v.restS ?? 90) + 15),
                          }))
                        }
                        className="tile inline-flex h-9 w-9 items-center justify-center rounded-control"
                      >
                        <Plus size={14} aria-hidden="true" />
                      </button>
                    </span>
                    {
                      <button
                        type="button"
                        aria-pressed={uni}
                        disabled={pending}
                        title={t.unilateralHint}
                        onClick={() => switchUnilateral(e.exerciseId)}
                        className={`rounded-badge px-2 py-1 ${
                          uni ? "bg-ink text-sheet" : "border border-hairline text-muted"
                        }`}
                      >
                        {t.unilateral}
                      </button>
                    }
                  </div>
                )}
                <ol className="flex flex-col gap-2">
                  {e.sets.map((v, si) => {
                    const running =
                      c.phase === "set" && c.exercise === ei && c.set === si;
                    const half = Boolean(v.halfAt) && !v.done;
                    return (
                      <SetRow
                        key={si}
                        v={v}
                        si={si}
                        kind={x?.kind}
                        running={running}
                        half={half}
                        routineMode={routineMode}
                        base={baseline[e.exerciseId]}
                        before={e.sets.slice(0, si).filter((y) => !y.warmup).length}
                        locale={locale}
                        t={t}
                        onTick={() => tick(ei, si)}
                        onPatch={(p) => patch(ei, si, p)}
                        onDelete={() => deleteSet(ei, si)}
                      />
                    );
                  })}
                </ol>
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="flex flex-wrap gap-2">
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
                    {x?.kind !== "cardio" && (
                      <button
                        type="button"
                        onClick={() => update(ei, addWarmup)}
                        className={buttonClass({ variant: "subtle" })}
                      >
                        <Plus size={18} aria-hidden="true" />
                        {t.addWarmup}
                      </button>
                    )}
                  </span>
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
            const rest = s.exercises.find((x) => x.exerciseId === eid)?.restS ?? null;
            change({
              ...s,
              exercises: [...s.exercises, newExercise(eid, rest, baseline[eid])],
            });
            setOpen(s.exercises.length);
          }}
          search={picker.search}
          find={picker.find}
          placeholder={t.search}
          noResults={t.noResults}
        />
      </div>

      {!routineMode && times.sets > 1 && (
        <div className="flex flex-col gap-1 text-meta text-muted tabular-nums">
          <p>
            {fill(t.timing, {
              work: mmss(times.workS),
              rest: mmss(times.restS),
              avg: times.avgRestS === null ? "—" : mmss(times.avgRestS),
            })}
          </p>
          {times.longBreaks.map((b, i) => (
            <p key={i} className="text-warn">
              {fill(t.longBreak, { min: String(Math.round(b / 60)) })}
            </p>
          ))}
        </div>
      )}

      {s.routineId && (
        <button
          type="button"
          onClick={toRoutine}
          disabled={pending}
          className={buttonClass({
            variant: routineMode ? "primary" : "secondary",
            block: true,
          })}
        >
          <Save size={18} aria-hidden="true" />
          {t.saveRoutine}
        </button>
      )}
      {routineMode && startEdited ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => void (await startEdited(s, "live")))
            }
            className={buttonClass({ variant: "secondary" })}
          >
            <Play size={18} aria-hidden="true" />
            {t.startNow}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => void (await startEdited(s, "plan")))
            }
            className={buttonClass({ variant: "secondary" })}
          >
            <Plus size={18} aria-hidden="true" />
            {t.planToday}
          </button>
        </div>
      ) : (
        !routineMode && (
          <>
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
          </>
        )
      )}
    </div>
  );
}
