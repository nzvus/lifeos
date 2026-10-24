"use client";
/**
 * The meal composer (V-04; the board «Cena — compositore»). On top the meal
 * as it reads on the day («Pranzo · 13:13», the day, eaten or planned, the
 * kcal so far) and three tabs: Ingredienti (the foods as boxes: drawing,
 * kcal, protein, a stepper, «Togli»; the search under them), Pasti (the
 * saved meals, most used first) and Stima (typed totals). Then the meal
 * «come sarà», the day with it, «Quando», and «Salva» («Salva prevista»
 * when planned). Behaviour, from the first part: a sub-page with the meal's foods,
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
 * its foods (a meal out, a guess): saved as one line, marked estimated;
 * «Salva anche in Libreria» keeps it as a saved estimate, found by the
 * search like a saved meal and reopened here with its totals.
 */
import { useActionState, useMemo, useState } from "react";
import { Box, F, Field, Nutrients, PageHeader, type NutrientsData } from "@lifeos/kit";
import {
  searchFoods,
  searchRecipes,
  type FoodChoice,
  type RecipeChoice,
} from "@/core/food/choices";
import { MEAL_ROLE_WORDS } from "@/features/day/words";
import { ESTIMATE_FIELDS, type EstimateField } from "@/core/food/meal";
import { mealRoleAt, type RoleBounds } from "@/core/kinds/registry";
import {
  clockMinute,
  closeTheGap,
  fittingRecipes,
  mealFoods,
  dayWithMeal,
  estimateTotals,
  mealKinds,
  mealNutrients,
  mealTotals,
  quantityOf,
  type DraftLine,
  type Slot,
} from "./composer";

export type MealState = {
  /** Form name ("lines", "line.<i>", "start", "role", "note", "form") → words. */
  errors: Record<string, string>;
  values: Record<string, string>;
  lines: DraftLine[];
  n: number;
};

