/**
 * app/(app)/profiles/new/page.tsx — URL /profiles/new[?from=PATH]: empty
 * day type form. With a goal, a new type starts dynamic: it follows the
 * goal (ADR-0046).
 */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { goalKind } from "@/core/energy/goal";
import { goalFrom, listGoals } from "@/core/energy/repositories/goals";
import { todayIn } from "@/core/shared/dates";
import { safeFrom } from "@/core/shared/navigation";
import { ProfileForm } from "@/features/nutrition/profiles/ProfileForm";
import { PageHeader } from "@/ui/PageHeader";
import { createProfileAction } from "../actions";

type Props = { searchParams: Promise<{ from?: string }> };

export default async function NewProfilePage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const goal = goalFrom(await listGoals(getDb(), owner), todayIn(settings.timezone));
  const from = safeFrom((await searchParams).from, "/settings#day-types");
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <PageHeader
        title={t.profiles.newTitle}
        back={{
          href: from,
          label: from === "/settings#day-types" ? t.profiles.back : t.actions.back,
        }}
      />
      <ProfileForm
        from={from}
        action={createProfileAction}
        initial={goal ? { mode: "dynamic" } : {}}
        followsGoal={goal ? t.energy.weightGoal.kindsShort[goalKind(goal)] : null}
        t={{
          profiles: t.profiles,
          nutrients: t.nutrients,
          errors: t.errors,
          actions: t.actions,
          energy: t.energy,
        }}
      />
    </div>
  );
}
