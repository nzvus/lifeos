/**
 * features/money/ReceiptEditor.tsx — a receipt from its text (ADR-0036):
 * paste it, or take a photo (read here on the phone, tesseract.js); the
 * lines are read at once without a model (core/money/receipts.ts), or by
 * the AI on request. Each line can be corrected, linked to a pantry product
 * (remembered links come pre-filled) and sent to the pantry. Nothing is
 * saved until "Save the receipt". Client component.
 */
"use client";

import { Camera, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import { aliasKey, parseReceipt, type ModelReceipt } from "@/core/money/receipts";
import { formatCents } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";
import type { CategoryOption } from "./MovementForm";

type Line = {
  key: number;
  description: string;
  quantity: string;
  /** Euros as typed ("1,29"). */
  amount: string;
  productId: string;
  toPantry: boolean;
};

const euros = (c: number) => (c / 100).toFixed(2).replace(".", ",");
const centsOf = (s: string) => {
  const v = Number(s.replace(",", ".").trim());
  return Number.isFinite(v) && v >= 0 ? Math.round(v * 100) : null;
};

/** Read a photo's text in the browser (as the assistant does). */
async function ocrImage(file: Blob): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(["ita", "eng"]);
  try {
    return (await worker.recognize(file)).data.text.trim();
  } finally {
    await worker.terminate();
  }
}

