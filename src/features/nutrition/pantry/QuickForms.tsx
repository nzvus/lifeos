/**
 * features/nutrition/pantry/QuickForms.tsx — the small one-line forms of the
 * pantry (ADR-0017): a reminder, a count, a batch, a purchase. Each sends a
 * server action, shows its field errors under the fields, and on success
 * empties itself and says so in a toast.
 * Client components (form state, toasts).
 */
"use client";

import { Check, CookingPot, Plus, ShoppingBag } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";
import { toast } from "@/ui/Toast";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
type T = Pick<Messages, "pantry" | "errors">;

/** One form's state; resets the form and toasts `done` once saved. */
function useQuickForm(action: Action, done: string) {
  const form = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(action, IDLE);
  useEffect(() => {
    if (state.status !== "saved") return;
    form.current?.reset();
    toast({ message: done });
  }, [state, done]);
  return { form, state, formAction };
}

export function ReminderForm({ action, t }: { action: Action; t: T }) {
  const p = t.pantry;
  const { form, state, formAction } = useQuickForm(action, p.addReminder);
  const err = (f: string) => fieldError(state, f, t.errors);
  return (
    <form ref={form} action={formAction} className="flex flex-col gap-3">
      <Field label={p.reminderText} name="text" error={err("text")} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label={p.reminderDue} name="dueDay" type="date" error={err("dueDay")} />
        <Field
          label={p.reminderRepeat}
          name="repeatDays"
          inputMode="numeric"
          error={err("repeatDays")}
        />
      </div>
      <span className="self-start">
        <SubmitButton variant="secondary" icon={<Plus size={18} aria-hidden="true" />}>
          {p.addReminder}
        </SubmitButton>
      </span>
    </form>
  );
}

export function CountForm({ action, unit, t }: { action: Action; unit: string; t: T }) {
  const p = t.pantry;
  const { form, state, formAction } = useQuickForm(action, p.counted);
  return (
    <form ref={form} action={formAction} className="flex items-end gap-2">
      <Field
        label={fill(p.countLabel, { unit })}
        name="quantity"
        inputMode="decimal"
        error={fieldError(state, "quantity", t.errors)}
        className="flex w-36 flex-col gap-1"
        required
      />
      <SubmitButton
        variant="subtle"
        size="sm"
        icon={<Check size={16} aria-hidden="true" />}
      >
        {p.count}
      </SubmitButton>
    </form>
  );
}

export function CookForm({
  action,
  meals,
  t,
}: {
  action: Action;
  meals: { id: string; name: string }[];
  t: T;
}) {
  const p = t.pantry;
  const { form, state, formAction } = useQuickForm(action, p.cook);
  const err = (f: string) => fieldError(state, f, t.errors);
  return (
    <form ref={form} action={formAction} className="flex flex-col gap-3">
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <div className="grid grid-cols-3 gap-3">
        <SelectField
          label={p.cookMeal}
          name="mealId"
          options={meals.map((m) => ({ value: m.id, label: m.name }))}
          error={err("mealId")}
          className="col-span-2 flex flex-col gap-1"
        />
        <Field
          label={p.cookPortions}
          name="portions"
          inputMode="numeric"
          defaultValue="4"
          error={err("portions")}
        />
      </div>
      <span className="self-start">
        <SubmitButton
          variant="secondary"
          icon={<CookingPot size={18} aria-hidden="true" />}
        >
          {p.cook}
        </SubmitButton>
      </span>
    </form>
  );
}

export function PurchaseForm({
  action,
  today,
  t,
}: {
  action: Action;
  today: string;
  t: T;
}) {
  const p = t.pantry;
  const { form, state, formAction } = useQuickForm(action, p.purchaseSaved);
  const err = (f: string) => fieldError(state, f, t.errors);
  return (
    <form ref={form} action={formAction} className="flex flex-col gap-3">
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <div className="grid grid-cols-2 gap-3 @lg:grid-cols-4">
        <Field
          label={p.day}
          name="day"
          type="date"
          defaultValue={today}
          error={err("day")}
          required
        />
        <Field
          label={p.packages}
          name="packages"
          inputMode="decimal"
          defaultValue="1"
          error={err("packages")}
          required
        />
        <Field label={p.price} name="price" inputMode="decimal" error={err("price")} />
        <Field label={p.shop} name="shop" error={err("shop")} />
      </div>
      <span className="self-start">
        <SubmitButton
          variant="primary"
          icon={<ShoppingBag size={18} aria-hidden="true" />}
        >
          {p.addPurchase}
        </SubmitButton>
      </span>
    </form>
  );
}
