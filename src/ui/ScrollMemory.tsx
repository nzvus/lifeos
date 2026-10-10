/**
 * ui/ScrollMemory.tsx — keeps a page's scroll position across an edit page
 * (2026-10-10: "when I change anything on Today I don't want to go back to
 * the top"). While the page scrolls, its position is kept for its URL in
 * this tab (sessionStorage). An edit page that returns here
 * (ui/useEditFlow) leaves a note first; on arrival with that note, the
 * position comes back. Storage may be unavailable: then nothing happens.
 */
"use client";

import { useEffect } from "react";

const RETURN = "lifeos:return";
const keyOf = (url: string) => `lifeos:scroll:${url}`;
const here = () => window.location.pathname + window.location.search;

/** Called by an edit page just before it goes back to `url`. */
export function noteReturn(url: string) {
  try {
    sessionStorage.setItem(RETURN, url);
  } catch {
    // no storage: the page opens at the top, as before
  }
}

export function ScrollMemory() {
  useEffect(() => {
    try {
      const back = sessionStorage.getItem(RETURN);
      if (back === here()) {
        sessionStorage.removeItem(RETURN);
        const y = Number(sessionStorage.getItem(keyOf(back)));
        if (y > 0) window.scrollTo({ top: y });
      }
    } catch {
      // no storage
    }
    let frame = 0;
    const save = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(keyOf(here()), String(Math.round(window.scrollY)));
        } catch {
          // no storage
        }
      });
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", save);
    };
  }, []);
  return null;
}
