/**
 * app/(app)/settings/page.tsx — URL /settings: preferences, display (this
 * device only), the data export link (GET /api/export, a plain download)
 * and the way to the trash (/settings/trash).
 */
import {
  CalendarRange,
  Download,
  Eye,
  LogOut,
  PersonStanding,
  SlidersHorizontal,
  Sparkles,
  Target,
  Star,
  Trash2,
  UserCog,
  PackagePlus,
  UserPlus,
} from "lucide-react";
import { env } from "@/app/_server/env";
import { getKeyStatus } from "@/core/assistant/repositories/assistant";
import { getBody } from "@/core/energy/repositories/energy";
import { todayIn } from "@/core/shared/dates";
import { AssistantKeyForm } from "@/features/account/settings/AssistantKeyForm";
import { BodyForm } from "@/features/account/settings/BodyForm";
import { GoalForm } from "@/features/account/settings/GoalForm";
import { goalFrom, listGoals } from "@/core/energy/repositories/goals";
import {
  DIET_SPLITS,
  GOAL_KINDS,
  KCAL_FLOORS,
  PROTEIN_PREFERENCES,
} from "@/core/db/schema/goals";
import { describeGoal, KIND_PROTEIN } from "@/core/energy/goal";
import { clearAssistantKeyAction, saveAssistantKeyAction } from "../assistant/actions";
import Link from "next/link";
import { getDisplay } from "@/app/_server/display";
import { getDb } from "@/app/_server/runtime";
import { listFactors } from "@/core/nutrition/repositories/ratings";
import { isAdmin, requireContext } from "@/app/_server/owner";
import { fill } from "@/i18n";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";
import { PackForm } from "@/features/account/settings/PackForm";
import { addStarterAction, importPackAction } from "./pack-actions";
import { createInviteAction, deleteInviteAction } from "./invite-actions";
import { InviteForm, type InviteRow } from "@/features/account/settings/InviteForm";
import { listInvites } from "@/core/auth/invites";
import { SignOutButton } from "@/features/account/auth/SignOutButton";
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
  saveGoalAction,
  saveDisplayAction,
  savePreferencesAction,
  saveSettingsAction,
} from "./actions";
import { buttonClass, TEXT_LINK } from "@/ui/button";
import { dynamicTargetsToday } from "@/core/energy/repositories/outlook";
import { listProfiles } from "@/core/nutrition/repositories/profiles";
import { ProfileList } from "@/features/nutrition/profiles/ProfileList";

