/**
 * The object verbs' server side as one object (PAT-24, PAT-101): what a page passes to the
 * features that run verbs — the object page, and each box's actions row in the Elenco.
 */
import { objectMerge, objectMergePreview, objectUndo, objectVerb } from "./actions";

export const VERB_SERVER = {
  run: objectVerb,
  revert: objectUndo,
  mergePreview: objectMergePreview,
  merge: objectMerge,
};
