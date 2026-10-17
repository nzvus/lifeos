CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"code_hash" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"used_email" text,
	"used_by" uuid,
	CONSTRAINT "invites_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'Europe/Rome' NOT NULL,
	"locale" text DEFAULT 'it' NOT NULL,
	"theme" text DEFAULT 'label' NOT NULL,
	"density" text DEFAULT 'compact' NOT NULL,
	"day_boundary_min" integer DEFAULT 240 NOT NULL,
	"sex" text,
	"birth_year" integer,
	"height_cm" numeric(5, 1),
	"prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_boundary_ck" CHECK ("settings"."day_boundary_min" >= 0 and "settings"."day_boundary_min" < 1440),
	CONSTRAINT "settings_sex_ck" CHECK ("settings"."sex" is null or "settings"."sex" in ('male', 'female'))
);
--> statement-breakpoint
CREATE TABLE "catalog_items" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"catalog" text NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"based_on_id" uuid,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_items_id_user_uq" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_parts" (
	"user_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"part_item_id" uuid NOT NULL,
	"quantity" numeric(10, 2),
	"unit" text,
	"defaults" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "catalog_parts_pk" PRIMARY KEY("item_id","position"),
	CONSTRAINT "catalog_parts_quantity_ck" CHECK ("catalog_parts"."quantity" is null or "catalog_parts"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "catalog_values" (
	"user_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"field" text NOT NULL,
	"num" numeric(14, 4),
	"text" text,
	"bool" boolean,
	"ref_item_id" uuid,
	"unit" text,
	"source" text DEFAULT 'typed' NOT NULL,
	"confidence" numeric(3, 2) DEFAULT '1' NOT NULL,
	CONSTRAINT "catalog_values_pk" PRIMARY KEY("item_id","field"),
	CONSTRAINT "catalog_values_one_ck" CHECK (num_nonnulls("catalog_values"."num", "catalog_values"."text", "catalog_values"."bool", "catalog_values"."ref_item_id") = 1),
	CONSTRAINT "catalog_values_confidence_ck" CHECK ("catalog_values"."confidence" >= 0 and "catalog_values"."confidence" <= 1)
);
--> statement-breakpoint
CREATE TABLE "kinds" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"colour" text DEFAULT '' NOT NULL,
	"shape" text NOT NULL,
	"entry_mode" text DEFAULT 'form' NOT NULL,
	"definition" jsonb NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kinds_id_user_uq" UNIQUE("id","user_id"),
	CONSTRAINT "kinds_shape_ck" CHECK ("kinds"."shape" in ('instant', 'interval'))
);
--> statement-breakpoint
CREATE TABLE "price_observations" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"format_id" uuid NOT NULL,
	"shop" text DEFAULT '' NOT NULL,
	"day" date NOT NULL,
	"cents" integer NOT NULL,
	"package_qty" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"source" text NOT NULL,
	"receipt_line_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_observations_cents_ck" CHECK ("price_observations"."cents" >= 0),
	CONSTRAINT "price_observations_qty_ck" CHECK ("price_observations"."package_qty" > 0),
	CONSTRAINT "price_observations_source_ck" CHECK ("price_observations"."source" in ('receipt', 'manual', 'import'))
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"day" date NOT NULL,
	"status" text NOT NULL,
	"parent_id" uuid,
	"item_id" uuid,
	"source" text DEFAULT 'typed' NOT NULL,
	"confidence" numeric(3, 2) DEFAULT '1' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "entries_id_user_uq" UNIQUE("id","user_id"),
	CONSTRAINT "entries_status_ck" CHECK ("entries"."status" in ('planned', 'done', 'skipped')),
	CONSTRAINT "entries_source_ck" CHECK ("entries"."source" in ('typed', 'quick', 'timer', 'device', 'import', 'template', 'derived')),
	CONSTRAINT "entries_span_ck" CHECK ("entries"."end_at" is null or "entries"."start_at" is null or "entries"."end_at" > "entries"."start_at"),
	CONSTRAINT "entries_end_needs_start_ck" CHECK ("entries"."end_at" is null or "entries"."start_at" is not null),
	CONSTRAINT "entries_confidence_ck" CHECK ("entries"."confidence" >= 0 and "entries"."confidence" <= 1)
);
--> statement-breakpoint
CREATE TABLE "entry_line_values" (
	"user_id" uuid NOT NULL,
	"line_id" uuid NOT NULL,
	"field" text NOT NULL,
	"num" numeric(14, 4) NOT NULL,
	CONSTRAINT "entry_line_values_pk" PRIMARY KEY("line_id","field")
);
--> statement-breakpoint
CREATE TABLE "entry_lines" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"item_id" uuid,
	"product_id" uuid,
	"format_id" uuid,
	"name" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	CONSTRAINT "entry_lines_id_user_uq" UNIQUE("id","user_id"),
	CONSTRAINT "entry_lines_quantity_ck" CHECK ("entry_lines"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "entry_links" (
	"user_id" uuid NOT NULL,
	"from_id" uuid NOT NULL,
	"to_id" uuid NOT NULL,
	"relation" text NOT NULL,
	CONSTRAINT "entry_links_pk" PRIMARY KEY("from_id","to_id","relation"),
	CONSTRAINT "entry_links_relation_ck" CHECK ("entry_links"."relation" in ('fulfils', 'related', 'from_block'))
);
--> statement-breakpoint
CREATE TABLE "entry_values" (
	"user_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"field" text NOT NULL,
	"num" numeric(14, 4),
	"text" text,
	"bool" boolean,
	"ref_item_id" uuid,
	CONSTRAINT "entry_values_pk" PRIMARY KEY("entry_id","field"),
	CONSTRAINT "entry_values_one_ck" CHECK (num_nonnulls("entry_values"."num", "entry_values"."text", "entry_values"."bool", "entry_values"."ref_item_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "money_lines" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"movement_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2),
	"amount_cents" integer NOT NULL,
	"product_id" uuid,
	"purchase_entry_id" uuid,
	CONSTRAINT "money_lines_id_user_uq" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "money_movements" (
	"entry_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid,
	"amount_cents" integer NOT NULL,
	"category_id" uuid,
	"shop" text DEFAULT '' NOT NULL,
	"method" text,
	"receipt_id" uuid,
	CONSTRAINT "money_movements_entry_user_uq" UNIQUE("entry_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "receipt_aliases" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"shop" text DEFAULT '' NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "receipts_id_user_uq" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "training_sets" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"reps" integer,
	"load_kg" numeric(6, 2),
	"load_entry" text DEFAULT 'total' NOT NULL,
	"rir" smallint,
	"duration_s" integer,
	"warmup" boolean DEFAULT false NOT NULL,
	"side" text,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"done" boolean DEFAULT false NOT NULL,
	CONSTRAINT "training_sets_reps_ck" CHECK ("training_sets"."reps" is null or "training_sets"."reps" >= 0),
	CONSTRAINT "training_sets_load_ck" CHECK ("training_sets"."load_kg" is null or "training_sets"."load_kg" >= 0),
	CONSTRAINT "training_sets_rir_ck" CHECK ("training_sets"."rir" is null or ("training_sets"."rir" >= 0 and "training_sets"."rir" <= 10)),
	CONSTRAINT "training_sets_load_entry_ck" CHECK ("training_sets"."load_entry" in ('total', 'per_dumbbell', 'per_side')),
	CONSTRAINT "training_sets_side_ck" CHECK ("training_sets"."side" is null or "training_sets"."side" in ('left', 'right')),
	CONSTRAINT "training_sets_span_ck" CHECK ("training_sets"."ended_at" is null or "training_sets"."started_at" is null or "training_sets"."ended_at" >= "training_sets"."started_at")
);
--> statement-breakpoint
CREATE TABLE "cycle_step_items" (
	"user_id" uuid NOT NULL,
	"step_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"item_id" uuid NOT NULL,
	CONSTRAINT "cycle_step_items_pk" PRIMARY KEY("step_id","position")
);
--> statement-breakpoint
CREATE TABLE "cycle_steps" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"step_template_id" uuid,
	CONSTRAINT "cycle_steps_id_user_uq" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "cycles_state" (
	"cycle_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"advance" text DEFAULT 'occurrence' NOT NULL,
	"on_skip" text DEFAULT 'lose' NOT NULL,
	CONSTRAINT "cycles_state_advance_ck" CHECK ("cycles_state"."advance" in ('occurrence', 'date')),
	CONSTRAINT "cycles_state_on_skip_ck" CHECK ("cycles_state"."on_skip" in ('shift', 'lose'))
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"day" date NOT NULL,
	"key" text DEFAULT '' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "decisions_pk" PRIMARY KEY("user_id","kind","day","key"),
	CONSTRAINT "decisions_kind_ck" CHECK ("decisions"."kind" in ('day_closed', 'week_targets', 'day_targets', 'cycle_override', 'cycle_skip', 'habit_excused'))
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"metric" jsonb NOT NULL,
	"target" text NOT NULL,
	"value" numeric(14, 4),
	"low" numeric(14, 4),
	"high" numeric(14, 4),
	"by_date" date,
	"since_day" date NOT NULL,
	"until_day" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goals_target_ck" CHECK ("goals"."target" in ('at_least', 'at_most', 'range', 'reach')),
	CONSTRAINT "goals_values_ck" CHECK (("goals"."target" = 'range' and "goals"."low" is not null and "goals"."high" is not null and "goals"."low" <= "goals"."high") or ("goals"."target" <> 'range' and "goals"."value" is not null)),
	CONSTRAINT "goals_until_ck" CHECK ("goals"."until_day" is null or "goals"."until_day" >= "goals"."since_day")
);
--> statement-breakpoint
CREATE TABLE "template_blocks" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"kind" text,
	"item_id" uuid,
	"when" text,
	"at_min" integer,
	"anchor_block_id" uuid,
	"offset_min" integer,
	"duration_min" integer,
	"cycle_id" uuid,
	"kcal_share" numeric(4, 3),
	"protein_share" numeric(4, 3),
	"defaults" jsonb,
	"base_block_id" uuid,
	"removed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "template_blocks_id_user_uq" UNIQUE("id","user_id"),
	CONSTRAINT "template_blocks_when_ck" CHECK ("template_blocks"."when" is null or "template_blocks"."when" in ('absolute', 'after_block', 'after_wake', 'before_bed', 'unset')),
	CONSTRAINT "template_blocks_own_ck" CHECK ("template_blocks"."base_block_id" is not null or ("template_blocks"."kind" is not null and "template_blocks"."when" is not null)),
	CONSTRAINT "template_blocks_removed_ck" CHECK (not "template_blocks"."removed" or "template_blocks"."base_block_id" is not null),
	CONSTRAINT "template_blocks_shares_ck" CHECK (("template_blocks"."kcal_share" is null or ("template_blocks"."kcal_share" >= 0 and "template_blocks"."kcal_share" <= 1)) and ("template_blocks"."protein_share" is null or ("template_blocks"."protein_share" >= 0 and "template_blocks"."protein_share" <= 1)))
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"name" text NOT NULL,
	"extends_id" uuid,
	"recurrence" jsonb,
	"targets" jsonb,
	"start_day" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "templates_id_user_uq" UNIQUE("id","user_id"),
	CONSTRAINT "templates_scope_ck" CHECK ("templates"."scope" in ('block', 'day', 'week', 'cycle')),
	CONSTRAINT "templates_not_self_ck" CHECK ("templates"."extends_id" is null or "templates"."extends_id" <> "templates"."id")
);
--> statement-breakpoint
CREATE TABLE "week_layouts" (
	"user_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"template_id" uuid NOT NULL,
	CONSTRAINT "week_layouts_pk" PRIMARY KEY("user_id","weekday"),
	CONSTRAINT "week_layouts_weekday_ck" CHECK ("week_layouts"."weekday" between 1 and 7)
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_used_by_user_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_parent_fk" FOREIGN KEY ("parent_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_based_on_fk" FOREIGN KEY ("based_on_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_parts" ADD CONSTRAINT "catalog_parts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_parts" ADD CONSTRAINT "catalog_parts_item_fk" FOREIGN KEY ("item_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_parts" ADD CONSTRAINT "catalog_parts_part_fk" FOREIGN KEY ("part_item_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_values" ADD CONSTRAINT "catalog_values_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_values" ADD CONSTRAINT "catalog_values_item_fk" FOREIGN KEY ("item_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_values" ADD CONSTRAINT "catalog_values_ref_fk" FOREIGN KEY ("ref_item_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kinds" ADD CONSTRAINT "kinds_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_format_fk" FOREIGN KEY ("format_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_parent_fk" FOREIGN KEY ("parent_id","user_id") REFERENCES "public"."entries"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_item_fk" FOREIGN KEY ("item_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_line_values" ADD CONSTRAINT "entry_line_values_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_line_values" ADD CONSTRAINT "entry_line_values_line_fk" FOREIGN KEY ("line_id","user_id") REFERENCES "public"."entry_lines"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_lines" ADD CONSTRAINT "entry_lines_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_lines" ADD CONSTRAINT "entry_lines_entry_fk" FOREIGN KEY ("entry_id","user_id") REFERENCES "public"."entries"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_lines" ADD CONSTRAINT "entry_lines_item_fk" FOREIGN KEY ("item_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_lines" ADD CONSTRAINT "entry_lines_product_fk" FOREIGN KEY ("product_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_lines" ADD CONSTRAINT "entry_lines_format_fk" FOREIGN KEY ("format_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_links" ADD CONSTRAINT "entry_links_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_links" ADD CONSTRAINT "entry_links_from_fk" FOREIGN KEY ("from_id","user_id") REFERENCES "public"."entries"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_links" ADD CONSTRAINT "entry_links_to_fk" FOREIGN KEY ("to_id","user_id") REFERENCES "public"."entries"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_values" ADD CONSTRAINT "entry_values_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_values" ADD CONSTRAINT "entry_values_entry_fk" FOREIGN KEY ("entry_id","user_id") REFERENCES "public"."entries"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_values" ADD CONSTRAINT "entry_values_ref_fk" FOREIGN KEY ("ref_item_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_lines" ADD CONSTRAINT "money_lines_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_lines" ADD CONSTRAINT "money_lines_movement_fk" FOREIGN KEY ("movement_id","user_id") REFERENCES "public"."money_movements"("entry_id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_lines" ADD CONSTRAINT "money_lines_product_fk" FOREIGN KEY ("product_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_lines" ADD CONSTRAINT "money_lines_purchase_fk" FOREIGN KEY ("purchase_entry_id","user_id") REFERENCES "public"."entries"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_movements" ADD CONSTRAINT "money_movements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_movements" ADD CONSTRAINT "money_movements_entry_fk" FOREIGN KEY ("entry_id","user_id") REFERENCES "public"."entries"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_movements" ADD CONSTRAINT "money_movements_account_fk" FOREIGN KEY ("account_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_movements" ADD CONSTRAINT "money_movements_category_fk" FOREIGN KEY ("category_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_movements" ADD CONSTRAINT "money_movements_receipt_fk" FOREIGN KEY ("receipt_id","user_id") REFERENCES "public"."receipts"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_aliases" ADD CONSTRAINT "receipt_aliases_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_aliases" ADD CONSTRAINT "receipt_aliases_product_fk" FOREIGN KEY ("product_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sets" ADD CONSTRAINT "training_sets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sets" ADD CONSTRAINT "training_sets_entry_fk" FOREIGN KEY ("entry_id","user_id") REFERENCES "public"."entries"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_step_items" ADD CONSTRAINT "cycle_step_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_step_items" ADD CONSTRAINT "cycle_step_items_step_fk" FOREIGN KEY ("step_id","user_id") REFERENCES "public"."cycle_steps"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_step_items" ADD CONSTRAINT "cycle_step_items_item_fk" FOREIGN KEY ("item_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_steps" ADD CONSTRAINT "cycle_steps_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_steps" ADD CONSTRAINT "cycle_steps_cycle_fk" FOREIGN KEY ("cycle_id","user_id") REFERENCES "public"."templates"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_steps" ADD CONSTRAINT "cycle_steps_step_fk" FOREIGN KEY ("step_template_id","user_id") REFERENCES "public"."templates"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycles_state" ADD CONSTRAINT "cycles_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycles_state" ADD CONSTRAINT "cycles_state_cycle_fk" FOREIGN KEY ("cycle_id","user_id") REFERENCES "public"."templates"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_blocks" ADD CONSTRAINT "template_blocks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_blocks" ADD CONSTRAINT "template_blocks_template_fk" FOREIGN KEY ("template_id","user_id") REFERENCES "public"."templates"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_blocks" ADD CONSTRAINT "template_blocks_item_fk" FOREIGN KEY ("item_id","user_id") REFERENCES "public"."catalog_items"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_blocks" ADD CONSTRAINT "template_blocks_cycle_fk" FOREIGN KEY ("cycle_id","user_id") REFERENCES "public"."templates"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_blocks" ADD CONSTRAINT "template_blocks_anchor_fk" FOREIGN KEY ("anchor_block_id","user_id") REFERENCES "public"."template_blocks"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_blocks" ADD CONSTRAINT "template_blocks_base_fk" FOREIGN KEY ("base_block_id","user_id") REFERENCES "public"."template_blocks"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_extends_fk" FOREIGN KEY ("extends_id","user_id") REFERENCES "public"."templates"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_layouts" ADD CONSTRAINT "week_layouts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_layouts" ADD CONSTRAINT "week_layouts_template_fk" FOREIGN KEY ("template_id","user_id") REFERENCES "public"."templates"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invites_created_by_idx" ON "invites" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_items_live_name_uq" ON "catalog_items" USING btree ("user_id","catalog",coalesce("parent_id", '00000000-0000-0000-0000-000000000000'::uuid),lower("name")) WHERE "catalog_items"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "catalog_items_user_catalog_idx" ON "catalog_items" USING btree ("user_id","catalog");--> statement-breakpoint
CREATE INDEX "catalog_items_parent_idx" ON "catalog_items" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "catalog_parts_part_idx" ON "catalog_parts" USING btree ("part_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "kinds_user_key_uq" ON "kinds" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "price_observations_format_day_idx" ON "price_observations" USING btree ("format_id","day");--> statement-breakpoint
CREATE INDEX "entries_user_day_idx" ON "entries" USING btree ("user_id","day");--> statement-breakpoint
CREATE INDEX "entries_user_kind_day_idx" ON "entries" USING btree ("user_id","kind","day");--> statement-breakpoint
CREATE INDEX "entries_parent_idx" ON "entries" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entry_lines_entry_position_uq" ON "entry_lines" USING btree ("entry_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "money_lines_movement_position_uq" ON "money_lines" USING btree ("movement_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "receipt_aliases_user_key_uq" ON "receipt_aliases" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "receipts_user_day_idx" ON "receipts" USING btree ("user_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "training_sets_entry_position_uq" ON "training_sets" USING btree ("entry_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "cycle_steps_cycle_position_uq" ON "cycle_steps" USING btree ("cycle_id","position");--> statement-breakpoint
CREATE INDEX "goals_user_since_idx" ON "goals" USING btree ("user_id","since_day");--> statement-breakpoint
CREATE INDEX "template_blocks_template_idx" ON "template_blocks" USING btree ("template_id");