/**
 * core/nutrition/repositories/profiles.ts — kinds of day and their targets
 * (ADR-0008).
 *
 * Two things live here:
 *   1. PROFILES: user-defined kinds of day ("Palestra", "Corsa", "Riposo"),
 *      each with daily targets. At most one is the default (the database
 *      enforces it with a partial unique index).
 *   2. DAY PLANS: which profile a given day follows, with a COPY of the
 *      profile's targets (same idea as ADR-0007 for food): editing or
 *      deleting a profile never changes a day that is already fixed.
 *
 * What targets does a day have? (getDayTargets)
 *   - the day has a plan          -> the plan's copy       ("fixed")
 *   - no plan, a default exists   -> the default, LIVE      ("default")
 *   - neither                      -> no targets            ("none")
 * A day gets its plan when the user picks a profile for it, or automatically
 * when the first food of that day is logged (ensureDayPlan, called by
 * log.ts). So every day with food has frozen targets.
 *
 * Tested in profiles.test.ts (including the cross-user test).
 */
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import type { Db } from "../../db/client";
import { dayPlans, dayProfiles } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { live } from "../../shared/trash";
import { fail, ok, pgErrorCode, type Result } from "../../shared/result";
import { NUTRIENT_KEYS, type NutrientKey } from "../nutrients";
import type { ProfileInput } from "../validation";

export type Targets = Record<NutrientKey, string | null>;
export type DayProfile = typeof dayProfiles.$inferSelect;

/** What a profile write needs; the ADR-0014 fields default (fixed) when absent. */
export type ProfileWrite = Omit<ProfileInput, keyof DynamicFields> &
  Partial<DynamicFields>;
type DynamicFields = Pick<
  ProfileInput,
  "mode" | "deficitKcal" | "proteinGPerKg" | "fatGPerKg"
>;

/** ADR-0014: a dynamic day's parameters (its targets come from core/energy). */
export type DynamicPlan = {
  deficitKcal: number;
  proteinGPerKg: string;
  fatGPerKg: string;
};

export type DayTargets =
  | {
      source: "fixed";
      profileId: string | null;
      name: string;
      targets: Targets;
      dynamic: DynamicPlan | null;
    }
  | {
      source: "default";
      profileId: string;
      name: string;
      targets: Targets;
      dynamic: DynamicPlan | null;
    }
  | { source: "none" };

/** The dynamic parameters of a profile or plan row, or null when fixed. */
function dynamicOf(row: {
  mode: string;
  deficitKcal: number;
  proteinGPerKg: string;
  fatGPerKg: string;
}): DynamicPlan | null {
  return row.mode === "dynamic"
    ? {
        deficitKcal: row.deficitKcal,
        proteinGPerKg: row.proteinGPerKg,
        fatGPerKg: row.fatGPerKg,
      }
    : null;
}

/** The eight target values of a profile or plan row. */
export function targetsOf(row: Record<NutrientKey, string | null>): Targets {
  const t = {} as Targets;
  for (const k of NUTRIENT_KEYS) t[k] = row[k];
  return t;
}

/** A targets object with every value empty (for "no targets"). */
export function emptyTargets(): Targets {
  const t = {} as Targets;
  for (const k of NUTRIENT_KEYS) t[k] = null;
  return t;
}

/** My profiles, the default first, then by name. */
export async function listProfiles(db: Db, owner: Owner): Promise<DayProfile[]> {
  return db
    .select()
    .from(dayProfiles)
    .where(and(ownedBy(dayProfiles, owner), live(dayProfiles)))
    .orderBy(desc(dayProfiles.isDefault), asc(dayProfiles.name));
}

export async function getProfile(
  db: Db,
  owner: Owner,
  id: string,
): Promise<DayProfile | null> {
  const [row] = await db
    .select()
    .from(dayProfiles)
    .where(and(ownedBy(dayProfiles, owner), live(dayProfiles), eq(dayProfiles.id, id)));
  return row ?? null;
}

/** The default profile, or null if there is none. */
export async function getDefaultProfile(
  db: Db,
  owner: Owner,
): Promise<DayProfile | null> {
  const [row] = await db
    .select()
    .from(dayProfiles)
    .where(
      and(
        ownedBy(dayProfiles, owner),
        live(dayProfiles),
        eq(dayProfiles.isDefault, true),
      ),
    );
  return row ?? null;
}

/** The default profile's targets, or null if there is no default profile. */
export async function getDefaultTargets(db: Db, owner: Owner): Promise<Targets | null> {
  const def = await getDefaultProfile(db, owner);
  return def ? targetsOf(def) : null;
}

/** Creates a profile. The FIRST profile becomes the default automatically. */
export async function createProfile(
  db: Db,
  owner: Owner,
  input: ProfileWrite,
): Promise<Result<DayProfile>> {
  const isFirst = (await listProfiles(db, owner)).length === 0;
  try {
    const [row] = await db
      .insert(dayProfiles)
      .values({ ...input, userId: owner.id, isDefault: isFirst })
      .returning();
    return ok(row!);
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ name: "duplicate_name" });
    throw e;
  }
}

