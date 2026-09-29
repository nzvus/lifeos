/**
 * app/_server/owner.ts — from an HTTP request to an `Owner` (ADR-0006).
 *
 * This is the ONLY place that reads the session cookie (ADR-0006: "reading
 * cookies happens only in app/"). Every protected page and every server action
 * starts with `requireOwner()` or `requireContext()`:
 *   1. Next's `headers()` gives the incoming request headers (with the cookie);
 *   2. Better Auth verifies the session token against the `session` table;
 *   3. the verified user id becomes an Owner — the only kind of value core's
 *      repositories accept (core/identity/owner.ts).
 * No valid session -> redirect to /sign-in. There is no middleware doing this
 * "for" the pages: CVE-2025-29927 showed middleware can be skipped, so each
 * entry point checks for itself, and core checks again (defence in depth).
 *
 * `cache()` (React): within ONE request, the layout, the page and nested
 * components may all call requireContext(); cache makes it run once.
 */
import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ownerFromVerifiedSession, type Owner } from "@/core/identity/owner";
import { getSettings, type Settings } from "@/core/nutrition/repositories/settings";
import type { Messages } from "@/i18n";
import { getMessages } from "./i18n";
import { getAuth, getDb } from "./runtime";

/** The verified session, or null. Never throws for "not logged in". */
export const getSession = cache(async () => {
  // headers() FIRST: calling it is what marks the page as per-request
  // (dynamic). If getAuth() ran first, `next build` would try to pre-render
  // signed-in pages at build time, without secrets, and fail.
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
});

/** The current Owner; redirects to /sign-in if there is no valid session. */
export const requireOwner = cache(async (): Promise<Owner> => {
  const session = await getSession();
  if (!session) redirect("/sign-in"); // redirect() throws: nothing below runs
  return ownerFromVerifiedSession(session.user.id);
});

export type PageContext = {
  owner: Owner;
  settings: Settings;
  /** The dictionary in the user's language. */
  t: Messages;
};

/** Owner + settings + dictionary: what nearly every page needs. */
export const requireContext = cache(async (): Promise<PageContext> => {
  const owner = await requireOwner();
  const settings = await getSettings(getDb(), owner);
  return { owner, settings, t: getMessages(settings.locale) };
});
