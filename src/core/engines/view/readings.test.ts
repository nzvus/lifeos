import { describe, expect, it } from "vitest";
import { kindRegistry, kindSchema } from "../../kinds";

const BUILT_IN = kindRegistry().all;
import { measuresOf, readingOf, RULES } from "./readings";

// MOD-56, MOD-57 (bars-study §18; his «yc», 20 Nov): the engine reads every class of thing.
describe("the visualization engine reads anything the registry holds (MOD-56, MOD-57)", () => {
  it("every built-in type declares its class, and has something to draw", () => {
    for (const k of BUILT_IN) {
      expect(k.class, k.key).toBeDefined();
      expect(measuresOf(k).measures.length, k.key).toBeGreaterThan(0);
    }
  });

  it("each field type has its reading; what places or names a voce is not a measure", () => {
    expect(readingOf({ type: "number" })).toBe("amount");
    expect(readingOf({ type: "duration" })).toBe("time");
    expect(readingOf({ type: "scale" })).toBe("rating");
    expect(readingOf({ type: "boolean" })).toBe("done");
    expect(readingOf({ type: "choice" })).toBe("category");
    expect(readingOf({ type: "text" })).toBe("presence");
    expect(readingOf({ type: "ref" })).toBeNull();
    expect(readingOf({ type: "date" })).toBeNull();
  });

  it("a tracker he makes is read with no new code: its class from its family", () => {
    const headache = kindSchema.parse({
      key: "mal_di_testa",
      name: "Mal di testa",
      family: "body",
      domain: "body",
      shape: "interval",
      entry: "form",
      fields: [
        { key: "intensita", type: "scale", scale: 5 },
        { key: "farmaco", type: "boolean" },
      ],
    });
    const m = measuresOf(headache);
    expect(m.class).toBe("measurement");
    expect(m.measures.map((x) => [x.reading, x.family])).toEqual([
      ["time", "span"],
      ["rating", "mark"],
      ["done", "cells"],
      ["presence", "cells"],
    ]);
  });

  it("a meal is an intake whose lines are a composition; sleep a state with its span", () => {
    const meal = BUILT_IN.find((k) => k.key === "meal")!;
    expect(measuresOf(meal).class).toBe("intake");
    expect(measuresOf(meal).measures.some((x) => x.family === "split")).toBe(true);
    const sleep = BUILT_IN.find((k) => k.key === "sleep")!;
    expect(measuresOf(sleep).class).toBe("state");
    expect(measuresOf(sleep).measures[0]).toMatchObject({ reading: "time" });
  });

  it("every reading names aggregates the metrics engine computes", () => {
    for (const r of Object.values(RULES)) expect(r.aggregates.length).toBeGreaterThan(0);
  });
});
