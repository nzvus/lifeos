/**
 * T4 (design-register): every colour that colours text is readable, WCAG AA
 * 4.5:1, on every ground the kit paints — paper, sheet and the 7 % area tints
 * of the sections and the day's box (UI-78) — in light and in dark. Ported from
 * v1 `src/design/theme.test.ts`; the five themes join when they come back
 * (UI-74). Hairline and focus are not text; the EEA air colours are the
 * standard's own and the level is always said in words (visual.md §3.2).
 * An area's own colour on its tint paints only its 20 px bold titles and its
 * icons: large text and marks, 3:1 (WCAG 1.4.3 large text, 1.4.11).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8");

const TEXT = /^--(ink|muted|herb|tomato|warn|macro-.+|moment-.+|muscle-.+)$/;

/** The hex tokens of the first rule whose selector starts with `selector`. */
function palette(selector: string): Map<string, string> {
  const start = css.indexOf(selector);
  const block = css.slice(start, css.indexOf("}", start));
  return new Map(
    [...block.matchAll(/(--[a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!]),
  );
}

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (c: number[]) =>
  "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
/** `color-mix(in srgb, a p%, b)`. */
const mix = (a: string, p: number, b: string) => {
  const [x, y] = [rgb(a), rgb(b)];
  return hex(x.map((v, i) => v * p + y[i]! * (1 - p)));
};
const luminance = (h: string) => {
  const [r, g, b] = rgb(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

describe.each([
  ["light", ':root, [data-theme="light"]'],
  ["dark", '[data-theme="dark"]'],
])("%s: text colours reach 4.5:1", (_, selector) => {
  const p = palette(selector);
  const text = [...p].filter(([k]) => TEXT.test(k));
  const coloured = text.filter(([k]) => k !== "--ink" && k !== "--muted");

  it("has the grounds and the text tokens", () => {
    expect(p.get("--paper")).toBeDefined();
    expect(p.get("--sheet")).toBeDefined();
    expect(text.length).toBeGreaterThan(15);
  });

  it("on paper and sheet", () => {
    const low = text.flatMap(([k, v]) =>
      ["--paper", "--sheet"]
        .map((g) => [k, g, contrast(v, p.get(g)!)] as const)
        .filter(([, , r]) => r < 4.5),
    );
    expect(low).toEqual([]);
  });

  it("on every area's 7 % tint: ink and muted 4.5, the area's own colour 3", () => {
    const low = [["--ink", p.get("--ink")!] as const, ...coloured].flatMap(([fam, f]) => {
      const ground = mix(f, 0.07, p.get("--paper")!);
      return [
        ["--ink", p.get("--ink")!] as const,
        ["--muted", p.get("--muted")!] as const,
        [fam, f] as const,
      ]
        .map(([k, v]) => [fam, k, contrast(v, ground)] as const)
        .filter(([, k, r]) => r < (k === fam && k !== "--ink" ? 3 : 4.5));
    });
    expect(low).toEqual([]);
  });
});
