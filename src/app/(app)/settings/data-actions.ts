/**
 * app/(app)/settings/data-actions.ts — Settings → Your data (ADR-0052 A):
 * check a file, then replace all my data with it.
 *
 * The browser gzips the file before sending it (features/.../DataForm.tsx):
 * a 1 MB export travels as ~100 kB, far under the 4 MB action limit
 * (next.config.ts). The file is untrusted: size capped before and after
 * unzipping, parsed, and validated whole by core before anything is written.
 * Both actions take the file: the server keeps nothing between the check
 * and the replace.
 */
"use server";

import { gunzipSync } from "node:zlib";
import { revalidatePath } from "next/cache";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import type { Owner } from "@/core/identity/owner";
import {
  planReplace,
  readExport,
  replaceAll,
  type ImportFile,
  type ImportProblem,
  type ReplacePlan,
} from "@/core/import/replace";

export type DataState =
  | { status: "idle" }
  | { status: "error"; problem: "notFile" | "tooBig" | "notJson" }
  | { status: "invalid"; problems: ImportProblem[] }
  | { status: "plan"; plan: ReplacePlan }
  | { status: "done"; plan: ReplacePlan };

const MAX_UPLOAD = 4 * 1024 * 1024;
/** Unzipped: about 40 times a big account's file today. */
const MAX_JSON = 64 * 1024 * 1024;

async function readUpload(
  formData: FormData,
): Promise<{ owner: Owner; file: ImportFile } | DataState> {
  const { owner } = await requireContext(); // signed in before reading anything
  const upload = formData.get("file");
  if (!(upload instanceof File) || upload.size === 0)
    return { status: "error", problem: "notFile" };
  if (upload.size > MAX_UPLOAD) return { status: "error", problem: "tooBig" };
  let bytes = Buffer.from(await upload.arrayBuffer());
  try {
    if (bytes[0] === 0x1f && bytes[1] === 0x8b)
      bytes = gunzipSync(bytes, { maxOutputLength: MAX_JSON });
  } catch {
    return { status: "error", problem: "tooBig" };
  }
  let json: unknown;
  try {
    json = JSON.parse(bytes.toString("utf8"));
  } catch {
    return { status: "error", problem: "notJson" };
  }
  const read = readExport(json);
  if (!read.ok) return { status: "invalid", problems: read.problems };
  return { owner, file: read.file };
}

export async function checkReplaceAction(
  _prev: DataState,
  formData: FormData,
): Promise<DataState> {
  const r = await readUpload(formData);
  if ("status" in r) return r;
  return { status: "plan", plan: await planReplace(getDb(), r.owner, r.file) };
}

export async function replaceAction(
  _prev: DataState,
  formData: FormData,
): Promise<DataState> {
  const r = await readUpload(formData);
  if ("status" in r) return r;
  const done = await replaceAll(getDb(), r.owner, r.file);
  if (!done.ok) return { status: "invalid", problems: done.problems };
  revalidatePath("/", "layout");
  return { status: "done", plan: done.plan };
}
