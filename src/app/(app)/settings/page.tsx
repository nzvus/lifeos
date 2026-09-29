/**
 * app/(app)/settings/page.tsx — URL /settings: preferences, targets, and the
 * data export link (GET /api/export, a plain download).
 */
import { requireContext } from "@/app/_server/owner";
import { settingsFormValues } from "@/core/nutrition/validation";
import { SettingsForm } from "@/features/account/settings/SettingsForm";
import { saveSettingsAction } from "./actions";

export default async function SettingsPage() {
  const { settings, t } = await requireContext();
  // Every IANA time zone the server's runtime knows, for suggestions.
  const timeZones = Intl.supportedValuesOf("timeZone");
  return (
    <>
      <h1 className="font-display text-3xl font-bold">{t.settings.title}</h1>
      <SettingsForm
        action={saveSettingsAction}
        initial={settingsFormValues(settings)}
        timeZones={timeZones}
        t={t}
      />
      <section className="flex flex-col items-start gap-2 border-t-6 border-ink pt-3">
        <h2 className="font-display text-xl font-bold">{t.settings.exportTitle}</h2>
        <p className="text-muted">{t.settings.exportHint}</p>
        {/* A plain link, not a fetch: the browser handles the file download. */}
        <a
          href="/api/export"
          className="border-2 border-ink px-4 py-2 font-display font-semibold"
        >
          {t.settings.export}
        </a>
      </section>
    </>
  );
}
