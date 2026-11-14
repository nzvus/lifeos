import { describe, expect, it } from "vitest";
import { navFor } from "./nav";

const at = (path: string, search = "") => navFor(path, new URLSearchParams(search));

describe("one NavBar and ⊕ in (app)/layout.tsx (PAT-01)", () => {
  it("the place ticked is what the page is for, whatever its area (ADR-0063); ⊕ adds to the area", () => {
    expect(at("/oggi")).toMatchObject({ active: "oggi", addHref: "/aggiungi" });
    expect(at("/cibo")).toMatchObject({ active: "oggi", addHref: "/aggiungi?area=cibo" });
    expect(at("/corpo/elenco")).toMatchObject({
      active: "elenco",
      addHref: "/aggiungi?area=corpo",
    });
    expect(at("/soldi/andamento")?.active).toBe("andamento");
    expect(at("/oggi/piano/")?.active).toBe("piano");
    expect(at("/corpo/ciclo/x")?.active).toBe("piano");
    expect(at("/oggi/andamento/obiettivi")?.active).toBe("obiettivi");
    expect(at("/oggi/andamento/qualita")?.active).toBe("andamento");
    expect(at("/andamento/peso")?.active).toBe("andamento");
  });

  it("the bar keeps the area of a place that filters by it; Oggi is every area (PAT-95)", () => {
    expect(at("/cibo/elenco")?.area).toBe("cibo");
    expect(at("/soldi/andamento")?.area).toBe("soldi");
    expect(at("/cibo/cibo/x")?.area).toBe("cibo");
    expect(at("/cibo")?.area).toBe("oggi");
    expect(at("/oggi/piano")?.area).toBe("oggi");
    expect(at("/profilo")?.area).toBe("oggi");
  });

  it("a past day: ⊕ adds to that day", () => {
    expect(at("/oggi/2026-11-05")).toMatchObject({
      active: "oggi",
      addHref: "/aggiungi?giorno=2026-11-05",
    });
    expect(at("/cibo/2026-11-05")?.addHref).toBe("/aggiungi?giorno=2026-11-05&area=cibo");
  });

  it("the pages under an area that had it on 6 Nov", () => {
    for (const p of [
      "/oggi/blocco/x",
      "/mente/andamento/legami",
      "/corpo/andamento/peso",
      "/corpo/ciclo/x",
      "/cibo/elenco/doppioni",
      "/oggi/andamento/qualita",
      "/corpo/piano",
    ])
      expect(at(p), p).not.toBeNull();
  });

  it("every other page has it too (Q-09 «a»): forms, objects, ⊕, Profilo", () => {
    expect(at("/cibo/cibo/x")).toMatchObject({
      active: "elenco",
      addHref: "/aggiungi?area=cibo",
    });
    expect(at("/cibo/pasto/nuovo")?.active).toBe("elenco");
    expect(at("/corpo/esercizio/x/unisci")?.active).toBe("elenco");
    expect(at("/oggi/andamento/obiettivi/nuovo")).toMatchObject({
      active: "obiettivi",
      addHref: "/aggiungi",
    });
    expect(at("/aggiungi/pasto", "area=cibo&giorno=2026-11-05")?.active).toBe("oggi");
    expect(at("/palestra")).toMatchObject({
      active: "oggi",
      addHref: "/aggiungi?area=corpo",
    });
    expect(at("/voce/x")).toMatchObject({ active: "oggi", addHref: "/aggiungi" });
    for (const p of ["/profilo", "/profilo/cestino", "/kit"])
      expect(at(p), p).toMatchObject({ active: null, addHref: "/aggiungi" });
  });

  it("never on a running gym session (TRAIN-10)", () => {
    expect(at("/corpo/sessione/x")).toBeNull();
    expect(at("/corpo/sessione")).not.toBeNull();
  });
});
