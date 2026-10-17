/**
 * @lifeos/kit lint. The kit is presentation only (kit.md): it imports
 * React and itself, never an app, Next.js or a database.
 */
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["next", "next/*"],
              message: "the kit is framework-free beyond React",
            },
            {
              group: ["drizzle-orm", "drizzle-orm/*", "pg", "@electric-sql/*"],
              message: "the kit never reads data",
            },
            {
              group: ["@lifeos/v2", "@lifeos/v2/*", "../../apps/*"],
              message: "apps use the kit, not the reverse",
            },
          ],
        },
      ],
    },
  },
);
