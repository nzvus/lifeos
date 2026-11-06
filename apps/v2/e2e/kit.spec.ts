// PAT-94: the kit gallery's phase 3 pieces, dark, at 390 and 320 px (one project each),
// compared with the committed images. A changed piece shows here before it reaches a screen.
import { expect, test } from "@playwright/test";

const SECTIONS = ["cerca", "azioni", "voce", "modulo", "numeri", "stati-nuovi"];
const OPEN = ["altro", "conferma", "perche", "toast"];

test("each piece of the gallery (PAT-94)", async ({ page }) => {
  await page.goto("/kit");
  for (const id of SECTIONS)
    await expect(page.locator("#" + id), id).toHaveScreenshot(`${id}.png`);
});

test("each sheet and the toast open (PAT-23, PAT-73, PAT-51, PAT-74)", async ({
  page,
}) => {
  for (const o of OPEN) {
    await page.goto("/kit?aperto=" + o);
    const shown = o === "toast" ? page.locator(".k-toastbar") : page.locator(".k-sheet");
    await expect(shown, o).toBeVisible();
    await expect(page, o).toHaveScreenshot(`open-${o}.png`);
  }
});

test("the ObjectPage (PAT-30)", async ({ page }) => {
  await page.goto("/kit/oggetto");
  await expect(page).toHaveScreenshot("oggetto.png", { fullPage: true });
});
