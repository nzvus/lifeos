ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_id_user_uq" UNIQUE("id","user_id");--> statement-breakpoint
CREATE TABLE "weigh_in_context" (
	"measurement_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"measured_at" timestamp with time zone,
	"fasted" boolean,
	"after_toilet" boolean,
	"after_training" boolean
);
--> statement-breakpoint
ALTER TABLE "weigh_in_context" ADD CONSTRAINT "weigh_in_context_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weigh_in_context" ADD CONSTRAINT "weigh_in_context_measurement_fk" FOREIGN KEY ("measurement_id","user_id") REFERENCES "public"."body_measurements"("id","user_id") ON DELETE cascade ON UPDATE no action;