import { describe, expect, it } from "vitest";
import {
  airUrl,
  dayWeather,
  mergeHours,
  readHourly,
  weatherUrl,
} from "../environment/open-meteo";
import { afterTraining, dailyNeed, sweatL, waterParts } from "./hydration";

describe("E11: Open-Meteo", () => {
  const rome = { latitude: 41.9028, longitude: 12.4964, timeZone: "Europe/Rome" };
  it("builds the requests for a place and a range of days", () => {
    const u = new URL(weatherUrl(rome, "2026-10-17", "2026-10-18"));
    expect(u.host).toBe("api.open-meteo.com");
    expect(u.searchParams.get("latitude")).toBe("41.903");
    expect(u.searchParams.get("hourly")).toContain("apparent_temperature");
    expect(u.searchParams.get("timezone")).toBe("Europe/Rome");
    expect(
      new URL(airUrl(rome, "2026-10-17", "2026-10-17")).searchParams.get("hourly"),
    ).toBe("pm2_5,pm10,european_aqi");
  });
  const answer = {
    hourly: {
      time: [
        "2026-10-16T23:00",
        "2026-10-17T03:00",
        "2026-10-17T14:00",
        "2026-10-17T15:00",
      ],
      temperature_2m: [14, 12, 24, 25],
      apparent_temperature: [13, 11, 27, null],
    },
  };
  it("reads the hours; a missing value is left out, never zero", () => {
    const hours = readHourly(answer, ["temperature_2m", "apparent_temperature"]);
    expect(hours[3]).toEqual({
      day: "2026-10-17",
      hour: 15,
      values: { temperature_2m: 25 },
      source: "open-meteo",
    });
    expect(readHourly({}, ["temperature_2m"])).toEqual([]);
  });
  it("merges weather and air by hour", () => {
    const a = readHourly(answer, ["temperature_2m"]);
    const b = readHourly({ hourly: { time: ["2026-10-17T14:00"], pm2_5: [8.5] } }, [
      "pm2_5",
    ]);
    expect(mergeHours(a, b).find((h) => h.hour === 14)?.values).toEqual({
      temperature_2m: 24,
      pm2_5: 8.5,
    });
  });
  it("a day's summary: the highest apparent temperature, the night's mean, daylight", () => {
    const hours = readHourly(answer, ["temperature_2m", "apparent_temperature"]);
    expect(
      dayWeather("2026-10-17", hours, {
        sunrise: "2026-10-17T07:21",
        sunset: "2026-10-17T18:21",
      }),
    ).toEqual({
      day: "2026-10-17",
      maxApparent: 27,
      night: 13, // 23:00 the evening before and 03:00
      daylightH: 11,
    });
    expect(dayWeather("2026-10-20", hours)).toEqual({
      day: "2026-10-20",
      maxApparent: null,
      night: null,
      daylightH: null,
    });
  });
});

describe("E10: the day's need", () => {
  it("EFSA's total water less what food brings, with its reasons", () => {
    expect(dailyNeed({ sex: "male", sessions: [], maxApparentC: 20 })).toEqual({
      drinks: 2,
      total: 2.5,
      foodWater: 0.5,
      reasons: [{ type: "base", litres: 2.5 }],
    });
    expect(
      dailyNeed({ sex: "female", sessions: [], maxApparentC: null, foodWaterL: 0.7 })
        .drinks,
    ).toBe(1.3);
  });
  it("+ sweat by session, + a margin for heat: 55 min at 22 °C", () => {
    const n = dailyNeed({
      sex: "male",
      sessions: [{ minutes: 55, intensity: "moderate", apparentC: 22 }],
      maxApparentC: 31,
    });
    expect(n.reasons).toEqual([
      { type: "base", litres: 2.5 },
      { type: "training", litres: 1.01, minutes: 55, apparentC: 22 },
      { type: "heat", litres: 0.3, maxApparentC: 31 },
    ]);
    expect(n.drinks).toBe(3.31);
  });
  it("sweat stays within 0.5–2 l/h", () => {
    expect(sweatL({ minutes: 60, intensity: "high", apparentC: 40 })).toBe(2);
    expect(sweatL({ minutes: 60, intensity: "low", apparentC: 10 })).toBe(0.5);
  });
  it("after a weighed session: 1.25–1.5 × the mass lost", () => {
    expect(afterTraining(76.4, 75.6)).toEqual({ low: 1, high: 1.2 });
    expect(afterTraining(76, 76.2)).toBeNull();
  });
});

describe("E10: the water score's parts", () => {
  const wake = 7 * 60;
  const bed = 23 * 60;
  it("drunk by now against the need spread over the waking hours", () => {
    const drinks = [
      { minute: 8 * 60, litres: 0.3 },
      { minute: 11 * 60, litres: 0.4 },
    ];
    // At 15:00, half the waking day: 1 l due of 2, 0.7 drunk.
    expect(
      waterParts({ drinks, needL: 2, wake, bed, now: 15 * 60 }).expected,
    ).toBeCloseTo(0.7, 6);
    expect(waterParts({ drinks, needL: 2, wake, bed, now: wake }).expected).toBeNull();
  });
  it("after training, and the spread: small doses, little before bed", () => {
    const drinks = [
      { minute: 19 * 60, litres: 0.5 },
      { minute: 20 * 60, litres: 0.5 },
      { minute: 22 * 60, litres: 0.8 },
    ];
    const p = waterParts({
      drinks,
      needL: 2.5,
      wake,
      bed,
      now: bed,
      session: { endMinute: 18 * 60 + 30, sweatL: 1 },
    });
    expect(p.afterTraining).toBe(0.8); // 1 l within 2 h of 1.25 needed
    // Two of three doses are small, but 0.8 l in the 2 h before bed (0.5 over 0.3) brings it to 0.
    expect(p.spread).toBe(0);
    expect(waterParts({ drinks: [], needL: 2, wake, bed, now: bed }).spread).toBeNull();
  });
});
