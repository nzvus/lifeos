CREATE TABLE "day_closures" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"state" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "day_closures_user_id_day_pk" PRIMARY KEY("user_id","day"),
	CONSTRAINT "day_closures_state_ck" CHECK ("day_closures"."state" in ('complete', 'partial'))
);
--> statement-breakpoint
ALTER TABLE "day_closures" ADD CONSTRAINT "day_closures_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;