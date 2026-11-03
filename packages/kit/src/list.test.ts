import { describe, expect, it } from "vitest";
import { listWindow } from "./list";

describe("a list's window (UI-41)", () => {
  it("shows 8 and keeps the rest behind «Mostra altri»", () => {
    expect(listWindow(90, false)).toEqual({ shown: 8, rest: 82 });
    expect(listWindow(90, true)).toEqual({ shown: 90, rest: 0 });
  });
  it("never hides a single row behind the button", () => {
    expect(listWindow(9, false)).toEqual({ shown: 9, rest: 0 });
    expect(listWindow(3, false)).toEqual({ shown: 3, rest: 0 });
  });
});
