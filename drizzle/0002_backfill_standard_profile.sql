-- 0002_backfill_standard_profile.sql — HAND-WRITTEN data migration (ADR-0008).
-- Created with `drizzle-kit generate --custom`; reviewed like any migration.
--
-- Before 0001, daily targets lived in user_settings.target_*. This copies
-- them into a default profile named 'Standard' for every user who had set at
-- least one target, so nobody's targets disappear when the app switches to
-- reading profiles. Users without targets get no profile (nothing to keep).
--
-- Safe to run twice: ON CONFLICT DO NOTHING skips users who already have a
-- 'Standard' profile or a default profile (both are unique constraints).
-- The old columns stay in place (additive-first, ADR-0004); a later
-- migration drops them.
INSERT INTO "day_profiles" ("user_id", "name", "is_default", "target_kcal", "target_protein", "target_carbs", "target_sugars", "target_fat", "target_saturated_fat", "target_fiber", "target_salt")
SELECT "user_id", 'Standard', true, "target_kcal", "target_protein", "target_carbs", "target_sugars", "target_fat", "target_saturated_fat", "target_fiber", "target_salt"
FROM "user_settings"
WHERE COALESCE("target_kcal", "target_protein", "target_carbs", "target_sugars", "target_fat", "target_saturated_fat", "target_fiber", "target_salt") IS NOT NULL
ON CONFLICT DO NOTHING;
