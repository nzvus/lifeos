// The UI checks of interaction.md §8 (P9), on the local v2 at 390 px.
// Per page: targets under 44 × 44 (P3), primary actions (P5, exactly one),
// lists longer than 8 rows with no search in their section (P6); across pages:
// the visual forms of each verb (P5, one form per verb); per daily task: the
// scroll needed to reach its first control (P4).
//
// usage: node scripts/ui-check.mjs [--save | --compare] [--crawl] [--shots <dir>] [--width 390] [--base http://localhost:3200]
//   --width    the phone's width (390 by default; run 360 and 320 too: memory overflow-per-box)
//   --crawl    every page the app links to (one per kind of address), not only the list below
//   --shots    a full-page screenshot of each page into <dir>
//   --list     names each target under 44 px (page, element, text, size)
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
const W = process.argv.includes("--width")
  ? Number(process.argv[process.argv.indexOf("--width") + 1])
  : 390;
const BASELINE = new URL("./ui-baseline.json", import.meta.url);
const EMAIL = process.env.UI_CHECK_EMAIL ?? "agent-preview@example.invalid";
const PASSWORD = process.env.UI_CHECK_PASSWORD ?? "preview-password-123";

/** The places and their main screens; object pages are found from their lists. */
const PAGES = [
  "/oggi",
  "/aggiungi",
  "/aggiungi/pasto",
  "/aggiungi/attivita",
  "/oggi/piano",
  "/oggi/andamento",
  "/oggi/elenco",
  "/oggi/elenco?vista=cibi",
  "/oggi/elenco?vista=esercizi",
  "/corpo",
  "/cibo",
  "/corpo/andamento",
  "/palestra",
  "/impostazioni",
];
/** One object page of each kind: the first link of its list. */
const FIRST_OF = [
  ["/libreria?vista=cibi", "a[href^='/libreria/cibo/']:not([href$='/nuovo'])"],
  ["/libreria?vista=esercizi", "a[href^='/libreria/esercizio/']:not([href$='/nuovo'])"],
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
  await b.newContext({ ...devices["iPhone 13"], viewport: { width: W, height: 844 } })
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

// --crawl: every page the app links to, one per kind of address (ids and days as :id, :day;
// only `vista` kept from the query), so the check covers the whole app, not only the list above.
if (arg("--crawl")) {
  const keyOf = (href) => {
    const u = new URL(href, BASE);
    const vista = u.searchParams.get("vista");
    return (
      u.pathname
        .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27}/g, "/:id")
        .replace(/\/\d{4}-\d{2}-\d{2}/g, "/:day") + (vista ? "?vista=" + vista : "")
    );
  };
  const known = new Map(pages.map((e) => (e.includes("@") ? e.split("@") : [e, e])));
  const todo = [...known.values()];
  while (todo.length && known.size < 90) {
    const url = todo.shift();
    // A link that downloads (the export) or fails is not a page: skip it.
    if (
      !(await p.goto(BASE + url, { timeout: 120000 }).then(
        () => true,
        () => false,
      ))
    ) {
      known.delete(keyOf(url));
      continue;
    }
    await p.waitForTimeout(800);
    const hrefs = await p.$$eval("a[href^='/']", (as) =>
      as.map((a) => a.getAttribute("href")),
    );
    for (const h of hrefs) {
      if (!h || /^\/(api|sign-|_next)|esporta/.test(h)) continue;
      const k = keyOf(h);
      if (!known.has(k)) {
        known.set(k, h);
        todo.push(h);
      }
    }
  }
  pages.length = 0;
  for (const [k, u] of known) pages.push(k === u ? k : k + "@" + u);
}
const SHOTS = arg("--shots") ? process.argv[process.argv.indexOf("--shots") + 1] : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

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
      // Map D: ⊕ floats on every page as its primary (visual.md §5).
      el.matches(".k-primary, .k-btn.primary, .k-fab"),
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
    // Shapes on the scales of shapes.md §2 (radius 0–20, space 0–32, type 12–40), as the
    // boards' audit: one count per value, class and property. And alignment: the left
    // edges that text starts on (many edges = things placed by hand).
    const SCALE = {
      radius: [0, 4, 8, 12, 16, 20],
      space: [0, 4, 8, 12, 16, 24, 32],
      font: [12, 14, 16, 19, 24, 30, 40],
    };
    const px = (v) => parseFloat(v) || 0;
    const seen = new Set();
    const edges = new Set();
    const off = (cat, v, el, prop) => {
      const n = Math.round(v * 10) / 10;
      if (n === 0 || SCALE[cat].includes(n)) return;
      const cls =
        (typeof el.className === "string" ? el.className : "").trim().split(/\s+/)[0] ||
        el.tagName.toLowerCase();
      seen.add(cat + "|" + n + "|" + cls + "|" + prop);
    };
    for (const el of document.querySelectorAll("main *, .k-page *, .k-sheet *")) {
      if (el.closest("svg, .k-glyph, .k-art, .k-artclip, .k-chart, .k-sky")) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      for (const c of ["TopLeft", "TopRight", "BottomRight", "BottomLeft"]) {
        const raw = cs["border" + c + "Radius"];
        const v = px(raw);
        if (raw.includes("%") || v >= Math.min(r.width, r.height) / 2 - 0.5) continue;
        off("radius", v, el, "radius");
      }
      if (el.childElementCount || (el.textContent || "").trim())
        for (const side of ["Top", "Right", "Bottom", "Left"])
          off("space", px(cs["padding" + side]), el, "padding");
      if (/flex|grid/.test(cs.display)) {
        off("space", px(cs.rowGap), el, "gap");
        off("space", px(cs.columnGap), el, "gap");
      }
      const own = [...el.childNodes].some(
        (n) => n.nodeType === 3 && n.textContent.trim(),
      );
      if (own) {
        off("font", px(cs.fontSize), el, "font");
        if (cs.display !== "inline" && r.left < 200) edges.add(Math.round(r.left));
      }
    }
    // A box's child past its right edge: a button, link, number, pill or line that sticks
    // out (the water row's «+500», 30 Oct, never seen until the developer said it).
    let overflow = 0;
    for (const box of document.querySelectorAll(".k-box")) {
      const bb = box.getBoundingClientRect();
      if (!bb.width) continue;
      for (const el of box.querySelectorAll("button, a, .k-num, .k-pill, .k-sub")) {
        const e = el.getBoundingClientRect();
        if (e.width && e.right > bb.right + 0.5) overflow++;
      }
    }
    return {
      overflow,
      targets: targets.length,
      small: small.length,
      smallList: small.map((el) => {
        const r = el.getBoundingClientRect();
        const t = (el.textContent || el.getAttribute("aria-label") || "")
          .trim()
          .slice(0, 24);
        return `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} «${t}» ${Math.round(r.width)}×${Math.round(r.height)}`;
      }),
      primary,
      longLists,
      offScale: seen.size,
      edges: edges.size,
      verbForms,
    };
  }, VERBS);
  // The window as tall as the page (not a stitched full-page shot): fixed bars stay where the person sees them.
  if (SHOTS) {
    const h = await p.evaluate(() =>
      Math.min(
        6000,
        Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
      ),
    );
    await p.setViewportSize({ width: W, height: Math.max(844, h) });
    await p.waitForTimeout(600);
    await p.screenshot({
      path:
        SHOTS +
        "/" +
        (name.replace(/[^a-z0-9:]+/gi, "_").replace(/^_|_$/g, "") || "root") +
        ".png",
    });
    await p.setViewportSize({ width: W, height: 844 });
  }
  for (const [v, fs_] of Object.entries(r.verbForms))
    for (const f of fs_) forms[v].add(f);
  delete r.verbForms;
  if (arg("--list")) for (const s of r.smallList) console.log(name + "  " + s);
  delete r.smallList;
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
    if (o.offScale !== undefined && r.offScale > o.offScale)
      worse.push(`${name}: ${r.offScale} shapes off the scale (was ${o.offScale})`);
    if (r.overflow > (o.overflow ?? 0))
      worse.push(
        `${name}: ${r.overflow} things past their box's edge (was ${o.overflow ?? 0})`,
      );
    if (o.edges !== undefined && r.edges > o.edges)
      worse.push(`${name}: text starts on ${r.edges} left edges (was ${o.edges})`);
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
    offScale: a.offScale + r.offScale,
  }),
  { targets: 0, small: 0, noPrimary: 0, offScale: 0 },
);
console.log(
  `pages ${Object.keys(report.pages).length} · targets ${sum.targets}, under 44 px ${sum.small} (${Math.round((sum.small / Math.max(1, sum.targets)) * 100)} %) · pages without a primary action ${sum.noPrimary} · shapes off the scale ${sum.offScale}`,
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
