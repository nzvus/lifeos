/**
 * app/(app)/settings/page.tsx — URL /settings: preferences, display (this
 * device only), and the data export link (GET /api/export, a plain download).
 */
import { getDisplay } from "@/app/_server/display";
import { requireContext } from "@/app/_server/owner";
import { settingsFormValues } from "@/core/nutrition/validation";
import { DisplayForm } from "@/features/account/settings/DisplayForm";
import { SettingsForm } from "@/features/account/settings/SettingsForm";
import { saveDisplayAction, saveSettingsAction } from "./actions";

export default async function SettingsPage() {
  const { settings, t } = await requireContext();
  const display = await getDisplay();
  // Every IANA time zone the server's runtime knows, for suggestions.
  const timeZones = Intl.supportedValuesOf("timeZone");
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <h1 className="font-display text-title font-bold">{t.settings.title}</h1>
      <SettingsForm
        action={saveSettingsAction}
        initial={settingsFormValues(settings)}
        timeZones={timeZones}
        t={{ settings: t.settings, errors: t.errors }}
      />
      <section className="flex flex-col gap-4 rule-t-heavy border-ink pt-3">
        <h2 className="font-display text-section font-bold">
          {t.settings.display.title}
        </h2>
        <p className="text-muted">{t.settings.display.hint}</p>
        <DisplayForm
          action={saveDisplayAction}
          initial={display}
          t={{ ...t.settings.display, saved: t.settings.saved }}
        />
      </section>
      <section className="flex flex-col items-start gap-2 rule-t-heavy border-ink pt-3">
        <h2 className="font-display text-section font-bold">{t.settings.exportTitle}</h2>
        <p className="text-muted">{t.settings.exportHint}</p>
        {/* A plain link, not a fetch: the browser handles the file download. */}
        <a
          href="/api/export"
          className="rule-medium border-ink px-4 py-2 font-display font-semibold"
        >
          {t.settings.export}
        </a>
      </section>
    </div>
  );
}
