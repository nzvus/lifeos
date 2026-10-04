# ADR-0036: Money is one ledger of movements, with receipt lines that feed the pantry, in its own tab

**Status:** accepted (the developer chose the recommended option of each question, 2026-10-04)
**Date:** 2026-10-04
**Supersedes:** ADR-0035 in part (the Plan tab becomes a view of Training)

## Context
The developer wants to track spending and costs: expenses on days, products
linked to the pantry, services as a description, categories and tags for
every kind of product and service, a store of supermarket receipts filled
by the AI from their text, and the views of a modern banking app.

Prices already exist in three places, each with its own meaning:
- `purchases.price_cents` in the pantry (what a purchase cost);
- an ingredient's package price (what a portion costs, for meal cost);
- an estimated meal's cost (a 100 g "package" at the typed price).

A second place for the same euro risks counting it twice. The bottom bar
has room for five tabs, all taken.

## Options considered
### Where it lives
- **A. A Money tab instead of Plan; Plan becomes Training's first view,
  together with the programs.** Five tabs as now. The program decides the
  days and the plan shows them, so they belong together.
- **B. Money as a view of Progress.** No new tab, but nowhere to add an
  expense quickly, and looking back is only half of it.
- **C. Six tabs.** Labels get too narrow at 360 px.

### Expenses and the pantry
- **A. One ledger.** Every euro is a movement (`money_movements`). A receipt
  is a movement with lines. A product line creates or links the pantry
  purchase. One true total.
- **B. Separate.** The pantry stays as it is and expenses live apart, so
  totals add two sources. Simpler now, but the same purchase can be counted
  twice.

### First version
- **A. Expenses and income**, with categories, tags and a simple payment
  method (cash, card, account). Gives the month's balance.
- **B. Expenses only.** Smaller.
- **C. Accounts with balances and transfers.** A real bank, with more to
  keep consistent.

### Receipts
- **A. Text only.** Pasted, or read from a photo on the phone (tesseract is
  already in the app). The text is kept. No file storage.
- **B. Text and photos.** Needs file storage (Vercel Blob) and a decision
  about backing up and exporting the photos.

## Decision
A, A, A, A.

- **Navigation:** Today · Training (Plan and programs | Routines | Exercises)
  · Food · Money · Progress. `/plan` redirects to `/training/plan`. Until
  Money ships there are four tabs.
- **One ledger:** a movement has a day, a signed amount in integer cents
  (spending < 0), a category, tags, a payment method, a shop, a description
  and an optional receipt. Lines (receipt items) may point to a pantry
  purchase. From then on a pantry purchase made from a receipt carries no
  price of its own: the line holds it. Pantry stock is unchanged (ADR-0017).
- **Categories:** two levels, starter set editable. Tags: free.
- **Receipts:** the text is stored. The model (ADR-0018, the user's key)
  proposes lines. A review screen confirms them. A remembered
  "receipt text → product" alias makes the next receipt need no model.
- **Barcodes stay deterministic:** camera, then Open Food Facts. No model.

Tripwires:
- the developer wants several accounts with balances (→ option C);
- a receipt is often unreadable as text (→ photos, B);
- the pantry's own purchase prices and the ledger disagree in practice
  (→ revisit how prices move).

## Consequences
- New tables only (ADR-0003 merge order). The existing pantry price stays
  readable for old purchases.
- Spending can be viewed against food. € per day of food, € per 100 g of
  protein and pantry value come from data the app already has.
- Export, import and the trash must learn the new tables in the same slices.
- Slices:
  1. Plan in Training, the week | month calendar, removing from the day;
  2. Money v1: schema, add a movement (also from Today's "+"), movements,
     overview;
  3. receipts with the model;
  4. budgets, recurring charges, insights, the barcode in the pantry, with
     a fallback reader for browsers without BarcodeDetector.

## What I learned
Not written yet: this section is the developer's own.