const ROLE_WORDS = MEAL_ROLE_WORDS;
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
  repeatHref,
  extraChoices = [],
  initialLines = [],
  title = "Pasto",
  backLabel = "Aggiungi",
  day,
  dayLabel,
  dayNutrients,
  slots = {},
  modelName = null,
  roleBounds,
  initial,
  backHref,
  action,
}: {
  choices: FoodChoice[];
  recipes?: RecipeChoice[];
  /** The recipe a logged meal is of, by its id. */
  initialRecipe?: string;
  /** A logged meal's «Registra di nuovo»: the composer for today, starting from it. */
  repeatHref?: string;
  /** A logged meal's own lines as choices (core/food `lineChoices`); not searched. */
  extraChoices?: FoodChoice[];
  initialLines?: DraftLine[];
  title?: string;
  backLabel?: string;
  day: string;
  dayLabel: string;
  /** The day as it is (eaten, planned, targets); null on a day with nothing. */
  dayNutrients: NutrientsData | null;
  /** The day's model's meal blocks: role → its targets (features/day/slots). */
  slots?: Record<string, Slot>;
  modelName?: string | null;
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
      repeatHref={repeatHref}
      extraChoices={extraChoices}
      title={title}
      backLabel={backLabel}
      day={day}
      dayLabel={dayLabel}
      dayNutrients={dayNutrients}
      slots={slots}
      modelName={modelName}
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
  repeatHref,
  extraChoices,
  title,
  backLabel,
  day,
  dayLabel,
  dayNutrients,
  slots,
  modelName,
  roleBounds,
  backHref,
}: {
  state: MealState;
  submit: (data: FormData) => void;
  pending: boolean;
  choices: FoodChoice[];
  recipes: RecipeChoice[];
  initialRecipe: string;
  repeatHref: string | undefined;
  extraChoices: FoodChoice[];
  title: string;
  backLabel: string;
  day: string;
  dayLabel: string;
  dayNutrients: NutrientsData | null;
  slots: Record<string, Slot>;
  modelName: string | null;
  roleBounds: RoleBounds;
  backHref: string;
}) {
  const by = useMemo(
    () => new Map([...extraChoices, ...choices].map((c) => [c.key, c])),
    [choices, extraChoices],
  );
  const [lines, setLines] = useState<DraftLine[]>(state.lines);
  // A quantity changed from outside its stepper («Porta … a …») remounts the steppers.
  const [rev, setRev] = useState(0);
  const [query, setQuery] = useState("");
  const [start, setStart] = useState(state.values["start"] ?? "");
  const [role, setRole] = useState(state.values["role"] ?? "");
  const [recipe, setRecipe] = useState(state.values["recipe"] ?? initialRecipe);
  const [servings, setServings] = useState(state.values["servings"] ?? "1");
  const [saveAs, setSaveAs] = useState(state.values["saveAs"] === "yes");
  const [estimate, setEstimate] = useState(state.values["estimate"] === "yes");
  // The tab: Ingredienti or Pasti (Stima is `estimate`).
  const [tab, setTab] = useState<"foods" | "meals">("foods");
  const [status, setStatus] = useState(state.values["status"] ?? "done");
  const [typed, setTyped] = useState<Partial<Record<EstimateField, string>>>(() =>
    Object.fromEntries(ESTIMATE_FIELDS.map((f) => [f, state.values["est." + f] ?? ""])),
  );
  const [estName, setEstName] = useState(state.values["estName"] ?? "");
  // A saved estimate picked fills the fields again: they remount with its totals.
  const [estKey, setEstKey] = useState(0);
  const ofRecipe = recipes.find((r) => r.recipeId === recipe);
  const recipeName = ofRecipe?.name;
  const ofEstimate = ofRecipe?.estimate !== undefined;
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
  const foundRecipes = searchRecipes(recipes, query, tab === "meals" ? 12 : 0);
  const roleWord = ROLE_WORDS[role || auto];
  // The meal's block in the day's model: its bars, the gap, the meals that fit.
  const slot = slots[role || auto] ?? null;
  const gap = estimate ? null : closeTheGap(totals, slot, lines, choices);
  const fitting = estimate || tab !== "foods" ? [] : fittingRecipes(recipes, by, slot);
  const heading = (roleWord ?? title) + (start ? " · " + start : "");
  const lineKcal = (c: FoodChoice | undefined, q: string) =>
    c && quantityOf(q)
      ? (Number(c.per100["kcal"] ?? 0) * Number(quantityOf(q))) / 100
      : 0;
  const lineProtein = (c: FoodChoice | undefined, q: string) =>
    c && quantityOf(q)
      ? (Number(c.per100["protein"] ?? 0) * Number(quantityOf(q))) / 100
      : 0;
  // A logged line is a choice of its own (its snapshot); its drawing is its food's in the catalog.
  const drawingOf = (c: FoodChoice | undefined) =>
    c?.drawing ??
    (c?.foodId ? choices.find((x) => x.foodId === c.foodId)?.drawing : undefined);
  const withDrawing = (d: Record<string, string> | undefined) => (d ? { of: d } : {});
  const switchTo = (next: "foods" | "meals" | "estimate") => {
    const toEstimate = next === "estimate";
    // A saved meal of the other sort stops being the one it is of.
    if (toEstimate !== estimate && (!ofRecipe || ofEstimate === estimate)) setRecipe("");
    setEstimate(toEstimate);
    if (!toEstimate) setTab(next as "foods" | "meals");
  };
  /** A saved meal adds its foods not in the meal yet; the meal is of it unless already of another. */
  const addRecipe = (r: RecipeChoice) => {
    if (r.estimate) {
      setEstimate(true);
      setTyped(
        Object.fromEntries(
          ESTIMATE_FIELDS.flatMap((f) =>
            r.estimate![f] === undefined ? [] : [[f, F.input(Number(r.estimate![f]), 2)]],
          ),
        ),
      );
      setEstName(r.name);
      setEstKey((k) => k + 1);
      setRecipe(r.recipeId);
      setQuery("");
      return;
    }
    const fresh = r.parts.filter(
      (p) => by.has(p.key) && !lines.some((l) => l.key === p.key),
    );
    setLines([
      ...lines,
      ...fresh.map((p) => ({ key: p.key, quantity: F.input(Number(p.quantity), 2) })),
    ]);
    if (!recipe) setRecipe(r.recipeId);
    setQuery("");
  };
  const add = (c: FoodChoice) => {
    const last = c.lastQty === null ? null : quantityOf(c.lastQty);
    setLines([
      ...lines,
      { key: c.key, quantity: last ? F.input(Number(last), 2) : DEFAULT_QTY },
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
        title={heading}
        context={[
          dayLabel,
          status === "planned" ? "previsto" : "mangiato",
          recipeName ?? "",
          F.num(totals["kcal"] ?? 0, "kcal") +
            (slot ? " di " + F.num(slot.kcal, "kcal") + " del blocco" : ""),
          slot && modelName ? "«" + modelName + "»" : "",
        ]
          .filter(Boolean)
          .join(" · ")}
        back={{ label: backLabel, href: backHref }}
        action={{ label: "Cibi", href: "/libreria?vista=cibi" }}
        of={{ fam: "food", kind: "meal" }}
      />
      {repeatHref && (
        <div className="k-section">
          <a className="k-link" href={repeatHref}>
            Registra di nuovo oggi
          </a>
        </div>
      )}
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="lines" value={JSON.stringify(estimate ? [] : lines)} />
      <input type="hidden" name="recipe" value={recipe} />
      <input type="hidden" name="estimate" value={estimate ? "yes" : ""} />

      <div className="k-section">
        <nav className="k-chips" aria-label="Come comporre il pasto">
          {(
            [
              ["foods", "Ingredienti"],
              ["meals", "Pasti"],
              ["estimate", "Stima"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className="k-chip"
              aria-pressed={k === "estimate" ? estimate : !estimate && tab === k}
              onClick={() => switchTo(k)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      <section className="k-section g3" aria-label="I cibi del pasto">
        <h2>
          {estimate ? "Stima a mano" : tab === "meals" ? "Pasti salvati" : "Ingredienti"}
          {!estimate && tab === "foods" && lines.length > 0 && (
            <span className="k-meta">
              {" "}
              {lines.length} · {F.num(totals["kcal"] ?? 0, "kcal")}
            </span>
          )}
        </h2>
        {estimate && (
          <div key={estKey} className="k-stack g3">
            <p className="k-help">
              Scrivi i totali del pasto, anche a occhio: conta come stima.
            </p>
            <Field
              name="estName"
              label="Cosa hai mangiato"
              type="text"
              placeholder="per esempio: Pizza fuori"
              defaultValue={estName}
              onChange={setEstName}
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
          </div>
        )}
        {!estimate && tab === "foods" && lines.length === 0 && (
          <p className="k-help">
            Cerca qui sotto e tocca un cibo; un pasto salvato è in «Pasti».
          </p>
        )}
        {!estimate && tab === "meals" && foundRecipes.length === 0 && (
          <p className="k-help">
            Nessun pasto salvato{query ? " con queste parole" : ""}: si salva da qui, con
            «Salva anche come pasto».
          </p>
        )}
        {!estimate && (
          <>
            {tab === "foods" &&
              lines.map((l, i) => {
                const c = by.get(l.key);
                const kcal = lineKcal(c, l.quantity);
                const protein = lineProtein(c, l.quantity);
                return (
                  <Box
                    key={l.key + ":" + rev}
                    density="row"
                    rail={false}
                    entry={{
                      fam: "food",
                      ...withDrawing(drawingOf(c)),
                      title: c ? c.name : "?",
                      value: F.num(kcal, "kcal"),
                      meta: [c?.brand ?? "", F.num(protein, "g") + " prot."]
                        .filter(Boolean)
                        .join(" · "),
                    }}
                    acts={[
                      {
                        label: "Togli",
                        aria: "Togli " + (c?.name ?? ""),
                        onClick: () => {
                          const rest = lines.filter((_, j) => j !== i);
                          setLines(rest);
                          if (rest.length === 0) setRecipe("");
                        },
                      },
                    ]}
                  >
                    <Field
                      name={"line." + i}
                      label={"Quantità di " + (c?.name ?? "")}
                      hideLabel
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
                  </Box>
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
              placeholder={
                tab === "meals"
                  ? "cerca tra " + F.plural(recipes.length, "pasto", "pasti")
                  : "cerca tra " + F.plural(choices.length, "cibo", "cibi")
              }
              aria-label={tab === "meals" ? "Cerca un pasto salvato" : "Cerca un cibo"}
              value={query}
              onChange={(x) => setQuery(x.target.value)}
            />
            {foundRecipes.length > 0 && (
              <div className="k-stack g2" aria-label="Pasti salvati">
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
                        meta: r.estimate
                          ? "stima · " + F.num(Number(r.estimate["kcal"] ?? 0), "kcal")
                          : F.plural(r.parts.length, "cibo", "cibi") +
                            " · " +
                            F.num(
                              mealTotals(
                                r.parts.map((p) => ({
                                  key: p.key,
                                  quantity: p.quantity,
                                })),
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
            {tab === "foods" && found.length > 0 && (
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
                        ...(c.drawing ? { of: c.drawing } : {}),
                        title: c.name,
                        meta: [c.brand, per100(c)].filter(Boolean).join(" · "),
                        value: "+",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
            {tab === "foods" && query && found.length === 0 && (
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
        <h2>{(roleWord ?? "Il pasto") + ", come sarà"}</h2>
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
            ...(estimate
              ? { meta: recipeName ? "stima · " + recipeName : "stima" }
              : recipeName
                ? { meta: recipeName }
                : {}),
          }}
        >
          <Nutrients
            data={mealNutrients(
              totals,
              estimate ? undefined : mealKinds(lines, by, servings),
              estimate ? undefined : mealFoods(lines, by, servings),
              slot,
            )}
          />
        </Box>
      </section>

      {gap && (
        <section className="k-section g3" aria-label="Per arrivare al blocco">
          <h2>Per arrivare al blocco</h2>
          <span className="k-meta">
            {gap.gap === 0
              ? "Le proteine del blocco ci sono."
              : "Mancano " +
                F.num(gap.gap, "g") +
                " di proteine per il blocco (" +
                F.num(slot!.protein!, "g") +
                ")" +
                (gap.ideas.length ? ". Così, con quanto aggiungono:" : ".")}
          </span>
          {gap.ideas.map((x) => {
            const c = by.get(x.key);
            return (
              <Box
                key={x.key}
                density="row"
                rail={false}
                entry={{
                  fam: "food",
                  ...withDrawing(drawingOf(c)),
                  title:
                    (x.raise ? "Porta " + x.name + " a " : x.name + " ") +
                    F.num(Number(x.quantity), c?.unit ?? "g"),
                  value: F.signed(x.protein, "g"),
                  meta: F.signed(x.kcal, "kcal") + " · proteine",
                }}
                acts={[
                  {
                    label: "+",
                    aria: x.raise
                      ? "Porta " + x.name + " a " + x.quantity
                      : "Aggiungi " + x.name,
                    onClick: () => {
                      if (x.raise) setRev((r) => r + 1);
                      setLines((ls) =>
                        x.raise
                          ? ls.map((l) =>
                              l.key === x.key ? { ...l, quantity: x.quantity } : l,
                            )
                          : [...ls, { key: x.key, quantity: x.quantity }],
                      );
                    },
                  },
                ]}
              />
            );
          })}
        </section>
      )}

      {fitting.length > 0 && (
        <section className="k-section g3" aria-label="Pasti adatti">
          <h2>
            {"Pasti adatti " + (roleWord ? "a " + roleWord.toLowerCase() : "al blocco")}{" "}
            <span className="k-meta">dai tuoi pasti</span>
          </h2>
          {fitting.map((f) => (
            <button
              key={f.recipe.key}
              type="button"
              className="k-pick"
              onClick={() => addRecipe(f.recipe)}
            >
              <Box
                density="row"
                rail={false}
                entry={{
                  fam: "food",
                  of: { kind: "meal" },
                  title: f.recipe.name,
                  meta:
                    F.num(f.kcal, "kcal") +
                    " · " +
                    F.num(f.protein, "g") +
                    " proteine · adatto " +
                    Math.round(f.fit * 100),
                  value: "+",
                }}
              />
            </button>
          ))}
        </section>
      )}

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
          onChange={setStatus}
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
        {(estimate ? !ofEstimate : lines.length > 0) && (
          <div className="k-stack g2">
            <input type="hidden" name="saveAs" value={saveAs ? "yes" : ""} />
            <div className="k-chips">
              <button
                type="button"
                className="k-chip"
                aria-pressed={saveAs}
                onClick={() => setSaveAs(!saveAs)}
              >
                {estimate ? "Salva anche in Libreria" : "Salva anche come pasto"}
              </button>
            </div>
            {saveAs && (
              <Field
                name="recipeName"
                label="Nome del pasto"
                type="text"
                placeholder={
                  estimate
                    ? "per esempio: Menu hamburger"
                    : "per esempio: Porridge della domenica"
                }
                defaultValue={v["recipeName"] ?? (estimate ? estName : "")}
                error={e["recipeName"]}
                help={
                  estimate
                    ? "Lo ritrovi in «Pasti salvati» con questi totali: la prossima volta basta toccarlo."
                    : "Lo ritrovi in «Pasti salvati», con questi cibi e queste quantità."
                }
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
          {status === "planned" ? "Salva previsto" : "Salva"}
        </button>
      </div>
    </form>
  );
}
