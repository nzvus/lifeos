/**
 * core/shared/navigation.ts — where "back", Cancel and "after saving" lead
 * (ADR-0015): to the page you came from, passed as `?from=`, else a
 * fallback (the list). Only paths of this app are accepted: "/meals?x=1"
 * yes; "//evil.com", "https://…" or "javascript:" never (an open redirect).
 */
export function safeFrom(raw: string | undefined | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\"))
    return fallback;
  return raw;
}

/** `href` with `?from=` (or `&from=`) pointing back to `here`. */
export function withFrom(href: string, here: string): string {
  return `${href}${href.includes("?") ? "&" : "?"}from=${encodeURIComponent(here)}`;
}
