/**
 * ui/Section.tsx — a page section: one card (the theme's `panel` surface)
 * with its heading and its content, the same padding on every side. As a
 * <fieldset> (`as="fieldset"`), the heading is also its <legend> (for screen
 * readers; the visible heading is a plain row, since a legend would sit on
 * the card's border), so a group of form fields is announced with its name. `aside` (a count, a total) sits
 * at the right end of the heading, so the heading row uses its full width. The icon takes the theme's
 * accent (herb) unless it carries a colour of its own (a nutrient, a moment).
 */
import type { ReactNode } from "react";
import { CARD } from "./Card";

const BOX = CARD;
const HEADING = "flex w-full items-center gap-2 font-display text-section font-bold";
const ASIDE = "ml-auto font-display text-meta font-normal text-muted tabular-nums";

export function Section({
  title,
  children,
  id,
  as = "section",
  icon,
  aside,
}: {
  title: string;
  children: ReactNode;
  id?: string;
  as?: "section" | "fieldset";
  /** Optional icon before the heading (decorative). */
  icon?: ReactNode;
  /** Optional summary at the right end of the heading. */
  aside?: ReactNode;
}) {
  if (as === "fieldset") {
    return (
      <fieldset className={BOX}>
        <legend className="sr-only">{title}</legend>
        <div aria-hidden="true" className={HEADING}>
          {icon && <span className="inline-flex text-herb">{icon}</span>}
          {title}
          {aside && <span className={ASIDE}>{aside}</span>}
        </div>
        {children}
      </fieldset>
    );
  }
  return (
    <section aria-labelledby={id} className={BOX}>
      <h2 id={id} className={HEADING}>
        {icon && <span className="inline-flex text-herb">{icon}</span>}
        {title}
        {aside && <span className={ASIDE}>{aside}</span>}
      </h2>
      {children}
    </section>
  );
}
