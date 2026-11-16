/**
 * What an open meal box holds, wherever the meal is met (PAT-30, target.md B1–B2): the day's
 * voce, a saved pasto's page and its row in the Elenco draw the same doors from here, through
 * `MealBox`. Pure: no state, so a server page may call it too.
 */
import type { ReactNode } from "react";
import type { BoxDoor } from "./Box";
import { Nutrients } from "./Nutrients";
import type { NutrientsData } from "./nutrient-rows";

/** The numbers as tiles, the lines, and where it comes from in words. */
/** The doors' words, from the caller's catalogue (PAT-81): the kit knows no type. */
export type DoorWords = {
  nutrients: string;
  foods: string;
  cost: string;
  details: string;
};

export type BoxDetails = {
  stats: { label: string; value: string }[];
  lines: { label: string; value: string }[];
  foot: string;
};

/**
 * A meal's doors: every nutrient (its foods as chips that light their share, VIS-50), the
 * foods with their amounts, then the cost or the rest. A voce without nutrients has none.
 */
export function mealDoors(
  l0: NutrientsData | null | undefined,
  d: BoxDetails | null | undefined,
  /** The «Cibi» panel when the place has more to say than amounts (a pasto: each a row that opens its cibo). */
  foods: ReactNode | undefined,
  w: DoorWords,
) {
  if (!l0) return [];
  const doors: BoxDoor[] = [
    { key: "nutrients", label: w.nutrients, panel: <Nutrients data={l0} /> },
  ];
  if (d && d.lines.length > 0)
    doors.push({
      key: "foods",
      label: w.foods,
      value: String(l0.foods?.length || d.lines.length),
      panel: foods ?? <EntryDetails d={{ stats: [], lines: d.lines, foot: "" }} />,
    });
  const cost = d?.stats.find((s) => s.label === w.cost);
  // The cost is said on its chip, not again behind it.
  const rest = d
    ? { stats: d.stats.filter((s) => s !== cost), lines: [], foot: d.foot }
    : null;
  const more = rest && (rest.stats.length > 0 || rest.foot !== "");
  if (cost || more)
    doors.push({
      key: "more",
      label: cost ? w.cost : w.details,
      ...(cost ? { value: cost.value } : {}),
      ...(more ? { panel: <EntryDetails d={rest} /> } : {}),
    });
  return doors;
}

/** The open box's details: the numbers as tiles, then the lines, then where it comes from. */
export function EntryDetails({ d }: { d: BoxDetails }) {
  return (
    <div className="k-stack g2 k-details">
      {d.stats.length > 0 && (
        <div className="k-stats">
          {d.stats.map((s) => (
            <span key={s.label} className="k-stat">
              <span className="k-help">{s.label}</span>
              <span className="v">{s.value}</span>
            </span>
          ))}
        </div>
      )}
      {d.lines.map((l, k) => (
        <div key={k} className="k-line between">
          <span className="k-body">{l.label}</span>
          <span className="k-num k-right">{l.value}</span>
        </div>
      ))}
      {d.foot && <span className="k-help">{d.foot}</span>}
    </div>
  );
}
