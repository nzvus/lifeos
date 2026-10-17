/** @lifeos/kit tests: next to the code. */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.{ts,tsx}"] },
});
