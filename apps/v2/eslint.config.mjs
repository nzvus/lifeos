/**
 * lifeos v2 lint (ADR-0056). TypeScript's recommended rules, and two
 * boundaries:
 *   - core/ is framework-free (ADR-0001): no UI framework, no auth client;
 *   - the engines are pure functions (ADR-0053): no database either.
 *     Only core/db and the repositories use Drizzle (ADR-0057).
 */
import tseslint from "typescript-eslint";

const FRAMEWORK = ["next", "next/*", "react", "react-dom", "react/*", "better-auth/*"];
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
  { ignores: ["node_modules/**", "drizzle/**"] },
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
    ]),
  },
  {
    files: ["src/core/engines/**/*.ts"],
    rules: restrict([
      { group: FRAMEWORK, message: "core/ is framework-free (ADR-0001)." },
      {
        group: DATABASE,
        message: "engines are pure functions: no database (ADR-0053, ADR-0057).",
      },
    ]),
  },
);
