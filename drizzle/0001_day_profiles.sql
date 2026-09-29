CREATE TABLE "day_plans" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"profile_id" uuid,
	"profile_name" text NOT NULL,
	"target_kcal" numeric(10, 3),
	"target_protein" numeric(10, 3),
	"target_carbs" numeric(10, 3),
	"target_sugars" numeric(10, 3),
	"target_fat" numeric(10, 3),
	"target_saturated_fat" numeric(10, 3),
	"target_fiber" numeric(10, 3),
	"target_salt" numeric(10, 3),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "day_plans_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "day_profiles" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"target_kcal" numeric(10, 3),
	"target_protein" numeric(10, 3),
	"target_carbs" numeric(10, 3),
	"target_sugars" numeric(10, 3),
	"target_fat" numeric(10, 3),
	"target_saturated_fat" numeric(10, 3),
	"target_fiber" numeric(10, 3),
	"target_salt" numeric(10, 3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "day_profiles_user_name_uq" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "day_plans" ADD CONSTRAINT "day_plans_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_plans" ADD CONSTRAINT "day_plans_profile_id_day_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."day_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_profiles" ADD CONSTRAINT "day_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "day_profiles_one_default_uq" ON "day_profiles" USING btree ("user_id") WHERE "day_profiles"."is_default";