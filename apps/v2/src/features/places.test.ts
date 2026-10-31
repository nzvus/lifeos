import { describe, expect, it } from "vitest";
import { DOMAINS } from "@/core/kinds/kind";
import { areaOf, isDomainArea, tabHrefs } from "./places";

describe("map D", () => {
  it("puts every domain in one area (ADR-0059)", () => {
    for (const d of DOMAINS) expect(areaOf(d)).not.toBeNull();
    expect(areaOf("training")).toBe("corpo");
    expect(areaOf("food")).toBe("cibo");
    expect(areaOf("home")).toBe("mente");
    expect(areaOf("money")).toBe("soldi");
  });

  it("gives every place the same four tabs", () => {
    expect(tabHrefs("cibo")).toEqual({
      diario: "/cibo",
      piano: "/cibo/piano",
      elenco: "/cibo/elenco",
      andamento: "/cibo/andamento",
    });
    expect(isDomainArea("oggi")).toBe(false);
    expect(isDomainArea("corpo")).toBe(true);
  });
});
