import { describe, expect, it } from "vitest";
import { orderNote } from "./present";

// One work set of 10 reps: e1RM = kg × (1 + 10/30); 75 kg → 100, 72 kg → 96.
const at = (place: number, kg: number) => ({
  place,
  sets: [{ reps: 10, loadKg: String(kg), durationS: null, warmup: false }],
});
// Three exercises, three sessions first and three fourth: 4 % weaker when fourth.
const others = new Map(
  ["x", "y", "z"].map((id) => [
    id,
    [at(0, 75), at(0, 75), at(0, 75), at(3, 72), at(3, 72), at(3, 72)],
  ]),
);

describe("orderNote (session.md §5.2)", () => {
  it("usually 1st, today 4th: says the expected drop, not a regression", () => {
    const byEx = new Map([...others, ["press", [at(0, 75), at(0, 75), at(0, 75)]]]);
    expect(orderNote(byEx, "press", 3)?.replace(/ /g, " ")).toBe(
      "di solito lo fai 1°, oggi 4° · −4 % atteso, non un calo",
    );
  });
  it("better at today's place: the gain, without «non un calo»", () => {
    const byEx = new Map([...others, ["press", [at(3, 72), at(3, 72), at(3, 72)]]]);
    expect(orderNote(byEx, "press", 0)?.replace(/\u00a0/g, " ")).toBe(
      "di solito lo fai 4°, oggi 1° · +4 % atteso",
    );
  });
  it("nothing at its usual place, nor with fewer than three sessions", () => {
    const byEx = new Map([...others, ["press", [at(0, 75), at(0, 75), at(0, 75)]]]);
    expect(orderNote(byEx, "press", 0)).toBeNull();
    expect(orderNote(new Map([["press", [at(0, 75)]]]), "press", 3)).toBeNull();
  });
});
