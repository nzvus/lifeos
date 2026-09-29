/**
 * ui/NavBar.tsx — the app's navigation, shaped by screen size:
 *   - phone: a tab bar fixed at the BOTTOM, where the thumb reaches;
 *   - tablet/desktop: a row of links in the header.
 * The current section is highlighted (usePathname tells which one), and
 * aria-current="page" says so to screen readers.
 *
 * The bottom bar pads itself by env(safe-area-inset-bottom) so it clears the
 * iPhone home indicator (needs viewport-fit=cover, set in app/layout.tsx).
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string };

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBar({ links, label }: { links: NavLink[]; label: string }) {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label={label} className="hidden items-baseline gap-x-5 md:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(pathname, l.href) ? "page" : undefined}
            className={`font-display text-lg font-semibold underline-offset-8 hover:underline ${
              isActive(pathname, l.href) ? "underline decoration-herb decoration-4" : ""
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <nav
        aria-label={label}
        className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-ink bg-sheet md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(pathname, l.href) ? "page" : undefined}
            className={`flex-1 border-t-4 py-3 text-center font-display text-sm font-semibold ${
              isActive(pathname, l.href) ? "border-herb text-herb" : "border-transparent"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
