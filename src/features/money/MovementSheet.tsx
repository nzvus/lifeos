/**
 * features/money/MovementSheet.tsx — "Add a movement" in a sheet
 * (#money-add, or #money-add:YYYY-MM-DD for another day), opened by the
 * Money tab's "+" and by Today's "+" (→ Spending). After a save the form
 * empties, a toast says so and the sheet closes. Client component.
 */
"use client";

import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { isValidDay } from "@/core/shared/dates";
import type { FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Sheet } from "@/ui/Sheet";
import { toast } from "@/ui/Toast";
import { MovementForm, type CategoryOption } from "./MovementForm";

export const MONEY_ADD = "money-add";

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function MovementSheet({
  action,
  categories,
  today,
  t,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  categories: CategoryOption[];
  today: string;
  t: Pick<Messages, "money" | "errors" | "actions">;
}) {
  const router = useRouter();
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  );
  const asked = hash.startsWith(`#${MONEY_ADD}:`) ? hash.slice(MONEY_ADD.length + 2) : "";
  const day = isValidDay(asked) ? asked : today;
  const saved = useCallback(() => {
    toast({ message: t.money.added });
    history.replaceState(null, "", window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    router.refresh();
  }, [router, t.money.added]);
  return (
    <Sheet
      id={MONEY_ADD}
      title={t.money.add}
      icon={<Wallet size={20} aria-hidden="true" />}
      closeLabel={t.actions.close}
    >
      <MovementForm
        // Another day asked = a fresh form on that day.
        key={day}
        action={action}
        categories={categories}
        initial={{
          kind: "expense",
          amount: "",
          day,
          categoryId: "",
          description: "",
          shop: "",
          method: "",
          tags: "",
        }}
        onSaved={saved}
        submitLabel={t.money.addButton}
        t={t}
      />
    </Sheet>
  );
}
