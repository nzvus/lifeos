/**
 * app/_client/RegisterServiceWorker.tsx — registers public/sw.js (ADR-0019).
 * Production only: in development a service worker would get in the way of
 * hot reload. Renders nothing. Client component.
 */
"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // No service worker = a normal website; nothing to tell the user.
    });
  }, []);
  return null;
}
