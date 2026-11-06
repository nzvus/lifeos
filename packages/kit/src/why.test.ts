import { describe, expect, it } from "vitest";
import { isUnknown, unknownWords, whySections, type WhyDeclaration } from "./why";

const PROTEIN: WhyDeclaration = {
  title: "Proteine di oggi",
  formula: "La somma delle proteine di ogni voce mangiata oggi",
  inputs: [
    { label: "Pranzo", value: "42 g", confidence: "weighed" },
    { label: "Spuntino", value: "15 g", source: "Ciqual", confidence: "assumed" },
  ],
  coverage: { have: 2, of: 4, need: 3, unit: "pasti" },
  fascia: { words: "buono da 1,6 a 2,2 g/kg", source: "ISSN 2017" },
  version: "proteine v2",
};

describe("Perché? generated from the declaration (PAT-51, MOD-40)", () => {
  it("formula, inputs with confidence and source, coverage, fascia, version — in order", () => {
    const s = whySections(PROTEIN);
    expect(s.map((x) => x.title)).toEqual([
      "Come si calcola",
      "Con quali dati",
      "Quanti dati",
      "La fascia",
      "Versione della formula",
    ]);
    expect(s[1]!.rows[1]).toEqual({
      label: "Spuntino",
      value: "15 g",
      note: "ipotizzato, da confermare · Ciqual",
    });
    expect(s[3]!.rows[0]!.note).toBe("ISSN 2017");
  });
});

describe("«non so» (PAT-55, MOD-41)", () => {
  it("below the threshold the judgement is «non so», with what is missing", () => {
    expect(isUnknown({ have: 2, need: 3 })).toBe(true);
    expect(isUnknown({ have: 3, need: 3 })).toBe(false);
    expect(whySections(PROTEIN)[2]!.rows[0]!.note).toBe("non so: ne servono 3");
    expect(unknownWords(["il peso di ieri", "la cena"])).toEqual({
      word: "non so",
      missing: "Manca: il peso di ieri, la cena",
    });
    expect(unknownWords([]).missing).toBeNull();
  });
});
