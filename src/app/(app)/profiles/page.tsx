/** app/(app)/profiles/page.tsx — URL /profiles: day types and their targets. */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listProfiles } from "@/core/nutrition/repositories/profiles";
import { ProfileList } from "@/features/nutrition/profiles/ProfileList";

export default async function ProfilesPage() {
  const { owner, settings, t } = await requireContext();
  const profiles = await listProfiles(getDb(), owner);
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-title font-bold">{t.profiles.title}</h1>
        <Link
          href="/profiles/new"
          className="bg-herb px-3 py-1 font-display text-item font-semibold whitespace-nowrap text-sheet"
        >
          {t.profiles.newTitle}
        </Link>
      </div>
      <p className="text-muted">{t.profiles.intro}</p>
      <ProfileList profiles={profiles} locale={settings.locale} t={t} />
    </>
  );
}
