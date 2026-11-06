"use server";
/** ⊕ → «Tragitto» (movement slice 1): a route walked now (or at this hour of another day). */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, instantAt, localParts, logicalDay } from "@/core/engines/time";
import { logTrip, readRoutes } from "@/core/movement/routes";
import { logActivity, readExercises } from "@/core/training";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function logTripNow(routeId: string, day: string): Promise<void> {
  if (!ISO.test(day)) return;
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const today = logicalDay(new Date(), clock);
  const route = (await readRoutes(db, owner, addDays(today, -90))).find(
    (r) => r.id === routeId,
  );
  if (!route) return;
  // Ends now; on another day, at this same hour of it.
  const end =
    day === today
      ? new Date()
      : instantAt(day, localParts(new Date(), clock.timeZone).minute, clock);
  // A run along a route is an activity on that route, not a trip (TRAIN-37, ADR-0060):
  // one entry, its km from the route, its energy by ACSM like any run; never twice.
  const run =
    route.mode === "run"
      ? (await readExercises(db, owner)).find((e) =>
          ["corsa", "run"].includes(e.name.trim().toLowerCase()),
        )
      : undefined;
  if (run)
    await logActivity(db, owner, {
      day,
      exerciseId: run.id,
      label: run.name,
      end,
      activity: { minutes: route.durationMin ?? 30, km: route.distanceKm, rpe: null },
      routeId: route.id,
    });
  else await logTrip(db, owner, route, day, end, route.durationMin ?? 15);
  revalidatePath("/", "layout");
  redirect(day === today ? "/oggi" : "/oggi/" + day);
}
