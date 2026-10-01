/**
 * ui/Section.tsx — a page section: one card (the theme's `panel` surface)
 * with its heading and its content, the same padding on every side. As a
 * <fieldset> (`as="fieldset"`), the heading is also its <legend> (for screen
 * readers; the visible heading is a plain row, since a legend would sit on
 * the card's border), so a group of form fields is announced with its name. `aside` (a count, a total) sits
 * at the right end of the heading, so the heading row uses its full width. The icon takes the theme's
 * accent (herb) unless it carries a colour of its own (a nutrient, a moment).
 * Every section has an icon (S20: the eye finds sections by their icon);
 * `subtitle` is a line of context under the heading (it never squeezes
 * the title, unlike a long `aside`).
 */
import type { ReactNode } from "react";
import { CARD } from "./Card";

const BOX = CARD;
const HEADING = "flex w-full items-center gap-2 font-display text-section font-bold";
const ASIDE = "ml-auto font-display text-meta font-normal text-muted tabular-nums";
/** Pulled up under the heading: it belongs to it, not to the content. */
const SUBTITLE = "-mt-2 text-meta text-muted tabular-nums";

export function Section({
  title,
  children,
  id,
  as = "section",
  icon,
  aside,
  subtitle,
}: {
  title: string;
  children: ReactNode;
  id?: string;
  as?: "section" | "fieldset";
  /** The icon before the heading (decorative). */
  icon: ReactNode;
  /** Optional short summary at the right end of the heading. */
  aside?: ReactNode;
  /** Optional line of context under the heading. */
  subtitle?: ReactNode;
}) {
  if (as === "fieldset") {
    return (
      <fieldset className={BOX}>
        <legend className="sr-only">{title}</legend>
        <div aria-hidden="true" className={HEADING}>
          <span className="inline-flex text-herb">{icon}</span>
          {title}
          {aside && <span className={ASIDE}>{aside}</span>}
        </div>
        {subtitle && <p className={SUBTITLE}>{subtitle}</p>}
        {children}
      </fieldset>
    );
  }
  return (
    <section aria-labelledby={id} className={BOX}>
      <h2 id={id} className={HEADING}>
        <span className="inline-flex text-herb">{icon}</span>
        {title}
        {aside && <span className={ASIDE}>{aside}</span>}
      </h2>
      {subtitle && <p className={SUBTITLE}>{subtitle}</p>}
      {children}
    </section>
  );
}
