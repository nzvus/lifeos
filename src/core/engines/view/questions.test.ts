// MOD-58, VIS-102 (his «yc» q10, 20 Nov): each field answers a question, the engine picks the
// instrument from it, and the registry stays equal to docs/spec/orca/attributes.md.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOG_TYPES, kindRegistry, QUESTIONS, type Field } from "../../kinds";
import { INSTRUMENT_OF, measuresOf, questionOf } from "./readings";

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const TABLE = fs.readFileSync(path.join(ROOT, "docs/spec/orca/attributes.md"), "utf8");

/** The rows of the attributes table, by its header (orca/README.md). */
function rows(md: string): Record<string, string>[] {
  const lines = md.split("\n").filter((l) => l.startsWith("|"));
  const head = lines[0]!
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());
  return lines
    .slice(2)
    .map((l) =>
      l
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim()),
    )
    .map((cells) => Object.fromEntries(head.map((h, i) => [h, cells[i] ?? ""])));
}

const FIELDS = new Map<string, Pick<Field, "type" | "question">>();
for (const k of kindRegistry().all)
  for (const f of k.fields) FIELDS.set(`${k.key}.${f.key}`, f);
for (const t of CATALOG_TYPES)
  for (const f of t.fields) FIELDS.set(`${t.key}.${f.key}`, f);

describe("the question decides the instrument (MOD-58, VIS-102)", () => {
  it("every question has its instrument", () => {
    for (const q of QUESTIONS) expect(INSTRUMENT_OF[q], q).toBeTruthy();
  });

  it("every built-in measure says its question and instrument", () => {
    for (const k of kindRegistry().all)
      for (const m of measuresOf(k).measures) {
        expect(QUESTIONS, `${k.key}.${m.field}`).toContain(m.question);
        expect(m.instrument).toBe(INSTRUMENT_OF[m.question]);
      }
  });

  it("a field says a question only to change its reading's default", () => {
    expect(questionOf({ type: "number" })).toBe("reach");
    expect(questionOf({ type: "number", question: "trend" })).toBe("trend");
    expect(questionOf({ type: "ref" })).toBeNull();
  });
});

describe("the registry equals orca/attributes (MOD-58)", () => {
  const table = rows(TABLE);

  it("reads the table", () => {
    expect(table.length).toBeGreaterThan(50);
  });

  it("each row's instrument is its question's, or cells for many members", () => {
    const off = table.filter(
      (r) =>
        r.Instrument !== "cells" &&
        r.Instrument !== INSTRUMENT_OF[r.Question as keyof typeof INSTRUMENT_OF],
    );
    expect(off.map((r) => `${r.ID} ${r.Question} → ${r.Instrument}`)).toEqual([]);
  });

  it("each row naming a field asks the same question as the registry", () => {
    const named = table.filter((r) => r.Field && r.Field !== "—");
    expect(named.length).toBeGreaterThan(10);
    const off = named.flatMap((r) => {
      const f = FIELDS.get(r.Field!);
      if (!f) return [`${r.ID} ${r.Field}: no such field`];
      const q = questionOf(f);
      return q === r.Question
        ? []
        : [`${r.ID} ${r.Field}: registry ${q}, table ${r.Question}`];
    });
    expect(off).toEqual([]);
  });
});
