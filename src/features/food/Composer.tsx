"use client";
/**
 * The meal composer (V-04; the board «Cena — compositore»). On top the meal
 * as it reads on the day («Pranzo · 13:13», the day, eaten or planned, the
 * kcal so far) and three tabs: Ingredienti (the foods as boxes: drawing,
 * kcal, protein, a stepper, «Togli»; the search under them), Pasti (the
 * saved meals, most used first) and Stima (typed totals). Then the meal
 * «come sarà» with its score as it is built (E7 FOOD, the same as Oggi's),
 * the saved meals that fit the block, what closes its protein gap, the day
 * with it, «Quando»; at the bottom the servings and «Salva» («Salva
 * prevista» when planned). The search has the barcode next to it. Behaviour, from the first part: a sub-page with the meal's foods,
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
import {
  Box,
  Composer as KitComposer,
  F,
  Field,
  Nutrients,
  PageHeader,
  type ComposerLine,
  type NutrientsData,
} from "@lifeos/kit";
import type { FoodChoice, RecipeChoice } from "@/core/food/choices";
import type { FoodTargets } from "@/core/day";
import type { WeightBook } from "@/core/account/weights";
import type { MicroTarget } from "@/core/engines/targets";
import { MEAL_ROLE_WORDS } from "@/features/day/words";
import { MealWhen } from "./MealWhen";
import { EstimateFields } from "./EstimateFields";
import { BrandSelect } from "./LinePicks";
import { FoodSearch } from "./FoodSearch";
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
  composerScore,
  macroStrip,
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
/** The converter's brand for a product without one: not a chip. */
const NO_BRAND = "marca non indicata";

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
  refs = null,
  roleBounds,
  initial,
  backHref,
  action,
  saved,
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
  /** The day's targets and micro needs: the meal's score (E7 FOOD) as it is built. */
  refs?: {
    targets: FoodTargets | null;
    micros: MicroTarget[] | null;
    weights?: WeightBook;
  } | null;
  /** Where lunch, the snack and dinner start: a meal's role from its time. */
  roleBounds: RoleBounds;
  initial: Record<string, string>;
  backHref: string;
  action: (state: MealState, data: FormData) => Promise<MealState>;
  /** A saved meal made or changed here (FOOD-42): its name, no day, no time, saved
   *  without logging anything; its foods are one serving. */
  saved?: { name: string; variantOf?: string };
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
      refs={refs}
      roleBounds={roleBounds}
      backHref={backHref}
      saved={saved}
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
  refs,
  roleBounds,
  backHref,
  saved,
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
  refs: {
    targets: FoodTargets | null;
    micros: MicroTarget[] | null;
    weights?: WeightBook;
  } | null;
  roleBounds: RoleBounds;
  backHref: string;
  saved: { name: string; variantOf?: string } | undefined;
}) {
  // A saved meal (FOOD-42): its name instead of the day's «when».
  const recipeMode = saved !== undefined;
  const [mealName, setMealName] = useState(
    state.values["recipeName"] ?? saved?.name ?? "",
  );
  const by = useMemo(
    () => new Map([...extraChoices, ...choices].map((c) => [c.key, c])),
    [choices, extraChoices],
  );
  const [lines, setLines] = useState<DraftLine[]>(state.lines);
  // A quantity changed from outside its stepper («Porta … a …») remounts the steppers.
  const [rev, setRev] = useState(0);
  const [query, setQuery] = useState("");
  const [hour] = useState(() => new Date().getHours());
  const [start, setStart] = useState(state.values["start"] ?? "");
  // A role taken from the time stays «Senza scelta»: moving the meal moves it.
  const [role, setRole] = useState(
    state.values["roleSource"] === "auto" ? "" : (state.values["role"] ?? ""),
  );
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
  const totals = estimate
    ? estimateTotals(typed, servings)
    : mealTotals(lines, by, servings);
  const at = clockMinute(start);
  const auto = at === null ? "" : mealRoleAt(at, roleBounds);
  const roleWord = ROLE_WORDS[role || auto];
  // The meal's block in the day's model: its bars, the gap, the meals that fit.
  const slot = slots[role || auto] ?? null;
  const gap = estimate || recipeMode ? null : closeTheGap(totals, slot, lines, choices);
  const fitting =
    estimate || recipeMode || tab !== "foods" ? [] : fittingRecipes(recipes, by, slot);
  // An «assunzione» (coffee, creatine, a supplement; capture.md §4): no role, never a meal.
  const intake = v["kind"] === "intake";
  const heading = recipeMode
    ? mealName.trim() || "Nuovo pasto"
    : (intake ? "Assunzione" : (roleWord ?? title)) + (start ? " · " + start : "");
  // A saved meal changed here: its kcal as saved next to now (the board Food).
  const savedKcal =
    ofRecipe && !ofRecipe.estimate && !estimate
      ? (mealTotals(
          ofRecipe.parts.map((p) => ({ key: p.key, quantity: p.quantity })),
          by,
        )["kcal"] ?? null)
      : null;
  // The meal's score as it is built (E7 FOOD; Oggi scores the logged meal the same way).
  const score =
    estimate || !refs
      ? undefined
      : composerScore(lines, by, servings, refs, slot, totals);
  const scanHref =
    "/cibo/cibo/nuovo?torna=" +
    encodeURIComponent(backHref.replace("/aggiungi?", "/aggiungi/pasto?"));
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
  // The meal's foods as the kit Composer's lines (PAT-62): drawing, kcal, protein, NOVA, the
  // macro strip, the brand chip; the brand to choose under the stepper.
  const shown: ComposerLine[] = lines.map((l, i) => {
    const c = by.get(l.key);
    return {
      key: l.key,
      quantity: l.quantity,
      unit: c?.unit ?? "g",
      step: c?.unit === "ml" ? 50 : 10,
      entry: {
        fam: "food",
        ...withDrawing(drawingOf(c)),
        title: c ? c.name : "?",
        value: F.num(lineKcal(c, l.quantity), "kcal"),
        meta: [
          F.num(lineProtein(c, l.quantity), "g") + " prot.",
          c?.per100["nova"] ? "NOVA " + Number(c.per100["nova"]) : "",
        ]
          .filter(Boolean)
          .join(" · "),
        ...(c ? { strip: macroStrip(c.per100) } : {}),
        ...(c?.brand && c.brand !== NO_BRAND
          ? { pills: [{ t: c.brand, of: { ui: "scan" } }] }
          : {}),
      },
      below: (
        <BrandSelect
          current={c}
          choices={choices}
          onPick={(k) =>
            setLines((ls) => ls.map((x, j) => (j === i ? { ...x, key: k } : x)))
          }
        />
      ),
    };
  });

  return (
    <main className="k-page">
      <KitComposer
        action={submit}
        busy={pending}
        cancelHref={backHref}
        canSave
        saveLabel={
          recipeMode
            ? "Salva il pasto"
            : status === "planned"
              ? "Salva previsto"
              : "Salva"
        }
        errors={e}
        stamp={rev}
        lines={estimate || tab !== "foods" ? [] : shown}
        onLines={(next) => {
          setLines(next.map((l) => ({ key: l.key, quantity: l.quantity })));
          if (next.length === 0) setRecipe("");
        }}
        head={
          <>
            <PageHeader
              title={heading}
              context={(recipeMode
                ? [
                    saved?.variantOf
                      ? "variante di " + saved.variantOf
                      : estimate
                        ? "stima a mano"
                        : "pasto salvato",
                    "una porzione " + F.num(totals["kcal"] ?? 0, "kcal"),
                  ]
                : [
                    dayLabel,
                    status === "planned" ? "previsto" : "mangiato",
                    recipeName ?? "",
                    (savedKcal !== null &&
                    Math.abs(savedKcal - (totals["kcal"] ?? 0)) >= 1
                      ? "salvata " + F.num(savedKcal, "kcal") + ", ora "
                      : "") +
                      F.num(totals["kcal"] ?? 0, "kcal") +
                      (slot ? " di " + F.num(slot.kcal, "kcal") + " del blocco" : ""),
                    slot && modelName ? "«" + modelName + "»" : "",
                  ]
              )
                .filter(Boolean)
                .join(" · ")}
              back={{ label: backLabel, href: backHref }}
              action={{ label: "Cibi", href: "/cibo/elenco" }}
              of={{ fam: "food", kind: "meal" }}
            />
            {repeatHref && (
              <div className="k-section">
                <a className="k-link" href={repeatHref}>
                  Registra di nuovo oggi
                </a>
              </div>
            )}
            {recipeMode && (
              <div className="k-section">
                <input type="hidden" name="saved" value="yes" />
                <Field
                  name="recipeName"
                  label="Nome del pasto"
                  type="text"
                  required
                  placeholder="per esempio: Porridge proteico"
                  defaultValue={mealName}
                  error={e["recipeName"]}
                  onChange={setMealName}
                />
              </div>
            )}
            <input type="hidden" name="day" value={day} />
            <input
              type="hidden"
              name="lines"
              value={JSON.stringify(estimate ? [] : lines)}
            />
            <input type="hidden" name="recipe" value={recipe} />
            <input type="hidden" name="estimate" value={estimate ? "yes" : ""} />
            {intake && <input type="hidden" name="kind" value="intake" />}

            <div className="k-section">
              <nav className="k-tabs" aria-label="Come comporre il pasto">
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
                    className="k-tab"
                    aria-selected={k === "estimate" ? estimate : !estimate && tab === k}
                    onClick={() => switchTo(k)}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </>
        }
        title={{
          label: "I cibi del pasto",
          node: (
            <>
              {estimate
                ? "Stima a mano"
                : tab === "meals"
                  ? "Pasti salvati"
                  : "Ingredienti"}
              {!estimate && tab === "foods" && lines.length > 0 && (
                <span className="k-meta">
                  {" "}
                  {lines.length} · {F.num(totals["kcal"] ?? 0, "kcal")}
                </span>
              )}
            </>
          ),
        }}
        empty={
          <>
            {estimate && (
              <EstimateFields
                key={estKey}
                named={!recipeMode}
                estName={estName}
                typed={typed}
                errors={e}
                onName={setEstName}
                onTyped={(f, x) => setTyped((t) => ({ ...t, [f]: x }))}
              />
            )}
            {!estimate && tab === "foods" && lines.length === 0 && (
              <p className="k-help">
                Cerca qui sotto e tocca un cibo; un pasto salvato è in «Pasti».
              </p>
            )}
            {!estimate && tab === "meals" && recipes.length === 0 && (
              <p className="k-help">
                Nessun pasto salvato: si salva da qui, con «Salva anche come pasto».
              </p>
            )}
            {!estimate && e["lines"] && lines.length === 0 && (
              <p className="k-help" role="alert">
                {e["lines"]}
              </p>
            )}
          </>
        }
        search={
          estimate ? null : (
            <FoodSearch
              tab={tab}
              choices={choices}
              inMeal={new Set(lines.map((l) => l.key))}
              recipes={recipes}
              by={by}
              hour={hour}
              query={query}
              onQuery={setQuery}
              onFood={add}
              onRecipe={addRecipe}
              scanHref={scanHref}
              createHref={(name) =>
                "/cibo/cibo/nuovo?nome=" +
                encodeURIComponent(name) +
                "&torna=" +
                encodeURIComponent(backHref.replace("/aggiungi?", "/aggiungi/pasto?"))
              }
            />
          )
        }
      >
        <section className="k-section g3" aria-label="Il pasto">
          <h2>{(intake ? "L’assunzione" : (roleWord ?? "Il pasto")) + ", come sarà"}</h2>
          <Box
            rail={false}
            entry={{
              ...(score ? { score } : {}),
              fam: "food",
              ...(!intake && (role || auto) ? { sub: role || auto } : {}),
              title: intake ? "Assunzione" : (ROLE_WORDS[role || auto] ?? "Pasto"),
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

        {dayNutrients && !recipeMode && (
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

        {!recipeMode && (
          <MealWhen
            values={v}
            errors={e}
            start={start}
            role={role}
            intake={intake}
            auto={auto}
            estimate={estimate}
            canSave={estimate ? !ofEstimate : lines.length > 0}
            saveAs={saveAs}
            estName={estName}
            onStatus={setStatus}
            onStart={setStart}
            onRole={setRole}
            onSaveAs={setSaveAs}
          />
        )}

        {!recipeMode && (
          <div className="k-section">
            <Field
              name="servings"
              label="Porzioni"
              type="stepper"
              step={0.5}
              defaultValue={servings}
              error={e["servings"]}
              onChange={setServings}
            />
          </div>
        )}
      </KitComposer>
    </main>
  );
}
