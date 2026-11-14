import { describe, expect, it } from "vitest";
import { DOMAINS } from "@/core/kinds/kind";
import { areaHrefs, areaOf, isDomainArea, placeHrefs } from "./places";

describe("map D", () => {
  it("puts every domain in one area (ADR-0059)", () => {
    for (const d of DOMAINS) expect(areaOf(d)).not.toBeNull();
    expect(areaOf("training")).toBe("corpo");
    expect(areaOf("food")).toBe("cibo");
    expect(areaOf("home")).toBe("mente");
    expect(areaOf("money")).toBe("soldi");
  });

  it("an area is a filter of a place, and the bar keeps it (PAT-95, PAT-03)", () => {
    expect(areaHrefs("elenco")).toEqual({
      oggi: "/oggi/elenco",
      cibo: "/cibo/elenco",
      corpo: "/corpo/elenco",
      mente: "/mente/elenco",
      soldi: "/soldi/elenco",
    });
    expect(areaHrefs("", "/2026-11-05").cibo).toBe("/cibo/2026-11-05");
    expect(placeHrefs("cibo")).toEqual({
      elenco: "/cibo/elenco",
      piano: "/cibo/piano",
      oggi: "/oggi",
      andamento: "/cibo/andamento",
      obiettivi: "/oggi/andamento/obiettivi",
    });
    expect(isDomainArea("oggi")).toBe(false);
    expect(isDomainArea("corpo")).toBe(true);
  });
});
