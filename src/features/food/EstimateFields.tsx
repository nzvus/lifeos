"use client";
/**
 * «Stima a mano» in the composer (FOOD-41): every label value typed as the
 * meal's totals, kcal needed, the rest left empty when unknown (never 0);
 * the meal's name only when it is a day's meal (a saved meal has its own).
 * And the composer's foot: the servings (none for a saved meal) and «Salva».
 */
import { Field } from "@lifeos/kit";
import { ESTIMATE_FIELDS, type EstimateField } from "@/core/food/meal";

const ESTIMATE_LABELS: Record<EstimateField, [string, string]> = {
  kcal: ["Energia", "kcal"],
  protein: ["Proteine", "g"],
  carbs: ["Carboidrati", "g"],
  sugars: ["di cui zuccheri", "g"],
  fat: ["Grassi", "g"],
  saturatedFat: ["di cui saturi", "g"],
  fibre: ["Fibre", "g"],
  salt: ["Sale", "g"],
};
/** The stepper's step per estimate field: kcal by 50, salt by 0,5, the rest by 5 or 1. */
const ESTIMATE_STEP: Record<EstimateField, number> = {
  kcal: 50,
  protein: 5,
  carbs: 5,
  sugars: 5,
  fat: 5,
  saturatedFat: 1,
  fibre: 1,
  salt: 0.5,
};

export function EstimateFields({
  named,
  estName,
  typed,
  errors,
  onName,
  onTyped,
}: {
  named: boolean;
  estName: string;
  typed: Partial<Record<EstimateField, string>>;
  errors: Record<string, string>;
  onName: (v: string) => void;
  onTyped: (f: EstimateField, v: string) => void;
}) {
  return (
    <div className="k-stack g3">
      <p className="k-help">
        Scrivi i totali del pasto, anche a occhio: conta come stima.
      </p>
      {named && (
        <Field
          name="estName"
          label="Cosa hai mangiato"
          type="text"
          placeholder="per esempio: Pizza fuori"
          defaultValue={estName}
          onChange={onName}
        />
      )}
      {ESTIMATE_FIELDS.map((f) => (
        <Field
          key={f}
          name={"est." + f}
          label={ESTIMATE_LABELS[f][0]}
          type="stepper"
          unit={ESTIMATE_LABELS[f][1]}
          step={ESTIMATE_STEP[f]}
          required={f === "kcal"}
          placeholder={f === "kcal" ? "" : "se non lo sai, lascia vuoto"}
          defaultValue={typed[f] ?? ""}
          error={errors["est." + f]}
          onChange={(x) => onTyped(f, x)}
        />
      ))}
    </div>
  );
}
