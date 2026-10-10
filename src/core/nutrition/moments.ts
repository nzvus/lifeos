/**
 * core/nutrition/moments.ts — the moments of the day an entry belongs to
 * (ADR-0011). A closed list, like locales and themes: labels live in i18n/,
 * icons in ui/. A meal may carry one as its category (a hint); a log entry
 * stores its own (what happened).
 */
import { timeIn } from "../shared/dates";
import { Big } from "../shared/decimal";
/**
 * ADR-0044 added the last three: a slot or the user picks them, a time
 * never derives them (momentAt returns only the first four). Keep in step
 * with the CHECKs on meals.category and log_entries.moment.
 */
export const MOMENTS = [
  "breakfast",
  "lunch",
  "snack",
  "dinner",
  "pre_workout",
  "post_workout",
  "pre_sleep",
] as const;
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

/**
 * When in the day a snack falls, for its group's name (2026-10-09: "snacks
 * should show before or after the other meals, by their time").
 */
export const SNACK_PARTS = ["night", "morning", "afternoon", "evening"] as const;
export type SnackPart = (typeof SNACK_PARTS)[number];

/**
 * A snack's part of the day: after which main meal it comes (breakfast →
 * morning, lunch → afternoon, dinner → evening); with none before it, by
 * its time.
 */
export function snackPart(minutes: number, after: Moment | null = null): SnackPart {
  if (after === "breakfast") return "morning";
  if (after === "lunch") return "afternoon";
  if (after === "dinner") return "evening";
  if (minutes < NIGHT_END) return "night";
  if (minutes < 12 * 60) return "morning";
  if (minutes < 18 * 60) return "afternoon";
  return "evening";
}

/**
 * Where an entry without a time sits in the day: a main meal at its usual
 * hour; a snack between lunch and dinner (as before 2026-10-09).
 */
const ANCHOR: Record<Moment, number> = {
  breakfast: 8 * 60,
  lunch: 13 * 60,
  snack: 16 * 60 + 30,
  dinner: 20 * 60,
  pre_workout: 17 * 60,
  post_workout: 19 * 60,
  pre_sleep: 23 * 60,
};

/**
 * A day's entries grouped by moment, in TIME order; "not set" last.
 * Breakfast, lunch and dinner are one group each, placed at their first
 * entry's time. Snacks are placed by their own time, so a 10:30 snack comes
 * before lunch and a 23:30 one after dinner: snacks next to each other (no
 * main meal between them) form one group, named by its part of the day.
 */
export type MomentGroup<E> = {
  /** Unique within the day: the moment, or "snack-<n>", or "none". */
  key: string;
  moment: Moment | null;
  /** Snacks only: when in the day the group falls. */
  part: SnackPart | null;
  /** Where the group sits in the day, minutes after midnight; null for "not set". */
  minutes: number | null;
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
  type Placed = { e: E; moment: Moment | null; minutes: number | null };
  const placed: Placed[] = entries.map((e) => {
    const local = e.at ? timeIn(new Date(e.at), timeZone) : null;
    return {
      e,
      moment: entryMoment(e.moment, local, bounds),
      minutes: local ? minutesOf(local) : null,
    };
  });
  const when = (p: Placed) => p.minutes ?? ANCHOR[p.moment!];

  // Main meals, and the moments around training and sleep (ADR-0044): one
  // block each, at the earliest time among its entries.
  type Block = { minutes: number; moment: Moment; items: Placed[] };
  const blocks: Block[] = [];
  for (const m of MOMENTS.filter((x) => x !== "snack")) {
    const items = placed.filter((p) => p.moment === m);
    if (items.length)
      blocks.push({ minutes: Math.min(...items.map(when)), moment: m, items });
  }
  // Snacks: each one its own block at its own time.
  for (const p of placed.filter((x) => x.moment === "snack"))
    blocks.push({ minutes: when(p), moment: "snack", items: [p] });
  // Stable sort: equal times keep breakfast/lunch/dinner before snacks.
  blocks.sort((a, b) => a.minutes - b.minutes);

  const groups: MomentGroup<E>[] = [];
  const sum = (list: E[]) =>
    list
      .filter((e) => e.status === "eaten")
      .reduce((total, e) => total.plus(e.totals.nutrients.kcal), new Big(0))
      .toString();
  let snacks = 0;
  let lastMeal: Moment | null = null;
  for (const b of blocks) {
    if (b.moment !== "snack") lastMeal = b.moment;
    const last = groups[groups.length - 1];
    if (b.moment === "snack" && last?.moment === "snack") {
      last.entries.push(...b.items.map((p) => p.e));
      continue;
    }
    groups.push({
      key: b.moment === "snack" ? `snack-${snacks++}` : b.moment,
      moment: b.moment,
      part: b.moment === "snack" ? snackPart(b.minutes, lastMeal) : null,
      minutes: b.minutes,
      entries: b.items.map((p) => p.e),
      eatenKcal: "0",
    });
  }
  const none = placed.filter((p) => p.moment === null).map((p) => p.e);
  if (none.length)
    groups.push({
      key: "none",
      moment: null,
      part: null,
      minutes: null,
      entries: none,
      eatenKcal: "0",
    });
  return groups.map((g) => ({ ...g, eatenKcal: sum(g.entries) }));
}
