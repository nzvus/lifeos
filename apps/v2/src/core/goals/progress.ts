/**
 * core/goals/progress.ts — a goal's progress (concepts.md §7: progress,
 * pace needed vs actual, ETA, on track). Pure.
 * - Weight to reach: now = the mean of the last 7 days' weighings (one
 *   reading swings by a kilo); start = the mean of the first 7 days from
 *   the goal's start; the actual pace is the least-squares slope of the last
 *   28 days' weighings, in kg a week; the pace needed reaches the target by
 *   its date.
 * - A per-day count at least (steps): this week's days on target, of the
 *   days counted so far (weekdays only when the goal says so).
 */
import { addDays, daysBetween, type IsoDate } from "../engines/time";
import { slope } from "../engines/training/stats";

export type Weighing = { day: IsoDate; kg: number };

export type WeightProgress = {
  start: number | null;
  now: number;
  target: number;
  /** 0–1 of the way from start to target; null without a start. */
  done: number | null;
  /** kg a week, negative when losing. */
  pace: number | null;
  needed: number | null;
  eta: IsoDate | null;
  onTrack: boolean | null;
};

const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function weightProgress(
  ws: readonly Weighing[],
  goal: { value: number; since: IsoDate; by: IsoDate | null },
  today: IsoDate,
): WeightProgress | null {
  const last = ws.filter((w) => w.day > addDays(today, -7) && w.day <= today);
  if (last.length === 0) return null;
  const now = mean(last.map((w) => w.kg));
  const first = ws.filter((w) => w.day >= goal.since && w.day < addDays(goal.since, 7));
  const start = first.length > 0 ? mean(first.map((w) => w.kg)) : null;
  const target = goal.value;
  const done =
    start === null || start === target
      ? null
      : Math.max(0, Math.min(1, (start - now) / (start - target)));
  const recent = ws
    .filter((w) => w.day > addDays(today, -28) && w.day <= today)
    .map((w) => ({ x: daysBetween(today, w.day), y: w.kg }));
  const perDay = recent.length >= 4 ? slope(recent) : null;
  const pace = perDay === null ? null : perDay * 7;
  const left = target - now;
  const weeksLeft = goal.by ? daysBetween(today, goal.by) / 7 : null;
  const needed = weeksLeft !== null && weeksLeft > 0 ? left / weeksLeft : null;
  const towards = pace !== null && pace !== 0 && Math.sign(pace) === Math.sign(left);
  const eta = towards ? addDays(today, Math.ceil((left / pace!) * 7)) : null;
  const onTrack =
    Math.abs(left) < 0.3
      ? true
      : needed === null || pace === null
        ? null
        : Math.sign(pace) === Math.sign(needed) &&
          Math.abs(pace) >= Math.abs(needed) * 0.8;
  return { start, now, target, done, pace, needed, eta, onTrack };
}

export type DailyCount = { day: IsoDate; n: number };

/** This week's days at or over `value`, of the days counted so far (Monday to today). */
export function weekDaysOnTarget(
  counts: readonly DailyCount[],
  value: number,
  today: IsoDate,
  weekdaysOnly: boolean,
): { hit: number; of: number; mean: number | null } {
  const t = new Date(today + "T00:00:00Z").getUTCDay();
  const monday = addDays(today, -((t + 6) % 7));
  const days: IsoDate[] = [];
  for (let d = monday; d <= today; d = addDays(d, 1)) {
    const wd = new Date(d + "T00:00:00Z").getUTCDay();
    if (!weekdaysOnly || (wd >= 1 && wd <= 5)) days.push(d);
  }
  const by = new Map<IsoDate, number>();
  for (const c of counts) by.set(c.day, (by.get(c.day) ?? 0) + c.n);
  const logged = days.filter((d) => by.has(d));
  return {
    hit: days.filter((d) => (by.get(d) ?? 0) >= value).length,
    of: days.length,
    mean: logged.length === 0 ? null : mean(logged.map((d) => by.get(d)!)),
  };
}
