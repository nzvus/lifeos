#!/usr/bin/env node
/**
 * scripts/ui-audit.mjs — every signed-in page at a phone's width, in the
 * chosen themes and modes, with the text scaled up as Android does: reports
 * pages that scroll sideways and text that overlaps, and saves a screenshot
 * of each page. What caught the overflow the developer saw on the phone
 * (design review 2026-10-02). See docs/runbooks/ui-audit.md.
 *
 *   npm run audit:ui
 *   AUDIT_THEMES=label,minimal AUDIT_MODES=light,dark AUDIT_WIDTH=360 \
 *     AUDIT_ZOOM=120 npm run audit:ui
 *
 * Needs a running dev server (BASE_URL, default http://localhost:3123) and
 * the preview account on the DEV database (AUDIT_EMAIL / AUDIT_PASSWORD).
 * It switches that account's theme while it runs and puts Label back.
 * Exit code 1 when a page scrolls sideways or text overlaps.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const env = (k, d) => process.env[k] ?? d;
const BASE = env("BASE_URL", "http://localhost:3123");
const EMAIL = env("AUDIT_EMAIL", "agent-preview@example.invalid");
const PASSWORD = env("AUDIT_PASSWORD", "preview-password-123");
const THEMES = env("AUDIT_THEMES", "label").split(",");
const MODES = env("AUDIT_MODES", "light").split(",");
const WIDTH = Number(env("AUDIT_WIDTH", "360"));
const ZOOM = Number(env("AUDIT_ZOOM", "120"));
const OUT = env("AUDIT_OUT", "audit-ui");

const STATIC = [
  "/",
  "/?tab=food",
  "/?tab=training",
  "/plan",
  "/assistant",
  "/meals",
  "/meals/new",
  "/ingredients",
  "/ingredients/new",
  "/pantry",
  "/pantry/products/new",
  "/profiles",
  "/profiles?view=weight",
  "/profiles?view=coming",
  "/profiles/new",
  "/settings",
  "/settings/trash",
  "/training",
  "/training/new",
  "/training/exercises",
  "/training/exercises/new",
  "/training/programs",
  "/training/programs/new",
  "/training/routines",
  "/training/routines/new",
];
// The first item of each list, for the detail pages.
const DETAILS = [
  ["/meals", /^\/meals\/[0-9a-f-]{36}$/],
  ["/ingredients", /^\/ingredients\/[0-9a-f-]{36}$/],
  ["/settings", /^\/profiles\/[0-9a-f-]{36}$/],
  ["/training", /^\/training\/[0-9a-f-]{36}$/],
  ["/training/exercises", /^\/training\/exercises\/[0-9a-f-]{36}$/],
  ["/training/routines", /^\/training\/routines\/[0-9a-f-]{36}$/],
  ["/training/programs", /^\/training\/programs\/[0-9a-f-]{36}$/],
];

/** Runs in the page: sideways scroll and overlapping text leaves. */
function findIssues() {
  const out = [];
  const vw = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > vw + 1)
    out.push(`scrolls sideways: ${document.documentElement.scrollWidth}px > ${vw}px`);
  const text = (e) => (e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
  // Text in a fixed or sticky bar (an editor's Cancel / Save) floats over
  // the content by design: not an overlap.
  const pinned = (e) => {
    for (let x = e; x && x !== document.body; x = x.parentElement) {
      const p = getComputedStyle(x).position;
      if (p === "fixed" || p === "sticky") return true;
    }
    return false;
  };
  const leaves = [...document.querySelectorAll("main *")].filter(
    (e) =>
      e.childElementCount === 0 &&
      text(e) &&
      !e.closest("dialog:not([open]), nav, [hidden]") &&
      !pinned(e),
  );
  const boxes = leaves
    .map((e) => [e, e.getBoundingClientRect()])
    .filter(([, b]) => b.width && b.height);
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < Math.min(boxes.length, i + 40); j++) {
      const [a, A] = boxes[i];
      const [c, C] = boxes[j];
      if (a.contains(c) || c.contains(a)) continue;
      const ox = Math.min(A.right, C.right) - Math.max(A.left, C.left);
      const oy = Math.min(A.bottom, C.bottom) - Math.max(A.top, C.top);
      if (ox > 4 && oy > 4) out.push(`overlap: "${text(a)}" × "${text(c)}"`);
    }
  return [...new Set(out)];
}

const browser = await chromium.launch();
let failed = 0;
const report = [];
for (const mode of MODES) {
  const ctx = await browser.newContext({
    viewport: { width: WIDTH, height: 800 },
    colorScheme: mode,
    locale: "it-IT",
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => report.push({ page: page.url(), error: e.message }));
  await page.goto(`${BASE}/sign-in`);
  await page.fill("input[type=email]", EMAIL);
  await page.fill("input[type=password]", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL((u) => !u.pathname.startsWith("/sign-in"));

  const routes = [...STATIC];
  for (const [list, re] of DETAILS) {
    await page.goto(BASE + list, { waitUntil: "networkidle" });
    const hrefs = await page.$$eval("a[href]", (as) =>
      as.map((a) => a.getAttribute("href")),
    );
    const hit = hrefs.find((h) => re.test(h ?? ""));
    if (hit) routes.push(hit);
  }

  for (const theme of THEMES) {
    // The theme is per account and saves itself (Settings → Appearance).
    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
    await page.locator('select[name="theme"]').selectOption(theme);
    await page.waitForTimeout(2500);
    const dir = `${OUT}/${theme}-${mode}-${WIDTH}-${ZOOM}`;
    mkdirSync(dir, { recursive: true });
    for (const route of routes) {
      await page.goto(BASE + route, { waitUntil: "networkidle" });
      await page.addStyleTag({
        content: `html{font-size:${ZOOM}% !important} nextjs-portal{display:none!important}`,
      });
      await page.evaluate(() =>
        document.querySelectorAll("main details").forEach((d) => (d.open = true)),
      );
      await page.waitForTimeout(150);
      const issues = await page.evaluate(findIssues);
      const name = route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "today";
      await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
      if (issues.length) failed++;
      report.push({ theme, mode, route, issues });
      for (const i of issues) console.log(`${theme}/${mode} ${route}: ${i}`);
    }
  }
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  await page.locator('select[name="theme"]').selectOption("label");
  await page.waitForTimeout(2000);
  await ctx.close();
}
await browser.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
const pages = report.filter((r) => r.route).length;
console.log(`${pages} pages checked, ${failed} with issues; screenshots in ${OUT}/`);
process.exit(failed ? 1 : 0);
