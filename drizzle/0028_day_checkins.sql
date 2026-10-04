CREATE TABLE "day_checkins" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"mood" integer,
	"energy" integer,
	"stress" integer,
	"note" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "day_checkins_user_id_day_pk" PRIMARY KEY("user_id","day"),
	CONSTRAINT "day_checkins_scale_ck" CHECK (coalesce("day_checkins"."mood", 3) between 1 and 5 and coalesce("day_checkins"."energy", 3) between 1 and 5 and coalesce("day_checkins"."stress", 3) between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "day_checkins" ADD CONSTRAINT "day_checkins_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;