/**
 * Generate tmp/unit_list.md — the unit screenshot capture checklist.
 *
 * Lists every unit the app can actually display, grouped by pantheon, and
 * flags any catalog units that are never shown (so they can be skipped).
 * Regenerate after a dataset change:  node scripts/gen-unit-list.mjs
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const data = JSON.parse(
  readFileSync(new URL('../src/data/counter-data.json', import.meta.url), 'utf8'),
);

const PANTHEON_ORDER = [
  'greek',
  'egyptian',
  'norse',
  'atlantean',
  'chinese',
  'japanese',
  'aztec',
];
const CATEGORY_ORDER = ['infantry', 'ranged', 'cavalry', 'siege', 'hero'];

// The set of unit ids the app can ever display: enemy threats, the player's
// counter roster, and the possible enemy myth units.
const referenced = new Set();
for (const list of Object.values(data.pantheonThreats)) {
  if (Array.isArray(list)) for (const t of list) referenced.add(t.unit);
}
for (const list of Object.values(data.godSpecificThreats)) {
  if (Array.isArray(list)) for (const t of list) referenced.add(t.unit);
}
for (const pantheon of Object.values(data.pantheons)) {
  if (pantheon?.roster) for (const id of Object.values(pantheon.roster)) referenced.add(id);
}
for (const minorGod of Object.values(data.minorGods)) {
  if (Array.isArray(minorGod?.mythUnits)) {
    for (const id of minorGod.mythUnits) referenced.add(id);
  }
}

const allUnits = Object.entries(data.units).map(([id, u]) => ({ id, ...u }));
const needed = allUnits.filter((u) => referenced.has(u.id));
const unused = allUnits.filter((u) => !referenced.has(u.id));

const row = (u) => {
  const notes = [u.category];
  if (u.uniqueTo) notes.push(`Fortress unit, ${data.gods[u.uniqueTo].name} only`);
  return `- [ ] \`${u.id}.png\` — ${u.name} · ${notes.join(' · ')}`;
};

const lines = [];
lines.push('# Unit screenshot capture list');
lines.push('');
lines.push(
  'Every unit image the app can display, grouped by pantheon. Capture each as',
);
lines.push(
  'a **128×128 square PNG** (see `public/images/README.md`) and save it to',
);
lines.push('`public/images/units/{filename}`.');
lines.push('');
lines.push(
  `Source: \`counter-data.json\`, patch ${data.gamePatch}. ` +
    'Regenerate with `node scripts/gen-unit-list.mjs`.',
);
lines.push('');
lines.push(`**Total to capture: ${needed.length} units.**`);
lines.push('');

for (const pantheonId of PANTHEON_ORDER) {
  const label = data.pantheons[pantheonId].label;
  const inPantheon = needed.filter((u) => u.pantheon === pantheonId);
  const military = inPantheon
    .filter((u) => !u.isMyth)
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
  const myth = inPantheon.filter((u) => u.isMyth);

  lines.push('---');
  lines.push('');
  lines.push(`## ${label} — ${inPantheon.length} units`);
  lines.push('');
  lines.push(`### Military, siege & hero (${military.length})`);
  lines.push('');
  for (const u of military) lines.push(row(u));
  lines.push('');
  lines.push(`### Myth units (${myth.length})`);
  lines.push('');
  lines.push('_Shown as a group; the player\'s hero counters all of them._');
  lines.push('');
  for (const u of myth) lines.push(row(u));
  lines.push('');
}

if (unused.length > 0) {
  lines.push('---');
  lines.push('');
  lines.push('## Skip — not needed');
  lines.push('');
  lines.push(
    'These units exist in the dataset but the app never displays them, ' +
      'so no screenshot is needed:',
  );
  lines.push('');
  for (const u of unused) {
    lines.push(`- ~~\`${u.id}.png\`~~ — ${u.name} (${data.pantheons[u.pantheon].label})`);
  }
  lines.push('');
}

mkdirSync(new URL('../tmp/', import.meta.url), { recursive: true });
writeFileSync(new URL('../tmp/unit_list.md', import.meta.url), `${lines.join('\n')}\n`);

console.log(
  `Wrote tmp/unit_list.md — ${needed.length} units to capture, ` +
    `${unused.length} to skip.`,
);
