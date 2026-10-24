"use client";
/**
 * Gym mode's next set (V-05): the steppers filled with E6's proposal,
 * «Riscaldamento», «Per manubrio», RIR on the last set only, «Inizia» and
 * «Serie fatta». Drawn again after each tick; the current values go up
 * through onValues (auto mode saves them when the set's clock ends).
 */
import { useEffect, useState } from "react";
import { F, Field } from "@lifeos/kit";
import type { SetInput } from "@/core/training/write";
import { kgStep } from "./present";

const RIR = [
  { value: "0", label: "0", sub: "al limite" },
  { value: "1", label: "1", sub: "quasi" },
  { value: "2", label: "2", sub: "buona" },
  { value: "3", label: "3", sub: "comoda" },
  { value: "4", label: "4+", sub: "facile" },
];

/** The next set's steppers, filled with E6's proposal; drawn again after each tick. */
export function SetForm({
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
