/* ============================================================================
 * AURÆ · Smell Printer Prototype
 * aromas.js — Libreria di aromi base (dati simulati, puramente concettuali)
 *
 * NOTA: Questi dati NON descrivono formule chimiche reali, dosaggi reali o
 * istruzioni di miscelazione fisica. Sono valori estetici e narrativi usati
 * solo per la simulazione visiva. Nessun odore reale viene emesso.
 * ==========================================================================*/

/* Asse dei profili olfattivi (0–100), puramente descrittivi:
 *   agrumato · floreale · legnoso · speziato · fresco · dolce
 * Piramide olfattiva (volatilità simulata): 'testa' | 'cuore' | 'fondo'
 */

const AROMA_AXES = [
  { key: "agrumato", label: "Agrumato" },
  { key: "floreale", label: "Floreale" },
  { key: "legnoso",  label: "Legnoso"  },
  { key: "speziato", label: "Speziato" },
  { key: "fresco",   label: "Fresco"   },
  { key: "dolce",    label: "Dolce"    },
];

const AROMA_LIBRARY = [
  {
    id: "bergamotto",
    name: "Bergamotto",
    family: "Agrumi",
    layer: "testa",
    color: "#E7C948",
    glyph: "🍋",
    blurb: "Scintilla frizzante e solare, apre la miscela con luce citrina.",
    profile: { agrumato: 95, floreale: 20, legnoso: 5, speziato: 10, fresco: 70, dolce: 15 },
  },
  {
    id: "neroli",
    name: "Neroli",
    family: "Fiori d'arancio",
    layer: "testa",
    color: "#F0E2A6",
    glyph: "🌼",
    blurb: "Ponte tra agrume e fiore, ariosa e leggermente miellata.",
    profile: { agrumato: 60, floreale: 70, legnoso: 8, speziato: 8, fresco: 55, dolce: 35 },
  },
  {
    id: "menta",
    name: "Menta glaciale",
    family: "Aromatico",
    layer: "testa",
    color: "#6FCF97",
    glyph: "🌿",
    blurb: "Soffio freddo e cristallino che raffredda l'intera architettura.",
    profile: { agrumato: 25, floreale: 5, legnoso: 3, speziato: 12, fresco: 98, dolce: 8 },
  },
  {
    id: "pompelmo",
    name: "Pompelmo rosa",
    family: "Agrumi",
    layer: "testa",
    color: "#F19C9C",
    glyph: "🍊",
    blurb: "Amaro brillante con un fondo succoso e pungente.",
    profile: { agrumato: 88, floreale: 18, legnoso: 6, speziato: 14, fresco: 62, dolce: 22 },
  },
  {
    id: "rosa",
    name: "Rosa di Damasco",
    family: "Floreale",
    layer: "cuore",
    color: "#E86A8F",
    glyph: "🌹",
    blurb: "Cuore vellutato, opulento e romantico, con sfumature di miele.",
    profile: { agrumato: 12, floreale: 96, legnoso: 15, speziato: 18, fresco: 20, dolce: 45 },
  },
  {
    id: "gelsomino",
    name: "Gelsomino notturno",
    family: "Floreale",
    layer: "cuore",
    color: "#F3E5C0",
    glyph: "🌙",
    blurb: "Ipnotico e narcotico, si espande caldo nell'aria della sera.",
    profile: { agrumato: 15, floreale: 92, legnoso: 10, speziato: 12, fresco: 25, dolce: 50 },
  },
  {
    id: "lavanda",
    name: "Lavanda alpina",
    family: "Aromatico",
    layer: "cuore",
    color: "#8E7CC3",
    glyph: "💜",
    blurb: "Erbacea e serena, un respiro tra montagna e camomilla.",
    profile: { agrumato: 20, floreale: 65, legnoso: 22, speziato: 16, fresco: 60, dolce: 25 },
  },
  {
    id: "pepe",
    name: "Pepe nero",
    family: "Speziato",
    layer: "cuore",
    color: "#C0563B",
    glyph: "🌶️",
    blurb: "Frizzante calore che elettrizza il centro della composizione.",
    profile: { agrumato: 18, floreale: 10, legnoso: 30, speziato: 95, fresco: 30, dolce: 12 },
  },
  {
    id: "cardamomo",
    name: "Cardamomo verde",
    family: "Speziato",
    layer: "cuore",
    color: "#A8C66C",
    glyph: "🫧",
    blurb: "Speziato luminoso, quasi eucaliptato, elegante e vibrante.",
    profile: { agrumato: 32, floreale: 20, legnoso: 24, speziato: 80, fresco: 55, dolce: 18 },
  },
  {
    id: "sandalo",
    name: "Sandalo cremoso",
    family: "Legnoso",
    layer: "fondo",
    color: "#B07D52",
    glyph: "🪵",
    blurb: "Legno lattiginoso e caldo, la spina dorsale di ogni scia.",
    profile: { agrumato: 6, floreale: 18, legnoso: 92, speziato: 20, fresco: 12, dolce: 40 },
  },
  {
    id: "vetiver",
    name: "Vetiver fumé",
    family: "Legnoso",
    layer: "fondo",
    color: "#7C8A5A",
    glyph: "🌾",
    blurb: "Radice terrosa e affumicata, profonda e minerale.",
    profile: { agrumato: 8, floreale: 6, legnoso: 90, speziato: 28, fresco: 30, dolce: 14 },
  },
  {
    id: "vaniglia",
    name: "Vaniglia bourbon",
    family: "Gourmand",
    layer: "fondo",
    color: "#D9A75B",
    glyph: "🍮",
    blurb: "Avvolgente, golosa e balsamica, addolcisce ogni contrasto.",
    profile: { agrumato: 5, floreale: 22, legnoso: 30, speziato: 15, fresco: 8, dolce: 96 },
  },
  {
    id: "ambra",
    name: "Ambra solare",
    family: "Ambrato",
    layer: "fondo",
    color: "#C98A3B",
    glyph: "🔆",
    blurb: "Resina calda e dorata, un abbraccio ambrato che persiste.",
    profile: { agrumato: 10, floreale: 20, legnoso: 45, speziato: 35, fresco: 10, dolce: 70 },
  },
  {
    id: "muschio",
    name: "Muschio bianco",
    family: "Muschiato",
    layer: "fondo",
    color: "#C9CBB6",
    glyph: "🤍",
    blurb: "Pulito e cotonoso, avvolge la miscela in una nube morbida.",
    profile: { agrumato: 12, floreale: 30, legnoso: 40, speziato: 10, fresco: 45, dolce: 38 },
  },
  {
    id: "incenso",
    name: "Incenso sacro",
    family: "Balsamico",
    layer: "fondo",
    color: "#9A8FB0",
    glyph: "🕯️",
    blurb: "Fumo resinoso e meditativo, mistico e sospeso nel tempo.",
    profile: { agrumato: 14, floreale: 12, legnoso: 55, speziato: 42, fresco: 24, dolce: 30 },
  },
  {
    id: "cedro",
    name: "Cedro atlante",
    family: "Legnoso",
    layer: "fondo",
    color: "#93745A",
    glyph: "🌲",
    blurb: "Legno secco e matita temperata, strutturale e sobrio.",
    profile: { agrumato: 8, floreale: 8, legnoso: 88, speziato: 22, fresco: 26, dolce: 16 },
  },
];

/* Indice rapido id → aroma */
const AROMA_BY_ID = AROMA_LIBRARY.reduce((acc, a) => (acc[a.id] = a, acc), {});

/* Etichette dei livelli della piramide olfattiva */
const LAYER_LABELS = {
  testa: "Note di testa",
  cuore: "Note di cuore",
  fondo: "Note di fondo",
};

/* Esposizione globale (nessun bundler: solo script vanilla) */
window.AURAE = window.AURAE || {};
window.AURAE.AROMA_AXES = AROMA_AXES;
window.AURAE.AROMA_LIBRARY = AROMA_LIBRARY;
window.AURAE.AROMA_BY_ID = AROMA_BY_ID;
window.AURAE.LAYER_LABELS = LAYER_LABELS;
