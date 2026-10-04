/**
 * app/(app)/day-reminders.ts — today's reminders on the day page (ADR-0017),
 * worded: derived from the pantry and the batches, plus the hand-made ones
 * that are due. Split out of page.tsx (800-line limit).
 */
import type { PantryItem } from "@/core/pantry/repositories/stock";
import { derivedReminders, type Reminder } from "@/core/pantry/repositories/reminders";
import { fill, type Messages } from "@/i18n";

export function reminderLines(
  pantry: readonly PantryItem[],
  batchList: Parameters<typeof derivedReminders>[1],
  manual: readonly Reminder[],
  today: string,
  p: Messages["pantry"],
): string[] {
  return [
    ...derivedReminders(pantry, batchList).map((d) =>
      d.kind === "gone"
        ? fill(p.gone, { name: d.name })
        : d.kind === "runOut"
          ? d.daysLeft === 0
            ? fill(p.runOutToday, { name: d.name })
            : fill(p.runOut, { name: d.name, n: String(d.daysLeft) })
          : fill(p.lastPortion, { name: d.name }),
    ),
    ...manual.filter((r) => !r.dueDay || r.dueDay <= today).map((r) => r.text),
  ];
}
