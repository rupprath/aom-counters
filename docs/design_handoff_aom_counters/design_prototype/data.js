/* Curated subset of counter-data.json relevant to the prototype.
   In the real Tauri app this lives as a single static JSON bundle and the
   resolution happens at runtime. */

(function () {

/* ---- Gods grouped by pantheon (display order) ---------------------------- */
const PANTHEONS = [
  { id: "greek",     label: "Greek",     gods: [
    { id: "zeus",     name: "Zeus" },
    { id: "poseidon", name: "Poseidon" },
    { id: "hades",    name: "Hades" },
    { id: "demeter",  name: "Demeter" },
  ]},
  { id: "egyptian",  label: "Egyptian",  gods: [
    { id: "ra",   name: "Ra" },
    { id: "isis", name: "Isis" },
    { id: "set",  name: "Set" },
  ]},
  { id: "norse",     label: "Norse",     gods: [
    { id: "odin",  name: "Odin" },
    { id: "thor",  name: "Thor" },
    { id: "loki",  name: "Loki" },
    { id: "freyr", name: "Freyr" },
  ]},
  { id: "atlantean", label: "Atlantean", gods: [
    { id: "kronos", name: "Kronos" },
    { id: "oranos", name: "Oranos" },
    { id: "gaia",   name: "Gaia" },
  ]},
  { id: "chinese",   label: "Chinese",   gods: [
    { id: "fuxi",     name: "Fuxi" },
    { id: "nuwa",     name: "Nüwa" },
    { id: "shennong", name: "Shennong" },
  ]},
  { id: "japanese",  label: "Japanese",  gods: [
    { id: "amaterasu", name: "Amaterasu" },
    { id: "tsukuyomi", name: "Tsukuyomi" },
    { id: "susanoo",   name: "Susanoo" },
  ]},
  { id: "aztec",     label: "Aztec",     gods: [
    { id: "huitzilopochtli", name: "Huitzilopochtli" },
    { id: "tezcatlipoca",    name: "Tezcatlipoca" },
    { id: "quetzalcoatl",    name: "Quetzalcoatl" },
  ]},
];

/* Flat lookup */
const GODS = {};
PANTHEONS.forEach(p =>
  p.gods.forEach(g => { GODS[g.id] = { ...g, pantheon: p.id, pantheonLabel: p.label }; })
);

/* ---- Worked example: ZEUS (player) vs SET (opponent) -------------------- */

/* Threats — Egyptian pantheon + Set's possible myth units (from Set's
   minor god pool: Ptah/Anubis classical, Sekhmet/Nephthys heroic,
   Horus/Thoth mythic).  Each non-myth threat carries a priority. */

const THREAT_ROWS = [
  {
    id: "eg_spearman",  name: "Spearman",
    category: "infantry",  cat: "Counter-cav infantry",
    role: "Spear wall, mainline anti-cavalry",
    priority: 1,
  },
  {
    id: "eg_chariot_archer", name: "Chariot Archer",
    category: "ranged",  cat: "Mobile ranged",
    role: "Skirmishing damage at range",
    priority: 2,
  },
  {
    id: "eg_camel_rider", name: "Camel Rider",
    category: "cavalry", cat: "Counter-cav cavalry",
    role: "Hard-counters your Hippeus",
    priority: 3,
  },
  {
    id: "eg_axeman", name: "Axeman",
    category: "infantry", cat: "Counter-infantry",
    role: "Cuts through your Hoplites",
    priority: 4,
  },
  {
    id: "eg_slinger", name: "Slinger",
    category: "ranged", cat: "Counter-archer",
    role: "Hard-counters your Toxotes",
    priority: 5,
  },
  {
    id: "eg_war_elephant", name: "War Elephant",
    category: "cavalry", cat: "Heavy / anti-building",
    role: "Mythic-age battering ram on legs",
    priority: 6,
  },
  {
    id: "eg_catapult", name: "Catapult",
    category: "siege", cat: "Siege engine",
    role: "Town-cracker, fragile in melee",
    priority: 7,
  },
  {
    id: "eg_siege_tower", name: "Siege Tower",
    category: "siege", cat: "Wall breaker",
    role: "Carries infantry over walls",
    priority: 8,
  },
];

/* Set's possible myth units, grouped under their granting minor god */
const MYTH_ROWS = [
  { id: "eg_wadjet",        name: "Wadjet",        via: "Ptah",     age: "Classical" },
  { id: "eg_anubite",       name: "Anubite",       via: "Anubis",   age: "Classical" },
  { id: "eg_scarab",        name: "Scarab",        via: "Sekhmet",  age: "Heroic" },
  { id: "eg_scorpion_man",  name: "Scorpion Man",  via: "Nephthys", age: "Heroic" },
  { id: "eg_leviathan",     name: "Leviathan",     via: "Nephthys", age: "Heroic" },
  { id: "eg_avenger",       name: "Avenger",       via: "Horus",    age: "Mythic" },
  { id: "eg_phoenix",       name: "Phoenix",       via: "Thoth",    age: "Mythic" },
].map(m => ({ ...m, category: "myth", cat: "Myth unit", possible: true }));

/* Zeus counter units (resolved from Greek roster + counterPlan) */
const ZEUS_COUNTERS = {
  gr_hypaspist: { id: "gr_hypaspist", name: "Hypaspist", category: "infantry", role: "Counter-infantry" },
  gr_toxotes:   { id: "gr_toxotes",   name: "Toxotes",   category: "ranged",   role: "Ranged soldier" },
  gr_peltast:   { id: "gr_peltast",   name: "Peltast",   category: "ranged",   role: "Counter-archer" },
  gr_hippeus:   { id: "gr_hippeus",   name: "Hippeus",   category: "cavalry",  role: "Cavalry" },
  gr_prodromos: { id: "gr_prodromos", name: "Prodromos", category: "cavalry",  role: "Counter-cavalry" },
  gr_hoplite:   { id: "gr_hoplite",   name: "Hoplite",   category: "infantry", role: "Infantry mainline" },
  gr_hero:      { id: "gr_hero",      name: "Greek Hero", category: "hero",    role: "Anti-myth" },
};

/* Per-threat counter recommendations (already resolved via counterPlan) */
const COUNTER_MAP = {
  eg_spearman:       ["gr_hypaspist", "gr_toxotes"],
  eg_chariot_archer: ["gr_peltast",   "gr_hippeus"],
  eg_camel_rider:    ["gr_prodromos", "gr_hoplite"],
  eg_axeman:         ["gr_hypaspist", "gr_toxotes"],
  eg_slinger:        ["gr_peltast",   "gr_hippeus"],
  eg_war_elephant:   ["gr_prodromos", "gr_hoplite"],
  eg_catapult:       ["gr_hippeus",   "gr_hypaspist"],
  eg_siege_tower:    ["gr_hippeus",   "gr_hypaspist"],
  /* Myth always → hero */
  eg_wadjet:         ["gr_hero"],
  eg_anubite:        ["gr_hero"],
  eg_scarab:         ["gr_hero"],
  eg_scorpion_man:   ["gr_hero"],
  eg_leviathan:      ["gr_hero"],
  eg_avenger:        ["gr_hero"],
  eg_phoenix:        ["gr_hero"],
};

/* For the DEFAULT (compact) view: top 6 threats + the aggregated counter
   units the player should be building.  Order is by "how essential to have
   in your composition" — counter-roles first, generalists after. */
const COMPACT_THREATS  = THREAT_ROWS.slice(0, 6);
const COMPACT_COUNTERS = ["gr_hypaspist","gr_peltast","gr_prodromos","gr_hero","gr_toxotes","gr_hippeus"]
  .map(id => ZEUS_COUNTERS[id]);

/* ---- Helpers ------------------------------------------------------------ */

/* monogram for placeholder unit tiles: first letter of each capitalized word, max 2 */
function mono(name) {
  const parts = name.replace(/[^A-Za-zÀ-ÿ ]/g, "").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* short god monogram */
function godMono(name) {
  return name.slice(0, 2).toUpperCase().replace("Ü","U");
}

window.AOM = {
  PANTHEONS, GODS,
  THREAT_ROWS, MYTH_ROWS, ZEUS_COUNTERS, COUNTER_MAP,
  COMPACT_THREATS, COMPACT_COUNTERS,
  mono, godMono,
};

})();
