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
      "/mente/abitudine/x",
      "/mente/andamento/legami",
      "/corpo/andamento/peso",
      "/corpo/ciclo/x",
      "/cibo/elenco/doppioni",
      "/oggi/andamento/qualita",
      "/oggi/giornata/x",
    ])
      expect(at(p), p).not.toBeNull();
    expect(at("/piano/modelli", "area=corpo")).toEqual({
      active: "corpo",
      addHref: "/aggiungi?area=corpo",
    });
    expect(at("/piano/modelli")).toEqual({ active: "oggi", addHref: "/aggiungi" });
  });

  it("never on a running gym session (TRAIN-10), nor (yet) on forms, objects and ⊕'s sheets", () => {
    for (const p of [
      "/corpo/sessione/x",
      "/cibo/cibo/x",
      "/cibo/pasto/nuovo",
      "/corpo/esercizio/x/unisci",
      "/oggi/andamento/obiettivi/nuovo",
      "/aggiungi",
      "/aggiungi/pasto",
      "/voce/x",
      "/profilo",
      "/palestra",
      "/kit",
    ])
      expect(at(p), p).toBeNull();
  });
});
