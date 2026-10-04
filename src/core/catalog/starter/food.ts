/**
 * core/catalog/starter/food.ts — the starter pack's spices, herbs,
 * condiments, sauces and toppings, and a few sauces and toppings made from
 * them (ADR-0034).
 * Values per 100 g (100 ml for liquids marked ml), as on a European label:
 * carbs are the available ones, fibre apart. Averages from USDA FoodData
 * Central (SR Legacy) and the CREA tables, rounded; for packaged sauces,
 * typical labels. Anyone can correct them from the ingredient's page.
 * NOVA: 1 fresh or minimally processed, 2 culinary ingredients (oil, salt,
 * vinegar, honey), 3 processed, 4 ultra-processed.
 */
import type { PackInput } from "../pack";

type P = Required<Pick<PackInput, "ingredients" | "meals">>;
type Ingredient = P["ingredients"][number];

/** [kcal, protein, carbs, sugars, fat, saturated fat, fibre, salt] */
type Values = [number, number, number, number, number, number, number, number];

const f = (
  name: string,
  description: string,
  v: Values,
  nova: 1 | 2 | 3 | 4,
  origin: "plant" | "animal" | "mixed" = "plant",
  unit: "g" | "ml" = "g",
): Ingredient => {
  const [kcal, protein, carbs, sugars, fat, saturatedFat, fiber, salt] = v.map(String);
  return {
    name,
    description,
    unit,
    kcal: kcal!,
    protein: protein!,
    carbs: carbs!,
    sugars: sugars!,
    fat: fat!,
    saturatedFat: saturatedFat!,
    fiber: fiber!,
    salt: salt!,
    nova,
    origin,
  };
};

/** ADR-0039: a drink or supplement, with its compounds per 100 g/ml. */
const drink = (
  name: string,
  description: string,
  v: Values,
  nova: 1 | 2 | 3 | 4,
  compounds: { caffeineMg?: number; creatineG?: number },
  unit: "g" | "ml" = "ml",
): Ingredient => ({
  ...f(name, description, v, nova, "plant", unit),
  caffeineMg: compounds.caffeineMg === undefined ? null : String(compounds.caffeineMg),
  creatineG: compounds.creatineG === undefined ? null : String(compounds.creatineG),
});

