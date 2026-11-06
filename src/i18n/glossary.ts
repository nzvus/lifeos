/**
 * The glossary check of PAT-81/PAT-93 (DT-61): the words of product.md §3's «Not» column must
 * not reach the screen, in a catalogue or in a string still inline. Test-only helper: reads
 * files, so it never ships in a page.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

/** The «Not» column of product.md §3: one word or phrase each; a qualified one is left out
 *  («allenamento (as object)» is a review matter: the word itself is fine as an activity). */
export function forbiddenWords(productMd: string): string[] {
  const section = productMd.split(/^## 3\. /m)[1]?.split(/^## /m)[0] ?? "";
  const words: string[] = [];
  for (const line of section.split("\n")) {
    const [, concept = "", , , not = ""] = line.split("|").map((c) => c.trim());
    if (!line.startsWith("|") || concept === "Concept" || concept.startsWith("---"))
      continue;
    for (const w of not.split(",").map((s) => s.trim()))
      if (w && w !== "—" && !w.includes("(")) words.push(w.toLowerCase());
  }
  return [...new Set(words)];
}

/** JSX attributes that carry code, never words shown to him. */
const TECHNICAL = new Set([
  "className",
  "href",
  "id",
  "key",
  "name",
  "type",
  "role",
  "method",
  "inputMode",
  "autoComplete",
  "rel",
  "target",
  "src",
  "as",
  "htmlFor",
  "value",
  "defaultValue",
  "icon",
  "glyph",
  "tone",
  "variant",
  "size",
  "pattern",
  "step",
  "min",
  "max",
]);

/** Strings a screen shows: JSX text, JSX attribute strings that are not technical, and string
 *  or template literals with a space (a phrase), wherever they are. */
export function uiStrings(
  file: string,
  source: string,
): { line: number; text: string }[] {
  const sf = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const out: { line: number; text: string }[] = [];
  const add = (node: ts.Node, text: string) => {
    if (/[a-zà-ù]/i.test(text))
      out.push({
        line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        text,
      });
  };
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) add(node, node.text.trim());
    else if (
      ts.isJsxAttribute(node) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    ) {
      if (!TECHNICAL.has(node.name.getText(sf))) add(node, node.initializer.text);
      return;
    } else if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      !ts.isImportDeclaration(node.parent) &&
      !ts.isExportDeclaration(node.parent) &&
      / /.test(node.text)
    )
      add(node, node.text);
    else if (ts.isTemplateExpression(node))
      add(
        node,
        [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(" "),
      );
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

/** Each forbidden word found, whole-word and case-insensitive. */
export function findForbidden(text: string, words: readonly string[]): string[] {
  return words.filter((w) =>
    new RegExp(
      `(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`,
      "iu",
    ).test(text),
  );
}

/** Every .ts/.tsx under `dir`, tests and generated files left out. */
export function sourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter(
      (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$|\.generated\.ts$|\.d\.ts$/.test(f),
    )
    .map((f) => path.join(dir, f));
}
