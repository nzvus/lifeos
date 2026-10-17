/** lifeos v2 tests (`npm test -w apps/v2`): next to the code, `foo.ts` + `foo.test.ts`. */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The same `@/` as tsconfig's paths.
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