export const STARTER_INGREDIENTS: Ingredient[] = [
  // Drinks and supplements (ADR-0039). Caffeine: EFSA and typical labels;
  // an espresso is ~30 ml with ~60–65 mg, a moka cup ~50 ml with ~65 mg.
  drink(
    "Caffè espresso",
    "Bevanda · ~63 mg di caffeina in una tazzina da 30 ml",
    [2, 0.1, 0, 0, 0.2, 0.1, 0, 0.04],
    1,
    { caffeineMg: 212 },
  ),
  drink(
    "Caffè moka",
    "Bevanda · ~65 mg di caffeina in una tazzina da 50 ml",
    [2, 0.1, 0, 0, 0.1, 0, 0, 0.01],
    1,
    { caffeineMg: 130 },
  ),
  drink(
    "Caffè americano",
    "Bevanda · ~95 mg di caffeina in una tazza da 240 ml",
    [1, 0.1, 0, 0, 0, 0, 0, 0.01],
    1,
    { caffeineMg: 40 },
  ),
  drink(
    "Tè nero",
    "Bevanda · ~50 mg di caffeina in una tazza da 250 ml",
    [1, 0, 0.3, 0, 0, 0, 0, 0.01],
    1,
    { caffeineMg: 20 },
  ),
  drink(
    "Tè verde",
    "Bevanda · ~30 mg di caffeina in una tazza da 250 ml",
    [1, 0.2, 0, 0, 0, 0, 0, 0],
    1,
    { caffeineMg: 12 },
  ),
  drink(
    "Red Bull",
    "Energy drink · 80 mg di caffeina in una lattina da 250 ml",
    [45, 0, 11, 11, 0, 0, 0, 0.1],
    4,
    { caffeineMg: 32 },
  ),
  drink(
    "Red Bull Sugarfree",
    "Energy drink · 80 mg di caffeina in una lattina da 250 ml",
    [3, 0, 0, 0, 0, 0, 0, 0.1],
    4,
    { caffeineMg: 32 },
  ),
  drink(
    "Monster Energy",
    "Energy drink · 160 mg di caffeina in una lattina da 500 ml",
    [47, 0, 11, 11, 0, 0, 0, 0.19],
    4,
    { caffeineMg: 32 },
  ),
  drink(
    "Coca-Cola",
    "Bibita · ~35 mg di caffeina in una lattina da 330 ml",
    [42, 0, 10.6, 10.6, 0, 0, 0, 0],
    4,
    { caffeineMg: 10 },
  ),
  drink(
    "Coca-Cola Zero",
    "Bibita · ~40 mg di caffeina in una lattina da 330 ml",
    [0.2, 0, 0, 0, 0, 0, 0, 0.02],
    4,
    { caffeineMg: 12 },
  ),
  drink(
    "Creatina monoidrato",
    "Integratore · 3–5 g al giorno",
    [0, 0, 0, 0, 0, 0, 0, 0],
    3,
    { creatineG: 100 },
    "g",
  ),
  drink(
    "Pre-workout (caffeina)",
    "Integratore · ~200 mg di caffeina in un misurino da 10 g (controlla l'etichetta)",
    [20, 0, 4, 0, 0, 0, 0, 0.5],
    4,
    { caffeineMg: 2000 },
    "g",
  ),

  // Salt, oil, vinegar: the culinary basics.
  f("Sale fino", "Condimento", [0, 0, 0, 0, 0, 0, 0, 99.8], 2),
  f("Olio extravergine d'oliva", "Condimento", [899, 0, 0, 0, 99.9, 15, 0, 0], 2),
  f("Aceto di vino", "Condimento", [19, 0, 0.3, 0, 0, 0, 0, 0.02], 2, "plant", "ml"),
  f(
    "Aceto balsamico di Modena",
    "Condimento",
    [88, 0.5, 17, 15, 0, 0, 0, 0.06],
    2,
    "plant",
    "ml",
  ),
  f(
    "Succo di limone",
    "Condimento",
    [22, 0.4, 6.9, 2.5, 0.2, 0, 0.3, 0],
    1,
    "plant",
    "ml",
  ),
  // Dried spices.
  f("Pepe nero macinato", "Spezia", [251, 10.4, 38.7, 0.6, 3.3, 1.4, 25.3, 0.05], 1),
  f("Peperoncino secco", "Spezia", [318, 12, 29.4, 10.3, 17.3, 3.3, 27.2, 0.08], 1),
  f("Paprika dolce", "Spezia", [282, 14.1, 19.1, 10.3, 12.9, 2.1, 34.9, 0.17], 1),
  f("Curcuma", "Spezia", [312, 9.7, 44.4, 3.2, 3.3, 1.8, 22.7, 0.07], 1),
  f("Cannella", "Spezia", [247, 4, 27.5, 2.2, 1.2, 0.3, 53.1, 0.03], 1),
  f("Cumino", "Spezia", [375, 17.8, 33.7, 2.3, 22.3, 1.5, 10.5, 0.42], 1),
  f("Curry in polvere", "Spezia", [325, 14.3, 22.6, 2.8, 14, 2.2, 33.2, 0.13], 1),
  f("Noce moscata", "Spezia", [525, 5.8, 28.5, 3, 36.3, 25.9, 20.8, 0.04], 1),
  // Herbs, dried and fresh.
  f("Origano secco", "Erba aromatica", [265, 9, 26.4, 4.1, 4.3, 1.6, 42.5, 0.06], 1),
  f("Timo secco", "Erba aromatica", [276, 9.1, 26.9, 1.7, 7.4, 2.7, 37, 0.14], 1),
  f("Salvia secca", "Erba aromatica", [315, 10.6, 20.4, 1.7, 12.8, 7, 40.3, 0.03], 1),
  f("Basilico fresco", "Erba aromatica", [23, 3.2, 1, 0.3, 0.6, 0, 1.6, 0.01], 1),
  f("Prezzemolo fresco", "Erba aromatica", [36, 3, 3, 0.9, 0.8, 0.1, 3.3, 0.14], 1),
  f("Rosmarino fresco", "Erba aromatica", [131, 3.3, 6.6, 0, 5.9, 2.8, 14.1, 0.07], 1),
  f("Menta fresca", "Erba aromatica", [70, 3.8, 6.9, 0, 0.9, 0.2, 8, 0.08], 1),
  f("Erba cipollina", "Erba aromatica", [30, 3.3, 1.9, 1.9, 0.7, 0.1, 2.5, 0.01], 1),
  // Aromatics.
  f("Aglio", "Aromatico", [149, 6.4, 31, 1, 0.5, 0.1, 2.1, 0.04], 1),
  f("Cipolla", "Aromatico", [40, 1.1, 7.6, 4.2, 0.1, 0, 1.7, 0.01], 1),
  f("Zenzero fresco", "Aromatico", [80, 1.8, 15.8, 1.7, 0.8, 0.2, 2, 0.03], 1),
  // Sauces and condiments.
  f("Passata di pomodoro", "Salsa", [24, 1.3, 4, 3.6, 0.2, 0, 1.3, 0.03], 1),
  f("Salsa di soia", "Salsa", [53, 8.1, 4.9, 0.4, 0.6, 0.1, 0.8, 14.5], 3, "plant", "ml"),
  f("Senape", "Salsa", [66, 3.7, 1.8, 0.9, 3.3, 0.2, 4, 2.8], 3),
  f("Ketchup", "Salsa", [101, 1, 25, 22.8, 0.1, 0, 0.3, 2.3], 4),
  f("Maionese", "Salsa", [680, 1, 0.6, 0.6, 75, 8, 0, 1.5], 4, "mixed"),
  f("Salsa barbecue", "Salsa", [172, 0.8, 40.8, 33.2, 0.6, 0.1, 0.9, 2.6], 4),
  f("Sriracha", "Salsa piccante", [93, 1.9, 19, 15, 0.9, 0.1, 2.2, 6.3], 4),
  f(
    "Tabasco",
    "Salsa piccante",
    [12, 1.3, 0.8, 0.3, 0.4, 0.1, 0.3, 6.6],
    3,
    "plant",
    "ml",
  ),
  f("Pesto alla genovese", "Salsa (vasetto)", [500, 5, 6, 2, 50, 6, 2, 2.8], 3, "mixed"),
  f("Hummus", "Salsa (vasetto)", [166, 7.9, 8.3, 0.3, 9.6, 1.4, 6, 0.95], 3),
  f("Tzatziki", "Salsa (vasetto)", [100, 4, 4, 3.5, 7.5, 4.5, 0.5, 0.8], 3, "mixed"),
  f("Tahina", "Crema di sesamo", [595, 17, 11.9, 0.5, 53.8, 7.5, 9.3, 0.29], 1),
  f("Capperi sotto aceto", "Condimento", [23, 2.4, 1.7, 0.4, 0.9, 0.2, 3.2, 5.3], 3),
  f("Olive nere", "Condimento", [115, 0.8, 3.1, 0, 10.7, 1.4, 3.2, 1.8], 3),
  // Toppings.
  f(
    "Parmigiano Reggiano grattugiato",
    "Topping",
    [392, 33, 0, 0, 28.4, 18.4, 0, 1.6],
    3,
    "animal",
  ),
  f(
    "Yogurt greco 0%",
    "Base per salse",
    [57, 10.3, 3.6, 3.2, 0.4, 0.1, 0, 0.09],
    1,
    "animal",
  ),
  f("Semi di chia", "Topping", [486, 16.5, 7.7, 0, 30.7, 3.3, 34.4, 0.04], 1),
  f("Semi di lino", "Topping", [534, 18.3, 1.6, 1.6, 42.2, 3.7, 27.3, 0.08], 1),
  f("Semi di zucca", "Topping", [559, 30.2, 4.7, 1.4, 49, 8.7, 6, 0.02], 1),
  f("Semi di girasole", "Topping", [584, 20.8, 11.4, 2.6, 51.5, 4.5, 8.6, 0.02], 1),
  f("Mandorle a lamelle", "Topping", [579, 21.2, 9.1, 4.4, 49.9, 3.8, 12.5, 0], 1),
  f("Noci", "Topping", [654, 15.2, 7, 2.6, 65.2, 6.1, 6.7, 0], 1),
  f("Granella di nocciole", "Topping", [628, 15, 7, 4.3, 60.8, 4.5, 9.7, 0], 1),
  f("Cocco rapè", "Topping", [660, 6.9, 7.4, 7.4, 64.5, 57.2, 16.3, 0.09], 1),
  f("Cacao amaro in polvere", "Topping", [389, 22, 11, 0.5, 21, 13, 29, 0.05], 1),
  f("Burro di arachidi 100%", "Topping", [600, 26, 11, 5, 49, 8, 7, 0.02], 1),
  f("Lievito alimentare in scaglie", "Topping", [360, 50, 13, 0, 4, 0.6, 22, 0.1], 3),
  f("Pane grattugiato", "Panatura", [395, 13.4, 67.5, 6.2, 5.3, 1.2, 4.5, 1.8], 3),
  f("Miele", "Dolcificante", [304, 0.3, 82.4, 82.1, 0, 0, 0.2, 0.01], 2, "animal"),
  f("Sciroppo d'acero", "Dolcificante", [260, 0, 67, 60.5, 0.1, 0, 0, 0.03], 2),
];

