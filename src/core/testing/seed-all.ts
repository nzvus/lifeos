/**
 * core/testing/seed-all.ts — one row (at least) in every table an account
 * owns, with every reference filled, for the export / replace round trips
 * (ADR-0052). Raw inserts, not repositories: the point is coverage of the
 * schema, not of the app's rules. tables.test.ts fails if a new table is
 * neither seeded here nor excluded from the export.
 */
import type { Db } from "../db/client";
import * as s from "../db/schema";
import type { Owner } from "../identity/owner";

const n = (x: number) => String(x);
const nutrients = {
  kcal: "389",
  protein: "16.9",
  carbs: "66.3",
  sugars: "1",
  fat: "6.9",
  saturatedFat: "1.2",
  fiber: "10.6",
  salt: "0.01",
};

export async function seedEverything(db: Db, owner: Owner) {
  const userId = owner.id;
  const one = async <T>(rows: Promise<T[]>) => (await rows)[0]!;

  await db.insert(s.userSettings).values({
    userId,
    timezone: "Europe/Rome",
    locale: "it",
    theme: "quaderno",
    sex: "male",
    birthYear: 1995,
    heightCm: 180,
    assistantKeyLast4: "ab12",
    assistantKeyEnc: "SECRET",
    kcal: "2500",
  });

  const oats = await one(
    db
      .insert(s.ingredients)
      .values({
        userId,
        name: "Oats",
        unit: "g",
        ...nutrients,
        packagePriceCents: 199,
        packageSize: "500",
        nova: 1,
        origin: "plant",
        fiberTypes: ["beta_glucan"],
      })
      .returning(),
  );
  await db.insert(s.ingredients).values({
    userId,
    name: "Old flour",
    ...nutrients,
    deletedAt: new Date("2026-10-01T10:00:00Z"),
  });
  const tag = await one(
    db.insert(s.tags).values({ userId, name: "breakfast", icon: "sun" }).returning(),
  );
  await db
    .insert(s.ingredientTags)
    .values({ userId, ingredientId: oats.id, tagId: tag.id });
  await db
    .insert(s.ingredientCompounds)
    .values({ userId, ingredientId: oats.id, compound: "caffeine", amount: "40" });

  const meal = await one(
    db
      .insert(s.meals)
      .values({ userId, name: "Porridge", category: "breakfast" })
      .returning(),
  );
  await db.insert(s.mealItems).values({
    userId,
    mealId: meal.id,
    ingredientId: oats.id,
    quantity: "80",
    position: 0,
  });
  const factor = await one(
    db.insert(s.ratingFactors).values({ userId, name: "Taste", position: 0 }).returning(),
  );
  await db
    .insert(s.mealRatings)
    .values({ userId, mealId: meal.id, factorId: factor.id, score: 4 });

  const batch = await one(
    db
      .insert(s.batches)
      .values({
        userId,
        mealId: meal.id,
        label: "Porridge ×4",
        portions: 4,
        cookedAt: new Date("2026-10-10T08:00:00Z"),
        day: "2026-10-10",
      })
      .returning(),
  );
  await db.insert(s.batchLines).values({
    userId,
    batchId: batch.id,
    ingredientId: oats.id,
    name: "Oats",
    unit: "g",
    quantity: "320",
    ...nutrients,
    position: 0,
  });

  const entry = await one(
    db
      .insert(s.logEntries)
      .values({
        userId,
        day: "2026-10-10",
        mealId: meal.id,
        batchId: batch.id,
        label: "Porridge",
        servings: "1.5",
        status: "eaten",
        at: new Date("2026-10-10T07:30:00Z"),
        moment: "breakfast",
      })
      .returning(),
  );
  await db.insert(s.logEntryItems).values({
    userId,
    entryId: entry.id,
    ingredientId: oats.id,
    name: "Oats",
    unit: "g",
    quantity: "80",
    ...nutrients,
    position: 0,
  });
  const planned = await one(
    db
      .insert(s.logEntries)
      .values({
        userId,
        day: "2026-10-10",
        label: "Snack",
        status: "planned",
        estimated: true,
      })
      .returning(),
  );
  await db.insert(s.logEntryLeftOut).values({ userId, entryId: planned.id });

  const profile = await one(
    db
      .insert(s.dayProfiles)
      .values({ userId, name: "Gym day", isDefault: true, kcal: "2600", mode: "dynamic" })
      .returning(),
  );
  await db.insert(s.dayPlans).values({
    userId,
    day: "2026-10-10",
    profileId: profile.id,
    profileName: "Gym day",
    kcal: "2600",
  });
  await db
    .insert(s.dayPrograms)
    .values({ userId, profileId: profile.id, trainingAt: 1080, shiftKcal: 200 });
  await db.insert(s.dayProgramSlots).values({
    userId,
    profileId: profile.id,
    position: 0,
    kind: "breakfast",
    at: 480,
    kcalShare: "0.25",
    proteinShare: "0.25",
  });

  await db
    .insert(s.energyCorrections)
    .values({ userId, sinceDay: "2026-10-01", factor: "1.05" });
  await db.insert(s.goals).values({
    userId,
    sinceDay: "2026-10-01",
    ratePctWeek: "-0.50",
    kind: "lose",
    targetKg: "73",
    weeklyCheckIn: true,
  });
  await db.insert(s.weekCheckins).values({
    userId,
    startDay: "2026-10-06",
    decision: "accepted",
    kcal: 2400,
    protein: 160,
    fat: 70,
    carbs: 280,
    fiber: 35,
  });
  await db
    .insert(s.weekCheckinDays)
    .values({ userId, startDay: "2026-10-06", day: "2026-10-07", shiftKcal: 150 });
  await db.insert(s.dayClosures).values({ userId, day: "2026-10-10", state: "complete" });
  await db
    .insert(s.dayCheckins)
    .values({ userId, day: "2026-10-10", mood: 4, energy: 3, stress: 2, note: "ok" });

  const bench = await one(
    db
      .insert(s.exercises)
      .values({
        userId,
        name: "Bench press",
        kind: "strength",
        muscleGroups: ["chest"],
        pattern: "push_horizontal",
      })
      .returning(),
  );
  const routine = await one(
    db
      .insert(s.routines)
      .values({ userId, name: "Push", itemsSavedAt: new Date("2026-10-01T10:00:00Z") })
      .returning(),
  );
  await db.insert(s.routineItems).values({
    userId,
    routineId: routine.id,
    exerciseId: bench.id,
    position: 0,
    sets: 3,
    reps: 8,
    loadKg: "60",
    restS: 120,
  });
  const session = await one(
    db
      .insert(s.trainingSessions)
      .values({
        userId,
        day: "2026-10-10",
        label: "Push",
        routineId: routine.id,
        startedAt: new Date("2026-10-10T16:00:00Z"),
        durationMin: 60,
      })
      .returning(),
  );
  const sx = await one(
    db
      .insert(s.sessionExercises)
      .values({
        userId,
        sessionId: session.id,
        exerciseId: bench.id,
        position: 0,
        restS: 120,
      })
      .returning(),
  );
  await db.insert(s.sets).values({
    userId,
    sessionExerciseId: sx.id,
    position: 0,
    reps: 8,
    loadKg: "60",
    rir: 2,
    startedAt: new Date("2026-10-10T16:05:00Z"),
    endedAt: new Date("2026-10-10T16:06:00Z"),
  });

  const program = await one(
    db
      .insert(s.programs)
      .values({ userId, name: "PPL", startDay: "2026-10-01" })
      .returning(),
  );
  const slot = await one(
    db
      .insert(s.programSlots)
      .values({
        userId,
        programId: program.id,
        position: 0,
        routineId: routine.id,
        label: "Push",
      })
      .returning(),
  );
  const slot2 = await one(
    db
      .insert(s.programSlots)
      .values({ userId, programId: program.id, position: 1, label: "Bench only" })
      .returning(),
  );
  await db
    .insert(s.programSlotExercises)
    .values({ userId, slotId: slot2.id, exerciseId: bench.id });
  await db
    .insert(s.programSlotItems)
    .values({ userId, slotId: slot.id, position: 0, routineId: routine.id });
  await db
    .insert(s.programSkips)
    .values({ userId, programId: program.id, day: "2026-10-05" });
  await db
    .insert(s.programOverrides)
    .values({ userId, programId: program.id, day: "2026-10-06", slotPosition: 1 });

  const weigh = await one(
    db
      .insert(s.bodyMeasurements)
      .values({ userId, day: "2026-10-10", weightKg: "76.40", waistCm: "82.0" })
      .returning(),
  );
  await db.insert(s.weighInContext).values({
    userId,
    measurementId: weigh.id,
    measuredAt: new Date("2026-10-10T06:30:00Z"),
    fasted: true,
  });
  await db
    .insert(s.dayActivity)
    .values({ userId, day: "2026-10-10", level: "mixed", steps: 9000 });
  await db.insert(s.sleepLogs).values({
    userId,
    day: "2026-10-10",
    bedAt: new Date("2026-10-09T22:30:00Z"),
    wakeAt: new Date("2026-10-10T06:15:00Z"),
    quality: 4,
  });

  const product = await one(
    db
      .insert(s.products)
      .values({
        userId,
        name: "Oats 500 g",
        brand: "Lidl",
        unit: "g",
        packageSize: "500",
        ingredientId: oats.id,
        barcode: "4056489000000",
      })
      .returning(),
  );
  const purchase = await one(
    db
      .insert(s.purchases)
      .values({
        userId,
        productId: product.id,
        day: "2026-10-08",
        packages: "2",
        priceCents: 398,
      })
      .returning(),
  );
  await db.insert(s.stockCounts).values({
    userId,
    at: new Date("2026-10-09T10:00:00Z"),
    productId: product.id,
    quantity: n(700),
  });
  await db
    .insert(s.reminders)
    .values({ userId, text: "Descale the kettle", repeatDays: 30 });

  const conversation = await one(
    db.insert(s.assistantConversations).values({ userId, title: "Hi" }).returning(),
  );
  await db.insert(s.assistantMessages).values({
    userId,
    conversationId: conversation.id,
    role: "user",
    content: "hello",
    attachments: [{ name: "x.png" }],
  });

  const food = await one(
    db
      .insert(s.moneyCategories)
      .values({ userId, name: "Food", kind: "expense", key: "food" })
      .returning(),
  );
  const groceries = await one(
    db
      .insert(s.moneyCategories)
      .values({ userId, name: "Groceries", kind: "expense", parentId: food.id })
      .returning(),
  );
  const receipt = await one(
    db
      .insert(s.moneyReceipts)
      .values({ userId, day: "2026-10-08", shop: "Lidl", text: "OATS 3,98" })
      .returning(),
  );
  const movement = await one(
    db
      .insert(s.moneyMovements)
      .values({
        userId,
        day: "2026-10-08",
        amountCents: -398,
        categoryId: groceries.id,
        receiptId: receipt.id,
        method: "card",
        tags: ["weekly"],
      })
      .returning(),
  );
  await db.insert(s.moneyLines).values({
    userId,
    movementId: movement.id,
    position: 0,
    description: "OATS",
    quantity: "2",
    amountCents: 398,
    productId: product.id,
    purchaseId: purchase.id,
  });
  await db
    .insert(s.receiptAliases)
    .values({ userId, key: "oats", productId: product.id });
}
