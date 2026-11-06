import { describe, expect, it } from "vitest";
import type { TimedEntry } from "./relations";
import { MEAL_SESSION, relate, sinceLast } from "./relations";

const at = (hm: string) => new Date(`2026-10-15T${hm}:00Z`);
const meal = (
  id: string,
  hm: string,
  status: TimedEntry["status"] = "done",
): TimedEntry => ({ id, kind: "meal", at: at(hm), status });
const session = (
  hm: string,
  endHm: string,
  status: TimedEntry["status"] = "done",
): TimedEntry => ({ id: "s", kind: "session", at: at(hm), end: at(endHm), status });

describe("relate", () => {
  it("tags a meal before and after the session by the declared bands", () => {
    const r = relate(
      [
        meal("lunch", "13:00"),
        session("15:00", "16:15"),
        meal("snack", "16:45"),
        meal("dinner", "20:00"),
      ],
      [MEAL_SESSION],
    );
    expect(r.get("lunch")?.tags).toEqual(["pre-workout"]); // −120 min
    expect(r.get("snack")?.tags).toEqual(["post-workout"]); // +105 min from the start
    expect(r.get("dinner")?.tags).toEqual([]); // +300 min
  });

  it("gives the nearest related entry with its signed gap", () => {
    const r = relate([meal("lunch", "13:00"), session("15:00", "16:15")], [MEAL_SESSION]);
    expect(r.get("lunch")?.nearest).toEqual([{ kind: "session", id: "s", gapMin: -120 }]);
  });

  it("a skipped session takes its tags away", () => {
    const r = relate(
      [meal("lunch", "13:00"), session("15:00", "16:15", "skipped")],
      [MEAL_SESSION],
    );
    expect(r.get("lunch")).toEqual({ tags: [], nearest: [] });
  });

  it("a planned session already tags (the day with the plan)", () => {
    const r = relate(
      [meal("lunch", "13:00"), session("15:00", "16:15", "planned")],
      [MEAL_SESSION],
    );
    expect(r.get("lunch")?.tags).toEqual(["pre-workout"]);
  });

  it("the edge of a band counts, and the first band wins at the start", () => {
    const r = relate(
      [meal("edge", "12:00"), meal("start", "15:00"), session("15:00", "16:00")],
      [MEAL_SESSION],
    );
    expect(r.get("edge")?.tags).toEqual(["pre-workout"]); // exactly −180
    expect(r.get("start")?.tags).toEqual(["pre-workout"]); // gap 0 is in both bands: the first declared wins
  });

  it("during: an instant inside a span", () => {
    const set: TimedEntry = { id: "set1", kind: "set", at: at("15:20"), status: "done" };
    const r = relate(
      [set, session("15:00", "16:00")],
      [],
      [{ from: "set", to: "session", tag: "in-session" }],
    );
    expect(r.get("set1")?.tags).toEqual(["in-session"]);
  });
});

describe("sinceLast", () => {
  it("counts minutes since the last done entry of a kind", () => {
    const e = [meal("a", "08:00"), meal("b", "12:30"), meal("c", "19:00", "planned")];
    expect(sinceLast(e, "meal", at("15:00"))).toBe(150);
  });
  it("is null when there is none", () => {
    expect(sinceLast([], "coffee", at("15:00"))).toBeNull();
  });
});
