// PAT-93 / PAT-81 (DT-61): no word of product.md §3's «Not» column in a catalogue (none at
// all) or in a string still inline (the 6 Nov baseline, which may only shrink as phase 4 moves
// each type's strings into its catalogue).
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import baseline from "./glossary-baseline.json";
import { findForbidden, forbiddenWords, sourceFiles, uiStrings } from "./glossary";

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const rel = (f: string) => path.relative(ROOT, f);
/** «record» as a personal best is the spec's own word (MOD-50); the «Not» means a voce. */
const SENSES_ALLOWED = new Set(["record"]);
const WORDS = forbiddenWords(
  fs.readFileSync(path.join(ROOT, "docs/spec/product.md"), "utf8"),
).filter((w) => !SENSES_ALLOWED.has(w));

const CATALOGUES = [
  ...sourceFiles(path.join(ROOT, "apps/v2/src/i18n")).filter(
    (f) => !f.endsWith("glossary.ts"),
  ),
  path.join(ROOT, "packages/kit/src/words.ts"),
].filter((f) => fs.existsSync(f));
const SCREENS = [
  ...sourceFiles(path.join(ROOT, "apps/v2/src/app")),
  ...sourceFiles(path.join(ROOT, "apps/v2/src/features")),
  ...sourceFiles(path.join(ROOT, "packages/kit/src")),
].filter((f) => !CATALOGUES.includes(f));

const hits = (f: string) =>
  uiStrings(f, fs.readFileSync(f, "utf8")).flatMap((s) =>
    findForbidden(s.text, WORDS).map((w) => `${rel(f)}:${s.line} «${w}» in «${s.text}»`),
  );

describe("glossary (PAT-93, PAT-81)", () => {
  it("reads the «Not» column of product.md §3", () => {
    expect(WORDS).toEqual(
      expect.arrayContaining(["modello", "routine", "punteggio", "libreria"]),
    );
  });

  it("finds a forbidden word whole, in any case, never inside another word", () => {
    expect(findForbidden("Salva come modello", WORDS)).toEqual(["modello"]);
    expect(findForbidden("Settimana tipo", WORDS)).toEqual(["settimana tipo"]);
    expect(findForbidden("modellare, libreriana", WORDS)).toEqual([]);
  });

  it("no catalogue uses a forbidden word", () => {
    expect(CATALOGUES.flatMap(hits)).toEqual([]);
  });

  it("inline strings: each file at most its 6 Nov count, and a drop lowers the baseline", () => {
    const counts: Record<string, number> = {};
    for (const f of SCREENS) {
      const n = hits(f).length;
      if (n) counts[rel(f)] = n;
    }
    // On a failure: a file that grew uses a forbidden word (product.md §3 has the right one);
    // a file that dropped → GLOSSARY_SAVE=1 npx vitest run src/i18n/glossary.test.ts.
    if (process.env.GLOSSARY_SAVE)
      fs.writeFileSync(
        path.join(import.meta.dirname, "glossary-baseline.json"),
        JSON.stringify(counts, null, 2) + "\n",
      );
    else expect(counts).toEqual(baseline);
  });
});
