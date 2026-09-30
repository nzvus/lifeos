/** app/(app)/profiles/new/page.tsx — URL /profiles/new: empty day type form. */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { ProfileForm } from "@/features/nutrition/profiles/ProfileForm";
import { createProfileAction } from "../actions";

export default async function NewProfilePage() {
  const { t } = await requireContext();
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <Link href="/profiles" className="text-meta underline">
        {t.profiles.back}
      </Link>
      <h1 className="font-display text-title font-bold">{t.profiles.newTitle}</h1>
      <ProfileForm
        action={createProfileAction}
        initial={{}}
        submitLabel={t.profiles.create}
        t={{ profiles: t.profiles, nutrients: t.nutrients, errors: t.errors }}
      />
    </div>
  );
}
