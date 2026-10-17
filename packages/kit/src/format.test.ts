import { describe, expect, it } from "vitest";
import { F } from "./format";

/** Each case: the boards' fmt.js output for the same input (recorded 2026-10-17). */
const BOARDS: [keyof typeof F, unknown[], unknown][] = [
  ["num", [37.71, "g"], "37,7 g"],
  ["num", [254.4, "g"], "254 g"],
  ["num", [0.24, "g"], "0,2 g"],
  ["num", [2534.6, "kcal"], "2.535 kcal"],
  ["num", [74.25, "kg"], "74,3 kg"],
  ["num", [3.5, "€"], "3,50 €"],
  ["num", [1234567.891, ""], "1.234.567,9"],
  ["num", [-0.4, "kg/sett."], "−0,4 kg/sett."],
  ["num", [-0.004, "kg"], "0 kg"],
  ["signed", [49, "min"], "+49 min"],
  ["signed", [-1, "h"], "−1 h"],
  ["approx", [95, "mg"], "≈ 95 mg"],
  ["range", [310, 420, "kcal"], "310–420 kcal"],
  ["of", [1.25, 2.5, "l"], "1,3 / 2,5 l"],
  ["clock", [3725], "1:02:05"],
  ["clock", [95], "1:35"],
  ["hm", [65], "1 h 05"],
  ["hm", [45], "45 min"],
  ["hm", [120], "2 h"],
  ["day", ["2026-10-15"], "giovedì 15"],
  ["Day", ["2026-10-15"], "Giovedì 15"],
  ["date", ["2026-10-15"], "15 ott"],
  ["dateLong", ["2026-10-15"], "15 ottobre"],
  ["month", ["2026-10-15"], "ottobre"],
  ["week", ["2026-10-15"], "sett. 42"],
  ["week", ["2027-01-01"], "sett. 53"],
  ["letter", ["2026-10-18"], "D"],
  ["plural", [1, "serie", "serie"], "1 serie"],
  ["plural", [1500, "passo", "passi"], "1.500 passi"],
  ["level", [70], "met"],
  ["level", [39], "no"],
  ["level", [null], "none"],
  ["cap", [9, 10], "warn"],
  ["reach", [4, 10], "bad"],
  ["n", [16500], "16.500"],
  ["n", [2.25, 2], "2,25"],
];

describe("F writes what the boards write", () => {
  it.each(BOARDS)("%s(%j) = %j", (fn, args, out) => {
    expect((F[fn] as (...a: unknown[]) => unknown)(...args)).toBe(out);
  });

  it("writes a day minute as a 24-hour clock, past midnight too", () => {
    expect(F.time(8 * 60 + 5)).toBe("08:05");
    expect(F.time(24 * 60 + 90)).toBe("01:30");
  });
});
