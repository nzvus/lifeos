/**
 * ui/NavBar.tsx — the app's navigation, shaped by screen size:
 *   - phone: a tab bar fixed at the BOTTOM, where the thumb reaches, with an
 *     icon above each label;
 *   - tablet/desktop: a row of icon + label links in the header.
 * The current section is highlighted (usePathname tells which one), and
 * aria-current="page" says so to screen readers.
 *
 * Icons are chosen by NAME: the layout that renders this is a server
 * component, and names are plain data it can pass; the icon components
 * themselves stay here.
 *
 * The bottom bar pads itself by env(safe-area-inset-bottom) so it clears the
 * iPhone home indicator (needs viewport-fit=cover, set in app/layout.tsx).
 */
"use client";

import {
  CalendarDays,
  Carrot,
  Settings,
  Target,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS = {
  today: CalendarDays,
  meals: UtensilsCrossed,
  ingredients: Carrot,
  targets: Target,
  settings: Settings,
} satisfies Record<string, LucideIcon>;

type NavLink = { href: string; label: string; icon: keyof typeof ICONS };

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBar({ links, label }: { links: NavLink[]; label: string }) {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label={label} className="hidden items-center gap-x-5 md:flex">
        {links.map((l) => {
          const Icon = ICONS[l.icon];
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 font-display text-lg font-semibold underline-offset-8 hover:underline ${
                active ? "text-herb underline decoration-4" : ""
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {l.label}
            </Link>
          );
        })}
      </nav>
      <nav
        aria-label={label}
        className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-ink bg-sheet md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {links.map((l) => {
          const Icon = ICONS[l.icon];
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 border-t-4 py-2 font-display text-xs font-semibold ${
                active ? "border-herb text-herb" : "border-transparent"
              }`}
            >
              <Icon size={22} aria-hidden="true" />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
