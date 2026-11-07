"use client";
/**
 * The NavBar and ⊕ of `(app)/layout.tsx` (PAT-01): the address says which, `nav.ts` decides.
 * Its height is published as `--nav-h`, so a sticky «Salva» sits just above it at any text size.
 */
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NavBar } from "@lifeos/kit";
import { AREA_HREF } from "../places";
import { navFor } from "./nav";

export function AppNav() {
  const nav = navFor(usePathname(), new URLSearchParams(useSearchParams().toString()));
  const shown = nav !== null;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const root = document.documentElement.style;
    if (!el) {
      root.removeProperty("--nav-h");
      return;
    }
    const say = () => root.setProperty("--nav-h", el.offsetHeight + "px");
    const watch = new ResizeObserver(say);
    watch.observe(el);
    say();
    return () => watch.disconnect();
  }, [shown]);
  if (!nav) return null;
  return (
    <div className="k-nav k-stick" ref={ref}>
      <NavBar active={nav.active} hrefs={AREA_HREF} addHref={nav.addHref} link={Link} />
    </div>
  );
}
