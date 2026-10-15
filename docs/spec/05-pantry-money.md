# 05 — Pantry and money: products, purchases, stock, receipts, scanning

Read from: `core/pantry/*`, `core/money/*`, `core/nutrition/off.ts`,
`features/nutrition/ingredients/BarcodeBox.tsx`, schema `pantry.ts`,
`money.ts`. ADRs in force: 0013, 0017, 0036.

## 1. Objects and what is collected

| Object | Fields | Table |
|---|---|---|
| Product (the thing on the shelf) | name, brand, unit g/ml/piece, package size, linked ingredient, shop, barcode, notes | `products` |
| Purchase | product, day, packages, price, shop | `purchases` |
| Stock count | ingredient or product, quantity, when | `stock_counts` |
| Reminder | text, due day, repeat every N days, done | `reminders` |
| Batch | see 02 (cooking takes ingredients out of the pantry) | `batches` |
| Money movement | day, amount (signed cents), category, description, shop, method, tags, receipt | `money_movements` |
| Movement line | description, quantity, amount, product, purchase | `money_lines` |
| Receipt | day, shop, the text | `money_receipts` |
| Receipt alias | a receipt description remembered → product | `receipt_aliases` |
| Category | two levels, expense / income, icon | `money_categories` |

**Derived:** stock = purchases − eaten − cooked ± counts, never below zero
(`stock.ts`); "runs out in N days" from recent use; the shopping list;
the month's spending, pace and categories (`summary.ts`); food spending
next to food eaten.

**Scanning:**
- Barcode (`BarcodeBox`): camera at 1920×1080, `BarcodeDetector` with a
  ZXing fallback, the check digit, lookup in Open Food Facts.
- Receipts (`receipts.ts`): Italian receipts parsed by rules, Lidl's
  quantity row after the item, discounts, the total, the shop from the
  chain; an optional model pass, off with the assistant.
- Labels: Tesseract OCR in the browser.

## 2. Issues found

**M-1 Price lives in three places plus the snapshot.** The ingredient's
package price, the purchase price and the money line. A receipt
*overwrites* the ingredient's price (`money/repositories/receipts.ts`),
so the price history survives only in purchases, and the cost of a meal
and the food spending in Money can disagree.

**M-2 The barcode creates an ingredient, not a product.** The scanner
lives on "new ingredient" only; brand and barcode belong to products. The
same food bought in two brands becomes two ingredients, and nothing helps
merge them.

**M-3 The camera can't focus.** No `focusMode: "continuous"` constraint,
no tap-to-focus, no torch, no image from a file (considerations.txt:
"la fotocamera non riesce a mettere a fuoco… dovrei poterla caricare dai
file").

**M-4 No locations, best-before, or minimum stock.** "Use first" and an
automatic shopping list can't exist.

**M-5 Label OCR is an aid, but has no review step.** No crop, no
preprocessing, no field-by-field confirmation next to the photo (plan
§2.4).

**M-6 Money has no accounts.** Movements have no account, so no balances,
and imports from bank or PayPal (backlog) have nowhere to land.

## 3. Proposals

💡 **P-1 One food identity [decision].**

```
Food (nutrition per 100; "Passata di pomodoro")      ← what the log and meals use
 └─< Product (brand, barcode, package; "Mutti 700 g")
       └─< Purchase (day, shop, packages, price, best-before, location)   ← the ONLY price history
             └── Receipt line (raw text → alias → product)
Cost of a line = the food's latest (or average) price per g from its purchases
```

The ingredient's own price becomes derived. The column stays until the
migration is verified (amends ADR-0013/0017/0036).

💡 **P-2 One scanner, everywhere.** A shared component in add-to-day, the
pantry, a purchase and a new food:
- camera with continuous focus, tap-to-focus and torch where supported
  (`MediaStreamTrack.applyConstraints`);
- a "from a photo" button (file input with `capture`, plus the
  gallery): ZXing on a still image works where live focus fails;
- lookup order: own products → Open Food Facts → "new product" (with
  its food).

💡 **P-3 Pantry that plans.** Purchases gain best-before and location
(fridge / freezer / pantry); "use first" list; a minimum per product →
the shopping list fills itself (Grocy's model).

💡 **P-4 Receipts reviewed line by line.** Per-chain profiles, the
total check, each line matched to a product (alias, then fuzzy name,
then "new"). Accepting creates the purchases and the movement together.

💡 **P-5 Labels confirmed field by field.** Crop on screen, Tesseract with
preprocessing (grayscale, threshold), each nutrient shown next to the
photo crop to confirm or correct. With a barcode, Open Food Facts first.

💡 **P-6 Merge duplicates.** Foods and products, with references moved
(entries keep their snapshots).

💡 **P-7 Accounts, later.** Accounts and balances as the base for bank and
PayPal imports (backlog; its own ADR).

## 4. Aggregation (this area)

```
raw        purchases (price, packages, best-before, location) · counts · consumption (from the log and batches) · movements
derived    stock per product/food, days left · price per g per food (from purchases) · cost per entry and per day
aggregate  monthly spending by category and shop · food spending vs food eaten · price trends
judgement  shopping list, use-first, budget pace
```
