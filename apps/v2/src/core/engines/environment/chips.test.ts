import { describe, expect, it } from "vitest";
import { airWords, dayChips, readGeocode, readHourly, AIR, HOURLY } from "./open-meteo";

describe("E11: Oggi's weather chips", () => {
  it("reads a city from the geocoding answer", () => {
    expect(
      readGeocode({ results: [{ name: "Bologna", latitude: 44.49, longitude: 11.34 }] }),
    ).toEqual({ name: "Bologna", latitude: 44.49, longitude: 11.34 });
    expect(readGeocode({})).toBeNull();
  });

  it("the day's high and low, daytime humidity, worst air, daylight", () => {
    const time = ["2026-10-15T07:00", "2026-10-15T14:00", "2026-10-15T23:00"];
    const hours = readHourly(
      {
        hourly: {
          time,
          temperature_2m: [12, 21.6, 15],
          relative_humidity_2m: [90, 58, 80],
          european_aqi: [18, 35, null],
        },
      },
      [...HOURLY, ...AIR],
    );
    expect(
      dayChips("2026-10-15", hours, {
        sunrise: "2026-10-15T07:21",
        sunset: "2026-10-15T18:23",
      }),
    ).toEqual({ maxC: 21.6, minC: 12, humidity: 58, aqi: 35, daylightH: 11.033333333333333 });
    expect(airWords(35)).toBe("aria discreta");
  });
});
