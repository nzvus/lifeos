"use client";
/**
 * A whole's band at the top of the page (his 21 Nov, §146, §150): once its own card has scrolled
 * above the screen, the whole shrinks to one row of four full bars — the meal box's look, each
 * part a piece of each bar — and lights the part whose box is nearest the top under it (the
 * boxes say their key with `data-part`). A tap goes back to the card. It takes no room in the
 * page: a sticky line of no height holds it (the backdrop's way). The kit knows no type (PAT-81).
 */
import { useEffect, useState } from "react";
import { Nutrients } from "./Nutrients";
import type { NutrientsData } from "./nutrient-rows";

/** The band's height under which a part counts as «at the top» (px). */
const BAND = 64;

export function PartsBand({
  data,
  anchor,
  label,
  startShown = false,
}: {
  data: NutrientsData;
  /** The id of the whole's own card: the band shows once it is above the screen. */
  anchor: string;
  /** What the band is, for a screen reader («Il giorno»). */
  label: string;
  /** Shown from the start (the gallery's photo), before any scroll. */
  startShown?: boolean;
}) {
  const [shown, setShown] = useState(startShown);
  const [lit, setLit] = useState<string | null>(null);
  useEffect(() => {
    const card = document.getElementById(anchor);
    const pick = () => {
      if (card) setShown(card.getBoundingClientRect().bottom < 0);
      else if (!startShown) setShown(false);
      let best: string | null = null;
      let top = Infinity;
      for (const el of document.querySelectorAll<HTMLElement>("[data-part]")) {
        const r = el.getBoundingClientRect();
        if (r.bottom > BAND && r.top < top) {
          top = r.top;
          best = el.dataset["part"] ?? null;
        }
      }
      setLit(best);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [anchor, startShown]);
  const back = () =>
    document
      .getElementById(anchor)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <div className="k-bandline">
      <div
        className={"k-band" + (shown ? " on" : "")}
        role="region"
        aria-label={label}
        aria-hidden={!shown}
        {...(shown ? {} : { inert: true })}
      >
        <Nutrients data={data} part="main" chips={false} inline lit={lit} onTap={back} />
      </div>
    </div>
  );
}