export function ReceiptEditor({
  save,
  read,
  categories,
  products,
  aliases,
  defaultCategoryId,
  today,
  locale,
  t,
}: {
  save: (prev: FormState, formData: FormData) => Promise<FormState>;
  read: (
    text: string,
  ) => Promise<{ ok: true; receipt: ModelReceipt } | { ok: false; message: string }>;
  categories: CategoryOption[];
  products: { id: string; name: string }[];
  /** aliasKey(receipt text) → product id. */
  aliases: Record<string, string>;
  defaultCategoryId: string;
  today: string;
  locale: Locale;
  t: Pick<Messages, "money" | "errors">;
}) {
  const m = t.money;
  const [state, formAction] = useActionState(save, IDLE);
  const [text, setText] = useState("");
  const [shop, setShop] = useState("");
  const [day, setDay] = useState(today);
  const [printed, setPrinted] = useState<number | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const next = useRef(0);
  const byName = useMemo(
    () => new Map(products.map((p) => [p.name.toLowerCase(), p.id])),
    [products],
  );

  const fillFrom = (r: {
    shop: string;
    day: string | null;
    totalCents: number | null;
    lines: {
      description: string;
      quantity: string | null;
      amountCents: number;
      product?: string | null;
    }[];
  }) => {
    if (r.shop) setShop(r.shop);
    if (r.day) setDay(r.day);
    setPrinted(r.totalCents);
    setLines(
      r.lines.map((l) => {
        const productId =
          aliases[aliasKey(l.description)] ??
          (l.product ? byName.get(l.product.toLowerCase()) : undefined) ??
          "";
        return {
          key: next.current++,
          description: l.description,
          quantity: l.quantity ?? "",
          amount: euros(l.amountCents),
          productId,
          toPantry: Boolean(productId),
        };
      }),
    );
  };
  const onText = (v: string) => {
    setText(v);
    fillFrom(parseReceipt(v));
  };
  const patch = (key: number, p: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));

  const total = lines.reduce((a, l) => a + (centsOf(l.amount) ?? 0), 0);
  const payload = JSON.stringify(
    lines.map((l) => ({
      description: l.description,
      quantity: l.quantity.replace(",", ".") || null,
      amountCents: centsOf(l.amount) ?? 0,
      productId: l.productId || null,
      toPantry: Boolean(l.productId) && l.toPantry,
    })),
  );
  const err = (f: string) => fieldError(state, f, t.errors);
  // "lines" or "lines.2.quantity": say which line, in its words.
  const lineKey =
    state.status === "error"
      ? Object.keys(state.errors).find((k) => k === "lines" || k.startsWith("lines."))
      : undefined;
  const lineNo = lineKey?.split(".")[1];
  const lineError = lineKey
    ? `${lineNo === undefined ? "" : `${fill(m.lineNumber, { n: String(Number(lineNo) + 1) })} `}${err(lineKey)}`
    : null;
  const small = buttonClass({ variant: "secondary", size: "sm" });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="receipt-text" className="text-meta font-semibold">
          {m.receiptText}
        </label>
        <textarea
          id="receipt-text"
          name="text"
          value={text}
          onChange={(e) => onText(e.target.value)}
          rows={8}
          className="w-full rounded-control rule-b-medium border-ink bg-sheet px-2 py-2 font-mono text-meta"
        />
        <p className="text-meta text-muted">{m.receiptHint}</p>
        {err("text") && <FormAlert tone="error">{err("text")}</FormAlert>}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className={`${small} cursor-pointer`}>
          <Camera size={16} aria-hidden="true" />
          {busy ? m.reading : m.fromPhoto}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) start(async () => onText(await ocrImage(file)));
            }}
          />
        </label>
        <button
          type="button"
          disabled={busy || !text.trim()}
          onClick={() =>
            start(async () => {
              setProblem(null);
              const r = await read(text);
              if (r.ok) fillFrom(r.receipt);
              else setProblem(r.message);
            })
          }
          className={small}
        >
          <Sparkles size={16} aria-hidden="true" />
          {busy ? m.reading : m.withModel}
        </button>
      </div>
      <p className="text-meta text-muted">{m.modelHint}</p>
      {problem && <FormAlert tone="info">{problem}</FormAlert>}

      <div className="grid grid-cols-2 gap-3">
        <Field
          label={m.shop}
          name="shop"
          value={shop}
          onChange={(e) => setShop(e.target.value)}
        />
        <Field
          label={m.day}
          name="day"
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          error={err("day")}
          required
        />
        <SelectField
          label={m.category}
          name="categoryId"
          placeholder={m.noCategory}
          defaultValue={defaultCategoryId}
          options={categories
            .filter((c) => c.kind === "expense")
            .map((c) => ({ value: c.id, label: c.label }))}
          error={err("categoryId")}
        />
        <SelectField
          label={m.method}
          name="method"
          placeholder={m.methodNone}
          options={(["card", "cash", "account", "other"] as const).map((k) => ({
            value: k,
            label: m.methods[k],
          }))}
        />
      </div>

      <section className="flex flex-col gap-2" aria-label={m.lines}>
        <h2 className="font-display text-item font-semibold">{m.lines}</h2>
        <p className="text-meta text-muted">{m.receiptHow}</p>
        <ul className="flex flex-col gap-3">
          {lines.map((l) => (
            <li key={l.key} className="tile flex flex-col gap-2 p-2">
              <div className="flex items-end gap-2">
                <Field
                  label={m.lineName}
                  name={`line-${l.key}`}
                  value={l.description}
                  onChange={(e) => patch(l.key, { description: e.target.value })}
                  className="flex min-w-0 flex-1 flex-col gap-1"
                />
                <button
                  type="button"
                  aria-label={m.removeLine}
                  title={m.removeLine}
                  onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                  className={`${buttonClass({ variant: "subtle", iconOnly: true })} text-tomato`}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Field
                  label={m.lineQty}
                  name={`qty-${l.key}`}
                  inputMode="decimal"
                  value={l.quantity}
                  onChange={(e) => patch(l.key, { quantity: e.target.value })}
                />
                <Field
                  label={m.lineAmount}
                  name={`amount-${l.key}`}
                  inputMode="decimal"
                  value={l.amount}
                  onChange={(e) => patch(l.key, { amount: e.target.value })}
                  className="col-span-2 flex flex-col gap-1"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={`product-${l.key}`} className="text-meta font-semibold">
                  {m.product}
                </label>
                <select
                  id={`product-${l.key}`}
                  value={l.productId}
                  onChange={(e) =>
                    patch(l.key, {
                      productId: e.target.value,
                      toPantry: Boolean(e.target.value),
                    })
                  }
                  className="w-full rounded-control rule-b-medium border-ink bg-sheet px-2 py-2 text-body"
                >
                  <option value="">{m.noProduct}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {l.productId && (
                  <label className="inline-flex items-center gap-2 text-meta">
                    <input
                      type="checkbox"
                      checked={l.toPantry}
                      onChange={(e) => patch(l.key, { toPantry: e.target.checked })}
                      className="size-5 accent-herb"
                    />
                    {m.toPantry}
                  </label>
                )}
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() =>
            setLines((ls) => [
              ...ls,
              {
                key: next.current++,
                description: "",
                quantity: "",
                amount: "",
                productId: "",
                toPantry: false,
              },
            ])
          }
          className={`self-start ${small}`}
        >
          <Plus size={16} aria-hidden="true" />
          {m.addLine}
        </button>
        <p className="flex flex-wrap gap-x-4 text-meta tabular-nums">
          <span className="font-semibold">
            {fill(m.linesTotal, { v: formatCents(total, locale) })}
          </span>
          {printed !== null && (
            <span className="text-muted">
              {fill(m.printedTotal, { v: formatCents(printed, locale) })}
            </span>
          )}
        </p>
        {printed !== null && printed !== total && lines.length > 0 && (
          <FormAlert tone="info">{m.mismatch}</FormAlert>
        )}
        {lineError && <FormAlert tone="error">{lineError}</FormAlert>}
      </section>
      <input type="hidden" name="lines" value={payload} />
      <div>
        <SubmitButton icon={<Save size={18} aria-hidden="true" />}>
          {m.saveReceipt}
        </SubmitButton>
      </div>
    </form>
  );
}
