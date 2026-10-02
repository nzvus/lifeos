/**
 * ui/PageHeader.tsx — THE top of a page: an optional "back" link, the title,
 * an optional primary action ("New ingredient") and an optional "⋯" menu
 * (ui/Menu: duplicate, delete… ADR-0015). Ten pages had their own copy of
 * this markup.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass, TEXT_LINK } from "./button";

type LinkSpec = { href: string; label: string };

export function PageHeader({
  title,
  back,
  action,
  menu,
  subtitle,
}: {
  title: string;
  back?: LinkSpec;
  action?: LinkSpec;
  menu?: ReactNode;
  /** A line under the title saying what the page is for. */
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {back && (
        <Link href={back.href} className={`self-start text-meta ${TEXT_LINK}`}>
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className="font-heading text-title font-bold">{title}</h1>
        {action &&
          (action.href.startsWith("#") ? (
            // A sheet on this page (ui/Sheet): a plain link, so the browser
            // fires the hashchange the sheet listens for.
            <a href={action.href} className={buttonClass({ variant: "primary" })}>
              {action.label}
            </a>
          ) : (
            <Link href={action.href} className={buttonClass({ variant: "primary" })}>
              {action.label}
            </Link>
          ))}
        {menu}
      </div>
      {subtitle && <p className="text-muted">{subtitle}</p>}
    </div>
  );
}
