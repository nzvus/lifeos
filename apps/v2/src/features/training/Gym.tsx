"use client";
/**
 * Gym mode (V-05; dossiers/training.md §6). On top the clock: the rest
 * counting down to this exercise's rest (with where it comes from), the
 * setup delay, or the set running against its expected length; else the
 * session's time and the minutes left. Then the exercise in progress: its
 * trend, the last time, the sets done (each against what was proposed),
 * the steppers filled with E6's proposal, «Inizia» (setup delay, then the
 * set's clock) and «Serie fatta». RIR is asked on the last set only.
 *
 * «Automatico» chains set → rest → set without touching the phone: each set
 * is saved as proposed and marked assumed ("presunta"); finishing confirms
 * them. «Finisci…» only opens a summary (what was done, what was not, what
 * is presunta): the session ends from there, and a finished one can be
 * taken up again with «Riprendi». One side at a time: the set's clock says «lato 1», «cambia lato»,
 * «lato 2», with a beep at each change. A beep and a vibration mark every change. Each set is saved the
 * moment it ends; the server actions arrive as props. The screen is kept
 * awake where the browser allows it, asked again each time the page comes
 * back (the browser drops the lock when the phone locks or the app changes).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, F, Field, PageHeader, type BoxEntry, type State } from "@lifeos/kit";
import type { ProposedSet } from "@/core/training/plan";
import type { SetInput } from "@/core/training/write";
import { ExerciseSettings } from "./ExerciseSettings";
import { FinishSheet } from "./FinishSheet";
import { restPill, setText, strengthPill, timed, vsProposedText } from "./present";
import { SetForm } from "./SetForm";
import { ContextPills, planText, workDone } from "./gym-parts";

export type DoneSet = {
  position: number;
  reps: number | null;
  loadKg: string | null;
  rir: number | null;
  durationS: number | null;
  warmup: boolean;
  loadEntry: string;
  /** Saved by auto mode, not confirmed yet. */
  assumed: boolean;
  /** The rest measured before it, in seconds, when both sets were timed. */
  restBeforeS: number | null;
};
export type GymExercise = {
  entryId: string;
  exerciseId: string | null;
  name: string;
  pattern: string | null;
  /** What picks its drawing (the movement and the equipment, icons.md §2). */
  of: { pattern?: string; equipment?: string };
  unilateral: boolean;
  /** Its load is typed per dumbbell unless switched off. */
  dumbbells: boolean;
  proposed: ProposedSet[];
  last: string;
  /** The last session's best e1RM of this exercise, for «forza stimata». */
  lastE1rm: number | null;
  trend: string;
  /** The rest after a working set, and where it comes from in words. */
  restS: number;
  restWords: string;
  /** A proposed set's expected seconds (auto mode's set clock); unilateral: both sides. */
  setS: number | null;
  /** Unilateral: one side's seconds and the change between sides. */
  sideS: number | null;
  betweenS: number | null;
  setupS: number;
  /** Its own values, when set. */
  settings: { restS: number | null; setupS: number | null };
  done: DoneSet[];
};
export type GymActions = {
  /** Saves a set; the error in words, or null. */
  tick: (
    entryId: string,
    position: number,
    input: SetInput,
    timing?: { startedAt?: number | null; assumed?: boolean },
  ) => Promise<string | null>;
  untick: (entryId: string, position: number) => Promise<boolean>;
  add: (sessionId: string, exerciseId: string) => Promise<boolean>;
  finish: (sessionId: string) => Promise<void>;
  /** «Riprendi»: a finished session in progress again. */
  reopen: (sessionId: string) => Promise<void>;
  /** «Elimina la sessione»: to the trash. */
  remove: (sessionId: string) => Promise<void>;
  readiness: (sessionId: string, value: number | null) => Promise<boolean>;
  settings: (
    exerciseId: string,
    restS: number | null,
    setupS: number | null,
  ) => Promise<boolean>;
};

