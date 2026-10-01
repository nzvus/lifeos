/**
 * core/energy/repositories/energy.ts — the facts the energy model needs
 * (ADR-0014), gathered for one day and one owner: body data (settings),
 * the weight on that day (latest measurement up to it), the declared
 * activity (day_activity, default "mixed") and the day's sessions with
 * their burn ranges (ADR-0005). Also saves body data and activity.
 *
 * Tested in: energy.test.ts.
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "../../db/client";
import { dayActivity, userSettings } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { burnRange, weightAt } from "../../training/analysis";
import { listMeasurements } from "../../training/repositories/measurements";
import { listSessions } from "../../training/repositories/sessions";
import {
  dayEnergy,
  missingBody,
  type ActivityLevel,
  type Body,
  type DayFacts,
  type Energy,
  type MissingBody,
} from "../energy";
import type { ActivityInput, BodyInput } from "../validation";

export type DayEnergyView = {
  body: Body;
  missing: MissingBody;
  activity: { level: ActivityLevel; walkingMin: number | null; steps: number | null };
  /** null when body data is missing. */
  energy: Energy | null;
};

export async function getBody(db: Db, owner: Owner, day: string): Promise<Body> {
  const [[s], measurements] = await Promise.all([
    db
      .select({
        sex: userSettings.sex,
        birthYear: userSettings.birthYear,
        heightCm: userSettings.heightCm,
      })
      .from(userSettings)
      .where(ownedBy(userSettings, owner)),
    listMeasurements(db, owner),
  ]);
  return {
    sex: s?.sex === "male" || s?.sex === "female" ? s.sex : null,
    birthYear: s?.birthYear ?? null,
    heightCm: s?.heightCm ?? null,
    weightKg: weightAt(measurements, day),
  };
}

/** Body data from Settings; creates the settings row if there is none yet. */
export async function saveBody(db: Db, owner: Owner, input: BodyInput): Promise<void> {
  await db
    .insert(userSettings)
    .values({ userId: owner.id, ...input })
    .onConflictDoUpdate({ target: userSettings.userId, set: input });
}

export async function setDayActivity(
  db: Db,
  owner: Owner,
  day: string,
  input: ActivityInput,
): Promise<void> {
  await db
    .insert(dayActivity)
    .values({ userId: owner.id, day, ...input })
    .onConflictDoUpdate({ target: [dayActivity.userId, dayActivity.day], set: input });
}

export async function getDayEnergy(
  db: Db,
  owner: Owner,
  day: string,
): Promise<DayEnergyView> {
  const [body, [act], sessions, measurements] = await Promise.all([
    getBody(db, owner, day),
    db
      .select()
      .from(dayActivity)
      .where(and(ownedBy(dayActivity, owner), eq(dayActivity.day, day))),
    listSessions(db, owner, day, day),
    listMeasurements(db, owner),
  ]);
  const level = (act?.level as ActivityLevel | undefined) ?? "mixed";
  const activity = {
    level,
    walkingMin: act?.walkingMin ?? null,
    steps: act?.steps ?? null,
  };
  const kg = weightAt(measurements, day);
  const facts: DayFacts = {
    day,
    ...activity,
    sessions: sessions.map((s) => ({
      status: s.status,
      burn: burnRange(s, kg),
      durationMin: s.durationMin,
    })),
  };
  return { body, missing: missingBody(body), activity, energy: dayEnergy(body, facts) };
}
