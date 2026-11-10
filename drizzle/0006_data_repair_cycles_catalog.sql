-- Data repair PL-72 (change 2026-11-07-piano, MOD-36, ADR-0062): his cicli become catalog
-- «cycle» rows with the same id, so cycle_steps, cycle_step_items and the cycle decisions
-- (skip, override: keyed by that id) stay as they are; 0007 then points cycle_steps at
-- catalog_items. Data only here; idempotent: a second run inserts nothing.
--
-- - name and deleted_at as they were; a paused one (active = false: the inactive v1 programs
--   and the empty «Nuovo ciclo», PL-72) is archived; advance / onSkip from cycles_state
--   (default occurrence / lose, as the code reads it), start from start_day: catalog_values.
-- - the v1 programs' notes (targets.notes) stay in templates, which is kept read-only.
-- - day models / week layouts / habits → blocchi: on his data (export 6 Nov) there is nothing
--   to carry — no habit, «Rec» (every weekday) holds no block, «Come martedì 3» is paused and
--   in no week. PL-72 «or nothing»: the repair stops instead of dropping one silently, so a
--   habit or a planned block made since is carried by hand first (decided by the agent).
-- - «Rec»'s targets → Obiettivi go with the code that reads them (slice 4 of the change).
DO $$
DECLARE
  n int;
BEGIN
  SELECT count(*) INTO n FROM "templates" WHERE "scope" = 'block' AND "deleted_at" IS NULL;
  IF n > 0 THEN
    RAISE EXCEPTION 'PL-72: % live habit(s) in templates; carry them as blocchi first', n;
  END IF;
  WITH RECURSIVE planned AS (
    SELECT t."id", t."extends_id" FROM "templates" t
    WHERE t."deleted_at" IS NULL
      AND t."id" IN (SELECT "template_id" FROM "week_layouts")
    UNION
    SELECT b."id", b."extends_id" FROM "templates" b
    JOIN planned p ON p."extends_id" = b."id"
  )
  SELECT count(*) INTO n FROM "template_blocks" tb
  WHERE NOT tb."removed" AND tb."template_id" IN (SELECT "id" FROM planned);
  IF n > 0 THEN
    RAISE EXCEPTION 'PL-72: % block(s) of a day model in a week; carry them as blocchi first', n;
  END IF;
END $$;
--> statement-breakpoint
INSERT INTO "catalog_items" ("id", "user_id", "catalog", "name", "archived_at", "deleted_at", "created_at")
SELECT t."id", t."user_id", 'cycle', t."name",
  CASE WHEN t."active" OR t."deleted_at" IS NOT NULL THEN NULL ELSE now() END,
  t."deleted_at", t."created_at"
FROM "templates" t
WHERE t."scope" = 'cycle'
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalog_values" ("user_id", "item_id", "field", "text")
SELECT t."user_id", t."id", f.field, f.val
FROM "templates" t
LEFT JOIN "cycles_state" s ON s."cycle_id" = t."id"
CROSS JOIN LATERAL (VALUES
  ('advance', COALESCE(s."advance", 'occurrence')),
  ('onSkip', COALESCE(s."on_skip", 'lose')),
  ('start', t."start_day"::text)
) AS f(field, val)
WHERE t."scope" = 'cycle' AND f.val IS NOT NULL
ON CONFLICT ("item_id", "field") DO NOTHING;
--> statement-breakpoint
DO $$
DECLARE
  live int;
  archived int;
  deleted int;
BEGIN
  SELECT count(*) FILTER (WHERE "archived_at" IS NULL AND "deleted_at" IS NULL),
         count(*) FILTER (WHERE "archived_at" IS NOT NULL),
         count(*) FILTER (WHERE "deleted_at" IS NOT NULL)
  INTO live, archived, deleted
  FROM "catalog_items" WHERE "catalog" = 'cycle';
  RAISE NOTICE 'PL-72 cicli in the catalog: % live, % archived, % deleted', live, archived, deleted;
END $$;
