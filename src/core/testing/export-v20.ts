/**
 * core/testing/export-v20.ts — the exporter as it was at version 20 (nested
 * sections), kept only to produce genuine old files for legacy.test.ts
 * (ADR-0052). Not used by the app.
 */
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import {
  assistantConversations,
  assistantMessages,
  batches,
  batchLines,
  dayActivity,
  dayPlans,
  exercises,
  dayProfiles,
  ingredients,
  ingredientTags,
  logEntries,
  logEntryItems,
  mealItems,
  mealRatings,
  products,
  purchases,
  ratingFactors,
  reminders,
  routineItems,
  routines,
  programs,
  programSlots,
  programSkips,
  programSlotExercises,
  programSlotItems,
  sessionExercises,
  sets,
  sleepLogs,
  stockCounts,
  tags,
  meals,
  trainingSessions,
  user,
  userSettings,
  dayCheckins,
  dayClosures,
  goals,
  energyCorrections,
  dayPrograms,
  dayProgramSlots,
  weekCheckins,
  weekCheckinDays,
  logEntryLeftOut,
  moneyCategories,
  moneyLines,
  moneyMovements,
  moneyReceipts,
  receiptAliases,
} from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { live } from "../shared/trash";
import { listMeasurements } from "../training/repositories/measurements";

const EXPORT_FORMAT = "lifeos-export";
const EXPORT_VERSION = 20;

/** Removes `userId` from every row: it's the same everywhere and meaningless outside. */
function stripOwner<T extends { userId: string }>(rows: T[]): Omit<T, "userId">[] {
  return rows.map(({ userId: _ignored, ...rest }) => rest);
}

