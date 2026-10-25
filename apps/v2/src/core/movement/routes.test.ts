import { describe, expect, it } from "vitest";
import { checkRoute } from "./routes";

describe("a route of the library", () => {
  it("checks what is typed; on foot the whole way is walked unless said", () => {
    expect(
      checkRoute({
        name: " Casa → palestra ",
        mode: "walk",
        distanceKm: "1,4",
        durationMin: "18",
        walkingM: "",
        mapsUrl: "",
      }),
    ).toEqual({
      ok: true,
      route: {
        name: "Casa → palestra",
        mode: "walk",
        distanceKm: 1.4,
        durationMin: 18,
        walkingM: 1400,
        mapsUrl: null,
      },
    });
    expect(
      checkRoute({
        name: "Treno",
        mode: "train",
        distanceKm: "35",
        durationMin: "40",
        walkingM: "600",
        mapsUrl: "https://maps.app.goo.gl/abc",
      }),
    ).toMatchObject({
      ok: true,
      route: { walkingM: 600, mapsUrl: "https://maps.app.goo.gl/abc" },
    });
    expect(
      checkRoute({
        name: "x",
        mode: "plane",
        distanceKm: "tanti",
        durationMin: "",
        walkingM: "",
        mapsUrl: "http://evil.example",
      }),
    ).toEqual({ ok: false, errors: ["name", "mode", "distanceKm", "mapsUrl"] });
  });
});
