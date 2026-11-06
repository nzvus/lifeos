// The fitness rules of PAT-90 (MOD-02 for type keys): each catches its shape and lets the
// kit's way through. RuleTester runs inside vitest's describe/it.
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { afterAll, describe, it } from "vitest";
import { fitness } from "./fitness.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.afterAll = afterAll;
const tester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});
const run = (rule, valid, invalid) =>
  tester.run(rule, fitness.rules[rule], {
    valid: valid.map((code) => ({ code })),
    invalid: invalid.map((code) => ({ code, errors: [{ messageId: "banned" }] })),
  });

describe("PAT-90 fitness rules", () => {
  run(
    "no-search-input",
    ["<Find onPick={p} />;", '<input type="text" />;'],
    ['<input type="search" />;', '<input type={"search"} />;'],
  );
  run(
    "no-raw-form",
    ["<ObjectForm type={t} />;"],
    ["<form action={a}><input /></form>;"],
  );
  run(
    "no-window-confirm",
    ["confirmed(1);", "ask({ verb: 'Elimina' });"],
    ["window.confirm('Sicuro?');", "confirm('Sicuro?');"],
  );
  run(
    "no-hand-toast",
    ['<Toast text="Salvato" />;', '<div className="k-list" />;'],
    ['<div className="k-toastbar" />;', "<div className={`k-toast ${x}`} />;"],
  );
  run(
    "no-svg",
    ["<Chart points={p} />;", '<Glyph name="meal" />;'],
    ["<svg viewBox='0 0 1 1' />;"],
  );
  run(
    "no-inline-style",
    ['<div className="k-row" />;'],
    ["<div style={{ width: 4 }} />;"],
  );
  run(
    "no-type-key-compare",
    [
      'mode === "setup";',
      'field.type === "number";',
      'kind.family === "voce";',
      "registry.get(kind).capture === 'quick';",
    ],
    [
      'i.kind.key === "meal";',
      '"food" !== c.catalog;',
      'kind === "session";',
      "x?.kind === 'sleep';",
      'switch (b.kind) { case "meal": break; }',
    ],
  );
});
