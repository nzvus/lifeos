/** app/(app)/profiles/new/page.tsx — URL /profiles/new: empty day type form. */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { ProfileForm } from "@/features/nutrition/profiles/ProfileForm";
import { createProfileAction } from "../actions";

export default async function NewProfilePage() {
  const { t } = await requireContext();
  return (
    <>
      <Link href="/profiles" className="text-sm underline">
        {t.profiles.back}
      </Link>
      <h1 className="font-display text-3xl font-bold">{t.profiles.newTitle}</h1>
      <ProfileForm
        action={createProfileAction}
        initial={{}}
        submitLabel={t.profiles.create}
        t={t}
      />
    </>
  );
}
