// The UI checks of interaction.md §8 (P9), on the local v2 at 390 px.
// Per page: targets under 44 × 44 (P3), primary actions (P5, exactly one),
// lists longer than 8 rows with no search in their section (P6); across pages:
// the visual forms of each verb (P5, one form per verb); per daily task: the
// scroll needed to reach its first control (P4).
//
// usage: node scripts/ui-check.mjs [--save | --compare] [--base http://localhost:3200]
//   --save     writes scripts/ui-baseline.json
//   --compare  exits 1 when a page or task is worse than the baseline
// Needs the dev server (`cd apps/v2 && npx next dev -p 3200`) and the local
// preview account (handoff: agent-preview@example.invalid).
import { chromium, devices } from "playwright";
import fs from "node:fs";

const arg = (k) => process.argv.includes(k);
const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:3200";
const BASELINE = new URL("./ui-baseline.json", import.meta.url);
const EMAIL = process.env.UI_CHECK_EMAIL ?? "agent-preview@example.invalid";
const PASSWORD = process.env.UI_CHECK_PASSWORD ?? "preview-password-123";

/** The places and their main screens; object pages are found from their lists. */
const PAGES = [
  "/oggi",
  "/aggiungi",
  "/aggiungi/pasto",
  "/aggiungi/attivita",
  "/piano",
  "/andamento",
  "/libreria",
  "/libreria?vista=cibi",
  "/libreria?vista=esercizi",
  "/palestra",
  "/impostazioni",
];
/** One object page of each kind: the first link of its list. */
const FIRST_OF = [
  ["/libreria?vista=cibi", "a[href^='/libreria/cibo/']"],
  ["/libreria?vista=esercizi", "a[href^='/libreria/esercizio/']"],
  ["/oggi", "a[href^='/voce/']"],
];
/** Daily tasks (the study's most frequent): the page and the control that starts each. */
const TASKS = [
  ["acqua", "/oggi", "button[aria-label*='500 ml']"],
  [
    "pasto",
    "/aggiungi",
    "section[aria-label='Per te'] a, section[aria-label='Per te'] button",
  ],
  ["peso", "/aggiungi", "a[href*='/aggiungi/weigh_in']"],
  ["palestra", "/palestra", "button.k-pick"],
  ["fatto", "/oggi", "button[aria-label$='segna fatto']"],
];
const VERBS = [
  "Aggiungi",
  "Elimina",
  "Modifica",
  "Salva",
  "Annulla",
  "Fatto",
  "Archivia",
];

const b = await chromium.launch();
const p = await (
  await b.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 } })
).newPage();
await p.goto(BASE + "/sign-in", { timeout: 120000 });
await p.fill("input[type=email]", EMAIL);
await p.fill("input[type=password]", PASSWORD);
await p.click("button[type=submit]");
await p.waitForURL(/oggi/, { timeout: 120000 });

const pages = [...PAGES];
for (const [list, sel] of FIRST_OF) {
  await p.goto(BASE + list, { timeout: 120000 });
  const href = await p
    .locator(sel)
    .first()
    .getAttribute("href")
    .catch(() => null);
  if (href) pages.push(href.replace(/\/[0-9a-f-]{36}/, "/:id") + "@" + href);
}

