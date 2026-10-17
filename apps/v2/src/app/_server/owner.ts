/**
 * app/_server/owner.ts — from a request to an `Owner` (ADR-0006), as v1's:
 * the only place that reads the session cookie. Every page and action starts
 * with `requireOwner()`; no middleware does it for them (CVE-2025-29927).
 */
import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ownerFromVerifiedSession, type Owner } from "@/core/identity/owner";
import { getAuth } from "./runtime";

/** The verified session, or null. headers() first: it makes the page per-request. */
export const getSession = cache(async () => {
  const requestHeaders = await headers();
  return (await getAuth()).api.getSession({ headers: requestHeaders });
});

export const requireOwner = cache(async (): Promise<Owner> => {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return ownerFromVerifiedSession(session.user.id);
});
