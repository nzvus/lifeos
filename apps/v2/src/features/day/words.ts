/**
 * features/day/words.ts — the day's words in Italian (content.md): the
 * built-in kinds' names, their fields and their choices. One place, so the
 * timeline and the entry sheet name a thing the same way.
 */
/** Built-in kinds' names on the day (Italian, content.md). */
export const NAMES: Record<string, string> = {
  meal: "Pasto",
  batch: "Cucinato",
  water: "Acqua",
  session: "Allenamento",
  steps: "Passi",
  trip: "Tragitto",
  activity: "Attività",
  reading: "Lettura",
  weigh_in: "Peso",
  measurements: "Misure",
  sleep: "Sveglia",
  nap: "Riposo",
  checkin: "Come stai",
  journal: "Diario",
  movement: "Movimento",
  purchase: "Spesa",
  stock_count: "Scorta",
  chore: "Faccenda",
};
/** A meal's role as its name on the day and in the composer (the boards: «Colazione», «Cena»). */
export const MEAL_ROLE_WORDS: Record<string, string> = {
  breakfast: "Colazione",
  lunch: "Pranzo",
  snack: "Spuntino",
  dinner: "Cena",
};
export const ACTIVITY: Record<string, string> = {
  work: "Lavoro",
  study: "Studio",
  commute: "Spostamenti",
  chores: "Faccende",
  leisure: "Tempo libero",
  social: "Amici",
  family: "Famiglia",
  screen: "Schermi",
};

/** "walkingMin" → "Walking min": a user's own field in words until it has a label. */
export const keyWords = (key: string) => {
  const s = key.replace(/([A-Z])/g, " $1").toLowerCase();
  return s[0]!.toUpperCase() + s.slice(1);
};

/** Field labels of the built-in kinds; a user's own kind shows its key in words. */
export const FIELDS: Record<string, string> = {
  ml: "Quantità",
  steps: "Passi",
  walkingMin: "Camminata",
  level: "Livello",
  category: "Cosa",
  focus: "Concentrazione",
  pages: "Pagine",
  weightKg: "Peso",
  bodyFatPct: "Massa grassa",
  waistCm: "Vita",
  hipCm: "Fianchi",
  neckCm: "Collo",
  abdomenCm: "Addome",
  fasted: "A digiuno",
  afterToilet: "Dopo il bagno",
  afterTraining: "Dopo l’allenamento",
  quality: "Qualità",
  mood: "Umore",
  energy: "Energia",
  stress: "Stress",
  moment: "Momento",
};

/** Choice values → words, per field. */
export const CHOICES: Record<string, Record<string, string>> = {
  category: ACTIVITY,
  level: { sitting: "Seduto", mixed: "Misto", on_feet: "In piedi" },
  moment: { morning: "Mattina", evening: "Sera" },
};
