"use client";
/**
 * The composer's «Quando» (V-04): eaten or planned, the time, the meal's
 * role (from the time unless chosen), a note, «Salva anche come pasto»
 * with its name. Inputs of the composer's form; the state is the composer's.
 */
import { Field } from "@lifeos/kit";
import { MEAL_ROLE_WORDS as ROLE_WORDS } from "@/features/day/words";

export function MealWhen({
  values,
  errors,
  start,
  role,
  auto,
  estimate,
  canSave,
  saveAs,
  estName,
  onStatus,
  onStart,
  onRole,
  onSaveAs,
}: {
  values: Record<string, string>;
  errors: Record<string, string>;
  start: string;
  role: string;
  /** The role the time gives, when none is chosen. */
  auto: string;
  estimate: boolean;
  /** Whether «Salva anche…» applies (foods in the meal, or a new estimate). */
  canSave: boolean;
  saveAs: boolean;
  estName: string;
  onStatus: (v: string) => void;
  onStart: (v: string) => void;
  onRole: (v: string) => void;
  onSaveAs: (v: boolean) => void;
}) {
  return (
    <section className="k-section g4" aria-label="Quando">
      <h2>Quando</h2>
      <Field
        name="status"
        label="Stato"
        type="choice"
        required
        defaultValue={values["status"] ?? "done"}
        onChange={onStatus}
        options={[
          { value: "done", label: "Mangiato" },
          { value: "planned", label: "Previsto" },
        ]}
      />
      <Field
        name="start"
        label="Ora"
        type="time"
        defaultValue={start}
        error={errors["start"]}
        onChange={onStart}
      />
      <Field
        name="role"
        label="Pasto"
        type="choice"
        defaultValue={role}
        onChange={onRole}
        help={
          auto ? "Senza scelta: " + ROLE_WORDS[auto]!.toLowerCase() + ", dall’ora." : ""
        }
        error={errors["role"]}
        options={Object.entries(ROLE_WORDS).map(([value, label]) => ({ value, label }))}
      />
      <Field
        name="note"
        label="Nota"
        type="text"
        placeholder="facoltativa"
        defaultValue={values["note"] ?? ""}
        error={errors["note"]}
      />
      {canSave && (
        <div className="k-stack g2">
          <input type="hidden" name="saveAs" value={saveAs ? "yes" : ""} />
          <div className="k-chips">
            <button
              type="button"
              className="k-chip"
              aria-pressed={saveAs}
              onClick={() => onSaveAs(!saveAs)}
            >
              {estimate ? "Salva anche in Libreria" : "Salva anche come pasto"}
            </button>
          </div>
          {saveAs && (
            <Field
              name="recipeName"
              label="Nome del pasto"
              type="text"
              placeholder={
                estimate
                  ? "per esempio: Menu hamburger"
                  : "per esempio: Porridge della domenica"
              }
              defaultValue={values["recipeName"] ?? (estimate ? estName : "")}
              error={errors["recipeName"]}
              help={
                estimate
                  ? "Lo ritrovi in «Pasti salvati» con questi totali: la prossima volta basta toccarlo."
                  : "Lo ritrovi in «Pasti salvati», con questi cibi e queste quantità."
              }
            />
          )}
        </div>
      )}
      {errors["form"] && (
        <p className="k-help" role="alert">
          {errors["form"]}
        </p>
      )}
    </section>
  );
}
