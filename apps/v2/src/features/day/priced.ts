/**
 * features/day/priced.ts — a day's energy piece by piece (dossiers/energy-day.md
 * §5), for every page that draws the day's rows: Oggi and the visual study.
 * 15 days of rows for the median hours on feet; yesterday's sessions for
 * their tails; nothing without a profile or a known weight.
 */
import type { Db } from "@/core/db/db";
import type { Owner } from "@/core/identity/owner";
import { priceDay, readEnergyRows, type EnergyRows, type PricedDay } from "@/core/energy";
import { addDays, type IsoDate } from "@/core/engines/time";

export async function readPricedDay(
  db: Db,
  owner: Owner,
  date: IsoDate,
  today: IsoDate,
  kgNow: number | null,
): Promise<{ rows: EnergyRows; priced: PricedDay } | null> {
  if (date > today || kgNow === null) return null;
  const rows = await readEnergyRows(db, owner, addDays(date, -15), date);
  const p = rows.profile;
  if (!p) return null;
  const body = {
    sex: p.sex,
    kg: kgNow,
    heightCm: p.heightCm,
    age: Number(date.slice(0, 4)) - p.birthYear,
  };
  const meals = rows.meals.filter((m) => m.day === date);
  const yesterday = priceDay(rows, addDays(date, -1), {
    body,
    yesterdayTails: [],
    eatenKcal: null,
  });
  const priced = priceDay(rows, date, {
    body,
    yesterdayTails: yesterday.sessions.map((x) => x.tail),
    eatenKcal: meals.length ? meals.reduce((a, m) => a + m.kcal, 0) : null,
  });
  return { rows, priced };
}
