CREATE TABLE "program_skips" (
	"user_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"day" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_skips_program_id_day_pk" PRIMARY KEY("program_id","day")
);
--> statement-breakpoint
CREATE TABLE "program_slot_items" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"routine_id" uuid,
	"exercise_id" uuid,
	CONSTRAINT "program_slot_items_position_uq" UNIQUE("slot_id","position"),
	CONSTRAINT "program_slot_items_one_ck" CHECK (("program_slot_items"."routine_id" is null) <> ("program_slot_items"."exercise_id" is null))
);
--> statement-breakpoint
ALTER TABLE "program_skips" ADD CONSTRAINT "program_skips_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_skips" ADD CONSTRAINT "program_skips_program_fk" FOREIGN KEY ("program_id","user_id") REFERENCES "public"."programs"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_slot_items" ADD CONSTRAINT "program_slot_items_slot_id_program_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."program_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_slot_items" ADD CONSTRAINT "program_slot_items_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_slot_items" ADD CONSTRAINT "program_slot_items_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "program_slot_items_slot_idx" ON "program_slot_items" USING btree ("slot_id");--> statement-breakpoint
-- ADR-0035 backfill (hand-written): each existing day becomes a list of one
-- item — its exercise (program_slot_exercises) if it has one, else its routine.
INSERT INTO "program_slot_items" ("user_id", "slot_id", "position", "exercise_id")
SELECT s."user_id", s."id", 0, e."exercise_id"
FROM "program_slots" s JOIN "program_slot_exercises" e ON e."slot_id" = s."id";--> statement-breakpoint
INSERT INTO "program_slot_items" ("user_id", "slot_id", "position", "routine_id")
SELECT s."user_id", s."id", 0, s."routine_id"
FROM "program_slots" s
WHERE s."routine_id" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "program_slot_exercises" e WHERE e."slot_id" = s."id");
