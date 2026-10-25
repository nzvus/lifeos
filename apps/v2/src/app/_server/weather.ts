/**
 * app/_server/weather.ts — a day's weather and air for Oggi's chips (E11):
 * Open-Meteo, no key, fetched by the server and kept by Next for an hour
 * (the same request on another page reads the cache), nothing stored in
 * the database. Only days Open-Meteo answers for (92 days back, 15 ahead);
 * a slow or failed answer gives no chips, never a broken page.
 */
import "server-only";
import { addDays, daysBetween, type IsoDate } from "@/core/engines/time";
import {
  AIR,
  HOURLY,
  airUrl,
  dayChips,
  mergeHours,
  readHourly,
  weatherUrl,
  type DayChips,
} from "@/core/engines/environment";
import type { Place } from "@/core/account/place";

async function get(url: string): Promise<unknown> {
  const r = await fetch(url, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(2500),
  });
  if (!r.ok) throw new Error("open-meteo " + r.status);
  return r.json();
}

export async function weatherChips(
  place: Place,
  day: IsoDate,
  today: IsoDate,
  timeZone: string,
): Promise<DayChips | null> {
  const back = daysBetween(day, today);
  if (back > 90 || back < -14) return null;
  const p = { latitude: place.latitude, longitude: place.longitude, timeZone };
  try {
    const [w, a] = await Promise.all([
      get(weatherUrl(p, addDays(day, -1), day)),
      get(airUrl(p, day, day)).catch(() => ({})),
    ]);
    const daily = (
      w as { daily?: { time?: string[]; sunrise?: string[]; sunset?: string[] } }
    ).daily;
    const i = daily?.time?.indexOf(day) ?? -1;
    const sun =
      i >= 0 && daily?.sunrise?.[i] && daily?.sunset?.[i]
        ? { sunrise: daily.sunrise[i]!, sunset: daily.sunset[i]! }
        : undefined;
    return dayChips(
      day,
      mergeHours(readHourly(w as never, HOURLY), readHourly(a as never, AIR)),
      sun,
    );
  } catch {
    return null;
  }
}
