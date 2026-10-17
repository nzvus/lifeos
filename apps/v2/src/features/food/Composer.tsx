"use client";
/**
 * The meal composer (V-04), first part: a sub-page with the meal's foods,
 * each a stepper in its own unit; a search over the catalog (most eaten
 * first, the most eaten when nothing is typed) that adds a food at the
 * quantity of its last time; the meal on its own and the day with this
 * meal, recomputed as you type; done or planned, the time, the role (from
 * the time unless chosen), a note. The server action arrives as a prop and
 * rereads every food: what the browser holds is only for drawing.
 * Editing a logged meal opens it with its lines, each a choice of its own
 * that keeps the values it was logged with (`extraChoices`, ADR-0007).
 */
import { useActionState, useMemo, useState } from "react";
import { Box, F, Field, Nutrients, PageHeader, type NutrientsData } from "@lifeos/kit";
import { searchFoods, type FoodChoice } from "@/core/food/choices";
import { mealRoleAt, type RoleBounds } from "@/core/kinds/registry";
import {
  clockMinute,
  dayWithMeal,
  mealNutrients,
  mealTotals,
  quantityOf,
  type DraftLine,
} from "./composer";

export type MealState = {
  /** Form name ("lines", "line.<i>", "start", "role", "note", "form") → words. */
  errors: Record<string, string>;
  values: Record<string, string>;
  lines: DraftLine[];
  n: number;
};

const ROLE_WORDS: Record<string, string> = {
  breakfast: "Colazione",
  lunch: "Pranzo",
  snack: "Spuntino",
  dinner: "Cena",
};
const DEFAULT_QTY = "100";

export function Composer({
  choices,
  extraChoices = [],
  initialLines = [],
  title = "Pasto",
  backLabel = "Aggiungi",
  day,
  dayLabel,
  dayNutrients,
  roleBounds,
  initial,
  backHref,
  action,
}: {
  choices: FoodChoice[];
  /** A logged meal's own lines as choices (core/food `lineChoices`); not searched. */
  extraChoices?: FoodChoice[];
  initialLines?: DraftLine[];
  title?: string;
  backLabel?: string;
  day: string;
  dayLabel: string;
  /** The day as it is (eaten, planned, targets); null on a day with nothing. */
  dayNutrients: NutrientsData | null;
  /** Where lunch, the snack and dinner start: a meal's role from its time. */
  roleBounds: RoleBounds;
  initial: Record<string, string>;
  backHref: string;
  action: (state: MealState, data: FormData) => Promise<MealState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    values: initial,
    lines: initialLines,
    n: 0,
  });
  return (
    <Draft
      key={state.n}
      state={state}
      submit={submit}
      pending={pending}
      choices={choices}
      extraChoices={extraChoices}
      title={title}
      backLabel={backLabel}
      day={day}
      dayLabel={dayLabel}
      dayNutrients={dayNutrients}
      roleBounds={roleBounds}
      backHref={backHref}
    />
  );
}

