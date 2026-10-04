/**
 * core/money/starter.ts — the categories a new ledger starts with (ADR-0036),
 * in the account's language. Two levels; the user edits them afterwards.
 * Icons are keys the UI maps to lucide icons (features/money/MoneyIcon).
 */
import type { Locale } from "../shared/locales";
import type { MoneyKind } from "../db/schema/money";

type Named = { it: string; en: string };
export type StarterCategory = {
  kind: MoneyKind;
  /** A stable role (money_categories.key), for the food comparison. */
  key?: string;
  name: Named;
  icon: string;
  children?: Named[];
};

const n = (it: string, en: string): Named => ({ it, en });

export const STARTER_CATEGORIES: StarterCategory[] = [
  {
    kind: "expense",
    key: "groceries",
    name: n("Spesa alimentare", "Groceries"),
    icon: "cart",
    children: [
      n("Supermercato", "Supermarket"),
      n("Mercato e negozi", "Market and shops"),
    ],
  },
  {
    kind: "expense",
    key: "eating_out",
    name: n("Ristoranti e bar", "Eating out"),
    icon: "utensils",
    children: [
      n("Ristorante", "Restaurant"),
      n("Bar e caffè", "Bar and coffee"),
      n("Asporto e consegne", "Takeaway and delivery"),
    ],
  },
  {
    kind: "expense",
    name: n("Casa", "Home"),
    icon: "home",
    children: [
      n("Affitto o mutuo", "Rent or mortgage"),
      n("Luce", "Electricity"),
      n("Gas", "Gas"),
      n("Acqua", "Water"),
      n("Internet e telefono", "Internet and phone"),
      n("Manutenzione e arredo", "Repairs and furniture"),
      n("Pulizia", "Cleaning"),
    ],
  },
  {
    kind: "expense",
    name: n("Trasporti", "Transport"),
    icon: "car",
    children: [
      n("Carburante", "Fuel"),
      n("Mezzi pubblici", "Public transport"),
      n("Manutenzione auto", "Car repairs"),
      n("Assicurazione e bollo", "Insurance and road tax"),
      n("Parcheggi e pedaggi", "Parking and tolls"),
    ],
  },
  {
    kind: "expense",
    name: n("Salute", "Health"),
    icon: "heart",
    children: [
      n("Farmacia", "Pharmacy"),
      n("Visite ed esami", "Doctors and tests"),
      n("Dentista", "Dentist"),
    ],
  },
  {
    kind: "expense",
    name: n("Sport", "Sport"),
    icon: "dumbbell",
    children: [
      n("Palestra", "Gym"),
      n("Integratori", "Supplements"),
      n("Attrezzatura e abbigliamento", "Gear and clothing"),
    ],
  },
  {
    kind: "expense",
    name: n("Abbonamenti", "Subscriptions"),
    icon: "tv",
    children: [n("Streaming", "Streaming"), n("Software e app", "Software and apps")],
  },
  {
    kind: "expense",
    name: n("Svago", "Leisure"),
    icon: "ticket",
    children: [
      n("Uscite", "Going out"),
      n("Hobby", "Hobbies"),
      n("Libri e giochi", "Books and games"),
    ],
  },
  { kind: "expense", name: n("Abbigliamento", "Clothing"), icon: "shirt" },
  { kind: "expense", name: n("Cura della persona", "Personal care"), icon: "sparkles" },
  { kind: "expense", name: n("Istruzione", "Education"), icon: "book" },
  { kind: "expense", name: n("Regali", "Gifts"), icon: "gift" },
  {
    kind: "expense",
    name: n("Viaggi", "Travel"),
    icon: "plane",
    children: [n("Trasporto", "Getting there"), n("Alloggio", "Accommodation")],
  },
  { kind: "expense", name: n("Tasse e commissioni", "Taxes and fees"), icon: "receipt" },
  { kind: "expense", name: n("Animali", "Pets"), icon: "paw" },
  { kind: "expense", name: n("Altro", "Other"), icon: "dots" },
  { kind: "income", name: n("Stipendio", "Salary"), icon: "briefcase" },
  { kind: "income", name: n("Rimborsi", "Refunds"), icon: "undo" },
  { kind: "income", name: n("Vendite", "Sales"), icon: "coins" },
  { kind: "income", name: n("Regali ricevuti", "Gifts received"), icon: "gift" },
  { kind: "income", name: n("Altre entrate", "Other income"), icon: "wallet" },
];

export const nameIn = (x: Named, locale: Locale) => x[locale];
