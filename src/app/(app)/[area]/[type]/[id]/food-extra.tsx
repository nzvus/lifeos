/**
 * A cibo's own sections on the generic ObjectPage (PAT-30; change 2026-11-07-food-meal), built
 * from its specialisation `core/food` (model.md §8): its voto per 100 kcal (FD-50) and «Così
 * appare» under its values, its Marche (levels, FD-01) and «In casa» as parts, the saved pasti
 * that use it. Its label values are the registry's fields, edited in place by the page.
 */
import { Box, F, List, Nutrients, type FormFieldSpec } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { readMicroTargets } from "@/core/day";
import { readTargetsFor } from "@/core/energy";
import { logicalDay } from "@/core/engines/time";
import {
  readFoodChoices,
  readFoodEstimates,
  readFoodFormats,
  readRecipeChoices,
} from "@/core/food/catalog";
import { dayMicros } from "@/core/food/micros";
import { readPantry } from "@/core/pantry";
import { OpenBox } from "@/features/day/OpenBox";
import { microsOf } from "@/features/day/nutrients";
import { foodScore } from "@/features/day/score";
import {
  mealFoods,
  mealKinds,
  mealNutrients,
  mealTotals,
} from "@/features/food/composer";
import { foodPage } from "@/features/library/library";
import { PantryActions } from "@/features/library/PantryActions";
import { stockWords } from "@/features/library/pantry";
import { food as w } from "@/i18n/food";
import type { Build } from "./extras";
import { bought, counted } from "./food-actions";

/** «€/kg» or «€/l» by the food's unit. */
const kgOf = (unit: string) => (unit === "ml" ? "l" : "kg");

/** The values per 100 as strings, the empty ones left out (FD-06: unknown, never 0). */
const known = (per100: Record<string, string | number | null | undefined>) =>
  Object.fromEntries(
    Object.entries(per100).flatMap(([k, v]) => (v == null ? [] : [[k, String(v)]])),
  );

