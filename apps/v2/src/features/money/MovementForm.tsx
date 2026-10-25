"use client";
/**
 * «Spesa» (V-11; ⊕ → Spesa): how much, out or in, its category (grouped as
 * the categories are), where, what, the day and the time. The server action
 * checks it (core/money) and writes the movement with its entry.
 */
import { useActionState } from "react";
import { Field, PageHeader } from "@lifeos/kit";

export type MovementState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  n: number;
};
export type CategoryOption = { id: string; name: string; group: string; kind: string };

export function MovementForm({
  categories,
  initial,
  backHref,
  action,
}: {
  categories: CategoryOption[];
  initial: Record<string, string>;
  backHref: string;
  action: (s: MovementState, d: FormData) => Promise<MovementState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    values: initial,
    n: 0,
  });
  const v = state.values;
  const e = state.errors;
  const groups = [...new Set(categories.map((c) => c.group))];
  return (
    <form key={state.n} action={submit} className="k-page">
      <PageHeader
        title="Spesa"
        context="un movimento di soldi"
        back={{ label: "Aggiungi", href: backHref }}
        of={{ fam: "money" }}
      />
      <input type="hidden" name="day" value={v["day"] ?? ""} />
      <section className="k-section g3" aria-label="Quanto">
        <Field
          name="direction"
          label="Che cosa"
          type="choice"
          required
          defaultValue={v["direction"] ?? "out"}
          options={[
            { value: "out", label: "Spesa" },
            { value: "in", label: "Entrata" },
          ]}
        />
        <Field
          name="amount"
          label="Quanto"
          type="text"
          unit="€"
          required
          placeholder="per esempio 12,50"
          defaultValue={v["amount"] ?? ""}
          error={e["amount"]}
        />
        <div className="k-field">
          <label className="k-label" htmlFor="f-category">
            Categoria
          </label>
          <select
            id="f-category"
            name="category"
            className="k-select"
            defaultValue={v["category"] ?? ""}
          >
            <option value="">nessuna</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {categories
                  .filter((c) => c.group === g)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <Field
          name="shop"
          label="Dove"
          type="text"
          placeholder="il negozio, facoltativo"
          defaultValue={v["shop"] ?? ""}
          error={e["shop"]}
        />
        <Field
          name="note"
          label="Cosa"
          type="text"
          placeholder="per esempio: cena al ristorante indiano"
          defaultValue={v["note"] ?? ""}
          error={e["note"]}
        />
        <Field
          name="method"
          label="Come"
          type="choice"
          defaultValue={v["method"] ?? "card"}
          options={[
            { value: "card", label: "Carta" },
            { value: "cash", label: "Contanti" },
          ]}
        />
        <Field
          name="start"
          label="Ora"
          type="time"
          defaultValue={v["start"] ?? ""}
          error={e["start"]}
        />
        {e["form"] && (
          <p className="k-help" role="alert">
            {e["form"]}
          </p>
        )}
      </section>
      <div className="k-pagefoot">
        <a className="k-btn secondary" href={backHref}>
          Annulla
        </a>
        <button type="submit" className="k-btn primary" aria-busy={pending}>
          Salva
        </button>
      </div>
    </form>
  );
}
