/**
 * ui/SortNote.tsx — on a card, the value the list is sorted by ("Protein
 * per 100 kcal: 18.8 g"), so its position explains itself. Nothing while
 * sorting by usage or name (the value is null).
 */
import { ArrowUpDown } from "lucide-react";
import { fill, type Messages } from "@/i18n";

/** "Protein per 100 kcal: 18.8 g": the sort's name, its "relative to", the value. */
export function sortNoteText(
  t: Messages["search"],
  sort: keyof Messages["search"]["sorts"],
  per: keyof Messages["search"]["per"],
  value: string,
): string {
  const what = per === "none" ? t.sorts[sort] : `${t.sorts[sort]} ${t.per[per]}`;
  return fill(t.sortValue, { what, v: value });
}

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
      {sortNoteText(t, sort, per, value)}
    </p>
  );
}
