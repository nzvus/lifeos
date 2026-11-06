"use client";
/**
 * «Nuovo tracker» (V-14; the board Settings → Tracker e tipi): a name, its
 * family (its colour and drawing), at a moment or with a duration, and up
 * to six fields, each with its word, its type, a unit for a number, the
 * options of a choice. Posted as one JSON value; core/kinds `buildUserKind`
 * checks it and the errors come back by field.
 */
import { useActionState, useState } from "react";
import { Field } from "@lifeos/kit";

export type TrackerState = { errors: Record<string, string>; n: number };
type Row = { id: number; label: string; type: string; unit: string; choices: string };

const FAMILIES = [
  { value: "habit", label: "Abitudine" },
  { value: "mind", label: "Mente" },
  { value: "body", label: "Corpo" },
  { value: "sleep", label: "Sonno" },
  { value: "drink", label: "Bevande" },
  { value: "food", label: "Cibo" },
];
const TYPES: [string, string][] = [
  ["number", "numero"],
  ["integer", "numero intero"],
  ["scale", "da 1 a 5"],
  ["boolean", "sì / no"],
  ["choice", "una tra più opzioni"],
  ["text", "testo"],
  ["duration", "minuti"],
];
const MAX = 6;

export function TrackerForm({
  action,
}: {
  action: (s: TrackerState, d: FormData) => Promise<TrackerState>;
}) {
  const [state, submit, pending] = useActionState(action, { errors: {}, n: 0 });
  const [rows, setRows] = useState<Row[]>([]);
  const [next, setNext] = useState(1);
  const e = state.errors;
  const set = (id: number, k: keyof Row, v: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  return (
    <form action={submit} className="k-stack g3">
      <input
        type="hidden"
        name="fields"
        value={JSON.stringify(rows.map(({ id: _id, ...r }) => r))}
      />
      <Field
        name="name"
        label="Nome"
        type="text"
        placeholder="per esempio: Mal di testa"
        required
        error={e["name"]}
      />
      <Field
        name="family"
        label="Che cosa è"
        type="choice"
        required
        defaultValue="habit"
        options={FAMILIES}
        error={e["family"]}
      />
      <Field
        name="shape"
        label="Quando"
        type="choice"
        required
        defaultValue="instant"
        options={[
          { value: "instant", label: "Un momento" },
          { value: "interval", label: "Con una durata" },
        ]}
        error={e["shape"]}
      />
      <div className="k-stack g2">
        <span className="k-label">Cosa segni</span>
        {rows.length === 0 && (
          <p className="k-help">
            Senza campi è un segno solo: «fatto», con la sua ora. Aggiungi un campo per un
            numero, un voto, una scelta.
          </p>
        )}
        {rows.map((r, i) => (
          <div key={r.id} className="k-panel k-stack g2">
            <div className="k-line g2">
              <input
                className="k-text"
                style={{ flex: 1, minWidth: 0 }}
                placeholder="la parola, per esempio: Intensità"
                aria-label={"Campo " + (i + 1) + ": la parola"}
                value={r.label}
                onChange={(x) => set(r.id, "label", x.target.value)}
              />
              <button
                type="button"
                className="k-btn act danger"
                aria-label={"Togli il campo " + (i + 1)}
                onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
              >
                Togli
              </button>
            </div>
            <select
              className="k-select"
              aria-label={"Campo " + (i + 1) + ": il tipo"}
              value={r.type}
              onChange={(x) => set(r.id, "type", x.target.value)}
            >
              {TYPES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            {(r.type === "number" || r.type === "integer") && (
              <input
                className="k-text"
                placeholder="unità (facoltativa): ml, km, pagine…"
                aria-label={"Campo " + (i + 1) + ": l'unità"}
                value={r.unit}
                onChange={(x) => set(r.id, "unit", x.target.value)}
              />
            )}
            {r.type === "choice" && (
              <input
                className="k-text"
                placeholder="le opzioni, separate da virgole"
                aria-label={"Campo " + (i + 1) + ": le opzioni"}
                value={r.choices}
                onChange={(x) => set(r.id, "choices", x.target.value)}
              />
            )}
            {e["field." + i] && (
              <p className="k-help" role="alert">
                {e["field." + i]}
              </p>
            )}
          </div>
        ))}
        {rows.length < MAX && (
          <button
            type="button"
            className="k-btn secondary"
            onClick={() => {
              setRows((rs) => [
                ...rs,
                { id: next, label: "", type: "number", unit: "", choices: "" },
              ]);
              setNext(next + 1);
            }}
          >
            + campo
          </button>
        )}
      </div>
      {e["form"] && (
        <p className="k-help" role="alert">
          {e["form"]}
        </p>
      )}
      <button type="submit" className="k-btn primary" aria-busy={pending}>
        Crea il tracker
      </button>
    </form>
  );
}
