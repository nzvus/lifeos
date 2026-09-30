/**
 * core/nutrition/moments.ts — the moments of the day an entry belongs to
 * (ADR-0011). A closed list, like locales and themes: labels live in i18n/,
 * icons in ui/. A meal may carry one as its category (a hint); a log entry
 * stores its own (what happened).
 */
import { timeIn } from "../shared/dates";
import { Big } from "../shared/decimal";
export const MOMENTS = ["breakfast", "lunch", "snack", "dinner"] as const;
export type Moment = (typeof MOMENTS)[number];

export function isMoment(s: string): s is Moment {
  return (MOMENTS as readonly string[]).includes(s);
}

/**
 * Where each moment starts, in minutes after midnight (ADR-0011): before
 * 05:00 counts as a late snack, then breakfast until 11:00, lunch until
 * 15:00, snack until 18:30, dinner after. A user setting may change them.
 */
export type MomentBounds = { lunch: number; snack: number; dinner: number };
export const DEFAULT_BOUNDS: MomentBounds = {
  lunch: 11 * 60,
  snack: 15 * 60,
  dinner: 18 * 60 + 30,
};
const NIGHT_END = 5 * 60;

/** The moment a time of day falls in. */
export function momentAt(minutes: number, bounds: MomentBounds = DEFAULT_BOUNDS): Moment {
  if (minutes < NIGHT_END) return "snack";
  if (minutes < bounds.lunch) return "breakfast";
  if (minutes < bounds.snack) return "lunch";
  if (minutes < bounds.dinner) return "snack";
  return "dinner";
}

/** "HH:MM" -> minutes after midnight. */
export const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
};

/**
 * The moment to prefill when adding an entry: the meal's category if it
 * has one, else from the time given, else from the current time.
 */
export function suggestMoment(
  category: Moment | null,
  time: string | null,
  nowMinutes: number,
  bounds: MomentBounds = DEFAULT_BOUNDS,
): Moment {
  if (category) return category;
  return momentAt(time ? minutesOf(time) : nowMinutes, bounds);
}

/**
 * An entry's moment for display and analysis: the stored one, else derived
 * from its time (entries from before ADR-0011), else null ("not set").
 * `localTime` is the entry's time in the user's zone, "HH:MM", or null.
 */
export function entryMoment(
  stored: Moment | null,
  localTime: string | null,
  bounds: MomentBounds = DEFAULT_BOUNDS,
): Moment | null {
  if (stored) return stored;
  return localTime ? momentAt(minutesOf(localTime), bounds) : null;
}

/** A day's entries grouped by moment, in day order; "not set" last. */
export type MomentGroup<E> = {
  moment: Moment | null;
  entries: E[];
  /** kcal of the EATEN entries of the group (ADR-0009), exact. */
  eatenKcal: string;
};

export function groupByMoment<
  E extends {
    moment: Moment | null;
    at: string | null;
    status: "planned" | "eaten";
    totals: { nutrients: { kcal: string } };
  },
>(
  entries: readonly E[],
  timeZone: string,
  bounds: MomentBounds = DEFAULT_BOUNDS,
): MomentGroup<E>[] {
  const byMoment = new Map<Moment | null, E[]>();
  for (const e of entries) {
    const m = entryMoment(
      e.moment,
      e.at ? timeIn(new Date(e.at), timeZone) : null,
      bounds,
    );
    byMoment.set(m, [...(byMoment.get(m) ?? []), e]);
  }
  return [...MOMENTS, null]
    .filter((m) => byMoment.has(m))
    .map((moment) => {
      const list = byMoment.get(moment)!;
      return {
        moment,
        entries: list,
        eatenKcal: list
          .filter((e) => e.status === "eaten")
          .reduce((sum, e) => sum.plus(e.totals.nutrients.kcal), new Big(0))
          .toString(),
      };
    });
}
