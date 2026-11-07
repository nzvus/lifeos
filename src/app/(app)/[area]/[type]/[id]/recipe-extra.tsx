/**
 * A pasto's own sections on the generic ObjectPage (PAT-30; change 2026-11-07-food-meal), from
 * `core/food`, as parts: one porzione (or a stima's totals) with «Registra» (the one primary) and «Cambia
 * i cibi» (its Composer, PAT-62); its cibi; its Famiglia (variants, MOD-21, ADR-0060).
 * «Parti da», «Variante» and Archivia are the page's verbs (PAT-16, PAT-17, PAT-19).
 */
import { Box, F, List } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { logicalDay } from "@/core/engines/time";
import { readFoodChoices, readRecipeChoices } from "@/core/food/catalog";
import { FOOD_FIELDS, mealPage } from "@/features/library/library";
import { food } from "@/i18n/food";
import type { Build } from "./extras";

const w = food.meal;

export const recipeExtra: Build = async (db, owner, id) => {
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  const foods = await readFoodChoices(db, owner, today);
  const page = mealPage(foods, await readRecipeChoices(db, owner, today, foods), id);
  if (!page) return null;
  const totals = FOOD_FIELDS.filter(
    ([f]) => f !== "nova" && page.totals[f] !== undefined,
  );
  return {
    meta: w.eaten(page.uses),
    parts: [
      {
        title: page.estimate ? w.whole : w.serving,
        node: (
          <div className="k-stack g2">
            {page.estimate && <p className="k-help">{w.estimate}</p>}
            <div className="k-stack g1">
              {totals.map(([f, words, unit]) => (
                <div key={f} className="k-line between">
                  <span className="k-body">{words}</span>
                  <span className="k-num">{F.num(page.totals[f]!, unit)}</span>
                </div>
              ))}
            </div>
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
      },
      ...(page.estimate
        ? []
        : [
            {
              title: w.foods,
              node: (
                <div className="k-stack g1">
                  {page.parts.map((p, i) => (
                    <div key={i} className="k-line between">
                      <span className="k-body">
                        {p.href ? (
                          <a className="k-link" href={p.href}>
                            {p.name}
                          </a>
                        ) : (
                          p.name
                        )}
                        {p.brand && <span className="k-meta"> · {p.brand}</span>}
                      </span>
                      <span className="k-num">{F.num(Number(p.quantity), p.unit)}</span>
                    </div>
                  ))}
                </div>
              ),
            },
          ]),
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
