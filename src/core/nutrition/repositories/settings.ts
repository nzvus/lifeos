/**
 * core/nutrition/repositories/settings.ts — per-user settings: time zone,
 * language and theme (ADR-0010). (Daily targets moved to day profiles, ADR-0008:
 * ./profiles.ts. The old target columns are still in the table, unread,
 * until a later migration drops them.)
 *
 * The row is created lazily: until you save the settings form, `getSettings`
 * returns defaults. "Upsert" (insert, or update if it exists) saves it in one
 * statement, so there is no "read, then decide insert or update" race.
 *
 * Called by: src/app/_server/owner.ts (locale/timezone for every page),
 * src/app/(app)/settings/*, and the day view (targets).
 */
import type { Db } from "../../db/client";
import { userSettings } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { DEFAULT_LOCALE, isLocale, type Locale } from "../../shared/locales";
import { DEFAULT_THEME, isTheme, type Theme } from "../../shared/themes";
import type { SettingsInput } from "../validation";

export type Settings = {
  timezone: string;
  locale: Locale;
  theme: Theme;
};

export const DEFAULT_TIMEZONE = "Europe/Rome";

function defaults(): Settings {
  return { timezone: DEFAULT_TIMEZONE, locale: DEFAULT_LOCALE, theme: DEFAULT_THEME };
}

export async function getSettings(db: Db, owner: Owner): Promise<Settings> {
  const [row] = await db.select().from(userSettings).where(ownedBy(userSettings, owner));
  if (!row) return defaults();
  return {
    timezone: row.timezone,
    // The DB column is plain text; fall back if it ever holds an unknown value.
    locale: isLocale(row.locale) ? row.locale : DEFAULT_LOCALE,
    theme: isTheme(row.theme) ? row.theme : DEFAULT_THEME,
  };
}

export async function saveSettings(
  db: Db,
  owner: Owner,
  input: SettingsInput,
): Promise<void> {
  await db
    .insert(userSettings)
    .values({ userId: owner.id, ...input })
    // Conflict on the primary key (user_id) = row exists: update it instead.
    .onConflictDoUpdate({ target: userSettings.userId, set: input });
}
