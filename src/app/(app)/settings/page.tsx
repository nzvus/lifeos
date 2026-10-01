/**
 * app/(app)/settings/page.tsx — URL /settings: preferences, display (this
 * device only), the data export link (GET /api/export, a plain download)
 * and the way to the trash (/settings/trash).
 */
import {
  Download,
  Eye,
  PersonStanding,
  SlidersHorizontal,
  Star,
  Trash2,
  UserCog,
} from "lucide-react";
import { getBody } from "@/core/energy/repositories/energy";
import { todayIn } from "@/core/shared/dates";
import { BodyForm } from "@/features/account/settings/BodyForm";
import Link from "next/link";
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
  saveBodyAction,
  saveDisplayAction,
  savePreferencesAction,
  saveSettingsAction,
} from "./actions";
import { buttonClass } from "@/ui/button";

export default async function SettingsPage() {
  const { owner, settings, t } = await requireContext();
  const display = await getDisplay();
  const [factors, body] = await Promise.all([
    listFactors(getDb(), owner),
    getBody(getDb(), owner, todayIn(settings.timezone)),
  ]);
  // Every IANA time zone the server's runtime knows, for suggestions.
  const timeZones = Intl.supportedValuesOf("timeZone");
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <PageHeader title={t.settings.title} />
      <Section title={t.actions.general} icon={<UserCog size={20} aria-hidden="true" />}>
        <SettingsForm
          action={saveSettingsAction}
          initial={settingsFormValues(settings)}
          timeZones={timeZones}
          t={{ settings: t.settings, errors: t.errors }}
        />
      </Section>
      <Section
        title={t.energy.body}
        icon={<PersonStanding size={20} aria-hidden="true" />}
        subtitle={t.energy.bodyHint}
      >
        <BodyForm
          action={saveBodyAction}
          initial={{
            sex: body.sex ?? "",
            birthYear: body.birthYear ? String(body.birthYear) : "",
            heightCm: body.heightCm ? String(body.heightCm) : "",
          }}
          t={{ energy: t.energy, errors: t.errors, settings: t.settings }}
        />
      </Section>
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
          deleteAction={deleteFactorAction}
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
        <a href="/api/export" className={`self-start ${buttonClass()}`}>
          {t.settings.export}
        </a>
      </Section>
      <Section title={t.trash.title} icon={<Trash2 size={20} aria-hidden="true" />}>
        <p className="text-muted">{t.trash.hint}</p>
        <Link href="/settings/trash" className={`self-start ${buttonClass()}`}>
          {t.trash.open}
        </Link>
      </Section>
    </div>
  );
}
