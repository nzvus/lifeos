/**
 * app/(app)/money/receipts/page.tsx — URL /money/receipts: my receipts
 * (ADR-0036), newest first; each opens the movement it became.
 */
import { Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listReceipts } from "@/core/money/repositories/receipts";
import { todayIn } from "@/core/shared/dates";
import { formatCents } from "@/core/shared/format";
import { MoneyNav } from "@/features/money/MoneyNav";
import { buttonClass } from "@/ui/button";
import { PageHeader } from "@/ui/PageHeader";
import { INTL } from "../data";

export default async function ReceiptsPage() {
  const { owner, settings, t } = await requireContext();
  const m = t.money;
  const receipts = await listReceipts(getDb(), owner);
  const date = new Intl.DateTimeFormat(INTL[settings.locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={m.title} quiet />
      <MoneyNav current="receipts" month={todayIn(settings.timezone).slice(0, 7)} t={m} />
      <Link href="/money/receipts/new" className={`self-start ${buttonClass()}`}>
        <Plus size={18} aria-hidden="true" />
        {m.newReceipt}
      </Link>
      {receipts.length === 0 ? (
        <p className="text-muted">{m.noReceipts}</p>
      ) : (
        <ul className="flex flex-col">
          {receipts.map((r) => (
            <li key={r.id}>
              <Link
                href={r.movementId ? `/money/${r.movementId}?from=/money/receipts` : "#"}
                className="flex min-h-14 items-center gap-3 rule-b-medium border-hairline px-1 py-2 hover:bg-paper"
              >
                <Receipt size={20} aria-hidden="true" className="text-muted" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold">{r.shop || m.receipts}</span>
                  <span className="text-meta text-muted first-letter:uppercase">
                    {`${date.format(new Date(`${r.day}T12:00:00Z`))} · ${r.lines} ${m.lines.toLowerCase()}`}
                  </span>
                </span>
                <span className="font-display font-semibold tabular-nums">
                  {formatCents(-r.totalCents, settings.locale)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
