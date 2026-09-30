ALTER TABLE "user_settings" ADD COLUMN "auto_targets" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "lunch_from" integer DEFAULT 660 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "snack_from" integer DEFAULT 900 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "dinner_from" integer DEFAULT 1110 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "trends_range" integer DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "list_sort" text DEFAULT 'used' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "list_per" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_moments_ck" CHECK (300 <= "user_settings"."lunch_from" and "user_settings"."lunch_from" < "user_settings"."snack_from" and "user_settings"."snack_from" < "user_settings"."dinner_from" and "user_settings"."dinner_from" < 1440);--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_trends_range_ck" CHECK ("user_settings"."trends_range" in (7, 30, 90));