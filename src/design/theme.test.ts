/**
 * Tests for design/theme.css — compiles the real stylesheet with Tailwind and
 * checks the layout setting (ADR-0010): sm:/md:/lg: must obey data-layout
 * on <html>. A Tailwind upgrade that brought back the built-in variants
 * would silently break "phone" on a wide screen; this test catches it.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { beforeAll, describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../..", import.meta.url));
const from = `${root}src/app/globals.css`;
let css = "";

beforeAll(async () => {
  const result = await postcss([tailwind({ base: root })]).process(
    readFileSync(from, "utf8"),
    { from },
  );
  css = result.css;
});

/** Every selector in the output that starts with the given class. */
function selectorsOf(className: string): string[] {
  const escaped = className.replace(":", "\\\\:");
  const re = new RegExp(`\\.${escaped}(?![\\w-])[^{,]*(?=\\s*\\{)`, "g");
  return [...css.matchAll(re)].map((m) => m[0].trim());
}

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("layout variants (data-layout)", () => {
  it.each(["sm:flex-row", "md:hidden", "lg:col-span-2"])(
    "%s applies on wide screens unless phone, and always on desktop",
    (className) => {
      const selectors = selectorsOf(className);
      const cls = `.${className.replace(":", "\\:")}`;
      expect(selectors).toEqual([
        `${cls}:where(:not([data-layout="phone"] *))`,
        `${cls}:where([data-layout="desktop"] *)`,
      ]);
    },
  );

  it("puts the auto branch, and only it, inside the media query", () => {
    const auto = '.md\\:hidden:where(:not([data-layout="phone"] *))';
    const desktop = '.md\\:hidden:where([data-layout="desktop"] *)';
    expect(css).toMatch(
      new RegExp(`@media \\(width >= 48rem\\) \\{\\s*${escapeRe(auto)}`),
    );
    expect(css).not.toMatch(new RegExp(`@media [^{]*\\{\\s*${escapeRe(desktop)}`));
  });

  it("orders sm before md before lg, so wider screens win", () => {
    const first = (bp: string) => css.indexOf(`.${bp}\\:`);
    expect(first("sm")).toBeLessThan(first("md"));
    expect(first("md")).toBeLessThan(first("lg"));
  });
});

/*
 * Theme contract (ADR-0010): every theme file defines EVERY colour token of
 * the default theme, for light and for dark, so no theme can leave a colour
 * from another palette behind (e.g. a light background in dark mode).
 */
describe("theme contract", () => {
  const read = (path: string) => readFileSync(`${root}src/design/${path}`, "utf8");
  const colourTokens = (block: string) =>
    [...block.matchAll(/(--color-[a-z-]+)\s*:/g)].map((m) => m[1]).sort();
  /** The declarations of the first rule whose selector is exactly `selector`. */
  const blockOf = (css: string, selector: string) => {
    const start = css.indexOf(`${selector} {`);
    if (start < 0) return null;
    return css.slice(start, css.indexOf("}", start));
  };
  const defaults = colourTokens(read("theme.css").split("@theme {")[1]!.split("\n}")[0]!);

  it("the default theme has colour tokens", () => {
    expect(defaults.length).toBeGreaterThan(10);
  });

  it.each(["orto", "cruscotto"])("%s defines every colour, light and dark", (id) => {
    const css = read(`themes/${id}.css`);
    const sel = `:root[data-theme="${id}"]`;
    const light = blockOf(css, sel);
    const darkBySystem = blockOf(css, `${sel}:not([data-mode="light"])`);
    const darkByChoice = blockOf(css, `${sel}[data-mode="dark"]`);
    expect(colourTokens(light ?? "")).toEqual(defaults);
    expect(colourTokens(darkBySystem ?? "")).toEqual(defaults);
    // The two dark blocks must say the same thing.
    const declarations = (block: string | null) =>
      (block?.split("{")[1] ?? "").replace(/\s+/g, " ").trim();
    expect(declarations(darkByChoice)).toBe(declarations(darkBySystem));
  });

  it("every theme file is part of the stylesheet", () => {
    expect(css).toContain('[data-theme="orto"]');
    expect(css).toContain('[data-theme="cruscotto"]');
  });
});
