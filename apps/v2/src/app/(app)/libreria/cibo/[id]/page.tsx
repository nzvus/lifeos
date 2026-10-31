/**
 * A food's page (V-07; the board IngredientEditor read as a page): how often
 * it was used, its score per 100 kcal (E7, against today's targets), its
 * values per 100 as stats, «Così appare» (100 of it in the composer's bars,
 * folded), its products, the saved meals that use it; «Modifica» in the
 * header opens the editor.
 */
import { notFound } from "next/navigation";
import { Box, F, Field, Glyph, Nutrients, PageHeader, type GlyphOf } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import {
  readFoodChoices,
  readFoodEstimates,
  readRecipeChoices,
} from "@/core/food/catalog";
import { readMicroTargets } from "@/core/day";
import { readTargetsFor } from "@/core/energy";
import { foodScore } from "@/features/day/score";
import { OpenBox } from "@/features/day/OpenBox";
import { FOOD_FIELDS, foodPage, foodTwins } from "@/features/library/library";
import {
  mealFoods,
  mealKinds,
  mealNutrients,
  mealTotals,
} from "@/features/food/composer";
import { microsOf } from "@/features/day/nutrients";
import { dayMicros } from "@/core/food/micros";
import { archiveFood } from "./modifica/actions";
import { readPantry } from "@/core/pantry";
import { stockWords } from "@/features/library/pantry";
import { bought, counted } from "./dispensa";

const PANTRY_ERRORS: Record<string, string> = {
  quantity: "Quanto hai comprato, per esempio 1000.",
  packages: "Le confezioni, per esempio 2.",
  price: "Il prezzo in euro, per esempio 3,98.",
  left: "Quanto ne hai, per esempio 500 (0 se è finito).",
};

