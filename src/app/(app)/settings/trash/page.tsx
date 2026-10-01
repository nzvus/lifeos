/**
 * app/(app)/settings/trash/page.tsx — URL /settings/trash: everything in the
 * trash (ADR-0015), to restore or delete for good; emptied after 30 days by
 * the daily workflow (scripts/purge-trash.ts).
 */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { todayIn } from "@/core/shared/dates";
import { formatNumber } from "@/core/shared/format";
import { listTrash } from "@/core/trash/trash";
import { TrashList } from "@/features/account/trash/TrashList";
import { PageHeader } from "@/ui/PageHeader";
import { purgeFromTrashAction, restoreFromTrashAction } from "./actions";

const INTL = { it: "it-IT", en: "en-GB" } as const;

export default async function TrashPage() {
  const { owner, settings, t } = await requireContext();
  const items = await listTrash(getDb(), owner);
  const date = new Intl.DateTimeFormat(INTL[settings.locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  // A "YYYY-MM-DD" day, shown as a date (noon UTC: no zone can shift it).
  const day = (d: string) => date.format(new Date(`${d}T12:00:00Z`));
  return (
    <div className="flex max-w-page flex-col gap-6">
      <PageHeader
        title={t.trash.title}
        back={{ href: "/settings", label: t.settings.title }}
      />
      <p className="text-muted">{t.trash.hint}</p>
      <TrashList
        rows={items.map((x) => ({
          kind: x.kind,
          id: x.id,
          name:
            x.kind === "measurement"
              ? `${formatNumber(x.name, settings.locale, 1)} kg`
              : x.name,
          day: x.day ? day(x.day) : "",
          // The purge runs once a day: the day it becomes due, in my zone.
          purgeOn: day(todayIn(settings.timezone, new Date(x.purgeAt))),
        }))}
        restore={restoreFromTrashAction}
        purge={purgeFromTrashAction}
        t={{ trash: t.trash, actions: t.actions }}
      />
    </div>
  );
}
