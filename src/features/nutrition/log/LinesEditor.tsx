/**
 * features/nutrition/log/LinesEditor.tsx — an entry's ingredients edited in
 * place inside its open row (2026-10-11: "edit the ingredients on the page
 * itself", no drop-down). Each line's amount saves when you leave it; × takes
 * a line out. Swapping or adding an ingredient stays on the entry's page.
 * Sends the same form as EntryEditor (ADR-0022: a local copy, kept lines
 * keep their logged values). Client component.
 */
"use client";

import { X } from "lucide-react";
import { useActionState } from "react";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { SaveStatus } from "@/ui/SaveStatus";
import { useAutoSave } from "@/ui/useAutoSave";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function LinesEditor({
  action,
  servings,
  lines,
  t,
}: {
  action: Action;
  servings: string;
  lines: { itemId: string; name: string; unit: string; quantity: string }[];
  t: Pick<Messages, "day" | "errors" | "settings">;
}) {
  const [state, formAction] = useActionState((prev: FormState, fd: FormData) => {
    const out = fd.get("remove");
    const sent = new FormData();
    sent.set("servings", servings);
    sent.set(
      "items",
      JSON.stringify(
        lines
          .filter((l) => l.itemId !== out)
          .map((l) => ({
            itemId: l.itemId,
            quantity: String(fd.get(`q-${l.itemId}`) ?? ""),
          })),
      ),
    );
    return action(prev, sent);
  }, IDLE);
  const autoSave = useAutoSave();
  const error =
    fieldError(state, "items", t.errors) ?? fieldError(state, "_form", t.errors);
  return (
    <form action={formAction} {...autoSave} className="flex flex-col gap-1">
      {lines.map((l) => (
        <div key={l.itemId} className="flex min-h-11 items-center gap-2 text-meta">
          <label htmlFor={`q-${l.itemId}`} className="min-w-0 flex-1 wrap-break-word">
            {l.name}
          </label>
          <input
            id={`q-${l.itemId}`}
            name={`q-${l.itemId}`}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            defaultValue={String(Number(l.quantity))}
            className="min-h-11 w-20 rounded-control rule-medium border-hairline bg-sheet px-2 text-right tabular-nums"
          />
          <span className="w-6 text-muted">{l.unit}</span>
          {lines.length > 1 && (
            <button
              type="submit"
              name="remove"
              value={l.itemId}
              aria-label={`${t.day.remove} ${l.name}`}
              className="flex size-11 items-center justify-center text-muted"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      <SaveStatus
        saved={state.status === "saved"}
        labels={{ saving: t.settings.autoSaving, saved: t.settings.saved }}
      />
      {error && <span className="text-meta text-tomato">{error}</span>}
    </form>
  );
}
