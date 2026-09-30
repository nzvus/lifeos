/**
 * eslint.config.mjs — lint rules, including the ARCHITECTURE rules of
 * ADR-0001/0002 as machine checks ("an unenforced rule is only a promise").
 * `npm run lint` runs it; CI runs it on every push; editors show it live.
 *
 * Sections:
 *   1. Next.js + TypeScript recommended rules.
 *   2. Layer boundaries (eslint-plugin-boundaries): who may import whom.
 *        app      -> app, features, core, ui, design, i18n
 *        features -> core, ui, design, i18n, and ITSELF only (no other slice)
 *        ui       -> ui, design, i18n
 *        core     -> core only (and no framework packages at all)
 *        design, i18n -> themselves only (leaves)
 *   3. Values stay centralised (ADR-0002 rule 3): no hex colours and no
 *      Tailwind arbitrary values like p-[13px] outside design/; no hard-coded
 *      user-facing text in JSX outside i18n/.
 *
 * Proof that the rules bite: docs/runbooks/lint-boundaries.md lists the
 * deliberate violations used to test them.
 */
import boundaries from "eslint-plugin-boundaries";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import react from "eslint-plugin-react";

/** Types of architectural element, matched by path. */
const elements = [
  { type: "app", pattern: "src/app" },
  // A slice is two levels deep: features/<area>/<slice>, e.g. nutrition/meals.
  { type: "feature", pattern: "src/features/*/*", capture: ["area", "slice"] },
  { type: "core", pattern: "src/core" },
  { type: "ui", pattern: "src/ui" },
  { type: "design", pattern: "src/design" },
  { type: "i18n", pattern: "src/i18n" },
];

/** Packages core/ may never import (ADR-0001: core is framework-free). */
const FRAMEWORK = [
  "next",
  "next/*",
  "react",
  "react-dom",
  "react/*",
  "better-auth/react",
  "better-auth/next-js",
];

const config = [
  { ignores: [".next/**", "node_modules/**", "drizzle/**", "next-env.d.ts"] },

  // --- 1. Next.js + TypeScript defaults ------------------------------------
  ...nextVitals,
  ...nextTs,

  // Parameters/variables starting with "_" are intentionally unused (e.g. a
  // server action's `_prev` state that React requires in the signature).
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },

  // --- 2. Layer boundaries ----------------------------------------------------
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": elements,
      // Let the plugin resolve "@/core/..." (tsconfig paths) to real files.
      "import/resolver": { typescript: { alwaysTryTypes: true } },
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["app", "feature", "core", "ui", "design", "i18n"] },
                  },
                },
              },
            },
            {
              from: { element: { type: "feature" } },
              allow: {
                to: { element: { types: { anyOf: ["core", "ui", "design", "i18n"] } } },
              },
            },
            // A slice may import its own files, never another slice's.
            {
              from: { element: { type: "feature" } },
              allow: {
                to: {
                  element: {
                    type: "feature",
                    captured: {
                      area: "{{ from.captured.area }}",
                      slice: "{{ from.captured.slice }}",
                    },
                  },
                },
              },
            },
            {
              from: { element: { type: "ui" } },
              allow: { to: { element: { types: { anyOf: ["ui", "design", "i18n"] } } } },
            },
            {
              from: { element: { type: "core" } },
              allow: { to: { element: { type: "core" } } },
            },
            {
              from: { element: { type: "design" } },
              allow: { to: { element: { type: "design" } } },
            },
            {
              from: { element: { type: "i18n" } },
              allow: { to: { element: { type: "i18n" } } },
            },
          ],
        },
      ],
    },
  },

  // core/: no framework packages, whatever the element rules say.
  {
    files: ["src/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: FRAMEWORK, message: "core/ must stay framework-free (ADR-0001)." },
          ],
        },
      ],
    },
  },

  // --- 3. Values stay centralised ----------------------------------------------
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/design/**", "src/i18n/**", "src/**/*.test.ts", "src/core/testing/**"],
    plugins: { react },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // Any string containing a hex colour like #1a2b3c or #fff.
          selector: "Literal[value=/#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?\\b/]",
          message: "Colours live in src/design/theme.css (ADR-0002 rule 3).",
        },
        {
          // Tailwind arbitrary values: p-[13px], text-[#fff], w-[37%] ...
          selector: "Literal[value=/(^|\\s)[a-z-]+-\\[[^\\]]+\\]/]",
          message:
            "No Tailwind arbitrary values; add a token in src/design/theme.css (ADR-0002 rule 3).",
        },
        {
          selector: "TemplateElement[value.raw=/(^|\\s)[a-z-]+-\\[[^\\]]+\\]/]",
          message:
            "No Tailwind arbitrary values; add a token in src/design/theme.css (ADR-0002 rule 3).",
        },
      ],
      // Text written directly between JSX tags must come from i18n/.
      // Typographic symbols that carry no language are allowed.
      "react/jsx-no-literals": [
        "error",
        {
          noStrings: false,
          allowedStrings: ["‹", "›", "·", "—", "×", "~", "(", ")", "/"],
          ignoreProps: true,
        },
      ],
    },
  },
];

export default config;