type Meal = P["meals"][number];
const meal = (name: string, notes: string, items: [string, number][]): Meal => ({
  name,
  notes,
  items: items.map(([ingredient, quantity]) => ({
    ingredient,
    quantity: String(quantity),
  })),
});

/** Sauces and toppings made from the ingredients above (one batch each). */
export const STARTER_MEALS: Meal[] = [
  meal("Vinaigrette al limone", "Per 3–4 insalate. Sbatti tutto in un barattolo.", [
    ["Olio extravergine d'oliva", 30],
    ["Succo di limone", 15],
    ["Senape", 5],
    ["Sale fino", 0.5],
    ["Pepe nero macinato", 0.2],
  ]),
  meal("Salsa yogurt, menta e aglio", "Per carne, verdure grigliate o falafel.", [
    ["Yogurt greco 0%", 150],
    ["Menta fresca", 5],
    ["Aglio", 3],
    ["Succo di limone", 10],
    ["Sale fino", 1],
  ]),
  meal("Pesto di basilico e noci", "Per 4 porzioni di pasta. Frulla a freddo.", [
    ["Basilico fresco", 40],
    ["Olio extravergine d'oliva", 40],
    ["Parmigiano Reggiano grattugiato", 20],
    ["Noci", 15],
    ["Aglio", 2],
    ["Sale fino", 1],
  ]),
  meal("Salsa tahina al limone", "Allunga con acqua fredda fino alla densità che vuoi.", [
    ["Tahina", 30],
    ["Succo di limone", 20],
    ["Aglio", 2],
    ["Sale fino", 0.5],
  ]),
  meal(
    "Sugo di pomodoro e basilico",
    "Per 3 porzioni di pasta. 20 minuti a fuoco basso.",
    [
      ["Passata di pomodoro", 300],
      ["Olio extravergine d'oliva", 10],
      ["Cipolla", 30],
      ["Aglio", 4],
      ["Basilico fresco", 6],
      ["Origano secco", 0.5],
      ["Sale fino", 2],
    ],
  ),
  meal("Salsa soia, zenzero e miele", "Marinata per pollo, tofu o salmone.", [
    ["Salsa di soia", 30],
    ["Zenzero fresco", 10],
    ["Miele", 10],
    ["Aglio", 3],
    ["Succo di limone", 10],
  ]),
  meal("Gremolata", "Trita fine: su carne, pesce o legumi a fine cottura.", [
    ["Prezzemolo fresco", 20],
    ["Aglio", 3],
    ["Olio extravergine d'oliva", 10],
    ["Succo di limone", 5],
  ]),
  meal("Olio aromatico rosmarino e peperoncino", "Scalda piano e lascia in infusione.", [
    ["Olio extravergine d'oliva", 30],
    ["Rosmarino fresco", 3],
    ["Aglio", 4],
    ["Peperoncino secco", 0.5],
  ]),
  meal("Salsa piccante allo yogurt", "Per bowl, wrap e patate al forno.", [
    ["Yogurt greco 0%", 150],
    ["Sriracha", 15],
    ["Succo di limone", 5],
    ["Sale fino", 0.5],
  ]),
  meal("Mix croccante di semi", "Un cucchiaio (10 g) su yogurt, insalate o zuppe.", [
    ["Semi di zucca", 20],
    ["Semi di girasole", 20],
    ["Semi di lino", 10],
    ["Semi di chia", 10],
  ]),
  meal("Crema di yogurt al cacao", "Topping per colazione, o merenda da sola.", [
    ["Yogurt greco 0%", 150],
    ["Cacao amaro in polvere", 5],
    ["Miele", 10],
    ["Cannella", 1],
  ]),
  meal(
    "Panatura croccante alle erbe",
    "Per 2 porzioni di pesce, pollo o verdure al forno.",
    [
      ["Pane grattugiato", 50],
      ["Parmigiano Reggiano grattugiato", 20],
      ["Prezzemolo fresco", 10],
      ["Aglio", 2],
      ["Olio extravergine d'oliva", 10],
      ["Sale fino", 1],
    ],
  ),
];
