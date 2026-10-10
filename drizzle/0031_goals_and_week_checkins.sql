CREATE TABLE "goals" (
	"user_id" uuid NOT NULL,
	"since_day" date NOT NULL,
	"rate_pct_week" numeric(3, 2) NOT NULL,
	"target_kg" numeric(5, 2),
	"kcal_floor" text DEFAULT 'standard' NOT NULL,
	"protein" text DEFAULT 'moderate' NOT NULL,
	"split" text DEFAULT 'balanced' NOT NULL,
	"check_in_weekday" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goals_user_id_since_day_pk" PRIMARY KEY("user_id","since_day"),
	CONSTRAINT "goals_rate_ck" CHECK ("goals"."rate_pct_week" between -1.5 and 1.0),
	CONSTRAINT "goals_target_kg_ck" CHECK ("goals"."target_kg" between 30 and 300),
	CONSTRAINT "goals_kcal_floor_ck" CHECK ("goals"."kcal_floor" in ('standard', 'low')),
	CONSTRAINT "goals_protein_ck" CHECK ("goals"."protein" in ('low', 'moderate', 'high', 'extra')),
	CONSTRAINT "goals_split_ck" CHECK ("goals"."split" in ('balanced', 'low_fat', 'low_carb')),
	CONSTRAINT "goals_weekday_ck" CHECK ("goals"."check_in_weekday" between 0 and 6)
);
--> statement-breakpoint
CREATE TABLE "week_checkins" (
	"user_id" uuid NOT NULL,
	"start_day" date NOT NULL,
	"decision" text NOT NULL,
	"expenditure_kcal" integer,
	"factor" numeric(3, 2),
	"trend_kg" numeric(5, 2),
	"kcal" integer,
	"protein" integer,
	"fat" integer,
	"carbs" integer,
	"fiber" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "week_checkins_user_id_start_day_pk" PRIMARY KEY("user_id","start_day"),
	CONSTRAINT "week_checkins_decision_ck" CHECK ("week_checkins"."decision" in ('accepted', 'skipped')),
	CONSTRAINT "week_checkins_numbers_ck" CHECK (("week_checkins"."decision" = 'accepted') = ("week_checkins"."kcal" is not null and "week_checkins"."protein" is not null and "week_checkins"."fat" is not null and "week_checkins"."carbs" is not null and "week_checkins"."fiber" is not null)),
	CONSTRAINT "week_checkins_kcal_ck" CHECK ("week_checkins"."kcal" between 800 and 6000),
	CONSTRAINT "week_checkins_factor_ck" CHECK ("week_checkins"."factor" between 0.80 and 1.20)
);
--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_checkins" ADD CONSTRAINT "week_checkins_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;