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

const FRAMEWORK = ["next", "next/*", "react", "react-dom", "react/*", "better-auth/react", "better-auth/client"];
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
    ignores: ["node_modules/**", "drizzle/**", ".next/**", ".pglite/**", "next-env.d.ts"],
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
