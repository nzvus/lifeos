/**
 * core/import/legacy.ts — reads an export of versions 1–20 (records nested
 * in their parents) as the flat tables of version 21 (ADR-0052).
 *
 * Only the sections a file has become tables: a version-12 file has no
 * `money`, so the money tables are absent and the replace keeps the
 * account's own (core/import/replace.ts decides what an absent table means).
 * Fields a version lacks are left out, so the database's defaults fill them.
 *
 * History of the nested format, for reading old files:
 * 2 dayProfiles, dayPlans (ADR-0008) · 3 log status/at/estimated (ADR-0009) ·
 * 4 category, moment (ADR-0011) · 5 quality + tags (ADR-0012) · 6 training
 * (ADR-0005/0016) · 7 pantry (ADR-0017) · 8 assistant (ADR-0018) · 9 programs
 * (ADR-0024) · 10 a measurement's `context` (ADR-0027) · 11 sleep (ADR-0031) ·
 * 12 a program slot's `items` and a program's `skips` (ADR-0035) · 13 a log
 * entry's `leftOut`, money (ADR-0036) · 14 mind, set times (ADR-0037/0038) ·
 * 15 dayClosures (ADR-0042) · 16 goals, weekCheckins (ADR-0043) ·
 * 17 energyCorrections (ADR-0026) · 18 a day type's `program` (ADR-0044) ·
 * 19 a check-in's `shifts` (ADR-0044) · 20 a set's `rir` (ADR-0049).
 */
type Row = Record<string, unknown>;
type Nested = Record<string, unknown>;

const list = (x: unknown): Row[] => (Array.isArray(x) ? (x as Row[]) : []);
const has = (o: Nested | undefined, k: string) => o !== undefined && k in o;

/** Removes the named keys, returning the rest. */
function without(row: Row, ...keys: string[]): Row {
  return Object.fromEntries(Object.entries(row).filter(([k]) => !keys.includes(k)));
}

