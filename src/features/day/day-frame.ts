"use client";
/**
 * The day's nutrients for the boxes inside it (bars study §16.4, his 20 Nov «nella timeline
 * giornaliera, ha più senso mostrare quei valori che sono dinamici rispetto a oggi»): a meal open
 * on the timeline draws its bars on the day's scale, its share lit; its own values stay behind its
 * «Nutrienti» door.
 */
import { createContext, useContext } from "react";
import type { NutrientsData } from "@lifeos/kit";

export const DayFrame = createContext<NutrientsData | null>(null);

export const useDayFrame = () => useContext(DayFrame);
