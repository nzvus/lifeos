# ADR-0017: Products may be any household item; cooking a batch makes portions; reminders are derived or set by hand

**Status:** accepted (the developer chose A, A, A on 2026-10-01)
**Date:** 2026-10-01

## Context
ADR-0013 decided purchases of products linked to ingredients, with stock
derived from events (purchased − eaten ± counts), never stored. S08 asks for
more: things at home that are not food (detergent, paper, shampoo), counted
in pieces; batch cooking (four portions of a meal cooked on Sunday, eaten
during the week); and reminders that tell you to buy or cook. The log stays
the only record of eating, and stock must not count the same food twice.
This extends ADR-0013, which stays in force for food.

## Options considered
### Non-food products
#### A. One product kind, the ingredient link optional
- Pros: `products.unit` is g, ml or pieces; food stock stays per ingredient (ADR-0013), other stock is per product; a receipt mixing food and detergent lands on products either way.
- Cons: two ways stock is counted, which the UI has to make obvious.
#### B. A separate "household items" table
- Pros: food and non-food never mix in queries.
- Cons: mixed receipts split in two; prices, history and shopping list built twice.
#### C. Everything becomes a stock item (ingredients point to it)
- Pros: the cleanest model.
- Cons: reshapes nutrition tables already in production — a large, risky migration for no user-visible gain.

### Batch cooking
#### A. A "batch" event
- Pros: cooking uses the ingredients from stock when it happens and makes N portions of a meal; logging that meal takes a portion instead of ingredients (the entry links to the batch), so nothing is subtracted twice; "2 portions left" is derived.
- Cons: one more link on log entries, and the log must choose "from a batch" or "fresh".
#### B. The batch plans N future log entries
- Pros: no portion stock at all.
- Cons: plans that change leave stale planned entries; "portions left" becomes indirect.
#### C. The cooked dish becomes a home-made ingredient
- Pros: reuses ingredients and stock as they are.
- Cons: loses the link to the recipe; nutrition copied, never updated.

### Reminders
#### A. Derived, plus set by hand
- Pros: "runs out in 3 days → buy" and "2 portions left → cook" come from the data; hand-made ones cover the rest ("clean the fridge on Sundays"); shown on the day page and the shopping list.
- Cons: two kinds of reminder to present together.
#### B. Derived only
- Pros: nothing to maintain.
- Cons: nothing for chores that do not depend on stock.
#### C. Set by hand only
- Pros: simplest.
- Cons: loses "tell me when it is running out", the point of a pantry.

## Decision
**A, A, A.** Products carry a unit (g / ml / pieces) and may link to an
ingredient; food stock is per ingredient, non-food stock per product, both
derived. A batch is an event that consumes ingredients at cooking time and
yields N portions of a meal; a log entry made from a batch takes a portion
(entry → batch) and does not subtract ingredients again. Reminders are
derived (run-out horizon, portions left) or hand-made (text, optional
repeat), shown on the day page and the shopping list.

Decisive: A keeps ADR-0013 intact for food and the log as the only record of
eating, and receipts land on one table whatever they contain.
Tripwire: if most purchases turn out to be non-food, or pieces need
conversions to grams (e.g. "3 eggs"), revisit with a unit ADR.
Push notifications (app closed) stay out: they need the installable app
(PWA, backlog).

## Consequences
- Schema (one migration PR first, safe in any merge order): `products`
  (unit, optional `ingredient_id`), `purchases`, `stock_counts` (per
  ingredient or per product), `batches` (meal, portions, cooked at, lines
  used), `log_entries.batch_id` (nullable), `reminders` (text, due, repeat,
  done). Composite `(id, user_id)` keys and cross-user tests, as everywhere.
- Stock and "runs out in" become a core module reading purchases, counts,
  eaten entries (those without `batch_id`) and batches.
- Export gains products, purchases, counts, batches and reminders (version 7).
- Trash (ADR-0015) applies to products, batches and reminders.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
