// Photographs the kit gallery's phase 3 pieces (PAT-94): each section, each sheet open, the
// ObjectPage, dark, at the widths given; reports any box whose content overflows it.
// usage: node scripts/kit-shots.mjs <outdir> [--base http://localhost:3200] [--widths 390,320]
import { chromium, devices } from "playwright";
import fs from "node:fs";

const arg = (k, d) =>
  process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d;
const OUT = process.argv[2];
const BASE = arg("--base", "http://localhost:3200");
const WIDTHS = arg("--widths", "390,320").split(",").map(Number);
const SECTIONS = ["cerca", "azioni", "voce", "modulo", "numeri", "stati-nuovi"];
const OPEN = ["altro", "conferma", "perche", "toast"];
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let overflow = 0;
for (const w of WIDTHS) {
  const ctx = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: w, height: 844 },
    colorScheme: "dark",
  });
  const p = await ctx.newPage();
  await p.goto(BASE + "/sign-in", { timeout: 120000 });
  await p.fill(
    "input[type=email]",
    process.env.UI_CHECK_EMAIL ?? "agent-preview@example.invalid",
  );
  await p.fill(
    "input[type=password]",
    process.env.UI_CHECK_PASSWORD ?? "preview-password-123",
  );
  await Promise.all([
    p.waitForURL((u) => !u.pathname.startsWith("/sign-in")),
    p.click("button[type=submit]"),
  ]);
  await p.goto(BASE + "/kit", { timeout: 120000 });
  for (const id of SECTIONS) {
    const el = p.locator("#" + id);
    await el.screenshot({ path: `${OUT}/${w}-${id}.png` });
    const bad = await el.evaluate((root) =>
      [...root.querySelectorAll("*")]
        .filter(
          (e) =>
            e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== "auto",
        )
        .map((e) => `${e.tagName.toLowerCase()}.${e.className}`.slice(0, 80)),
    );
    if (bad.length)
      (console.log(`${w} #${id} overflows: ${bad.join(" | ")}`),
        (overflow += bad.length));
  }
  for (const o of OPEN) {
    await p.goto(`${BASE}/kit?aperto=${o}`);
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}/${w}-open-${o}.png` });
  }
  await p.goto(BASE + "/kit/oggetto");
  await p.screenshot({ path: `${OUT}/${w}-oggetto.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
console.log(`shots in ${OUT}; boxes overflowing: ${overflow}`);
process.exit(overflow ? 1 : 0);
