/** app/(app)/profiles/page.tsx — URL /profiles: day types and their targets. */
import { requireContext } from "@/app/_server/owner";
import { PageHeader } from "@/ui/PageHeader";
import { getDb } from "@/app/_server/runtime";
import { listProfiles } from "@/core/nutrition/repositories/profiles";
import { ProfileList } from "@/features/nutrition/profiles/ProfileList";

export default async function ProfilesPage() {
  const { owner, settings, t } = await requireContext();
  const profiles = await listProfiles(getDb(), owner);
  return (
    <>
      <PageHeader
        title={t.profiles.title}
        action={{ href: "/profiles/new", label: t.profiles.newTitle }}
      />
      <p className="text-muted">{t.profiles.intro}</p>
      <ProfileList profiles={profiles} locale={settings.locale} t={t} />
    </>
  );
}
