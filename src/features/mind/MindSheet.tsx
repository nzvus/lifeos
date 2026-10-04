/**
 * features/mind/MindSheet.tsx — the day's check-in in a sheet (#day-mind),
 * opened by Today's chip and "+" (ADR-0038). The form saves itself.
 */
import { Brain } from "lucide-react";
import Link from "next/link";
import type { Checkin } from "@/core/mind/repositories/checkins";
import type { FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { TEXT_LINK } from "@/ui/button";
import { Sheet } from "@/ui/Sheet";
import { CheckinForm } from "./CheckinForm";

export function MindSheet({
  day,
  checkin,
  action,
  t,
}: {
  day: string;
  checkin: Checkin | null;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  t: Pick<Messages, "mind" | "actions" | "settings">;
}) {
  return (
    <Sheet
      id="day-mind"
      title={t.mind.checkin}
      icon={<Brain size={20} aria-hidden="true" />}
      closeLabel={t.actions.close}
    >
      <CheckinForm
        // Another day = a fresh form with that day's values.
        key={day}
        day={day}
        initial={{
          mood: checkin?.mood ?? null,
          energy: checkin?.energy ?? null,
          stress: checkin?.stress ?? null,
          note: checkin?.note ?? "",
        }}
        action={action}
        t={{ ...t.mind, saved: t.settings.saved, saving: t.actions.saving }}
      />
      <Link href="/mind" className={`text-meta ${TEXT_LINK}`}>
        {t.mind.seeAll}
      </Link>
    </Sheet>
  );
}
