import { describe, expect, it } from "vitest";
import { nameKey, nameTwins, pairKey } from "./twins";

describe("the one doppioni detector of an Elenco (PAT-43)", () => {
  it("reads a name as its words, without accents, case, punctuation or small words", () => {
    expect(nameKey("Burro d'arachidi")).toBe(nameKey("burro di arachidi"));
    expect(nameKey("Caffè")).toBe("caffe");
    expect(nameKey("Casa–palestra")).toBe(nameKey("palestra casa"));
    expect(nameKey("Casa-palestra bis")).not.toBe(nameKey("Casa-palestra"));
  });

  it("pairs the objects whose names are the same words, never one he said are different", () => {
    const items = [
      { id: "1", name: "Burro d'arachidi" },
      { id: "2", name: "Burro di arachidi" },
      { id: "3", name: "Burro" },
      { id: "4", name: "BURRO D'ARACHIDI" },
    ];
    expect(nameTwins(items).map(([a, b]) => a.id + b.id)).toEqual(["12", "14", "24"]);
    expect(
      nameTwins(items, new Set([pairKey("2", "1")])).map(([a, b]) => a.id + b.id),
    ).toEqual(["14", "24"]);
    expect(
      nameTwins([
        { id: "x", name: "—" },
        { id: "y", name: "…" },
      ]),
    ).toEqual([]);
  });
});
