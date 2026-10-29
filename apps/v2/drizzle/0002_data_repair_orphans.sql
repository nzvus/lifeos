-- Data repair R1 and R3 (docs/spec/v2/dossiers/data-repair.md). Data only, no
-- schema change: safe in any order with the code. Idempotent: a second run
-- finds nothing to change.
--
-- R1: children still live whose parent is in the trash (176 session exercises
-- in the export of 29 Oct) leave with their parent, at the parent's instant,
-- so restoring the parent brings them back (core/entries/write.ts).
UPDATE "entries" AS c
SET "deleted_at" = p."deleted_at"
FROM "entries" AS p
WHERE c."parent_id" = p."id"
  AND c."user_id" = p."user_id"
  AND c."deleted_at" IS NULL
  AND p."deleted_at" IS NOT NULL;
--> statement-breakpoint
-- R3: an exercise with no set inside a finished session was not done: skipped,
-- as finishSession does since #294 (8 rows in the export of 29 Oct).
UPDATE "entries" AS c
SET "status" = 'skipped'
FROM "entries" AS p
WHERE c."parent_id" = p."id"
  AND c."user_id" = p."user_id"
  AND c."kind" = 'session_exercise'
  AND c."status" = 'done'
  AND p."status" = 'done'
  AND c."deleted_at" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "training_sets" t WHERE t."entry_id" = c."id");
