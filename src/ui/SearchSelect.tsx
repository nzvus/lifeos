/**
 * ui/SearchSelect.tsx — pick one item from many by typing (a "combobox").
 *
 * Replaces long <select> menus (47 ingredients!) where scrolling on a phone
 * is slow. You type, the list shows the best matches, you tap or press Enter.
 * With nothing typed it shows the first items, which the parent orders by
 * usage, so today's usual foods are one tap away.
 *
 * Division of labour: this component is presentation and keyboard handling
 * only (ADR-0002: ui/ holds no domain logic). WHICH items match and in what
 * order is decided by the parent through `search(query)`, which calls
 * core/shared/search.ts. The chosen value travels in a hidden input named
 * `name`, so the surrounding <form> and server action see a plain field.
 *
 * Accessibility follows the WAI-ARIA combobox pattern: the text input has
 * role="combobox", the list role="listbox", and aria-activedescendant tells
 * screen readers which option is highlighted while arrow keys move.
 */
"use client";

import { useId, useState, type KeyboardEvent } from "react";

export type SearchOption = { value: string; label: string; hint?: string };

type Props = {
  label: string;
  /** Name of the hidden input carrying the chosen value to the form. */
  name: string;
  /** Returns the matching options for a query, best first (parent-owned). */
  search: (query: string) => SearchOption[];
  /** Finds the option for a value (to show the current choice). */
  find: (value: string) => SearchOption | undefined;
  placeholder: string;
  noResults: string;
  error?: string;
  /** Controlled mode: current value + change handler (meal editor lines). */
  value?: string;
  onChange?: (value: string) => void;
  /** Uncontrolled mode: initial value. */
  defaultValue?: string;
  className?: string;
  /** How many matches to show at once. */
  limit?: number;
};

export function SearchSelect({
  label,
  name,
  search,
  find,
  placeholder,
  noResults,
  error,
  value,
  onChange,
  defaultValue = "",
  className,
  limit = 8,
}: Props) {
  const id = useId();
  const [innerValue, setInnerValue] = useState(defaultValue);
  const current = value ?? innerValue; // controlled if `value` is given
  const [query, setQuery] = useState<string | null>(null); // null = not typing
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = open ? search(query ?? "").slice(0, limit) : [];
  const shown = query ?? find(current)?.label ?? "";

  function choose(option: SearchOption) {
    if (value === undefined) setInnerValue(option.value);
    onChange?.(option.value);
    setQuery(null);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && results[active]) {
      e.preventDefault(); // choose, don't submit the form
      choose(results[active]);
    } else if (e.key === "Escape") {
      setQuery(null);
      setOpen(false);
    }
  }

  const listId = `${id}-list`;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={className ?? "flex flex-col gap-1"}>
      <label htmlFor={id} className="text-meta font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={
            open && results[active] ? `${listId}-${active}` : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          placeholder={placeholder}
          value={shown}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={(e) => {
            e.target.select(); // typing replaces the current choice's text
            setOpen(true);
          }}
          onBlur={() => {
            setQuery(null); // leaving without choosing keeps the old choice
            setOpen(false);
          }}
          onKeyDown={onKeyDown}
          className="w-full rounded-control rule-b-medium border-ink bg-sheet px-2 py-2 text-body outline-none focus-visible:border-focus aria-invalid:border-tomato"
        />
        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-control rule-medium border-ink bg-sheet"
          >
            {results.length === 0 ? (
              <li className="px-3 py-2 text-meta text-muted">{noResults}</li>
            ) : (
              results.map((o, i) => (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  // mousedown, not click: it fires BEFORE the input's blur,
                  // which would otherwise close the list first.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(o);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer flex-col px-3 py-2 ${i === active ? "bg-paper" : ""}`}
                >
                  <span className="font-semibold">{o.label}</span>
                  {o.hint && (
                    <span className="font-display text-meta text-muted tabular-nums">
                      {o.hint}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      <input type="hidden" name={name} value={current} />
      {error && (
        <p id={errorId} className="text-meta font-semibold text-tomato">
          {error}
        </p>
      )}
    </div>
  );
}
