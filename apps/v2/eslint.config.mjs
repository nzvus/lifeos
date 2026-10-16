/**
 * lifeos v2 lint (ADR-0056). TypeScript's recommended rules, and the rule
 * that matters most for the engines: core/ is framework-free (ADR-0001,
 * ADR-0053: engines are pure functions).
 */
import tseslint from "typescript-eslint";

const FRAMEWORK = [
  "next",
  "next/*",
  "react",
  "react-dom",
  "react/*",
  "better-auth/*",
  "drizzle-orm",
  "drizzle-orm/*",
  "pg",
];

export default tseslint.config(
  { ignores: ["node_modules/**"] },
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
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: FRAMEWORK,
              message: "core/ is framework-free (ADR-0001, ADR-0053).",
            },
          ],
        },
      ],
    },
  },
);
