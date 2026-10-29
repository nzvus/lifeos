-- Data repair R2 (docs/spec/v2/dossiers/data-repair.md, capture.md §4). Data
-- only, no schema change, safe in any order with the code (since #299 a meal
-- stores its role at save). Idempotent: a second run finds nothing to change.
--
-- A timed meal saved with no role («Senza scelta»: 60 done meals in the export
-- of 29 Oct) takes the role of its local time, as `mealRoleAt` does: before
-- 05:00 a snack, then breakfast, lunch from `lunchFrom`, snack from
-- `snackFrom`, dinner from `dinnerFrom` (the person's settings, else 11:00,
-- 15:00, 18:30); `roleSource = auto`, so moving the meal moves its role.
WITH m AS (
  SELECT
    e."id",
    e."user_id",
    EXTRACT(HOUR FROM e."start_at" AT TIME ZONE COALESCE(st."timezone", 'Europe/Rome')) * 60
      + EXTRACT(MINUTE FROM e."start_at" AT TIME ZONE COALESCE(st."timezone", 'Europe/Rome')) AS minute,
    COALESCE((st."prefs" ->> 'lunchFrom')::int, 660) AS lunch_from,
    COALESCE((st."prefs" ->> 'snackFrom')::int, 900) AS snack_from,
    COALESCE((st."prefs" ->> 'dinnerFrom')::int, 1110) AS dinner_from
  FROM "entries" e
  LEFT JOIN "settings" st ON st."user_id" = e."user_id"
  WHERE e."kind" = 'meal'
    AND e."start_at" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM "entry_values" v
      WHERE v."entry_id" = e."id" AND v."field" = 'role' AND COALESCE(v."text", '') <> ''
    )
)
INSERT INTO "entry_values" ("user_id", "entry_id", "field", "text")
SELECT m."user_id", m."id", f.field,
  CASE
    WHEN f.field = 'roleSource' THEN 'auto'
    WHEN m.minute < 300 THEN 'snack'
    WHEN m.minute < m.lunch_from THEN 'breakfast'
    WHEN m.minute < m.snack_from THEN 'lunch'
    WHEN m.minute < m.dinner_from THEN 'snack'
    ELSE 'dinner'
  END
FROM m CROSS JOIN (VALUES ('role'), ('roleSource')) AS f(field)
ON CONFLICT ("entry_id", "field") DO UPDATE SET "text" = EXCLUDED."text";
