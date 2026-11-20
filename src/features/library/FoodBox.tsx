"use client";
/**
 * A cibo's box in the Elenco (PAT-30 level 1, Deliver ③): its plan's doors, and when it has marche
 * a sideways row of them where one is always picked — the most used, else the best voto, else the
 * first made — and the head, the voto and the doors are that marca's (his 20 Nov, §130).
 */
import { useState } from "react";
import {
  ChipRow,
  F,
  Nutrients,
  ThingBox,
  type BoxEntry,
  type NutrientsData,
} from "@lifeos/kit";
import { planDoors } from "@/features/box-doors";
import { common } from "@/i18n/common";
import { food as words } from "@/i18n/food";
import { objects } from "@/i18n/objects";
import { pickProduct, type LibraryRow } from "./library";

export function FoodBox({
  r,
  entry,
  value,
}: {
  r: LibraryRow & { food: { data: NutrientsData; nova?: number } };
  entry: BoxEntry;
  /** The head's number for a set of values per 100 (the list's sort). */
  value: (values: Record<string, number>) => string;
}) {
  const ps = r.products ?? [];
  const [key, setKey] = useState(() => pickProduct(ps)?.key);
  const p = ps.find((x) => x.key === key);
  const shown = p?.box ?? { ...r.food, ...(r.score ? { score: r.score } : {}) };
  return (
    <ThingBox
      density="row"
      entry={{
        ...entry,
        value: value(p?.values ?? r.values),
        ...(shown.score ? { score: shown.score } : {}),
      }}
      doors={planDoors("food", {
        nutrients: {
          label: common.doors.nutrients,
          value: F.num(100, "g"),
          panel: <Nutrients data={shown.data} />,
        },
        ...(shown.nova
          ? {
              nova: {
                label: objects.fields.food?.["nova"] ?? "NOVA",
                value: String(shown.nova),
              },
            }
          : {}),
      })}
    >
      {ps.length > 0 && (
        <ChipRow
          label={words.brands.title}
          {...(key ? { selected: key } : {})}
          onPick={setKey}
          items={ps.map((x) => ({
            key: x.key,
            label: x.name,
            ...(x.perKg !== null ? { value: F.num(x.perKg, "€") + "/kg" } : {}),
          }))}
        />
      )}
    </ThingBox>
  );
}
