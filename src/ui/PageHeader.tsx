/**
 * ui/PageHeader.tsx — THE top of a page: an optional "back" link, the title,
 * and an optional primary action ("New ingredient"). Ten pages had their own
 * copy of this markup.
 */
import Link from "next/link";

type LinkSpec = { href: string; label: string };

export function PageHeader({
  title,
  back,
  action,
}: {
  title: string;
  back?: LinkSpec;
  action?: LinkSpec;
}) {
  return (
    <div className="flex flex-col gap-2">
      {back && (
        <Link href={back.href} className="text-meta underline">
          {back.label}
        </Link>
      )}
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-title font-bold">{title}</h1>
        {action && (
          <Link
            href={action.href}
            className="rounded-control bg-herb px-3 py-1 font-display text-item font-semibold whitespace-nowrap text-sheet"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
