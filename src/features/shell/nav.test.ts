import { describe, expect, it } from "vitest";
import { navFor } from "./nav";

const at = (path: string, search = "") => navFor(path, new URLSearchParams(search));

describe("one NavBar and ⊕ in (app)/layout.tsx (PAT-01)", () => {
  it("the area pages and their tabs: the area ticked, ⊕ adds to it", () => {
    expect(at("/oggi")).toEqual({ active: "oggi", addHref: "/aggiungi" });
    expect(at("/cibo")).toEqual({ active: "cibo", addHref: "/aggiungi?area=cibo" });
    expect(at("/corpo/elenco")).toEqual({
      active: "corpo",
      addHref: "/aggiungi?area=corpo",
    });
    expect(at("/soldi/andamento")?.active).toBe("soldi");
    expect(at("/oggi/piano/")?.active).toBe("oggi");
  });

  it("a past day: ⊕ adds to that day", () => {
    expect(at("/oggi/2026-11-05")).toEqual({
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
    expect(at("/cibo/cibo/x")).toEqual({
      active: "cibo",
      addHref: "/aggiungi?area=cibo",
    });
    expect(at("/cibo/pasto/nuovo")?.active).toBe("cibo");
    expect(at("/corpo/esercizio/x/unisci")?.active).toBe("corpo");
    expect(at("/oggi/andamento/obiettivi/nuovo")).toEqual({
      active: "oggi",
      addHref: "/aggiungi",
    });
    expect(at("/aggiungi/pasto", "area=cibo&giorno=2026-11-05")?.active).toBe("cibo");
    expect(at("/palestra")).toEqual({ active: "corpo", addHref: "/aggiungi?area=corpo" });
    for (const p of [
      "/voce/x",
      "/profilo",
      "/profilo/cestino",
      "/kit",
      "/andamento/peso",
    ])
      expect(at(p), p).toEqual({ active: null, addHref: "/aggiungi" });
  });

  it("never on a running gym session (TRAIN-10)", () => {
    expect(at("/corpo/sessione/x")).toBeNull();
    expect(at("/corpo/sessione")).not.toBeNull();
  });
});
