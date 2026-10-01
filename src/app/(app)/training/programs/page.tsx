/**
 * app/(app)/training/programs/page.tsx — URL /training/programs: my training
 * programs (ADR-0024) and, for the active one, the coming days as the cycle
 * lays them out (a missed session stays due, marked late).
 */
import { CalendarRange } from "lucide-react";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { todayIn } from "@/core/shared/dates";
import { isRest } from "@/core/training/program";
import { getActivePlan, listPrograms } from "@/core/training/repositories/programs";
import { fill } from "@/i18n";
import { Badge } from "@/ui/Badge";
import { CARD } from "@/ui/Card";
import { ListItem } from "@/ui/ListItem";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";
import { TrashMenu } from "@/ui/TrashMenu";
import { deleteProgramAction, restoreProgramAction } from "./actions";

const INTL = { it: "it-IT", en: "en-GB" } as const;

export default async function ProgramsPage() {
  const { owner, settings, t } = await requireContext();
  const p = t.programs;
  const db = getDb();
  const today = todayIn(settings.timezone);
  const [programs, active] = await Promise.all([
    listPrograms(db, owner),
    getActivePlan(db, owner, today, 7),
  ]);
  const date = new Intl.DateTimeFormat(INTL[settings.locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={p.title}
        subtitle={p.subtitle}
        back={{ href: "/training", label: t.training.back }}
        action={{ href: "/training/programs/new", label: p.new }}
      />
      {active && (
        <Section
          title={fill(p.coming, { name: active.program.name })}
          icon={<CalendarRange size={20} aria-hidden="true" />}
        >
          <ol className="grid grid-cols-2 gap-2 @lg:grid-cols-7">
            {active.plan.map((d) => (
              <li
                key={d.day}
                className="tile flex flex-col items-center gap-1 px-2 py-2 text-center"
              >
                <span className="text-meta text-muted">
                  {date.format(new Date(`${d.day}T12:00:00Z`))}
                </span>
                <span className="font-display text-item font-semibold">
                  {isRest(d.slot)
                    ? d.slot.label || p.rest
                    : (active.program.slots.find((s) => s.position === d.slot.position)
                        ?.name ?? "")}
                </span>
                {d.late && <Badge tone="planned">{p.late}</Badge>}
              </li>
            ))}
          </ol>
        </Section>
      )}
      {programs.length === 0 ? (
        <p className={`${CARD} text-muted`}>{p.empty}</p>
      ) : (
        <div className={CARD}>
          <ul className="grid gap-x-8 @3xl:grid-cols-2">
            {programs.map((x) => (
              <ListItem
                key={x.id}
                href={`/training/programs/${x.id}`}
                title={x.name}
                aside={x.active ? <Badge tone="done">{p.activeBadge}</Badge> : undefined}
                action={
                  <TrashMenu
                    id={x.id}
                    name={x.name}
                    trash={deleteProgramAction}
                    restore={restoreProgramAction}
                    labels={t.actions}
                  />
                }
                footer={fill(p.since, {
                  day: date.format(new Date(`${x.startDay}T12:00:00Z`)),
                })}
              >
                <p className="text-meta text-muted">
                  {x.slots.map((s) => s.name || p.rest).join(" → ")}
                </p>
              </ListItem>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
