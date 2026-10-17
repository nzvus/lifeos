/**
 * E11 Environment (engines.md E11): hourly weather and air quality from
 * Open-Meteo for the day's place, stored as imported entries with their
 * source. Pure: the request's URL and the reading of its answer. The fetch
 * belongs to the server (core never does I/O).
 * Context for hydration (E10), sleep (night temperature), mood (daylight),
 * outdoor training and the correlations (E8).
 */
import type { IsoDate } from "../time/date";

export const HOURLY = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "precipitation",
  "uv_index",
] as const;
export const AIR = ["pm2_5", "pm10", "european_aqi"] as const;

export type Place = { latitude: number; longitude: number; timeZone: string };

/** The forecast request for a range of days (times come back local to `timeZone`). */
export function weatherUrl(p: Place, from: IsoDate, to: IsoDate): string {
  const q = new URLSearchParams({
    latitude: p.latitude.toFixed(3),
    longitude: p.longitude.toFixed(3),
    hourly: HOURLY.join(","),
    daily: "sunrise,sunset",
    timezone: p.timeZone,
    start_date: from,
    end_date: to,
  });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}

export function airUrl(p: Place, from: IsoDate, to: IsoDate): string {
  const q = new URLSearchParams({
    latitude: p.latitude.toFixed(3),
    longitude: p.longitude.toFixed(3),
    hourly: AIR.join(","),
    timezone: p.timeZone,
    start_date: from,
    end_date: to,
  });
  return `https://air-quality-api.open-meteo.com/v1/air-quality?${q}`;
}

/** One imported hour: local date and hour, the values that came, and where from. */
export type WeatherHour = {
  day: IsoDate;
  hour: number;
  values: Record<string, number>;
  source: "open-meteo";
};

type HourlyAnswer = { hourly?: { time?: string[] } & Record<string, unknown> };

/**
 * Reads an answer's hourly block into hours. Missing or null values are left out (never zero);
 * an answer without hours gives none.
 */
export function readHourly(
  answer: HourlyAnswer,
  fields: readonly string[],
): WeatherHour[] {
  const time = answer.hourly?.time ?? [];
  return time.flatMap((t, i) => {
    const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):\d{2}$/.exec(t);
    if (!m) return [];
    const values: Record<string, number> = {};
    for (const f of fields) {
      const col = answer.hourly?.[f];
      const v = Array.isArray(col) ? col[i] : undefined;
      if (typeof v === "number" && Number.isFinite(v)) values[f] = v;
    }
    return [{ day: m[1]!, hour: Number(m[2]), values, source: "open-meteo" as const }];
  });
}

/** Merges weather and air hours by day and hour. */
export function mergeHours(
  a: readonly WeatherHour[],
  b: readonly WeatherHour[],
): WeatherHour[] {
  const out = new Map<string, WeatherHour>();
  for (const h of [...a, ...b]) {
    const k = `${h.day}T${h.hour}`;
    const prev = out.get(k);
    out.set(
      k,
      prev
        ? { ...prev, values: { ...prev.values, ...h.values } }
        : { ...h, values: { ...h.values } },
    );
  }
  return [...out.values()].sort((x, y) =>
    x.day + String(x.hour).padStart(2, "0") < y.day + String(y.hour).padStart(2, "0")
      ? -1
      : 1,
  );
}

export type DayWeather = {
  day: IsoDate;
  /** The day's highest apparent temperature, °C (E10's heat margin). */
  maxApparent: number | null;
  /** Mean temperature from 22:00 to 06:00 of the night that ends this day, °C (sleep). */
  night: number | null;
  /** Hours from sunrise to sunset (mood). */
  daylightH: number | null;
};

const mean = (xs: number[]) =>
  xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : null;

/** A day's summary from its hours (and the evening before, for the night) and its sunrise/sunset. */
export function dayWeather(
  day: IsoDate,
  hours: readonly WeatherHour[],
  sun?: { sunrise: string; sunset: string } | undefined,
): DayWeather {
  const today = hours.filter((h) => h.day === day);
  const apparent = today.flatMap((h) =>
    h.values["apparent_temperature"] === undefined
      ? []
      : [h.values["apparent_temperature"]!],
  );
  const prev = hours.filter((h) => h.day < day).at(-1)?.day;
  const nightHours = hours.filter(
    (h) => (h.day === prev && h.hour >= 22) || (h.day === day && h.hour < 6),
  );
  const night = nightHours.flatMap((h) =>
    h.values["temperature_2m"] === undefined ? [] : [h.values["temperature_2m"]!],
  );
  const minutesOf = (t: string) => {
    const m = /T(\d{2}):(\d{2})$/.exec(t);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const rise = sun ? minutesOf(sun.sunrise) : null;
  const set = sun ? minutesOf(sun.sunset) : null;
  return {
    day,
    maxApparent: apparent.length ? Math.max(...apparent) : null,
    night: mean(night),
    daylightH: rise !== null && set !== null && set > rise ? (set - rise) / 60 : null,
  };
}
