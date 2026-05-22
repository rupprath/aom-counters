/**
 * Step 1 proof script — run with `npm run prove`.
 *
 * Resolves the Zeus vs Set matchup (and a few spot checks) entirely from
 * counter-data.json and prints it for eyeball verification, then sweeps all
 * 23 x 23 god pairs to confirm the engine and dataset stay consistent.
 */

import { counterData } from '../src/data/counterData';
import {
  resolveMatchup,
  resolveMythUnits,
  resolveCounter,
} from '../src/data/resolve';
import type { ResolvedCounter } from '../src/data/resolve';

const pad = (s: string, n: number): string =>
  s.length >= n ? s : s + ' '.repeat(n - s.length);

const rule = (label = ''): string =>
  label
    ? `── ${label} ${'─'.repeat(Math.max(0, 64 - label.length))}`
    : '─'.repeat(68);

const counterText = (c: ResolvedCounter): string =>
  c.units.map((u) => u.name).join(' + ') + (c.isOverride ? '  (override)' : '');

/* ---- headline matchup --------------------------------------------------- */

console.log();
console.log('AoM: Retold Counter Companion — resolution proof');
console.log(
  `Dataset: patch ${counterData.gamePatch}  ·  schema v${counterData.schemaVersion}`,
);
console.log();

const m = resolveMatchup('zeus', 'set');

console.log(rule(`MATCHUP — ${m.player.name} vs ${m.opponent.name}`));
console.log(
  `Player:   ${m.player.name} (${counterData.pantheons[m.player.pantheon]!.label})`,
);
console.log(
  `Opponent: ${m.opponent.name} (${counterData.pantheons[m.opponent.pantheon]!.label})`,
);
console.log();

console.log(`ENEMY THREATS (${m.threats.length})  —  "they build"  /  counters  "you build"`);
for (const t of m.threats) {
  const cat = counterData.categories[t.category]!.label;
  console.log(
    `  P${t.priority}  ${pad(t.unit.name, 16)} ${pad(`[${cat}]`, 18)}` +
      `→  ${counterText(t.counter)}`,
  );
}
console.log();

console.log(`ENEMY MYTH UNITS (${m.mythUnits.length} possible)  —  one combined group`);
for (const my of m.mythUnits) {
  const via = my.via.map((v) => `${v.name} (${v.age})`).join(', ');
  const conf = my.confidence === 'low' ? '  ·  low-confidence' : '';
  console.log(`  ${pad(my.unit.name, 18)} via ${via}${conf}`);
}
console.log(
  `  → countered by:  ${counterText(m.mythCounter)}  (beats every myth unit)`,
);
console.log();

/* ---- spot checks -------------------------------------------------------- */

console.log(rule('SPOT CHECKS'));

// Role fallback: the Chinese roster has no counterInfantry unit.
const fallback = resolveCounter('fuxi', 'gr_hoplite');
console.log(
  `Role fallback — Fuxi (Chinese) vs a Hoplite [infantry]:\n` +
    `  counterPlan.infantry roles = [counterInfantry, ranged]; Chinese lacks\n` +
    `  counterInfantry, so it falls through to: ${counterText(fallback)}`,
);
console.log();

// Myth de-duplication: Loki reaches the Einheri via two minor gods.
const lokiMyth = resolveMythUnits('loki');
const einheri = lokiMyth.find((x) => x.unit.id === 'no_einheri')!;
console.log(
  `Myth de-duplication — Loki's possible myth units: ${lokiMyth.length}\n` +
    `  Einheri credited via: ${einheri.via.map((v) => v.name).join(' + ')} ` +
    `(merged confidence: ${einheri.confidence})`,
);
console.log();

// Per-opponent pins: reorder the threat list (FR-21).
const pinned = resolveMatchup('zeus', 'set', {
  pins: ['eg_axeman', 'eg_spearman', 'eg_war_elephant'],
});
console.log(
  `Per-opponent pins — Zeus vs Set with Set pinned to\n` +
    `  [Axeman, Spearman, War Elephant]:\n` +
    `  threat order is now: ${pinned.threats.map((t) => t.unit.name).join(', ')}`,
);
console.log();

/* ---- full consistency sweep -------------------------------------------- */

console.log(rule('CONSISTENCY SWEEP'));
const godIds = Object.keys(counterData.gods);
let pairs = 0;
const failures: string[] = [];
for (const player of godIds) {
  for (const opponent of godIds) {
    pairs++;
    try {
      const r = resolveMatchup(player, opponent);
      if (r.threats.length === 0) failures.push(`${player} vs ${opponent}: no threats`);
      if (r.mythCounter.units.length === 0) {
        failures.push(`${player} vs ${opponent}: no myth counter`);
      }
    } catch (err) {
      failures.push(`${player} vs ${opponent}: ${(err as Error).message}`);
    }
  }
}

if (failures.length === 0) {
  console.log(
    `Resolved all ${pairs} god pairs (${godIds.length} x ${godIds.length}) — ` +
      `no missing references, every matchup produced threats + a myth counter.`,
  );
} else {
  console.log(`FAILURES (${failures.length} of ${pairs} pairs):`);
  for (const f of failures.slice(0, 20)) console.log(`  - ${f}`);
  process.exitCode = 1;
}
console.log();
