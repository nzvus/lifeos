import { describe, expect, it } from "vitest";
import { DESTRUCTIVE, splitActions } from "./actions";

const ALL = [
  "create",
  "startFrom",
  "variant",
  "edit",
  "merge",
  "archive",
  "restore",
  "delete",
  "saveAs",
  "undo",
];

describe("ObjectActions (PAT-16, PAT-17, PAT-18, PAT-19, PAT-20, PAT-22, PAT-23)", () => {
  it("row: Parti da, Variante, Archivia; «Altro»: Salva come, Unisci, Elimina last", () => {
    expect(splitActions(ALL)).toEqual({
      row: ["startFrom", "variant", "archive"],
      more: ["saveAs", "merge", "delete"],
    });
    expect(DESTRUCTIVE.has("delete")).toBe(true);
  });

  it("only the verbs the type declares (a route has no Variante)", () => {
    expect(splitActions(["startFrom", "archive", "restore", "delete"]).row).toEqual([
      "startFrom",
      "archive",
    ]);
  });

  it("an archived object offers Ripristina instead (PAT-19)", () => {
    expect(splitActions(ALL, true).row).toEqual(["restore"]);
  });
});
