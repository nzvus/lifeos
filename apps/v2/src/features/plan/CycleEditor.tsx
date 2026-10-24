"use client";
/**
 * «Ciclo» (the board CycleEditor; dossiers/day-templates.md §6): its steps
 * in order (a routine's session or a rest; up, down, out; + sessione, +
 * riposo), how it advances, what a skip does, from when, active or paused.
 * Each part saves through the server actions the page binds to the cycle.
 */
import { useActionState, useTransition } from "react";
import { Box, Field, type BoxEntry } from "@lifeos/kit";

export type CycleFormState = {
  errors: Record<string, string>;
  n: number;
  saved?: boolean;
};

export function CycleEditor(p: {
  name: string;
  start: string;
  active: boolean;
  advance: "occurrence" | "date";
  onSkip: "lose" | "shift";
  steps: { id: string; row: BoxEntry }[];
  routines: { id: string; name: string }[];
  actions: {
    save: (s: CycleFormState, d: FormData) => Promise<CycleFormState>;
    add: (d: FormData) => Promise<void>;
    move: (stepId: string, by: -1 | 0 | 1) => Promise<void>;
  };
}) {
  const [state, submit, saving] = useActionState(p.actions.save, { errors: {}, n: 0 });
  const [pending, start] = useTransition();
  const e = state.errors;
  return (
    <>
      <section className="k-section g3" aria-label="I passi">
        <h2>
          I passi <span className="k-meta">{p.steps.length}</span>
        </h2>
        {p.steps.length === 0 && <p className="k-empty k-meta">Nessun passo ancora.</p>}
        {p.steps.map((s, i) => (
          <Box
            key={s.id}
            entry={s.row}
            density="row"
            rail={false}
            acts={[
              ...(i > 0
                ? [
                    {
                      label: "↑",
                      aria: "Sposta prima: " + s.row.title,
                      onClick: () => start(() => p.actions.move(s.id, -1)),
                    },
                  ]
                : []),
              ...(i < p.steps.length - 1
                ? [
                    {
                      label: "↓",
                      aria: "Sposta dopo: " + s.row.title,
                      onClick: () => start(() => p.actions.move(s.id, 1)),
                    },
                  ]
                : []),
              {
                label: "×",
                aria: "Togli il passo " + s.row.title,
                danger: true,
                onClick: () => start(() => p.actions.move(s.id, 0)),
              },
            ]}
          />
        ))}
        <form action={p.actions.add} className="k-stack g2 k-panel">
          {p.routines.length > 0 && (
            <label className="k-stack g1">
              <span className="k-help">Sessione</span>
              <select
                className="k-select"
                name="routine"
                defaultValue={p.routines[0]!.id}
              >
                {p.routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="k-line wrap">
            {p.routines.length > 0 && (
              <button type="submit" className="k-btn secondary" disabled={pending}>
                + sessione
              </button>
            )}
            <button
              type="submit"
              name="routine"
              value=""
              className="k-btn secondary"
              disabled={pending}
            >
              + riposo
            </button>
          </div>
        </form>
      </section>

      <form
        key={state.n}
        action={submit}
        className="k-section g3"
        aria-label="Come avanza"
      >
        <h2>Come avanza</h2>
        <Field
          name="name"
          label="Nome"
          type="text"
          required
          defaultValue={p.name}
          error={e["name"]}
        />
        <label className="k-stack g1">
          <span className="k-label">Dal giorno</span>
          <input
            className="k-text"
            type="date"
            name="start"
            defaultValue={p.start}
            required
          />
          {e["start"] && (
            <span className="k-help" role="alert">
              {e["start"]}
            </span>
          )}
        </label>
        <Field
          name="advance"
          label="Avanza"
          type="choice"
          defaultValue={p.advance}
          options={[
            { value: "occurrence", label: "a ogni sessione" },
            { value: "date", label: "per data" },
          ]}
          help="A ogni sessione: il passo resta finché non lo fai (un riposo passa da solo). Per data: un passo al giorno, comunque vada."
        />
        <Field
          name="onSkip"
          label="Se salti"
          type="choice"
          defaultValue={p.onSkip}
          options={[
            { value: "lose", label: "si perde" },
            { value: "shift", label: "slitta" },
          ]}
          help="Si perde: il ciclo va avanti come se l’avessi fatto. Slitta: il passo saltato resta il prossimo."
        />
        <Field
          name="active"
          label="Stato"
          type="choice"
          defaultValue={p.active ? "active" : "paused"}
          options={[
            { value: "active", label: "attivo" },
            { value: "paused", label: "in pausa" },
          ]}
        />
        <div className="k-line between">
          <span className="k-help">{state.saved ? "Salvato." : ""}</span>
          <button type="submit" className="k-btn primary" disabled={saving}>
            Salva
          </button>
        </div>
      </form>
    </>
  );
}
