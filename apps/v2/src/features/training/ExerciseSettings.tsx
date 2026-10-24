"use client";
/** Gym mode: one exercise's own rest and setup delay (empty: learnt / the default). */
import { useState } from "react";
import { Field } from "@lifeos/kit";
import type { GymExercise } from "./Gym";

/** «Recupero e posizionamento»: this exercise's own rest and setup delay; empty = learnt. */
export function ExerciseSettings({
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
