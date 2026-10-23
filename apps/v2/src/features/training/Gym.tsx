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
 * is saved as proposed and marked assumed ("presunta"); «Fine» confirms
 * them. One side at a time: the set's clock says «lato 1», «cambia lato»,
 * «lato 2», with a beep at each change. A beep and a vibration mark every change. Each set is saved the
 * moment it ends; the server actions arrive as props. The screen is kept
 * awake where the browser allows it.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, F, Field, PageHeader } from "@lifeos/kit";
import type { ProposedSet } from "@/core/training/plan";
import type { SetInput } from "@/core/training/write";
import { kgStep, setText, timed, vsProposedText } from "./present";

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
};
export type GymExercise = {
  entryId: string;
  exerciseId: string | null;
  name: string;
  pattern: string | null;
  unilateral: boolean;
  /** Its load is typed per dumbbell unless switched off. */
  dumbbells: boolean;
  proposed: ProposedSet[];
  last: string;
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

const RIR = [
  { value: "0", label: "0", sub: "al limite" },
  { value: "1", label: "1", sub: "quasi" },
  { value: "2", label: "2", sub: "buona" },
  { value: "3", label: "3", sub: "comoda" },
  { value: "4", label: "4+", sub: "facile" },
];
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
    verdict: string;
  };
  exercises: GymExercise[];
  catalog: { id: string; name: string }[];
  actions: GymActions;
}) {
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
  const [confirming, setConfirming] = useState(false);
  // What the steppers hold now: auto mode saves it when the set's clock ends.
  const values = useRef<SetInput | null>(null);
  const setStart = useRef<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    nav.wakeLock
      ?.request("screen")
      .then((l) => (lock = l))
      .catch(() => {
        // Not allowed (battery saver, an old browser): the screen may sleep.
      });
    return () => {
      void lock?.release().catch(() => {});
    };
  }, []);

  const x = exercises[Math.min(at, exercises.length - 1)];
  const others = exercises.map((e, i) => ({ e, i })).filter(({ i }) => i !== at);
  const found = useMemo(() => {
    const words = fold(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    return catalog
      .filter((c) => words.every((w) => fold(c.name).includes(w)))
      .slice(0, 6);
  }, [catalog, query]);
  const assumed = exercises.reduce(
    (n, e) => n + e.done.filter((d) => d.assumed).length,
    0,
  );

  const tick = async (input: SetInput, opts: { assumed?: boolean } = {}) => {
    if (!x) return;
    setBusy(true);
    setError(null);
    const startedAt = setStart.current;
    setStart.current = null;
    try {
      const err = await actions.tick(x.entryId, x.done.length, input, {
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
  const lastSet = x ? working >= x.proposed.length - 1 : false;

  return (
    <main className="k-page">
      <PageHeader
        title={session.title}
        context={session.context}
        back={{ label: "Oggi", href: session.dayHref }}
        of={{ fam: "train", kind: "session" }}
      />
      {(session.verdict || session.before) && (
        <section className="k-section g1" aria-label="La sessione">
          {session.verdict && <p className="k-body">{session.verdict}</p>}
          {session.before && <p className="k-help">{session.before}</p>}
        </section>
      )}
      {!session.done && (
        <div className="k-block g3">
          <div className="k-timer" role="timer" aria-live="off">
            <span className="k-stack g0">
              <span className="v">
                {over
                  ? "+" +
                    clock(elapsedPhase - (phase.kind === "rest" ? phase.seconds : 0))
                  : big === null
                    ? "–"
                    : clock(big)}
              </span>
              <span className="k-help">{help}</span>
            </span>
            {phase.kind !== "idle" && !auto && (
              <button
                type="button"
                className="k-btn secondary"
                onClick={() => setPhase({ kind: "idle" })}
              >
                Basta
              </button>
            )}
          </div>
          {!session.done && (
            <div className="k-chips">
              <button
                type="button"
                className="k-chip"
                aria-pressed={auto}
                onClick={toggleAuto}
              >
                Automatico
              </button>
            </div>
          )}
          {auto && (
            <p className="k-help">
              Serie e recuperi vanno da soli: ogni serie si salva come proposta e resta
              «presunta» finché non la confermi a fine allenamento.
            </p>
          )}
        </div>
      )}

      {confirming && (
        <section className="k-section g2" aria-label="Serie presunte">
          <p className="k-body" role="alert">
            {F.plural(assumed, "serie presunta", "serie presunte")} dalla modalità
            automatica: finendo le confermi come fatte. Se una non è andata così, toglila
            o correggila prima.
          </p>
        </section>
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
          <h2>
            {x.name}{" "}
            <span className="k-meta">
              {"serie " +
                Math.min(working + 1, Math.max(x.proposed.length, working + 1)) +
                " di " +
                Math.max(x.proposed.length, working + 1)}
            </span>
          </h2>
          {x.trend && <span className="k-help">{x.trend}</span>}
          {x.last && <span className="k-body">{x.last}</span>}
          {x.done.map((d, i) => {
            const n = x.done.slice(0, i + 1).filter((y) => !y.warmup).length;
            const vs = d.warmup ? "" : vsProposedText(d, x.proposed[n - 1]);
            const meta = [
              d.assumed ? "presunta" : "",
              d.rir != null ? "RIR " + d.rir : "",
              vs,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <Box
                key={d.position}
                density="row"
                rail={false}
                entry={{
                  fam: "train",
                  title: d.warmup ? "Riscaldamento" : "Serie " + n,
                  value: setText(d),
                  ...(meta ? { meta } : {}),
                }}
                acts={[
                  {
                    label: "Togli",
                    aria: "Togli la serie " + (d.position + 1),
                    onClick: () => void actions.untick(x.entryId, d.position),
                  },
                ]}
              />
            );
          })}
          <SetForm
            key={x.entryId + ":" + x.done.length}
            timed={timed(x.pattern)}
            dumbbells={x.dumbbells}
            askRir={lastSet && !auto}
            start={
              x.proposed[working] ??
              x.done.filter((d) => !d.warmup).at(-1) ??
              x.proposed[0] ??
              null
            }
            busy={busy || session.done}
            running={phase.kind === "set" || phase.kind === "setup"}
            onValues={(v) => {
              values.current = v;
            }}
            onBegin={begin}
            onTick={(v) => void tick(v)}
          />
          {error && (
            <p className="k-help" role="alert">
              {error}
            </p>
          )}
          {x.exerciseId && !session.done && (
            <Settings
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
            onClick={() => setAt(i)}
          >
            <Box
              density="row"
              rail={false}
              entry={{
                fam: "train",
                title: e.name,
                meta:
                  e.done.length +
                  " di " +
                  Math.max(e.proposed.length, e.done.length) +
                  " serie",
                value: "›",
              }}
            />
          </button>
        ))}
        <input
          className="k-text"
          type="search"
          placeholder="Aggiungi esercizio"
          aria-label="Aggiungi esercizio"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
        />
        {found.map((c) => (
          <button
            key={c.id}
            type="button"
            className="k-pick"
            onClick={async () => {
              setQuery("");
              if (await actions.add(session.id, c.id)) setAt(exercises.length);
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

      <div className="k-pagefoot">
        <a className="k-btn secondary" href={session.dayHref}>
          Esci
        </a>
        {!session.done && (
          <button
            type="button"
            className="k-btn primary"
            aria-busy={busy}
            onClick={async () => {
              if (assumed > 0 && !confirming) {
                setConfirming(true);
                return;
              }
              setBusy(true);
              await actions.finish(session.id);
            }}
          >
            {confirming ? "Conferma e finisci" : "Fine allenamento"}
          </button>
        )}
      </div>
    </main>
  );
}

/** The working sets done: warm-ups do not count towards the proposed ones. */
const workDone = (x: GymExercise) => x.done.filter((d) => !d.warmup).length;

/** The next set's steppers, filled with E6's proposal; drawn again after each tick. */
function SetForm({
  timed: isTimed,
  dumbbells,
  askRir,
  start,
  busy,
  running,
  onValues,
  onBegin,
  onTick,
}: {
  timed: boolean;
  dumbbells: boolean;
  askRir: boolean;
  start: { reps: number | null; loadKg: string | null; durationS: number | null } | null;
  busy: boolean;
  running: boolean;
  onValues: (v: SetInput) => void;
  onBegin: () => void;
  onTick: (input: SetInput) => void;
}) {
  const [reps, setReps] = useState(start?.reps != null ? String(start.reps) : "");
  const [perDb, setPerDb] = useState(dumbbells);
  const [kg, setKg] = useState(
    start?.loadKg != null ? F.input(Number(start.loadKg) / (dumbbells ? 2 : 1), 2) : "",
  );
  // The stepper is redrawn with the converted load when the chip changes.
  const [kgKey, setKgKey] = useState(0);
  const switchPerDb = () => {
    const n = Number(kg.replace(",", "."));
    if (kg !== "" && Number.isFinite(n)) setKg(F.input(perDb ? n * 2 : n / 2, 2));
    setPerDb(!perDb);
    setKgKey(kgKey + 1);
  };
  const [dur, setDur] = useState(start?.durationS != null ? String(start.durationS) : "");
  const [rir, setRir] = useState("");
  const [warmup, setWarmup] = useState(false);
  const input: SetInput = {
    reps: isTimed ? "" : reps,
    loadKg: kg,
    rir: warmup || !askRir ? "" : rir,
    durationS: isTimed ? dur : "",
    warmup,
    perDumbbell: perDb,
  };
  useEffect(() => {
    onValues(input);
  });
  return (
    <div className="k-stack g3">
      <div className="k-chips">
        <button
          type="button"
          className="k-chip"
          aria-pressed={warmup}
          onClick={() => setWarmup(!warmup)}
        >
          Riscaldamento
        </button>
        {dumbbells && (
          <button
            type="button"
            className="k-chip"
            aria-pressed={perDb}
            onClick={switchPerDb}
          >
            Per manubrio
          </button>
        )}
      </div>
      <div className="k-grid g3">
        {isTimed ? (
          <Field
            name="durationS"
            label="Secondi"
            type="stepper"
            step={5}
            defaultValue={dur}
            onChange={setDur}
          />
        ) : (
          <Field
            name="reps"
            label="Ripetizioni"
            type="stepper"
            step={1}
            defaultValue={reps}
            onChange={setReps}
          />
        )}
        <Field
          key={kgKey}
          name="loadKg"
          label={perDb ? "Carico per manubrio" : "Carico"}
          type="stepper"
          unit="kg"
          step={kgStep(kg, perDb)}
          defaultValue={kg}
          onChange={setKg}
        />
      </div>
      {!isTimed && !warmup && askRir && (
        <Field
          name="rir"
          label="Quante ne avresti fatte ancora?"
          type="scale"
          options={RIR}
          defaultValue={rir}
          onChange={setRir}
          help="Solo sull’ultima serie: dice quanto eri vicino al limite."
        />
      )}
      <div className="k-line g2">
        {!running && (
          <button
            type="button"
            className="k-btn secondary"
            disabled={busy}
            onClick={onBegin}
          >
            Inizia
          </button>
        )}
        <button
          type="button"
          className="k-btn primary"
          aria-busy={busy}
          disabled={busy}
          onClick={() => onTick(input)}
        >
          {warmup ? "Riscaldamento fatto ✓" : "Serie fatta ✓"}
        </button>
      </div>
    </div>
  );
}

/** «Recupero e posizionamento»: this exercise's own rest and setup delay; empty = learnt. */
function Settings({
  exercise,
  onSave,
}: {
  exercise: GymExercise;
  onSave: (restS: number | null, setupS: number | null) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [rest, setRest] = useState(exercise.settings.restS?.toString() ?? "");
  const [setup, setSetup] = useState(exercise.settings.setupS?.toString() ?? "");
  const [msg, setMsg] = useState("");
  const num = (s: string) => (s.trim() === "" ? null : Number(s));
  return (
    <div className="k-stack g2">
      <button
        type="button"
        className="k-link"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Recupero e posizionamento
      </button>
      {open && (
        <>
          <div className="k-grid g3">
            <Field
              name="restS"
              label="Recupero"
              type="stepper"
              unit="s"
              step={15}
              placeholder={String(exercise.restS)}
              defaultValue={rest}
              onChange={setRest}
              help="Vuoto: la tua media."
            />
            <Field
              name="setupS"
              label="Posizionamento"
              type="stepper"
              unit="s"
              step={1}
              placeholder={String(exercise.setupS)}
              defaultValue={setup}
              onChange={setSetup}
              help="Dopo «Inizia», prima della serie."
            />
          </div>
          <button
            type="button"
            className="k-btn secondary"
            onClick={async () =>
              setMsg(
                (await onSave(num(rest), num(setup)))
                  ? "Salvato."
                  : "Non salvato: controlla i numeri.",
              )
            }
          >
            Salva per questo esercizio
          </button>
          {msg && <p className="k-help">{msg}</p>}
        </>
      )}
    </div>
  );
}
