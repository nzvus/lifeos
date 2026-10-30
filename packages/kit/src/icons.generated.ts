/**
 * icons.generated.ts — the Glyph registry (docs/spec/v2/icons.md), copied
 * from the design boards' ICONS block, which boards-tools/icons_build.py
 * builds from icons.json and Tabler Icons 3.19.0 (MIT, (c) Paweł Kuna).
 * Do not edit by hand: change icons.json, run icons_build.py with the kit's path.
 */
import type { IconRegistry } from "./glyph";

export const ICONS: IconRegistry = {
  places: {
    oggi: ["Oggi", "sun"],
    piano: ["Piano", "calendar-week"],
    aggiungi: ["Aggiungi", "circle-plus"],
    andamento: ["Andamento", "trending-up"],
    libreria: ["Libreria", "books"],
    impostazioni: ["Impostazioni", "settings"],
  },
  domains: {
    food: {
      label: "Cibo",
      glyph: "tools-kitchen-2",
      kinds: {
        meal: ["Pasto", "tools-kitchen-2"],
        ingredient: ["Ingrediente", "apple"],
        product: ["Prodotto", "barcode"],
        recipe: ["Ricetta", "chef-hat"],
        breakfast: ["Colazione", "meal-breakfast"],
        lunch: ["Pranzo", "meal-lunch"],
        snack: ["Spuntino", "meal-snack"],
        dinner: ["Cena", "meal-dinner"],
      },
    },
    drink: {
      label: "Bere",
      glyph: "droplet",
      kinds: {
        water: ["Acqua", "bottle"],
        coffee: ["Caffè", "coffee"],
        supplement: ["Integratore", "pill"],
      },
    },
    train: {
      label: "Allenamento",
      glyph: "barbell",
      kinds: {
        session: ["Sessione", "barbell"],
        exercise: ["Esercizio", "weight"],
        cardio: ["Cardio", "run"],
        steps: ["Passi", "walk"],
        mobility: ["Mobilità", "stretching"],
        cycle: ["Ciclo", "refresh"],
      },
    },
    sleep: {
      label: "Sonno",
      glyph: "moon",
      kinds: {
        sleep: ["Notte", "bed"],
        nap: ["Pisolino", "zzz"],
        wake: ["Sveglia", "sunrise"],
        bed: ["A letto", "moon-stars"],
      },
    },
    body: {
      label: "Corpo",
      glyph: "body-scan",
      kinds: {
        weight: ["Pesata", "scale-outline"],
        measure: ["Misure", "ruler-measure"],
        vitals: ["Pressione e battito", "heartbeat"],
      },
    },
    mind: {
      label: "Mente",
      glyph: "brain",
      kinds: {
        checkin: ["Check-in", "mood-smile"],
        journal: ["Diario", "notes"],
        study: ["Studio", "school"],
        reading: ["Lettura", "book"],
        meditation: ["Meditazione", "yoga"],
      },
    },
    money: {
      label: "Soldi",
      glyph: "wallet",
      kinds: {
        movement: ["Movimento", "arrows-exchange"],
        receipt: ["Scontrino", "receipt"],
        budget: ["Budget", "chart-donut"],
        account: ["Conto", "building-bank"],
      },
    },
    pantry: {
      label: "Dispensa",
      glyph: "basket",
      kinds: {
        stock: ["Scorta", "package"],
        shopping: ["Da comprare", "shopping-cart"],
        batch: ["Lotto cucinato", "cooker"],
      },
    },
    habit: {
      label: "Abitudini",
      glyph: "calendar-repeat",
      kinds: {
        habit: ["Abitudine", "calendar-repeat"],
        streak: ["Serie", "flame"],
      },
    },
    goal: {
      label: "Obiettivi",
      glyph: "target",
      kinds: {
        goal: ["Obiettivo", "target"],
        arrival: ["Arrivo", "flag"],
      },
    },
    day: {
      label: "Tempo",
      glyph: "calendar-event",
      kinds: {
        day: ["Giorno", "calendar-event"],
        week: ["Settimana", "calendar-week"],
        month: ["Mese", "calendar-month"],
        model: ["Modello", "template"],
        cycle: ["Ciclo", "refresh"],
        rest: ["Riposo", "armchair"],
      },
    },
    catalog: {
      label: "Libreria",
      glyph: "books",
      kinds: {
        types: ["Tipi di tracker", "adjustments-horizontal"],
      },
    },
    settings: {
      label: "Impostazioni",
      glyph: "settings",
      kinds: {
        account: ["Account", "user"],
        data: ["Dati", "database-export"],
        trash: ["Cestino", "trash"],
      },
    },
    env: {
      label: "Ambiente",
      glyph: "cloud",
      kinds: {
        weather: ["Meteo", "cloud"],
        place: ["Luogo", "map-pin"],
        temp: ["Temperatura", "temperature"],
        humidity: ["Umidità", "droplet-half-2"],
        air: ["Aria", "wind"],
        light: ["Luce", "haze"],
      },
    },
    work: {
      label: "Lavoro e tempo",
      glyph: "briefcase",
      kinds: {
        work: ["Lavoro", "briefcase"],
      },
    },
  },
  foodGroups: {
    meat: ["Carne", "meat"],
    fish: ["Pesce", "fish"],
    eggs: ["Uova", "egg"],
    dairy: [
      "Latte e latticini",
      "milk",
      {
        cheese: "cheese",
        yogurt: "bowl-spoon",
      },
    ],
    legumes: ["Legumi", "legume"],
    soy: ["Soia", "seeding"],
    grains_whole: ["Cereali integrali", "grain"],
    grains_refined: ["Cereali raffinati", "bread"],
    tubers: ["Tuberi", "potato"],
    veg: [
      "Verdura",
      "carrot",
      {
        mushroom: "mushroom",
        pepper: "pepper",
        leafy: "salad",
      },
    ],
    fruit: [
      "Frutta",
      "apple",
      {
        lemon: "lemon",
        berries: "cherry",
        melon: "melon",
      },
    ],
    nuts: ["Frutta secca e semi", "nut"],
    oils: ["Oli e grassi", "droplet-half"],
    sweets: [
      "Dolci e dolcificanti",
      "candy",
      {
        cookie: "cookie",
        dessert: "ice-cream",
      },
    ],
    drinks: [
      "Bevande",
      "cup",
      {
        coffee: "coffee",
        bottle: "bottle",
        water: "bottle",
      },
    ],
    supplements: [
      "Integratori",
      "pill",
      {
        powder: "flask",
      },
    ],
    herbs: [
      "Erbe e spezie",
      "leaf",
      {
        spice: "salt",
      },
    ],
    sauces: ["Salse e condimenti", "sauce"],
  },
  movements: {
    horizontal_press: "press",
    incline_press: "incline",
    fly: "fly",
    dip: "dip",
    vertical_press: "overhead",
    lateral_raise: "raise",
    rear_fly: "rearfly",
    face_pull: "facepull",
    vertical_pull: "pulldown",
    horizontal_pull: "row",
    squat: "squat",
    lunge: "lunge",
    leg_press: "legpress",
    incline_leg_press: "legpressinc",
    leg_extension: "legext",
    leg_curl: "legcurl",
    seated_leg_curl: "legcurlseat",
    hinge: "hinge",
    hip_thrust: "thrust",
    calf_raise: "calf",
    curl: "curl",
    preacher_curl: "preacher",
    triceps_extension: "pushdown",
    overhead_extension: "tricepsup",
    crunch: "crunch",
    twist: "twist",
    plank: "plank",
    leg_raise: "legraise",
    run: "run",
    bike: "bike",
    walk: "walk",
    swim: "swimming",
    rope: "rope",
    rower: "rower",
    elliptical: "elliptical",
    treadmill: "treadmill",
  },
  marks: {
    equipment: {
      bilanciere: ["Bilanciere", "mbar"],
      manubri: ["Manubri", "mdb"],
      cavi: ["Cavi", "mcable"],
      macchina: ["Macchina", "mmachine"],
      sbarra: ["Sbarra", "mpullbar"],
      parallele: ["Parallele", "mparallel"],
    },
    state: {
      frozen: ["Surgelato", "snowflake"],
      protein: ["Proteico", "mprot"],
      canned: ["In scatola o vasetto", "mcan"],
    },
  },
  tags: {
    extends: ["Estende", "git-branch"],
    composed: ["Composto", "stack-2"],
    cycle: ["Ciclo", "refresh"],
    bound: ["Legato a", "link"],
    recur: ["Ricorrenza", "calendar-repeat"],
    inherited: ["Dalla base", "arrow-down-to-arc"],
    local: ["Solo qui", "pencil-plus"],
    source: ["Fonte", "database"],
    estimate: ["Stima", "sparkles"],
    check: ["Da confermare", "alert-triangle"],
    done: ["Fatto", "check"],
    edited: ["Modificato", "pencil"],
    time: ["Orario", "clock"],
    protein: ["Proteine", "mprot"],
    energy: ["Energia", "bolt"],
    removed: ["Tolto", "minus"],
  },
  dishes: {
    ice_cream: ["Gelato", "ice-cream"],
    porridge: ["Porridge", "bowl-spoon"],
    sandwich: ["Panino", "baguette"],
    first_course: ["Primo", "bowl"],
    salad: ["Insalata", "salad"],
    soup: ["Zuppa", "soup"],
    pizza: ["Pizza", "pizza"],
  },
  movementLabels: {
    horizontal_press: "Spinta orizzontale",
    incline_press: "Spinta inclinata",
    fly: "Croci",
    dip: "Dip",
    vertical_press: "Spinta sopra la testa",
    lateral_raise: "Alzate laterali",
    rear_fly: "Aperture posteriori",
    face_pull: "Face pull",
    vertical_pull: "Trazione verticale",
    horizontal_pull: "Rematore",
    squat: "Squat",
    lunge: "Affondo",
    leg_press: "Pressa",
    incline_leg_press: "Pressa inclinata",
    leg_extension: "Estensione gambe",
    leg_curl: "Flessione gambe",
    seated_leg_curl: "Flessione da seduto",
    hinge: "Stacco",
    hip_thrust: "Spinta d'anca",
    calf_raise: "Polpacci",
    curl: "Curl",
    preacher_curl: "Curl alla panca",
    triceps_extension: "Push-down",
    overhead_extension: "Estensioni sopra la testa",
    crunch: "Crunch",
    twist: "Rotazioni",
    plank: "Plank",
    leg_raise: "Gambe alla sbarra",
    run: "Corsa",
    bike: "Bici",
    walk: "Camminata",
    swim: "Nuoto",
    rope: "Corda",
    rower: "Vogatore",
    elliptical: "Ellittica",
    treadmill: "Tapis roulant",
  },
  nutrients: {
    kcal: ["Energia", "nkcal"],
    protein: ["Proteine", "nprotein"],
    carbs: ["Carboidrati", "ncarbs"],
    fat: ["Grassi", "nfat"],
    fiber: ["Fibre", "nfiber"],
    sugars: ["Zuccheri", "nsugars"],
    sat: ["Grassi saturi", "nsat"],
    salt: ["Sale", "nsalt"],
    micro: ["Vitamine e minerali", "nmicro"],
  },
  controls: {
    back: ["Indietro", "chevron-left"],
    more: ["Altro", "dots"],
    search: ["Cerca", "search"],
    close: ["Chiudi", "x"],
    add: ["Aggiungi", "plus"],
    sort: ["Ordina", "arrows-sort"],
    edit: ["Modifica", "pencil"],
    delete: ["Elimina", "trash"],
    time: ["Orari", "clock"],
    settings: ["Impostazioni", "settings"],
    done: ["Fatto", "check"],
    scan: ["Codice a barre", "barcode"],
    photo: ["Foto", "camera"],
    filter: ["Filtra", "filter"],
    swap: ["Sostituisci", "arrows-exchange"],
    move: ["Sposta", "arrows-move-vertical"],
    copy: ["Copia", "copy"],
    link: ["Apri", "chevron-right"],
    lock: ["Bloccato", "lock"],
    theme: ["Tema", "palette"],
    eye: ["Escludi", "eye-off"],
    refresh: ["Aggiorna", "reload"],
    star: ["Preferito", "star"],
  },
  sections: {
    identity: ["Nome e codici", "barcode"],
    values: ["Valori per 100 g", "list-numbers"],
    products: ["Prodotti e formati", "package"],
    kinds: ["Tipi di ogni macro", "category"],
    micros: ["Vitamine e minerali", "nmicro"],
    sources: ["Fonti", "database"],
    preview: ["Anteprima", "eye"],
    usedIn: ["Dove è usato", "sitemap"],
  },
  g: {
    "adjustments-horizontal":
      "M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M4 6l8 0M16 6l4 0M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M4 12l2 0M10 12l10 0M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M4 18l11 0M19 18l1 0",
    "alert-triangle":
      "M12 9v4M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0zM12 16h.01",
    apple:
      "M4 11.319c0 3.102 .444 5.319 2.222 7.978c1.351 1.797 3.156 2.247 5.08 .988c.426 -.268 .97 -.268 1.397 0c1.923 1.26 3.728 .809 5.079 -.988c1.778 -2.66 2.222 -4.876 2.222 -7.977c0 -2.661 -1.99 -5.32 -4.444 -5.32c-1.267 0 -2.41 .693 -3.22 1.44a.5 .5 0 0 1 -.672 0c-.809 -.746 -1.953 -1.44 -3.22 -1.44c-2.454 0 -4.444 2.66 -4.444 5.319M7 12c0 -1.47 .454 -2.34 1.5 -3M12 7c0 -1.2 .867 -4 3 -4",
    armchair:
      "M5 11a2 2 0 0 1 2 2v2h10v-2a2 2 0 1 1 4 0v4a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2zM5 11v-5a3 3 0 0 1 3 -3h8a3 3 0 0 1 3 3v5M6 19v2M18 19v2",
    "arrow-down-to-arc": "M12 3v12M16 11l-4 4l-4 -4M3 12a9 9 0 0 0 18 0",
    "arrows-exchange": "M7 10h14l-4 -4M17 14h-14l4 4",
    "arrows-move-vertical": "M9 18l3 3l3 -3M12 15v6M15 6l-3 -3l-3 3M12 3v6",
    "arrows-sort": "M3 9l4 -4l4 4m-4 -4v14M21 15l-4 4l-4 -4m4 4v-14",
    baguette:
      "M5.628 11.283l5.644 -5.637c2.665 -2.663 5.924 -3.747 8.663 -1.205l.188 .181a2.987 2.987 0 0 1 0 4.228l-11.287 11.274a3 3 0 0 1 -4.089 .135l-.143 -.135c-2.728 -2.724 -1.704 -6.117 1.024 -8.841zM9.5 7.5l1.5 3.5M6.5 10.5l1.5 3.5M12.5 4.5l1.5 3.5",
    barbell:
      "M2 12h1M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1zM9 12h6M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1zM18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2M22 12h-1",
    barcode:
      "M4 7v-1a2 2 0 0 1 2 -2h2M4 17v1a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v1M16 20h2a2 2 0 0 0 2 -2v-1M5 11h1v2h-1zM10 11l0 2M14 11h1v2h-1zM19 11l0 2",
    basket:
      "M10 14a2 2 0 1 0 4 0a2 2 0 0 0 -4 0M5.001 8h13.999a2 2 0 0 1 1.977 2.304l-1.255 7.152a3 3 0 0 1 -2.966 2.544h-9.512a3 3 0 0 1 -2.965 -2.544l-1.255 -7.152a2 2 0 0 1 1.977 -2.304zM17 10l-2 -6M7 10l2 -6",
    bed: "M7 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M22 17v-3h-20M2 8v9M12 14h10v-2a3 3 0 0 0 -3 -3h-7v5z",
    bike: "M5 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M19 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M12 19l0 -4l-3 -3l5 -4l2 3l3 0M17 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
    "body-scan":
      "M4 8v-2a2 2 0 0 1 2 -2h2M4 16v2a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v2M16 20h2a2 2 0 0 0 2 -2v-2M12 8m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M10 17v-1a2 2 0 1 1 4 0v1M8 10c.666 .666 1.334 1 2 1h4c.666 0 1.334 -.334 2 -1M12 11v3",
    bolt: "M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11",
    book: "M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0M3 6l0 13M12 6l0 13M21 6l0 13",
    books:
      "M5 4m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1zM9 4m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1zM5 8h4M9 16h4M13.803 4.56l2.184 -.53c.562 -.135 1.133 .19 1.282 .732l3.695 13.418a1.02 1.02 0 0 1 -.634 1.219l-.133 .041l-2.184 .53c-.562 .135 -1.133 -.19 -1.282 -.732l-3.695 -13.418a1.02 1.02 0 0 1 .634 -1.219l.133 -.041zM14 9l4 -1M16 16l3.923 -.98",
    bottle:
      "M10 5h4v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2zM14 3.5c0 1.626 .507 3.212 1.45 4.537l.05 .07a8.093 8.093 0 0 1 1.5 4.694v6.199a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6.2c0 -1.682 .524 -3.322 1.5 -4.693l.05 -.07a7.823 7.823 0 0 0 1.45 -4.537M7 14.803a2.4 2.4 0 0 0 1 -.803a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 1 -.805",
    bowl: "M4 8h16a1 1 0 0 1 1 1v.5c0 1.5 -2.517 5.573 -4 6.5v1a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-1c-1.687 -1.054 -4 -5 -4 -6.5v-.5a1 1 0 0 1 1 -1z",
    "bowl-spoon":
      "M4 11h16a1 1 0 0 1 1 1v.5c0 1.5 -2.517 5.573 -4 6.5v1a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-1c-1.687 -1.054 -4 -5 -4 -6.5v-.5a1 1 0 0 1 1 -1zM8 7c1.657 0 3 -.895 3 -2s-1.343 -2 -3 -2s-3 .895 -3 2s1.343 2 3 2M11 5h9",
    brain:
      "M15.5 13a3.5 3.5 0 0 0 -3.5 3.5v1a3.5 3.5 0 0 0 7 0v-1.8M8.5 13a3.5 3.5 0 0 1 3.5 3.5v1a3.5 3.5 0 0 1 -7 0v-1.8M17.5 16a3.5 3.5 0 0 0 0 -7h-.5M19 9.3v-2.8a3.5 3.5 0 0 0 -7 0M6.5 16a3.5 3.5 0 0 1 0 -7h.5M5 9.3v-2.8a3.5 3.5 0 0 1 7 0v10",
    bread:
      "M18 4a3 3 0 0 1 2 5.235v8.765a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-8.764a3 3 0 0 1 1.824 -5.231h12.176v-.005z",
    briefcase:
      "M3 7m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2zM8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2M12 12l0 .01M3 13a20 20 0 0 0 18 0",
    "building-bank":
      "M3 21l18 0M3 10l18 0M5 6l7 -3l7 3M4 10l0 11M20 10l0 11M8 14l0 3M12 14l0 3M16 14l0 3",
    "calendar-event":
      "M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2zM16 3l0 4M8 3l0 4M4 11l16 0M8 15h2v2h-2z",
    "calendar-month":
      "M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12zM16 3v4M8 3v4M4 11h16M7 14h.013M10.01 14h.005M13.01 14h.005M16.015 14h.005M13.015 17h.005M7.01 17h.005M10.01 17h.005",
    "calendar-repeat":
      "M12.5 21h-6.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v3M16 3v4M8 3v4M4 11h12M20 14l2 2h-3M20 18l2 -2M19 16a3 3 0 1 0 2 5.236",
    "calendar-week":
      "M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12zM16 3v4M8 3v4M4 11h16M8 14v4M12 14v4M16 14v4",
    calf: "M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 8v8M9 22l3-6 3 6M8 22h2M14 22h2M6 11h12",
    camera:
      "M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0",
    candy:
      "M7.05 11.293l4.243 -4.243a2 2 0 0 1 2.828 0l2.829 2.83a2 2 0 0 1 0 2.828l-4.243 4.243a2 2 0 0 1 -2.828 0l-2.829 -2.831a2 2 0 0 1 0 -2.828zM16.243 9.172l3.086 -.772a1.5 1.5 0 0 0 .697 -2.516l-2.216 -2.217a1.5 1.5 0 0 0 -2.44 .47l-1.248 2.913M9.172 16.243l-.772 3.086a1.5 1.5 0 0 1 -2.516 .697l-2.217 -2.216a1.5 1.5 0 0 1 .47 -2.44l2.913 -1.248",
    carrot:
      "M3 21s9.834 -3.489 12.684 -6.34a4.487 4.487 0 0 0 0 -6.344a4.483 4.483 0 0 0 -6.342 0c-2.86 2.861 -6.347 12.689 -6.347 12.689zM9 13l-1.5 -1.5M16 14l-2 -2M22 8s-1.14 -2 -3 -2c-1.406 0 -3 2 -3 2s1.14 2 3 2s3 -2 3 -2zM16 2s-2 1.14 -2 3s2 3 2 3s2 -1.577 2 -3c0 -1.86 -2 -3 -2 -3z",
    category:
      "M4 4h6v6h-6zM14 4h6v6h-6zM4 14h6v6h-6zM17 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
    "chart-donut":
      "M10 3.2a9 9 0 1 0 10.8 10.8a1 1 0 0 0 -1 -1h-3.8a4.1 4.1 0 1 1 -5 -5v-4a.9 .9 0 0 0 -1 -.8M15 3.5a9 9 0 0 1 5.5 5.5h-4.5a9 9 0 0 0 -1 -1v-4.5",
    check: "M5 12l5 5l10 -10",
    cheese:
      "M4.519 20.008l16.481 -.008v-3.5a2 2 0 1 1 0 -4v-3.5h-16.722M21 9l-9.385 -4.992c-2.512 .12 -4.758 1.42 -6.327 3.425c-1.423 1.82 -2.288 4.221 -2.288 6.854c0 2.117 .56 4.085 1.519 5.721M15 13v.01M8 13v.01M11 16v.01",
    "chef-hat":
      "M12 3c1.918 0 3.52 1.35 3.91 3.151a4 4 0 0 1 2.09 7.723l0 7.126h-12v-7.126a4 4 0 1 1 2.092 -7.723a4 4 0 0 1 3.908 -3.151zM6.161 17.009l11.839 -.009",
    cherry:
      "M7.5 16.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0M17 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M9 13c.366 -2 1.866 -3.873 4.5 -5.6M17 15c-1.333 -2.333 -2.333 -5.333 -1 -9M5 6c3.667 -2.667 7.333 -2.667 11 0c-3.667 2.667 -7.333 2.667 -11 0",
    "chevron-left": "M15 6l-6 6l6 6",
    "chevron-right": "M9 6l6 6l-6 6",
    "circle-plus": "M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0M9 12h6M12 9v6",
    clock: "M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0M12 7v5l3 3",
    cloud:
      "M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878",
    coffee:
      "M3 14c.83 .642 2.077 1.017 3.5 1c1.423 .017 2.67 -.358 3.5 -1c.83 -.642 2.077 -1.017 3.5 -1c1.423 -.017 2.67 .358 3.5 1M8 3a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2M12 3a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2M3 10h14v5a6 6 0 0 1 -6 6h-2a6 6 0 0 1 -6 -6v-5zM16.746 16.726a3 3 0 1 0 .252 -5.555",
    cooker:
      "M12 7h.01M15 7h.01M9 7h.01M5 3m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2zM9 15h6M5 11h14",
    cookie:
      "M8 13v.01M12 17v.01M12 12v.01M16 14v.01M11 8v.01M13.148 3.476l2.667 1.104a4 4 0 0 0 4.656 6.14l.053 .132a3 3 0 0 1 0 2.296q -.745 1.18 -1.024 1.852q -.283 .684 -.66 2.216a3 3 0 0 1 -1.624 1.623q -1.572 .394 -2.216 .661q -.712 .295 -1.852 1.024a3 3 0 0 1 -2.296 0q -1.203 -.754 -1.852 -1.024q -.707 -.292 -2.216 -.66a3 3 0 0 1 -1.623 -1.624q -.397 -1.577 -.661 -2.216q -.298 -.718 -1.024 -1.852a3 3 0 0 1 0 -2.296q .719 -1.116 1.024 -1.852q .257 -.62 .66 -2.216a3 3 0 0 1 1.624 -1.623q 1.547 -.384 2.216 -.661q .687 -.285 1.852 -1.024a3 3 0 0 1 2.296 0",
    copy: "M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667zM4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1",
    crunch: "M3 20h18M6 20l3-6 6-2M17 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 14l5 3",
    cup: "M5 11h14v-3h-14zM17.5 11l-1.5 10h-8l-1.5 -10M6 8v-1a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v1M15 5v-2",
    curl: "M5 22v-6a6 6 0 0 1 6-6h2M13 10l-1-4a2 2 0 0 1 4-1l1 4a6 6 0 0 1-2 6M5 22h10a3 3 0 0 0 3-3v-2",
    database:
      "M12 6m-8 0a8 3 0 1 0 16 0a8 3 0 1 0 -16 0M4 6v6a8 3 0 0 0 16 0v-6M4 12v6a8 3 0 0 0 16 0v-6",
    "database-export":
      "M4 6c0 1.657 3.582 3 8 3s8 -1.343 8 -3s-3.582 -3 -8 -3s-8 1.343 -8 3M4 6v6c0 1.657 3.582 3 8 3c1.118 0 2.183 -.086 3.15 -.241M20 12v-6M4 12v6c0 1.657 3.582 3 8 3c.157 0 .312 -.002 .466 -.005M16 19h6M19 16l3 3l-3 3",
    dip: "M3 10h6M15 10h6M8 10v12M16 10v12M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM10 10v7M14 10v7M10 17h4",
    dots: "M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
    droplet:
      "M7.502 19.423c2.602 2.105 6.395 2.105 8.996 0c2.602 -2.105 3.262 -5.708 1.566 -8.546l-4.89 -7.26c-.42 -.625 -1.287 -.803 -1.936 -.397a1.376 1.376 0 0 0 -.41 .397l-4.893 7.26c-1.695 2.838 -1.035 6.441 1.567 8.546z",
    "droplet-half":
      "M7.502 19.423c2.602 2.105 6.395 2.105 8.996 0c2.602 -2.105 3.262 -5.708 1.566 -8.546l-4.89 -7.26c-.42 -.625 -1.287 -.803 -1.936 -.397a1.376 1.376 0 0 0 -.41 .397l-4.893 7.26c-1.695 2.838 -1.035 6.441 1.567 8.546zM12 3v18",
    "droplet-half-2":
      "M7.502 19.423c2.602 2.105 6.395 2.105 8.996 0c2.602 -2.105 3.262 -5.708 1.566 -8.546l-4.89 -7.26c-.42 -.625 -1.287 -.803 -1.936 -.397a1.376 1.376 0 0 0 -.41 .397l-4.893 7.26c-1.695 2.838 -1.035 6.441 1.567 8.546zM5 14h14",
    egg: "M19 14.083c0 4.154 -2.966 6.74 -7 6.917c-4.2 0 -7 -2.763 -7 -6.917c0 -5.538 3.5 -11.09 7 -11.083c3.5 .007 7 5.545 7 11.083z",
    elliptical:
      "M4 21h16M7 21l3-11M17 21l-3-11M10 10h4M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 15h10",
    eye: "M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6",
    "eye-off":
      "M10.585 10.587a2 2 0 0 0 2.829 2.828M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87M3 3l18 18",
    facepull:
      "M21 4v16M21 8l-8 2M12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 7l3 1M9 13l3-1M7 9v4M10 15v7",
    filter:
      "M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z",
    fish: "M16.69 7.44a6.973 6.973 0 0 0 -1.69 4.56c0 1.747 .64 3.345 1.699 4.571M2 9.504c7.715 8.647 14.75 10.265 20 2.498c-5.25 -7.761 -12.285 -6.142 -20 2.504M18 11v.01M11.5 10.5c-.667 1 -.667 2 0 3",
    flag: "M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9zM5 21v-7",
    flame:
      "M12 12c2 -2.96 0 -7 -1 -8c0 3.038 -1.773 4.741 -3 6c-1.226 1.26 -2 3.24 -2 5a6 6 0 1 0 12 0c0 -1.532 -1.056 -3.94 -2 -5c-1.786 3 -2.791 3 -4 2z",
    flask:
      "M9 3l6 0M10 9l4 0M10 3v6l-4 11a.7 .7 0 0 0 .5 1h11a.7 .7 0 0 0 .5 -1l-4 -11v-6",
    fly: "M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3 7c2 3 5 4 7 4M21 7c-2 3-5 4-7 4M10 11h4v10h-4ZM2 5v4M22 5v4",
    "git-branch":
      "M7 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M7 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M17 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M7 8l0 8M9 18h6a2 2 0 0 0 2 -2v-5M14 14l3 -3l3 3",
    grain:
      "M4.5 9.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M9.5 4.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M9.5 14.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M4.5 19.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M14.5 9.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M19.5 4.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M14.5 19.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M19.5 14.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
    haze: "M3 12h1M12 3v1M20 12h1M5.6 5.6l.7 .7M18.4 5.6l-.7 .7M8 12a4 4 0 1 1 8 0M3 16h18M3 20h18",
    heartbeat:
      "M19.5 13.572l-7.5 7.428l-2.896 -2.868m-6.117 -8.104a5 5 0 0 1 9.013 -3.022a5 5 0 1 1 7.5 6.572M3 13h2l2 3l2 -6l1 3h3",
    hinge:
      "M17 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM15 7 7 11M13 8l-1 6 1 8M3 18h18M4 16v4M20 16v4M9 10v8",
    "ice-cream":
      "M12 21.5v-4.5M8 17h8v-10a4 4 0 1 0 -8 0v10zM8 10.5l8 -3.5M8 14.5l8 -3.5",
    incline: "M4 21 18 9M18 9l2 2M14 6v6M10 4h12M12 2.5v3M20 2.5v3M7 18v3",
    leaf: "M5 21c.5 -4.5 2.5 -8 7 -10M9 18c6.218 0 10.5 -3.288 11 -12v-2h-4.014c-9 0 -11.986 4 -12 9c0 1 0 3 2 5h3z",
    legcurl: "M2 13h16M4 13v7M16 13v7M5 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 10h8l4-6",
    legcurlseat: "M5 3v12h8l-2 6M5 15v6M3 21h10M13 15h4M17 13v4",
    legext: "M4 3v13h8l8-5M4 16v5M12 16v5M2 21h12M19 8l2 4",
    legpress: "M3 21h18M4 21v-8h6l4 4M14 17l5-5M17 9l5 5M7 11a2 2 0 1 0 0-4",
    legpressinc: "M3 21h18M4 21l2-8 6 2M12 15l4-6M14 6l6 4M8 11a2 2 0 1 0 0-4",
    legraise: "M3 3h18M9 3v9M15 3v9M12 14a2 2 0 1 0 0-4M12 14v3l7-1",
    legume:
      "M7 17c-3-3-3-8 1-11 2-1.5 5-2 8-1 1 3 .5 6-1 8-3 4-8 4-11 1ZM9 9a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M12.5 12.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M16 5l3-2",
    lemon:
      "M17.536 3.393c3.905 3.906 3.905 10.237 0 14.143c-3.906 3.905 -10.237 3.905 -14.143 0l14.143 -14.143M5.868 15.06a6.5 6.5 0 0 0 9.193 -9.192M10.464 10.464l4.597 4.597M10.464 10.464v6.364M10.464 10.464h6.364",
    link: "M9 15l6 -6M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463",
    "list-numbers":
      "M11 6h9M11 12h9M12 18h8M4 16a2 2 0 1 1 4 0c0 .591 -.5 1 -1 1.5l-3 2.5h4M6 10v-6l-2 2",
    lock: "M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6zM11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0M8 11v-4a4 4 0 1 1 8 0v4",
    lunge:
      "M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 7v7M12 14l-5 2v6M12 14l5 1v7M8 9v4M16 9v4",
    "map-pin":
      "M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z",
    mbar: "M2 12h20M6 6v12M18 6v12",
    mcable: "M6 3h12M12 3v11M9 17a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
    mcan: "M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3v12c0 1.7-3.1 3-7 3s-7-1.3-7-3ZM5 6c0 1.7 3.1 3 7 3s7-1.3 7-3",
    mdb: "M8 12h8M6 8v8M18 8v8M3 10v4M21 10v4",
    "meal-breakfast":
      "M5 9h11v4a5 5 0 0 1 -5 5h-1a5 5 0 0 1 -5 -5zM16 10h1.5a2.5 2.5 0 0 1 0 5h-1.8M3 21h16M9 3.5c-.6 .8 -.6 1.7 0 2.5M12.5 3.5c-.6 .8 -.6 1.7 0 2.5",
    "meal-dinner":
      "M3 13h18M4 13a8 5.5 0 0 0 16 0M7.5 18.6h9M18.5 3.2a3.6 3.6 0 1 0 2.8 5.6a2.8 2.8 0 0 1 -2.8 -5.6z",
    "meal-lunch":
      "M13 12m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0M13 12m-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0 -6.4 0M3 4v5a1 1 0 0 0 1 1M5 4v5a1 1 0 0 1 -1 1v10M21.5 4c-1 1 -1.5 3 -1.5 6h1.5v10",
    "meal-snack":
      "M19.6 9.8a8.5 8.5 0 1 1 -5.4 -6.4a2.6 2.6 0 0 0 2.3 3.6a2.6 2.6 0 0 0 3.1 2.8zM9 10v.01M12 15v.01M8 15.5v.01M14.5 11v.01",
    meat: "M13.62 8.382l1.966 -1.967a2 2 0 1 1 3.414 -1.415a2 2 0 1 1 -1.413 3.414l-1.82 1.821M5.904 18.596c2.733 2.734 5.9 4 7.07 2.829c1.172 -1.172 -.094 -4.338 -2.828 -7.071c-2.733 -2.734 -5.9 -4 -7.07 -2.829c-1.172 1.172 .094 4.338 2.828 7.071zM7.5 16l1 1M12.975 21.425c3.905 -3.906 4.855 -9.288 2.121 -12.021c-2.733 -2.734 -8.115 -1.784 -12.02 2.121",
    melon:
      "M20 10c0 5.523 -4.477 10 -10 10a9.967 9.967 0 0 1 -6.984 -2.842l4.343 -4.153a4 4 0 0 0 5.76 -5.51l4.342 -4.153a9.963 9.963 0 0 1 2.539 6.658z",
    milk: "M8 6h8v-2a1 1 0 0 0 -1 -1h-6a1 1 0 0 0 -1 1v2zM16 6l1.094 1.759a6 6 0 0 1 .906 3.17v8.071a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-8.071a6 6 0 0 1 .906 -3.17l1.094 -1.759M12 16m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M10 10h4",
    minus: "M5 12l14 0",
    mmachine: "M5 3h14v18H5ZM5 9h14M5 15h14",
    "mood-smile":
      "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M9 10l.01 0M15 10l.01 0M9.5 15a3.5 3.5 0 0 0 5 0",
    moon: "M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z",
    "moon-stars":
      "M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454zM17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2M19 11h2m-1 -1v2",
    mparallel: "M3 9h18M3 13.5h18M6 9v11M18 9v11M9 13.5v6.5M15 13.5v6.5",
    mprot: "M8 21V3h6a5 5 0 0 1 0 10H8",
    mpullbar: "M2 5h20M6 5v15M18 5v15",
    mushroom:
      "M20 11.1c0 -4.474 -3.582 -8.1 -8 -8.1s-8 3.626 -8 8.1a.9 .9 0 0 0 .9 .9h14.2a.9 .9 0 0 0 .9 -.9zM10 12v7a2 2 0 1 0 4 0v-7",
    ncarbs:
      "M2 22 16 8M3.5 12.5 5 11l1.5 1.5a3.5 3.5 0 0 1 0 5L5 19l-1.5-1.5a3.5 3.5 0 0 1 0-5ZM7.5 8.5 9 7l1.5 1.5a3.5 3.5 0 0 1 0 5L9 15l-1.5-1.5a3.5 3.5 0 0 1 0-5ZM11.5 4.5 13 3l1.5 1.5a3.5 3.5 0 0 1 0 5L13 11l-1.5-1.5a3.5 3.5 0 0 1 0-5Z",
    nfat: "M12 4V2M5 10v4a7 7 0 0 0 5.3 6.8c.4.1.8.3 1.1.6L12 22l.6-.6c.3-.3.7-.5 1.1-.6A7 7 0 0 0 19 14v-4M12 4C8 4 4.5 6 4 8c-.2 1-.9 2-2 3 1.3-.1 2-.3 3-1 .5.9 1 1.4 2 2 1.5-.6 2-1.1 2.5-2 .6 1 1.2 1.4 2.5 2 1.3-.6 1.9-1.1 2.5-2 .6 1 1.2 1.4 2.5 2 1.2-.5 1.7-1 2-2 1 .9 1.7 1.2 3 1-1.3-1-1.8-2-2-3-.5-2-4-4-8-4Z",
    nfiber:
      "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10ZM2 21c0-3 1.9-5.4 5.1-6 2.4-.5 4.9-2 5.9-3",
    nkcal:
      "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z",
    nmicro:
      "M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM20.2 20.2c2-2 0-7.4-4.5-11.9S5.8 1.8 3.8 3.8s0 7.4 4.5 11.9 9.9 6.5 11.9 4.5ZM15.7 15.7c4.5-4.5 6.5-9.9 4.5-11.9s-7.4 0-11.9 4.5-6.5 9.9-4.5 11.9 7.4 0 11.9-4.5Z",
    notes:
      "M5 3m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2zM9 7l6 0M9 11l6 0M9 15l4 0",
    nprotein:
      "M12.4 13A5 5 0 0 1 22 15c0 3.9-4 7-9 7-4.1 0-8.2-.8-10.4-2.5-.4-.3-.6-.8-.6-1.3C2.1 12.7 2.6 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.1 0-1.6-.4-2-1M15 14a5 5 0 0 0-7.6 2M10 6.8C8 8 9.5 13 8 15",
    nsalt:
      "M8 3h8l1 4H7zM8 7h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z",
    nsat: "M5 10v4a7 7 0 0 0 14 0v-4M4 8c.5-2 4-4 8-4s7.5 2 8 4M9 14h6",
    nsugars: "M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
    nut: "M19 6.84a2.007 2.007 0 0 1 1 1.754v6.555c0 .728 -.394 1.4 -1.03 1.753l-6 3.844a1.995 1.995 0 0 1 -1.94 0l-6 -3.844a2.006 2.006 0 0 1 -1.03 -1.752v-6.557c0 -.728 .394 -1.399 1.03 -1.753l6 -3.582a2.049 2.049 0 0 1 2 0l6 3.582h-.03zM12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
    overhead:
      "M3 3h18M5 1.5v3M19 1.5v3M8 3l2 6M16 3l-2 6M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 22v-8h6v8",
    package:
      "M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5M12 12l8 -4.5M12 12l0 9M12 12l-8 -4.5M16 5.25l-8 4.5",
    palette:
      "M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
    pencil: "M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4M13.5 6.5l4 4",
    "pencil-plus":
      "M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4M13.5 6.5l4 4M16 19h6M19 16v6",
    pepper:
      "M13 11c0 2.21 -2.239 4 -5 4s-5 -1.79 -5 -4a8 8 0 1 0 16 0a3 3 0 0 0 -6 0M16 8c0 -2 2 -4 4 -4",
    pill: "M4.5 12.5l8 -8a4.94 4.94 0 0 1 7 7l-8 8a4.94 4.94 0 0 1 -7 -7M8.5 8.5l7 7",
    pizza:
      "M12 21.5c-3.04 0 -5.952 -.714 -8.5 -1.983l8.5 -16.517l8.5 16.517a19.09 19.09 0 0 1 -8.5 1.983zM5.38 15.866a14.94 14.94 0 0 0 6.815 1.634a14.944 14.944 0 0 0 6.502 -1.479M13 11.01v-.01M11 14v-.01",
    plank: "M2 18h20M5 18l2-5h11l2 5M5 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 13l-2 5",
    plus: "M12 5l0 14M5 12l14 0",
    potato:
      "M6 7c2-3 7-4 11-2s4 7 2 11-7 5-11 3-6-8-2-12ZM9 10h.01M14 9h.01M12 14h.01M16 14h.01",
    preacher: "M3 20 13 10M13 10l5-3M16 4l4 4M7 20h12M15 14v6",
    press: "M3 7h18M5 5v4M19 5v4M8 7v5M16 7v5M4 15h16M7 15v5M17 15v5",
    pulldown:
      "M2 3h20M7 3v4l3 3M17 3v4l-3 3M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM10 22v-6h4v6",
    pushdown: "M12 2v7M9 9h6M12 13a2 2 0 1 0 0-4M8 12v6l4 4 4-4v-6",
    raise:
      "M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM2 10h4M18 10h4M6 10h12M10 10v5l-1 7M14 10v5l1 7",
    rearfly:
      "M18 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM16 8 7 11l-1 10M11 10 8 3M12 10l2 8M3 3h4",
    receipt:
      "M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2m4 -14h6m-6 4h6m-2 4h2",
    refresh:
      "M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4",
    reload:
      "M19.933 13.041a8 8 0 1 1 -9.925 -8.788c3.899 -1 7.935 1.007 9.425 4.747M20 4v5h-5",
    rope: "M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 8v7M9 21l3-6 3 6M7 10c-5 5-3 12 5 12s10-7 5-12",
    row: "M2 12h8M8 9v6M15 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM14 7l-4 5M15 7l1 7h4v7M22 4v18",
    rower: "M2 20h20M5 20l2-5h7M14 15l6-4M10 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM10 10v5",
    "ruler-measure":
      "M19.875 12c.621 0 1.125 .512 1.125 1.143v5.714c0 .631 -.504 1.143 -1.125 1.143h-15.875a1 1 0 0 1 -1 -1v-5.857c0 -.631 .504 -1.143 1.125 -1.143h15.75zM9 12v2M6 12v3M12 12v3M18 12v3M15 12v2M3 3v4M3 5h18M21 3v4",
    run: "M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M4 17l5 1l.75 -1.5M15 21l0 -4l-4 -3l1 -6M7 12l0 -3l5 -1l3 3l3 1",
    salad:
      "M4 11h16a1 1 0 0 1 1 1v.5c0 1.5 -2.517 5.573 -4 6.5v1a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-1c-1.687 -1.054 -4 -5 -4 -6.5v-.5a1 1 0 0 1 1 -1zM18.5 11c.351 -1.017 .426 -2.236 .5 -3.714v-1.286h-2.256c-2.83 0 -4.616 .804 -5.64 2.076M5.255 11.008a12.204 12.204 0 0 1 -.255 -2.008v-1h1.755c.98 0 1.801 .124 2.479 .35M8 8l1 -4l4 2.5M13 11v-.5a2.5 2.5 0 1 0 -5 0v.5",
    salt: "M12 13v.01M10 16v.01M14 16v.01M7.5 8h9l-.281 -2.248a2 2 0 0 0 -1.985 -1.752h-4.468a2 2 0 0 0 -1.986 1.752l-.28 2.248zM7.5 8l-1.612 9.671a2 2 0 0 0 1.973 2.329h8.278a2 2 0 0 0 1.973 -2.329l-1.612 -9.671",
    sauce: "M9 3h6M10 3v3l-3 3v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9l-3-3V3M7 13h10",
    "scale-outline":
      "M3 3m0 4a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4zM12 7c1.956 0 3.724 .802 5 2.095l-2.956 2.904a3 3 0 0 0 -2.038 -.799a3 3 0 0 0 -2.038 .798l-2.956 -2.903a6.979 6.979 0 0 1 5 -2.095z",
    school: "M22 9l-10 -4l-10 4l10 4l10 -4v6M6 10.6v5.4a6 3 0 0 0 12 0v-5.4",
    search: "M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M21 21l-6 -6",
    seeding:
      "M12 10a6 6 0 0 0 -6 -6h-3v2a6 6 0 0 0 6 6h3M12 14a6 6 0 0 1 6 -6h3v1a6 6 0 0 1 -6 6h-3M12 20l0 -10",
    settings:
      "M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065zM9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0",
    "shopping-cart":
      "M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M17 17h-11v-14h-2M6 5l14 1l-1 7h-13",
    sitemap:
      "M3 15m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2zM15 15m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2zM9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2zM6 15v-1a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v1M12 9l0 3",
    snowflake:
      "M10 4l2 1l2 -1M12 2v6.5l3 1.72M17.928 6.268l.134 2.232l1.866 1.232M20.66 7l-5.629 3.25l.01 3.458M19.928 14.268l-1.866 1.232l-.134 2.232M20.66 17l-5.629 -3.25l-2.99 1.738M14 20l-2 -1l-2 1M12 22v-6.5l-3 -1.72M6.072 17.732l-.134 -2.232l-1.866 -1.232M3.34 17l5.629 -3.25l-.01 -3.458M4.072 9.732l1.866 -1.232l.134 -2.232M3.34 7l5.629 3.25l2.99 -1.738",
    soup: "M4 11h16a1 1 0 0 1 1 1v.5c0 1.5 -2.517 5.573 -4 6.5v1a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-1c-1.687 -1.054 -4 -5 -4 -6.5v-.5a1 1 0 0 1 1 -1zM12 4a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2M16 4a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2M8 4a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2",
    sparkles:
      "M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z",
    squat:
      "M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3 8h18M3 6.5v3M21 6.5v3M10 8l-2 6 4 2-1 6M14 8l2 6-4 2",
    "stack-2": "M12 4l-8 4l8 4l8 -4l-8 -4M4 12l8 4l8 -4M4 16l8 4l8 -4",
    star: "M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z",
    stretching:
      "M16 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M5 20l5 -.5l1 -2M18 20v-5h-5.5l2.5 -6.5l-5.5 1l1.5 2",
    sun: "M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7",
    sunrise:
      "M3 17h1m16 0h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7m-9.7 5.7a4 4 0 0 1 8 0M3 21l18 0M12 9v-6l3 3m-6 0l3 -3",
    swimming:
      "M16 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M6 11l4 -2l3.5 3l-1.5 2M3 16.75a2.4 2.4 0 0 0 1 .25a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 1 -.25",
    target:
      "M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",
    temperature: "M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5M10 9l4 0",
    template:
      "M4 4m0 1a1 1 0 0 1 1 -1h14a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1zM4 12m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1zM14 12l6 0M14 16l6 0M14 20l6 0",
    thrust: "M2 21h20M4 21v-5l5-3 7 1 4 7M9 13V8M5 8h8M3 10a2 2 0 1 0 0-4",
    "tools-kitchen-2":
      "M19 3v12h-5c-.023 -3.681 .184 -7.406 5 -12zm0 12v6h-1v-3m-10 -14v17m-3 -17v3a3 3 0 1 0 6 0v-3",
    trash:
      "M4 7l16 0M10 11l0 6M14 11l0 6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3",
    treadmill:
      "M10 3a1 1 0 1 0 2 0a1 1 0 0 0 -2 0M3 14l4 1l.5 -.5M12 18v-3l-3 -2.923l.75 -5.077M6 10v-2l4 -1l2.5 2.5l2.5 .5M21 22a1 1 0 0 0 -1 -1h-16a1 1 0 0 0 -1 1M18 21l1 -11l2 -1",
    "trending-up": "M3 17l6 -6l4 4l8 -8M14 7l7 0l0 7",
    tricepsup: "M12 2v4M9 6h6M9 6l1 6M15 6l-1 6M12 15a2 2 0 1 0 0-4M10 15l-1 7M14 15l1 7",
    twist:
      "M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 21l3-8h6l3 8M6 10l6 2 6-2M3 13a9 9 0 0 1 3-4M21 13a9 9 0 0 0-3-4",
    user: "M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2",
    walk: "M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M7 21l3 -4M16 21l-2 -4l-3 -3l1 -6M6 12l2 -3l4 -1l3 3l3 1",
    wallet:
      "M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12M20 12v4h-4a2 2 0 0 1 0 -4h4",
    weight:
      "M12 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M6.835 9h10.33a1 1 0 0 1 .984 .821l1.637 9a1 1 0 0 1 -.984 1.179h-13.604a1 1 0 0 1 -.984 -1.179l1.637 -9a1 1 0 0 1 .984 -.821z",
    wind: "M5 8h8.5a2.5 2.5 0 1 0 -2.34 -3.24M3 12h15.5a2.5 2.5 0 1 1 -2.34 3.24M4 16h5.5a2.5 2.5 0 1 1 -2.34 3.24",
    x: "M18 6l-12 12M6 6l12 12",
    yoga: "M12 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M4 20h4l1.5 -3M17 20l-1 -5h-5l1 -7M4 10l4 -1l4 -1l4 1.5l4 1.5",
    zzz: "M4 12h6l-6 8h6M14 4h6l-6 8h6",
  },
  customNames: [
    "calf",
    "crunch",
    "curl",
    "dip",
    "elliptical",
    "facepull",
    "fly",
    "hinge",
    "incline",
    "legcurl",
    "legcurlseat",
    "legext",
    "legpress",
    "legpressinc",
    "legraise",
    "legume",
    "lunge",
    "mbar",
    "mcable",
    "mcan",
    "mdb",
    "meal-breakfast",
    "meal-dinner",
    "meal-lunch",
    "meal-snack",
    "mmachine",
    "mparallel",
    "mprot",
    "mpullbar",
    "ncarbs",
    "nfat",
    "nfiber",
    "nkcal",
    "nmicro",
    "nprotein",
    "nsalt",
    "nsat",
    "nsugars",
    "overhead",
    "plank",
    "potato",
    "preacher",
    "press",
    "pulldown",
    "pushdown",
    "raise",
    "rearfly",
    "rope",
    "row",
    "rower",
    "sauce",
    "squat",
    "thrust",
    "tricepsup",
    "twist",
  ],
};
