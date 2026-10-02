/**
 * features/account/settings/InviteForm.tsx — Settings → Invitations
 * (ADR-0034, admins only): create an invitation and send its link (copy,
 * or the phone's share sheet); the link is shown once, since only a hash
 * is stored. Below, the invitations made, with their state.
 */
"use client";

import { Check, Copy, Link2, Share2, Trash2, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import type { Messages } from "@/i18n";
import { Badge } from "@/ui/Badge";
import { buttonClass } from "@/ui/button";

export type InviteRow = {
  id: string;
  /** Already written, e.g. "creato il 3 ott · scade il 17 ott". */
  when: string;
  state: "pending" | "used" | "expired";
  usedEmail: string | null;
};

export function InviteForm({
  invites,
  create,
  remove,
  t,
}: {
  invites: InviteRow[];
  create: () => Promise<{ link: string } | null>;
  remove: (id: string) => Promise<void>;
  t: Messages["invites"];
}) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setCopied(false);
            setLink((await create())?.link ?? null);
          })
        }
        className={`self-start ${buttonClass({ variant: "secondary" })}`}
      >
        <UserPlus size={18} aria-hidden="true" />
        {t.create}
      </button>
      {link && (
        <div className="tile flex flex-col gap-2 p-3">
          <span className="inline-flex items-center gap-1.5 text-meta font-semibold">
            <Link2 size={16} aria-hidden="true" />
            {t.link}
          </span>
          <code className="break-all text-meta">{link}</code>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied(true);
              }}
              className={buttonClass({ size: "sm" })}
            >
              {copied ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Copy size={16} aria-hidden="true" />
              )}
              {copied ? t.copied : t.copy}
            </button>
            {canShare && (
              <button
                type="button"
                onClick={() =>
                  navigator.share({ title: t.shareTitle, url: link }).catch(() => {})
                }
                className={buttonClass({ variant: "subtle", size: "sm" })}
              >
                <Share2 size={16} aria-hidden="true" />
                {t.share}
              </button>
            )}
          </div>
          <p className="text-meta text-muted">{t.onlyOnce}</p>
        </div>
      )}
      {invites.length === 0 ? (
        <p className="text-meta text-muted">{t.empty}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {invites.map((i) => (
            <li key={i.id} className="flex items-center gap-2 py-1 text-meta">
              <Badge
                tone={
                  i.state === "used"
                    ? "done"
                    : i.state === "expired"
                      ? "neutral"
                      : "planned"
                }
              >
                {t.states[i.state]}
              </Badge>
              <span className="min-w-0 flex-1 truncate">
                {i.usedEmail ? `${i.usedEmail} · ${i.when}` : i.when}
              </span>
              <button
                type="button"
                aria-label={t.remove}
                title={t.remove}
                disabled={pending}
                onClick={() => start(() => remove(i.id))}
                className={buttonClass({ variant: "quiet", size: "sm", iconOnly: true })}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
