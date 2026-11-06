// PAT-94: the kit gallery's phase 3 pieces, dark, at 390 and 320 px (one project each),
// compared with the committed images. A changed piece shows here before it reaches a screen.
import { expect, test } from "@playwright/test";

const SECTIONS = [
  "cerca",
  "azioni",
  "compositore",
  "elenco",
  "valori",
  "voce",
  "modulo",
  "numeri",
  "stati-nuovi",
];
const OPEN = ["altro", "conferma", "perche", "toast", "unisci", "aggiungi"];

test("each piece of the gallery (PAT-94)", async ({ page }) => {
  await page.goto("/kit");
  // These photos are the pieces in place: the sticky bar and «Salva» would float over a section
  // as it scrolls into view.
  await page.addStyleTag({
    content:
      ".k-shell > .k-nav { visibility: hidden; } .k-formfoot { position: static; }",
  });
  for (const id of SECTIONS)
    await expect(page.locator("#" + id), id).toHaveScreenshot(`${id}.png`);
});

test("each sheet and the toast open (PAT-23, PAT-73, PAT-51, PAT-74, PAT-18, PAT-60)", async ({
  page,
}) => {
  for (const o of OPEN) {
    await page.goto("/kit?aperto=" + o);
    const shown = o === "toast" ? page.locator(".k-toastbar") : page.locator(".k-sheet");
    await expect(shown, o).toBeVisible();
    await expect(page, o).toHaveScreenshot(`open-${o}.png`);
  }
});

test("the ObjectPage (PAT-30), its top and its end above the bar", async ({ page }) => {
  // Two screens, not one full page: a full-page shot paints the sticky bar halfway down.
  await page.goto("/kit/oggetto");
  await expect(page).toHaveScreenshot("oggetto.png");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page).toHaveScreenshot("oggetto-fine.png");
});
