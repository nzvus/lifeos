/**
 * features/nutrition/log/MovementSheet.tsx — the day's movement form
 * (ADR-0032) in a sheet (#day-move), opened by the "+", the day's chips or
 * the Energy section's link. Rendered by the page itself, not inside a
 * collapsible section: a closed section's hidden content would hide an
 * open sheet with it.
 */
import { Footprints } from "lucide-react";
import type { Energy } from "@/core/energy/energy";
import type { FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Sheet } from "@/ui/Sheet";
import { ActivityForm } from "./ActivityForm";

export function MovementSheet({
  action,
  activity,
  energy,
  t,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  activity: { level: string; walkingMin: number | null; steps: number | null };
  energy: Energy | null;
  t: Pick<Messages, "energy" | "errors" | "actions">;
}) {
  return (
    <Sheet
      id="day-move"
      title={t.energy.activity}
      icon={<Footprints size={20} aria-hidden="true" />}
      closeLabel={t.actions.close}
    >
      <ActivityForm
        action={action}
        initial={activity}
        estimate={
          energy
            ? {
                // ADR-0032: what the model filled in from the other fields.
                steps: activity.steps === null ? energy.inputs.walk.estimatedSteps : null,
                walkingMin: null,
              }
            : undefined
        }
        t={t}
      />
    </Sheet>
  );
}
