CREATE TABLE "day_program_slots" (
	"profile_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"at" integer NOT NULL,
	"kcal_share" numeric(3, 2),
	"protein_share" numeric(3, 2),
	CONSTRAINT "day_program_slots_profile_id_position_pk" PRIMARY KEY("profile_id","position"),
	CONSTRAINT "day_program_slots_kind_ck" CHECK ("day_program_slots"."kind" in ('breakfast', 'lunch', 'snack', 'dinner', 'pre_workout', 'post_workout', 'pre_sleep')),
	CONSTRAINT "day_program_slots_at_ck" CHECK ("day_program_slots"."at" between 0 and 1439),
	CONSTRAINT "day_program_slots_share_ck" CHECK (coalesce("day_program_slots"."kcal_share", 0) between 0 and 1 and coalesce("day_program_slots"."protein_share", 0) between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "day_programs" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"training_at" integer,
	"shift_kcal" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "day_programs_training_at_ck" CHECK ("day_programs"."training_at" between 0 and 1439),
	CONSTRAINT "day_programs_shift_ck" CHECK ("day_programs"."shift_kcal" between -1000 and 1000)
);
--> statement-breakpoint
ALTER TABLE "log_entries" DROP CONSTRAINT "log_entries_moment_ck";--> statement-breakpoint
ALTER TABLE "meals" DROP CONSTRAINT "meals_category_ck";--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "kind" text;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "target_day" date;--> statement-breakpoint
ALTER TABLE "day_program_slots" ADD CONSTRAINT "day_program_slots_profile_id_day_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."day_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_program_slots" ADD CONSTRAINT "day_program_slots_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_programs" ADD CONSTRAINT "day_programs_profile_id_day_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."day_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_programs" ADD CONSTRAINT "day_programs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_entries" ADD CONSTRAINT "log_entries_moment_ck" CHECK ("log_entries"."moment" in ('breakfast', 'lunch', 'snack', 'dinner', 'pre_workout', 'post_workout', 'pre_sleep'));--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_category_ck" CHECK ("meals"."category" in ('breakfast', 'lunch', 'snack', 'dinner', 'pre_workout', 'post_workout', 'pre_sleep'));--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_kind_ck" CHECK ("goals"."kind" in ('lose', 'gain', 'recomp', 'maintain'));