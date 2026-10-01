/** Tests for core/pantry/validation.ts: what the pantry forms may send. */
import { describe, expect, it } from "vitest";
import { parseInput } from "../shared/validation";
import { productInput, purchaseInput, reminderInput } from "./validation";

const PID = "0b0c4f8e-6c1d-4a3e-9f5a-2b7d8c9e0f11";

describe("purchaseInput", () => {
  it("turns euros into exact cents; empty = unknown", () => {
    const r = parseInput(purchaseInput, {
      productId: PID,
      day: "2026-10-01",
      packages: "2",
      price: "2,09",
    });
    expect(r).toMatchObject({ ok: true, value: { priceCents: 209, packages: "2" } });
    const none = parseInput(purchaseInput, {
      productId: PID,
      day: "2026-10-01",
      packages: "1",
      price: "",
    });
    expect(none).toMatchObject({ ok: true, value: { priceCents: null } });
  });
});

describe("productInput", () => {
  it("refuses pieces linked to an ingredient", () => {
    const r = parseInput(productInput, {
      name: "Uova ×6",
      unit: "piece",
      packageSize: "6",
      ingredientId: PID,
    });
    expect(r).toEqual({ ok: false, errors: { ingredientId: "invalid_choice" } });
  });
});

describe("reminderInput", () => {
  it("repeat is a whole number of days, or empty", () => {
    expect(
      parseInput(reminderInput, { text: "Pulire il frigo", repeatDays: "7" }),
    ).toMatchObject({
      ok: true,
      value: { repeatDays: 7, dueDay: null },
    });
    expect(parseInput(reminderInput, { text: "x", repeatDays: "1.5" })).toEqual({
      ok: false,
      errors: { repeatDays: "invalid_number" },
    });
  });
});
