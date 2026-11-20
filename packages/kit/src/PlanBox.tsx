"use client";
/**
 * The one builder of a thing's Box (Deliver ③, proposal §132; PAT-30, VIS-40, VIS-102): the caller
 * gives its slots already in its plan's order, each in the shape of its instrument, and this draws
 * every slot the same way for every type — never by type (PAT-81):
 * - `word: string` → a door that only says its value (a name, NOVA 1);
 * - `words: string[]` → a sideways `ChipRow` of names, open, before the doors (facts, members);
 * - `trend` → a door with the last value, its `Chart` behind it when there are two points or more;
 * - `nutrients` → a door with its `Nutrients` behind it.
 * `variants` are a thing's children he picks (a cibo's marche, §132 (b)): each has its own head
 * and slots; one is on at first (the caller's rule), a tap on another redraws the Box with it.
 */
import { useState } from "react";
import { Chart, type ChartData } from "./Chart";
import { ChipRow } from "./ChipRow";
import { Nutrients } from "./Nutrients";
import type { NutrientsData } from "./nutrient-rows";
import { ThingBox, type ThingBoxPlace } from "./ThingBox";
import type { BoxDoor, BoxEntry } from "./Box";

type Base = { key: string; label: string };
export type PlanSlot =
  | (Base & { word: string })
  | (Base & { words: string[] })
  | (Base & { trend: ChartData; value: string; caption?: string })
  | (Base & { nutrients: NutrientsData; value?: string });

export type PlanVariant = {
  key: string;
  /** Its chip: its name, and a short value beside it (a price). */
  label: string;
  meta?: string;
  /** What it changes in the head (its number, its voto). */
  head?: Partial<Pick<BoxEntry, "value" | "score" | "meta">>;
  slots: PlanSlot[];
};

/** A slot drawn as a door, or null when it is a row of names (drawn above the doors). */
export function slotDoor(s: PlanSlot): BoxDoor | null {
  if ("words" in s) return null;
  if ("word" in s) return { key: s.key, label: s.label, value: s.word };
  if ("trend" in s)
    return {
      key: s.key,
      label: s.label,
      value: s.value,
      ...(s.trend.y.length > 1
        ? {
            panel: (
              <Chart
                type="trend"
                data={s.trend}
                {...(s.caption ? { caption: s.caption } : {})}
              />
            ),
          }
        : {}),
    };
  return {
    key: s.key,
    label: s.label,
    ...(s.value ? { value: s.value } : {}),
    panel: <Nutrients data={s.nutrients} />,
  };
}

export function PlanBox({
  entry,
  slots = [],
  variants,
  picked,
  variantsLabel = "",
  ...place
}: ThingBoxPlace & {
  entry: BoxEntry;
  /** In the plan's order; a slot with no data is left out by the caller (PRD-22). */
  slots?: PlanSlot[];
  variants?: PlanVariant[];
  /** The variant on at first; the first when missing. */
  picked?: string;
  /** The variants' row's name, for a screen reader only (ChipRow). */
  variantsLabel?: string;
}) {
  const vs = variants ?? [];
  const [key, setKey] = useState(() => picked ?? vs[0]?.key);
  const v = vs.find((x) => x.key === key);
  const shown = v ? v.slots : slots;
  const doors = shown.flatMap((s) => {
    const d = slotDoor(s);
    return d ? [d] : [];
  });
  const rows = shown.flatMap((s) => ("words" in s && s.words.length > 0 ? [s] : []));
  return (
    <ThingBox
      density="row"
      {...place}
      entry={{ ...entry, ...(v?.head ?? {}) }}
      doors={doors}
    >
      {vs.length > 0 && (
        <ChipRow
          label={variantsLabel}
          {...(key ? { selected: key } : {})}
          onPick={setKey}
          items={vs.map((x) => ({
            key: x.key,
            label: x.label,
            ...(x.meta ? { value: x.meta } : {}),
          }))}
        />
      )}
      {rows.map((s) => (
        <ChipRow
          key={s.key}
          label={s.label}
          items={s.words.map((w, i) => ({ key: i + ":" + w, label: w }))}
        />
      ))}
    </ThingBox>
  );
}
