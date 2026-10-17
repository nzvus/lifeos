"use client";
/**
 * Gym mode (V-05, the boards' Gym), first part: the time on top (the rest
 * running after a set, with E6's suggested range; else the session's), the
 * exercise in progress with the last time, its sets done, big steppers
 * filled with what E6 proposes, «Quante ne avresti fatte ancora?» (RIR) and
 * «Serie fatta»; then the others («Poi»), «Aggiungi esercizio» and «Fine».
 * Each set is saved the moment it is ticked; the server actions arrive as
 * props. The screen is kept awake where the browser allows it.
 */
import { useEffect, useMemo, useState } from "react";
import { Box, F, Field, PageHeader } from "@lifeos/kit";
import type { ProposedSet } from "@/core/training/plan";
import type { SetInput } from "@/core/training/write";
import { kgStep, restFor, setText, timed } from "./present";

export type DoneSet = {
  position: number;
  reps: number | null;
  loadKg: string | null;
  rir: number | null;
  durationS: number | null;
  warmup: boolean;
  loadEntry: string;
};
export type GymExercise = {
  entryId: string;
  name: string;
  pattern: string | null;
  /** Its load is typed per dumbbell unless switched off. */
  dumbbells: boolean;
  proposed: ProposedSet[];
  last: string;
  done: DoneSet[];
};
export type GymActions = {
  /** Saves a set; the error in words, or null. */
  tick: (entryId: string, position: number, input: SetInput) => Promise<string | null>;
  untick: (entryId: string, position: number) => Promise<boolean>;
  add: (sessionId: string, exerciseId: string) => Promise<boolean>;
  finish: (sessionId: string) => Promise<void>;
};

