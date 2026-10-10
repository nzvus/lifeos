/**
 * features/nutrition/profiles/ProgramForm.tsx — a day type's program
 * (ADR-0044): the usual training time, the shift in a check-in week, and
 * the timed meal slots with soft shares. Rows live in state and travel as
 * JSON in a hidden field (core/nutrition/programs.ts reads it); a starter
 * replaces the rows. Saved with its own button: rows are added and removed
 * before anything is worth saving.
 */
"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { Field } from "@/ui/Field";
import { MomentIcon } from "@/ui/MomentIcon";
import { SaveStatus } from "@/ui/SaveStatus";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";
import { TimeField } from "@/ui/TimeField";

/** As the server sends it: minutes after midnight, shares 0–1. */
export type ProgramView = {
  trainingAt: number | null;
  shiftKcal: number;
  slots: {
    kind: string;
    at: number;
    kcalShare: number | null;
    proteinShare: number | null;
  }[];
};

type Row = {
  key: number;
  kind: string;
  at: string;
  kcalShare: string;
  proteinShare: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const pct = (v: number | null) => (v === null ? "" : String(Math.round(v * 100)));
let nextKey = 0;
const rowsOf = (p: ProgramView): Row[] =>
  p.slots.map((s) => ({
    key: nextKey++,
    kind: s.kind,
    at: hhmm(s.at),
    kcalShare: pct(s.kcalShare),
    proteinShare: pct(s.proteinShare),
  }));

export function ProgramForm({
  action,
  initial,
  moments,
  starters,
  t,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: ProgramView;
  /** The moments a slot may be (core/nutrition/moments MOMENTS). */
  moments: readonly string[];
  starters: Record<string, ProgramView>;
  t: Pick<Messages, "dayProgram" | "moments" | "errors" | "settings">;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const [rows, setRows] = useState<Row[]>(() => rowsOf(initial));
  const [trainingAt, setTrainingAt] = useState(
    initial.trainingAt === null ? "" : hhmm(initial.trainingAt),
  );
  const [shift, setShift] = useState(String(initial.shiftKcal));
  const p = t.dayProgram;
  const names = t.moments.names as Record<string, string>;
  const err = (f: string) => fieldError(state, f, t.errors);
  const set = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const sum = (k: "kcalShare" | "proteinShare") =>
    rows.reduce((a, r) => a + (Number(r[k].replace(",", ".")) || 0), 0);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input
        type="hidden"
        name="slots"
        value={JSON.stringify(
          rows.map(({ kind, at, kcalShare, proteinShare }) => ({
            kind,
            at,
            kcalShare,
            proteinShare,
          })),
        )}
      />
      <SelectField
        label={p.starter}
        name="starter"
        value=""
        onChange={(e) => {
          const s = starters[e.target.value];
          if (!s) return;
          setRows(rowsOf(s));
          setTrainingAt(s.trainingAt === null ? "" : hhmm(s.trainingAt));
        }}
        options={[
          { value: "", label: p.starterNone },
          ...Object.keys(starters).map((k) => ({
            value: k,
            label: (p.starters as Record<string, string>)[k] ?? k,
          })),
        ]}
      />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <TimeField
            label={p.trainingAt}
            name="trainingAt"
            value={trainingAt}
            onChange={setTrainingAt}
            error={err("trainingAt")}
          />
          <p className="text-meta text-muted">{p.trainingHint}</p>
        </div>
        <Field
          label={p.shift}
          name="shiftKcal"
          inputMode="numeric"
          value={shift}
          onChange={(e) => setShift(e.target.value)}
          error={err("shiftKcal")}
          hint={p.shiftHint}
        />
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="pb-2 font-display text-item font-semibold">{p.slots}</legend>
        {rows.length === 0 && <p className="text-meta text-muted">{p.empty}</p>}
        {rows.map((r, i) => (
          <div
            key={r.key}
            className="flex flex-col gap-2 rule-t-medium border-hairline pt-3"
          >
            <div className="flex items-end gap-2">
              <span className="pb-3">
                <MomentIcon moment={r.kind} size={20} />
              </span>
              <SelectField
                label={p.kind}
                name={`slot-kind-${i}`}
                value={r.kind}
                onChange={(e) => set(r.key, { kind: e.target.value })}
                options={moments.map((m) => ({ value: m, label: names[m] ?? m }))}
                className="flex min-w-0 flex-1 flex-col gap-1"
              />
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                aria-label={p.remove}
                title={p.remove}
                className={buttonClass({ variant: "quiet", size: "sm", iconOnly: true })}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <TimeField
                label={p.at}
                name={`slot-at-${i}`}
                value={r.at}
                onChange={(v) => set(r.key, { at: v })}
                required
              />
              <Field
                label={p.kcalShare}
                name={`slot-kcal-${i}`}
                inputMode="numeric"
                value={r.kcalShare}
                onChange={(e) => set(r.key, { kcalShare: e.target.value })}
              />
              <Field
                label={p.proteinShare}
                name={`slot-protein-${i}`}
                inputMode="numeric"
                value={r.proteinShare}
                onChange={(e) => set(r.key, { proteinShare: e.target.value })}
              />
            </div>
          </div>
        ))}
        {err("slots") && (
          <p role="alert" className="text-meta text-tomato">
            {err("slots")}
          </p>
        )}
        <p className="text-meta text-muted tabular-nums">
          {fill(p.total, {
            kcal: String(Math.round(sum("kcalShare"))),
            protein: String(Math.round(sum("proteinShare"))),
          })}
        </p>
        <button
          type="button"
          onClick={() =>
            setRows((rs) => [
              ...rs,
              {
                key: nextKey++,
                kind: "snack",
                at: "16:00",
                kcalShare: "",
                proteinShare: "",
              },
            ])
          }
          className={`${buttonClass({ variant: "quiet", size: "sm" })} self-start`}
        >
          <Plus size={16} aria-hidden="true" />
          {p.add}
        </button>
      </fieldset>
      <div className="flex items-center gap-3">
        <SubmitButton size="sm">{p.save}</SubmitButton>
        <SaveStatus
          saved={state.status === "saved"}
          labels={{ saving: t.settings.autoSaving, saved: t.settings.saved }}
        />
      </div>
    </form>
  );
}
