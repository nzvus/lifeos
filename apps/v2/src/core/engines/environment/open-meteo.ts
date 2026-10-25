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
  "weather_code",
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

/** The geocoding request for a city's name (Open-Meteo, Italian names first). */
export function geocodeUrl(name: string): string {
  const q = new URLSearchParams({ name: name.trim(), count: "1", language: "it" });
  return `https://geocoding-api.open-meteo.com/v1/search?${q}`;
}

/** The first place an answer names, or null. */
export function readGeocode(answer: unknown): {
  name: string;
  latitude: number;
  longitude: number;
} | null {
  const r = (answer as { results?: unknown[] })?.results?.[0] as
    { name?: unknown; latitude?: unknown; longitude?: unknown } | undefined;
  if (
    !r ||
    typeof r.name !== "string" ||
    typeof r.latitude !== "number" ||
    typeof r.longitude !== "number"
  )
    return null;
  return { name: r.name, latitude: r.latitude, longitude: r.longitude };
}

/** The air's words for the European AQI (EEA bands): buona … pessima. */
export function airWords(aqi: number): string {
  return aqi <= 20
    ? "aria buona"
    : aqi <= 40
      ? "aria discreta"
      : aqi <= 60
        ? "aria moderata"
        : aqi <= 80
          ? "aria scarsa"
          : aqi <= 100
            ? "aria molto scarsa"
            : "aria pessima";
}

export type DayChips = {
  /** Each hour's temperature, by hour (null where none came). */
  hours: (number | null)[];
  /** The sky at the hour asked (now, or midday for another day): a WMO code. */
  code: number | null;
  /** The temperature at that hour. */
  nowC: number | null;
  /** Sunrise and sunset, minutes of the day. */
  rise: number | null;
  set: number | null;
  maxC: number | null;
  minC: number | null;
  /** Mean relative humidity from 08:00 to 20:00, %. */
  humidity: number | null;
  /** The day's worst European AQI. */
  aqi: number | null;
  daylightH: number | null;
};

/** What Oggi's chips say about a day, from its hours and sunrise/sunset. */
export function dayChips(
  day: IsoDate,
  hours: readonly WeatherHour[],
  sun?: { sunrise: string; sunset: string },
  /** The hour the card speaks of: now today, midday otherwise. */
  hour = 12,
): DayChips {
  const today = hours.filter((h) => h.day === day);
  const col = (f: string, from = 0, to = 24) =>
    today
      .filter((h) => h.hour >= from && h.hour < to)
      .flatMap((h) => (h.values[f] === undefined ? [] : [h.values[f]!]));
  const t = col("temperature_2m");
  const rh = col("relative_humidity_2m", 8, 20);
  const aqi = col("european_aqi");
  const at = today.find((h) => h.hour === hour);
  const minuteOf = (x: string | undefined) => {
    const m = x ? /T(\d{2}):(\d{2})$/.exec(x) : null;
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  return {
    hours: Array.from(
      { length: 24 },
      (_, h) => today.find((x) => x.hour === h)?.values["temperature_2m"] ?? null,
    ),
    code: at?.values["weather_code"] ?? null,
    nowC: at?.values["temperature_2m"] ?? null,
    rise: minuteOf(sun?.sunrise),
    set: minuteOf(sun?.sunset),
    maxC: t.length ? Math.max(...t) : null,
    minC: t.length ? Math.min(...t) : null,
    humidity: mean(rh),
    aqi: aqi.length ? Math.max(...aqi) : null,
    daylightH: dayWeather(day, hours, sun).daylightH,
  };
}

/** The sky in words and the drawing for it, from a WMO weather code (Open-Meteo's). */
export function skyOf(code: number | null): {
  word: string;
  icon: "sun" | "partly" | "cloud" | "fog" | "rain" | "snow" | "storm";
} {
  if (code === null) return { word: "", icon: "cloud" };
  if (code === 0) return { word: "Sereno", icon: "sun" };
  if (code <= 2)
    return { word: code === 1 ? "Quasi sereno" : "Poco nuvoloso", icon: "partly" };
  if (code === 3) return { word: "Coperto", icon: "cloud" };
  if (code === 45 || code === 48) return { word: "Nebbia", icon: "fog" };
  if (code >= 51 && code <= 67)
    return { word: code <= 57 ? "Pioviggine" : "Pioggia", icon: "rain" };
  if (code >= 71 && code <= 77) return { word: "Neve", icon: "snow" };
  if (code >= 80 && code <= 82) return { word: "Rovesci", icon: "rain" };
  if (code >= 85 && code <= 86) return { word: "Rovesci di neve", icon: "snow" };
  return { word: "Temporale", icon: "storm" };
}
