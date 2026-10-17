/**
 * convert(v1) → v2 file (migration.md): a v1 export of version 21 (and the
 * refined copy's layers, when present) becomes a v2 file of version 100,
 * with a report of every row that has no v2 row and why. Pure: the file in,
 * the file out; loading it is the v2 replace's job.
 */
import { convertCatalog } from "./catalog";
import type { V1Export } from "./context";
import { Out } from "./context";
import { convertFacts } from "./facts";
import type { V2File, V2TableKey } from "./file";
import { V2_FORMAT, V2_VERSION } from "./file";
import { convertPlans } from "./plans";

export const V1_VERSION = 21;

export class ConvertError extends Error {}

export function convert(v1: V1Export, now: Date = new Date()): V2File {
  if (v1.format !== "lifeos-export")
    throw new ConvertError(`not a lifeos export: ${String(v1.format)}`);
  if (v1.version !== V1_VERSION)
    throw new ConvertError(
      `version ${v1.version}: open it in v1 first (Settings → Replace upgrades it to ${V1_VERSION})`,
    );
  const out = new Out();
  const maps = convertCatalog(v1, out);
  convertFacts(v1, out, maps);
  convertPlans(v1, out, maps);
  const assistant =
    (v1.tables["assistant_conversations"]?.length ?? 0) +
    (v1.tables["assistant_messages"]?.length ?? 0);
  out.drop(
    "assistant_conversations, assistant_messages",
    assistant,
    "the assistant is parked: they stay in the v1 file",
  );
  if (!v1._v2)
    out.notes.push(
      "no refined layer: one food per ingredient, a v1 product for a priced one",
    );
  out.notes.push("meals are kind «meal»; a drink is not told apart yet");
  out.notes.push(
    "v1 programs become cycles; no day model's training block is bound to one yet",
  );
  const counts = Object.fromEntries(
    Object.entries(out.tables).map(([k, v]) => [k, v.length]),
  ) as Record<V2TableKey, number>;
  return {
    format: V2_FORMAT,
    version: V2_VERSION,
    exportedAt: now.toISOString(),
    account: v1.account,
    tables: out.tables,
    report: {
      from: {
        format: v1.format,
        version: v1.version,
        exportedAt: v1.exportedAt,
        refined: v1._v2 !== undefined,
      },
      counts,
      dropped: out.dropped,
      estimates: out.estimates,
      notes: out.notes,
    },
  };
}
