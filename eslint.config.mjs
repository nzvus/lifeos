/**
 * lifeos v2 lint (ADR-0056). TypeScript's recommended rules, and the
 * boundaries (one way: app → features → core; the kit from anywhere but core):
 *   - core/ is framework-free (ADR-0001): no UI framework, no auth client,
 *     no app, feature or kit;
 *   - features/ never import app/ (server actions arrive as props);
 *   - the engines are pure functions (ADR-0053): no database either.
 *     Only core/db and the repositories use Drizzle (ADR-0057).
 */
import tseslint from "typescript-eslint";
import { fitness, SCREEN_RULES } from "./eslint/fitness.mjs";

const FRAMEWORK = [
  "next",
  "next/*",
  "react",
  "react-dom",
  "react/*",
  "better-auth/react",
  "better-auth/client",
];
const UPWARD = ["@/app/*", "@/features/*", "@lifeos/kit", "@lifeos/kit/*"];
const DATABASE = [
  "drizzle-orm",
  "drizzle-orm/*",
  "pg",
  "@electric-sql/*",
  "../db/*",
  "../../db/*",
];

const restrict = (groups) => ({
  "no-restricted-imports": ["error", { patterns: groups }],
});

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "packages/**", // the kit lints itself (npm run lint -w packages/kit)
      "docs/**",
      "private/**",
      "playwright-report/**",
      "drizzle/**",
      ".next/**",
      ".pglite/**",
      ".pglite-e2e/**",
      "test-results/**",
      "playwright-report/**",
      "next-env.d.ts",
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["src/core/**/*.ts"],
    rules: restrict([
      { group: FRAMEWORK, message: "core/ is framework-free (ADR-0001)." },
      { group: UPWARD, message: "core/ imports only core/ (ADR-0002)." },
    ]),
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: restrict([
      {
        group: ["@/app/*"],
        message: "features never import app/: actions arrive as props.",
      },
      {
        group: DATABASE,
        message: "features read data through core/'s repositories, from a page.",
      },
    ]),
  },
  // PAT-90 fitness rules (eslint/fitness.mjs): screens compose kit pieces and never compare a
  // type key; the rest of core/ only the latter, except the specialisation folders and the
  // registry (model.md §8, MOD-02). Breaches of 6 Nov: lint-baseline.json, may only shrink.
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { lifeos: fitness },
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}"],
    rules: SCREEN_RULES,
  },
  {
    files: ["src/core/**/*.ts"],
    ignores: ["src/core/{food,training,money,engines,kinds}/**"],
    rules: { "lifeos/no-type-key-compare": "error" },
  },
  {
    files: ["src/**/*.test.{ts,tsx}", "src/**/testing/**"],
    rules: Object.fromEntries(Object.keys(SCREEN_RULES).map((r) => [r, "off"])),
  },
  {
    files: ["src/core/engines/**/*.ts"],
    rules: restrict([
      { group: FRAMEWORK, message: "core/ is framework-free (ADR-0001)." },
      { group: UPWARD, message: "core/ imports only core/ (ADR-0002)." },
      {
        group: DATABASE,
        message: "engines are pure functions: no database (ADR-0053, ADR-0057).",
      },
    ]),
  },
);
