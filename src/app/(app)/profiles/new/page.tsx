/** app/(app)/profiles/new/page.tsx — URL /profiles/new: empty day type form. */
import { requireContext } from "@/app/_server/owner";
import { PageHeader } from "@/ui/PageHeader";
import { ProfileForm } from "@/features/nutrition/profiles/ProfileForm";
import { createProfileAction } from "../actions";

export default async function NewProfilePage() {
  const { t } = await requireContext();
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <PageHeader
        title={t.profiles.newTitle}
        back={{ href: "/profiles", label: t.profiles.back }}
      />
      <ProfileForm
        action={createProfileAction}
        initial={{}}
        submitLabel={t.profiles.create}
        t={{ profiles: t.profiles, nutrients: t.nutrients, errors: t.errors }}
      />
    </div>
  );
}
