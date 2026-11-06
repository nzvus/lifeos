// Once per run (PAT-94): the photos' account on the fresh e2e database, signed in, its
// session saved for every test (`storageState`).
import { chromium, type FullConfig } from "@playwright/test";

export const STATE = "test-results/.auth.json";
const EMAIL = "kit-shots@example.invalid";
const PASSWORD = "kit-shots-password-123";

export default async function setup(config: FullConfig) {
  const baseURL = config.projects[0]!.use.baseURL!;
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });
  await page.goto("/sign-up");
  await page.fill("input[type=email]", EMAIL);
  await page.fill("input[type=password]", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL((u) => u.pathname.startsWith("/oggi"), { timeout: 60_000 });
  await page.context().storageState({ path: STATE });
  await browser.close();
}
