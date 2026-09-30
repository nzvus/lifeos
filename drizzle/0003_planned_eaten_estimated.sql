ALTER TABLE "log_entries" ADD COLUMN "status" text DEFAULT 'eaten' NOT NULL;--> statement-breakpoint
ALTER TABLE "log_entries" ADD COLUMN "at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "log_entries" ADD COLUMN "estimated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "log_entries" ADD CONSTRAINT "log_entries_status_ck" CHECK ("log_entries"."status" in ('planned', 'eaten'));