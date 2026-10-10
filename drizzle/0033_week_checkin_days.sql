CREATE TABLE "week_checkin_days" (
	"user_id" uuid NOT NULL,
	"start_day" date NOT NULL,
	"day" date NOT NULL,
	"shift_kcal" integer NOT NULL,
	CONSTRAINT "week_checkin_days_user_id_start_day_day_pk" PRIMARY KEY("user_id","start_day","day"),
	CONSTRAINT "week_checkin_days_shift_ck" CHECK ("week_checkin_days"."shift_kcal" between -2000 and 2000)
);
--> statement-breakpoint
ALTER TABLE "week_checkin_days" ADD CONSTRAINT "week_checkin_days_checkin_fk" FOREIGN KEY ("user_id","start_day") REFERENCES "public"."week_checkins"("user_id","start_day") ON DELETE cascade ON UPDATE no action;