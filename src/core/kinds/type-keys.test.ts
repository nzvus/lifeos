// The lint rule lifeos/no-type-key-compare (PAT-90, MOD-02) reads its keys from
// eslint/type-keys.json: that list must cover the registry, or a new type escapes the rule.
import { describe, expect, it } from "vitest";
import keys from "../../../eslint/type-keys.json";
import { BUILTIN_KINDS } from "./builtins";
import { CATALOG_TYPES } from "./catalog";
import { SIGNALS } from "./signals";

describe("type keys of the lint rule (MOD-02)", () => {
  it("lists every built-in voce kind and nothing else", () => {
    expect([...keys.voce].sort()).toEqual(BUILTIN_KINDS.map((k) => k.key).sort());
  });

  it("lists every catalog type key and every stored catalog of the registry (MOD-01)", () => {
    for (const t of CATALOG_TYPES) {
      expect(keys.catalog).toContain(t.key);
      if (t.storage.table === "catalog_items")
        expect(keys.catalog).toContain(t.storage.catalog);
    }
  });

  it("lists every signal and nothing else (MOD-01: a signal is a registry entry)", () => {
    expect([...keys.signal].sort()).toEqual(SIGNALS.map((s) => s.key).sort());
  });
});
