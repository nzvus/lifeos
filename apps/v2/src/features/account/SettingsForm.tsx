"use client";
/**
 * Settings (V-14), first part: the profile E5 and E4 read (sex, birth year,
 * height) and the day's clock (time zone, when the day starts), saved by the
 * server action the page passes; «Salvato» when it is. Errors in words by
 * field; what was typed is kept.
 */
import { useActionState } from "react";
import { Field } from "@lifeos/kit";

export type SettingsState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  saved: boolean;
  n: number;
};

export function SettingsForm({
  initial,
  action,
}: {
  initial: Record<string, string>;
  action: (s: SettingsState, d: FormData) => Promise<SettingsState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    values: initial,
    saved: false,
    n: 0,
  });
  const v = state.values;
  const e = state.errors;
  return (
    <form key={state.n} action={submit} className="k-stack g4">
      <Field
        name="sex"
        label="Sesso"
        type="choice"
        defaultValue={v["sex"] ?? ""}
        error={e["sex"]}
        options={[
          { value: "male", label: "Uomo" },
          { value: "female", label: "Donna" },
        ]}
        help="Per gli obiettivi di vitamine e minerali (EFSA)."
      />
      <Field
        name="birthYear"
        label="Anno di nascita"
        type="stepper"
        step={1}
        defaultValue={v["birthYear"] ?? ""}
        error={e["birthYear"]}
      />
      <Field
        name="heightCm"
        label="Altezza"
        type="stepper"
        unit="cm"
        step={1}
        defaultValue={v["heightCm"] ?? ""}
        error={e["heightCm"]}
      />
      <Field
        name="timeZone"
        label="Fuso orario"
        type="text"
        defaultValue={v["timeZone"] ?? ""}
        error={e["timeZone"]}
        help="Decide che ore sono e che giorno è: per esempio Europe/Rome."
      />
      <Field
        name="boundary"
        label="La giornata inizia alle"
        type="time"
        defaultValue={v["boundary"] ?? ""}
        error={e["boundary"]}
        help="Uno spuntino all’1:30 conta per il giorno prima se la giornata inizia alle 4:00."
      />
      <div className="k-line g3">
        <button type="submit" className="k-btn primary" aria-busy={pending}>
          Salva
        </button>
        {state.saved && (
          <span className="k-meta" role="status">
            Salvato
          </span>
        )}
      </div>
    </form>
  );
}
