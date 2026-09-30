/**
 * ui/SortNote.tsx — on a card, the value the list is sorted by ("Protein
 * per 100 kcal: 18.8 g"), so its position explains itself. Nothing while
 * sorting by usage or name (the value is null).
 */
import { ArrowUpDown } from "lucide-react";
import { fill, type Messages } from "@/i18n";

export function SortNote<
  S extends keyof Messages["search"]["sorts"],
  P extends keyof Messages["search"]["per"],
>({
  value,
  sort,
  per,
  t,
}: {
  value: string | null;
  sort: S;
  per: P;
  t: Messages["search"];
}) {
  if (value === null) return null;
  return (
    <p className="inline-flex items-center gap-1 self-start rounded-control bg-paper px-1.5 text-meta text-muted tabular-nums">
      <ArrowUpDown size={12} aria-hidden="true" />
      {fill(t.sortValue, {
        metric: t.sorts[sort],
        per: per === "none" ? "" : t.per[per],
        v: value,
      }).replace("  ", " ")}
    </p>
  );
}
