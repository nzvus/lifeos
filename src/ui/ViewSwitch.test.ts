import { describe, expect, it } from "vitest";
import { hrefWithView } from "./ViewSwitch";

describe("hrefWithView", () => {
  it("adds the open view to another day's link", () => {
    expect(hrefWithView("/?day=2026-10-02", "food", "summary", "tab")).toBe(
      "/?day=2026-10-02&tab=food",
    );
  });
  it("leaves the fallback view out of the URL", () => {
    expect(hrefWithView("/?day=2026-10-02&tab=food", "summary", "summary", "tab")).toBe(
      "/?day=2026-10-02",
    );
    expect(hrefWithView("/", "summary", "summary", "tab")).toBe("/");
  });
  it("replaces a view already in the link", () => {
    expect(hrefWithView("/?tab=food", "training", "summary", "tab")).toBe(
      "/?tab=training",
    );
  });
});
