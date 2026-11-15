#!/usr/bin/env node
// The map (his 15 Nov, RULES_LOG «aggiunto da me», inbox W-04): where every screen, form,
// quantity control and kit piece is, read from the code itself, so «one piece per idea» is
// measured, not hoped. Writes docs/spec/map.md; `--check` fails when the file is stale.
// usage: node scripts/map.mjs [--check]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const KIT = path.join(ROOT, "packages/kit/src");
const OUT = path.join(ROOT, "docs/spec/map.md");
const rel = (f) => path.relative(ROOT, f).replaceAll(path.sep, "/");

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const f = path.join(dir, e.name);
    return e.isDirectory() ? walk(f) : [f];
  });
const isCode = (f) =>
  /\.(ts|tsx)$/.test(f) && !/\.test\.(ts|tsx)$/.test(f) && !f.endsWith(".d.ts");
const files = walk(SRC).filter(isCode).sort();

// The kit's pieces: what its index exports with a capital letter from a .tsx file.
const kitIndex = fs.readFileSync(path.join(KIT, "index.ts"), "utf8");
const kitPieces = new Set();
for (const m of kitIndex.matchAll(/export\s*\{([^}]*)\}\s*from\s*"\.\/([^"]+)"/g)) {
  if (!fs.existsSync(path.join(KIT, m[2] + ".tsx"))) continue;
  for (const n of m[1].split(",")) {
    const name = n
      .trim()
      .split(/\s+as\s+/)
      .pop();
    // a piece is a component: a capital then a small letter (not a constant like AREAS)
    if (name && /^[A-Z][a-z]/.test(name) && !name.startsWith("type "))
      kitPieces.add(name);
  }
}

const resolve = (from, spec) => {
  let base = null;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  if (!base) return null;
  for (const c of [
    base,
    base + ".ts",
    base + ".tsx",
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ])
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
};

const RAW = ["input", "select", "textarea", "button", "form"];
const info = new Map();
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  const sf = ts.createSourceFile(
    f,
    text,
    ts.ScriptTarget.Latest,
    true,
    f.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const imports = new Set();
  const kit = new Set();
  const kitNames = new Set();
  const raw = Object.fromEntries(RAW.map((t) => [t, 0]));
  const qty = new Set();
  let inlineStyle = 0;
  const attr = (node, name) => {
    const a = node.attributes.properties.find(
      (p) => ts.isJsxAttribute(p) && p.name.getText(sf) === name,
    );
    if (!a) return undefined;
    return a.initializer && ts.isStringLiteral(a.initializer)
      ? a.initializer.text
      : "{…}";
  };
  const visit = (n) => {
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
      const spec = n.moduleSpecifier.text;
      if (spec === "@lifeos/kit") {
        const b = n.importClause?.namedBindings;
        if (b && ts.isNamedImports(b))
          for (const e of b.elements)
            if (kitPieces.has(e.name.text)) kitNames.add(e.name.text);
      } else if (!n.importClause?.isTypeOnly) {
        const r = resolve(f, spec);
        if (r) imports.add(r);
      }
    }
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = n.tagName.getText(sf);
      if (kitNames.has(tag)) kit.add(tag);
      if (RAW.includes(tag)) raw[tag]++;
      if (attr(n, "style") !== undefined) inlineStyle++;
      const type = attr(n, "type");
      if (tag === "Stepper") qty.add("Stepper");
      if (tag === "Field" && (type === "stepper" || type === "time" || type === "date"))
        qty.add("Field " + type);
      if (tag === "input" && ["number", "time", "date"].includes(type ?? ""))
        qty.add("<input " + type + ">");
      if (tag === "input" && attr(n, "inputMode") !== undefined)
        qty.add("<input inputMode>");
      if (tag === "InPlace") qty.add("InPlace");
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  info.set(f, { imports, kit, raw, qty, inlineStyle, lines: text.split("\n").length });
}

// What a file reaches through its imports, inside app/ and features/ (the screens' side).
const screenSide = (f) =>
  f.startsWith(path.join(SRC, "app")) || f.startsWith(path.join(SRC, "features"));
