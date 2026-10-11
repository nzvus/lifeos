/**
 * features/nutrition/log/DayGo.tsx — moving between days that answers at
 * once (2026-10-11: "scrolling the weeks should be easier and more
 * responsive"). The day page is rendered on the server, so a new day takes
 * a moment: <DayGo> shows where you are going right away (`target`, and
 * `pending` while it loads) and prefetches the days around the shown one.
 * The day arrows, the week strip and the calendar all go through it.
 * Client component.
 */
"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { addDays } from "@/core/shared/dates";
import { useViewHref } from "@/ui/ViewSwitch";

type Go = {
  /** The day shown, or the one being opened. */
  target: string;
  pending: boolean;
  go: (day: string) => void;
  href: (day: string) => string;
};

const Ctx = createContext<Go | null>(null);

export function DayGo({ day, children }: { day: string; children: ReactNode }) {
  const router = useRouter();
  const withView = useViewHref();
  const [pending, start] = useTransition();
  const [target, setTarget] = useState(day);
  const href = (d: string) => withView(`/?day=${d}`);
  // The page came back with the new day (or another link moved it).
  if (!pending && target !== day) setTarget(day);
  useEffect(() => {
    // The neighbours: a day either side, and the same weekday a week either side.
    for (const by of [-1, 1, -7, 7])
      router.prefetch(withView(`/?day=${addDays(day, by)}`));
  }, [day, router, withView]);
  const go = (d: string) => {
    if (d === target) return;
    setTarget(d);
    start(() => router.push(href(d), { scroll: false }));
  };
  return <Ctx.Provider value={{ target, pending, go, href }}>{children}</Ctx.Provider>;
}

export function useDayGo(): Go {
  return useContext(Ctx)!;
}

/** A link to another day that is marked at once (the day arrows). */
export function DayLink({
  day,
  className,
  children,
  ...rest
}: {
  day: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const { go, href } = useDayGo();
  return (
    <a
      href={href(day)}
      onClick={(e) => {
        e.preventDefault();
        go(day);
      }}
      className={className}
      {...rest}
    >
      {children}
    </a>
  );
}
