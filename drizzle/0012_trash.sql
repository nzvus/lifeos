ALTER TABLE "day_profiles" DROP CONSTRAINT "day_profiles_user_name_uq";--> statement-breakpoint
ALTER TABLE "ingredients" DROP CONSTRAINT "ingredients_user_name_uq";--> statement-breakpoint
ALTER TABLE "meals" DROP CONSTRAINT "meals_user_name_uq";--> statement-breakpoint
ALTER TABLE "exercises" DROP CONSTRAINT "exercises_user_name_uq";--> statement-breakpoint
ALTER TABLE "routines" DROP CONSTRAINT "routines_user_name_uq";--> statement-breakpoint
DROP INDEX "day_profiles_one_default_uq";--> statement-breakpoint
ALTER TABLE "day_profiles" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "log_entries" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "day_profiles_user_name_uq" ON "day_profiles" USING btree ("user_id","name") WHERE "day_profiles"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "ingredients_user_name_uq" ON "ingredients" USING btree ("user_id","name") WHERE "ingredients"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "meals_user_name_uq" ON "meals" USING btree ("user_id","name") WHERE "meals"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "exercises_user_name_uq" ON "exercises" USING btree ("user_id","name") WHERE "exercises"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "routines_user_name_uq" ON "routines" USING btree ("user_id","name") WHERE "routines"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "day_profiles_one_default_uq" ON "day_profiles" USING btree ("user_id") WHERE "day_profiles"."is_default" and "day_profiles"."deleted_at" is null;