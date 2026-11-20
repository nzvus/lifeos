"use client";
/**
 * The one box of a meal (PAT-30, PAT-102; target.md B1–B2): the same on the day, on a saved
 * pasto's page and in the Elenco. Closed: the head and the strip of where its energy comes from.
 * Open (his 21 Nov, §143): the day's own bars — «Il giorno»'s component, its sizes — at two levels
 * a tap on them moves between (drill down · roll up, VIS-70): **the day**, eaten and planned,
 * with this meal's share lit and the rest dimmed; **the meal**, its own total, each ingredient a
 * part of it. Then one row of actions (PAT-101), then its other slots (context, porzioni).
 * A place without the day (a pasto, the Elenco) has only the meal's level.
 */
import { useState, type ReactNode } from "react";
import type { BoxEntry } from "./Box";
import { Nutrients } from "./Nutrients";
import { energyStrip, type NutrientsData } from "./nutrient-rows";
import { PlanBox, type PlanAction, type PlanSlot } from "./PlanBox";
import type { ThingBoxPlace } from "./ThingBox";

/** The levels' words, from the caller's catalogue (PAT-81). */
export type MealWords = { day: string; meal: string };

/**
 * The meal's level starts from the meal's own total (his §143: «parte invece dal totale del
 * pasto»): each bar is the meal's amount, full, split by its ingredients; no day's target, no
 * zones, no mark — those belong to the day's level.
 */
export function ownTotal(d: NutrientsData): NutrientsData {
  return {
    ...(d.foods ? { foods: d.foods } : {}),
    ...(d.kcal ? { kcal: { v: d.kcal.v } } : {}),
    // No target: the macros share one scale, the meal's largest full («/ 20 g of 20 g» said nothing).
    macros: d.macros.map((m) => ({
      key: m.key,
      v: m.v,
      ...(m.planned !== undefined ? { planned: m.planned } : {}),
      ...(m.parts ? { parts: m.parts } : {}),
      ...(m.sources ? { sources: m.sources } : {}),
    })),
  };
}

export function MealBox({
  entry,
  data,
  day,
  lit,
  slots,
  actions = [],
  words,
  children,
  ...place
}: ThingBoxPlace & {
  entry: BoxEntry;
  /** The meal's nutrients, each ingredient a part (`foods`). */
  data: NutrientsData;
  /** The day's, each meal a part (`foods`), when the place has the day. */
  day?: NutrientsData | undefined;
  /** This meal's key among the day's parts. */
  lit?: string;
  /** Its plan's other level-1 slots (context, porzioni), from the caller. */
  slots: PlanSlot[];
  /** What can be done to it here (PAT-101). */
  actions?: PlanAction[];
  words: MealWords;
  /** Open, after everything (a place's own line). */
  children?: ReactNode;
}) {
  const levels = day ? 2 : 1;
  const [level, setLevel] = useState(0);
  const next = () => setLevel((l) => (l + 1) % levels);
  const atDay = day !== undefined && level === 0;
  return (
    <PlanBox
      {...place}
      entry={{ ...entry, strip: energyStrip(data) }}
      slots={slots}
      actions={actions}
      before={
        <div className="k-stack g1">
          {levels > 1 && (
            <button
              type="button"
              className="k-btn link k-lvbtn"
              onClick={next}
              aria-label={(atDay ? words.day : words.meal) + ": tocca per cambiare"}
            >
              {atDay ? words.day : words.meal}
              <span className="k-lv" aria-hidden="true">
                {[0, 1].map((i) => (
                  <i key={i} className={i <= level ? "on" : ""} />
                ))}
              </span>
            </button>
          )}
          <Nutrients
            key={atDay ? "day" : "meal"}
            data={atDay ? day! : ownTotal(data)}
            part="main"
            chips={false}
            inline
            {...(atDay && lit ? { lit } : {})}
            {...(levels > 1 ? { onTap: next } : {})}
          />
        </div>
      }
    >
      {children}
    </PlanBox>
  );
}
