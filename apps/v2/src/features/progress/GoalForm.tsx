"use client";
/**
 * «Nuovo obiettivo» (V-09): what (weight, steps a day, study hours a week),
 * the value and, for the weight, by when. The app derives the rest: for
 * the weight, the pace it asks, in kg and % a week, judged against the
 * 0.5–1 % a week that keeps muscle (Helms 2014; ISSN 2017). Saved by the
 * action the page passes; errors in words; what was typed kept.
 */
import { useActionState, useState } from "react";
import { F, Field, PageHeader } from "@lifeos/kit";
import { neededPace } from "./goals";

export type GoalFormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  n: number;
};

export function GoalForm({
  nowKg,
  today,
  action,
}: {
  /** The mean of the last 7 days' weighings; null without any. */
  nowKg: number | null;
  today: string;
  action: (s: GoalFormState, d: FormData) => Promise<GoalFormState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    values: { kind: "weight", weekdays: "yes" },
    n: 0,
  });
  const v = state.values;
  const e = state.errors;
  const [kind, setKind] = useState(v["kind"] ?? "weight");
  const [value, setValue] = useState(v["value"] ?? "");
  const [by, setBy] = useState(v["by"] ?? "");
  const pace = kind === "weight" ? neededPace(nowKg, value, by, today) : null;
  return (
    <form key={state.n} action={submit} className="k-page">
      <PageHeader
        title="Nuovo obiettivo"
        back={{ label: "Obiettivi", href: "/andamento/obiettivi" }}
        of={{ place: "andamento" }}
      />
      <section className="k-section g4" aria-label="Obiettivo">
        <Field
          name="kind"
          label="Cosa"
          type="choice"
          required
          defaultValue={kind}
          onChange={setKind}
          error={e["kind"]}
          options={[
            { value: "weight", label: "Peso" },
            { value: "steps", label: "Passi al giorno" },
            { value: "study", label: "Studio a settimana" },
          ]}
        />
        <Field
          name="value"
          label={kind === "weight" ? "Arrivare a" : "Almeno"}
          type="text"
          unit={kind === "weight" ? "kg" : kind === "steps" ? "passi" : "h"}
          placeholder={
            kind === "weight" ? "per esempio 72,5" : kind === "steps" ? "8000" : "4"
          }
          defaultValue={value}
          onChange={setValue}
          error={e["value"]}
        />
        {kind === "weight" && (
          <Field
            name="by"
            label="Entro il (AAAA-MM-GG)"
            type="text"
            placeholder="facoltativo, per esempio 2026-12-20"
            defaultValue={by}
            onChange={setBy}
            error={e["by"]}
          />
        )}
        {kind === "steps" && (
          <Field
            name="weekdays"
            label="Quali giorni"
            type="choice"
            required
            defaultValue={v["weekdays"] ?? "yes"}
            options={[
              { value: "yes", label: "Feriali" },
              { value: "no", label: "Tutti" },
            ]}
          />
        )}
        {kind === "weight" && (
          <p className="k-help">
            {nowKg === null
              ? "Senza pesate recenti il ritmo si calcola dopo la prima."
              : pace === null
                ? "Ora " + F.num(nowKg, "kg") + ". Con una data, qui il ritmo che serve."
                : "Ora " +
                  F.num(nowKg, "kg") +
                  ": servono " +
                  F.num(pace.kgWeek, "kg") +
                  " a settimana (" +
                  F.n(pace.pctWeek, 2) +
                  " %). " +
                  (Math.abs(pace.pctWeek) > 1
                    ? "È più dell’1 % a settimana: si rischia di perdere muscolo, meglio una data più lontana."
                    : Math.abs(pace.pctWeek) < 0.25
                      ? "Un ritmo dolce: facile da tenere."
                      : "Un ritmo sostenibile.")}
          </p>
        )}
      </section>
      <div className="k-pagefoot">
        <a className="k-btn secondary" href="/andamento/obiettivi">
          Annulla
        </a>
        <button type="submit" className="k-btn primary" aria-busy={pending}>
          Salva
        </button>
      </div>
    </form>
  );
}
