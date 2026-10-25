/** The categories as the form lists them: in Italian, under their parent, the incomes apart. Pure. */
import type { Category } from "@/core/money";
import type { CategoryOption } from "./MovementForm";
import { categoryName } from "./words";

export function categoryOptions(cats: readonly Category[]): CategoryOption[] {
  const byId = new Map(cats.map((c) => [c.id, c]));
  return cats
    .map((c) => {
      const top = c.parentId ? byId.get(c.parentId) : c;
      return {
        id: c.id,
        name: categoryName(c.name),
        group: c.kind === "income" ? "Entrate" : categoryName(top?.name ?? c.name),
        kind: c.kind,
      };
    })
    .sort(
      (a, b) =>
        a.group.localeCompare(b.group, "it") || a.name.localeCompare(b.name, "it"),
    );
}
