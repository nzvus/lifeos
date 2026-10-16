import { describe, expect, it } from "vitest";
import { en } from "@/i18n/messages.en";
import { it as itMessages } from "@/i18n/messages.it";
import { sortNoteText } from "./SortNote";

describe("sortNoteText", () => {
  it("names the sort and the value, with no placeholder left", () => {
    expect(sortNoteText(en.search, "protein", "none", "18.8 g")).toBe("Protein: 18.8 g");
  });
  it("adds what the value is relative to", () => {
    expect(sortNoteText(en.search, "protein", "kcal", "18.8 g")).toBe(
      "Protein per 100 kcal: 18.8 g",
    );
    expect(sortNoteText(itMessages.search, "fiber", "cost", "3,1 g")).toBe("Fibre per €: 3,1 g");
  });
});
