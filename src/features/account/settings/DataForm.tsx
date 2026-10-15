/**
 * features/account/settings/DataForm.tsx — Settings → Your data → Replace
 * with a file (ADR-0052 A). Three steps, nothing written until the last:
 *   1. choose a file: it is gzipped here and checked on the server, which
 *      answers with the plan (per area: now → after; lost, kept, repaired);
 *   2. tick that you understand;
 *   3. the current data is downloaded as a safety copy, and only if that
 *      worked is the file sent again to replace.
 * Client component (the file, the compression, the download).
 */
"use client";

import { Download, FileUp } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import type { ImportProblem, ReplacePlan } from "@/core/import/replace";
import { AREA_KEYS, AREAS } from "@/core/export/areas";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { FormAlert } from "@/ui/FormAlert";

type State =
  | { status: "idle" }
  | { status: "error"; problem: "notFile" | "tooBig" | "notJson" }
  | { status: "invalid"; problems: ImportProblem[] }
  | { status: "plan"; plan: ReplacePlan }
  | { status: "done"; plan: ReplacePlan };

type Action = (prev: State, formData: FormData) => Promise<State>;
type T = Messages["data"];

/** The file as the server reads it: gzipped when the browser can. */
async function packed(file: File): Promise<Blob> {
  if (typeof CompressionStream === "undefined") return file;
  return new Response(file.stream().pipeThrough(new CompressionStream("gzip"))).blob();
}

/** Downloads GET /api/export as a file; resolves false if it failed. */
async function downloadSafetyCopy(): Promise<boolean> {
  try {
    const res = await fetch("/api/export", { cache: "no-store" });
    if (!res.ok) return false;
    const name =
      /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ??
      "lifeos-export.json";
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = name.replace(/\.json$/, "-before-replace.json");
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return true;
  } catch {
    return false;
  }
}

export function DataForm({
  check,
  replace,
  t,
}: {
  check: Action;
  replace: Action;
  t: T;
}) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [copyFailed, setCopyFailed] = useState(false);
  const [sure, setSure] = useState(false);
  const [busy, start] = useTransition();
  const [replacing, setReplacing] = useState(false);
  const file = useRef<Blob | null>(null);

  const send = (action: Action) => {
    const fd = new FormData();
    fd.set("file", new File([file.current!], "data.json.gz"));
    return action(state, fd);
  };

  const onFile = (f: File | undefined) => {
    setSure(false);
    setCopyFailed(false);
    if (!f) return setState({ status: "idle" });
    start(async () => {
      file.current = await packed(f);
      setState(await send(check));
    });
  };

  const onReplace = () =>
    start(async () => {
      setReplacing(true);
      const copied = await downloadSafetyCopy();
      setCopyFailed(!copied);
      if (copied) setState(await send(replace));
      setReplacing(false);
    });

  return (
    <div className="flex flex-col gap-3">
      <label className="flex min-w-0 flex-col gap-1 text-meta font-semibold">
        {t.file}
        <input
          type="file"
          accept=".json,application/json"
          disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0])}
          className="text-body font-normal"
        />
      </label>
      {busy && <p className="text-muted">{replacing ? t.replacing : t.checking}</p>}
      {state.status === "error" && (
        <FormAlert tone="error">{t.errors[state.problem]}</FormAlert>
      )}
      {state.status === "invalid" && <Problems problems={state.problems} t={t} />}
      {state.status === "plan" && <Plan plan={state.plan} t={t} />}
      {state.status === "plan" && (
        <>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={sure}
              onChange={(e) => setSure(e.target.checked)}
              className="mt-1 h-4 w-4 accent-herb"
            />
            {t.confirm}
          </label>
          <button
            type="button"
            disabled={!sure || busy}
            onClick={onReplace}
            className={`self-start ${buttonClass({ variant: "danger" })}`}
          >
            <Download size={18} aria-hidden="true" />
            {t.replace}
            <FileUp size={18} aria-hidden="true" />
          </button>
        </>
      )}
      {copyFailed && <FormAlert tone="error">{t.copyFailed}</FormAlert>}
      {state.status === "done" && <FormAlert tone="success">{t.done}</FormAlert>}
    </div>
  );
}

function Problems({ problems, t }: { problems: ImportProblem[]; t: T }) {
  const shown = problems.slice(0, 5);
  return (
    <FormAlert tone="error">
      <ul className="flex flex-col gap-1">
        {shown.map((p, i) => (
          <li key={i}>
            {fill(
              t.problems[p.code],
              Object.fromEntries(
                Object.entries(p).map(([k, v]) => [
                  k,
                  (k === "table" || k === "target") && typeof v === "string"
                    ? (t.tables[v as keyof T["tables"]] ?? v)
                    : k === "row"
                      ? String(Number(v) + 1)
                      : String(v),
                ]),
              ),
            )}
          </li>
        ))}
      </ul>
      {problems.length > shown.length &&
        ` ${fill(t.more, { n: String(problems.length - shown.length) })}`}
    </FormAlert>
  );
}

function Plan({ plan, t }: { plan: ReplacePlan; t: T }) {
  const name = (table: string) => t.tables[table as keyof T["tables"]] ?? table;
  const rows = new Map(plan.replaced.map((r) => [r.table, r]));
  const date = plan.exportedAt?.slice(0, 10);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted">
        {date
          ? fill(t.fileFrom, { date, version: String(plan.version) })
          : fill(t.fileUndated, { version: String(plan.version) })}
      </p>
      <table className="w-full text-meta">
        <thead>
          <tr className="text-muted">
            <th className="text-left font-normal" />
            <th className="text-right font-normal">{t.now}</th>
            <th className="text-right font-normal">{t.after}</th>
          </tr>
        </thead>
        {AREA_KEYS.filter((a) => AREAS[a].lead.some((l) => rows.has(l))).map((a) => (
          <tbody key={a}>
            <tr>
              <th colSpan={3} className="pt-2 text-left font-semibold">
                {t.areas[a]}
              </th>
            </tr>
            {AREAS[a].lead
              .filter((l) => rows.has(l))
              .map((l) => {
                const r = rows.get(l)!;
                return (
                  <tr key={l}>
                    <td>{name(l)}</td>
                    <td className="text-right tabular-nums">{r.now}</td>
                    <td
                      className={`text-right tabular-nums ${r.after < r.now ? "font-semibold text-tomato" : ""}`}
                    >
                      {r.after}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        ))}
      </table>
      {plan.lost.length > 0 && (
        <FormAlert tone="error">
          {fill(t.lost, {
            list: plan.lost.map((l) => `${name(l.table)} (${l.now})`).join(", "),
          })}
        </FormAlert>
      )}
      {plan.kept.length > 0 && (
        <p className="text-muted">
          {fill(t.kept, { list: plan.kept.map(name).join(", ") })}
        </p>
      )}
      {plan.repaired.map((r) => (
        <p key={`${r.table}.${r.column}`} className="text-muted">
          {fill(r.action === "unlinked" ? t.repairedUnlinked : t.repairedRemoved, {
            table: name(r.table),
            n: String(r.rows),
          })}
        </p>
      ))}
      {plan.dropped.length > 0 && (
        <p className="text-muted">{fill(t.dropped, { list: plan.dropped.join(", ") })}</p>
      )}
    </div>
  );
}
