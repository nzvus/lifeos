/**
 * core/food/copy.ts — a meal's lines copied to another day («Copia ieri»,
 * the board Plan): each line at its quantity with the catalog's values of
 * now (a copy is a new log, as «Registra di nuovo»); a line whose food is
 * no longer in the catalog keeps its own snapshot (ADR-0007). Pure.
 */
import type { CheckedLine } from "../entries";
import type { FoodChoice } from "./choices";

export function copyLines(
  lines: readonly {
    itemId: string | null;
    productId: string | null;
    name: string;
    quantity: string;
    unit: string;
    values: Record<string, string>;
  }[],
  choices: ReadonlyMap<string, FoodChoice>,
): CheckedLine[] {
  return lines.map((l) => {
    const c = l.itemId
      ? choices.get(l.productId ? l.itemId + ":" + l.productId : l.itemId)
      : undefined;
    return c
      ? {
          itemId: c.foodId,
          productId: c.productId,
          name: c.name,
          quantity: l.quantity,
          unit: c.unit,
          per100: c.per100,
        }
      : {
          itemId: l.itemId,
          productId: l.productId,
          name: l.name,
          quantity: l.quantity,
          unit: l.unit,
          per100: l.values,
        };
  });
}