/** The form itself, drawn again from the server's answer after an error. */
function Draft({
  state,
  submit,
  pending,
  choices,
  extraChoices,
  title,
  backLabel,
  day,
  dayLabel,
  dayNutrients,
  roleBounds,
  backHref,
}: {
  state: MealState;
  submit: (data: FormData) => void;
  pending: boolean;
  choices: FoodChoice[];
  extraChoices: FoodChoice[];
  title: string;
  backLabel: string;
  day: string;
  dayLabel: string;
  dayNutrients: NutrientsData | null;
  roleBounds: RoleBounds;
  backHref: string;
}) {
  const by = useMemo(
    () => new Map([...extraChoices, ...choices].map((c) => [c.key, c])),
    [choices, extraChoices],
  );
  const [lines, setLines] = useState<DraftLine[]>(state.lines);
  const [query, setQuery] = useState("");
  const [start, setStart] = useState(state.values["start"] ?? "");
  const [role, setRole] = useState(state.values["role"] ?? "");
  const e = state.errors;
  const v = state.values;
  const totals = mealTotals(lines, by);
  // With foods in the meal, a short list of the most eaten leaves room for the preview.
  const found = searchFoods(
    choices.filter((c) => !lines.some((l) => l.key === c.key)),
    query,
    query || lines.length === 0 ? 8 : 4,
  );
  const at = clockMinute(start);
  const auto = at === null ? "" : mealRoleAt(at, roleBounds);
  const add = (c: FoodChoice) => {
    const last = c.lastQty === null ? null : quantityOf(c.lastQty);
    setLines([
      ...lines,
      { key: c.key, quantity: last ? F.n(Number(last), 2) : DEFAULT_QTY },
    ]);
    setQuery("");
  };
  const per100 = (c: FoodChoice) =>
    c.per100["kcal"] === undefined
      ? ""
      : F.num(Number(c.per100["kcal"]), "kcal") + "/100";

  return (
    <form action={submit} className="k-page">
      <PageHeader
        title={title}
        context={dayLabel}
        back={{ label: backLabel, href: backHref }}
        of={{ fam: "food", kind: "meal" }}
      />
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />

      <section className="k-section g3" aria-label="I cibi del pasto">
        <h2>Cibi</h2>
        {lines.length === 0 && <p className="k-help">Cerca qui sotto e tocca un cibo.</p>}
        {lines.map((l, i) => {
          const c = by.get(l.key);
          return (
            <div key={l.key} className="k-cline">
              <Field
                name={"line." + i}
                label={c ? c.name + (c.brand ? " · " + c.brand : "") : "?"}
                type="stepper"
                unit={c?.unit ?? "g"}
                step={c?.unit === "ml" ? 50 : 10}
                defaultValue={l.quantity}
                error={e["line." + i]}
                onChange={(q) =>
                  setLines((ls) =>
                    ls.map((x, j) => (j === i ? { ...x, quantity: q } : x)),
                  )
                }
              />
              <button
                type="button"
                className="k-btn icon"
                aria-label={"Togli " + (c?.name ?? "")}
                onClick={() => setLines(lines.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          );
        })}
        {e["lines"] && lines.length === 0 && (
          <p className="k-help" role="alert">
            {e["lines"]}
          </p>
        )}
        <input
          className="k-text"
          type="search"
          placeholder="Cerca un cibo"
          aria-label="Cerca un cibo"
          value={query}
          onChange={(x) => setQuery(x.target.value)}
        />
        {found.length > 0 && (
          <div className="k-stack g2" aria-label={query ? "Risultati" : "I più mangiati"}>
            {!query && <span className="k-cap">I più mangiati</span>}
            {found.map((c) => (
              <button key={c.key} type="button" className="k-pick" onClick={() => add(c)}>
                <Box
                  density="row"
                  rail={false}
                  entry={{
                    fam: "food",
                    title: c.name,
                    meta: [c.brand, per100(c)].filter(Boolean).join(" · "),
                    value: "+",
                  }}
                />
              </button>
            ))}
          </div>
        )}
        {query && found.length === 0 && (
          <p className="k-help">Nessun cibo con queste parole nel catalogo.</p>
        )}
      </section>

      <section className="k-section g3" aria-label="Il pasto">
        <h2>Il pasto</h2>
        <Box
          rail={false}
          entry={{
            fam: "food",
            ...(role || auto ? { sub: role || auto } : {}),
            title: ROLE_WORDS[role || auto] ?? "Pasto",
            value: F.num(totals["kcal"] ?? 0, "kcal"),
          }}
        >
          <Nutrients data={mealNutrients(totals)} />
        </Box>
      </section>

      {dayNutrients && (
        <section className="k-section g3" aria-label="La giornata con questo pasto">
          <h2>La giornata con questo pasto</h2>
          <Box
            rail={false}
            entry={{
              fam: "day",
              title: dayLabel,
              meta: "il pasto è la parte tratteggiata",
            }}
          >
            <Nutrients data={dayWithMeal(dayNutrients, totals)} />
          </Box>
        </section>
      )}

      <section className="k-section g4" aria-label="Quando">
        <h2>Quando</h2>
        <Field
          name="status"
          label="Stato"
          type="choice"
          required
          defaultValue={v["status"] ?? "done"}
          options={[
            { value: "done", label: "Mangiato" },
            { value: "planned", label: "Previsto" },
          ]}
        />
        <Field
          name="start"
          label="Ora"
          type="time"
          defaultValue={start}
          error={e["start"]}
          onChange={setStart}
        />
        <Field
          name="role"
          label="Pasto"
          type="choice"
          defaultValue={role}
          onChange={setRole}
          help={
            auto ? "Senza scelta: " + ROLE_WORDS[auto]!.toLowerCase() + ", dall’ora." : ""
          }
          error={e["role"]}
          options={Object.entries(ROLE_WORDS).map(([value, label]) => ({ value, label }))}
        />
        <Field
          name="note"
          label="Nota"
          type="text"
          placeholder="facoltativa"
          defaultValue={v["note"] ?? ""}
          error={e["note"]}
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
