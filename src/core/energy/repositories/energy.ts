/**
 * core/energy/repositories/energy.ts — the facts the energy model needs
 * (ADR-0014), gathered for one day and one owner: body data (settings),
 * the weight on that day (latest measurement up to it), the declared
 * activity (day_activity, default "mixed") and the day's sessions with
 * their burn ranges (ADR-0005). Also saves body data and activity, and
 * reads each weigh-in with what came before it (ADR-0027).
 *
 * Tested in: energy.test.ts.
 */
import { and, desc, eq, gte, lte } from "drizzle-orm";
import type { Db } from "../../db/client";
import { dayActivity, energyCorrections, userSettings } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { getHistory } from "../../nutrition/repositories/history";
import { addDays } from "../../shared/dates";
import {
  burnBasis,
  burnRange,
  sessionMinutes,
  sessionSteps,
  weightAt,
  type SetLike,
} from "../../training/analysis";
import type { ExerciseKind } from "../../training/kinds";
import {
  listMeasurements,
  type Measurement,
} from "../../training/repositories/measurements";
import { listExercises } from "../../training/repositories/exercises";
import { listRoutines } from "../../training/repositories/routines";
import { listSessions } from "../../training/repositories/sessions";
import { listSleep } from "../../training/repositories/sleep";
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
import {
  bodyIndices,
  readWeighIn,
  weightTrend,
  type WeighInReading,
} from "../../training/weighIns";
import { USUAL_DAYS, weighInFacts } from "../weighInFacts";

export type DayEnergyView = {
  body: Body;
  missing: MissingBody;
  activity: { level: ActivityLevel; walkingMin: number | null; steps: number | null };
  /** null when body data is missing. */
  energy: Energy | null;
};

/**
 * ADR-0026: the calibration factor in force on `day` — the latest accepted
 * on or before it, else 1. Without any history (a factor accepted before
 * ADR-0026), the one in settings, as before.
 */
async function correctionOn(db: Db, owner: Owner, day: string, legacy: string | null) {
  const rows = await db
    .select({ day: energyCorrections.sinceDay, factor: energyCorrections.factor })
    .from(energyCorrections)
    .where(ownedBy(energyCorrections, owner))
    .orderBy(desc(energyCorrections.sinceDay));
  if (!rows.length) return Number(legacy ?? 1);
  return Number(rows.find((r) => r.day <= day)?.factor ?? 1);
}

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
    correction: await correctionOn(db, owner, day, s?.correction ?? null),
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

/** One exercise as a planned session, with its sets of the last time it was done. */
async function exerciseAsPlanned(
  db: Db,
  owner: Owner,
  day: string,
  exerciseId: string,
): Promise<SessionRow | null> {
  const [exercises, history] = await Promise.all([
    listExercises(db, owner),
    listSessions(db, owner, addDays(day, -365), addDays(day, -1)),
  ]);
  const exercise = exercises.find((e) => e.id === exerciseId);
  if (!exercise) return null;
  const last = [...history]
    .filter((s) => s.status === "done")
    .reverse()
    .flatMap((s) => s.exercises)
    .find((e) => e.exerciseId === exerciseId);
  const sets = last?.sets.filter((x) => !x.warmup) ?? [];
  return {
    label: exercise.name,
    status: "planned",
    durationMin: null,
    routineId: null,
    intensity: null,
    kcalEstimate: null,
    exercises: [
      {
        kind: exercise.kind,
        restS: last?.restS ?? null,
        sets: sets.length ? sets : [{ reps: null, loadKg: null, warmup: false }],
      },
    ],
  };
}

/** A routine as a planned session with its default sets (for the energy only). */
async function routineAsPlanned(
  db: Db,
  owner: Owner,
  routineId: string,
): Promise<SessionRow | null> {
  const [routines, exercises] = await Promise.all([
    listRoutines(db, owner),
    listExercises(db, owner),
  ]);
  const routine = routines.find((r) => r.id === routineId);
  if (!routine) return null;
  const kindOf = new Map(exercises.map((e) => [e.id, e.kind]));
  return {
    label: routine.name,
    status: "planned",
    durationMin: null,
    routineId: routine.id,
    intensity: null,
    kcalEstimate: null,
    exercises: routine.items.map((it) => ({
      kind: kindOf.get(it.exerciseId) ?? "strength",
      restS: it.restS,
      sets: Array.from({ length: it.sets }, () => ({
        reps: it.reps,
        loadKg: it.loadKg,
        durationS: it.durationS,
        warmup: false,
      })),
    })),
  };
}
/** What the energy needs of a session: real ones, or a program's routine. */
type SessionRow = Pick<
  Awaited<ReturnType<typeof listSessions>>[number],
  "status" | "durationMin" | "label" | "intensity" | "kcalEstimate" | "routineId"
