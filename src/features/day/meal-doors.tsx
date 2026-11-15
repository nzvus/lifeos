/**
 * What an open meal box holds, wherever the meal is met (PAT-30, target.md B1): the day's voce
 * (`EntryRow`) and a saved pasto's page draw the same doors from here.
 */
import type { ReactNode } from "react";
import { Nutrients, type BoxDoor, type NutrientsData } from "@lifeos/kit";
import { common } from "@/i18n/common";
import type { Details } from "./details";

/**
 * A meal's doors: every nutrient (its foods as chips that light their share, VIS-50), the
 * foods with their amounts, then the cost or the rest. A voce without nutrients has none.
 */
export function mealDoors(
  l0: NutrientsData | null | undefined,
  d: Details | null | undefined,
  /** The «Cibi» panel when the place has more to say than amounts (a pasto: each a row that opens its cibo). */
  foods?: ReactNode,
) {
  if (!l0) return [];
  const doors: BoxDoor[] = [
    { key: "nutrients", label: common.doors.nutrients, panel: <Nutrients data={l0} /> },
  ];
  if (d && d.lines.length > 0)
    doors.push({
      key: "foods",
      label: common.doors.foods,
      value: String(l0.foods?.length || d.lines.length),
      panel: foods ?? <EntryDetails d={{ stats: [], lines: d.lines, foot: "" }} />,
    });
  const cost = d?.stats.find((s) => s.label === common.doors.cost);
  // The cost is said on its chip, not again behind it.
  const rest = d
    ? { stats: d.stats.filter((s) => s !== cost), lines: [], foot: d.foot }
    : null;
  const more = rest && (rest.stats.length > 0 || rest.foot !== "");
  if (cost || more)
    doors.push({
      key: "more",
      label: cost ? common.doors.cost : common.doors.details,
      ...(cost ? { value: cost.value } : {}),
      ...(more ? { panel: <EntryDetails d={rest} /> } : {}),
    });
  return doors;
}

/** The open box's details: the numbers as tiles, then the lines, then where it comes from. */
export function EntryDetails({ d }: { d: Details }) {
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