const reach = (start) => {
  const seen = new Set([start]);
  const todo = [start];
  while (todo.length) {
    const f = todo.pop();
    for (const i of info.get(f)?.imports ?? [])
      if (screenSide(i) && !seen.has(i)) {
        seen.add(i);
        todo.push(i);
      }
  }
  return seen;
};

const routeOf = (page) => {
  const parts = rel(page)
    .replace(/^src\/app\//, "")
    .replace(/\/?page\.tsx$/, "")
    .split("/");
  const out = parts.filter((p) => p && !/^\(.*\)$/.test(p) && !p.startsWith("@"));
  return "/" + out.join("/");
};
const entry = (f) =>
  /\/(page|layout|default)\.tsx$/.test(f) && f.startsWith(path.join(SRC, "app"));
const pages = files
  .filter((f) => f.endsWith("/page.tsx"))
  .map((f) => ({ file: f, route: routeOf(f), reach: reach(f) }));
const entries = files.filter(entry);
const reachedByAny = new Set(entries.flatMap((f) => [...reach(f)]));
const routesOf = (f) => pages.filter((p) => p.reach.has(f)).map((p) => p.route);

const components = files.filter(
  (f) => f.endsWith(".tsx") && screenSide(f) && !entry(f) && !/\/loading\.tsx$/.test(f),
);
const EDIT = [
  "Field",
  "Stepper",
  "ObjectForm",
  "Composer",
  "InPlace",
  "Recurrence",
  "Timer",
  "Find",
  "Capture",
];
const SHOW = ["Box", "List", "Elenco", "ObjectPage", "EntryHeader"];
const NUM = ["Nutrients", "Fascia", "FasciaBar", "Judge", "Why", "Chart"];
const rawTotal = (i) => i.raw.input + i.raw.select + i.raw.textarea + i.raw.form;
const role = (i) =>
  [
    [...i.kit].some((k) => EDIT.includes(k)) || rawTotal(i) > 0 ? "edits" : null,
    [...i.kit].some((k) => SHOW.includes(k)) ? "shows" : null,
    [...i.kit].some((k) => NUM.includes(k)) ? "numbers" : null,
  ].filter(Boolean);
const groupOf = (f) => {
  const r = rel(f);
  const m = /^src\/features\/([^/]+)\//.exec(r);
  if (m) return "features/" + m[1];
  return /\[type\]\/\[id\]/.test(r) ? "app · object pages" : "app · other";
};
const short = (f) => rel(f).replace(/^src\//, "");
const few = (xs, n = 4) =>
  xs.length <= n ? xs.join(", ") : xs.slice(0, n).join(", ") + ` … (${xs.length})`;

const L = [];
const out = (s = "") => L.push(s);
out("# The map — where everything is, read from the code");
out();
out(
  "Generated by `node scripts/map.mjs` (never edited by hand; `--check` fails when it is stale).",
);
out(
  "Why: his 15 Nov note (`RULES_LOG.md`, inbox W-04): the same thing is built again in each context; this",
);
out(
  "file counts it. A row here is a fact about the code, not a decision; the target is in the spec.",
);
out();
out("## 0. Totals");
const withQty = components.filter((f) => info.get(f).qty.size > 0);
const withRaw = components.filter((f) => rawTotal(info.get(f)) > 0);
const editing = components.filter((f) => role(info.get(f)).includes("edits"));
const unreached = components.filter((f) => !reachedByAny.has(f));
const kitUse = new Map(
  [...kitPieces].map((k) => [
    k,
    components.concat(entries).filter((f) => info.get(f).kit.has(k)),
  ]),
);
out(
  `- routes: **${pages.length}** · screen components outside the kit: **${components.length}** · kit pieces: **${kitPieces.size}**`,
);
out(`- components that take input (a form, a field): **${editing.length}**`);
out(`- components where a quantity, a time or a date is typed: **${withQty.length}**`);
out(
  `- components with a control made by hand (\`<input>\`, \`<select>\`, \`<textarea>\`, \`<form>\`): **${withRaw.length}**`,
);
out(
  `- components with an inline \`style\`: **${components.filter((f) => info.get(f).inlineStyle > 0).length}**`,
);
out(
  `- kit pieces no screen uses: **${[...kitUse].filter(([, v]) => v.length === 0).length}** · components no route reaches: **${unreached.length}**`,
);
out();
out("## 1. Where a quantity, a time or a date is typed");
out(
  "One row per component. The target is one way to type each of them (VIS-86, PAT-13, PAT-61).",
);
out();
out("| component | how | routes |");
out("|---|---|---|");
for (const f of withQty)
  out(
    `| \`${short(f)}\` | ${[...info.get(f).qty].sort().join(" · ")} | ${few(routesOf(f)) || "—"} |`,
  );
out();
out("## 2. Components that take input, by area");
out(
  "A form made per context is the first thing to converge (PAT-61 `ObjectForm`, PAT-62 `Composer`).",
);
out();
const groups = [...new Set(components.map(groupOf))].sort();
for (const g of groups) {
  const xs = editing.filter((f) => groupOf(f) === g);
  if (xs.length === 0) continue;
  out(`### ${g} (${xs.length})`);
  out("| component | lines | kit pieces | by hand | routes |");
  out("|---|---|---|---|---|");
  for (const f of xs) {
    const i = info.get(f);
    const hand =
      RAW.filter((t) => t !== "button" && i.raw[t] > 0)
        .map((t) => `${i.raw[t]} ${t}`)
        .join(", ") || "—";
    out(
      `| \`${short(f)}\` | ${i.lines} | ${[...i.kit].sort().join(", ") || "—"} | ${hand} | ${routesOf(f).length} |`,
    );
  }
  out();
}
out("## 3. Controls made by hand");
out(
  "`<input>`, `<select>`, `<textarea>`, `<form>` and `<button>` written in a screen instead of a kit piece",
);
out(
  "(PRD-18, PAT-90). Buttons are counted apart: the kit has classes, not a `Button` piece (VIS-85).",
);
out();
out("| component | input | select | textarea | form | button | inline style |");
out("|---|---|---|---|---|---|---|");
for (const f of components
  .filter(
    (f) => rawTotal(info.get(f)) + info.get(f).raw.button + info.get(f).inlineStyle > 0,
  )
  .sort(
    (a, b) =>
      rawTotal(info.get(b)) - rawTotal(info.get(a)) ||
      info.get(b).raw.button - info.get(a).raw.button,
  )) {
  const i = info.get(f);
  out(
    `| \`${short(f)}\` | ${i.raw.input} | ${i.raw.select} | ${i.raw.textarea} | ${i.raw.form} | ${i.raw.button} | ${i.inlineStyle} |`,
  );
}
out();
out("## 4. The kit's pieces and who uses them");
out("| piece | used by (files) | where |");
out("|---|---|---|");
for (const [k, v] of [...kitUse].sort(
  (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
))
  out(
    `| \`${k}\` | ${v.length} | ${few(v.map(short), 3) || "**no screen** (inside the kit only, or unused)"} |`,
  );
out();
out("## 5. Routes and what each reaches");
out("| route | screen files reached | of which take input |");
out("|---|---|---|");
for (const p of [...pages].sort((a, b) => a.route.localeCompare(b.route))) {
  const comp = [...p.reach].filter((f) => components.includes(f));
  out(
    `| \`${p.route}\` | ${comp.length} | ${comp.filter((f) => editing.includes(f)).length} |`,
  );
}
out();
out("## 6. Components no route reaches");
out(
  "Candidates to delete, each to be checked (a test, the gallery or a dynamic import may still use it).",
);
out();
for (const f of unreached) out(`- \`${short(f)}\` (${info.get(f).lines} lines)`);
if (unreached.length === 0) out("None.");
out();

const text = L.join("\n");
if (process.argv.includes("--check")) {
  const now = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (now !== text) {
    console.error(
      "map: docs/spec/map.md is stale — run `node scripts/map.mjs` and commit it.",
    );
    process.exit(1);
  }
  console.log("map: up to date.");
} else {
  fs.writeFileSync(OUT, text);
  console.log(
    `map: ${pages.length} routes, ${components.length} components, ${kitPieces.size} kit pieces → ${rel(OUT)}`,
  );
}
