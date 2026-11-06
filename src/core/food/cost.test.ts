import { describe, expect, it } from "vitest";
import {
  choicePrices,
  costWords,
  coverage,
  entryCost,
  formatPrices,
  sumCosts,
} from "./cost";

const v1 = (kcal: string, pack: string, size: string) => ({
  kcal,
  packagePriceCents: pack,
  packageSize: size,
});

describe("what eating costs (dossiers/costs.md)", () => {
  it("prices a v1 line from its package and a v2 line from its cents per 100", () => {
    const c = entryCost([
      // 200 g of a 1,29 € kg pack of oats: 25,8 cents.
      { name: "Avena", quantity: "200", values: v1("370", "129", "1000") },
      // 150 ml of milk at 18 cents per 100 ml: 27 cents.
      { name: "Latte", quantity: "150", values: { kcal: "53", cents: "18" } },
    ]);
    expect(Number(c.cents)).toBeCloseTo(52.8, 5);
    expect(coverage(c)).toBe(1);
    expect(costWords(c)).toBe("≈ 0,50 €");
    expect(costWords(c, true)).toBe("≈ 0,53 €");
  });

  it("multiplies by the servings and takes a price paid instead (eaten out, 4 Oct)", () => {
    const line = { name: "Riso", quantity: "100", values: { kcal: "130", cents: "40" } };
    expect(Number(entryCost([line], "2").cents)).toBe(80);
    const out = entryCost(
      [
        {
          name: "Indiano · Tandoori misto (400 g)",
          quantity: "100",
          values: { kcal: "2250" },
        },
      ],
      null,
      2300,
    );
    expect(costWords(out)).toBe("≈ 23,00 €");
  });

  it("names what has no price when under 80 % of kcal is priced (21 Oct, the burger)", () => {
    const day = sumCosts([
      entryCost([
        { name: "Yogurt", quantity: "300", values: { kcal: "60", cents: "50" } },
      ]),
      entryCost([
        {
          name: "2 cheese burger doppi, 1 sweet potato fries",
          quantity: "100",
          values: { kcal: "1842" },
        },
      ]),
    ]);
    expect(coverage(day)).toBeLessThan(0.8);
    expect(day.missing).toEqual(["2 cheese burger doppi, 1 sweet potato fries"]);
    expect(costWords(day)).toBe("≈ 1,50 € · 1 senza prezzo");
  });

  it("never reuses a price per gram on another quantity (the 16 Oct dinner)", () => {
    const dish = (q: string) => ({
      name: "Pasta",
      quantity: q,
      values: v1("350", "1859", "500"),
    });
    const three = entryCost([dish("100"), dish("150"), dish("250")]);
    expect(Number(three.cents)).toBeCloseTo(1859, 5);
  });

  it("does not count a line without kcal and without price as missing (water)", () => {
    const c = entryCost([{ name: "Acqua", quantity: "500", values: { kcal: "0" } }]);
    expect(c.missing).toEqual([]);
    expect(costWords(c)).toBeNull();
  });

  it("takes each shop's latest price up to the day, then the median of formats", () => {
    const obs = [
      { formatId: "f1", shop: "Lidl", day: "2026-09-30", cents: 99, packageQty: "500" },
      { formatId: "f1", shop: "Lidl", day: "2026-10-20", cents: 129, packageQty: "500" },
      {
        formatId: "f1",
        shop: "Esselunga",
        day: "2026-10-01",
        cents: 159,
        packageQty: "500",
      },
      { formatId: "f2", shop: "", day: "2026-10-02", cents: 300, packageQty: "1000" },
      { formatId: "f2", shop: "", day: "2026-12-01", cents: 999, packageQty: "1000" },
    ];
    const p = formatPrices(obs, "2026-10-15");
    // f1: Lidl 99 (the 20 Oct one is later), Esselunga 159 → per 100: 19,8 and 31,8 → 25,8.
    expect(Number(p.get("f1"))).toBeCloseTo(25.8, 5);
    expect(Number(p.get("f2"))).toBe(30);
    const by = choicePrices(
      p,
      new Map([
        ["f1", "p1"],
        ["f2", "p2"],
      ]),
      new Map([
        ["p1", "food"],
        ["p2", "food"],
      ]),
    );
    expect(by.get("food")).toBe("27.90");
    expect(by.get("food:p1")).toBe("25.80");
  });
});
