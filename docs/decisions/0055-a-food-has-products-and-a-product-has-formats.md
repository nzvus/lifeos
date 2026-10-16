# ADR-0055: A food has products, a product has formats, and prices are observations

**Status:** accepted (the developer chose option A on 2026-10-16: «cibo › prodotto › formato»)
**Date:** 2026-10-16

## Context
Refining the 16 Oct export showed duplicates that are not mistakes:
- «Gnocchi» and «Gnocchetti» are two formats of the same Nonna Mia product, with a different price per gram;
- «Burro d'arachidi 100%» (Maribel) and «Burro di arachidi 100%» are the same food from two brands, and so are the two cocoas and the two passate.

v1 has one flat list of ingredients, so every brand, shop or size became a new ingredient. Meals then copied them («gnocchi al sugo» with each brand). The v2 spec had «product (brand, barcode, package) → its food», but it allowed one package per product. It also did not say what meals and entries point at, how values are resolved, or where a price per gram comes from. The catalog, the composer, receipts, the pantry and the «value per euro» score all depend on this, so it has to be decided before v2 code.

## Options considered
### A. Three levels: food › product › format, prices as observations
- **Pros:**
  - one food per thing you eat: meals, recipes, models and scores stay one;
  - a brand's label corrects the typical values only where it differs;
  - each size or shape has its own barcode and price;
  - prices per shop and date give a history and the cheapest shop.
- **Cons:**
  - three levels to show without making the catalog heavy;
  - the import must merge v1 duplicates into products and formats;
  - more joins.
### B. Two levels: food › product, one product per format
- **Pros:**
  - simpler;
  - matches the current spec.
- **Cons:**
  - two formats of one product repeat the whole label (gnocchi and gnocchetti);
  - prices stay one per product;
  - formats look like different products in search.
### C. Keep flat foods with «new from…» (`based_on`)
- **Pros:** no work now.
- **Cons:** duplicates and meal variants keep growing; prices cannot be compared.

## Decision
**A**, for two reasons:
- Only what is eaten (the food) drives meals and scores. What is bought (the product and its format) drives labels, prices, the pantry and receipts.
- The three levels close the duplicates at the source.

**The rules:**
- **Food:** the identity that meals, recipes, models, goals and scores use. It has its FoodEx2 group, typical values per 100 g with source and confidence, kinds and micros.
- **Product:** a brand or line under a food. Its label values replace the food's, field by field; brand, usual shops, NOVA.
- **Format:** a shape or size under a product (gnocchi / gnocchetti, 500 g / 1 kg). It has its barcode, the package or piece weight, and its own values only where its label differs.
- **Values resolve** format › product › food, field by field, each with its provenance.
- **A price is an observation:** format, shop, day, cents, from a receipt line or by hand.
  - The format's price per gram is the latest observation per shop.
  - A product's and a food's is the median of their formats' latest prices. That median is what «value per euro» uses.
- **Pointers:**
  - a meal's or recipe's parts point at foods, with an optional preferred product;
  - an entry remembers the product and format actually used, when known. Its snapshot of values comes from the resolution;
  - purchases, stock and receipt lines point at the format.

**Tripwire.** Revisit if, after a month of use, most foods have exactly one product with one format: the three levels would then be overhead, and B would do.

## Consequences
- **Spec:**
  - `concepts.md` §4, `kinds.md`, `schema.md`;
  - `migration.md`: the three levels and the duplicate rule;
  - `flows.md`, `screens.md`, `kit.md`, `find.md`: the food page lists its products and formats; search shows products under their food, with brand and shop facets and a sort by price per gram.
- **Data:** the refined copy merges v1's duplicates. A brand-named ingredient becomes a product of its generic food (a generic food is created only when none exists); two formats become formats; v1's price becomes the first observation. The totals per day must not change.
- **Boards:**
  - Cibi and the food page;
  - Scansiona and Scontrino (a barcode finds a format, a line adds a price observation);
  - Dispensa (stock per format, summed per food);
  - the composer and the meal editor (a line is a food with its product in a pill).
- **Easier:** one meal per dish; comparing shops and sizes; a label fixes only what it says.
- **Harder:** the catalog shows three levels; a search result says which level it is.

## What I learned
<to be written by the developer>