const RIR = [
  { value: "0", label: "0", sub: "al limite" },
  { value: "1", label: "1", sub: "quasi" },
  { value: "2", label: "2", sub: "buona" },
  { value: "3", label: "3", sub: "comoda" },
  { value: "4", label: "4+", sub: "facile" },
];
const clock = (s: number) => F.clock(Math.max(0, Math.floor(s)));
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

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
  };
  exercises: GymExercise[];
  catalog: { id: string; name: string }[];
  actions: GymActions;
}) {
  const firstOpen = exercises.findIndex(
    (x) => workDone(x) < Math.max(1, x.proposed.length),
  );
  const [at, setAt] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [rest, setRest] = useState<{ from: number; low: number; high: number } | null>(
    null,
  );
  // The clock starts after mounting: a time drawn on the server would not match the phone's.
  const [now, setNow] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
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

  const tick = async (input: SetInput) => {
    if (!x) return;
    setBusy(true);
    setError(null);
    try {
      const err = await actions.tick(x.entryId, x.done.length, input);
      if (err) setError(err);
      else {
        const r = restFor(x.pattern, input.reps === "" ? null : Number(input.reps));
        setRest({ from: Date.now(), ...r });
        if (!input.warmup && workDone(x) + 1 >= x.proposed.length) {
          const next = exercises.findIndex(
            (e, i) => i > at && workDone(e) < Math.max(1, e.proposed.length),
          );
          if (next !== -1) setAt(next);
        }
      }
    } catch {
      setError("Non è stato salvato. Riprova.");
    } finally {
      setBusy(false);
    }
  };

  const resting =
    rest !== null && now !== null && (now - rest.from) / 1000 < rest.high + 120;
  const elapsed =
    session.startedAt && now !== null && !session.done
      ? (now - session.startedAt) / 1000
      : null;

  return (
    <main className="k-page">
      <PageHeader
        title={session.title}
        context={session.context}
        back={{ label: "Oggi", href: session.dayHref }}
        of={{ fam: "train", kind: "session" }}
      />
      <div className="k-block g3">
        <div className="k-timer" role="timer" aria-live="off">
          <span className="k-stack g0">
            <span className="v">
              {resting
                ? clock((now! - rest.from) / 1000)
                : elapsed !== null
                  ? clock(elapsed)
                  : "–"}
            </span>
            <span className="k-help">
              {resting
                ? "recupero · consigliato " + clock(rest.low) + "–" + clock(rest.high)
                : session.done
                  ? "allenamento finito"
                  : "dall’inizio"}
            </span>
          </span>
          {resting && (
            <button
              type="button"
              className="k-btn secondary"
              onClick={() => setRest(null)}
            >
              Basta
            </button>
          )}
        </div>
      </div>

      {x && (
        <section className="k-section g3" aria-label="Esercizio in corso">
          <h2>
            {x.name}{" "}
            <span className="k-meta">
              {"serie " +
                Math.min(workDone(x) + 1, Math.max(x.proposed.length, workDone(x) + 1)) +
                " di " +
                Math.max(x.proposed.length, workDone(x) + 1)}
            </span>
          </h2>
          {x.last && <span className="k-body">{x.last}</span>}
          {x.done.map((d, i) => (
            <Box
              key={d.position}
              density="row"
              rail={false}
              entry={{
                fam: "train",
                title: d.warmup
                  ? "Riscaldamento"
                  : "Serie " + x.done.slice(0, i + 1).filter((y) => !y.warmup).length,
                value: setText(d),
                ...(d.rir != null ? { meta: "RIR " + d.rir } : {}),
              }}
              acts={[
                {
                  label: "Togli",
                  aria: "Togli la serie " + (d.position + 1),
                  onClick: () => void actions.untick(x.entryId, d.position),
                },
              ]}
            />
          ))}
          <SetForm
            key={x.entryId + ":" + x.done.length}
            timed={timed(x.pattern)}
            dumbbells={x.dumbbells}
            start={
              x.proposed[workDone(x)] ??
              x.done.filter((d) => !d.warmup).at(-1) ??
              x.proposed[0] ??
              null
            }
            busy={busy || session.done}
            onTick={tick}
          />
          {error && (
            <p className="k-help" role="alert">
              {error}
            </p>
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
              setBusy(true);
              await actions.finish(session.id);
            }}
          >
            Fine allenamento
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
  start,
  busy,
  onTick,
}: {
  timed: boolean;
  dumbbells: boolean;
  start: { reps: number | null; loadKg: string | null; durationS: number | null } | null;
  busy: boolean;
  onTick: (input: SetInput) => void;
}) {
  const [reps, setReps] = useState(start?.reps != null ? String(start.reps) : "");
  const [perDb, setPerDb] = useState(dumbbells);
  const [kg, setKg] = useState(
    start?.loadKg != null ? F.n(Number(start.loadKg) / (dumbbells ? 2 : 1), 2) : "",
  );
  // The stepper is redrawn with the converted load when the chip changes.
  const [kgKey, setKgKey] = useState(0);
  const switchPerDb = () => {
    const n = Number(kg.replace(",", "."));
    if (kg !== "" && Number.isFinite(n)) setKg(F.n(perDb ? n * 2 : n / 2, 2));
    setPerDb(!perDb);
    setKgKey(kgKey + 1);
  };
  const [dur, setDur] = useState(start?.durationS != null ? String(start.durationS) : "");
  const [rir, setRir] = useState("");
  const [warmup, setWarmup] = useState(false);
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
          step={kgStep(kg)}
          defaultValue={kg}
          onChange={setKg}
        />
      </div>
      {!isTimed && !warmup && (
        <Field
          name="rir"
          label="Quante ne avresti fatte ancora?"
          type="scale"
          options={RIR}
          defaultValue={rir}
          onChange={setRir}
          help="1–3 è la zona utile; 0 è al limite."
        />
      )}
      <button
        type="button"
        className="k-btn primary"
        aria-busy={busy}
        disabled={busy}
        onClick={() =>
          onTick({
            reps: isTimed ? "" : reps,
            loadKg: kg,
            rir: warmup ? "" : rir,
            durationS: isTimed ? dur : "",
            warmup,
            perDumbbell: perDb,
          })
        }
      >
        {warmup ? "Riscaldamento fatto ✓" : "Serie fatta ✓"}
      </button>
    </div>
  );
}
