import { describe, expect, it } from "vitest";
import { find } from "@lifeos/kit";
import { findTargets, type AddTarget } from "./search";

const t = (title: string, sub: string): AddTarget => ({
  key: sub + title,
  title,
  sub,
  fam: "food",
  href: "/" + title,
});
const ROWS = findTargets([
  t("Acqua", "tipo"),
  t("Caffè", "cibo"),
  t("Latte di cocco", "cibo"),
  t("Caffelatte del mattino", "pasto salvato"),
  t("Push", "allenamento"),
]);
const names = (q: string) => find(ROWS, q, { hour: 8 }).map((x) => x.name);

describe("⊕'s one search is the kit's Find (PAT-41, PAT-60)", () => {
  it("finds by name, accents aside, and by what a thing is", () => {
    expect(names("caffe")).toEqual(
      expect.arrayContaining(["Caffè", "Caffelatte del mattino"]),
    );
    expect(names("cocco")).toEqual(["Latte di cocco"]);
    expect(names("allenamento")).toEqual(["Push"]);
  });
  it("each row keeps its door", () => {
    expect(ROWS.find((r) => r.name === "Push")).toMatchObject({
      href: "/Push",
      meta: "allenamento",
    });
  });
});
