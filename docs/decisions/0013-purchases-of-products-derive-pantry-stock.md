# ADR-0013: Purchases are of products linked to ingredients; stock is derived from events

**Status:** accepted (delegated to the agent by the developer, 2026-10-01)
**Date:** 2026-10-01

## Context
The developer wants to record what they buy (manually now, from receipts
later), see price history, know how much of each food is left, when it runs
out, and get a shopping list. Ingredients today carry one package price and
size (ADR-0007 snapshots copy it into the log). A receipt line names a
product ("PASSATA MUTTI 700G"), not an ingredient, and one ingredient may be
bought as several brands and sizes in different shops. Eating is already
recorded, in grams, by the log (ADR-0007/0009); stock must agree with it
without double bookkeeping.

## Options considered
### A. Purchases directly on ingredients
- Pros: one table (`purchases`: ingredient, day, packages, size, price, shop); price history for free; smallest change.
- Cons: two brands of one ingredient are indistinguishable; receipts would have to be matched straight to ingredients, and every new brand would mean a new ingredient or lost detail.
### B. Products between receipts and ingredients (ADR-0007's option D)
- Pros: `products` (brand, package size, shop, optional barcode) → one ingredient; purchases reference products; later `receipts` with raw lines reviewed and linked to a product. Receipt/OCR, per-shop and per-brand prices and barcodes fit without reshaping; nutrition stays on the ingredient, so nothing existing changes.
- Cons: one more table and one more step when entering a purchase by hand (mitigated: a product can be created inline from the purchase form).
### C. A live pantry inventory
- Pros: reading stock is a lookup.
- Cons: a stored quantity updated by purchases and meals drifts and cannot be rebuilt; no history ("how much do I eat per month"); a second place that can disagree with the log.

## Decision
**B**, with stock **derived from events**, never stored:

- stock(ingredient) = Σ purchased − Σ eaten (log entries in "eaten" status, from the snapshot lines' quantities) ± **stock counts**, where a count ("I have half a pack") resets the running total at a moment, so drift from untracked eating is corrected by a single action;
- "runs out in N days" = stock ÷ average daily use over the last 30 days;
- shopping list = ingredients that run out within a user-set horizon;
- the ingredient's price used by new log snapshots becomes the latest purchase's price per g/ml when there is one (the manual package price stays as the fallback);
- the data lives in Neon with nutrition (same owner, same backups); where **finance** data lives is a separate ADR.

Decisive: B is the only option receipts can land on without a later reshape, and deriving stock keeps the log as the single record of eating (invariant: totals equal the sum of entries).
Tripwire: if deriving stock over the whole history becomes slow, cache per-ingredient totals at each count (counts already split the history).

## Consequences
- New tables (one migration, separate PR first): `products`, `purchases`, `stock_counts`; later `receipts` and `receipt_lines`. Composite `(id, user_id)` keys, cross-user tests, as everywhere.
- Log snapshots must keep `ingredient_id` for stock to subtract eating; entries without it (estimated meals) do not affect stock.
- Unit conversions: purchases in packages × size in the ingredient's unit (g/ml); "pieces" wait for a unit ADR if needed.
- Export gains products, purchases and counts (next export version).
- v1 is manual entry only; receipt OCR is a later slice on the same schema.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
