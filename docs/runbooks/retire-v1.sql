-- retire-v1.sql — drop v1's tables (DT-42, change 2026-11-06-retire-v1).
-- Run ONCE, by hand, in the Neon console: branch `production`, database `neondb`.
-- Never on branch `v2` / database `lifeos_v2` (the app): step 1 refuses that.
-- v1's data is kept in LIFEOS/exports/v1/lifeos-export-2026-11-06.json (verified 6 Nov)
-- and in git history; the Neon project and its branches stay.

-- 1. Where am I? Stops unless this is v1's database and holds none of the app's tables.
DO $$
BEGIN
  IF to_regclass('public.catalog_items') IS NOT NULL OR to_regclass('public.entries') IS NOT NULL THEN
    RAISE EXCEPTION 'this database holds the app (catalog_items/entries): STOP, wrong database';
  END IF;
  IF to_regclass('public.training_sessions') IS NULL OR to_regclass('public.log_entries') IS NULL THEN
    RAISE EXCEPTION 'no v1 tables here (training_sessions/log_entries): nothing to do';
  END IF;
  RAISE NOTICE 'database %: v1 tables found, none of the app', current_database();
END $$;

-- 2. What is about to go (compare with the export: 38 sessions, 328 entries on 6 Nov,
--    plus what was in v1's trash then).
SELECT 'training_sessions' AS t, count(*) FROM public.training_sessions
UNION ALL SELECT 'log_entries', count(*) FROM public.log_entries
UNION ALL SELECT 'meals', count(*) FROM public.meals
UNION ALL SELECT 'ingredients', count(*) FROM public.ingredients;

-- 3. Drop v1's schema and its migration journal, in one transaction; public comes back empty.
BEGIN;
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
DROP SCHEMA IF EXISTS drizzle CASCADE;
COMMIT;

-- 4. Check: no table left.
SELECT count(*) AS tables_left FROM information_schema.tables
WHERE table_schema IN ('public', 'drizzle');
