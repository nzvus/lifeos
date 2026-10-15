# v2 — Schema (proposal for the v2 schema ADR)

Postgres (Neon branch `v2`), Drizzle, committed SQL migrations, the same
pipeline as v1 (ADR-0003/0004). v1's invariants carry over:
- every owned table has `user_id`, every query uses `ownedBy`;
- composite foreign keys `(id, user_id)`;
- exact `numeric`, money in integer cents;
- `deleted_at` + 30-day trash;
- no stored aggregates.

**Hybrid rule (ADR-0053):** facts are generic rows (entries, values).
Only five shapes get their own tables: catalog parts, entry lines with
snapshots, training sets, money movements, and templates.

## Account
| Table | Columns (main) | Notes |
|---|---|---|
| user, session, account, verification, rate_limit, invites | Better Auth + ADR-0034 | as v1 |
| settings | user_id PK, timezone, locale, theme, density, day_boundary_min (default 240), sex, birth_year, height_cm, prefs (typed columns) | one row |

## Definitions
| Table | Columns | Notes |
|---|---|---|
| kinds | id, user_id, key, name, domain, icon, colour, shape (instant/interval), entry_mode, definition jsonb, archived_at | **user-made kinds only**; built-ins live in code. `definition` (fields, metrics, targets, relations) is validated by the same zod type as built-ins. Unique (user_id, key). |
| catalog_items | id, user_id, catalog, name, parent_id (categories, places), based_on_id, archived_at, deleted_at, timestamps | foods, recipes, products, exercises, routines, habits, projects, books, chores, money categories, accounts… Unique live (user_id, catalog, lower(name)). |
| catalog_values | item_id, field, num numeric(14,4), text, bool, ref_item_id, unit, source, confidence numeric(3,2) | PK (item_id, field). A food's nutrients per 100 g are rows (D7); a product's `food` is a ref. |
| catalog_parts | item_id, position, part_item_id, quantity numeric(10,2), unit, defaults jsonb | a recipe's foods, a routine's exercises (with default sets/reps/load/rest). |

## Facts
| Table | Columns | Notes |
|---|---|---|
| entries | id, user_id, kind, start_at timestamptz null, end_at, day date, status (planned/done/skipped), parent_id, item_id (the catalog item it is "of", if any), source, confidence numeric(3,2), note, timestamps, deleted_at | `day` = logical day, stored for indexing (derived from start_at and the boundary, or set when time is unknown). Indexes (user_id, day), (user_id, kind, day), (parent_id). Check end_at > start_at. |
| entry_values | entry_id, field, num numeric(14,4), text, bool, ref_item_id | PK (entry_id, field). |
| entry_lines | id, entry_id, position, item_id null, name (snapshot), quantity numeric(10,2), unit | composite kinds: the meal's foods as eaten. |
| entry_line_values | line_id, field, num numeric(14,4) | PK (line_id, field). The snapshot of the item's per-100 values (nutrients, price per g, quality) at logging (ADR-0007). |
| entry_links | from_id, to_id, relation (fulfils / related / from_block) | PK (from_id, to_id, relation). |
| training_sets | id, entry_id (the session's exercise entry), position, reps, load_kg numeric(6,2) (total), load_entry (total / per_dumbbell / per_side, how it was typed), rir, warmup, side, started_at, ended_at, done | specialised: timers and effort; e1RM computed on read. |
| money_movements | entry_id PK, account_id, amount_cents int (signed), category_id, shop, method, receipt_id | specialised: exact signed cents, balances per account. Lines in money_lines (position, description, quantity, amount_cents, product_id, purchase_entry_id). |
| receipts, receipt_aliases | as v1 | |

## Plans, goals, decisions
| Table | Columns | Notes |
|---|---|---|
| templates | id, user_id, scope (day/week/routine/cycle), name, extends_id, recurrence jsonb, start_day, active, deleted_at | a habit = routine + recurrence; a training program = cycle. |
| template_blocks | id, template_id, position, kind, item_id, when (absolute / after_block / after_wake / before_bed / cycle_position), at_min, anchor_block_id, offset_min, duration_min, kcal_share, protein_share, defaults jsonb | |
| week_layouts | user_id, weekday, template_id | PK (user_id, weekday). |
| goals | id, user_id, metric jsonb, target (at_least/at_most/range/reach), value, low, high, by_date, since_day, until_day | history by since_day (v1's goals carried). |
| decisions | user_id, kind (day_closed / week_targets / cycle_override / cycle_skip / habit_excused), day, key, payload jsonb, created_at | PK (user_id, kind, day, key). Never recomputed. |

## Not tables
- **Metrics, scores, trends, stock, balances, the weight/expenditure
  state:** computed (`engines.md`). A per-day cache, if speed needs one,
  is rebuildable and excluded from the export.
- **Built-in kinds and catalogs' field lists:** in code, versioned with
  the app.

## Export
The ADR-0052 contract holds: format `lifeos-export`, version 100 (the
v2 line), every owned table, a coverage test. v1 files (≤ 21) are read
by the converter (`migration.md`).
