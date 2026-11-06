/**
 * The kit gallery photographed (PAT-94, change 2026-11-06-guards): every phase 3 piece, dark,
 * at 390 and 320 px, compared with the committed images in `e2e/kit.spec.ts-snapshots/`.
 * The app runs as built for production on a fresh PGlite folder: no database, no secret.
 *
 *   npm run shots -w apps/v2            compare (CI)
 *   npm run shots:update -w apps/v2     rewrite the images after a wanted change; look at them
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = 3300;
export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/setup.ts",
  timeout: 60_000,
  // One worker: the sign-up and the sheets share one database and one server.
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  expect: {
    // Fonts are web fonts and Chromium brings its own FreeType: a few anti-aliased pixels may
    // still differ between machines, a moved or resized piece never fits in this.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled", caret: "hide" },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    colorScheme: "dark",
    storageState: "test-results/.auth.json",
  },
  projects: [390, 320].map((width) => ({
    name: String(width),
    use: {
      ...devices["iPhone 13"],
      viewport: { width, height: 844 },
      browserName: "chromium",
    },
  })),
  webServer: {
    command: `rm -rf .pglite-e2e && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/sign-in`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      V2_PGLITE_DIR: ".pglite-e2e",
      BETTER_AUTH_SECRET: "e2e-secret-only-for-the-kit-photos-0123456789",
      BETTER_AUTH_URL: `http://localhost:${PORT}`,
      ALLOW_SIGNUP: "true",
      KIT_GALLERY: "true",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
