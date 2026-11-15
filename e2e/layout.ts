/**
 * The page's rhythm, measured in the browser (VIS-04, PAT-01; his 14 Nov: «il padding è fatto
 * male… alcune cose hanno i contorni altre no… non esistono tool appositi?»). Runs inside
 * `page.evaluate`: no imports. Used by `layout.spec.ts` (CI) and by hand on the dev server.
 *
 * - gaps: two cards or blocks in a row are `--sp-3` apart, never 0, never a second value;
 * - frames: no card, block or weather card draws a line round itself (colour separates);
 * - stuck: at the page's end, ⊕, the dock and the bar never cover one another, and the dock
 *   sits on the bar (it floated 80 px over it, ⊕ on top of it);
 * - loose: words lying on the page outside any card or header («scritte a caso», 14 Nov);
 * - out: something that sticks out of its card's right edge.
 */
export function measureLayout() {
  const main = document.querySelector("main.k-page");
  if (!main) return { gaps: [], frames: [], stuck: [], loose: [], out: [], want: 0 };
  const want = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--sp-3"),
  );
  const name = (e: Element) =>
    e.tagName.toLowerCase() +
    "." +
    [...e.classList].slice(0, 2).join(".") +
    (e.getAttribute("aria-label") ? "[" + e.getAttribute("aria-label") + "]" : "");
  const shown = (e: Element) => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden";
  };
  const gaps: string[] = [];
  let prev: Element | null = null;
  for (const e of [...main.children].filter(shown)) {
    const card = e.matches(".k-block, .k-section, .k-elenco");
    if (card && prev) {
      const g = Math.round(
        e.getBoundingClientRect().top - prev.getBoundingClientRect().bottom,
      );
      if (g !== want) gaps.push(`${name(prev)} → ${name(e)}: ${g} px (want ${want})`);
    }
    prev = card ? e : null;
  }
  const frames = [
    ...main.querySelectorAll(
      ":scope > .k-section, :scope > .k-block, :scope > .k-elenco, .k-wx, .k-page > .k-section .k-section",
    ),
  ]
    .filter(shown)
    .filter((e) => {
      const cs = getComputedStyle(e);
      return ["Top", "Right", "Bottom", "Left"].some(
        (s) =>
          parseFloat(cs.getPropertyValue("border-" + s.toLowerCase() + "-width")) > 0,
      );
    })
    .map(name);
  // The page's own pieces: cards, blocks, the header and its chips, the backdrop, the dock, a
  // sheet's foot. Anything else straight in the page is loose.
  const PIECES =
    ".k-block, .k-section, .k-elenco, .k-actions, .k-ph, .k-areafilter, .k-backdrop, .k-dock, .k-toastbar, .k-nav, .k-pagefoot, .k-formfoot, .k-composer, .k-dn, .k-sheet, script, style, template";
  const loose = [...main.children]
    .filter(shown)
    .filter((e) => !e.matches(PIECES) && (e.textContent ?? "").trim() !== "")
    .map((e) => name(e) + " «" + (e.textContent ?? "").trim().slice(0, 40) + "»");
  const out: string[] = [];
  for (const card of main.querySelectorAll(
    ":scope > .k-section, :scope > .k-block, :scope > .k-elenco",
  )) {
    const cb = card.getBoundingClientRect();
    if (!cb.width || getComputedStyle(card).overflowX !== "visible") continue;
    for (const el of card.querySelectorAll(
      "button, a, input, select, .k-num, .k-pill, .k-chip, p, h2, h3",
    )) {
      if (
        el.closest(
          ".k-chips, .k-swipe, .k-scroll, [data-scroll], .k-week, .k-dn, .k-art, .k-part",
        )
      )
        continue;
      const e = el.getBoundingClientRect();
      if (e.width && shown(el) && e.right > cb.right + 1)
        out.push(
          name(el) +
            " «" +
            (el.textContent ?? "").trim().slice(0, 24) +
            "» +" +
            Math.round(e.right - cb.right) +
            " px in " +
            name(card),
        );
    }
  }
  window.scrollTo(0, document.documentElement.scrollHeight);
  const stuck: string[] = [];
  const floats = [".k-fab", ".k-dock", ".k-nav", ".k-pagefoot", ".k-formfoot"]
    .flatMap((s) => [...document.querySelectorAll(s)])
    .filter(shown);
  for (let i = 0; i < floats.length; i++)
    for (let j = i + 1; j < floats.length; j++) {
      const a = floats[i]!.getBoundingClientRect();
      const b = floats[j]!.getBoundingClientRect();
      const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (x > 1 && y > 1) stuck.push(`${name(floats[i]!)} covers ${name(floats[j]!)}`);
    }
  const dock = document.querySelector(".k-dock");
  const nav = document.querySelector(".k-nav");
  if (dock && nav && shown(dock)) {
    const hole = Math.round(
      nav.getBoundingClientRect().top - dock.getBoundingClientRect().bottom,
    );
    if (Math.abs(hole) > 1)
      stuck.push(`the dock is ${hole} px off the bar at the page's end`);
  }
  return { gaps, frames, stuck, loose, out: out.slice(0, 10), want };
}

/**
 * heads: in every Box head, the title, the number, the score and the action sit on one centre
 * line (VIS-40; his 15 Nov «non vedi che i numeri rispetto alle intestazioni e i bottoni sono
 * sfalsati?» — baseline alignment had left them 2–9 px apart). A part more than 16 px away is on
 * a line of its own (a narrow row's value wrapped under the name) and is not compared.
 */
export function measureHeads() {
  const centre = (el: Element | null): number | null => {
    if (!el || !(el as HTMLElement).offsetParent) return null;
    let q = el.getBoundingClientRect();
    if (!el.matches("button, .k-btn, .k-go, .k-vsky")) {
      const t = [el, ...el.querySelectorAll("*")].find((x) =>
        [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()),
      );
      if (t) {
        const r = document.createRange();
        r.selectNodeContents(t);
        q = r.getBoundingClientRect();
      }
    }
    return q.height > 0 ? q.top + q.height / 2 : null;
  };
  const off: string[] = [];
  for (const box of document.querySelectorAll(".k-box")) {
    const line = box.querySelector(":scope > .k-line");
    if (!line) continue;
    const title = centre(line.querySelector(".k-title"));
    if (title === null) continue;
    const parts = [
      ".k-hright .k-num",
      ".k-vsky",
      ".k-vh .n b",
      ".k-trail .k-btn",
      ".k-trail .k-go",
    ]
      .map((s) => [s, centre(line.querySelector(s))] as const)
      .filter((p): p is readonly [string, number] => p[1] !== null)
      .filter(([, y]) => Math.abs(y - title) <= 16);
    for (const [s, y] of parts)
      if (Math.abs(y - title) > 1.5)
        off.push(
          `«${line.querySelector(".k-title")?.textContent?.slice(0, 20)}»: ${s} ${Math.round((y - title) * 10) / 10} px off the title`,
        );
  }
  return off.slice(0, 10);
}