export default async function SettingsPage() {
  const { owner, settings, t } = await requireContext();
  const display = await getDisplay();
  const today = todayIn(settings.timezone);
  const [factors, body, assistantStatus, profiles, goals] = await Promise.all([
    listFactors(getDb(), owner),
    getBody(getDb(), owner, today),
    getKeyStatus(getDb(), owner),
    listProfiles(getDb(), owner),
    listGoals(getDb(), owner),
  ]);
  const goal = goalFrom(goals, today);
  const decimalIn = (v: string) => (settings.locale === "it" ? v.replace(".", ",") : v);
  const dynamicToday = await dynamicTargetsToday(getDb(), owner, today, profiles);
  // ADR-0034: invitations, for admins only.
  const admin = await isAdmin();
  const now = new Date();
  const short = new Intl.DateTimeFormat(settings.locale === "it" ? "it-IT" : "en-GB", {
    day: "numeric",
    month: "short",
    timeZone: settings.timezone,
  });
  const invites: InviteRow[] = admin
    ? (await listInvites(getDb(), owner)).map((i) => ({
        id: i.id,
        when: fill(t.invites.created, {
          day: short.format(i.createdAt),
          until: short.format(i.expiresAt),
        }),
        state: i.usedAt ? "used" : i.expiresAt <= now ? "expired" : "pending",
        usedEmail: i.usedEmail,
      }))
    : [];
  // Every IANA time zone the server's runtime knows, for suggestions.
  const timeZones = Intl.supportedValuesOf("timeZone");
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
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
        title={t.settings.display.title}
        icon={<Eye size={20} aria-hidden="true" />}
      >
        <p className="text-muted">{t.settings.display.hint}</p>
        <SettingsForm
          part="theme"
          action={saveSettingsAction}
          initial={settingsFormValues(settings)}
          timeZones={timeZones}
          t={{ settings: t.settings, errors: t.errors }}
        />
        <DisplayForm
          action={saveDisplayAction}
          initial={display}
          t={{
            ...t.settings.display,
            saved: t.settings.saved,
            saving: t.settings.autoSaving,
          }}
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
      {/* ADR-0043/0045: the goal owns the rate, planned from target and day. */}
      <Section
        id="goal"
        title={t.energy.weightGoal.title}
        icon={<Target size={20} aria-hidden="true" />}
        subtitle={t.energy.weightGoal.hint}
      >
        {!goal && <p className="text-meta text-muted">{t.energy.weightGoal.none}</p>}
        <GoalForm
          action={saveGoalAction}
          initial={{
            // A goal from before ADR-0045 has no kind: read it from its rate's sign.
            kind:
              goal?.kind ??
              (!goal || Number(goal.ratePctWeek) === 0
                ? "maintain"
                : Number(goal.ratePctWeek) < 0
                  ? "lose"
                  : "gain"),
            // The form reads a comma or a point; show the locale's.
            targetKg: decimalIn(goal?.targetKg ?? ""),
            targetDay: goal?.targetDay ?? "",
            kcalFloor: goal?.kcalFloor ?? "standard",
            protein: goal?.protein ?? "moderate",
            split: goal?.split ?? "balanced",
            checkInWeekday: String(goal?.checkInWeekday ?? 1),
          }}
          choices={{
            kind: GOAL_KINDS,
            kcalFloor: KCAL_FLOORS,
            protein: PROTEIN_PREFERENCES,
            split: DIET_SPLITS,
          }}
          kindProtein={KIND_PROTEIN}
          plan={
            goal && body.weightKg
              ? describeGoal(goal, Number(body.weightKg), today)
              : null
          }
          locale={settings.locale}
          t={{ energy: t.energy, errors: t.errors, settings: t.settings }}
        />
      </Section>
      {/* Design review S5: the day types are set up here; Progress shows how it goes. */}
      <Section
        id="day-types"
        title={t.trends.dayTypes}
        icon={<CalendarRange size={20} aria-hidden="true" />}
        aside={
          <Link href="/profiles/new?from=/settings%23day-types" className={TEXT_LINK}>
            {t.profiles.newTitle}
          </Link>
        }
      >
        <p className="text-meta text-muted">{t.profiles.intro}</p>
        <ProfileList
          profiles={profiles}
          today={dynamicToday}
          locale={settings.locale}
          t={t}
        />
      </Section>
      {env().ASSISTANT_ENABLED === "true" && (
        <Section
          title={t.assistant.keyTitle}
          icon={<Sparkles size={20} aria-hidden="true" />}
        >
          <p className="text-muted">{t.assistant.keyHint}</p>
          {env().ASSISTANT_KEY_SECRET ? (
            <AssistantKeyForm
              action={saveAssistantKeyAction}
              clear={clearAssistantKeyAction}
              status={assistantStatus}
              t={{ assistant: t.assistant, errors: t.errors, settings: t.settings }}
            />
          ) : (
            <p className="text-meta">{t.assistant.noSecret}</p>
          )}
        </Section>
      )}
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
        title={t.settings.exportTitle}
        icon={<Download size={20} aria-hidden="true" />}
      >
        <p className="text-muted">{t.settings.exportHint}</p>
        {/* A plain link, not a fetch: the browser handles the file download. */}
        <a href="/api/export" className={`self-start ${buttonClass()}`}>
          {t.settings.export}
        </a>
      </Section>
      {admin && (
        <Section
          title={t.invites.title}
          icon={<UserPlus size={20} aria-hidden="true" />}
          subtitle={t.invites.hint}
        >
          <InviteForm
            invites={invites}
            create={createInviteAction}
            remove={deleteInviteAction}
            t={t.invites}
          />
        </Section>
      )}
      {/* ADR-0034: add the starter, or a pack from a file (only what is missing). */}
      <Section title={t.packs.title} icon={<PackagePlus size={20} aria-hidden="true" />}>
        <p className="text-muted">{t.packs.hint}</p>
        <PackForm
          addStarter={addStarterAction}
          importPack={importPackAction}
          t={t.packs}
        />
      </Section>
      <Section title={t.trash.title} icon={<Trash2 size={20} aria-hidden="true" />}>
        <p className="text-muted">{t.trash.hint}</p>
        <Link href="/settings/trash" className={`self-start ${buttonClass()}`}>
          {t.trash.open}
        </Link>
      </Section>
      {/* Design review S3: sign out here, at the end — rare, and not one tap away. */}
      <Section title={t.settings.account} icon={<LogOut size={20} aria-hidden="true" />}>
        <SignOutButton label={t.nav.signOut} compact={false} />
      </Section>
    </div>
  );
}
