/**
 * The Elenco's things as the one `PlanBox` (Deliver ③, §132): each type gives only its data, by
 * slot key; `planSlots` orders and shapes it, the kit draws it (PAT-30, VIS-102). Replaces the
 * per-type `FoodBox` and `ExerciseBox` (undo: them, in git before §132).
 */
import {
  F,
  PlanBox,
  type BoxEntry,
  type NutrientsData,
  type PlanAction,
} from "@lifeos/kit";
import { planSlots } from "@/features/box/slots";
import { food as foodWords } from "@/i18n/food";
import { training } from "@/i18n/training";
import { pickProduct, type LibraryRow, type Product } from "./library";

type Shown = { data: NutrientsData; nova?: number };
const foodSlots = (x: Shown) =>
  planSlots("food", {
    nutrients: { nutrients: x.data, value: F.num(100, "g") },
    ...(x.nova ? { nova: { word: String(x.nova) } } : {}),
  });

/**
 * A cibo: its nutrients and NOVA; with marche, each a variant with its own number, voto and slots,
 * the one picked by `pickProduct` on at first (his 20 Nov, §130).
 */
export function FoodPlanBox({
  r,
  entry,
  value,
  actions,
}: {
  actions: PlanAction[];
  r: LibraryRow & { food: Shown };
  entry: BoxEntry;
  /** The head's number for a set of values per 100 (the list's sort). */
  value: (values: Record<string, number>) => string;
}) {
  const ps = r.products ?? [];
  const variant = (p: Product) => {
    const shown = p.box ?? { ...r.food, ...(r.score ? { score: r.score } : {}) };
    return {
      key: p.key,
      label: p.name,
      ...(p.perKg !== null ? { meta: F.num(p.perKg, "€") + "/kg" } : {}),
      head: {
        value: value(p.values),
        ...(shown.score ? { score: shown.score } : {}),
      },
      slots: foodSlots(shown),
    };
  };
  const picked = pickProduct(ps)?.key;
  return (
    <PlanBox
      density="row"
      entry={{ ...entry, value: value(r.values) }}
      actions={actions}
      slots={foodSlots(r.food)}
      {...(ps.length > 0
        ? {
            variants: ps.map(variant),
            variantsLabel: foodWords.brands.title,
            ...(picked ? { picked } : {}),
          }
        : {})}
    />
  );
}

/** An esercizio: its facts as names (ATT-44), its e1RM as a trend (ATT-43). Never done: facts. */
export function ExercisePlanBox({
  r,
  entry,
  actions,
}: {
  r: LibraryRow & { exercise: NonNullable<LibraryRow["exercise"]> };
  entry: BoxEntry;
  actions: PlanAction[];
}) {
  const { trend, facts } = r.exercise;
  const ys = trend.map((t) => t.v);
  const last = ys.at(-1);
  return (
    <PlanBox
      density="row"
      entry={entry}
      actions={actions}
      slots={planSlots("exercise", {
        ...(last !== undefined
          ? {
              e1rm: {
                value: F.num(last, "kg"),
                caption: training.exercise.e1rmTrend(ys.length),
                trend: {
                  x: trend.map((t, i) =>
                    i === 0 || i === trend.length - 1 ? F.day(t.d) : "",
                  ),
                  y: ys,
                  unit: "kg",
                  lo: Math.min(...ys),
                  hi: Math.max(...ys),
                  decimals: 1,
                },
              },
            }
          : {}),
        facts: { words: facts },
      })}
    />
  );
}
