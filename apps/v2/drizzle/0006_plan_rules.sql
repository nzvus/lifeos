-- The Piano's if-then rules (docs/spec/v2/dossiers/plan.md §4, ADR-0061, ledger PLAN-35):
-- a new table, so it is safe in any merge order; the code that reads it ships after
-- «migrate v2» and also reads «no table yet» as «no rules».
-- Then a data repair (plan.md §9.6, idempotent): an empty cycle left as «Nuovo ciclo»
-- (no steps) goes to the trash. «Rec» stays: it carries his day targets.
CREATE TABLE "plan_rules" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"condition" jsonb NOT NULL,
	"effect" jsonb NOT NULL,
	"source" text DEFAULT 'typed' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "plan_rules_id_user_uq" UNIQUE("id","user_id"),
	CONSTRAINT "plan_rules_source_ck" CHECK ("plan_rules"."source" in ('typed', 'suggested'))
);
--> statement-breakpoint
ALTER TABLE "plan_rules" ADD CONSTRAINT "plan_rules_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
UPDATE "templates" AS t
SET "deleted_at" = now(), "active" = false, "updated_at" = now()
WHERE t."scope" = 'cycle'
  AND t."name" = 'Nuovo ciclo'
  AND t."deleted_at" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "cycle_steps" s WHERE s."cycle_id" = t."id");
