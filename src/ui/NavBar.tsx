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
 *
 * Settings is not a tab (2026-10-01: too many tabs for a phone): it is an
 * icon button in the header on every screen (`NavIconLink`).
 *
 * Tabs group what the person does, not data types (design review S2,
 * 2026-10-02), by moment since ADR-0035: Today · Plan · Training · Food
 * (meals, ingredients, pantry) · Progress; the Assistant is a header icon.
 * `match` lists the other paths a tab owns.
 */
"use client";

import {
  CalendarDays,
  CalendarRange,
  Carrot,
  Dumbbell,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClass } from "./button";

const ICONS = {
  today: CalendarDays,
  plan: CalendarRange,
  meals: UtensilsCrossed,
  ingredients: Carrot,
  targets: Target,
  progress: TrendingUp,
  training: Dumbbell,
  settings: Settings,
  assistant: Sparkles,
} satisfies Record<string, LucideIcon>;

type NavLink = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  /** Other paths this tab owns (Food: /ingredients, /pantry). */
  match?: readonly string[];
};

function isActive(pathname: string, href: string, match: readonly string[] = []) {
  return [href, ...match].some((h) =>
    h === "/" ? pathname === "/" : pathname === h || pathname.startsWith(`${h}/`),
  );
}

export function NavBar({ links, label }: { links: NavLink[]; label: string }) {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label={label} className="hidden items-center gap-x-5 md:flex">
        {links.map((l) => {
          const Icon = ICONS[l.icon];
          const active = isActive(pathname, l.href, l.match);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 font-display text-item font-semibold underline-offset-8 hover:underline ${
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
        className="fixed inset-x-0 bottom-0 z-30 flex rule-t-medium border-ink bg-sheet editing:hidden md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {links.map((l) => {
          const Icon = ICONS[l.icon];
          const active = isActive(pathname, l.href, l.match);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-auto flex-col items-center gap-0.5 rule-t-strong py-2 font-nav text-meta font-semibold tracking-tight ${
                active ? "border-herb text-herb" : "border-transparent"
              }`}
            >
              <Icon size={22} aria-hidden="true" />
              {/* A wide font (Cruscotto's monospace) must not run into the next tab. */}
              <span className="w-full truncate text-center">{l.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

/** An icon-only link in the header (settings), highlighted when current. */
export function NavIconLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}) {
  const pathname = usePathname();
  const Icon = ICONS[icon];
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      aria-current={active ? "page" : undefined}
      className={`${buttonClass({ variant: "quiet", iconOnly: true })} ${active ? "text-herb" : ""}`}
    >
      <Icon size={20} aria-hidden="true" />
    </Link>
  );
}
