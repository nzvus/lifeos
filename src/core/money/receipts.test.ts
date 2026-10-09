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
    expect(r.shop).toBe("Esselunga");
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

/** The developer's Lidl digital receipt of 2026-10-06 (header and items; no payment data). */
const LIDL = `
RIEPILOGO DIGITALE ACQUISTO
Lidl Italia S.r.l. a socio unico
Milano - cdc 1454
RIEPILOGO DIGITALE DI ACQUISTO
DESCRIZIONE IVA PREZZO(€)
HIGH PR.LATT.SEN.LAT 4% 7,95
Cad 1,59 Pz. 5
SALSA DI POMODORO CI 10% 3,56
Cad 0,89 Pz. 4
GNOCCHETTI PATATE 4% 1,58
Cad 0,79 Pz. 2
CODE MAZZ.CON GUSCIO 10% 5,99
LAMPONI SURGELATI 4% 4,79
FIL.MERLU.ATLAN. SUR 10% 7,49
LATTE PASTORIZZATO 4% 1,25
PANNA FRESCA PAST. 10% 1,29
MARMELLATA ARANCIA 10% 3,18
Cad 1,59 Pz. 2
FIOCCHI D'AVENA 10% 2,67
Cad 0,89 Pz. 3
Promo 3x2 10% -0,89
GALLETTE MAIS BIOLO. 10% 0,75
CIOCC. FONDENTE 10% 1,70
Cad 0,85 Pz. 2
VALORE SCONTI 0,89
SUBTOTALE 41,31
TOTALE COMPLESSIVO 41,31
DI CUI IVA 2,94
Pagamento elettronico 41,31
Importo pagato 41,31
06-10-2026 11:39
`;

describe("parseReceipt on a Lidl receipt", () => {
  const r = parseReceipt(LIDL);

  it("reads the shop from the chain, not the first row", () => {
    expect(r.shop).toBe("Lidl");
    expect(r.day).toBe("2026-10-06");
  });

  it("takes Lidl's quantity row under its item", () => {
    expect(r.lines.slice(0, 3)).toEqual([
      { description: "HIGH PR.LATT.SEN.LAT", quantity: "5", amountCents: 795 },
      { description: "SALSA DI POMODORO CI", quantity: "4", amountCents: 356 },
      { description: "GNOCCHETTI PATATE", quantity: "2", amountCents: 158 },
    ]);
    expect(r.lines.find((l) => l.description === "FIOCCHI D'AVENA")).toEqual({
      description: "FIOCCHI D'AVENA",
      quantity: "3",
      amountCents: 178, // 2,67 − the 3x2 promo
    });
  });

  it("does not count the discounts' summary as an item: the lines add up to the total", () => {
    expect(r.lines.some((l) => /sconti/i.test(l.description))).toBe(false);
    expect(r.lines.reduce((a, l) => a + l.amountCents, 0)).toBe(r.totalCents);
    expect(r.totalCents).toBe(4131);
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
