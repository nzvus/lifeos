/**
 * core/nutrition/preferences.ts — the user's preferences (migration 0006):
 * whether recommended maxima fill in missing targets, where lunch, snack and
 * dinner start (ADR-0011), and the views the Targets page and the food
 * lists open with. Stored per user in user_settings; defaults equal the
 * app's behaviour before they existed.
 *
 * Reading is forgiving (an unknown stored value falls back to the default);
 * writing is validated (validation.ts preferencesInput).
 */
import { PER, SORTS, type Per, type SortKey } from "./metrics";
import { DEFAULT_BOUNDS, type MomentBounds } from "./moments";

export const TREND_RANGES = [7, 30, 90] as const;
export type TrendRange = (typeof TREND_RANGES)[number];

export type Preferences = {
  autoTargets: boolean;
  bounds: MomentBounds;
  trendsRange: TrendRange;
  listSort: SortKey;
  listPer: Per;
};

export const DEFAULT_PREFERENCES: Preferences = {
  autoTargets: true,
  bounds: DEFAULT_BOUNDS,
  trendsRange: 7,
  listSort: "used",
  listPer: "none",
};

/** From the stored columns, with a default for anything unknown. */
export function preferencesOf(row: {
  autoTargets: boolean;
  lunchFrom: number;
  snackFrom: number;
  dinnerFrom: number;
  trendsRange: number;
  listSort: string;
  listPer: string;
}): Preferences {
  const d = DEFAULT_PREFERENCES;
  return {
    autoTargets: row.autoTargets,
    bounds: { lunch: row.lunchFrom, snack: row.snackFrom, dinner: row.dinnerFrom },
    trendsRange: (TREND_RANGES as readonly number[]).includes(row.trendsRange)
      ? (row.trendsRange as TrendRange)
      : d.trendsRange,
    listSort: (SORTS as readonly string[]).includes(row.listSort)
      ? (row.listSort as SortKey)
      : d.listSort,
    listPer: (PER as readonly string[]).includes(row.listPer)
      ? (row.listPer as Per)
      : d.listPer,
  };
}

/** Minutes after midnight -> "HH:MM". */
export const clockOf = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** The preferences as form field values (checkbox "on" or ""). */
export function preferencesFormValues(p: Preferences): Record<string, string> {
  return {
    autoTargets: p.autoTargets ? "on" : "",
    lunchFrom: clockOf(p.bounds.lunch),
    snackFrom: clockOf(p.bounds.snack),
    dinnerFrom: clockOf(p.bounds.dinner),
    trendsRange: String(p.trendsRange),
    listSort: p.listSort,
    listPer: p.listPer,
  };
}
