/**
 * ui/Section.tsx — a page section: the heavy rule above, its heading, its
 * content (the "label" look, one copy instead of one per page). As a
 * <fieldset> (`as="fieldset"`), the heading is its <legend>, so a group of
 * form fields is announced with its name.
 */
import type { ReactNode } from "react";

const BOX = "flex flex-col gap-4 rule-t-heavy border-ink pt-3";
const HEADING = "flex items-center gap-2 font-display text-section font-bold";

export function Section({
  title,
  children,
  id,
  as = "section",
  icon,
}: {
  title: string;
  children: ReactNode;
  id?: string;
  as?: "section" | "fieldset";
  /** Optional icon before the heading (decorative). */
  icon?: ReactNode;
}) {
  if (as === "fieldset") {
    return (
      <fieldset className={BOX}>
        <legend className={HEADING}>
          {icon}
          {title}
        </legend>
        {children}
      </fieldset>
    );
  }
  return (
    <section aria-labelledby={id} className={BOX}>
      <h2 id={id} className={HEADING}>
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