export async function exportV20(db: Db, owner: Owner, now: Date = new Date()) {
  // `user` has no user_id column (it IS the user), so filter by its id.
  const [me] = await db
    .select({ name: user.name, email: user.email, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, owner.id));

  const [
    settings,
    ingredientRows,
    mealRows,
    mealItemRows,
    entryRows,
    entryItemRows,
    profileRows,
    planRows,
    tagRows,
    factorRows,
    ratingRows,
  ] = await Promise.all([
    db.select().from(userSettings).where(ownedBy(userSettings, owner)),
    db
      .select()
      .from(ingredients)
      .where(and(ownedBy(ingredients, owner), live(ingredients)))
      .orderBy(asc(ingredients.name)),
    // The trash is temporary (ADR-0015): only live meals and ingredients are exported.
    db
      .select()
      .from(meals)
      .where(and(ownedBy(meals, owner), live(meals)))
      .orderBy(asc(meals.name)),
    db.select().from(mealItems).where(ownedBy(mealItems, owner)),
    db
      .select()
      .from(logEntries)
      .where(and(ownedBy(logEntries, owner), live(logEntries)))
      .orderBy(asc(logEntries.day)),
    db.select().from(logEntryItems).where(ownedBy(logEntryItems, owner)),
    db
      .select()
      .from(dayProfiles)
      .where(and(ownedBy(dayProfiles, owner), live(dayProfiles)))
      .orderBy(asc(dayProfiles.name)),
    db.select().from(dayPlans).where(ownedBy(dayPlans, owner)).orderBy(asc(dayPlans.day)),
    db
      .select({
        ingredientId: ingredientTags.ingredientId,
        name: tags.name,
        icon: tags.icon,
      })
      .from(ingredientTags)
      .innerJoin(tags, eq(ingredientTags.tagId, tags.id))
      .where(ownedBy(ingredientTags, owner))
      .orderBy(asc(tags.name)),
    db
      .select()
      .from(ratingFactors)
      .where(ownedBy(ratingFactors, owner))
      .orderBy(asc(ratingFactors.position)),
    db.select().from(mealRatings).where(ownedBy(mealRatings, owner)),
  ]);

  // Training (ADR-0005), live records only like the rest; parts nest in
  // their parent (routine → items, session → exercises → sets).
  const [
    exerciseRows,
    routineRows,
    routineItemRows,
    sessionRows,
    sessionExRows,
    setRows,
    measurementRows,
    activityRows,
    sleepRows,
  ] = await Promise.all([
    db
      .select()
      .from(exercises)
      .where(and(ownedBy(exercises, owner), live(exercises)))
      .orderBy(asc(exercises.name)),
    db
      .select()
      .from(routines)
      .where(and(ownedBy(routines, owner), live(routines)))
      .orderBy(asc(routines.position)),
    db
      .select()
      .from(routineItems)
      .where(ownedBy(routineItems, owner))
      .orderBy(asc(routineItems.position)),
    db
      .select()
      .from(trainingSessions)
      .where(and(ownedBy(trainingSessions, owner), live(trainingSessions)))
      .orderBy(asc(trainingSessions.day)),
    db
      .select()
      .from(sessionExercises)
      .where(ownedBy(sessionExercises, owner))
      .orderBy(asc(sessionExercises.position)),
    db.select().from(sets).where(ownedBy(sets, owner)).orderBy(asc(sets.position)),
    listMeasurements(db, owner), // with how each weigh-in was taken (ADR-0027)
    db
      .select()
      .from(dayActivity)
      .where(ownedBy(dayActivity, owner))
      .orderBy(asc(dayActivity.day)),
    db
      .select()
      .from(sleepLogs)
      .where(ownedBy(sleepLogs, owner))
      .orderBy(asc(sleepLogs.day)),
  ]);

  // The pantry (ADR-0017), live records only; purchases nest in their
  // product, lines in their batch.
  const [productRows, purchaseRows, countRows, batchRows, batchLineRows, reminderRows] =
    await Promise.all([
      db
        .select()
        .from(products)
        .where(and(ownedBy(products, owner), live(products)))
        .orderBy(asc(products.name)),
      db
        .select()
        .from(purchases)
        .where(and(ownedBy(purchases, owner), live(purchases)))
        .orderBy(asc(purchases.day)),
      db
        .select()
        .from(stockCounts)
        .where(ownedBy(stockCounts, owner))
        .orderBy(asc(stockCounts.at)),
      db
        .select()
        .from(batches)
        .where(and(ownedBy(batches, owner), live(batches)))
        .orderBy(asc(batches.cookedAt)),
      db
        .select()
        .from(batchLines)
        .where(ownedBy(batchLines, owner))
        .orderBy(asc(batchLines.position)),
      db
        .select()
        .from(reminders)
        .where(and(ownedBy(reminders, owner), live(reminders)))
        .orderBy(asc(reminders.createdAt)),
    ]);

  const [conversationRows, messageRows] = await Promise.all([
    db
      .select()
      .from(assistantConversations)
      .where(and(ownedBy(assistantConversations, owner), live(assistantConversations)))
      .orderBy(asc(assistantConversations.createdAt)),
    db
      .select()
      .from(assistantMessages)
      .where(ownedBy(assistantMessages, owner))
      .orderBy(asc(assistantMessages.createdAt)),
  ]);

  const [programRows, slotRows, slotExerciseRows, itemRows, skipRows] = await Promise.all(
    [
      db
        .select()
        .from(programs)
        .where(and(ownedBy(programs, owner), live(programs)))
        .orderBy(asc(programs.name)),
      db
        .select()
        .from(programSlots)
        .where(ownedBy(programSlots, owner))
        .orderBy(asc(programSlots.position)),
      db.select().from(programSlotExercises).where(ownedBy(programSlotExercises, owner)),
      db
        .select()
        .from(programSlotItems)
        .where(ownedBy(programSlotItems, owner))
        .orderBy(asc(programSlotItems.position)),
      db.select().from(programSkips).where(ownedBy(programSkips, owner)),
    ],
  );
  // Money (ADR-0036), live records; lines nest in their movement.
  const [leftOutRows, categoryRows, movementRows, lineRows, receiptRows, aliasRows] =
    await Promise.all([
      db.select().from(logEntryLeftOut).where(ownedBy(logEntryLeftOut, owner)),
      db
        .select()
        .from(moneyCategories)
        .where(and(ownedBy(moneyCategories, owner), live(moneyCategories)))
        .orderBy(asc(moneyCategories.position)),
      db
        .select()
        .from(moneyMovements)
        .where(and(ownedBy(moneyMovements, owner), live(moneyMovements)))
        .orderBy(asc(moneyMovements.day), asc(moneyMovements.createdAt)),
      db
        .select()
        .from(moneyLines)
        .where(ownedBy(moneyLines, owner))
        .orderBy(asc(moneyLines.position)),
      db
        .select()
        .from(moneyReceipts)
        .where(and(ownedBy(moneyReceipts, owner), live(moneyReceipts))),
      db.select().from(receiptAliases).where(ownedBy(receiptAliases, owner)),
    ]);
  const checkinRows = await db
    .select()
    .from(dayCheckins)
    .where(ownedBy(dayCheckins, owner))
    .orderBy(asc(dayCheckins.day));
  const closureRows = await db
    .select()
    .from(dayClosures)
    .where(ownedBy(dayClosures, owner))
    .orderBy(asc(dayClosures.day));
  const [dayProgramRows, daySlotRows] = await Promise.all([
    db.select().from(dayPrograms).where(ownedBy(dayPrograms, owner)),
    db
      .select()
      .from(dayProgramSlots)
      .where(ownedBy(dayProgramSlots, owner))
      .orderBy(asc(dayProgramSlots.position)),
  ]);
  const correctionRows = await db
    .select()
    .from(energyCorrections)
    .where(ownedBy(energyCorrections, owner))
    .orderBy(asc(energyCorrections.sinceDay));
  const goalRows = await db
    .select()
    .from(goals)
    .where(ownedBy(goals, owner))
    .orderBy(asc(goals.sinceDay));
  const checkinDayRows = await db
    .select()
    .from(weekCheckinDays)
    .where(ownedBy(weekCheckinDays, owner))
    .orderBy(asc(weekCheckinDays.day));
  const weekCheckinRows = await db
    .select()
    .from(weekCheckins)
    .where(ownedBy(weekCheckins, owner))
    .orderBy(asc(weekCheckins.startDay));
  const leftOut = new Set(leftOutRows.map((r) => r.entryId));

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    account: me ?? null,
    // No secrets: the assistant's key (ADR-0018) never leaves the server,
    // not even encrypted; its last 4 characters are enough to recognise it.
    settings:
      stripOwner(settings).map(({ assistantKeyEnc: _secret, ...rest }) => rest)[0] ??
      null,
    // Free tags ride along with each ingredient (ADR-0012).
    ingredients: stripOwner(ingredientRows).map((i) => ({
      ...i,
      tags: tagRows
        .filter((t) => t.ingredientId === i.id)
        .map(({ name, icon }) => ({ name, icon })),
    })),
    meals: stripOwner(mealRows).map((m) => ({
      ...m,
      items: stripOwner(mealItemRows.filter((i) => i.mealId === m.id)),
      ratings: ratingRows
        .filter((r) => r.mealId === m.id)
        .map(({ factorId, score }) => ({ factorId, score })),
    })),
    ratingFactors: stripOwner(factorRows),
    dayProfiles: stripOwner(profileRows).map((p) => {
      const program = dayProgramRows.find((x) => x.profileId === p.id);
      const slots = daySlotRows.filter((x) => x.profileId === p.id);
      return {
        ...p,
        program:
          program || slots.length
            ? {
                trainingAt: program?.trainingAt ?? null,
                shiftKcal: program?.shiftKcal ?? 0,
                slots: slots.map(({ kind, at, kcalShare, proteinShare }) => ({
                  kind,
                  at,
                  kcalShare,
                  proteinShare,
                })),
              }
            : null,
      };
    }),
    dayPlans: stripOwner(planRows),
    dayClosures: stripOwner(closureRows),
    energyCorrections: stripOwner(correctionRows),
    goals: stripOwner(goalRows),
    weekCheckins: stripOwner(weekCheckinRows).map((c) => ({
      ...c,
      shifts: Object.fromEntries(
        checkinDayRows
          .filter((d) => d.startDay === c.startDay)
          .map((d) => [d.day, d.shiftKcal]),
      ),
    })),
    log: stripOwner(entryRows).map((e) => ({
      ...e,
      leftOut: leftOut.has(e.id),
      items: stripOwner(entryItemRows.filter((i) => i.entryId === e.id)),
    })),
    training: {
      exercises: stripOwner(exerciseRows),
      routines: stripOwner(routineRows).map((r) => ({
        ...r,
        items: stripOwner(routineItemRows.filter((i) => i.routineId === r.id)),
      })),
      sessions: stripOwner(sessionRows).map((x) => ({
        ...x,
        exercises: stripOwner(sessionExRows.filter((e) => e.sessionId === x.id)).map(
          (e) => ({
            ...e,
            sets: stripOwner(setRows.filter((st) => st.sessionExerciseId === e.id)),
          }),
        ),
      })),
      measurements: stripOwner(measurementRows),
      sleep: stripOwner(sleepRows),
      dayActivity: stripOwner(activityRows),
      programs: stripOwner(programRows).map((p) => ({
        ...p,
        slots: stripOwner(slotRows.filter((x) => x.programId === p.id)).map((x) => ({
          ...x,
          exerciseId: slotExerciseRows.find((e) => e.slotId === x.id)?.exerciseId ?? null,
          items: stripOwner(itemRows.filter((i) => i.slotId === x.id)),
        })),
        skips: stripOwner(skipRows.filter((k) => k.programId === p.id)),
      })),
    },
    pantry: {
      products: stripOwner(productRows).map((p) => ({
        ...p,
        purchases: stripOwner(purchaseRows.filter((x) => x.productId === p.id)),
      })),
      stockCounts: stripOwner(countRows),
      batches: stripOwner(batchRows).map((b) => ({
        ...b,
        lines: stripOwner(batchLineRows.filter((l) => l.batchId === b.id)),
      })),
      reminders: stripOwner(reminderRows),
    },
    assistant: {
      conversations: stripOwner(conversationRows).map((c) => ({
        ...c,
        messages: stripOwner(messageRows.filter((m) => m.conversationId === c.id)),
      })),
    },
    money: {
      categories: stripOwner(categoryRows),
      movements: stripOwner(movementRows).map((m) => ({
        ...m,
        lines: stripOwner(lineRows.filter((l) => l.movementId === m.id)),
      })),
      receipts: stripOwner(receiptRows),
      aliases: stripOwner(aliasRows),
    },
    mind: { checkins: stripOwner(checkinRows) },
  };
}
