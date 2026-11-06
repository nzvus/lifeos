/**
 * app/_server/clock.ts — the owner's day clock and meal-role bounds, read
 * once per request (React `cache`): pages and the core readers they call
 * share it instead of reading the settings again (2026-10-24: up to three
 * reads a page, on a database billed by transfer).
 */
import "server-only";
import { cache } from "react";
import { readClock } from "@/core/day";
import { requireOwner } from "./owner";
import { getDb } from "./runtime";

export const ownerClock = cache(async () =>
  readClock(await getDb(), await requireOwner()),
);
