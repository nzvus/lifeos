CREATE TABLE "sleep_logs" (
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"bed_at" timestamp with time zone NOT NULL,
	"wake_at" timestamp with time zone NOT NULL,
	"quality" integer,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sleep_logs_user_id_day_pk" PRIMARY KEY("user_id","day"),
	CONSTRAINT "sleep_logs_order_ck" CHECK ("sleep_logs"."wake_at" > "sleep_logs"."bed_at"),
	CONSTRAINT "sleep_logs_length_ck" CHECK ("sleep_logs"."wake_at" - "sleep_logs"."bed_at" <= interval '24 hours'),
	CONSTRAINT "sleep_logs_quality_ck" CHECK ("sleep_logs"."quality" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "sleep_logs" ADD CONSTRAINT "sleep_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;