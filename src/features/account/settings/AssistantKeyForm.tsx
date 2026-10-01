/**
 * features/account/settings/AssistantKeyForm.tsx — the OpenRouter key and
 * model for the assistant (ADR-0018). The key field is write-only: the
 * browser never receives the stored key, only its last 4 characters.
 */
"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SubmitButton } from "@/ui/SubmitButton";
import { toast } from "@/ui/Toast";

export function AssistantKeyForm({
  action,
  clear,
  status,
  t,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  clear: () => Promise<{ ok: boolean }>;
  status: { set: boolean; last4: string | null; model: string };
  t: Pick<Messages, "assistant" | "errors" | "settings">;
}) {
  const a = t.assistant;
  const router = useRouter();
  const [state, formAction] = useActionState(action, IDLE);
  const err = (f: string) => fieldError(state, f, t.errors);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "saved" && (
        <FormAlert tone="success">{t.settings.saved}</FormAlert>
      )}
      <p className="text-meta">
        {status.set ? fill(a.keySet, { last4: status.last4 ?? "" }) : a.keyNone}
      </p>
      <Field
        label={a.key}
        name="key"
        type="password"
        autoComplete="off"
        placeholder="sk-or-v1-…"
        error={err("key")}
      />
      <Field
        label={a.model}
        name="model"
        defaultValue={valueOf(state, "model", status.model)}
        hint={a.modelHint}
        error={err("model")}
      />
      <div className="flex flex-wrap gap-2">
        <SubmitButton>{a.saveKey}</SubmitButton>
        {status.set && (
          <button
            type="button"
            className={buttonClass({ variant: "danger" })}
            onClick={async () => {
              await clear();
              toast({ message: a.keyRemoved });
              router.refresh();
            }}
          >
            {a.removeKey}
          </button>
        )}
      </div>
    </form>
  );
}
