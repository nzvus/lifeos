"use client";
/**
 * «Giornata tipo» (the board ModelEditor; dossiers/day-templates.md §6):
 * name and base, the day's targets (inherited until changed, «torna alla
 * base»), the blocks (+ meal or training; an inherited one changed or
 * hidden here, and back), where it applies (weekdays), Duplica · Estendi ·
 * Archivia. Each part saves on its own through the server actions the page
 * binds to this model.
 */
import { useActionState, useState, useTransition } from "react";
import { Box, Field, F, type BoxEntry } from "@lifeos/kit";
import { MEAL_ROLE_WORDS } from "@/features/day/words";
import { DYNAMIC_FIELDS, FIXED_FIELDS, WEEKDAYS } from "./model-form";

export type FormState = { errors: Record<string, string>; n: number; saved?: boolean };
type FormAction = (s: FormState, d: FormData) => Promise<FormState>;

export type EditorBlock = {
  id: string;
  origin: "base" | "local" | "changed";
  row: BoxEntry;
  /** The form's starting values. */
  form: Record<string, string>;
};

export type ModelEditorProps = {
  name: string;
  base: string;
  bases: { value: string; label: string }[];
  mode: "dynamic" | "fixed";
  /** Each target's value in force (own or inherited), as typed. */
  values: Record<string, string>;
  /** Target key → the model it comes from, for inherited ones. */
  inheritedFrom: Record<string, string>;
  own: string[];
  blocks: EditorBlock[];
  removed: EditorBlock[];
  shares: { t: string; state: "good" | "warn" } | null;
  history: string | null;
  weekdays: number[];
  /** Weekday → the other model planning it now. */
  others: Record<number, string>;
  active: boolean;
  actions: {
    save: FormAction;
    resetTarget: (key: string) => Promise<void>;
    /** The block's id comes in the form («blockId»), empty for a new one. */
    saveBlock: FormAction;
    removeBlock: (blockId: string) => Promise<void>;
    restoreBlock: (blockId: string) => Promise<void>;
    shares: () => Promise<void>;
    weekdays: (d: FormData) => Promise<void>;
    archive: (active: boolean) => Promise<void>;
    copy: (how: "duplicate" | "extend") => Promise<void>;
  };
};

const ROLES = Object.entries(MEAL_ROLE_WORDS).map(([value, label]) => ({ value, label }));