type Phase =
  | { kind: "idle" }
  | { kind: "setup"; from: number; seconds: number }
  | { kind: "set"; from: number; seconds: number | null }
  | { kind: "rest"; from: number; seconds: number; words: string };

const READY = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: String(n),
  sub: ["a pezzi", "stanco", "normale", "bene", "al top"][n - 1]!,
}));
const clock = (s: number) => F.clock(Math.max(0, Math.floor(s)));
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** A short beep and a vibration, where the phone allows them. */
function signal() {
  try {
    navigator.vibrate?.(200);
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    o.frequency.value = 880;
    o.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.15);
    o.onended = () => void ctx.close();
  } catch {
    // No sound or vibration: the clock still shows the change.
  }
}

export function Gym({
  session,
  exercises,
  catalog,
  actions,
}: {
  session: {
    id: string;
    title: string;
    context: string;
    startedAt: number | null;
    done: boolean;
    dayHref: string;
    readiness: number | null;
    leftMin: number | null;
    warmupRestS: number;
    transitionS: number;
    /** What came before the session, and its score when finished: words, "" when none. */
    before: string;
    /** In progress: what came before, as pills under the exercise. */
    beforePills: { t: string; state: State }[];
    /** The session so far: minutes, score, muscle split (the board); null before the first set. */
    box: BoxEntry | null;
  };
  exercises: GymExercise[];
  catalog: { id: string; name: string }[];
  actions: GymActions;
}) {
  const [boxOpen, setBoxOpen] = useState(false);
  const firstOpen = exercises.findIndex(
    (x) => workDone(x) < Math.max(1, x.proposed.length),
  );
  const [at, setAt] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [auto, setAuto] = useState(false);
  // The clock starts after mounting: a time drawn on the server would not match the phone's.
  const [now, setNow] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // «Finisci…» opens the summary; the session ends only from there.
  const [ending, setEnding] = useState(false);
  // «Correggi»: a done set taken back, its values in the steppers to type again.
  const [fix, setFix] = useState<DoneSet | null>(null);
  // What the steppers hold now: auto mode saves it when the set's clock ends.
  const values = useRef<SetInput | null>(null);
  const setStart = useRef<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (session.done) return;
    let lock: { release: () => Promise<void> } | null = null;
    let gone = false;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    const ask = () => {
      if (document.visibilityState !== "visible") return;
      nav.wakeLock
        ?.request("screen")
        .then((l) => {
          if (gone) void l.release().catch(() => {});
          else lock = l;
        })
        .catch(() => {
          // Not allowed (battery saver, an old browser): the screen may sleep.
        });
    };
    ask();
    // The browser releases the lock whenever the page is hidden: ask again on the way back.
    document.addEventListener("visibilitychange", ask);
    return () => {
      gone = true;
      document.removeEventListener("visibilitychange", ask);
      void lock?.release().catch(() => {});
    };
  }, [session.done]);

  // Another exercise: a correction left open belongs to the one being left.
  const goTo = (i: number) => {
    setFix(null);
    setAt(i);
  };
  const x = exercises[Math.min(at, exercises.length - 1)];
  const others = exercises.map((e, i) => ({ e, i })).filter(({ i }) => i !== at);
  const found = useMemo(() => {
    const words = fold(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    return catalog
      .filter((c) => words.every((w) => fold(c.name).includes(w)))
      .slice(0, 6);
  }, [catalog, query]);

  const tick = async (input: SetInput, opts: { assumed?: boolean } = {}) => {
    if (!x) return;
    setBusy(true);
    setError(null);
    const startedAt = setStart.current;
    setStart.current = null;
    try {
      // A corrected set goes back to its own place; a new one after the last.
      const position =
        fix?.position ?? x.done.reduce((m, d) => Math.max(m, d.position + 1), 0);
      const err = await actions.tick(x.entryId, position, input, {
        startedAt,
        assumed: opts.assumed === true,
      });
      if (err) {
        setError(err);
        setPhase({ kind: "idle" });
        setAuto(false);
        return;
      }
      const finished = !input.warmup && workDone(x) + 1 >= x.proposed.length;
      const next = finished
        ? exercises.findIndex(
            (e, i) => i > at && workDone(e) < Math.max(1, e.proposed.length),
          )
        : at;
      const rest = input.warmup
        ? { seconds: session.warmupRestS, words: "dopo il riscaldamento" }
        : finished
          ? { seconds: session.transitionS, words: "cambio esercizio · tua media" }
          : { seconds: x.restS, words: x.restWords };
      if (finished && next === -1) {
        setAuto(false);
        setPhase({ kind: "idle" });
      } else setPhase({ kind: "rest", from: Date.now(), ...rest });
      if (finished && next !== -1) setAt(next);
    } catch {
      setError("Non è stato salvato. Riprova.");
      setAuto(false);
      setPhase({ kind: "idle" });
    } finally {
      setBusy(false);
    }
  };

  // The clock's transitions: setup → set; in auto mode set → saved, rest → next set.
  const elapsedPhase =
    now !== null && phase.kind !== "idle" ? (now - phase.from) / 1000 : 0;
  // One side at a time: which part of the set the clock is in.
  const side =
    phase.kind === "set" && x?.sideS != null && x.betweenS != null
      ? elapsedPhase < x.sideS
        ? 1
        : elapsedPhase < x.sideS + x.betweenS
          ? 0
          : 2
      : null;
  const sideSeen = useRef<number | null>(null);
  useEffect(() => {
    if (side === null) sideSeen.current = null;
    else if (sideSeen.current !== null && side !== sideSeen.current) signal();
    if (side !== null) sideSeen.current = side;
  }, [side]);
  useEffect(() => {
    if (phase.kind === "setup" && elapsedPhase >= phase.seconds) {
      signal();
      setStart.current = Date.now();
      setPhase({ kind: "set", from: Date.now(), seconds: x?.setS ?? null });
    } else if (
      auto &&
      phase.kind === "set" &&
      phase.seconds !== null &&
      elapsedPhase >= phase.seconds &&
      !busy &&
      values.current
    ) {
      signal();
      void tick(values.current, { assumed: true });
    } else if (phase.kind === "rest" && elapsedPhase >= phase.seconds) {
      if (auto && x) {
        signal();
        setStart.current = Date.now();
        setPhase({ kind: "set", from: Date.now(), seconds: x.setS });
      } else if (elapsedPhase < phase.seconds + 0.6) signal();
    }
    // `tick` and `x` change with every render; the clock drives this effect.
  }, [now]);

  const begin = () => {
    if (!x) return;
    if (x.setupS > 0) setPhase({ kind: "setup", from: Date.now(), seconds: x.setupS });
    else {
      setStart.current = Date.now();
      setPhase({ kind: "set", from: Date.now(), seconds: x.setS });
    }
  };
  const toggleAuto = () => {
    if (auto) {
      setAuto(false);
      return;
    }
    setAuto(true);
    // In auto mode no setup delay: the set's clock starts now unless a rest is running.
    if (phase.kind !== "rest" && x) {
      setStart.current = Date.now();
      setPhase({ kind: "set", from: Date.now(), seconds: x.setS });
    }
  };

  const sessionElapsed =
    session.startedAt && now !== null && !session.done
      ? (now - session.startedAt) / 1000
      : null;
  const big =
    phase.kind === "rest"
      ? phase.seconds - elapsedPhase
      : phase.kind === "setup"
        ? phase.seconds - elapsedPhase
        : phase.kind === "set"
          ? elapsedPhase
          : sessionElapsed;
  const over = phase.kind === "rest" && elapsedPhase > phase.seconds;
  const help =
    phase.kind === "rest"
      ? over
        ? "recupero finito da " + clock(elapsedPhase - phase.seconds)
        : "recupero " + clock(phase.seconds) + " · " + phase.words
      : phase.kind === "setup"
        ? "mettiti in posizione"
        : phase.kind === "set"
          ? side === 1
            ? "lato 1 · " + clock(x!.sideS!)
            : side === 0
              ? "cambia lato"
              : side === 2
                ? "lato 2 · " + clock(x!.sideS!)
                : "in serie" +
                  (phase.seconds !== null ? " · prevista " + clock(phase.seconds) : "")
          : session.done
            ? "allenamento finito"
            : "dall’inizio" +
              (session.leftMin ? " · ne restano circa " + F.hm(session.leftMin) : "");
  const working = x ? workDone(x) : 0;
  // The board's line under the title: where you are and what is done so far.
  const allWork = exercises.flatMap((e) => e.done.filter((d) => !d.warmup));
  const tonnage = allWork.reduce(
    (a, d) => a + (d.reps ?? 0) * (d.loadKg === null ? 0 : Number(d.loadKg)),
    0,
  );
  const progress =
    (exercises.length > 0 && !session.done
      ? "esercizio " +
        (Math.min(at, exercises.length - 1) + 1) +
        " di " +
        exercises.length +
        " · "
      : "") +
    F.plural(allWork.length, "serie", "serie") +
    (tonnage > 0 ? " · " + F.num(tonnage, "kg") + " in totale" : "");
  const lastSet = x ? working >= x.proposed.length - 1 : false;

  // The state box (the developer's pick, 2026-10-25: «una cosa alla volta»): what the clock is.
  const stateLabel =
    phase.kind === "rest"
      ? over
        ? "Riposo finito"
        : "Riposo"
      : phase.kind === "setup"
        ? "Preparati"
        : phase.kind === "set"
          ? "Serie in corso"
          : session.startedAt
            ? "Pronto per la serie"
            : "Prima di iniziare";
  const stateTone =
    phase.kind === "rest"
      ? "rest"
      : phase.kind === "set"
        ? "set"
        : phase.kind === "setup"
          ? "setup"
          : "idle";
  const share =
    (phase.kind === "rest" || phase.kind === "setup" || phase.kind === "set") &&
    phase.seconds
      ? Math.min(1, elapsedPhase / phase.seconds)
      : null;
  // Every set of the exercise as a row: done, now, still to come (the target's values).
  const slots = x ? Math.max(x.proposed.length, working + 1) : 0;
  const workSets = x ? x.done.filter((d) => !d.warmup) : [];
  const warmups = x ? x.done.filter((d) => d.warmup) : [];
  const target = x?.proposed[0]
    ? x.proposed.length +
      " × " +
      (x.proposed[0].reps ?? "–") +
      (x.proposed[0].loadKg !== null
        ? " · " +
          (x.dumbbells
            ? F.num(Number(x.proposed[0].loadKg) / 2, "kg") + " per manubrio"
            : F.num(Number(x.proposed[0].loadKg), "kg"))
        : "")
    : "";

  return (
    <main className="k-page">
      <PageHeader
        title={session.title}
        context={[session.context, progress].filter(Boolean).join(" · ")}
        back={{ label: "Oggi", href: session.dayHref }}
        of={{ fam: "train", kind: "session" }}
      />
      {!session.done && exercises.length > 1 && (
        <nav
          className="k-gdots k-section"
          aria-label={
            "Esercizio " +
            (Math.min(at, exercises.length - 1) + 1) +
            " di " +
            exercises.length
          }
        >
          {exercises.map((e, i) => (
            <button
              key={e.entryId}
              type="button"
              className={
                (i === at ? "now " : "") +
                (workDone(e) >= Math.max(1, e.proposed.length) ? "done" : "")
              }
              aria-label={e.name + (i === at ? ", adesso" : "")}
              aria-current={i === at ? "step" : undefined}
              onClick={() => goTo(i)}
            />
          ))}
        </nav>
      )}

      {!session.done && exercises.every((e) => e.done.length === 0) && (
        <section className="k-section g2" aria-label="Come ti senti">
          <Field
            name="readiness"
            label="Come ti senti?"
            type="scale"
            options={READY}
            defaultValue={session.readiness === null ? "" : String(session.readiness)}
            onChange={(v) =>
              void actions.readiness(session.id, v === "" ? null : Number(v))
            }
            help="Facoltativo. Con 1–2 propone una serie in meno, stesso carico."
          />
        </section>
      )}

      {x && (
        <section className="k-section g3" aria-label="Esercizio in corso">
          <div className="k-stack g1">
            <h2>{x.name}</h2>
            {target && <span className="k-help">obiettivo {target}</span>}
            {x.trend && <span className="k-help">{x.trend}</span>}
            {x.last && <span className="k-help">{x.last}</span>}
          </div>
          <ol className="k-gsets" aria-label="Le serie">
            {warmups.map((d) => (
              <li key={"w" + d.position} className="done warm">
                <span className="n">R</span>
                <b>{setText(d)}</b>
                <em>riscaldamento</em>
                {!session.done && (
                  <button
                    type="button"
                    className="k-btn act"
                    aria-label="Togli il riscaldamento"
                    onClick={() => void actions.untick(x.entryId, d.position)}
                  >
                    Togli
                  </button>
                )}
              </li>
            ))}
            {Array.from({ length: slots }, (_, k) => {
              const d = workSets[k];
              const isNow = !d && k === working && !session.done;
              const plan = x.proposed[k];
              const vs = d ? vsProposedText(d, plan) : "";
              const meta = d
                ? [
                    d.assumed ? "presunta" : "",
                    d.restBeforeS !== null ? "riposo prima " + clock(d.restBeforeS) : "",
                    d.rir != null ? "RIR " + d.rir : "",
                    vs,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : isNow
                  ? phase.kind === "set"
                    ? "in corso"
                    : phase.kind === "setup"
                      ? "in posizione"
                      : "adesso"
                  : k === slots - 1 && !auto
                    ? "ultima: ti chiederò il RIR"
                    : "";
              return (
                <li key={k} className={d ? "done" : isNow ? "now" : "next"}>
                  <span className="n">{k + 1}</span>
                  <b>{d ? setText(d) : plan ? setText(plan) : "–"}</b>
                  <em>{meta}</em>
                  {d && !session.done && (
                    <button
                      type="button"
                      className="k-btn act"
                      aria-label={"Correggi la serie " + (k + 1)}
                      onClick={async () => {
                        if (await actions.untick(x.entryId, d.position)) setFix(d);
                      }}
                    >
                      Correggi
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          {fix && (
            <p className="k-help" role="status">
              Serie tolta: i suoi valori sono qui sotto, correggili e tocca «Serie fatta».
            </p>
          )}
          {!session.done && (
            <div className={"k-gstate " + stateTone} role="timer" aria-live="off">
              <span className="lab">{stateLabel}</span>
              <span className="clk">
                {over
                  ? "+" +
                    clock(elapsedPhase - (phase.kind === "rest" ? phase.seconds : 0))
                  : big === null
                    ? "–"
                    : clock(big)}
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
                <button
                  type="button"
                  className="k-btn secondary"
                  onClick={() => setPhase({ kind: "idle" })}
                >
                  Ferma il tempo
                </button>
              )}
            </div>
          )}
          {/* A finished session is read, not trained: no set to type. */}
          {!session.done && (
            <SetForm
              key={x.entryId + ":" + x.done.length + (fix ? ":fix" : "")}
              timed={timed(x.pattern)}
              dumbbells={x.dumbbells}
              askRir={lastSet && !auto}
              start={
                fix ??
                x.proposed[working] ??
                x.done.filter((d) => !d.warmup).at(-1) ??
                x.proposed[0] ??
                null
              }
              busy={busy}
              running={phase.kind === "set" || phase.kind === "setup"}
              onValues={(v) => {
                values.current = v;
              }}
              onBegin={begin}
              onTick={(v) => {
                setFix(null);
                void tick(v);
              }}
            />
          )}
          {!session.done && (
            <div className="k-stack g1">
              <Field
                key={auto ? "auto" : "manual"}
                name="mode"
                label="Tempi"
                type="choice"
                required
                defaultValue={auto ? "auto" : "manual"}
                options={[
                  { value: "auto", label: "li conta l’app" },
                  { value: "manual", label: "li avvio io" },
                ]}
                onChange={(m) => {
                  if ((m === "auto") !== auto) toggleAuto();
                }}
              />
              <span className="k-help">
                {auto
                  ? "Serie e riposi partono da soli e ogni serie si segna come proposta («presunta»): la confermi a fine allenamento."
                  : "Niente parte da solo: «Inizia» avvia la serie, «Serie fatta» la segna e fa partire il riposo."}
              </span>
            </div>
          )}
          {!session.done && (
            <ContextPills
              pills={[
                ...(() => {
                  const f = strengthPill(x.done, x.lastE1rm);
                  return f ? [f] : [];
                })(),
                ...(() => {
                  const r = restPill(x.done.at(-1)?.restBeforeS ?? null, x.restS);
                  return r ? [r] : [];
                })(),
                ...session.beforePills,
              ]}
            />
          )}
          {error && (
            <p className="k-help" role="alert">
              {error}
            </p>
          )}
          {x.exerciseId && !session.done && (
            <ExerciseSettings
              key={x.exerciseId}
              exercise={x}
              onSave={(restS, setupS) => actions.settings(x.exerciseId!, restS, setupS)}
            />
          )}
        </section>
      )}

      <section className="k-section g2" aria-label="Poi">
        <h2>Poi</h2>
        {others.map(({ e, i }) => (
          <button
            key={e.entryId}
            type="button"
            className="k-pick"
            onClick={() => goTo(i)}
          >
            <Box
              density="row"
              rail={false}
              entry={{
                fam: "train",
                of: e.of,
                title: e.name,
                meta: planText(e),
                value: "›",
              }}
            />
          </button>
        ))}
        {!session.done && (
          <input
            className="k-text"
            type="search"
            placeholder="Aggiungi esercizio"
            aria-label="Aggiungi esercizio"
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
          />
        )}
        {found.map((c) => (
          <button
            key={c.id}
            type="button"
            className="k-pick"
            onClick={async () => {
              setQuery("");
              if (await actions.add(session.id, c.id)) goTo(exercises.length);
            }}
          >
            <Box
              density="row"
              rail={false}
              entry={{ fam: "train", title: c.name, value: "+" }}
            />
          </button>
        ))}
      </section>

      {(session.box || session.before) && (
        <section className="k-section g2" aria-label="La sessione">
          <h2>La sessione finora</h2>
          {session.box && (
            <Box
              entry={session.box}
              rail={false}
              {...(session.box.score
                ? { expanded: boxOpen, onToggle: () => setBoxOpen(!boxOpen) }
                : {})}
            />
          )}
          {session.before && <p className="k-help">{session.before}</p>}
        </section>
      )}

      <section className="k-section" aria-label="Elimina">
        <button
          type="button"
          className="k-btn secondary danger"
          disabled={busy}
          onClick={async () => {
            if (!window.confirm("Eliminare la sessione? Resta 30 giorni nel cestino."))
              return;
            setBusy(true);
            await actions.remove(session.id);
          }}
        >
          Elimina la sessione
        </button>
      </section>
      <div className="k-pagefoot">
        <a className="k-btn secondary" href={session.dayHref}>
          Esci
        </a>
        {session.done ? (
          <button
            type="button"
            className="k-btn secondary"
            aria-busy={busy}
            onClick={async () => {
              setBusy(true);
              await actions.reopen(session.id);
            }}
          >
            Riprendi
          </button>
        ) : (
          <button
            type="button"
            className="k-btn secondary"
            onClick={() => setEnding(true)}
          >
            Finisci…
          </button>
        )}
      </div>
      {ending && !session.done && (
        <FinishSheet
          exercises={exercises}
          minutes={sessionElapsed !== null ? Math.round(sessionElapsed / 60) : null}
          busy={busy}
          onBack={() => setEnding(false)}
          onFinish={async () => {
            setBusy(true);
            await actions.finish(session.id);
          }}
        />
      )}
    </main>
  );
}
