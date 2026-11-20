"use client";
/**
 * The day's nutrients for the boxes inside it (bars study §16.4, his 20 Nov «nella timeline
 * giornaliera, ha più senso mostrare quei valori che sono dinamici rispetto a oggi»): a meal open
 * on the timeline shows its slice of the day's ridge, its own values behind its door.
 */
import { createContext, useContext } from "react";
import { ridgeOf, type NutrientsData } from "@lifeos/kit";

export const DayFrame = createContext<NutrientsData | null>(null);

/** The day's ridge with `meal` lit, or null outside a day. */
export function useInDay(meal: NutrientsData | null | undefined) {
  const day = useContext(DayFrame);
  if (!day || !meal) return null;
  return { measures: ridgeOf(day, meal), label: "Il giorno con questo pasto" };
}
