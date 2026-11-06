-- Data repair: the price snapshot of the lines logged in v2 (dossiers/costs.md §4
-- and §7, ledger HOME-14). Data only, no schema change, safe in any order with
-- the code. Idempotent: a line that already has a price is left alone.
--
-- Since the cutover (17 Oct) v2 wrote food lines without a price, so their meals
-- had no cost. Each such line takes the price per 100 of its day, as
-- core/food/cost.ts computes it at logging:
-- - each format's price = the median over shops of each shop's latest
--   observation up to the line's day (cents × 100 ÷ package_qty);
-- - the line's product's price = the median of its formats; when the product
--   has none, the food's = the median of all the food's live formats.
-- Lines converted from v1 keep their packagePriceCents/packageSize.
WITH lines AS (
  SELECT l."id", l."user_id", l."item_id", l."product_id", e."day"
  FROM "entry_lines" l
  JOIN "entries" e ON e."id" = l."entry_id" AND e."user_id" = l."user_id"
  WHERE e."deleted_at" IS NULL
    AND l."item_id" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM "entry_line_values" v
      WHERE v."line_id" = l."id" AND v."field" IN ('cents', 'packagePriceCents')
    )
),
latest AS (
  SELECT DISTINCT ON (ln."id", o."format_id", o."shop")
    ln."id" AS line_id,
    ln."product_id" AS line_product,
    prod."id" AS product_id,
    o."format_id",
    o."cents" * 100.0 / o."package_qty" AS per100
  FROM lines ln
  JOIN "catalog_items" prod
    ON prod."parent_id" = ln."item_id" AND prod."user_id" = ln."user_id"
   AND prod."catalog" = 'product' AND prod."deleted_at" IS NULL AND prod."archived_at" IS NULL
  JOIN "catalog_items" fmt
    ON fmt."parent_id" = prod."id" AND fmt."user_id" = ln."user_id"
   AND fmt."catalog" = 'format' AND fmt."deleted_at" IS NULL
  JOIN "price_observations" o
    ON o."format_id" = fmt."id" AND o."user_id" = ln."user_id" AND o."day" <= ln."day"
  ORDER BY ln."id", o."format_id", o."shop", o."day" DESC
),
formats AS (
  SELECT line_id, line_product, product_id, format_id,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY per100) AS per100
  FROM latest
  GROUP BY line_id, line_product, product_id, format_id
),
priced AS (
  SELECT line_id,
    COALESCE(
      percentile_cont(0.5) WITHIN GROUP (ORDER BY per100) FILTER (WHERE product_id = line_product),
      percentile_cont(0.5) WITHIN GROUP (ORDER BY per100)
    ) AS per100
  FROM formats
  GROUP BY line_id
)
INSERT INTO "entry_line_values" ("user_id", "line_id", "field", "num")
SELECT ln."user_id", p.line_id, 'cents', round(p.per100::numeric, 2)
FROM priced p
JOIN lines ln ON ln."id" = p.line_id
WHERE p.per100 IS NOT NULL
ON CONFLICT ("line_id", "field") DO NOTHING;
