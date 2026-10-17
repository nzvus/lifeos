/**
 * core/account/settings.ts — the person's settings that the app asks for
 * (V-14, first part): sex, birth year and height (E5's micronutrient targets
 * and E4's priors read them), the time zone and when the day starts (E1:
 * what "today" means). One row per person, made on the first save.
 */
import { eq } from "drizzle-orm";
import type { Db } from "../db/db";
import { settings } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";

export type Profile = {
  sex: "male" | "female" | null;
  birthYear: number | null;
  heightCm: string | null;
  timeZone: string;
  /** Minutes after midnight when the logical day starts. */
  boundaryMin: number;
};

export type SettingsInput = Record<
  "sex" | "birthYear" | "heightCm" | "timeZone" | "boundary",
  string
>;
export type SettingsError = Partial<Record<keyof SettingsInput, "invalid" | "range">>;

const DEFAULTS: Profile = {
  sex: null,
  birthYear: null,
  heightCm: null,
  timeZone: "Europe/Rome",
  boundaryMin: 240,
};

/** Whether the runtime knows this IANA zone ("Europe/Rome"). */
export function knownZone(z: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: z });
    return z.includes("/") || z === "UTC";
  } catch {
    return false;
  }
}

/**
 * Pure: the form as settings, or what is wrong. The birth year makes an
 * adult this year (E5's targets are adults'); the day may start from
 * midnight to 11:59.
 */
export function checkSettings(
  raw: SettingsInput,
  thisYear: number,
): { ok: true; profile: Profile } | { ok: false; errors: SettingsError } {
  const errors: SettingsError = {};
  const sex =
    raw.sex === "male" || raw.sex === "female"
      ? raw.sex
      : raw.sex === ""
        ? null
        : undefined;
  if (sex === undefined) errors.sex = "invalid";
  const year = raw.birthYear.trim();
  let birthYear: number | null = null;
  if (year !== "") {
    if (!/^\d{4}$/.test(year)) errors.birthYear = "invalid";
    else if (Number(year) < thisYear - 110 || Number(year) > thisYear - 18)
      errors.birthYear = "range";
    else birthYear = Number(year);
  }
  const h = raw.heightCm.trim().replace(",", ".");
  let heightCm: string | null = null;
  if (h !== "") {
    if (!/^\d{2,3}(\.\d)?$/.test(h)) errors.heightCm = "invalid";
    else if (Number(h) < 100 || Number(h) > 250) errors.heightCm = "range";
    else heightCm = h;
  }
  const timeZone = raw.timeZone.trim();
  if (!knownZone(timeZone)) errors.timeZone = "invalid";
  const m = /^([01]\d):([0-5]\d)$/.exec(raw.boundary.trim());
  const boundaryMin = m ? Number(m[1]) * 60 + Number(m[2]) : -1;
  if (!m) errors.boundary = "invalid";
  else if (boundaryMin >= 12 * 60) errors.boundary = "range";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, profile: { sex: sex!, birthYear, heightCm, timeZone, boundaryMin } };
}

export async function readSettings(db: Db, owner: Owner): Promise<Profile> {
  const [row] = await db
    .select({
      sex: settings.sex,
      birthYear: settings.birthYear,
      heightCm: settings.heightCm,
      timeZone: settings.timezone,
      boundaryMin: settings.dayBoundaryMin,
    })
    .from(settings)
    .where(ownedBy(settings, owner));
  return row ?? DEFAULTS;
}

export async function saveSettings(db: Db, owner: Owner, p: Profile): Promise<void> {
  const set = {
    sex: p.sex,
    birthYear: p.birthYear,
    heightCm: p.heightCm,
    timezone: p.timeZone,
    dayBoundaryMin: p.boundaryMin,
  };
  await db
    .insert(settings)
    .values({ userId: owner.id, ...set })
    .onConflictDoUpdate({ target: settings.userId, set });
}

/** The person's settings row, for tests and scripts: whether it exists. */
export async function hasSettings(db: Db, owner: Owner): Promise<boolean> {
  const rows = await db
    .select({ u: settings.userId })
    .from(settings)
    .where(eq(settings.userId, owner.id));
  return rows.length > 0;
}
