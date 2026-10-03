-- 0024_repair_dynamic_day_plans.sql — HAND-WRITTEN data migration (ADR-0008/0014).
-- Created with `drizzle-kit generate --custom`; reviewed like any migration.
--
-- Until 2026-10-03, the first food logged on a day that followed a DYNAMIC
-- default day type fixed that day as a copy without the type's mode and
-- parameters: mode 'fixed', every target empty. Such a day has no targets at
-- all (no energy bar, empty rings). This gives those copies back the mode and
-- parameters of the day type they were copied from.
--
-- Touches only plans that are 'fixed' with all eight targets empty AND point
-- to a day type of the same user that is dynamic now. The one other way to
-- such a row — a fixed type with no targets, later switched to dynamic — is
-- a day that had no targets either; following the type is what it meant.
-- Safe to run twice: after it, those rows are 'dynamic' and no longer match.
UPDATE "day_plans" AS dp
SET "mode" = 'dynamic',
    "deficit_kcal" = p."deficit_kcal",
    "protein_g_per_kg" = p."protein_g_per_kg",
    "fat_g_per_kg" = p."fat_g_per_kg"
FROM "day_profiles" AS p
WHERE p."id" = dp."profile_id"
  AND p."user_id" = dp."user_id"
  AND p."mode" = 'dynamic'
  AND dp."mode" = 'fixed'
  AND COALESCE(dp."target_kcal", dp."target_protein", dp."target_carbs", dp."target_sugars",
               dp."target_fat", dp."target_saturated_fat", dp."target_fiber", dp."target_salt") IS NULL;
