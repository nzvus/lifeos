/**
 * app/(app)/settings/invite-actions.ts — Settings → Invitations (ADR-0034):
 * create one (its link is shown once: only a hash is stored) or withdraw
 * one. Admins only, checked here and not just by hiding the section.
 */
"use server";

import { revalidatePath } from "next/cache";
import { env } from "@/app/_server/env";
import { isAdmin, requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { createInvite, deleteInvite } from "@/core/auth/invites";

export async function createInviteAction(): Promise<{ link: string } | null> {
  const owner = await requireOwner();
  if (!(await isAdmin())) return null;
  const { code } = await createInvite(getDb(), owner, new Date());
  revalidatePath("/settings");
  return { link: `${env().baseURL}/sign-up?invite=${code}` };
}

export async function deleteInviteAction(id: string): Promise<void> {
  const owner = await requireOwner();
  if (!(await isAdmin())) return;
  await deleteInvite(getDb(), owner, id);
  revalidatePath("/settings");
}
