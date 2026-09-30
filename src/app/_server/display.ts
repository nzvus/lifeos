/**
 * app/_server/display.ts — the per-device display settings in cookies
 * (ADR-0010). Read by the root layout for every page, written by the
 * settings action. Values are parsed by core, so a tampered or stale cookie
 * falls back to the default instead of breaking the page.
 *
 * Nothing secret, but only the server reads them, so HttpOnly anyway; one
 * year, so the choice lasts until it is changed.
 */
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { parseColorMode, parseLayout, type Display } from "@/core/shared/display";
import { env } from "./env";

const MODE_COOKIE = "lifeos-mode";
const LAYOUT_COOKIE = "lifeos-layout";
const ONE_YEAR = 60 * 60 * 24 * 365;

export const getDisplay = cache(async (): Promise<Display> => {
  const jar = await cookies();
  return {
    mode: parseColorMode(jar.get(MODE_COOKIE)?.value),
    layout: parseLayout(jar.get(LAYOUT_COOKIE)?.value),
  };
});

/** Only from a server action (Next.js allows setting cookies only there). */
export async function saveDisplay(display: Display): Promise<void> {
  const jar = await cookies();
  const options = {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    httpOnly: true,
    // Secure (HTTPS only) wherever the app itself is served over HTTPS.
    secure: env().baseURL.startsWith("https:"),
  } as const;
  jar.set(MODE_COOKIE, display.mode, options);
  jar.set(LAYOUT_COOKIE, display.layout, options);
}
