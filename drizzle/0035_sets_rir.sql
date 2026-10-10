ALTER TABLE "sets" ADD COLUMN "rir" integer;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_rir_ck" CHECK ("sets"."rir" between 0 and 4);