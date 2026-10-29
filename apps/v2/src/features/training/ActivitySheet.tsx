"use client";
/**
 * ⊕ → «Attività» (dossiers/activity.md §6): a run, a ride, a row already
 * done — which, when it ended (now by default), how long, how far, how hard.
 * The pace shows as the distance is typed. «Salva» writes a finished
 * session; the server action arrives as a prop and answers the errors in
 * words with what was typed.
 */
import { useActionState, useState } from "react";
import { F, Field } from "@lifeos/kit";

export type ActivityState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  n: number;
};

const EFFORT = Array.from({ length: 11 }, (_, n) => ({
  value: String(n),
  label:
    String(n) +
    (n === 0 ? " · niente" : n <= 4 ? " · facile" : n <= 6 ? " · medio" : " · forte"),
}));

export function ActivitySheet({
  day,
  dayLabel,
  choices,
  initial,
  closeHref,
  action,
}: {
  day: string;
  dayLabel: string;
  choices: { id: string; name: string }[];
  initial: Record<string, string>;
  closeHref: string;
  action: (state: ActivityState, data: FormData) => Promise<ActivityState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    values: initial,
    n: 0,
  });
  const v = state.values;
  const e = state.errors;
  const [min, setMin] = useState(v["minutes"] ?? "");
  const [km, setKm] = useState(v["km"] ?? "");
  const m = Number(min);
  const k = Number(km.replace(",", "."));
  const pace = m > 0 && k > 0 ? Math.round((m * 60) / k) : null;
  return (
    <form key={state.n} action={submit} className="k-sheet-wrap k-screen">
      <a className="k-dim" href={closeHref} aria-label="Chiudi senza salvare" />
      <section className="k-sheet" role="dialog" aria-label="Attività fatta">
        <span className="handle" />
        <div className="k-sh">
          <h2>Attività fatta</h2>
          <span className="k-meta">{dayLabel}</span>
        </div>
        <div className="k-sbody">
          <input type="hidden" name="day" value={day} />
          <Field
            name="exercise"
            label="Cosa"
            type="choice"
            defaultValue={v["exercise"] ?? choices[0]?.id ?? ""}
            options={choices.map((c) => ({ value: c.id, label: c.name }))}
            error={e["exercise"]}
          />
          <Field
            name="end"
            label="Finita alle"
            type="time"
            defaultValue={v["end"] ?? ""}
            error={e["end"]}
          />
          <Field
            name="minutes"
            label="Durata"
            type="stepper"
            unit="min"
            step={5}
            defaultValue={min}
            onChange={setMin}
            error={e["minutes"]}
          />
          <Field
            name="km"
            label="Distanza"
            type="stepper"
            unit="km"
            step={0.5}
            defaultValue={km}
            onChange={setKm}
            help={
              pace
                ? "passo " + F.clock(pace) + " /km · " + F.num((k / m) * 60, "km/h")
                : "Facoltativa: con la distanza vedi il passo."
            }
            error={e["km"]}
          />
          <Field
            name="rpe"
            label="Fatica"
            type="choice"
            defaultValue={v["rpe"] ?? ""}
            options={[{ value: "", label: "Non la segno" }, ...EFFORT]}
            help="0 niente, 10 il massimo: conta come carico della settimana."
            error={e["rpe"]}
          />
          {e["form"] && (
            <p className="k-help" role="alert">
              {e["form"]}
            </p>
          )}
        </div>
        <div className="foot">
          <a className="k-btn secondary k-grow" href={closeHref}>
            Annulla
          </a>
          <button type="submit" className="k-btn primary k-grow" aria-busy={pending}>
            Salva
          </button>
        </div>
      </section>
    </form>
  );
}
