ALTER TABLE "log_entries" ADD COLUMN "moment" text;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "log_entries" ADD CONSTRAINT "log_entries_moment_ck" CHECK ("log_entries"."moment" in ('breakfast', 'lunch', 'snack', 'dinner'));--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_category_ck" CHECK ("meals"."category" in ('breakfast', 'lunch', 'snack', 'dinner'));