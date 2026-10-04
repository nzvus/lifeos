CREATE TABLE "log_entry_left_out" (
	"entry_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "money_categories" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"parent_id" uuid,
	"key" text,
	"icon" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "money_categories_id_user_uq" UNIQUE("id","user_id"),
	CONSTRAINT "money_categories_kind_ck" CHECK ("money_categories"."kind" in ('expense', 'income'))
);
--> statement-breakpoint
CREATE TABLE "money_lines" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"movement_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(8, 2),
	"amount_cents" integer NOT NULL,
	"product_id" uuid,
	"purchase_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "money_lines_amount_ck" CHECK ("money_lines"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "money_movements" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"amount_cents" integer NOT NULL,
	"category_id" uuid,
	"description" text DEFAULT '' NOT NULL,
	"shop" text DEFAULT '' NOT NULL,
	"method" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"receipt_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "money_movements_id_user_uq" UNIQUE("id","user_id"),
	CONSTRAINT "money_movements_amount_ck" CHECK ("money_movements"."amount_cents" <> 0),
	CONSTRAINT "money_movements_method_ck" CHECK ("money_movements"."method" in ('card', 'cash', 'account', 'other'))
);
--> statement-breakpoint
CREATE TABLE "money_receipts" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"shop" text DEFAULT '' NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "money_receipts_id_user_uq" UNIQUE("id","user_id")
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
ALTER TABLE "log_entry_left_out" ADD CONSTRAINT "log_entry_left_out_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_entry_left_out" ADD CONSTRAINT "log_entry_left_out_entry_fk" FOREIGN KEY ("entry_id","user_id") REFERENCES "public"."log_entries"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_categories" ADD CONSTRAINT "money_categories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_categories" ADD CONSTRAINT "money_categories_parent_fk" FOREIGN KEY ("parent_id","user_id") REFERENCES "public"."money_categories"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_lines" ADD CONSTRAINT "money_lines_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_lines" ADD CONSTRAINT "money_lines_movement_fk" FOREIGN KEY ("movement_id","user_id") REFERENCES "public"."money_movements"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_lines" ADD CONSTRAINT "money_lines_product_fk" FOREIGN KEY ("product_id","user_id") REFERENCES "public"."products"("id","user_id") ON DELETE SET NULL ("product_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_lines" ADD CONSTRAINT "money_lines_purchase_fk" FOREIGN KEY ("purchase_id","user_id") REFERENCES "public"."purchases"("id","user_id") ON DELETE SET NULL ("purchase_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_movements" ADD CONSTRAINT "money_movements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_movements" ADD CONSTRAINT "money_movements_category_fk" FOREIGN KEY ("category_id","user_id") REFERENCES "public"."money_categories"("id","user_id") ON DELETE SET NULL ("category_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_movements" ADD CONSTRAINT "money_movements_receipt_fk" FOREIGN KEY ("receipt_id","user_id") REFERENCES "public"."money_receipts"("id","user_id") ON DELETE SET NULL ("receipt_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_receipts" ADD CONSTRAINT "money_receipts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_aliases" ADD CONSTRAINT "receipt_aliases_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_aliases" ADD CONSTRAINT "receipt_aliases_product_fk" FOREIGN KEY ("product_id","user_id") REFERENCES "public"."products"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "money_categories_user_name_uq" ON "money_categories" USING btree ("user_id","kind","name") WHERE "money_categories"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "money_lines_movement_idx" ON "money_lines" USING btree ("movement_id");--> statement-breakpoint
CREATE INDEX "money_movements_user_day_idx" ON "money_movements" USING btree ("user_id","day");--> statement-breakpoint
CREATE INDEX "money_receipts_user_day_idx" ON "money_receipts" USING btree ("user_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "receipt_aliases_user_key_uq" ON "receipt_aliases" USING btree ("user_id","key");