ALTER TABLE "cycle_steps" DROP CONSTRAINT "cycle_steps_cycle_fk";
--> statement-breakpoint
ALTER TABLE "cycle_steps" ADD CONSTRAINT "cycle_steps_cycle_fk" FOREIGN KEY ("cycle_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE cascade ON UPDATE no action;