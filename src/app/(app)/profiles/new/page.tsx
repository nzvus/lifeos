/** app/(app)/profiles/new/page.tsx — URL /profiles/new[?from=PATH]: empty day type form. */
import { requireContext } from "@/app/_server/owner";
import { safeFrom } from "@/core/shared/navigation";
import { ProfileForm } from "@/features/nutrition/profiles/ProfileForm";
import { PageHeader } from "@/ui/PageHeader";
import { createProfileAction } from "../actions";

type Props = { searchParams: Promise<{ from?: string }> };

export default async function NewProfilePage({ searchParams }: Props) {
  const { t } = await requireContext();
  const from = safeFrom((await searchParams).from, "/profiles");
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <PageHeader
        title={t.profiles.newTitle}
        back={{
          href: from,
          label: from === "/profiles" ? t.profiles.back : t.actions.back,
        }}
      />
      <ProfileForm
        from={from}
        action={createProfileAction}
        initial={{}}
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
