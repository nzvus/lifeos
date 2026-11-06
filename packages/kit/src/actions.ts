/**
 * ObjectActions (PAT-16…20, PAT-22, PAT-23): the verbs an object offers, as the registry
 * declares them. The everyday ones sit in the row at the end of its page; the rare ones go
 * under «⋯ Altro», in a sheet, destructive last (in tomato). Pure.
 */
export type ObjectVerb =
  | "startFrom"
  | "variant"
  | "archive"
  | "restore"
  | "merge"
  | "saveAs"
  | "delete"
  | "trash";

const ROW: readonly ObjectVerb[] = ["startFrom", "variant", "archive", "restore"];
const MORE_ORDER: readonly ObjectVerb[] = ["saveAs", "merge", "delete", "trash"];
export const DESTRUCTIVE: ReadonlySet<ObjectVerb> = new Set(["delete", "trash"]);

/** Which verbs go in the row and which under «Altro»; an archived object offers Ripristina. */
export function splitActions(
  verbs: readonly string[],
  archived = false,
): { row: ObjectVerb[]; more: ObjectVerb[] } {
  const has = (v: ObjectVerb) => verbs.includes(v);
  const row = ROW.filter((v) => has(v) && (archived ? v === "restore" : v !== "restore"));
  const more = MORE_ORDER.filter((v) => has(v) && !(v === "trash" && has("delete")));
  return { row, more };
}
