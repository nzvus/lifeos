import { describe, expect, it } from "vitest";
import type { CheckedEntry } from "@/core/entries";
import { asNap } from "./nap";

const sleep = (from: string, to: string): CheckedEntry => ({
  kind: "sleep",
  day: "2026-10-26",
  status: "done",
  startAt: new Date(from),
  endAt: new Date(to),
  note: "",
  values: [{ field: "quality", num: "4" } as never],
});

describe("one «Sonno» sheet (capture.md §8.6)", () => {
  it("26 Oct 22:11 → 05:23 stays the night's sleep, never a nap", () => {
    expect(
      asNap(sleep("2026-10-25T21:11:00Z", "2026-10-26T04:23:00Z"), "Europe/Rome").kind,
    ).toBe("sleep");
  });
  it("40 minutes after lunch is a nap, with no quality", () => {
    const n = asNap(sleep("2026-10-26T13:00:00Z", "2026-10-26T13:40:00Z"), "Europe/Rome");
    expect([n.kind, n.values]).toEqual(["nap", []]);
  });
  it("four hours by day stays sleep", () => {
    expect(
      asNap(sleep("2026-10-26T09:00:00Z", "2026-10-26T13:00:00Z"), "Europe/Rome").kind,
    ).toBe("sleep");
  });
});
