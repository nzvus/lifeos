CREATE TABLE "program_overrides" (
	"user_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"day" date NOT NULL,
	"slot_position" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_overrides_program_id_day_pk" PRIMARY KEY("program_id","day"),
	CONSTRAINT "program_overrides_position_ck" CHECK ("program_overrides"."slot_position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "program_overrides" ADD CONSTRAINT "program_overrides_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_overrides" ADD CONSTRAINT "program_overrides_program_fk" FOREIGN KEY ("program_id","user_id") REFERENCES "public"."programs"("id","user_id") ON DELETE cascade ON UPDATE no action;