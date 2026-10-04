/**
 * features/training/programs/ProgramList.tsx — my training programs
 * (ADR-0024), each with its cycle in order, every item in its colour
 * (ADR-0035). Shown under the Plan's calendar (ADR-0036). Server component;
 * the page passes each program already shaped.
 */
import type { Look } from "@/core/training/calendar";
import type { Messages } from "@/i18n";
import { Badge } from "@/ui/Badge";
import { CARD } from "@/ui/Card";
import { ListItem } from "@/ui/ListItem";
import { PlanChip } from "@/ui/PlanChip";
import { TrashMenu } from "@/ui/TrashMenu";

const NONE: Look = { region: null, pattern: null, cardio: false };

export type ProgramRow = {
  id: string;
  name: string;
  active: boolean;
  /** "Since Mon 1 Sep". */
  since: string;
  slots: {
    position: number;
    label: string;
    items: { key: string; name: string; look: Look }[];
  }[];
};

type Outcome = { ok: boolean; message?: string };

export function ProgramList({
  programs,
  trash,
  restore,
  t,
}: {
  programs: ProgramRow[];
  trash: (id: string) => Promise<Outcome>;
  restore: (id: string) => Promise<Outcome>;
  t: Pick<Messages, "programs" | "actions">;
}) {
  const p = t.programs;
  if (programs.length === 0) return <p className={`${CARD} text-muted`}>{p.empty}</p>;
  return (
    <ul className="grid grid-cols-1 gap-x-8 @3xl:grid-cols-2">
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
              trash={trash}
              restore={restore}
              labels={t.actions}
            />
          }
          footer={x.since}
        >
          <ol className="flex flex-wrap items-center gap-1 text-meta">
            {x.slots.map((sl) => (
              <li key={sl.position} className="inline-flex flex-wrap gap-1">
                {sl.items.length === 0 ? (
                  <PlanChip look={NONE} state="rest" label={sl.label || p.rest} />
                ) : (
                  sl.items.map((it) => (
                    <PlanChip key={it.key} look={it.look} state="done" label={it.name} />
                  ))
                )}
              </li>
            ))}
          </ol>
        </ListItem>
      ))}
    </ul>
  );
}
