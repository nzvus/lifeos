ALTER TABLE "training_sessions" ADD COLUMN "intensity" text;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "kcal_estimate" integer;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "muscle_groups" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_intensity_ck" CHECK ("training_sessions"."intensity" in ('light', 'moderate', 'vigorous'));--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_kcal_ck" CHECK ("training_sessions"."kcal_estimate" between 1 and 10000);