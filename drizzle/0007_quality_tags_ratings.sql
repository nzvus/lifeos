CREATE TABLE "ingredient_tags" (
	"user_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "ingredient_tags_pk" PRIMARY KEY("ingredient_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "meal_ratings" (
	"user_id" uuid NOT NULL,
	"meal_id" uuid NOT NULL,
	"factor_id" uuid NOT NULL,
	"score" integer NOT NULL,
	CONSTRAINT "meal_ratings_pk" PRIMARY KEY("meal_id","factor_id"),
	CONSTRAINT "meal_ratings_score_ck" CHECK ("meal_ratings"."score" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "rating_factors" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rating_factors_user_name_uq" UNIQUE("user_id","name"),
	CONSTRAINT "rating_factors_id_user_uq" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT 'tag' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_user_name_uq" UNIQUE("user_id","name"),
	CONSTRAINT "tags_id_user_uq" UNIQUE("id","user_id")
);
--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "nova" integer;--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "origin" text;--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "fiber_types" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "log_entry_items" ADD COLUMN "nova" integer;--> statement-breakpoint
ALTER TABLE "log_entry_items" ADD COLUMN "origin" text;--> statement-breakpoint
ALTER TABLE "log_entry_items" ADD COLUMN "fiber_types" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "review" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ingredient_tags" ADD CONSTRAINT "ingredient_tags_ingredient_fk" FOREIGN KEY ("ingredient_id","user_id") REFERENCES "public"."ingredients"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredient_tags" ADD CONSTRAINT "ingredient_tags_tag_fk" FOREIGN KEY ("tag_id","user_id") REFERENCES "public"."tags"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_ratings" ADD CONSTRAINT "meal_ratings_meal_fk" FOREIGN KEY ("meal_id","user_id") REFERENCES "public"."meals"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_ratings" ADD CONSTRAINT "meal_ratings_factor_fk" FOREIGN KEY ("factor_id","user_id") REFERENCES "public"."rating_factors"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_factors" ADD CONSTRAINT "rating_factors_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_nova_ck" CHECK ("ingredients"."nova" between 1 and 4);--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_origin_ck" CHECK ("ingredients"."origin" in ('plant', 'animal', 'mixed'));--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_fiber_types_ck" CHECK ("ingredients"."fiber_types" <@ array['inulin_fos', 'beta_glucan', 'resistant_starch', 'pectin', 'psyllium', 'insoluble', 'gos']::text[]);--> statement-breakpoint
ALTER TABLE "log_entry_items" ADD CONSTRAINT "log_entry_items_nova_ck" CHECK ("log_entry_items"."nova" between 1 and 4);--> statement-breakpoint
ALTER TABLE "log_entry_items" ADD CONSTRAINT "log_entry_items_origin_ck" CHECK ("log_entry_items"."origin" in ('plant', 'animal', 'mixed'));--> statement-breakpoint
ALTER TABLE "log_entry_items" ADD CONSTRAINT "log_entry_items_fiber_types_ck" CHECK ("log_entry_items"."fiber_types" <@ array['inulin_fos', 'beta_glucan', 'resistant_starch', 'pectin', 'psyllium', 'insoluble', 'gos']::text[]);