> & {
  exercises: readonly {
    kind: ExerciseKind;
    restS: number | null;
    sets: readonly SetLike[];
  }[];
};

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
    // ADR-0030: the device's steps include a run's; taken out there.
    sessionSteps: sessions.reduce((a, s) => a + sessionSteps(s), 0),
    sessions: sessions.map((s) => ({
      status: s.status,
      burn: burnRange(s, kg),
      durationMin: sessionMinutes(s),
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
  /** ADR-0024: the routine or exercise a program puts on this day, counted
   *  as planned when the day has no session of it yet. */
  programSlot?: { routineId?: string | null; exerciseId?: string | null } | null,
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
  const kg = weightAt(measurements, day);
  const all: SessionRow[] = [...sessions];
  const rId = programSlot?.routineId;
  const eId = programSlot?.exerciseId;
  if (rId && !sessions.some((x) => x.routineId === rId)) {
    const pseudo = await routineAsPlanned(db, owner, rId);
    if (pseudo) all.push(pseudo);
  } else if (
    eId &&
    !sessions.some((x) => x.exercises.some((e) => e.exerciseId === eId))
  ) {
    const pseudo = await exerciseAsPlanned(db, owner, day, eId);
    if (pseudo) all.push(pseudo);
  }
  const { activity, facts } = factsOf(day, act, all, kg);
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
  const readings = await weighInReadings(db, owner, measurements, from, to);
  const weighIns = readings.map((r) => ({
    day: r.m.day,
    kg: Number(r.m.weightKg),
    weight: r.reliability,
  }));
  return calibrate(days, weighIns, body.correction ?? 1);
}

/** Each weigh-in with a weight in [from, to], read with what came before it. */
async function weighInReadings(
  db: Db,
  owner: Owner,
  measurements: Measurement[],
  from: string,
  to: string,
): Promise<(WeighInReading & { m: Measurement })[]> {
  const weighed = measurements.filter(
    (m) => m.weightKg !== null && m.day >= from && m.day <= to,
  );
  if (!weighed.length) return [];
  const first = addDays(weighed[0]!.day, -1 - USUAL_DAYS);
  const last = weighed[weighed.length - 1]!.day;
  const [[s], history, sessions, nights] = await Promise.all([
    db
      .select({ timezone: userSettings.timezone })
      .from(userSettings)
      .where(ownedBy(userSettings, owner)),
    getHistory(db, owner, first, last),
    listSessions(db, owner, first, last),
    listSleep(db, owner, first, last),
  ]);
  const slept = new Map(nights.map((n) => [n.day, n.hours]));
  const byDay = new Map(history.map((h) => [h.day, h]));
  const zone = s?.timezone ?? "UTC";
  return weighed.map((m) => ({
    m,
    ...readWeighIn(weighInFacts(m, byDay, sessions, zone, slept)),
  }));
}

export type WeighInView = WeighInReading & {
  id: string;
  day: string;
  kg: number;
  /** The smoothed weight after this weigh-in (ADR-0027). */
  trend: number;
  indices: ReturnType<typeof bodyIndices>;
};

/** Every weigh-in, oldest first, with its clues, reliability, trend and indices. */
export async function getWeighIns(db: Db, owner: Owner): Promise<WeighInView[]> {
  const [measurements, [s]] = await Promise.all([
    listMeasurements(db, owner),
    db
      .select({ heightCm: userSettings.heightCm })
      .from(userSettings)
      .where(ownedBy(userSettings, owner)),
  ]);
  const read = await weighInReadings(db, owner, measurements, "0000-01-01", "9999-12-31");
  const trend = weightTrend(
    read.map((r) => ({
      day: r.m.day,
      kg: Number(r.m.weightKg),
      reliability: r.reliability,
    })),
  );
  return read.map((r, i) => ({
    id: r.m.id,
    day: r.m.day,
    kg: Number(r.m.weightKg),
    clues: r.clues,
    reliability: r.reliability,
    trend: trend[i]!,
    indices: bodyIndices({
      kg: Number(r.m.weightKg),
      heightCm: s?.heightCm ?? null,
      waistCm: r.m.waistCm === null ? null : Number(r.m.waistCm),
      bodyFatPct: r.m.bodyFatPct === null ? null : Number(r.m.bodyFatPct),
    }),
  }));
}

/**
 * Accept a proposed factor, or reset to 1 (ADR-0020: only by the user's
 * choice), from `today` on (ADR-0026): earlier days keep theirs.
 */
export async function setEnergyCorrection(
  db: Db,
  owner: Owner,
  factor: number,
  today: string,
): Promise<void> {
  const value = factor.toFixed(2);
  await db
    .insert(energyCorrections)
    .values({ userId: owner.id, sinceDay: today, factor: value })
    .onConflictDoUpdate({
      target: [energyCorrections.userId, energyCorrections.sinceDay],
      set: { factor: value },
    });
  await db
    .insert(userSettings)
    .values({ userId: owner.id, energyCorrection: value })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { energyCorrection: value },
    });
}
