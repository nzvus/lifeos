-- Data repair R6 (docs/spec/v2/dossiers/data-repair.md, capture.md §4 and §9.0).
-- Data only, no schema change. Run it AFTER the code that knows the `intake`
-- kind is deployed (PR #303): before, Oggi would meet a kind it cannot read.
-- Idempotent: a second run finds nothing to change.
--
-- A «meal» of one catalog food with no energy (no line value for kcal other
-- than 0) is an «assunzione»: coffee, creatine, a supplement. In the export of
-- 29 Oct: 51 entries (Creatina 24, Caffè macinato 24, Capsula caffè 3), no
-- real meal. Their role goes with them: an intake has none.
UPDATE "entries" AS e
SET "kind" = 'intake', "updated_at" = now()
WHERE e."kind" = 'meal'
  AND (SELECT count(*) FROM "entry_lines" l WHERE l."entry_id" = e."id") = 1
  AND EXISTS (
    SELECT 1 FROM "entry_lines" l
    WHERE l."entry_id" = e."id" AND l."item_id" IS NOT NULL
  )
  AND NOT EXISTS (
    SELECT 1 FROM "entry_lines" l
    JOIN "entry_line_values" v ON v."line_id" = l."id"
    WHERE l."entry_id" = e."id" AND v."field" = 'kcal' AND v."num" <> 0
  );
--> statement-breakpoint
DELETE FROM "entry_values" AS v
USING "entries" AS e
WHERE v."entry_id" = e."id"
  AND e."kind" = 'intake'
  AND v."field" IN ('role', 'roleSource');
