CREATE TABLE "day_activity" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"level" text DEFAULT 'mixed' NOT NULL,
	"walking_min" integer,
	"steps" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "day_activity_user_id_day_pk" PRIMARY KEY("user_id","day"),
	CONSTRAINT "day_activity_level_ck" CHECK ("day_activity"."level" in ('sitting', 'mixed', 'on_feet')),
	CONSTRAINT "day_activity_amounts_ck" CHECK (coalesce("day_activity"."walking_min", 0) between 0 and 1440 and coalesce("day_activity"."steps", 0) between 0 and 100000)
);
--> statement-breakpoint
ALTER TABLE "day_plans" ADD COLUMN "mode" text DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "day_plans" ADD COLUMN "deficit_kcal" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "day_plans" ADD COLUMN "protein_g_per_kg" numeric(3, 1) DEFAULT '1.8' NOT NULL;--> statement-breakpoint
ALTER TABLE "day_plans" ADD COLUMN "fat_g_per_kg" numeric(3, 1) DEFAULT '0.8' NOT NULL;--> statement-breakpoint
ALTER TABLE "day_profiles" ADD COLUMN "mode" text DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "day_profiles" ADD COLUMN "deficit_kcal" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "day_profiles" ADD COLUMN "protein_g_per_kg" numeric(3, 1) DEFAULT '1.8' NOT NULL;--> statement-breakpoint
ALTER TABLE "day_profiles" ADD COLUMN "fat_g_per_kg" numeric(3, 1) DEFAULT '0.8' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "sex" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "birth_year" integer;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "height_cm" integer;--> statement-breakpoint
ALTER TABLE "day_activity" ADD CONSTRAINT "day_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_profiles" ADD CONSTRAINT "day_profiles_mode_ck" CHECK ("day_profiles"."mode" in ('fixed', 'dynamic'));--> statement-breakpoint
ALTER TABLE "day_profiles" ADD CONSTRAINT "day_profiles_dynamic_ck" CHECK ("day_profiles"."deficit_kcal" between -1500 and 1500 and "day_profiles"."protein_g_per_kg" between 0 and 4 and "day_profiles"."fat_g_per_kg" between 0 and 3);--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_sex_ck" CHECK ("user_settings"."sex" in ('male', 'female'));--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_birth_year_ck" CHECK ("user_settings"."birth_year" between 1900 and 2100);--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_height_ck" CHECK ("user_settings"."height_cm" between 100 and 250);