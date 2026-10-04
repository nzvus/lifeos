/**
 * features/money/MovementForm.tsx — one movement of the ledger (ADR-0036):
 * spending or income, how much, when, the category (of that kind), and
 * optionally where, how it was paid, what it was and tags. Used by the add
 * sheet (empties itself after saving) and by the edit page. Client component.
 */
"use client";

import { ArrowDownLeft, ArrowUpRight, Check, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { Segmented } from "@/ui/Segmented";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";

export type CategoryOption = { id: string; label: string; kind: "expense" | "income" };
export type MovementValues = {
  kind: "expense" | "income";
  amount: string;
  day: string;
  categoryId: string;
  description: string;
  shop: string;
  method: string;
  tags: string;
};

export function MovementForm({
  action,
  categories,
  initial,
  onSaved,
  submitLabel,
  t,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  categories: CategoryOption[];
  initial: MovementValues;
  /** After a save (the sheet closes and empties). */
  onSaved?: () => void;
  submitLabel: string;
  t: Pick<Messages, "money" | "errors">;
}) {
  const m = t.money;
  const [state, formAction] = useActionState(action, IDLE);
  const kept = (f: keyof MovementValues) =>
    state.status === "error" ? (state.values[f] ?? initial[f]) : initial[f];
  const [kind, setKind] = useState<MovementValues["kind"]>(() =>
    kept("kind") === "income" ? "income" : "expense",
  );
  // A save = a fresh, empty form (state adjusted while rendering, as in
  // AddToDay); the sheet is told after the render.
  const [round, setRound] = useState(0);
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.status === "saved") setRound((r) => r + 1);
  }
  useEffect(() => {
    if (round > 0) onSaved?.();
  }, [round, onSaved]);
  const err = (f: string) => fieldError(state, f, t.errors);
  return (
    <form key={round} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="kind" value={kind} />
      <Segmented
        label={m.kind}
        value={kind}
        onChange={setKind}
        options={[
          {
            value: "expense",
            label: m.expense,
            icon: <ArrowUpRight size={18} aria-hidden="true" />,
          },
          {
            value: "income",
            label: m.income,
            icon: <ArrowDownLeft size={18} aria-hidden="true" />,
          },
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={m.amount}
          name="amount"
          inputMode="decimal"
          defaultValue={round ? "" : kept("amount")}
          error={err("amount")}
          required
        />
        <Field
          label={m.day}
          name="day"
          type="date"
          defaultValue={kept("day")}
          error={err("day")}
          required
        />
      </div>
      <SelectField
        // A new kind = a fresh list (the select keeps its first default).
        key={kind}
        label={m.category}
        name="categoryId"
        placeholder={m.noCategory}
        defaultValue={round ? "" : kept("categoryId")}
        options={categories
          .filter((c) => c.kind === kind)
          .map((c) => ({ value: c.id, label: c.label }))}
        error={err("categoryId")}
      />
      <Field
        label={m.description}
        name="description"
        defaultValue={round ? "" : kept("description")}
        error={err("description")}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={m.shop}
          name="shop"
          defaultValue={round ? "" : kept("shop")}
          error={err("shop")}
        />
        <SelectField
          label={m.method}
          name="method"
          placeholder={m.methodNone}
          defaultValue={kept("method")}
          options={(["card", "cash", "account", "other"] as const).map((k) => ({
            value: k,
            label: m.methods[k],
          }))}
          error={err("method")}
        />
      </div>
      <Field
        label={m.tags}
        name="tags"
        hint={m.tagsHint}
        defaultValue={round ? "" : kept("tags")}
        error={err("tags")}
      />
      {state.status === "error" && state.errors._form && (
        <FormAlert tone="error">{err("_form")}</FormAlert>
      )}
      <div>
        <SubmitButton
          icon={
            onSaved ? (
              <Plus size={18} aria-hidden="true" />
            ) : (
              <Check size={18} aria-hidden="true" />
            )
          }
        >
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
