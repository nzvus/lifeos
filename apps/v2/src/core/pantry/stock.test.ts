/** Tests for core/pantry/stock.ts: the dossier's acceptance tests (pantry.md §8). */
import { describe, expect, it } from "vitest";
import type { IsoDate } from "../engines/time";
import { stockOf, toBuy, type StockEvent } from "./stock";

const ev = (kind: StockEvent["kind"], day: IsoDate, quantity: string): StockEvent => ({
  kind,
  at: new Date(`${day}T10:00:00Z`),
  day,
  quantity,
});
const NOW = new Date("2026-10-23T20:00:00Z");
const today = "2026-10-23" as IsoDate;
const logged = new Set<IsoDate>(["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23"]);
const milk = [
  ev("in", "2026-10-20", "2000"),
  ev("out", "2026-10-20", "100"),
  ev("out", "2026-10-21", "400"),
  ev("out", "2026-10-22", "100"),
  ev("out", "2026-10-23", "100"),
];

describe("stockOf", () => {
  it("2 × 1 000 ml bought, 700 ml logged → 1 300 left (§8.1)", () => {
    expect(stockOf(milk, NOW, { today, loggedDays: logged }).left).toBe("1300");
  });

  it("175 ml a logged day → «finisce tra 7 giorni» (§8.2)", () => {
    const s = stockOf(milk, NOW, { today, loggedDays: logged });
    expect(s.dailyUse).toBe("175");
    expect(s.daysLeft).toBe(7);
  });

  it("a count replaces the books from its moment (§8.3)", () => {
    const s = stockOf(
      [
        ev("in", "2026-10-20", "2000"),
        ev("out", "2026-10-20", "600"),
        { ...ev("count", "2026-10-22", "500"), at: new Date("2026-10-22T09:00:00Z") },
        ev("out", "2026-10-22", "100"),
      ],
      NOW,
      { today, loggedDays: logged },
    );
    expect(s.left).toBe("400");
  });

  it("eating what was never bought stays at 0 and does not eat later purchases", () => {
    const s = stockOf(
      [ev("out", "2026-10-20", "300"), ev("in", "2026-10-21", "500")],
      NOW,
      { today, loggedDays: logged },
    );
    expect(s.left).toBe("500");
  });

  it("days with nothing logged are not days of no use; no use → no pace", () => {
    const s = stockOf([ev("in", "2026-10-20", "500")], NOW, { today, loggedDays: logged });
    expect(s).toEqual({ left: "500", dailyUse: null, daysLeft: null });
  });

  it("an event after now is not counted yet", () => {
    const s = stockOf(
      [ev("in", "2026-10-20", "500"), ev("out", "2026-10-24", "100")],
      NOW,
      { today, loggedDays: logged },
    );
    expect(s.left).toBe("500");
  });
});

describe("toBuy", () => {
  it("1 day left with the shop in 3 → to buy (§8.6); 30 days left → not", () => {
    expect(toBuy({ left: "100", dailyUse: "100", daysLeft: 1 }, { shopEveryDays: 3 })).toBe(
      true,
    );
    expect(
      toBuy({ left: "3000", dailyUse: "100", daysLeft: 30 }, { shopEveryDays: 7 }),
    ).toBe(false);
  });

  it("no pace: only a minimum makes it a shopping item (§8.5)", () => {
    const s = { left: "0", dailyUse: null, daysLeft: null };
    expect(toBuy(s, { shopEveryDays: 7 })).toBe(false);
    expect(toBuy(s, { shopEveryDays: 7, minimum: "200" })).toBe(true);
  });
});
