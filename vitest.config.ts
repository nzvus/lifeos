/**
 * vitest.config.ts — test runner configuration (`npm test`).
 *
 * Tests live next to the code they test (`foo.ts` + `foo.test.ts`), as
 * CLAUDE.md requires. Database tests do NOT need a Postgres server: they use
 * PGlite (real Postgres compiled to WebAssembly, in-process) — see
 * src/core/testing/test-db.ts.
 */
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    // Same alias as tsconfig.json "paths": `@/x` -> `src/x`.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Each DB test file boots its own PGlite instance and applies every
    // migration: a few seconds, so give it room on slow machines / CI.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
