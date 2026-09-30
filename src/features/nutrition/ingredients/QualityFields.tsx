/**
 * features/nutrition/ingredients/QualityFields.tsx — the "Quality and tags"
 * part of the ingredient editor (ADR-0012): NOVA level, origin, main fibre
 * types (each with what it is and the bacteria it is associated with —
 * descriptive, never a promise) and free tags with an icon.
 *
 * Fibre types and tags travel as hidden fields (comma list, JSON), like the
 * meal editor's lines; core validates them.
 */
"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { FIBER_TYPES, NOVA_LEVELS, ORIGINS, TAG_ICONS } from "@/core/nutrition/quality";
import { fill, type Messages } from "@/i18n";
import { FiberTypeIcon, OriginIcon, TagIcon } from "@/ui/QualityIcons";
import { Section } from "@/ui/Section";
import { SelectField } from "@/ui/SelectField";

type TagValue = { name: string; icon: string };

type Props = {
  /** Field values to start from ("" = not classified). */
  nova: string;
  origin: string;
  /** Comma list, e.g. "pectin,inulin_fos". */
  fiberTypes: string;
  tags: TagValue[];
  /** My existing tags, suggested while typing. */
  knownTags: TagValue[];
  errors: { nova?: string; origin?: string; fiberTypes?: string; tags?: string };
  t: Pick<Messages, "quality">;
};

export function QualityFields({
  nova,
  origin,
  fiberTypes,
  tags,
  knownTags,
  errors,
  t,
}: Props) {
  const q = t.quality;
  const [fibers, setFibers] = useState(
    () => new Set(fiberTypes.split(",").filter(Boolean)),
  );
  const [list, setList] = useState<TagValue[]>(tags);
  const [draft, setDraft] = useState<TagValue>({ name: "", icon: "tag" });

  const toggle = (f: string) =>
    setFibers((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  const add = () => {
    const name = draft.name.trim();
    if (!name || list.some((x) => x.name.toLowerCase() === name.toLowerCase())) return;
    // A known tag keeps its icon unless another one was picked.
    const known = knownTags.find((k) => k.name.toLowerCase() === name.toLowerCase());
    setList([
      ...list,
      {
        name: known?.name ?? name,
        icon: draft.icon !== "tag" ? draft.icon : (known?.icon ?? "tag"),
      },
    ]);
    setDraft({ name: "", icon: "tag" });
  };

  return (
    <Section as="fieldset" title={q.title}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={q.nova}
          name="nova"
          defaultValue={nova}
          options={[
            { value: "", label: q.novaNone },
            ...NOVA_LEVELS.map((n) => ({ value: String(n), label: q.novaNames[n] })),
          ]}
          error={errors.nova}
        />
        <SelectField
          label={q.origin}
          icon={origin ? <OriginIcon origin={origin} size={16} /> : undefined}
          name="origin"
          defaultValue={origin}
          options={[
            { value: "", label: q.originNone },
            ...ORIGINS.map((o) => ({ value: o, label: q.origins[o] })),
          ]}
          error={errors.origin}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-meta font-semibold">{q.fiberTypes}</span>
        <ul className="grid gap-2 sm:grid-cols-2">
          {FIBER_TYPES.map((f) => (
            <li key={f}>
              <label className="flex items-start gap-2 text-meta">
                <input
                  type="checkbox"
                  checked={fibers.has(f)}
                  onChange={() => toggle(f)}
                  className="mt-0.5 h-4 w-4 accent-herb"
                />
                <span className="flex flex-col">
                  <span className="inline-flex items-center gap-1 font-semibold text-macro-fiber">
                    <FiberTypeIcon type={f} />
                    {q.fiberNames[f]}
                  </span>
                  <span className="text-muted">{q.fiberAbout[f]}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        {errors.fiberTypes && (
          <p className="text-meta font-semibold text-tomato">{errors.fiberTypes}</p>
        )}
        <p className="text-meta text-muted">{q.fiberNote}</p>
        <input
          type="hidden"
          name="fiberTypes"
          value={FIBER_TYPES.filter((f) => fibers.has(f)).join(",")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-meta font-semibold">{q.tags}</span>
        {list.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {list.map((tag) => (
              <li
                key={tag.name}
                className="inline-flex items-center gap-1 rounded-control border border-hairline bg-paper px-1.5 text-meta"
              >
                <TagIcon icon={tag.icon} />
                {tag.name}
                <button
                  type="button"
                  onClick={() => setList(list.filter((x) => x !== tag))}
                  aria-label={fill(q.removeTag, { name: tag.name })}
                  className="text-muted hover:text-tomato"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 text-meta">
            <span className="sr-only">{q.tagName}</span>
            <input
              list="known-tags"
              value={draft.name}
              placeholder={q.tagName}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // add the tag, don't submit the form
                  add();
                }
              }}
              className="rounded-control rule-b-medium border-ink bg-sheet px-2 py-1.5 text-body"
            />
          </label>
          <datalist id="known-tags">
            {knownTags.map((k) => (
              <option key={k.name} value={k.name} />
            ))}
          </datalist>
          <SelectField
            label={q.tagIcon}
            icon={<TagIcon icon={draft.icon} size={16} />}
            name="tag-icon-draft" // not read by the server; `tags` is
            value={draft.icon}
            onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
            options={TAG_ICONS.map((i) => ({ value: i, label: q.tagIcons[i] }))}
            className="flex w-40 flex-col gap-1"
          />
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1 rounded-control border border-hairline px-2 py-1.5 text-meta hover:border-ink"
          >
            <Plus size={14} aria-hidden="true" />
            {q.addTag}
          </button>
        </div>
        {errors.tags && (
          <p className="text-meta font-semibold text-tomato">{errors.tags}</p>
        )}
        <p className="text-meta text-muted">{q.tagsHint}</p>
        <input type="hidden" name="tags" value={JSON.stringify(list)} />
      </div>
    </Section>
  );
}