export function legacyTables(file: Nested): Record<string, Row[]> {
  const t: Record<string, Row[]> = {};

  if (file.settings && typeof file.settings === "object")
    t.user_settings = [file.settings as Row];

  if (has(file, "ingredients")) {
    const tagIds = new Map<string, string>();
    t.ingredients = [];
    t.tags = [];
    t.ingredient_tags = [];
    for (const i of list(file.ingredients)) {
      t.ingredients.push(without(i, "tags"));
      for (const tag of list(i.tags)) {
        const name = String(tag.name);
        if (!tagIds.has(name)) {
          tagIds.set(name, `tag:${name}`);
          t.tags.push({ id: `tag:${name}`, name, icon: tag.icon });
        }
        t.ingredient_tags.push({ ingredientId: i.id, tagId: tagIds.get(name) });
      }
    }
  }
  if (has(file, "ratingFactors")) t.rating_factors = list(file.ratingFactors);
  if (has(file, "meals")) {
    t.meals = [];
    t.meal_items = [];
    t.meal_ratings = [];
    for (const m of list(file.meals)) {
      t.meals.push(without(m, "items", "ratings"));
      t.meal_items.push(...list(m.items));
      for (const r of list(m.ratings)) t.meal_ratings.push({ ...r, mealId: m.id });
    }
  }
  if (has(file, "dayProfiles")) {
    t.day_profiles = [];
    const programs: Row[] = [];
    const slots: Row[] = [];
    for (const p of list(file.dayProfiles)) {
      t.day_profiles.push(without(p, "program"));
      const program = p.program as Row | null | undefined;
      if (!program) continue;
      programs.push({
        profileId: p.id,
        trainingAt: program.trainingAt,
        shiftKcal: program.shiftKcal,
      });
      list(program.slots).forEach((s, position) =>
        slots.push({ ...s, profileId: p.id, position }),
      );
    }
    // Before version 18 a day type had no program: keep the account's.
    if (list(file.dayProfiles).some((p) => "program" in p)) {
      t.day_programs = programs;
      t.day_program_slots = slots;
    }
  }
  if (has(file, "dayPlans")) t.day_plans = list(file.dayPlans);
  if (has(file, "dayClosures")) t.day_closures = list(file.dayClosures);
  if (has(file, "energyCorrections")) t.energy_corrections = list(file.energyCorrections);
  if (has(file, "goals")) t.goals = list(file.goals);
  if (has(file, "weekCheckins")) {
    const checkins = list(file.weekCheckins);
    t.week_checkins = checkins.map((c) => without(c, "shifts"));
    if (checkins.some((c) => "shifts" in c))
      t.week_checkin_days = checkins.flatMap((c) =>
        Object.entries((c.shifts as Record<string, number> | undefined) ?? {}).map(
          ([day, shiftKcal]) => ({ startDay: c.startDay, day, shiftKcal }),
        ),
      );
  }
  if (has(file, "log")) {
    const log = list(file.log);
    t.log_entries = log.map((e) => without(e, "items", "leftOut"));
    t.log_entry_items = log.flatMap((e) => list(e.items));
    if (log.some((e) => "leftOut" in e))
      t.log_entry_left_out = log.filter((e) => e.leftOut).map((e) => ({ entryId: e.id }));
  }

  const training = file.training as Nested | undefined;
  if (training) {
    t.exercises = list(training.exercises);
    t.routines = list(training.routines).map((r) => without(r, "items"));
    t.routine_items = list(training.routines).flatMap((r) => list(r.items));
    const sessions = list(training.sessions);
    t.training_sessions = sessions.map((s) => without(s, "exercises"));
    t.session_exercises = sessions.flatMap((s) =>
      list(s.exercises).map((e) => without(e, "sets")),
    );
    t.sets = sessions.flatMap((s) => list(s.exercises).flatMap((e) => list(e.sets)));
    const measurements = list(training.measurements);
    t.body_measurements = measurements.map((m) => without(m, "context"));
    if (measurements.some((m) => "context" in m))
      t.weigh_in_context = measurements
        .filter((m) => m.context)
        .map((m) => ({
          ...without(m.context as Row, "measurementId"),
          measurementId: m.id,
        }));
    if (has(training, "sleep")) t.sleep_logs = list(training.sleep);
    t.day_activity = list(training.dayActivity);
    if (has(training, "programs")) {
      const programs = list(training.programs);
      t.programs = programs.map((p) => without(p, "slots", "skips"));
      const slots = programs.flatMap((p) => list(p.slots));
      t.program_slots = slots.map((s) => without(s, "exerciseId", "items"));
      t.program_slot_exercises = slots
        .filter((s) => s.exerciseId)
        .map((s) => ({
          id: `pse:${String(s.id)}`,
          slotId: s.id,
          exerciseId: s.exerciseId,
        }));
      if (slots.some((s) => "items" in s))
        t.program_slot_items = slots.flatMap((s) => list(s.items));
      if (programs.some((p) => "skips" in p))
        t.program_skips = programs.flatMap((p) => list(p.skips));
    }
  }

  const pantry = file.pantry as Nested | undefined;
  if (pantry) {
    const products = list(pantry.products);
    t.products = products.map((p) => without(p, "purchases"));
    t.purchases = products.flatMap((p) => list(p.purchases));
    t.stock_counts = list(pantry.stockCounts);
    t.batches = list(pantry.batches).map((b) => without(b, "lines"));
    t.batch_lines = list(pantry.batches).flatMap((b) => list(b.lines));
    t.reminders = list(pantry.reminders);
  }

  const assistant = file.assistant as Nested | undefined;
  if (assistant) {
    const conversations = list(assistant.conversations);
    t.assistant_conversations = conversations.map((c) => without(c, "messages"));
    t.assistant_messages = conversations.flatMap((c) => list(c.messages));
  }

  const money = file.money as Nested | undefined;
  if (money) {
    t.money_categories = list(money.categories);
    t.money_movements = list(money.movements).map((m) => without(m, "lines"));
    t.money_lines = list(money.movements).flatMap((m) => list(m.lines));
    t.money_receipts = list(money.receipts);
    t.receipt_aliases = list(money.aliases);
  }

  const mind = file.mind as Nested | undefined;
  if (mind) t.day_checkins = list(mind.checkins);

  return t;
}
