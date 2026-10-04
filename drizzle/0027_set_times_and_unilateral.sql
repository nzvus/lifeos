ALTER TABLE "routines" ADD COLUMN "items_saved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sets" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sets" ADD COLUMN "ended_at" timestamp with time zone;--> statement-breakpoint
-- 2026-10-04: exercises done one arm/leg at a time that were not marked so
-- (the developer: "cable lateral raise, for one"). Data only, by name.
UPDATE "exercises" SET "unilateral" = true WHERE "unilateral" = false AND lower("name") IN ('cable lateral raise', 'bulgarian split squat');