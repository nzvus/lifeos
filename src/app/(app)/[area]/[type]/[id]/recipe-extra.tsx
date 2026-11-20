/**
 * A pasto's own sections on the generic ObjectPage (PAT-30; change 2026-11-07-food-meal), from
 * `core/food`. First the meal's box, the one the day draws for a meal (PAT-30 as modified by the
 * change five-places, target.md B1): voto with its criteria, where its energy comes from, and
 * behind its doors every nutrient, its cibi (each a row that opens its cibo) and what it costs —
 * open at first, alone on its page. Under it «Registra» (the one primary) and «Cambia i cibi»
 * (its Composer, PAT-62); then its Famiglia (variants, MOD-21, ADR-0060). «Parti da», «Variante»
 * and Archivia are the page's verbs (PAT-16, PAT-17, PAT-19).
 */
import { Box, F, List, MealBox } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { readMicroTargets } from "@/core/day";
import { readTargetsFor } from "@/core/energy";
import { logicalDay } from "@/core/engines/time";
import {
  readFoodChoices,
  readFoodEstimates,
  readRecipeChoices,
} from "@/core/food/catalog";
import { mealPage } from "@/features/library/library";
import { mealCost, mealSlots } from "@/features/box/meal";
import { partRows } from "@/features/library/meal-rows";
import { food } from "@/i18n/food";
import { mealBox } from "../../../oggi/elenco/meal-box";
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
  const estimates = await readFoodEstimates(
    db,
    owner,
    recipe.parts.flatMap((l) => {
      const f = by.get(l.key);
      return f?.foodId ? [f.foodId] : [];
    }),
  );
  const box = mealBox(recipe, by, { targets, micros, estimates, weights });
  const cost = mealCost(box.details);
  return {
    meta: w.eaten(page.uses),
    first: (
      <div className="k-stack g3">
        <MealBox
          startOpen
          entry={{
            fam: "food",
            of: { kind: "meal" },
            title: page.estimate ? w.whole : w.serving,
            value: F.num(page.totals["kcal"] ?? 0, "kcal"),
            ...(page.estimate ? { meta: "stima" } : {}),
            ...(box.score ? { score: box.score } : {}),
          }}
          data={box.data}
          slots={mealSlots({
            data: box.data,
            rows: partRows(box.parts),
            details: box.details,
          })}
        />
        {cost && (
          // Its cost is level 2 (ATT-11): on its page, beside the box, no longer a door.
          <p className="k-help">
            {cost.label} {cost.value}
          </p>
        )}
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