export function ModelEditor(p: ModelEditorProps) {
  const [state, submit, saving] = useActionState(p.actions.save, { errors: {}, n: 0 });
  const [mode, setMode] = useState(p.mode);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (f: () => Promise<void>) => start(() => f());
  const e = state.errors;
  const fields = mode === "fixed" ? FIXED_FIELDS : DYNAMIC_FIELDS;

  return (
    <>
      <form key={state.n} action={submit} className="k-stack g4">
        <section className="k-block g3" aria-label="Nome e base">
          <Field
            name="name"
            label="Nome"
            type="text"
            required
            defaultValue={p.name}
            error={e["name"]}
          />
          <Field
            name="base"
            label="Estende"
            type="choice"
            defaultValue={p.base}
            options={[{ value: "", label: "nessuna" }, ...p.bases]}
            help="Eredita blocchi e obiettivi della base; qui si salvano solo le differenze."
            error={e["base"]}
          />
        </section>
        <section className="k-section g3" aria-label="Obiettivi">
          <h2>Obiettivi del giorno</h2>
          <Field
            name="mode"
            label="Come"
            type="choice"
            defaultValue={mode}
            onChange={(v) => setMode(v === "fixed" ? "fixed" : "dynamic")}
            options={[
              { value: "dynamic", label: "seguono l’obiettivo" },
              { value: "fixed", label: "numeri fissi" },
            ]}
            help={
              mode === "dynamic"
                ? "Dal dispendio della settimana: con un obiettivo di peso il deficit è il suo ritmo."
                : "Gli stessi numeri ogni giorno con questo modello."
            }
          />
          <div className="k-grid" style={{ "--cols": 2 } as React.CSSProperties}>
            {fields.map(([key, label, unit, step]) => (
              <div key={key} className="k-stack g1">
                <Field
                  name={key}
                  label={label}
                  type="stepper"
                  unit={unit}
                  step={step}
                  defaultValue={p.values[key] ?? ""}
                  error={e[key]}
                  {...(p.own.includes(key)
                    ? { help: "di questo modello" }
                    : p.inheritedFrom[key]
                      ? { help: "da «" + p.inheritedFrom[key] + "»" }
                      : {})}
                />
                {p.own.includes(key) && p.base !== "" && (
                  <button
                    type="button"
                    className="k-btn link"
                    disabled={pending}
                    onClick={() => run(() => p.actions.resetTarget(key))}
                  >
                    torna alla base
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="k-line between">
            <span className="k-help">{state.saved ? "Salvato." : ""}</span>
            <button type="submit" className="k-btn primary" disabled={saving}>
              Salva
            </button>
          </div>
        </section>
      </form>

      <section className="k-section g3" aria-label="Blocchi">
        <h2>
          Blocchi <span className="k-meta">{p.blocks.length}</span>
        </h2>
        {p.shares && (
          <span className="k-help" style={{ color: F.tone(p.shares.state) }}>
            {p.shares.t}
          </span>
        )}
        <div className="k-stack g2">
          {p.blocks.map((b) => (
            <div key={b.id} className="k-stack g2">
              <Box
                entry={b.row}
                density="row"
                mode="times"
                acts={[
                  {
                    label: "Cambia",
                    onClick: () => setEditing(editing === b.id ? null : b.id),
                  },
                  ...(b.origin === "changed"
                    ? [
                        {
                          label: "↺",
                          aria: "Torna come nella base: " + b.row.title,
                          onClick: () => run(() => p.actions.restoreBlock(b.id)),
                        },
                      ]
                    : []),
                  {
                    label: "×",
                    aria: "Togli " + b.row.title + " da questo modello",
                    danger: true,
                    onClick: () => run(() => p.actions.removeBlock(b.id)),
                  },
                ]}
              />
              {editing === b.id && (
                <BlockForm
                  initial={{ ...b.form, blockId: b.id }}
                  action={p.actions.saveBlock}
                  onDone={() => setEditing(null)}
                />
              )}
            </div>
          ))}
          {p.removed.map((b) => (
            <Box
              key={b.id}
              entry={{ ...b.row, faded: true, meta: "tolto qui; nella base resta" }}
              density="row"
              mode="times"
              acts={[
                {
                  label: "↺",
                  aria: "Rimetti " + b.row.title,
                  onClick: () => run(() => p.actions.restoreBlock(b.id)),
                },
              ]}
            />
          ))}
        </div>
        {editing === "new" ? (
          <BlockForm
            initial={{ kind: "meal" }}
            action={p.actions.saveBlock}
            onDone={() => setEditing(null)}
          />
        ) : (
          <div className="k-line wrap">
            <button
              type="button"
              className="k-btn secondary"
              onClick={() => setEditing("new")}
            >
              + blocco
            </button>
            <button
              type="button"
              className="k-btn secondary"
              disabled={pending}
              onClick={() => run(p.actions.shares)}
            >
              Quote dalle ultime 4 settimane
            </button>
          </div>
        )}
        {p.history && <span className="k-help">{p.history}</span>}
      </section>

      <section className="k-section g3" aria-label="Dove si applica">
        <h2>Dove si applica</h2>
        <form action={p.actions.weekdays} className="k-stack g2">
          <div className="k-chips" role="group" aria-label="Giorni della settimana">
            {WEEKDAYS.map(([d, letter]) => (
              <label key={d} className="k-chip">
                <input
                  type="checkbox"
                  name="weekday"
                  value={d}
                  defaultChecked={p.weekdays.includes(d)}
                  aria-label={F.Day(weekdayIso(d)).split(" ")[0]}
                />
                {letter}
              </label>
            ))}
          </div>
          <span className="k-help">
            {Object.keys(p.others).length
              ? "Oggi: " +
                WEEKDAYS.filter(([d]) => p.others[d])
                  .map(([d, l]) => l + " «" + p.others[d] + "»")
                  .join(" · ") +
                ". Scegliendo un giorno lo prendi a quel modello."
              : "Nessun altro modello ha giorni della settimana."}
          </span>
          <div className="k-line end">
            <button type="submit" className="k-btn secondary">
              Salva i giorni
            </button>
          </div>
        </form>
        <div className="k-grid" style={{ "--cols": 3 } as React.CSSProperties}>
          <button
            type="button"
            className="k-btn secondary"
            onClick={() => run(() => p.actions.copy("duplicate"))}
          >
            Duplica
          </button>
          <button
            type="button"
            className="k-btn secondary"
            onClick={() => run(() => p.actions.copy("extend"))}
          >
            Estendi
          </button>
          <button
            type="button"
            className="k-btn secondary"
            disabled={pending}
            onClick={() => run(() => p.actions.archive(!p.active))}
          >
            {p.active ? "Archivia" : "Riattiva"}
          </button>
        </div>
      </section>
    </>
  );
}

/** 1 Monday … 7 Sunday → a date with that weekday (for its name). */
const weekdayIso = (d: number) => "2026-10-" + String(18 + d).padStart(2, "0");

function BlockForm({
  initial,
  action,
  onDone,
}: {
  initial: Record<string, string>;
  action: FormAction;
  onDone: () => void;
}) {
  const [state, submit, saving] = useActionState(
    async (s: FormState, d: FormData) => {
      const next = await action(s, d);
      if (next.saved) onDone();
      return next;
    },
    { errors: {}, n: 0 },
  );
  const [kind, setKind] = useState(initial["kind"] === "session" ? "session" : "meal");
  const e = state.errors;
  return (
    <form action={submit} className="k-stack g3 k-panel">
      <input type="hidden" name="blockId" value={initial["blockId"] ?? ""} />
      <Field
        name="kind"
        label="Che cosa"
        type="choice"
        defaultValue={kind}
        onChange={(v) => setKind(v === "session" ? "session" : "meal")}
        options={[
          { value: "meal", label: "Pasto" },
          { value: "session", label: "Allenamento" },
        ]}
        error={e["kind"]}
      />
      {kind === "meal" && (
        <Field
          name="role"
          label="Quale pasto"
          type="choice"
          defaultValue={initial["role"] ?? ""}
          options={ROLES}
          error={e["role"]}
        />
      )}
      <Field
        name="at"
        label="Alle"
        type="time"
        defaultValue={initial["at"] ?? ""}
        help="Vuoto: senza orario."
        error={e["at"]}
      />
      {kind === "meal" ? (
        <div className="k-grid" style={{ "--cols": 2 } as React.CSSProperties}>
          <Field
            name="kcalShare"
            label="Quota kcal"
            type="stepper"
            unit="%"
            step={5}
            defaultValue={initial["kcalShare"] ?? ""}
            error={e["kcalShare"]}
          />
          <Field
            name="proteinShare"
            label="Quota proteine"
            type="stepper"
            unit="%"
            step={5}
            defaultValue={initial["proteinShare"] ?? ""}
            help="Vuota: come le kcal."
            error={e["proteinShare"]}
          />
        </div>
      ) : (
        <Field
          name="durationMin"
          label="Durata"
          type="stepper"
          unit="min"
          step={15}
          defaultValue={initial["durationMin"] ?? ""}
          error={e["durationMin"]}
        />
      )}
      <div className="k-line end">
        <button type="button" className="k-btn secondary" onClick={onDone}>
          Annulla
        </button>
        <button type="submit" className="k-btn primary" disabled={saving}>
          Salva il blocco
        </button>
      </div>
    </form>
  );
}
