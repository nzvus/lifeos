CREATE TABLE "ingredient_compounds" (
	"ingredient_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"compound" text NOT NULL,
	"amount" numeric(10, 3) NOT NULL,
	CONSTRAINT "ingredient_compounds_ingredient_id_compound_pk" PRIMARY KEY("ingredient_id","compound"),
	CONSTRAINT "ingredient_compounds_compound_ck" CHECK ("ingredient_compounds"."compound" in ('caffeine', 'creatine')),
	CONSTRAINT "ingredient_compounds_amount_ck" CHECK ("ingredient_compounds"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "ingredient_compounds" ADD CONSTRAINT "ingredient_compounds_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredient_compounds" ADD CONSTRAINT "ingredient_compounds_ingredient_fk" FOREIGN KEY ("ingredient_id","user_id") REFERENCES "public"."ingredients"("id","user_id") ON DELETE cascade ON UPDATE no action;