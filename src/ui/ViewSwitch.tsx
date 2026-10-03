/**
 * ui/ViewSwitch.tsx — a page's views switched in the browser, instantly
 * (2026-10-03: "it takes 1 second to switch"). The page renders every view
 * once; tapping a view shows it and writes it in the URL (ADR-0033: views
 * as URLs) without asking the server again, so reload, back and links keep
 * working.
 *
 *   <ViewSwitch initial="food" fallback="summary" param="tab">
 *     <ViewNav label=… items=[{ key, href, label, icon }] />
 *     <ViewPanel view="summary">…</ViewPanel>   (hidden, not unmounted)
 *     <ViewLink view="food">Open</ViewLink>      (switches like the nav)
 *     <ViewAwareLink href="/?day=…">             (keeps the open view)
 *   </ViewSwitch>
 *
 * The nav looks like ui/SubNav (same segments).
 */
"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { segmentClass, SUBNAV_CLASS } from "./SubNav";

type Ctx = {
  current: string;
  select: (view: string) => void;
  /** `href` with the open view added (nothing for the fallback view). */
  withView: (href: string) => string;
};

const ViewContext = createContext<Ctx | null>(null);

/** `href` with `view` as `param` — or without it, for the fallback view. */
export function hrefWithView(
  href: string,
  view: string,
  fallback: string,
  param: string,
) {
  const url = new URL(href, "http://x");
  if (view === fallback) url.searchParams.delete(param);
  else url.searchParams.set(param, view);
  return url.pathname + url.search;
}

export function ViewSwitch({
  initial,
  fallback,
  param,
  children,
}: {
  /** The view the server rendered as open (from the URL). */
  initial: string;
  /** The view a URL without `param` means. */
  fallback: string;
  param: string;
  children: ReactNode;
}) {
  const [current, setCurrent] = useState(initial);
  // A new URL from the server (another day, a link) resets the view.
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setCurrent(initial);
  }
  const withView = useCallback(
    (href: string) => hrefWithView(href, current, fallback, param),
    [current, fallback, param],
  );
  const select = useCallback(
    (view: string) => {
      setCurrent(view);
      const url = new URL(window.location.href);
      if (view === fallback) url.searchParams.delete(param);
      else url.searchParams.set(param, view);
      // Next.js keeps its router in step with replaceState (no server call),
      // but only for a state that is not its own: null, not history.state —
      // with its state the router kept the old URL, and a save went back to it.
      window.history.replaceState(null, "", url);
      window.scrollTo({ top: 0 });
    },
    [fallback, param],
  );
  const value = useMemo(
    () => ({ current, select, withView }),
    [current, select, withView],
  );
  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}

/** A plain click switches here; ctrl/cmd-click still opens the link. */
function onPlainClick(e: MouseEvent, run: () => void) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  run();
}

export function ViewNav({
  label,
  items,
}: {
  label: string;
  items: { key: string; href: string; label: string; icon?: ReactNode }[];
}) {
  const ctx = useContext(ViewContext)!;
  return (
    <nav aria-label={label} className={SUBNAV_CLASS}>
      {items.map((it) => {
        const on = it.key === ctx.current;
        return (
          <a
            key={it.key}
            href={it.href}
            aria-current={on ? "page" : undefined}
            onClick={(e) => onPlainClick(e, () => ctx.select(it.key))}
            className={segmentClass(on)}
          >
            {it.icon}
            <span className="truncate">{it.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

/** One view's content: always rendered, shown only when open. */
export function ViewPanel({ view, children }: { view: string; children: ReactNode }) {
  const ctx = useContext(ViewContext)!;
  return (
    <div hidden={ctx.current !== view} className="flex min-w-0 flex-col gap-4">
      {children}
    </div>
  );
}

/** A link to another view of the same page ("Open" on a summary card). */
export function ViewLink({
  view,
  href,
  className,
  children,
}: {
  view: string;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const ctx = useContext(ViewContext)!;
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => onPlainClick(e, () => ctx.select(view))}
    >
      {children}
    </a>
  );
}

/** The open view as a query to add to a URL, "" for the fallback view. */
export function useViewHref(): (href: string) => string {
  return useContext(ViewContext)?.withView ?? ((href) => href);
}

/** A Next.js Link that keeps the open view (another day, same view). */
export function ViewAwareLink({
  href,
  ...rest
}: ComponentProps<typeof Link> & { href: string }) {
  const withView = useViewHref();
  return <Link href={withView(href)} {...rest} />;
}
