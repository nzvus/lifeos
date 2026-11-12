-- Data repair PL-30 (change 2026-11-07-piano, Q-18 (a), his pick 10 Nov; «ap yc» 12 Nov): a
-- ciclo step's scheda becomes a blocco «nel ciclo» holding it, as the step Composer does on
-- save (`core/plans/cycles-repo.ts` `inCycleBlockOf`). Data only; idempotent: once no step
-- holds a scheda, a second run changes nothing.
--
-- - Only the steps of his live cicli (not archived, not deleted; *decided by the agent* on the
--   dry-run of his 10 Nov export: 5 of 8 schede were in paused cicli, whose blocchi would only
--   crowd his blocchi list). A paused ciclo's steps are read as before and become blocchi when
--   he saves them (`setCycleSteps`).
-- - For each scheda (catalog «routine», not deleted) a step of a live ciclo holds: his live blocco «nel
--   ciclo» that holds that scheda alone, else a new one named as the scheda (« (ciclo)» when a
--   live blocco of his has that name), area Corpo, recurrence {"type":"inCycle"}, no time
--   (PL-12 places it), the scheda as its one part.
-- - The step's item then points at the blocco. The step's keys for the ciclo stay the same
--   (`read.ts` reads a blocco's objects), so the step due each day does not change (PL-31).
-- - Other step items (an exercise of a v1 program) are left as they are.
-- - Stops when a new name is taken twice («X» and «X (ciclo)»): nothing is written.
DROP TABLE IF EXISTS "_step_blocks";
--> statement-breakpoint
DROP TABLE IF EXISTS "_live_steps";
--> statement-breakpoint
CREATE TEMP TABLE "_live_steps" AS
SELECT st."id", st."user_id" FROM "cycle_steps" st
JOIN "catalog_items" c ON c."id" = st."cycle_id" AND c."user_id" = st."user_id"
WHERE c."archived_at" IS NULL AND c."deleted_at" IS NULL;
--> statement-breakpoint
CREATE TEMP TABLE "_step_blocks" AS
WITH used AS (
  SELECT DISTINCT si."user_id", r."id" AS rid, r."name"
  FROM "cycle_step_items" si
  JOIN "_live_steps" ls ON ls."id" = si."step_id" AND ls."user_id" = si."user_id"
  JOIN "catalog_items" r ON r."id" = si."item_id" AND r."user_id" = si."user_id"
  WHERE r."catalog" = 'routine' AND r."deleted_at" IS NULL
),
alone AS (
  SELECT b."user_id", b."id" AS bid, min(p."part_item_id"::text)::uuid AS rid
  FROM "catalog_items" b
  JOIN "catalog_values" v ON v."item_id" = b."id" AND v."field" = 'recurrence'
    AND v."text" = '{"type":"inCycle"}'
  JOIN "catalog_parts" p ON p."item_id" = b."id"
  WHERE b."catalog" = 'block' AND b."deleted_at" IS NULL AND b."archived_at" IS NULL
  GROUP BY b."user_id", b."id"
  HAVING count(*) = 1
)
SELECT u."user_id", u.rid,
  (SELECT a.bid FROM alone a WHERE a."user_id" = u."user_id" AND a.rid = u.rid
   ORDER BY a.bid LIMIT 1) AS existing,
  pg_catalog.gen_random_uuid() AS new_id,
  CASE WHEN EXISTS (
    SELECT 1 FROM "catalog_items" x
    WHERE x."user_id" = u."user_id" AND x."catalog" = 'block' AND x."parent_id" IS NULL
      AND x."deleted_at" IS NULL AND lower(x."name") = lower(u."name")
  ) THEN u."name" || ' (ciclo)' ELSE u."name" END AS name
FROM used u;
--> statement-breakpoint
DO $$
DECLARE
  n int;
  made int;
  moved int;
BEGIN
  SELECT count(*) INTO n FROM "_step_blocks" s
  WHERE s.existing IS NULL AND EXISTS (
    SELECT 1 FROM "catalog_items" x
    WHERE x."user_id" = s."user_id" AND x."catalog" = 'block' AND x."parent_id" IS NULL
      AND x."deleted_at" IS NULL AND lower(x."name") = lower(s.name)
  );
  IF n > 0 THEN
    RAISE EXCEPTION 'PL-30: % scheda name(s) taken by a blocco twice; rename one first', n;
  END IF;
  INSERT INTO "catalog_items" ("id", "user_id", "catalog", "name")
  SELECT s.new_id, s."user_id", 'block', s.name FROM "_step_blocks" s WHERE s.existing IS NULL;
  GET DIAGNOSTICS made = ROW_COUNT;
  INSERT INTO "catalog_values" ("user_id", "item_id", "field", "text")
  SELECT s."user_id", s.new_id, f.field, f.text
  FROM "_step_blocks" s
  CROSS JOIN (VALUES ('area', 'Corpo'), ('recurrence', '{"type":"inCycle"}')) AS f(field, text)
  WHERE s.existing IS NULL;
  INSERT INTO "catalog_parts" ("user_id", "item_id", "position", "part_item_id")
  SELECT s."user_id", s.new_id, 0, s.rid FROM "_step_blocks" s WHERE s.existing IS NULL;
  UPDATE "cycle_step_items" si
  SET "item_id" = coalesce(s.existing, s.new_id)
  FROM "_step_blocks" s
  WHERE si."user_id" = s."user_id" AND si."item_id" = s.rid
    AND si."step_id" IN (SELECT ls."id" FROM "_live_steps" ls);
  GET DIAGNOSTICS moved = ROW_COUNT;
  RAISE NOTICE 'PL-30: % blocchi «nel ciclo» made, % step items now hold one', made, moved;
END $$;
--> statement-breakpoint
DROP TABLE "_step_blocks";
--> statement-breakpoint
DROP TABLE "_live_steps";
