CREATE TABLE "program_slots" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"routine_id" uuid,
	"label" text DEFAULT '' NOT NULL,
	CONSTRAINT "program_slots_position_uq" UNIQUE("program_id","position"),
	CONSTRAINT "program_slots_position_ck" CHECK ("program_slots"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"start_day" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "programs_id_user_uq" UNIQUE("id","user_id")
);
--> statement-breakpoint
ALTER TABLE "program_slots" ADD CONSTRAINT "program_slots_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_slots" ADD CONSTRAINT "program_slots_program_fk" FOREIGN KEY ("program_id","user_id") REFERENCES "public"."programs"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "program_slots_program_idx" ON "program_slots" USING btree ("program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "programs_one_active_uq" ON "programs" USING btree ("user_id") WHERE "programs"."active" and "programs"."deleted_at" is null;