"use client";
/** The NavBar and ⊕ of `(app)/layout.tsx` (PAT-01): the address says which, `nav.ts` decides. */
import { usePathname, useSearchParams } from "next/navigation";
import { NavBar } from "@lifeos/kit";
import { AREA_HREF } from "../places";
import { navFor } from "./nav";

export function AppNav() {
  const nav = navFor(usePathname(), new URLSearchParams(useSearchParams().toString()));
  if (!nav) return null;
  return (
    <div className="k-nav k-stick">
      <NavBar active={nav.active} hrefs={AREA_HREF} addHref={nav.addHref} />
    </div>
  );
}
