-- Data repair PL-72 / PL-61 (change 2026-11-07-piano, slice 4; MOD-42, FD-20…22): the day's
-- food targets move from the day model of his week («Rec») into Obiettivi, values unchanged,
-- and the day models are archived (nothing reads them any more); habits made since 0006
-- become blocchi of their type (PL-03). Data only; idempotent: a second run inserts nothing.
--
-- - Goals: one per number of a dynamic model (deficitKcal, proteinGPerKg, fatGPerKg), with
--   metric.source foodDeficit / proteinPerKg / fatPerKg (core/goals/food.ts), from the model
--   on most weekdays of his week layout; since the earlier of the model's creation and his
--   first week of targets, so past days keep the numbers they had (PL-41). A source he
--   already has a goal for is left alone.
-- - A fixed model in a week (numbers, not parameters) has no goal to go to: the repair stops
--   instead of dropping it (PL-72 «or nothing»; none on his data: Rest, Run, Gym deleted on
--   1 Oct). So does a block added to a day model of his week since 0006.
-- - Habits (templates of scope 'block') → catalog «block» rows with the same id: area Oggi,
--   the same recurrence, «a un'ora» when it had a time, its duration, its type in `kind` and
--   its defaults (an activity's category); a paused one archived. The templates rows stay.
DO $$
DECLARE
  n int;
BEGIN
  SELECT count(DISTINCT t."id") INTO n FROM "templates" t
  JOIN "week_layouts" w ON w."template_id" = t."id"
  WHERE t."deleted_at" IS NULL AND t."active" AND t."targets"->>'mode' = 'fixed';
  IF n > 0 THEN
    RAISE EXCEPTION 'PL-61: % fixed day model(s) in a week; their numbers have no goal yet', n;
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
WITH ranked AS (
  SELECT t."user_id", t."id", t."name", t."targets", t."created_at",
    row_number() OVER (PARTITION BY t."user_id" ORDER BY count(*) DESC, min(w."weekday")) AS r
  FROM "templates" t
  JOIN "week_layouts" w ON w."template_id" = t."id"
  WHERE t."scope" = 'day' AND t."deleted_at" IS NULL AND t."active"
    AND t."targets"->>'mode' = 'dynamic'
  GROUP BY t."user_id", t."id", t."name", t."targets", t."created_at"
),
model AS (
  SELECT m.*, LEAST(m."created_at"::date,
    (SELECT min(d."day") FROM "decisions" d
     WHERE d."user_id" = m."user_id" AND d."kind" = 'week_targets')) AS since
  FROM ranked m WHERE m.r = 1
)
INSERT INTO "goals" ("user_id", "metric", "target", "value", "since_day")
SELECT m."user_id",
  jsonb_build_object('source', f.source, 'what', f.what, 'unit', f.unit, 'per', 'day',
    'given', 'dal modello «' || m."name" || '», 10 novembre 2026 (PL-61)'),
  'at_least', f.val, m.since
FROM model m
CROSS JOIN LATERAL (VALUES
  ('foodDeficit', 'deficit', 'kcal', (m."targets"->>'deficitKcal')::numeric),
  ('proteinPerKg', 'proteine', 'g/kg', (m."targets"->>'proteinGPerKg')::numeric),
  ('fatPerKg', 'grassi', 'g/kg', (m."targets"->>'fatGPerKg')::numeric)
) AS f(source, what, unit, val)
WHERE f.val IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "goals" g
    WHERE g."user_id" = m."user_id" AND g."metric"->>'source' = f.source
  );
--> statement-breakpoint
UPDATE "templates" SET "active" = false, "updated_at" = now()
WHERE "scope" = 'day' AND "active" AND "deleted_at" IS NULL;
--> statement-breakpoint
INSERT INTO "catalog_items" ("id", "user_id", "catalog", "name", "archived_at", "created_at")
SELECT t."id", t."user_id", 'block', t."name",
  CASE WHEN t."active" THEN NULL ELSE now() END, t."created_at"
FROM "templates" t
WHERE t."scope" = 'block' AND t."deleted_at" IS NULL AND t."recurrence" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "template_blocks" b WHERE b."template_id" = t."id" AND b."kind" IS NOT NULL)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "catalog_values" ("user_id", "item_id", "field", "text", "num")
SELECT t."user_id", t."id", f.field, f.txt, f.num
FROM "templates" t
JOIN LATERAL (
  SELECT b.* FROM "template_blocks" b
  WHERE b."template_id" = t."id" AND b."kind" IS NOT NULL
  ORDER BY b."position" LIMIT 1
) b ON true
CROSS JOIN LATERAL (VALUES
  ('area', 'Oggi', NULL::numeric),
  ('recurrence', t."recurrence"::text, NULL),
  ('kind', b."kind", NULL),
  ('defaults', b."defaults"::text, NULL),
  ('when', CASE WHEN b."at_min" IS NOT NULL THEN 'time' END, NULL),
  ('at', CASE WHEN b."at_min" IS NOT NULL THEN
    lpad((b."at_min" / 60)::text, 2, '0') || ':' || lpad((b."at_min" % 60)::text, 2, '0') END, NULL),
  ('durationMin', NULL, b."duration_min"::numeric)
) AS f(field, txt, num)
WHERE t."scope" = 'block' AND t."deleted_at" IS NULL AND t."recurrence" IS NOT NULL
  AND (f.txt IS NOT NULL OR f.num IS NOT NULL)
ON CONFLICT ("item_id", "field") DO NOTHING;
--> statement-breakpoint
DO $$
DECLARE
  g int;
  b int;
BEGIN
  SELECT count(*) INTO g FROM "goals"
  WHERE "metric"->>'source' IN ('foodDeficit', 'proteinPerKg', 'fatPerKg');
  SELECT count(*) INTO b FROM "catalog_items" WHERE "catalog" = 'block';
  RAISE NOTICE 'PL-61 food goals: %; PL-72 blocchi in the catalog: %', g, b;
END $$;
