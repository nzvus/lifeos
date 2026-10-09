/**
 * features/account/settings/PackForm.tsx — Settings → Packs (ADR-0034): add
 * the starter pack, or import a pack file; then say what was added and what
 * could not be linked. Client component (the file input and the report).
 */
"use client";

import { FileUp, PackagePlus } from "lucide-react";
import { useActionState } from "react";
import { PACK_KINDS, type ApplyReport } from "@/core/catalog/pack";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { FormAlert } from "@/ui/FormAlert";

type State =
  | { status: "idle" }
  | {
      status: "error";
      problem: "notJson" | "tooBig" | "invalid" | "isExport";
      field?: string;
    }
  | { status: "done"; report: ApplyReport };

export function PackForm({
  addStarter,
  importPack,
  t,
}: {
  addStarter: () => Promise<State>;
  importPack: (prev: State, formData: FormData) => Promise<State>;
  t: Messages["packs"];
}) {
  const idle: State = { status: "idle" };
  const [starter, runStarter, startingStarter] = useActionState(() => addStarter(), idle);
  const [file, runImport, importing] = useActionState(importPack, idle);
  const busy = startingStarter || importing;
  return (
    <div className="flex flex-col gap-3">
      <form action={runStarter}>
        <button
          type="submit"
          disabled={busy}
          className={buttonClass({ variant: "secondary" })}
        >
          <PackagePlus size={18} aria-hidden="true" />
          {startingStarter ? t.working : t.starter}
        </button>
      </form>
      <Report state={starter} t={t} />
      <form action={runImport} className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-meta font-semibold">
          {t.file}
          <input
            type="file"
            name="pack"
            accept=".json,application/json"
            required
            className="text-body font-normal"
          />
        </label>
        <button type="submit" disabled={busy} className={buttonClass()}>
          <FileUp size={18} aria-hidden="true" />
          {importing ? t.working : t.import}
        </button>
      </form>
      <Report state={file} t={t} />
    </div>
  );
}

function Report({ state, t }: { state: State; t: Messages["packs"] }) {
  if (state.status === "idle") return null;
  if (state.status === "error")
    return (
      <FormAlert tone="error">
        {state.problem === "invalid"
          ? fill(t.invalid, { field: state.field ?? "" })
          : t[state.problem]}
      </FormAlert>
    );
  const { added, missing } = state.report;
  const list = PACK_KINDS.filter((k) => added[k] > 0)
    .map((k) => fill(t.kinds[k], { n: String(added[k]) }))
    .join(", ");
  return (
    <FormAlert tone={missing.length ? "info" : "success"}>
      {list ? fill(t.added, { list }) : t.nothing}
      {missing.length > 0 && ` ${fill(t.missing, { list: missing.join(", ") })}`}
    </FormAlert>
  );
}
