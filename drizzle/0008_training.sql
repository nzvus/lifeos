CREATE TABLE "body_measurements" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"weight_kg" numeric(5, 2),
	"body_fat_pct" numeric(4, 1),
	"waist_cm" numeric(5, 1),
	"abdomen_cm" numeric(5, 1),
	"neck_cm" numeric(5, 1),
	"hip_cm" numeric(5, 1),
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "body_measurements_weight_ck" CHECK ("body_measurements"."weight_kg" > 0),
	CONSTRAINT "body_measurements_fat_ck" CHECK ("body_measurements"."body_fat_pct" between 0 and 70)
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"muscle_groups" text[] DEFAULT '{}'::text[] NOT NULL,
	"equipment" text,
	"unilateral" boolean DEFAULT false NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercises_user_name_uq" UNIQUE("user_id","name"),
	CONSTRAINT "exercises_id_user_uq" UNIQUE("id","user_id"),
	CONSTRAINT "exercises_kind_ck" CHECK ("exercises"."kind" in ('strength', 'bodyweight', 'cardio'))
);
--> statement-breakpoint
CREATE TABLE "routine_items" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"routine_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"sets" integer DEFAULT 3 NOT NULL,
	"reps" integer,
	"load_kg" numeric(6, 2),
	"duration_s" integer,
	"rest_s" integer,
	CONSTRAINT "routine_items_sets_ck" CHECK ("routine_items"."sets" > 0)
);
--> statement-breakpoint
CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "routines_user_name_uq" UNIQUE("user_id","name"),
	CONSTRAINT "routines_id_user_uq" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "session_exercises" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"rest_s" integer,
	"notes" text DEFAULT '' NOT NULL,
	CONSTRAINT "session_exercises_id_user_uq" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "sets" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"reps" integer,
	"load_kg" numeric(6, 2),
	"load_text" text,
	"load_approx" boolean DEFAULT false NOT NULL,
	"duration_s" integer,
	"distance_m" integer,
	"speed_kmh" numeric(4, 1),
	"incline_pct" numeric(4, 1),
	"rest_s" integer,
	"warmup" boolean DEFAULT false NOT NULL,
	CONSTRAINT "sets_measure_ck" CHECK ("sets"."reps" is not null or "sets"."duration_s" is not null),
	CONSTRAINT "sets_positive_ck" CHECK (coalesce("sets"."reps", 1) > 0 and coalesce("sets"."load_kg", 0) >= 0 and coalesce("sets"."duration_s", 1) > 0 and coalesce("sets"."distance_m", 0) >= 0)
);
--> statement-breakpoint
CREATE TABLE "training_sessions" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"label" text NOT NULL,
	"status" text DEFAULT 'done' NOT NULL,
	"started_at" timestamp with time zone,
	"duration_min" integer,
	"routine_id" uuid,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "training_sessions_id_user_uq" UNIQUE("id","user_id"),
	CONSTRAINT "training_sessions_status_ck" CHECK ("training_sessions"."status" in ('planned', 'done')),
	CONSTRAINT "training_sessions_duration_ck" CHECK ("training_sessions"."duration_min" > 0)
);
--> statement-breakpoint
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_items" ADD CONSTRAINT "routine_items_routine_fk" FOREIGN KEY ("routine_id","user_id") REFERENCES "public"."routines"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_items" ADD CONSTRAINT "routine_items_exercise_fk" FOREIGN KEY ("exercise_id","user_id") REFERENCES "public"."exercises"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_session_fk" FOREIGN KEY ("session_id","user_id") REFERENCES "public"."training_sessions"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exercise_fk" FOREIGN KEY ("exercise_id","user_id") REFERENCES "public"."exercises"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_session_exercise_fk" FOREIGN KEY ("session_exercise_id","user_id") REFERENCES "public"."session_exercises"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "body_measurements_user_day_idx" ON "body_measurements" USING btree ("user_id","day");--> statement-breakpoint
CREATE INDEX "routine_items_routine_idx" ON "routine_items" USING btree ("routine_id");--> statement-breakpoint
CREATE INDEX "session_exercises_session_idx" ON "session_exercises" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "sets_session_exercise_idx" ON "sets" USING btree ("session_exercise_id");--> statement-breakpoint
CREATE INDEX "training_sessions_user_day_idx" ON "training_sessions" USING btree ("user_id","day");