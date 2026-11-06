// The lint rule lifeos/no-type-key-compare (PAT-90, MOD-02) reads its keys from
// eslint/type-keys.json: that list must be the registry's, or a new type escapes the rule.
import { describe, expect, it } from "vitest";
import keys from "../../../eslint/type-keys.json";
import { BUILTIN_KINDS } from "./builtins";

describe("type keys of the lint rule (MOD-02)", () => {
  it("lists every built-in voce kind and nothing else", () => {
    expect([...keys.voce].sort()).toEqual(BUILTIN_KINDS.map((k) => k.key).sort());
  });
});