export const foodExtra: Build = async (db, owner, id, query) => {
  const { clock, weights } = await ownerClock();
  const today = logicalDay(new Date(), clock);
  const foods = await readFoodChoices(db, owner, today);
  const page = foodPage(foods, await readRecipeChoices(db, owner, today, foods), id);
  if (!page) return null;
  const [formats, targets, micros, estimates, pantry] = await Promise.all([
    readFoodFormats(db, owner, id, today),
    readTargetsFor(db, owner, today, today, clock),
    readMicroTargets(db, owner, today),
    readFoodEstimates(db, owner, [id]),
    readPantry(db, owner, today, new Date()),
  ]);
  const mine = foods.filter((f) => f.foodId === id);
  const self = mine.find((f) => f.productId === null);
  const uses = mine.reduce((a, f) => a + f.uses, 0);
  const per100 = known(page.per100);
  // FD-50: judged on 100 kcal of it, against today's targets.
  const score = foodScore(
    per100,
    estimates.get(id),
    targets,
    micros,
    self?.drawing?.["group"],
    weights,
  );
  // 100 of it as the composer draws a meal, with its micros next to a day's need (not judged).
  const by = new Map(mine.map((f) => [f.key, f]));
  const hundred = self ? [{ key: self.key, quantity: "100" }] : [];
  const micro = microsOf(
    dayMicros([
      {
        servings: null,
        lines: [
          {
            quantity: "100",
            values: per100,
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
                summary: w.look.micros(page.unit),
                groups: micro.groups.map((g) => ({
                  name: g.name,
                  items: g.items.map(({ name, v, t, unit }) => ({ name, v, t, unit })),
                })),
              },
            }
          : {}),
      }
    : null;
  const stock = pantry.find((p) => p.foodId === id) ?? null;
  const asked = query["dispensa"];
  const errors = asked && w.home.errors[asked] ? { [asked]: w.home.errors[asked]! } : {};
  const h = w.home;
  const boughtFields: FormFieldSpec[] = [
    {
      key: "quantity",
      label: h.quantity,
      type: "number",
      unit: page.unit,
      step: 100,
      required: true,
    },
    { key: "packages", label: h.packages, type: "integer" },
    { key: "price", label: h.price, type: "text", unit: "€" },
    { key: "shop", label: h.shop, type: "text" },
  ];
  const last = stock?.last;
  const spread = page.brands?.spread["kcal"];
  return {
    meta: [w.per100(page.unit), w.uses(uses)].join(" · "),
    judge: (
      <>
        {score && (
          <OpenBox
            entry={{
              fam: "food",
              title: w.score.title,
              value: String(score.value),
              meta: w.score.meta,
              score,
            }}
          />
        )}
        {look && (
          <details className="k-fold">
            <summary>
              {w.look.title} <span className="k-meta">{w.look.meta(page.unit)}</span>
            </summary>
            <div className="k-foldbody">
              <Nutrients data={look} />
            </div>
          </details>
        )}
      </>
    ),
    parts: [
      {
        title: w.brands.title,
        node: (
          <>
            {page.brands && page.brands.count > 1 && (
              <p className="k-help">
                {w.brands.mean(
                  page.brands.count,
                  spread
                    ? " · " + F.n(spread[0], 0) + "–" + F.num(spread[1], "kcal")
                    : "",
                )}
                {page.brands.uncertain.length > 0 ? w.brands.uncertain : ""}
              </p>
            )}
            {page.products.length === 0 ? (
              <p className="k-help">{w.brands.none}</p>
            ) : (
              <List label={w.brands.list}>
                {page.products.map((p) => (
                  <Box
                    key={p.id}
                    density="row"
                    rail={false}
                    entry={{
                      fam: "food",
                      title: p.brand,
                      value:
                        p.perKg !== null
                          ? F.num(p.perKg, "€") + "/" + kgOf(page.unit)
                          : "",
                      meta: [
                        w.brands.uses(p.uses),
                        ...p.differs,
                        ...formats
                          .filter((x) => x.productId === p.id)
                          .map(
                            (x) =>
                              x.name +
                              (x.size ? " " + F.num(Number(x.size), page.unit) : "") +
                              (x.centsPer100
                                ? " " +
                                  F.num(Number(x.centsPer100) / 10, "€") +
                                  "/" +
                                  kgOf(page.unit)
                                : ""),
                          ),
                      ].join(" · "),
                    }}
                  />
                ))}
              </List>
            )}
            <a className="k-link" href={`/cibo/prodotto/nuovo?di=${id}`}>
              {w.brands.add}
            </a>
          </>
        ),
      },
      {
        title: h.title,
        node: (
          <div id="dispensa" className="k-stack g2">
            {stock ? (
              <Box
                density="row"
                rail={false}
                entry={{
                  fam: "food",
                  of: { kind: "ingredient" },
                  title: h.box,
                  ...stockWords(stock.stock, page.unit),
                  href: "/cibo/elenco?vista=dispensa",
                  hrefLabel: h.open,
                }}
              />
            ) : (
              <p className="k-help">{h.hint}</p>
            )}
            <PantryActions
              errors={errors}
              forms={[
                {
                  label: h.bought,
                  title: h.bought,
                  submit: h.boughtNow,
                  fields: boughtFields,
                  values: {
                    quantity: last?.quantity ?? null,
                    packages: last?.packages ?? null,
                    price:
                      last?.priceCents != null ? F.input(last.priceCents / 100, 2) : null,
                    shop: last?.shop ?? null,
                  },
                  action: bought.bind(null, id, last?.itemId ?? id),
                },
                ...(stock
                  ? [
                      {
                        label: h.counted,
                        title: h.counted,
                        submit: h.save,
                        fields: [
                          {
                            key: "left",
                            label: h.left,
                            type: "number" as const,
                            unit: page.unit,
                            step: 50,
                            required: true,
                            help: h.leftHelp,
                          },
                        ],
                        action: counted.bind(null, id),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        ),
      },
    ],
    usedIn:
      page.meals.length === 0 ? (
        <p className="k-help">{w.usedIn.none}</p>
      ) : (
        <div className="k-stack g1">
          {page.meals.map((m) => (
            <div key={m.name} className="k-line between">
              <span className="k-body">{m.name}</span>
              <span className="k-num">{F.num(Number(m.quantity), page.unit)}</span>
            </div>
          ))}
        </div>
      ),
  };
};
