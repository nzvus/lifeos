/** lifeos v2 tests (`npm test -w apps/v2`): next to the code, `foo.ts` + `foo.test.ts`. */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
