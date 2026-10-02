/**
 * features/nutrition/ingredients/QuickIngredient.tsx — a new ingredient in
 * a sheet (2026-10-02: short tasks in sheets): name, unit and the label's
 * eight values per 100 g/ml; price, NOVA, origin and tags on the full page
 * ("All details"). Every nutrient is required, as on the full form: an
 * unknown sugar written as 0 would be a false number. After saving, the
 * form empties for the next one and says what was added.
 */
"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { NUTRIENT_KEYS, NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { TEXT_LINK } from "@/ui/button";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";
import { Sheet } from "@/ui/Sheet";
import { SubmitButton } from "@/ui/SubmitButton";

export function QuickIngredient({
  id,
  action,
  t,
}: {
  /** The sheet's #id (the page's "New ingredient" links to it). Plain
   *  data from the page: a constant exported from this client module would
   *  reach a server page as a client reference, not a string. */
  id: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  t: Pick<Messages, "ingredients" | "nutrients" | "errors" | "actions">;
}) {
  // Each save remounts an empty form for the next ingredient.
  const [saves, setSaves] = useState(0);
  const [state, formAction] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await action(prev, fd);
    if (r.status === "saved") setSaves((n) => n + 1);
    return r;
  }, IDLE);
  const err = (f: string) => fieldError(state, f, t.errors);
  const i = t.ingredients;
  return (
    <Sheet
      id={id}
      title={i.newTitle}
      icon={<Plus size={20} aria-hidden="true" />}
      closeLabel={t.actions.close}
    >
      {state.status === "saved" && <FormAlert tone="success">{i.quickSaved}</FormAlert>}
      <form key={saves} action={formAction} className="flex flex-col gap-3">
        {/* What the full form sends and this one leaves for later. */}
        <input type="hidden" name="description" value="" />
        <input type="hidden" name="packagePrice" value="" />
        <input type="hidden" name="packageSize" value="" />
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-3">
          <Field
            label={i.name}
            name="name"
            defaultValue={valueOf(state, "name", "")}
            error={err("name")}
            className="flex flex-col gap-1 @sm:col-span-2"
            required
          />
          <SelectField
            label={i.unit}
            name="unit"
            defaultValue={valueOf(state, "unit", "g")}
            options={[
              { value: "g", label: i.unitG },
              { value: "ml", label: i.unitMl },
            ]}
            error={err("unit")}
          />
        </div>
        <p className="text-meta text-muted">{i.quickPer100}</p>
        <div className="grid grid-cols-2 gap-3">
          {NUTRIENT_KEYS.map((k) => (
            <Field
              key={k}
              label={`${t.nutrients[k]} (${NUTRIENT_UNIT[k]})`}
              name={k}
              inputMode="decimal"
              defaultValue={valueOf(state, k, "")}
              error={err(k)}
              required
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SubmitButton icon={<Plus size={16} aria-hidden="true" />}>
            {i.quickAdd}
          </SubmitButton>
          <Link href="/ingredients/new" className={`text-meta ${TEXT_LINK}`}>
            {i.quickAllDetails}
          </Link>
        </div>
      </form>
    </Sheet>
  );
}
