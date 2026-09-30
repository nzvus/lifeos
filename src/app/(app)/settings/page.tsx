/**
 * app/(app)/settings/page.tsx — URL /settings: preferences, display (this
 * device only), and the data export link (GET /api/export, a plain download).
 */
import { Download, Eye, SlidersHorizontal, Star } from "lucide-react";
import { getDisplay } from "@/app/_server/display";
import { getDb } from "@/app/_server/runtime";
import { listFactors } from "@/core/nutrition/repositories/ratings";
import { requireContext } from "@/app/_server/owner";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";
import { preferencesFormValues } from "@/core/nutrition/preferences";
import { settingsFormValues } from "@/core/nutrition/validation";
import { DisplayForm } from "@/features/account/settings/DisplayForm";
import { PreferencesForm } from "@/features/account/settings/PreferencesForm";
import { FactorList } from "@/features/nutrition/meals/FactorList";
import { SettingsForm } from "@/features/account/settings/SettingsForm";
import {
  createFactorAction,
  deleteFactorAction,
  saveDisplayAction,
  savePreferencesAction,
  saveSettingsAction,
} from "./actions";

export default async function SettingsPage() {
  const { owner, settings, t } = await requireContext();
  const display = await getDisplay();
  const factors = await listFactors(getDb(), owner);
  // Every IANA time zone the server's runtime knows, for suggestions.
  const timeZones = Intl.supportedValuesOf("timeZone");
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <PageHeader title={t.settings.title} />
      <SettingsForm
        action={saveSettingsAction}
        initial={settingsFormValues(settings)}
        timeZones={timeZones}
        t={{ settings: t.settings, errors: t.errors }}
      />
      <Section
        title={t.preferences.title}
        icon={<SlidersHorizontal size={20} aria-hidden="true" />}
      >
        <PreferencesForm
          action={savePreferencesAction}
          initial={preferencesFormValues(settings.preferences)}
          t={{
            preferences: t.preferences,
            moments: t.moments,
            search: t.search,
            trends: t.trends,
            errors: t.errors,
            settings: t.settings,
          }}
        />
      </Section>
      <Section
        title={t.ratings.factorsTitle}
        icon={<Star size={20} aria-hidden="true" />}
      >
        <FactorList
          factors={factors}
          createAction={createFactorAction}
          deleteAction={(id) => deleteFactorAction.bind(null, id)}
          t={{ ratings: t.ratings, errors: t.errors }}
        />
      </Section>
      <Section
        title={t.settings.display.title}
        icon={<Eye size={20} aria-hidden="true" />}
      >
        <p className="text-muted">{t.settings.display.hint}</p>
        <DisplayForm
          action={saveDisplayAction}
          initial={display}
          t={{ ...t.settings.display, saved: t.settings.saved }}
        />
      </Section>
      <Section
        title={t.settings.exportTitle}
        icon={<Download size={20} aria-hidden="true" />}
      >
        <p className="text-muted">{t.settings.exportHint}</p>
        {/* A plain link, not a fetch: the browser handles the file download. */}
        <a
          href="/api/export"
          className="self-start rounded-control rule-medium border-ink px-4 py-2 font-display font-semibold"
        >
          {t.settings.export}
        </a>
      </Section>
    </div>
  );
}
