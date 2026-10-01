CREATE TABLE "batch_lines" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"ingredient_id" uuid,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"kcal" numeric(10, 3) NOT NULL,
	"protein" numeric(10, 3) NOT NULL,
	"carbs" numeric(10, 3) NOT NULL,
	"sugars" numeric(10, 3) NOT NULL,
	"fat" numeric(10, 3) NOT NULL,
	"saturated_fat" numeric(10, 3) NOT NULL,
	"fiber" numeric(10, 3) NOT NULL,
	"salt" numeric(10, 3) NOT NULL,
	"package_price_cents" integer,
	"package_size" numeric(10, 2),
	"nova" integer,
	"origin" text,
	"fiber_types" text[] DEFAULT '{}'::text[] NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "batch_lines_quantity_ck" CHECK ("batch_lines"."quantity" > 0),
	CONSTRAINT "batch_lines_nova_ck" CHECK ("batch_lines"."nova" between 1 and 4),
	CONSTRAINT "batch_lines_origin_ck" CHECK ("batch_lines"."origin" in ('plant', 'animal', 'mixed')),
	CONSTRAINT "batch_lines_fiber_types_ck" CHECK ("batch_lines"."fiber_types" <@ array['inulin_fos', 'beta_glucan', 'resistant_starch', 'pectin', 'psyllium', 'insoluble', 'gos']::text[])
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"meal_id" uuid,
	"label" text NOT NULL,
	"portions" integer NOT NULL,
	"cooked_at" timestamp with time zone NOT NULL,
	"day" date NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "batches_id_user_uq" UNIQUE("id","user_id"),
	CONSTRAINT "batches_portions_ck" CHECK ("batches"."portions" > 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"brand" text DEFAULT '' NOT NULL,
	"unit" text NOT NULL,
	"package_size" numeric(10, 2) NOT NULL,
	"ingredient_id" uuid,
	"shop" text DEFAULT '' NOT NULL,
	"barcode" text,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "products_id_user_uq" UNIQUE("id","user_id"),
	CONSTRAINT "products_unit_ck" CHECK ("products"."unit" in ('g', 'ml', 'piece')),
	CONSTRAINT "products_package_size_ck" CHECK ("products"."package_size" > 0),
	CONSTRAINT "products_piece_no_ingredient_ck" CHECK ("products"."unit" <> 'piece' or "products"."ingredient_id" is null)
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"day" date NOT NULL,
	"packages" numeric(8, 2) NOT NULL,
	"price_cents" integer,
	"shop" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "purchases_id_user_uq" UNIQUE("id","user_id"),
	CONSTRAINT "purchases_packages_ck" CHECK ("purchases"."packages" > 0),
	CONSTRAINT "purchases_price_ck" CHECK ("purchases"."price_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"due_day" date,
	"repeat_days" integer,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "reminders_repeat_ck" CHECK ("reminders"."repeat_days" > 0)
);
--> statement-breakpoint
CREATE TABLE "stock_counts" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"ingredient_id" uuid,
	"product_id" uuid,
	"quantity" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_counts_one_target_ck" CHECK (("stock_counts"."ingredient_id" is null) <> ("stock_counts"."product_id" is null)),
	CONSTRAINT "stock_counts_quantity_ck" CHECK ("stock_counts"."quantity" >= 0)
);
--> statement-breakpoint
ALTER TABLE "log_entries" ADD COLUMN "batch_id" uuid;--> statement-breakpoint
ALTER TABLE "batch_lines" ADD CONSTRAINT "batch_lines_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_lines" ADD CONSTRAINT "batch_lines_batch_fk" FOREIGN KEY ("batch_id","user_id") REFERENCES "public"."batches"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_ingredient_fk" FOREIGN KEY ("ingredient_id","user_id") REFERENCES "public"."ingredients"("id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_product_fk" FOREIGN KEY ("product_id","user_id") REFERENCES "public"."products"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_ingredient_fk" FOREIGN KEY ("ingredient_id","user_id") REFERENCES "public"."ingredients"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_product_fk" FOREIGN KEY ("product_id","user_id") REFERENCES "public"."products"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batch_lines_batch_idx" ON "batch_lines" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "batches_user_day_idx" ON "batches" USING btree ("user_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "products_user_name_uq" ON "products" USING btree ("user_id","name") WHERE "products"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "purchases_user_day_idx" ON "purchases" USING btree ("user_id","day");--> statement-breakpoint
CREATE INDEX "reminders_user_due_idx" ON "reminders" USING btree ("user_id","due_day");--> statement-breakpoint
CREATE INDEX "stock_counts_user_at_idx" ON "stock_counts" USING btree ("user_id","at");--> statement-breakpoint
ALTER TABLE "log_entries" ADD CONSTRAINT "log_entries_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "log_entries_batch_idx" ON "log_entries" USING btree ("batch_id");