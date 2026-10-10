/**
 * app/(app)/profiles/[id]/page.tsx — URL /profiles/<id>[?from=PATH]: edit a
 * day type and its program (ADR-0044); "⋯" makes it the default or moves
 * it to the trash (ADR-0015).
 * Untrusted id: validated, owner-checked.
 */
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { getProfile } from "@/core/nutrition/repositories/profiles";
import { getProgram } from "@/core/nutrition/repositories/programs";
import { MOMENTS } from "@/core/nutrition/moments";
import { STARTERS } from "@/core/nutrition/programs";
import { ProgramForm } from "@/features/nutrition/profiles/ProgramForm";
import { Section } from "@/ui/Section";
import { CalendarClock } from "lucide-react";
import { idInput, profileFormValues } from "@/core/nutrition/validation";
import { safeFrom } from "@/core/shared/navigation";
import { ProfileForm } from "@/features/nutrition/profiles/ProfileForm";
import { PageHeader } from "@/ui/PageHeader";
import { TrashMenu } from "@/ui/TrashMenu";
import {
  deleteProfileAction,
  makeDefaultProfileAction,
  restoreProfileAction,
  saveProgramAction,
  updateProfileAction,
} from "../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function EditProfilePage({ params, searchParams }: Props) {
  const { owner, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const from = safeFrom((await searchParams).from, "/settings#day-types");
  const [profile, program] = await Promise.all([
    getProfile(getDb(), owner, id),
    getProgram(getDb(), owner, id),
  ]);
  if (!profile) notFound();

  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <PageHeader
        title={t.profiles.editTitle}
        back={{
          href: from,
          label: from === "/settings#day-types" ? t.profiles.back : t.actions.back,
        }}
        menu={
          <TrashMenu
            id={id}
            from={from}
            name={profile.name}
            trash={deleteProfileAction}
            restore={restoreProfileAction}
            actions={
              profile.isDefault
                ? []
                : [
                    {
                      label: t.profiles.makeDefault,
                      run: makeDefaultProfileAction,
                      done: t.profiles.isDefault,
                    },
                  ]
            }
            labels={t.actions}
          />
        }
      />
      <p className="text-meta text-muted">{t.profiles.editNote}</p>
      <ProfileForm
        id={id}
        from={from}
        action={updateProfileAction.bind(null, id)}
        initial={profileFormValues(profile)}
        t={{
          profiles: t.profiles,
          nutrients: t.nutrients,
          errors: t.errors,
          actions: t.actions,
          energy: t.energy,
        }}
      />
      <Section
        id="program"
        title={t.dayProgram.title}
        icon={<CalendarClock size={20} aria-hidden="true" />}
        subtitle={t.dayProgram.hint}
      >
        <ProgramForm
          action={saveProgramAction.bind(null, id)}
          initial={program ?? { trainingAt: null, shiftKcal: 0, slots: [] }}
          moments={MOMENTS}
          starters={STARTERS}
          t={{
            dayProgram: t.dayProgram,
            moments: t.moments,
            errors: t.errors,
            settings: t.settings,
          }}
        />
      </Section>
    </div>
  );
}
