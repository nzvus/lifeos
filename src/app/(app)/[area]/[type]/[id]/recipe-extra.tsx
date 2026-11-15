/**
 * A pasto's own sections on the generic ObjectPage (PAT-30; change 2026-11-07-food-meal), from
 * `core/food`. First the meal's box, the one the day draws for a meal (PAT-30 as modified by the
 * change five-places, target.md B1): voto with its criteria, where its energy comes from, and
 * behind its doors every nutrient, its cibi (each a row that opens its cibo) and what it costs —
 * open at first, alone on its page. Under it «Registra» (the one primary) and «Cambia i cibi»
 * (its Composer, PAT-62); then its Famiglia (variants, MOD-21, ADR-0060). «Parti da», «Variante»
 * and Archivia are the page's verbs (PAT-16, PAT-17, PAT-19).
 */
import { Box, energyStrip, F, List, NutrientsL0 } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { readMicroTargets } from "@/core/day";
import { readTargetsFor } from "@/core/energy";
import { logicalDay } from "@/core/engines/time";
import {
  readFoodChoices,
  readFoodEstimates,
  readRecipeChoices,
} from "@/core/food/catalog";
import { costWords, entryCost } from "@/core/food/cost";
import { mealDoors } from "@/features/day/meal-doors";
import { OpenBox } from "@/features/day/OpenBox";
import {
  mealFoods,
  mealKinds,
  mealNutrients,
  mealTotals,
} from "@/features/food/composer";
import { linesScore } from "@/features/food/lines-score";
import { mealPage } from "@/features/library/library";
import { common } from "@/i18n/common";
import { food } from "@/i18n/food";
import type { Build } from "./extras";

const w = food.meal;

export const recipeExtra: Build = async (db, owner, id) => {
  const { clock, weights } = await ownerClock();
  const today = logicalDay(new Date(), clock);
  const foods = await readFoodChoices(db, owner, today);
  const recipes = await readRecipeChoices(db, owner, today, foods);
  const page = mealPage(foods, recipes, id);
  const recipe = recipes.find((r) => r.recipeId === id);
  if (!page || !recipe) return null;
  const [targets, micros] = await Promise.all([
    readTargetsFor(db, owner, today, today, clock),
    readMicroTargets(db, owner, today),
  ]);
  const by = new Map(foods.map((f) => [f.key, f]));
  const lines = recipe.parts;
  // One porzione as the day would draw it once logged: the same builders as the composer's.
  const l0 = page.estimate
    ? mealNutrients(page.totals)
    : mealNutrients(mealTotals(lines, by), mealKinds(lines, by), mealFoods(lines, by));
  // Judged as the day judges a logged meal (`mealScore`): each food with all its estimates.
  const used = lines.flatMap((l) => {
    const f = by.get(l.key);
    return f ? [{ line: l, food: f }] : [];
  });
  const estimates = await readFoodEstimates(
    db,
    owner,
    used.flatMap((u) => (u.food.foodId ? [u.food.foodId] : [])),
  );
  const score = page.estimate
    ? undefined
    : linesScore(
        used.map((u) => ({
          quantity: u.line.quantity,
          values: u.food.per100,
          estimates: u.food.foodId ? estimates.get(u.food.foodId) : undefined,
        })),
        null,
        targets,
        micros,
        null,
        null,
        weights?.["food"],
      );
  const cost = costWords(
    entryCost(
      used.map((u) => ({
        quantity: u.line.quantity,
        values: u.food.per100,
        name: u.food.name,
      })),
    ),
  );
  const doors = mealDoors(
    l0,
    {
      stats: cost ? [{ label: common.doors.cost, value: cost }] : [],
      lines: page.parts.map((p) => ({ label: p.name, value: p.quantity })),
      foot: "",
    },
    <List label={w.foods}>
      {page.parts.map((p, i) => (
        <Box
          key={i}
          density="row"
          rail={false}
          entry={{
            fam: "food",
            of: Object.keys(p.of).length > 0 ? p.of : { kind: "ingredient" },
            title: p.name,
            value: F.num(Number(p.quantity), p.unit),
            ...(p.brand ? { meta: p.brand } : {}),
            ...(p.href ? { href: p.href, hrefLabel: "Apri " + p.name } : {}),
          }}
        />
      ))}
    </List>,
  );
  return {
    meta: w.eaten(page.uses),
    first: (
      <div className="k-stack g3">
        <OpenBox
          startOpen
          entry={{
            fam: "food",
            of: { kind: "meal" },
            title: page.estimate ? w.whole : w.serving,
            value: F.num(page.totals["kcal"] ?? 0, "kcal"),
            ...(page.estimate ? { meta: "stima" } : {}),
            ...(score ? { score } : {}),
            strip: energyStrip(l0),
          }}
          doors={doors}
        >
          <div className="k-slot-l0">
            <NutrientsL0 data={l0} />
          </div>
        </OpenBox>
        {page.estimate && <p className="k-help">{w.estimate}</p>}
        <div className="k-line g2 wrap">
          <a className="k-btn primary" href={"/aggiungi/pasto?pasto=" + id}>
            {w.log}
          </a>
          <a className="k-btn secondary" href={"/cibo/pasto/" + id + "/componi"}>
            {page.estimate ? w.composeEstimate : w.compose}
          </a>
        </div>
      </div>
    ),
    parts: [
      ...(page.base || page.variants.length > 0
        ? [
            {
              title: w.family,
              node: (
                <div className="k-stack g2">
                  {page.base && (
                    <Box
                      density="row"
                      rail={false}
                      entry={{
                        fam: "food",
                        of: { kind: "meal" },
                        title: w.variantOf(page.base.name),
                        meta: page.base.changes.join(" · ") || w.sameAsBase,
                        href: "/cibo/pasto/" + page.base.id,
                      }}
                    />
                  )}
                  {page.variants.length > 0 && (
                    <>
                      <List label={w.variants}>
                        {page.variants.map((v) => (
                          <Box
                            key={v.id}
                            density="row"
                            rail={false}
                            entry={{
                              fam: "food",
                              of: { kind: "meal" },
                              title: v.name,
                              meta: w.variant(v.uses),
                              href: "/cibo/pasto/" + v.id,
                            }}
                          />
                        ))}
                      </List>
                      <p className="k-help">{w.familyHelp}</p>
                    </>
                  )}
                </div>
              ),
            },
          ]
        : []),
    ],
  };
};
