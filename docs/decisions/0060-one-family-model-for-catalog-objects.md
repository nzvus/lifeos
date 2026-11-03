# ADR-0060: Every catalog object has one family model: levels, variants, copies, merges

**Status:** accepted (the developer, 3 Nov: «ok alle raccomandazioni, procedi»)
**Date:** 2026-11-03

## Context
On 3 Nov the developer asked for hierarchies of foods and meals (a porridge base with
selectable variants), for brands chosen in meals or a weighted mean across them, for
formats with their price per kg, and for the same model on every tracked object (ledger
FOOD-45, FOOD-46, FOOD-48). He chose one model for all objects.

v2 already has two links on `catalog_items`:
- `parentId` (food › product › format, ADR-0055);
- `basedOnId` (a copy).

But nothing averages brands, offers formats or makes variants. His data shows the cost
of this: 7 protein ice-cream recipes repeat one base, and four foods are second brands
kept as foods. This has to be decided before the slices, because every catalog, the
composer, the barcode, the costs and the trends read it.

## Options considered
### A. Three links on the same columns: level and variant on `parentId`, copy on `basedOnId`; «Unisci» merges
- **Pros:**
  - no migration: a variant's differences fit `catalog_parts.defaults` and
    `catalog_values`;
  - one resolver, the same idea as models' `extends` (PLAN-11);
  - works for foods, recipes, exercises, routes and the person's kinds' items.
- **Cons:**
  - `parentId` means two things, told apart by whether the parent is in the same
    catalog;
  - variants need a resolver with loop checks.
### B. A separate `variant_of` column
- **Pros:** explicit.
- **Cons:**
  - a migration;
  - a second hierarchy beside `parentId` that is never needed at the same time on
    one item.
### C. Tags or groups only (no inheritance)
- **Pros:** simplest.
- **Cons:**
  - a change to the base never reaches the variants;
  - the duplicates come back.

## Decision
**A**, with the dossier's §9 answered as recommended.

The link is told by the parent:
- a parent in **the catalog above** is a level (food › product › format);
- a parent in **the same catalog** is a variant, storing only its differences;
- `basedOnId` is provenance only («Parti da…»);
- «Unisci» makes two into one, with aliases.

A barcode belongs to the format (GS1: a new net content is a new GTIN). A generic food
reads the mean of its brands weighted by the person's use.

**Tripwire:** a catalog that needs an item to be both a level and a variant at once, or
variants deeper than three, would call for B.

## Consequences
- **Engines:** `core/catalog` gets `resolveVariant` (parts and values, loop-safe) and
  `genericValues` (the weighted mean with its spread). The composer and the costs read
  them.
- **Data repairs** (human job, totals per day checked equal):
  - barcodes move from foods to formats;
  - his near-duplicates are re-parented after he ticks the list;
  - R5 (Run → Corsa).
- **Screens:** the object page gets «Famiglia» and «+ Variante»; the food page shows the
  mean, its brands, formats and price per kg; the composer gets brand and variant pills;
  the barcode asks «È una marca di un tuo cibo?».
- ADR-0055 stands and is completed: formats in meals through the brand pill, and the
  price per kg per format.

## What I learned
<to be written by the developer>
