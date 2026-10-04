/** Reading a receipt's text (ADR-0036): lines, quantities, discounts, total. */
import { describe, expect, it } from "vitest";
import { aliasKey, parseModelReceipt, parseReceipt } from "./receipts";

const ESSELUNGA = `
ESSELUNGA S.P.A.
Via Roma 12 - Milano
P.IVA 01255720169
DOCUMENTO COMMERCIALE
di vendita o prestazione
DESCRIZIONE              IVA   PREZZO(€)
PASSATA MUTTI 700G        4%      1,29
2 x 0,89
YOGURT GRECO 0%           4%      1,78
SCONTO FIDATY                    -0,30
0,512 kg x 2,99 €/kg
MELE GOLDEN               4%      1,53
CARTA IGIENICA 4 ROTOLI  22%      3,49
SUBTOTALE                         8,09
TOTALE COMPLESSIVO                7,79
PAGAMENTO ELETTRONICO             7,79
IVA 4%                            0,18
04-10-2026 11:32  DOC.N. 0123-0045
`;

describe("parseReceipt", () => {
  const r = parseReceipt(ESSELUNGA);

  it("finds the items with their quantities and the discount on the line above", () => {
    expect(r.lines).toEqual([
      { description: "PASSATA MUTTI 700G", quantity: null, amountCents: 129 },
      { description: "YOGURT GRECO 0%", quantity: "2", amountCents: 148 },
      { description: "MELE GOLDEN", quantity: "0.512", amountCents: 153 },
      { description: "CARTA IGIENICA 4 ROTOLI", quantity: null, amountCents: 349 },
    ]);
  });

  it("reads the total, the day and the shop", () => {
    expect(r.totalCents).toBe(779);
    expect(r.day).toBe("2026-10-04");
    expect(r.shop).toBe("ESSELUNGA S.P.A.");
    expect(r.lines.reduce((a, l) => a + l.amountCents, 0)).toBe(779);
  });

  it("gives nothing for text that is not a receipt", () => {
    expect(parseReceipt("ciao\ncome va")).toEqual({
      shop: "ciao",
      day: null,
      lines: [],
      totalCents: null,
    });
  });
});

describe("aliasKey", () => {
  it("ignores case, spaces, accents and punctuation", () => {
    expect(aliasKey("Passata  MUTTI 700G")).toBe(aliasKey("PASSATA MUTTI 700 G"));
    expect(aliasKey("Caffè d'orzo")).toBe("caffedorzo");
  });
});

describe("parseModelReceipt", () => {
  it("validates the model's JSON, even inside fences, and drops what is wrong", () => {
    const r = parseModelReceipt(
      '```json\n{"shop":"Coop","day":"2026-13-01","totalCents":129,"lines":[{"description":"Passata Mutti 700 g","quantity":1,"amountCents":129,"product":"Passata"}]}\n```',
    );
    expect(r).toEqual({
      shop: "Coop",
      day: null,
      totalCents: 129,
      lines: [
        {
          description: "Passata Mutti 700 g",
          quantity: "1",
          amountCents: 129,
          product: "Passata",
        },
      ],
    });
    expect(parseModelReceipt("sorry")).toBeNull();
    expect(
      parseModelReceipt('{"lines":[{"description":"x","amountCents":-5}]}'),
    ).toBeNull();
  });
});
