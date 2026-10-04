/**
 * core/catalog/apply.ts — ADDS a validated pack (./pack.ts) to one account
 * (ADR-0034). Never changes or removes anything:
 *   - a record whose name the account already has (case, accents and
 *     punctuation ignored) is left as it is, and the pack's points at it;
 *   - ONE transaction: the pack is added whole or not at all.
 * Missing references are reported, not guessed:
 *   - a routine loses only the item whose exercise is nowhere;
 *   - a program or a meal with a missing reference is skipped whole (a
 *     program with a hole, or a meal with wrong nutrition, would mislead).
 * Programs arrive INACTIVE, starting today: the account's active program
 * stays the one in use.
 * Estimates arrive PLANNED on the pack's day (or today), as estimated
 * entries: nothing is eaten until it is ticked. One whose name that day
 * already has (any status) is kept, so importing twice adds nothing.
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import {
  exercises,
  ingredients,
  logEntries,
  mealItems,
  meals,
  programs,
  programSlotExercises,
  programSlotItems,
  programSlots,
  routineItems,
  routines,
} from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { logEstimate } from "../nutrition/repositories/log";
import { live } from "../shared/trash";
import { nameKey, PACK_KINDS, type ApplyReport, type Pack, type PackKind } from "./pack";

export type { ApplyReport, PackKind };

const zero = (): Record<PackKind, number> =>
  Object.fromEntries(PACK_KINDS.map((k) => [k, 0])) as Record<PackKind, number>;

export async function applyPack(
  db: Db,
  owner: Owner,
  pack: Pack,
  today: string,
): Promise<ApplyReport> {
  const report: ApplyReport = { added: zero(), kept: zero(), missing: [] };
  await db.transaction(async (tx) => {
    type Named = typeof exercises | typeof routines | typeof ingredients | typeof meals;
    /** Name key → id of what the account has (live rows; the trash may hold a namesake). */
    const mine = async (table: Named) =>
      new Map(
        (
          await tx
            .select({ id: table.id, name: table.name })
            .from(table)
            .where(and(ownedBy(table, owner), live(table)))
        ).map((r) => [nameKey(r.name), r.id]),
      );

    // Exercises first: routines and programs point at them.
    const exerciseIds = await mine(exercises);
    for (const e of pack.exercises) {
      const key = nameKey(e.name);
      if (exerciseIds.has(key)) {
        report.kept.exercises++;
        continue;
      }
      const [row] = await tx
        .insert(exercises)
        .values({ ...e, userId: owner.id })
        .returning({ id: exercises.id });
      exerciseIds.set(key, row!.id);
      report.added.exercises++;
    }

    const routineIds = await mine(routines);
    for (const r of pack.routines) {
      const key = nameKey(r.name);
      if (routineIds.has(key)) {
        report.kept.routines++;
        continue;
      }
      const items = r.items.flatMap((it) => {
        const exerciseId = exerciseIds.get(nameKey(it.exercise));
        if (!exerciseId) report.missing.push(`${r.name} → ${it.exercise}`);
        return exerciseId ? [{ ...it, exerciseId }] : [];
      });
      if (items.length === 0) continue;
      const [row] = await tx
        .insert(routines)
        .values({ userId: owner.id, name: r.name, notes: r.notes })
        .returning({ id: routines.id });
      await tx.insert(routineItems).values(
        items.map((it, position) => ({
          userId: owner.id,
          routineId: row!.id,
          exerciseId: it.exerciseId,
          position,
          sets: it.sets,
          reps: it.reps,
          loadKg: it.loadKg,
          durationS: it.durationS,
          restS: it.restS,
        })),
      );
      routineIds.set(key, row!.id);
      report.added.routines++;
    }

    const programNames = new Set(
      (
        await tx
          .select({ name: programs.name })
          .from(programs)
          .where(and(ownedBy(programs, owner), live(programs)))
      ).map((p) => nameKey(p.name)),
    );
    for (const p of pack.programs) {
      if (programNames.has(nameKey(p.name))) {
        report.kept.programs++;
        continue;
      }
      const slots = p.slots.map((s) => ({
        ...s,
        routineId: s.routine ? routineIds.get(nameKey(s.routine)) : undefined,
        exerciseId: s.exercise ? exerciseIds.get(nameKey(s.exercise)) : undefined,
      }));
      const lost = slots.filter(
        (s) => (s.routine && !s.routineId) || (s.exercise && !s.exerciseId),
      );
      if (lost.length) {
        for (const s of lost)
          report.missing.push(`${p.name} → ${s.routine ?? s.exercise}`);
        continue;
      }
      const [row] = await tx
        .insert(programs)
        .values({
          userId: owner.id,
          name: p.name,
          notes: p.notes,
          startDay: today,
          active: false,
        })
        .returning({ id: programs.id });
      for (const [position, s] of slots.entries()) {
        const [slot] = await tx
          .insert(programSlots)
          .values({
            userId: owner.id,
            programId: row!.id,
            position,
            routineId: s.routineId ?? null,
            label: s.label,
          })
          .returning({ id: programSlots.id });
        if (s.exerciseId)
          await tx
            .insert(programSlotExercises)
            .values({ userId: owner.id, slotId: slot!.id, exerciseId: s.exerciseId });
        // ADR-0035: the day's item list (one item from a pack).
        if (s.routineId || s.exerciseId)
          await tx.insert(programSlotItems).values({
            userId: owner.id,
            slotId: slot!.id,
            position: 0,
            routineId: s.routineId ?? null,
            exerciseId: s.routineId ? null : (s.exerciseId ?? null),
          });
      }
      programNames.add(nameKey(p.name));
      report.added.programs++;
    }

    const ingredientIds = await mine(ingredients);
    for (const i of pack.ingredients) {
      const key = nameKey(i.name);
      if (ingredientIds.has(key)) {
        report.kept.ingredients++;
        continue;
      }
      const [row] = await tx
        .insert(ingredients)
        .values({ ...i, userId: owner.id })
        .returning({ id: ingredients.id });
      ingredientIds.set(key, row!.id);
      report.added.ingredients++;
    }

    const mealIds = await mine(meals);
    for (const m of pack.meals) {
      const key = nameKey(m.name);
      if (mealIds.has(key)) {
        report.kept.meals++;
        continue;
      }
      const lines = m.items.map((it) => ({
        ...it,
        ingredientId: ingredientIds.get(nameKey(it.ingredient)),
      }));
      const lost = lines.filter((l) => !l.ingredientId);
      if (lost.length) {
        for (const l of lost) report.missing.push(`${m.name} → ${l.ingredient}`);
        continue;
      }
      const [row] = await tx
        .insert(meals)
        .values({ userId: owner.id, name: m.name, notes: m.notes, category: m.category })
        .returning({ id: meals.id });
      await tx.insert(mealItems).values(
        lines.map((l, position) => ({
          userId: owner.id,
          mealId: row!.id,
          ingredientId: l.ingredientId!,
          quantity: l.quantity,
          position,
        })),
      );
      mealIds.set(key, row!.id);
      report.added.meals++;
    }

    const day = pack.day ?? today;
    const onDay = new Set(
      (
        await tx
          .select({ label: logEntries.label })
          .from(logEntries)
          .where(
            and(ownedBy(logEntries, owner), live(logEntries), eq(logEntries.day, day)),
          )
      ).map((r) => nameKey(r.label)),
    );
    for (const { name, ...e } of pack.estimates) {
      if (onDay.has(nameKey(name))) {
        report.kept.estimates++;
        continue;
      }
      const r = await logEstimate(tx, owner, {
        ...e,
        day,
        label: name,
        status: "planned",
        at: null,
      });
      if (!r.ok) throw new Error("estimate not added"); // validated: unreachable
      onDay.add(nameKey(name));
      report.added.estimates++;
    }
  });
  return report;
}
