import { describe, expect, it } from "vitest";
import { distance, find, fold, matchScore, type Findable } from "./find";

const items: Findable[] = [
  { id: "1", name: "Caffè espresso", uses: 40, hours: [7, 8, 8, 14] },
  {
    id: "2",
    name: "Petto di pollo",
    aliases: ["chicken breast"],
    uses: 12,
    hours: [13, 20],
  },
  { id: "3", name: "Pane integrale", uses: 25, hours: [8, 13] },
  { id: "4", name: "Panna", uses: 0, tags: ["dispensa"] },
  { id: "5", name: "Parmigiano", uses: 25, hours: [13, 13, 20], tags: ["dispensa"] },
];
const names = (r: Findable[]) => r.map((i) => i.name);

describe("Find (PAT-41): one matcher, one ranking", () => {
  it("folds accents and case", () => {
    expect(fold("  CAFFÈ ")).toBe("caffe");
    expect(names(find(items, "caffe", { hour: 9 }))).toEqual(["Caffè espresso"]);
  });

  it("finds through an alias, after the own names", () => {
    expect(names(find(items, "chicken", { hour: 12 }))).toEqual(["Petto di pollo"]);
    expect(matchScore("chicken", items[1]!)).toBe(1);
  });

  it("forgives one typo in a word of four letters or more, never in a shorter one", () => {
    expect(distance("parmigaino", "parmigiano")).toBe(1); // a swap
    expect(names(find(items, "parmigaino", { hour: 12 }))).toEqual(["Parmigiano"]);
    expect(names(find(items, "pamna", { hour: 12 }))).toEqual(["Panna"]);
    expect(names(find(items, "cafe", { hour: 12 }))).toEqual(["Caffè espresso"]);
    expect(find(items, "pzn", { hour: 12 })).toEqual([]);
  });

  it("ranks the name's start first, then habit at this hour, then use, then name", () => {
    expect(names(find(items, "pa", { hour: 13 }))).toEqual([
      "Parmigiano", // 2 uses around 13, 25 in all
      "Pane integrale", // 1 use around 13
      "Panna",
    ]);
    expect(names(find(items, "pa", { hour: 8 }))[0]).toBe("Pane integrale");
  });

  it("with nothing typed, shows only what he uses, by habit at this hour", () => {
    expect(names(find(items, "", { hour: 8 }))).toEqual([
      "Caffè espresso",
      "Pane integrale",
      "Parmigiano",
      "Petto di pollo",
    ]);
  });

  it("filters by a chip", () => {
    expect(names(find(items, "", { hour: 8, tag: "dispensa" }))).toEqual(["Parmigiano"]);
    expect(names(find(items, "pa", { hour: 8, tag: "dispensa" }))).toEqual([
      "Parmigiano",
      "Panna",
    ]);
  });
});
