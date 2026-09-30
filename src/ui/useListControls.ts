/**
 * ui/useListControls.ts — the state behind ui/ListToolbar (query, sort,
 * direction, "relative to"), in one hook so every list keeps it the same
 * way. Returns the values for sorting and the props for the toolbar.
 */
"use client";

import { useState } from "react";
import type { SortDirection } from "./SortControl";

export function useListControls<S extends string, P extends string>(initial: {
  sort: S;
  direction: SortDirection;
  per: P;
  /** Sorts where "relative to" means nothing (usage, name). */
  plainSorts: readonly S[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<S>(initial.sort);
  const [direction, setDirection] = useState<SortDirection>(initial.direction);
  const [per, setPer] = useState<P>(initial.per);
  return {
    query,
    sort,
    direction,
    per,
    toolbar: {
      query,
      onQuery: setQuery,
      sort,
      direction,
      onSort: (nextSort: S, nextDirection: SortDirection) => {
        setSort(nextSort);
        setDirection(nextDirection);
      },
      per,
      onPer: setPer,
      perDisabled: initial.plainSorts.includes(sort),
    },
  };
}
