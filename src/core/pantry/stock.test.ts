/** Tests for core/pantry/stock.ts: stock from events, counts, run-out days. */
import { describe, expect, it } from "vitest";
import { stockOf, type StockEvent } from "./stock";

const NOW = new Date("2026-10-31T12:00:00Z");
const ev = (kind: StockEvent["kind"], at: string, quantity: string): StockEvent => ({
  kind,
  at: `${at}T10:00:00Z`,
  quantity,
});

describe("stockOf", () => {
  it("adds purchases and subtracts what was eaten, exactly", () => {
    const s = stockOf(
      [ev("in", "2026-10-01", "500"), ev("out", "2026-10-02", "60.5")],
      NOW,
    );
    expect(s.quantity).toBe("439.5");
  });

  it("a count replaces the running total from its moment on", () => {
    const s = stockOf(
      [
        ev("in", "2026-10-01", "500"),
        ev("out", "2026-10-02", "100"), // 400 by the books…
        ev("count", "2026-10-03", "250"), // …but only 250 were there
        ev("out", "2026-10-04", "50"),
      ],
      NOW,
    );
    expect(s.quantity).toBe("200");
  });

  it("on the same instant, a count is the last word", () => {
    const at = "2026-10-05";
    expect(stockOf([ev("count", at, "300"), ev("in", at, "500")], NOW).quantity).toBe(
      "300",
    );
  });

  it("never shows below zero, and ignores the future", () => {
    expect(stockOf([ev("out", "2026-10-02", "80")], NOW).quantity).toBe("0");
    expect(stockOf([ev("in", "2026-11-05", "500")], NOW).quantity).toBe("0");
  });

  it("runs out at the pace of the last 30 days", () => {
    const s = stockOf(
      [
        ev("in", "2026-10-01", "1000"),
        // 600 g eaten in the window → 20 g/day; 400 left → 20 days.
        ev("out", "2026-10-10", "300"),
        ev("out", "2026-10-20", "300"),
        ev("out", "2026-09-01", "999"), // outside the window: not "use"
      ],
      NOW,
    );
    expect(s).toEqual({ quantity: "400", dailyUse: "20", daysLeft: 20 });
  });

  it("without any use there is no run-out date", () => {
    expect(stockOf([ev("in", "2026-10-01", "8")], NOW)).toEqual({
      quantity: "8",
      dailyUse: null,
      daysLeft: null,
    });
  });
});
