// PAT-101, MOD-20: a catalog object's box draws its verbs as one actions row.
import { describe, expect, it } from "vitest";
import { rowVerbs } from "./use-object-verbs";

describe("rowVerbs (PAT-101)", () => {
  it("keeps the type's order, one Elimina, the danger marked", () => {
    expect(
      rowVerbs(["startFrom", "archive", "restore", "delete", "trash", "merge"], true),
    ).toEqual([
      { verb: "startFrom", danger: false },
      { verb: "archive", danger: false },
      { verb: "delete", danger: true },
      { verb: "merge", danger: false },
    ]);
  });
  it("no «Unisci» without another of its type", () => {
    expect(rowVerbs(["merge", "archive"], false).map((x) => x.verb)).toEqual(["archive"]);
  });
});
