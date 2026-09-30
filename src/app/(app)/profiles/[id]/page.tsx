/**
 * app/(app)/profiles/[id]/page.tsx — URL /profiles/<id>: edit a day type,
 * make it the default, or delete it. Untrusted id: validated, owner-checked.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { getProfile } from "@/core/nutrition/repositories/profiles";
import { idInput, profileFormValues } from "@/core/nutrition/validation";
import { ProfileForm } from "@/features/nutrition/profiles/ProfileForm";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import {
  deleteProfileAction,
  makeDefaultProfileAction,
  updateProfileAction,
} from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function EditProfilePage({ params }: Props) {
  const { owner, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const profile = await getProfile(getDb(), owner, id);
  if (!profile) notFound();

  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <Link href="/profiles" className="text-meta underline">
        {t.profiles.back}
      </Link>
      <h1 className="font-display text-title font-bold">{t.profiles.editTitle}</h1>
      <p className="text-meta text-muted">{t.profiles.editNote}</p>
      <ProfileForm
        action={updateProfileAction.bind(null, id)}
        initial={profileFormValues(profile)}
        submitLabel={t.profiles.save}
        t={{ profiles: t.profiles, nutrients: t.nutrients, errors: t.errors }}
      />
      <div className="flex flex-wrap gap-4">
        {!profile.isDefault && (
          <ActionButtonForm
            action={makeDefaultProfileAction.bind(null, id)}
            label={t.profiles.makeDefault}
            variant="quiet"
          />
        )}
        <ActionButtonForm
          action={deleteProfileAction.bind(null, id)}
          label={t.profiles.delete}
        />
      </div>
    </div>
  );
}
