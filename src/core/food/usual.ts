/**
 * core/food/usual.ts — «A quest'ora, di solito» (the board Capture): what
 * the person logs around this time of day, to log again in one tap. The
 * done meals of the last weeks, each by what it is (its saved meal, else
 * its foods by name), counted by the days they came within ±90 minutes of
 * now; seen on at least two days; the most frequent first, then the latest.
 * `readUsualMeals` reads narrow columns only (Neon bills the bytes).
 */
import { and, eq, gte, inArray, isNotNull, isNull, lte } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, entries, entryLines } from "../db/schema";
import { clockMin } from "../engines/planning";
import type { DayClock, IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { dayMinute } from "../day/timeline";

export type UsualMeal = {
  id: string;
  day: IsoDate;
  /** The local clock minute it was eaten at. */
  minute: number;
  /** Its saved meal's name, when it is of one. */
  recipe: string | null;
  foods: string[];
};

export async function readUsualMeals(
  db: Db,
  owner: Owner,
  from: IsoDate,
  to: IsoDate,
  clock: DayClock,
): Promise<UsualMeal[]> {
  const meals = await db
    .select({
      id: entries.id,
      day: entries.day,
      startAt: entries.startAt,
      recipe: catalogItems.name,
    })
    .from(entries)
    .leftJoin(catalogItems, eq(catalogItems.id, entries.itemId))
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, "meal"),
        eq(entries.status, "done"),
        isNull(entries.deletedAt),
        isNotNull(entries.startAt),
        gte(entries.day, from),
        lte(entries.day, to),
      ),
    );
  if (meals.length === 0) return [];
  const lines = await db
    .select({
      entryId: entryLines.entryId,
      position: entryLines.position,
      name: entryLines.name,
    })
    .from(entryLines)
    .where(
      and(
        ownedBy(entryLines, owner),
        inArray(
          entryLines.entryId,
          meals.map((m) => m.id),
        ),
      ),
    );
  const names = new Map<string, { position: number; name: string }[]>();
  for (const l of lines) names.set(l.entryId, [...(names.get(l.entryId) ?? []), l]);
  return meals.map((m) => ({
    id: m.id,
    day: m.day,
    minute: clockMin(dayMinute(m.startAt!, m.day, clock)),
    recipe: m.recipe ?? null,
    foods: (names.get(m.id) ?? [])
      .sort((a, b) => a.position - b.position)
      .map((l) => l.name),
  }));
}

const WINDOW_MIN = 90;

/** Pure: the usual meals around `nowMinute`, up to `limit`. */
export function usualAt(
  meals: readonly UsualMeal[],
  nowMinute: number,
  limit = 3,
): { label: string; days: number; lastId: string; lastDay: IsoDate }[] {
  const near = (m: number) => {
    const d = Math.abs(m - nowMinute);
    return Math.min(d, 1440 - d) <= WINDOW_MIN;
  };
  const by = new Map<string, { label: string; days: Set<string>; last: UsualMeal }>();
  for (const m of meals) {
    if (!near(m.minute) || (m.recipe === null && m.foods.length === 0)) continue;
    const key = m.recipe ?? [...m.foods].sort().join("|");
    const label =
      m.recipe ??
      m.foods.slice(0, 2).join(", ") +
        (m.foods.length > 2 ? " e altri " + (m.foods.length - 2) : "");
    const g = by.get(key) ?? { label, days: new Set<string>(), last: m };
    g.days.add(m.day);
    if (m.day > g.last.day || (m.day === g.last.day && m.minute > g.last.minute))
      g.last = m;
    by.set(key, g);
  }
  return [...by.values()]
    .filter((g) => g.days.size >= 2)
    .sort((a, b) => b.days.size - a.days.size || b.last.day.localeCompare(a.last.day))
    .slice(0, limit)
    .map((g) => ({
      label: g.label,
      days: g.days.size,
      lastId: g.last.id,
      lastDay: g.last.day,
    }));
}
