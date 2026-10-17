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
 * A saved meal (a recipe) found by the search adds all its foods, and the
 * meal is then "of" it. «Stima a mano» types the meal's totals instead of
 * its foods (a meal out, a guess): saved as one line, marked estimated.
 */
import { useActionState, useMemo, useState } from "react";
import { Box, F, Field, Nutrients, PageHeader, type NutrientsData } from "@lifeos/kit";
import {
  searchFoods,
  searchRecipes,
  type FoodChoice,
  type RecipeChoice,
} from "@/core/food/choices";
import { ESTIMATE_FIELDS, type EstimateField } from "@/core/food/meal";
import { mealRoleAt, type RoleBounds } from "@/core/kinds/registry";
import {
  clockMinute,
  dayWithMeal,
  estimateTotals,
  mealKinds,
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
const ESTIMATE_LABELS: Record<EstimateField, [string, string]> = {
  kcal: ["Energia", "kcal"],
  protein: ["Proteine", "g"],
  carbs: ["Carboidrati", "g"],
  fat: ["Grassi", "g"],
  fibre: ["Fibre", "g"],
};

export function Composer({
  choices,
  recipes = [],
  initialRecipe = "",
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
  recipes?: RecipeChoice[];
  /** The recipe a logged meal is of, by its id. */
  initialRecipe?: string;
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
      recipes={recipes}
      initialRecipe={initialRecipe}
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
  recipes,
  initialRecipe,
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
  recipes: RecipeChoice[];
  initialRecipe: string;
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
  const [recipe, setRecipe] = useState(state.values["recipe"] ?? initialRecipe);
  const [servings, setServings] = useState(state.values["servings"] ?? "1");
  const [saveAs, setSaveAs] = useState(state.values["saveAs"] === "yes");
  const [estimate, setEstimate] = useState(state.values["estimate"] === "yes");
  const [typed, setTyped] = useState<Partial<Record<EstimateField, string>>>(() =>
    Object.fromEntries(ESTIMATE_FIELDS.map((f) => [f, state.values["est." + f] ?? ""])),
  );
  const recipeName = recipes.find((r) => r.recipeId === recipe)?.name;
  const e = state.errors;
  const v = state.values;
  const totals = estimate ? estimateTotals(typed) : mealTotals(lines, by, servings);
  // With foods in the meal, a short list of the most eaten leaves room for the preview.
  const found = searchFoods(
    choices.filter((c) => !lines.some((l) => l.key === c.key)),
    query,
    query || lines.length === 0 ? 8 : 4,
  );
  const at = clockMinute(start);
  const auto = at === null ? "" : mealRoleAt(at, roleBounds);
  const foundRecipes = searchRecipes(recipes, query, query ? 5 : lines.length ? 0 : 3);
  /** A saved meal adds its foods not in the meal yet; the meal is of it unless already of another. */
  const addRecipe = (r: RecipeChoice) => {
    const fresh = r.parts.filter(
      (p) => by.has(p.key) && !lines.some((l) => l.key === p.key),
    );
    setLines([
      ...lines,
      ...fresh.map((p) => ({ key: p.key, quantity: F.n(Number(p.quantity), 2) })),
    ]);
    if (!recipe) setRecipe(r.recipeId);
    setQuery("");
  };
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
      <input type="hidden" name="lines" value={JSON.stringify(estimate ? [] : lines)} />
      <input type="hidden" name="recipe" value={estimate ? "" : recipe} />
      <input type="hidden" name="estimate" value={estimate ? "yes" : ""} />

      <section className="k-section g3" aria-label="I cibi del pasto">
        <h2>Cibi</h2>
        <div className="k-chips">
          <button
            type="button"
            className="k-chip"
            aria-pressed={estimate}
            onClick={() => setEstimate(!estimate)}
          >
            Stima a mano
          </button>
        </div>
        {estimate && (
          <>
            <p className="k-help">
              Scrivi i totali del pasto, anche a occhio: conta come stima.
            </p>
            <Field
              name="estName"
              label="Cosa hai mangiato"
              type="text"
              placeholder="per esempio: Pizza fuori"
              defaultValue={v["estName"] ?? ""}
            />
            {ESTIMATE_FIELDS.map((f) => (
              <Field
                key={f}
                name={"est." + f}
                label={ESTIMATE_LABELS[f][0]}
                type="stepper"
                unit={ESTIMATE_LABELS[f][1]}
                step={f === "kcal" ? 50 : 5}
                required={f === "kcal"}
                placeholder={f === "kcal" ? "" : "facoltativo"}
                defaultValue={typed[f] ?? ""}
                error={e["est." + f]}
                onChange={(x) => setTyped((t) => ({ ...t, [f]: x }))}
              />
            ))}
          </>
        )}
        {!estimate && lines.length === 0 && (
          <p className="k-help">Cerca qui sotto e tocca un cibo o un pasto salvato.</p>
        )}
        {!estimate && (
          <>
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
                    onClick={() => {
                      const rest = lines.filter((_, j) => j !== i);
                      setLines(rest);
                      if (rest.length === 0) setRecipe("");
                    }}
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
              placeholder="Cerca un cibo o un pasto"
              aria-label="Cerca un cibo o un pasto"
              value={query}
              onChange={(x) => setQuery(x.target.value)}
            />
            {foundRecipes.length > 0 && (
              <div className="k-stack g2" aria-label="Pasti salvati">
                <span className="k-cap">Pasti salvati</span>
                {foundRecipes.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    className="k-pick"
                    onClick={() => addRecipe(r)}
                  >
                    <Box
                      density="row"
                      rail={false}
                      entry={{
                        fam: "food",
                        of: { kind: "meal" },
                        title: r.name,
                        meta:
                          F.plural(r.parts.length, "cibo", "cibi") +
                          " · " +
                          F.num(
                            mealTotals(
                              r.parts.map((p) => ({ key: p.key, quantity: p.quantity })),
                              by,
                            )["kcal"] ?? 0,
                            "kcal",
                          ),
                        value: "+",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
            {found.length > 0 && (
              <div
                className="k-stack g2"
                aria-label={query ? "Risultati" : "I più mangiati"}
              >
                {!query && <span className="k-cap">I cibi più mangiati</span>}
                {found.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className="k-pick"
                    onClick={() => add(c)}
                  >
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
              <p className="k-help">
                Nessun cibo con queste parole nel catalogo.{" "}
                <a
                  className="k-link"
                  href={
                    "/libreria/cibo/nuovo?nome=" +
                    encodeURIComponent(query.trim()) +
                    "&torna=" +
                    encodeURIComponent(backHref.replace("/aggiungi?", "/aggiungi/pasto?"))
                  }
                >
                  Crea «{query.trim()}»
                </a>
              </p>
            )}
          </>
        )}
      </section>

      <section className="k-section g3" aria-label="Il pasto">
        <h2>Il pasto</h2>
        {!estimate && (
          <Field
            name="servings"
            label="Porzioni"
            type="stepper"
            step={0.5}
            defaultValue={servings}
            error={e["servings"]}
            help="I cibi qui sopra sono una porzione: il pasto li moltiplica."
            onChange={setServings}
          />
        )}
        <Box
          rail={false}
          entry={{
            fam: "food",
            ...(role || auto ? { sub: role || auto } : {}),
            title: ROLE_WORDS[role || auto] ?? "Pasto",
            value: F.num(totals["kcal"] ?? 0, "kcal"),
            ...(estimate ? { meta: "stima" } : recipeName ? { meta: recipeName } : {}),
          }}
        >
          <Nutrients
            data={mealNutrients(
              totals,
              estimate ? undefined : mealKinds(lines, by, servings),
            )}
          />
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
        {!estimate && lines.length > 0 && (
          <div className="k-stack g2">
            <input type="hidden" name="saveAs" value={saveAs ? "yes" : ""} />
            <div className="k-chips">
              <button
                type="button"
                className="k-chip"
                aria-pressed={saveAs}
                onClick={() => setSaveAs(!saveAs)}
              >
                Salva anche come pasto
              </button>
            </div>
            {saveAs && (
              <Field
                name="recipeName"
                label="Nome del pasto"
                type="text"
                placeholder="per esempio: Porridge della domenica"
                defaultValue={v["recipeName"] ?? ""}
                error={e["recipeName"]}
                help="Lo ritrovi in «Pasti salvati», con questi cibi e queste quantità."
              />
            )}
          </div>
        )}
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
