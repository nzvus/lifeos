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
 * Since ADR-0038: four areas around the day — Body · Food · (Today, a
 * raised circle in the middle) · Money · Mind; the Assistant and Settings
 * are header icons. `match` lists the other paths a tab owns.
 */
"use client";

import {
  Brain,
  CalendarDays,
  Carrot,
  Dumbbell,
  PersonStanding,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { buttonClass } from "./button";

const ICONS = {
  today: CalendarDays,
  meals: UtensilsCrossed,
  ingredients: Carrot,
  targets: Target,
  progress: TrendingUp,
  training: Dumbbell,
  settings: Settings,
  assistant: Sparkles,
  money: Wallet,
  body: PersonStanding,
  mind: Brain,
} satisfies Record<string, LucideIcon>;

type NavLink = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  /**
   * Other paths this tab owns (Food: /ingredients, /pantry). "/path?view=x"
   * owns that view of a page shared by two areas; "x" is also the view
   * when the URL has none, if it is the page's first (Food's trends).
   */
  match?: readonly string[];
  /** The centre of the bar (ADR-0038: Today), drawn as a raised circle on phones. */
  center?: boolean;
};

function isActive(
  pathname: string,
  view: string | null,
  href: string,
  match: readonly string[] = [],
) {
  return [href, ...match].some((h) => {
    const [path, query] = h.split("?");
    if (query) {
      const want = new URLSearchParams(query).get("view");
      // A shared page: this area owns some of its views (the first by default).
      return pathname === path && (view ?? FIRST_VIEW[path!]) === want;
    }
    return h === "/" ? pathname === "/" : pathname === h || pathname.startsWith(`${h}/`);
  });
}

/** The view a shared page shows without ?view= (its first one). */
const FIRST_VIEW: Record<string, string> = { "/profiles": "trends" };

export function NavBar({ links, label }: { links: NavLink[]; label: string }) {
  const pathname = usePathname();
  const view = useSearchParams().get("view");
  return (
    <>
      <nav aria-label={label} className="hidden items-center gap-x-5 md:flex">
        {links.map((l) => {
          const Icon = ICONS[l.icon];
          const active = isActive(pathname, view, l.href, l.match);
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
          const active = isActive(pathname, view, l.href, l.match);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 font-nav text-meta font-semibold tracking-tight ${
                l.center
                  ? active
                    ? "text-herb"
                    : ""
                  : `rule-t-strong ${active ? "border-herb text-herb" : "border-transparent"}`
              }`}
            >
              {l.center ? (
                // The day, in the middle: a raised circle the thumb finds blind.
                <span
                  className={`-mt-7 flex h-14 w-14 items-center justify-center rounded-full shadow-md ring-4 ring-sheet ${
                    active ? "bg-herb text-sheet" : "bg-ink text-sheet"
                  }`}
                >
                  <Icon size={26} aria-hidden="true" />
                </span>
              ) : (
                <Icon size={22} aria-hidden="true" />
              )}
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
  const active = isActive(pathname, null, href);
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