const report = { pages: {}, verbs: {}, tasks: {} };
const forms = Object.fromEntries(VERBS.map((v) => [v, new Set()]));
for (const entry of pages) {
  const [name, url] = entry.includes("@") ? entry.split("@") : [entry, entry];
  await p.goto(BASE + url, { timeout: 120000 });
  await p.waitForTimeout(1500);
  const r = await p.evaluate((VERBS) => {
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return (
        s.visibility !== "hidden" && s.display !== "none" && r.width > 0 && r.height > 0
      );
    };
    const targets = [
      ...document.querySelectorAll(
        "a[href], button, input, select, [role=button], summary",
      ),
    ].filter(visible);
    const small = targets.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width < 44 || r.height < 44;
    });
    const primary = targets.filter((el) =>
      el.matches(".k-primary, .k-btn.primary"),
    ).length;
    const longLists = [...document.querySelectorAll("section")].filter((s) => {
      const rows = s.querySelectorAll(":scope .k-box").length;
      return rows > 8 && !s.querySelector("input[type=search], .k-search, .k-find");
    }).length;
    const verbForms = {};
    for (const el of targets) {
      const t = (el.textContent || el.getAttribute("aria-label") || "").trim();
      const v = VERBS.find((w) => t === w || t.startsWith(w + " "));
      if (v)
        (verbForms[v] ??= []).push(
          el.tagName.toLowerCase() + "." + [...el.classList].sort().join("."),
        );
    }
    return {
      targets: targets.length,
      small: small.length,
      primary,
      longLists,
      verbForms,
    };
  }, VERBS);
  for (const [v, fs_] of Object.entries(r.verbForms))
    for (const f of fs_) forms[v].add(f);
  delete r.verbForms;
  report.pages[name] = r;
}
for (const v of VERBS) report.verbs[v] = forms[v].size;

for (const [task, url, sel] of TASKS) {
  await p.goto(BASE + url, { timeout: 120000 });
  await p.waitForTimeout(1500);
  const top = await p
    .locator(sel)
    .first()
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
    .catch(() => null);
  // Scroll needed beyond the first screen to reach the task's first control (0 = visible at once).
  report.tasks[task] = top === null ? null : Math.max(0, Math.round(top - 844 + 60));
}
await b.close();

const worse = [];
if (arg("--compare") && fs.existsSync(BASELINE)) {
  const base = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
  for (const [name, r] of Object.entries(report.pages)) {
    const o = base.pages[name];
    if (!o) continue;
    if (r.small > o.small)
      worse.push(`${name}: ${r.small} targets < 44 px (was ${o.small})`);
    if (r.longLists > o.longLists)
      worse.push(`${name}: ${r.longLists} long lists without Find (was ${o.longLists})`);
    if (o.primary === 1 && r.primary !== 1)
      worse.push(`${name}: ${r.primary} primary actions (was 1)`);
  }
  for (const [v, n] of Object.entries(report.verbs))
    if (n > (base.verbs[v] ?? n)) worse.push(`«${v}»: ${n} forms (was ${base.verbs[v]})`);
  for (const [t, s] of Object.entries(report.tasks)) {
    const o = base.tasks[t];
    if (o === undefined) continue;
    if (s === null && o !== null) worse.push(`${t}: its first control is gone`);
    else if (s !== null && o !== null && s > o + 50)
      worse.push(`${t}: ${s} px of scroll (was ${o})`);
  }
}

const sum = Object.values(report.pages).reduce(
  (a, r) => ({
    targets: a.targets + r.targets,
    small: a.small + r.small,
    noPrimary: a.noPrimary + (r.primary === 0 ? 1 : 0),
  }),
  { targets: 0, small: 0, noPrimary: 0 },
);
console.log(
  `pages ${Object.keys(report.pages).length} · targets ${sum.targets}, under 44 px ${sum.small} (${Math.round((sum.small / Math.max(1, sum.targets)) * 100)} %) · pages without a primary action ${sum.noPrimary}`,
);
console.log(
  "forms per verb:",
  Object.entries(report.verbs)
    .map(([v, n]) => `${v} ${n}`)
    .join(" · "),
);
console.log(
  "scroll to the first control:",
  Object.entries(report.tasks)
    .map(([t, s]) => `${t} ${s === null ? "—" : s + " px"}`)
    .join(" · "),
);
if (arg("--save")) fs.writeFileSync(BASELINE, JSON.stringify(report, null, 1) + "\n");
if (worse.length) {
  console.log("WORSE than the baseline:\n  " + worse.join("\n  "));
  process.exit(1);
}
