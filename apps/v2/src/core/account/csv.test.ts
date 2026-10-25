import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("CSV for a spreadsheet (ADR-0052 C)", () => {
  it("semicolons, decimal commas, quotes when needed, a BOM", () => {
    const s = toCsv(
      ["giorno", "kg", "nota"],
      [["2026-10-23", "75.6", 'a digiuno; "ok"']],
    );
    expect(s).toBe('﻿giorno;kg;nota\r\n2026-10-23;75,6;"a digiuno; ""ok"""\r\n');
  });
});
