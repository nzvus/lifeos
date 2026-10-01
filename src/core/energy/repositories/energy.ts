/**
 * core/energy/repositories/energy.ts — the facts the energy model needs
 * (ADR-0014), gathered for one day and one owner: body data (settings),
 * the weight on that day (latest measurement up to it), the declared
 * activity (day_activity, default "mixed") and the day's sessions with
 * their burn ranges (ADR-0005). Also saves body data and activity.
 *
 * Tested in: energy.test.ts.
 */
import { and, eq, gte, lte } from "drizzle-orm";
import type { Db } from "../../db/client";
import { dayActivity, userSettings } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { getHistory } from "../../nutrition/repositories/history";
import { addDays } from "../../shared/dates";
import { burnBasis, burnRange, weightAt } from "../../training/analysis";
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
import {
  calibrate,
  WINDOW_DAYS,
  type Calibration,
  type CalibrationDay,
} from "../calibration";
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
        correction: userSettings.energyCorrection,
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
    correction: Number(s?.correction ?? 1),
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

type ActivityRow = typeof dayActivity.$inferSelect;
type SessionRow = Awaited<ReturnType<typeof listSessions>>[number];

/** One day's declared activity (default "mixed") and its sessions → the model's facts. */
function factsOf(
  day: string,
  act: ActivityRow | undefined,
  sessions: readonly SessionRow[],
  kg: string | null,
) {
  const activity = {
    level: (act?.level as ActivityLevel | undefined) ?? "mixed",
    walkingMin: act?.walkingMin ?? null,
    steps: act?.steps ?? null,
  };
  const facts: DayFacts = {
    day,
    ...activity,
    sessions: sessions.map((s) => ({
      status: s.status,
      burn: burnRange(s, kg),
      durationMin: s.durationMin,
      basis: burnBasis(s),
      name: s.label,
    })),
  };
  return { activity, facts };
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
  const { activity, facts } = factsOf(day, act, sessions, weightAt(measurements, day));
  return { body, missing: missingBody(body), activity, energy: dayEnergy(body, facts) };
}

/**
 * ADR-0020: the window ending yesterday (today is not over), each day with
 * what was eaten and the model's estimate, and the weigh-ins in it.
 * A handful of range queries, not four per day.
 */
export async function getCalibration(
  db: Db,
  owner: Owner,
  today: string,
): Promise<Calibration> {
  const from = addDays(today, -WINDOW_DAYS);
  const to = addDays(today, -1);
  const [body, acts, sessions, measurements, history] = await Promise.all([
    getBody(db, owner, to),
    db
      .select()
      .from(dayActivity)
      .where(
        and(
          ownedBy(dayActivity, owner),
          gte(dayActivity.day, from),
          lte(dayActivity.day, to),
        ),
      ),
    listSessions(db, owner, from, to),
    listMeasurements(db, owner),
    getHistory(db, owner, from, to),
  ]);
  const days: CalibrationDay[] = history.map((h) => {
    const kg = weightAt(measurements, h.day);
    const { facts } = factsOf(
      h.day,
      acts.find((a) => a.day === h.day),
      sessions.filter((s) => s.day === h.day),
      kg,
    );
    return {
      day: h.day,
      eatenKcal: h.eaten.length ? h.eaten.reduce((a, e) => a + Number(e.kcal), 0) : null,
      energy: dayEnergy({ ...body, weightKg: kg }, facts),
    };
  });
  const weighIns = measurements
    .filter((m) => m.weightKg !== null && m.day >= from && m.day <= to)
    .map((m) => ({ day: m.day, kg: Number(m.weightKg) }));
  return calibrate(days, weighIns, body.correction ?? 1);
}

/** Accept a proposed factor, or reset to 1 (ADR-0020: only by the user's choice). */
export async function setEnergyCorrection(
  db: Db,
  owner: Owner,
  factor: number,
): Promise<void> {
  const value = factor.toFixed(2);
  await db
    .insert(userSettings)
    .values({ userId: owner.id, energyCorrection: value })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { energyCorrection: value },
    });
}
