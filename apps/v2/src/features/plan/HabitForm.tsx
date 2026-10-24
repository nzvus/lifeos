"use client";
/**
 * A habit's editor (slice d; the board Models' «Abitudini»): its name,
 * what it is (an activity by its category, or a kind), how often (every
 * day, some weekdays, N times a week), at what time and for how long.
 */
import { useActionState, useState } from "react";
import { Field } from "@lifeos/kit";
import { HABIT_WHAT } from "./habit-form";
import { WEEKDAYS } from "./model-form";

export type HabitFormState = { errors: Record<string, string>; n: number };

export function HabitForm({
  initial,
  weekdays,
  action,
}: {
  initial: Record<string, string>;
  weekdays: number[];
  action: (s: HabitFormState, d: FormData) => Promise<HabitFormState>;
}) {
  const [state, submit, saving] = useActionState(action, { errors: {}, n: 0 });
  const [rule, setRule] = useState(initial["rule"] ?? "daily");
  const e = state.errors;
  return (
    <form action={submit} className="k-section g3" aria-label="L'abitudine">
      <Field
        name="name"
        label="Nome"
        type="text"
        required
        defaultValue={initial["name"] ?? ""}
        placeholder="per esempio: Stretching"
        error={e["name"]}
      />
      <label className="k-stack g1">
        <span className="k-label">Che cosa</span>
        <select
          className="k-select"
          name="what"
          defaultValue={initial["what"] ?? HABIT_WHAT[0]!.value}
        >
          {HABIT_WHAT.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
        {e["what"] && (
          <span className="k-help" role="alert">
            {e["what"]}
          </span>
        )}
      </label>
      <Field
        name="rule"
        label="Quando"
        type="choice"
        defaultValue={rule}
        onChange={setRule}
        options={[
          { value: "daily", label: "ogni giorno" },
          { value: "weekdays", label: "certi giorni" },
          { value: "times", label: "N volte a settimana" },
        ]}
        error={e["rule"]}
      />
      {rule === "weekdays" && (
        <div className="k-chips" role="group" aria-label="Giorni">
          {WEEKDAYS.map(([d, l]) => (
            <label key={d} className="k-chip">
              <input
                type="checkbox"
                name="weekday"
                value={d}
                defaultChecked={weekdays.includes(d)}
                aria-label={"giorno " + d}
              />
              {l}
            </label>
          ))}
        </div>
      )}
      {rule === "times" && (
        <Field
          name="n"
          label="Quante volte"
          type="stepper"
          step={1}
          defaultValue={initial["n"] ?? "3"}
          error={e["n"]}
          help="Resta tra i previsti finché la settimana non le ha."
        />
      )}
      <Field
        name="at"
        label="Alle"
        type="time"
        defaultValue={initial["at"] ?? ""}
        help="Vuoto: in un momento qualsiasi della giornata."
        error={e["at"]}
      />
      <Field
        name="durationMin"
        label="Durata"
        type="stepper"
        unit="min"
        step={5}
        defaultValue={initial["durationMin"] ?? ""}
        error={e["durationMin"]}
      />
      <div className="k-line end">
        <a className="k-btn secondary" href="/piano/modelli">
          Annulla
        </a>
        <button type="submit" className="k-btn primary" disabled={saving}>
          Salva
        </button>
      </div>
    </form>
  );
}