/** Changes name and targets. Days already fixed keep their copy (ADR-0008). */
export async function updateProfile(
  db: Db,
  owner: Owner,
  id: string,
  input: ProfileWrite,
): Promise<Result<DayProfile>> {
  try {
    const [row] = await db
      .update(dayProfiles)
      .set(input)
      .where(and(ownedBy(dayProfiles, owner), live(dayProfiles), eq(dayProfiles.id, id)))
      .returning();
    return row ? ok(row) : fail({ _form: "not_found" });
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ name: "duplicate_name" });
    throw e;
  }
}

/**
 * Makes one of my profiles the default. In a transaction, and in this order
 * (clear the old default, THEN set the new one), because the unique index
 * allows only one default at any moment, even inside a transaction.
 */
export async function setDefaultProfile(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  if (!(await getProfile(db, owner, id))) return fail({ _form: "not_found" });
  await db.transaction(async (tx) => {
    await tx
      .update(dayProfiles)
      .set({ isDefault: false })
      .where(and(ownedBy(dayProfiles, owner), eq(dayProfiles.isDefault, true)));
    await tx
      .update(dayProfiles)
      .set({ isDefault: true })
      .where(and(ownedBy(dayProfiles, owner), live(dayProfiles), eq(dayProfiles.id, id)));
  });
  return ok(null);
}

/**
 * Moves a day type to the trash (ADR-0015); the default one: "is_default".
 * Days already planned with it keep their own copy of its targets
 * (ADR-0008), so nothing past changes.
 */
export async function deleteProfile(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const profile = await getProfile(db, owner, id);
  if (!profile) return fail({ _form: "not_found" });
  if (profile.isDefault) return fail({ _form: "is_default" });
  await db
    .update(dayProfiles)
    .set({ deletedAt: new Date() })
    .where(and(ownedBy(dayProfiles, owner), eq(dayProfiles.id, id)));
  return ok(null);
}

/** Takes a day type out of the trash; a live namesake created since: "duplicate_name". */
export async function restoreProfile(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  try {
    const restored = await db
      .update(dayProfiles)
      .set({ deletedAt: null })
      .where(
        and(
          ownedBy(dayProfiles, owner),
          isNotNull(dayProfiles.deletedAt),
          eq(dayProfiles.id, id),
        ),
      )
      .returning({ id: dayProfiles.id });
    return restored.length ? ok(null) : fail({ _form: "not_found" });
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ _form: "duplicate_name" });
    throw e;
  }
}

/** The targets that apply to a day (see the header for the three cases). */
export async function getDayTargets(
  db: Db,
  owner: Owner,
  day: string,
): Promise<DayTargets> {
  const [plan] = await db
    .select()
    .from(dayPlans)
    .where(and(ownedBy(dayPlans, owner), eq(dayPlans.day, day)));
  if (plan) {
    return {
      source: "fixed",
      profileId: plan.profileId,
      name: plan.profileName,
      targets: targetsOf(plan),
      dynamic: dynamicOf(plan),
    };
  }
  const def = await getDefaultProfile(db, owner);
  if (def) {
    return {
      source: "default",
      profileId: def.id,
      name: def.name,
      targets: targetsOf(def),
      dynamic: dynamicOf(def),
    };
  }
  return { source: "none" };
}

/** Writes (or overwrites) a day's plan as a copy of `profile`. */
async function writePlan(db: Db, owner: Owner, day: string, profile: DayProfile) {
  const values = {
    profileId: profile.id,
    profileName: profile.name,
    ...targetsOf(profile),
    // ADR-0014: a dynamic day copies its parameters, not numbers.
    mode: profile.mode,
    deficitKcal: profile.deficitKcal,
    proteinGPerKg: profile.proteinGPerKg,
    fatGPerKg: profile.fatGPerKg,
  };
  await db
    .insert(dayPlans)
    .values({ userId: owner.id, day, ...values })
    .onConflictDoUpdate({ target: [dayPlans.userId, dayPlans.day], set: values });
}

/**
 * The user picks a profile for a day: copy its targets onto the day, now.
 * Picking the same profile again after editing it refreshes the copy; that
 * is the one deliberate way to apply edited targets to a fixed day.
 */
export async function setDayProfile(
  db: Db,
  owner: Owner,
  day: string,
  profileId: string,
): Promise<Result<null>> {
  const profile = await getProfile(db, owner, profileId); // owner-checked
  if (!profile) return fail({ profileId: "not_found" });
  await writePlan(db, owner, day, profile);
  return ok(null);
}

/**
 * Called when food is logged: if the day has no plan yet and a default
 * profile exists, fix the day to the default's current targets. Does nothing
 * if the day is already fixed or there are no profiles.
 */
export async function ensureDayPlan(db: Db, owner: Owner, day: string): Promise<void> {
  const current = await getDayTargets(db, owner, day);
  if (current.source !== "default") return;
  const def = await getProfile(db, owner, current.profileId);
  if (!def) return;
  await db
    .insert(dayPlans)
    .values({
      userId: owner.id,
      day,
      profileId: def.id,
      profileName: def.name,
      ...targetsOf(def),
    })
    .onConflictDoNothing(); // someone fixed it in between: keep theirs
}
