"use client";
/**
 * The one box of a meal (PAT-30, PAT-102; target.md B1–B2): the same on the day, on a saved
 * pasto's page and in the Elenco, in the anatomy every Box shares (his 21 Nov, §139–§141):
 * (1) the head with the strip of where its energy comes from; open, (2) its macros as one bar
 * (VIS-106) and (3) its voto as a bar split by ingredient (VIS-107); (4) one sideways row — the
 * mode, «Ingredienti» · «Nutrienti», then the place's actions (PAT-101); (5) what the mode shows:
 * the ingredients as chips, each with its own voto, a tap lighting its blocks in both bars; or
 * every nutrient's row (VIS-50). Its other slots (context, porzioni) follow, by `PlanBox`.
 */
import { useState, type ReactNode } from "react";
import type { BoxEntry } from "./Box";
import { ChipRow } from "./ChipRow";
import { F } from "./format";
import { WORDS } from "./words";
import { Nutrients } from "./Nutrients";
import { energyStrip, type NutrientsData } from "./nutrient-rows";
import {
  macroColumns,
  PartsBar,
  partTones,
  votoColumns,
  type PartsMode,
} from "./PartsBar";
import { PlanBox, type PlanAction, type PlanSlot } from "./PlanBox";
import type { ThingBoxPlace } from "./ThingBox";

/** The box's words, from the caller's catalogue (PAT-81). */
export type MealWords = { parts: string; kinds: string; macros: string; voto: string };

export function MealBox({
  entry,
  data,
  slots,
  actions = [],
  words,
  children,
  ...place
}: ThingBoxPlace & {
  entry: BoxEntry;
  /** Its nutrients and, by part, its foods: the strip, the bar, the panels. */
  data: NutrientsData;
  /** Its plan's other level-1 slots (context, porzioni), from the caller. */
  slots: PlanSlot[];
  /** What can be done to it here (PAT-101), after the mode. */
  actions?: PlanAction[];
  words: MealWords;
  /** Open, after everything (a place's own line). */
  children?: ReactNode;
}) {
  const hasParts = (data.foods?.length ?? 0) > 1;
  const [mode, setMode] = useState<PartsMode>(hasParts ? "parts" : "kinds");
  const [lit, setLit] = useState<string | null>(null);
  const light = (k: string) => setLit((x) => (x === k ? null : k));
  const tones = partTones(data);
  const modes: PlanAction[] = hasParts
    ? (
        [
          ["parts", words.parts],
          ["kinds", words.kinds],
        ] as const
      ).map(([m, label]) => ({
        key: m,
        label,
        pressed: mode === m,
        onClick: () => {
          setMode(m);
          setLit(null);
        },
      }))
    : [];
  return (
    <PlanBox
      {...place}
      entry={{ ...entry, strip: energyStrip(data) }}
      slots={slots}
      actions={[...modes, ...actions]}
      before={
        <div className="k-stack g1 k-bars">
          <PartsBar
            kind="amount"
            label={words.macros}
            columns={macroColumns(data, mode)}
            lit={mode === "parts" ? lit : null}
            onPart={light}
          />
          {entry.score && entry.score.parts.length > 0 && (
            <PartsBar
              kind="voto"
              label={words.voto}
              columns={votoColumns(entry.score, tones)}
              lit={lit}
              onPart={light}
            />
          )}
        </div>
      }
    >
      {mode === "parts" && hasParts ? (
        <ChipRow
          label={words.parts}
          {...(lit ? { selected: lit } : {})}
          onPick={light}
          items={(data.foods ?? []).map((f) => ({
            key: f.key,
            label: f.name,
            // Its own voto with its word, never a bare number (VIS-11).
            value:
              f.amount +
              (f.score !== undefined
                ? " · " + WORDS.score.toLowerCase() + " " + F.n(f.score, 0)
                : ""),
          }))}
        />
      ) : (
        <Nutrients data={data} />
      )}
      {children}
    </PlanBox>
  );
}