export default async function FoodPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dispensa?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { id } = await params;
  const asked = (await searchParams).dispensa;
  const pantryError = typeof asked === "string" ? PANTRY_ERRORS[asked] : undefined;
  const { clock, weights } = await ownerClock();
  const today = logicalDay(new Date(), clock);
  const foods = await readFoodChoices(db, owner, today);
  const page = foodPage(foods, await readRecipeChoices(db, owner, today, foods), id);
  if (!page) notFound();
  // Possible duplicates: another food sharing a meaningful word of its name.
  const twins = foodTwins(foods, id);
  // Judged on 100 kcal of it, against today's targets (meal-score.md §8).
  const [targets, micros, estimates, pantry] = await Promise.all([
    readTargetsFor(db, owner, today, today, clock),
    readMicroTargets(db, owner, today),
    readFoodEstimates(db, owner, [id]),
    readPantry(db, owner, today, new Date()),
  ]);
  const stock = pantry.find((p) => p.foodId === id) ?? null;
  const score = foodScore(
    Object.fromEntries(
      Object.entries(page.per100).flatMap(([k, v]) =>
        v == null ? [] : [[k, String(v)]],
      ),
    ),
    estimates.get(id),
    targets,
    micros,
    foods.find((f) => f.foodId === id && f.productId === null)?.drawing?.["group"],
    weights,
  );
  // Its uses in 90 days, its products' with it; and 100 of it as the composer draws a meal.
  const mine = foods.filter((f) => f.foodId === id);
  const uses = mine.reduce((a, f) => a + f.uses, 0);
  const self = mine.find((f) => f.productId === null);
  const by = new Map(mine.map((f) => [f.key, f]));
  const hundred = self ? [{ key: self.key, quantity: "100" }] : [];
  // Its vitamins and minerals in 100 of it, next to what a day needs (not judged: a food
  // is not meant to cover the day), as a meal's panel shows them.
  const micro = microsOf(
    dayMicros([
      {
        servings: null,
        lines: [
          {
            quantity: "100",
            values: Object.fromEntries(
              Object.entries(page.per100).flatMap(([k, v]) =>
                v == null ? [] : [[k, String(v)]],
              ),
            ),
            ...(estimates.get(id) ? { estimates: estimates.get(id)! } : {}),
          },
        ],
      },
    ]),
    micros,
  );
  const look = self
    ? {
        ...mealNutrients(
          mealTotals(hundred, by),
          mealKinds(hundred, by),
          mealFoods(hundred, by),
        ),
        ...(micro.groups.length
          ? {
              micros: {
                summary: "stime · in 100 " + page.unit + ", su quanto serve al giorno",
                groups: micro.groups.map((g) => ({
                  name: g.name,
                  items: g.items.map(({ name, v, t, unit }) => ({ name, v, t, unit })),
                })),
              },
            }
          : {}),
      }
    : null;
  const head = (of: GlyphOf, words: string) => (
    <h2>
      <span className="k-hicon">
        <Glyph of={of} size="m" />
      </span>
      {words}
    </h2>
  );
  return (
    <main className="k-page">
      <PageHeader
        title={page.name}
        context={
          uses > 0
            ? "usato " + F.plural(uses, "volta", "volte") + " in 90 giorni"
            : "non usato negli ultimi 90 giorni"
        }
        back={{ label: "Cibi", href: "/oggi/elenco?vista=cibi" }}
        action={{ label: "Modifica", href: "/libreria/cibo/" + id + "/modifica" }}
        of={{ fam: "food", ...(self?.drawing ?? {}) }}
      />
      {score && (
        <section className="k-section g3" aria-label="Voto">
          <OpenBox
            entry={{
              fam: "food",
              title: "Voto per 100 kcal",
              value: String(score.value),
              meta: "tocca per le parti: densità di nutrienti e limiti, sugli obiettivi di oggi",
              score,
            }}
          />
        </section>
      )}
      <section className="k-section g3" aria-label="Valori">
        {head({ section: "values" }, "Per 100 " + page.unit)}
        <div className="k-stats">
          {FOOD_FIELDS.filter(([f]) => page.per100[f] !== undefined).map(
            ([f, words, unit]) => (
              <div key={f} className="k-stat">
                <span className="k-meta">{words}</span>
                <span className="v">
                  {f === "nova"
                    ? Number(page.per100[f])
                    : // Small amounts (salt) keep their hundredths.
                      F.n(Number(page.per100[f]), Number(page.per100[f]) < 1 ? 2 : 1)}
                </span>
                <span className="k-help">{unit || "da 1 a 4"}</span>
              </div>
            ),
          )}
        </div>
      </section>
      {look && (
        <details className="k-section k-fold">
          <summary>
            Così appare{" "}
            <span className="k-meta">
              100 {page.unit}: macro, tipi, vitamine e minerali
            </span>
          </summary>
          <div className="k-foldbody">
            <Nutrients data={look} />
          </div>
        </details>
      )}
      <section className="k-section g3" id="dispensa" aria-label="Dispensa">
        {head({ place: "libreria" }, "In casa")}
        {stock ? (
          <Box
            density="row"
            rail={false}
            entry={{
              fam: "food",
              of: { kind: "ingredient" },
              title: "Dispensa",
              ...stockWords(stock.stock, page.unit),
              href: "/libreria/dispensa",
              hrefLabel: "Apri la dispensa",
            }}
          />
        ) : (
          <p className="k-help">
            Segna quando lo compri: quello che mangi lo toglie la dispensa da sola.
          </p>
        )}
        {pantryError && (
          <p className="k-help" role="alert">
            {pantryError}
          </p>
        )}
        <details className="k-fold">
          <summary>Comprato</summary>
          <form
            action={bought.bind(null, id, stock?.last?.itemId ?? id)}
            className="k-foldbody k-stack g3"
          >
            <div className="k-grid">
              <Field
                name="quantity"
                label="Quanto in tutto"
                type="stepper"
                unit={page.unit}
                step={100}
                required
                defaultValue={stock?.last?.quantity ?? ""}
              />
              <Field
                name="packages"
                label="Confezioni"
                type="stepper"
                step={1}
                defaultValue={stock?.last?.packages ?? ""}
              />
              <Field
                name="price"
                label="Prezzo"
                type="text"
                unit="€"
                placeholder="facoltativo"
                defaultValue={
                  stock?.last?.priceCents != null
                    ? F.input(stock.last.priceCents / 100, 2)
                    : ""
                }
              />
              <Field
                name="shop"
                label="Negozio"
                type="text"
                placeholder="facoltativo"
                defaultValue={stock?.last?.shop ?? ""}
              />
            </div>
            <button type="submit" className="k-btn primary">
              Comprato adesso
            </button>
          </form>
        </details>
        {stock && (
          <details className="k-fold">
            <summary>Ne ho…</summary>
            <form action={counted.bind(null, id)} className="k-foldbody k-stack g3">
              <Field
                name="left"
                label="Quanto ne hai adesso"
                type="stepper"
                unit={page.unit}
                step={50}
                required
                help="Da adesso conta questo: utile se hai buttato o dimenticato qualcosa."
              />
              <button type="submit" className="k-btn secondary">
                Salva
              </button>
            </form>
          </details>
        )}
      </section>
      <section className="k-section g3" aria-label="Prodotti">
        {head({ section: "products" }, "Prodotti")}
        {page.products.length === 0 && (
          <p className="k-help">Nessuna marca: si registra il cibo.</p>
        )}
        {page.products.map((p, i) => (
          <div key={i} className="k-line between">
            <span className="k-body">{p.brand}</span>
            <span className="k-meta">{F.plural(p.uses, "volta", "volte")}</span>
          </div>
        ))}
        <a className="k-link" href={"/libreria/cibo/" + id + "/prodotto"}>
          + Prodotto
        </a>
      </section>
      <section className="k-section g3" aria-label="Pasti salvati">
        {head({ section: "usedIn" }, "Nei pasti salvati")}
        {page.meals.length === 0 && <p className="k-help">In nessun pasto salvato.</p>}
        {page.meals.map((m, i) => (
          <div key={i} className="k-line between">
            <span className="k-body">{m.name}</span>
            <span className="k-num">{F.num(Number(m.quantity), page.unit)}</span>
          </div>
        ))}
      </section>
      {twins.length > 0 && (
        <details className="k-section k-fold">
          <summary>
            Unisci un doppione <span className="k-meta">{twins.length}</span>
          </summary>
          <div className="k-foldbody">
            <p className="k-help">
              Lo stesso cibo con un altro nome? I suoi pasti e prodotti passano qui e il
              suo nome resta come alias.
            </p>
            {twins.map((t) => (
              <a
                key={t.id}
                className="k-btn link"
                href={`/libreria/cibo/${id}/unisci?con=${t.id}`}
              >
                Unisci «{t.name}» in «{page.name}» ›
              </a>
            ))}
          </div>
        </details>
      )}
      <form action={archiveFood.bind(null, id)} className="k-section g3">
        <p className="k-help">
          Archiviato, esce dalla Libreria e dal composer con i suoi prodotti; i pasti
          registrati restano.
        </p>
        <button type="submit" className="k-btn secondary">
          Archivia
        </button>
      </form>
    </main>
  );
}
