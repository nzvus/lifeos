CREATE TABLE "energy_corrections" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"since_day" date NOT NULL,
	"factor" numeric(3, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "energy_corrections_factor_ck" CHECK ("energy_corrections"."factor" between 0.80 and 1.20)
);
--> statement-breakpoint
CREATE TABLE "program_slot_exercises" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	CONSTRAINT "program_slot_exercises_slot_uq" UNIQUE("slot_id")
);
--> statement-breakpoint
ALTER TABLE "energy_corrections" ADD CONSTRAINT "energy_corrections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_slot_exercises" ADD CONSTRAINT "program_slot_exercises_slot_id_program_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."program_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_slot_exercises" ADD CONSTRAINT "program_slot_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "energy_corrections_user_day_uq" ON "energy_corrections" USING btree ("user_id","since_day");