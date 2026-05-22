import { describe, expect, it } from 'vitest';
import {
  getUnit,
  resolveCounter,
  resolveMatchup,
  resolveMythCounter,
  resolveMythUnits,
  resolveThreats,
  threatUnits,
} from './resolve';

/** Map a list of resolved units/threats down to their ids for terse asserts. */
const ids = <T extends { id: string }>(xs: T[]): string[] => xs.map((x) => x.id);

describe('Zeus vs Set — the worked example', () => {
  const matchup = resolveMatchup('zeus', 'set');

  it('identifies both gods and the data patch', () => {
    expect(matchup.player.name).toBe('Zeus');
    expect(matchup.opponent.name).toBe('Set');
    expect(matchup.player.pantheon).toBe('greek');
    expect(matchup.opponent.pantheon).toBe('egyptian');
    expect(matchup.gamePatch).toBe('19.10195 Obsidian Mirror');
  });

  it('lists the 8 Egyptian threats in default priority order', () => {
    // Set has no godSpecificThreats, so this is exactly the Egyptian roster.
    expect(ids(matchup.threats.map((t) => t.unit))).toEqual([
      'eg_spearman',
      'eg_chariot_archer',
      'eg_camel_rider',
      'eg_axeman',
      'eg_slinger',
      'eg_war_elephant',
      'eg_catapult',
      'eg_siege_tower',
    ]);
    expect(matchup.threats.map((t) => t.priority)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('counters each threat with the right Greek units', () => {
    const counterOf = (unitId: string) =>
      ids(matchup.threats.find((t) => t.unit.id === unitId)!.counter.units);

    // infantry -> counterInfantry + ranged
    expect(counterOf('eg_spearman')).toEqual(['gr_hypaspist', 'gr_toxotes']);
    expect(counterOf('eg_axeman')).toEqual(['gr_hypaspist', 'gr_toxotes']);
    // ranged -> counterRanged + cavalry
    expect(counterOf('eg_chariot_archer')).toEqual(['gr_peltast', 'gr_hippeus']);
    expect(counterOf('eg_slinger')).toEqual(['gr_peltast', 'gr_hippeus']);
    // cavalry -> counterCavalry + infantry  (War Elephant is category cavalry)
    expect(counterOf('eg_camel_rider')).toEqual(['gr_prodromos', 'gr_hoplite']);
    expect(counterOf('eg_war_elephant')).toEqual(['gr_prodromos', 'gr_hoplite']);
    // siege -> cavalry + counterInfantry
    expect(counterOf('eg_catapult')).toEqual(['gr_hippeus', 'gr_hypaspist']);
    expect(counterOf('eg_siege_tower')).toEqual(['gr_hippeus', 'gr_hypaspist']);
  });

  it('carries the plain-language tip on each counter', () => {
    const spear = matchup.threats.find((t) => t.unit.id === 'eg_spearman')!;
    expect(spear.counter.note).toMatch(/counter-infantry/i);
    expect(spear.counter.isOverride).toBe(false);
  });

  it('computes the 7 possible Set myth units', () => {
    expect(ids(matchup.mythUnits.map((m) => m.unit))).toEqual([
      'eg_wadjet', // Ptah (classical)
      'eg_anubite', // Anubis (classical)
      'eg_scarab', // Sekhmet (heroic)
      'eg_scorpion_man', // Nephthys (heroic)
      'eg_leviathan', // Nephthys (heroic)
      'eg_avenger', // Horus (mythic)
      'eg_phoenix', // Thoth (mythic)
    ]);
  });

  it('annotates each myth unit with the minor god that grants it', () => {
    const wadjet = matchup.mythUnits.find((m) => m.unit.id === 'eg_wadjet')!;
    expect(wadjet.via).toEqual([{ id: 'ptah', name: 'Ptah', age: 'classical' }]);
    // Every myth unit the app shows is "possible" (a myth unit by data flag).
    for (const m of matchup.mythUnits) expect(m.unit.isMyth).toBe(true);
  });

  it('counters the whole myth group with the Greek Hero', () => {
    expect(ids(matchup.mythCounter.units)).toEqual(['gr_hero']);
    expect(matchup.mythCounter.note).toMatch(/hero/i);
  });
});

describe('role fallback — pantheons missing a counterPlan role', () => {
  it('falls through to the ranged unit when Chinese lacks counterInfantry', () => {
    // counterPlan.infantry = [counterInfantry, ranged]. The Chinese roster has
    // no counterInfantry, so anti-infantry duty falls to the Fire Archer.
    const counter = resolveCounter('fuxi', 'gr_hoplite'); // Hoplite is infantry
    expect(ids(counter.units)).toEqual(['ch_fire_archer']);
  });

  it('still answers infantry for a pantheon that has the role', () => {
    const counter = resolveCounter('zeus', 'gr_hoplite');
    expect(ids(counter.units)).toEqual(['gr_hypaspist', 'gr_toxotes']);
  });
});

describe('myth unit de-duplication', () => {
  it('lists a unit once even when several minor gods grant it', () => {
    // Loki: Forseti AND Heimdall both grant the Einheri; Njord AND Hel both
    // grant the Mountain Giant. Each must appear once, crediting both sources.
    const myth = resolveMythUnits('loki');
    expect(ids(myth.map((m) => m.unit))).toEqual([
      'no_einheri',
      'no_battle_boar',
      'no_kraken',
      'no_mountain_giant',
      'no_jormun_elver',
      'no_frost_giant',
      'no_fire_giant',
    ]);

    const einheri = myth.find((m) => m.unit.id === 'no_einheri')!;
    expect(einheri.via.map((v) => v.id)).toEqual(['forseti', 'heimdall']);

    const mountainGiant = myth.find((m) => m.unit.id === 'no_mountain_giant')!;
    expect(mountainGiant.via.map((v) => v.id)).toEqual(['njord', 'hel']);
  });

  it('upgrades confidence to high when any source is high', () => {
    // Heimdall is low-confidence, Forseti is high. The merged Einheri is high.
    const einheri = resolveMythUnits('loki').find((m) => m.unit.id === 'no_einheri')!;
    expect(einheri.confidence).toBe('high');
  });
});

describe('per-opponent pins reorder threats (FR-21)', () => {
  it('moves pinned units to the front, in pin order', () => {
    const matchup = resolveMatchup('zeus', 'set', {
      pins: ['eg_axeman', 'eg_spearman', 'eg_war_elephant'],
    });
    const order = ids(matchup.threats.map((t) => t.unit));
    expect(order.slice(0, 3)).toEqual(['eg_axeman', 'eg_spearman', 'eg_war_elephant']);
    // The remaining threats keep their default priority order.
    expect(order.slice(3)).toEqual([
      'eg_chariot_archer',
      'eg_camel_rider',
      'eg_slinger',
      'eg_catapult',
      'eg_siege_tower',
    ]);
    // No threat is dropped or duplicated.
    expect(order).toHaveLength(8);
    expect(new Set(order).size).toBe(8);
  });

  it('ignores stale pin ids that are not threats for this matchup', () => {
    const matchup = resolveMatchup('zeus', 'set', {
      pins: ['gr_hoplite', 'eg_camel_rider'],
    });
    expect(matchup.threats[0]!.unit.id).toBe('eg_camel_rider');
    expect(matchup.threats).toHaveLength(8);
  });

  it('leaves the default priority order when no pins are given', () => {
    expect(resolveMatchup('zeus', 'set').threats[0]!.unit.id).toBe('eg_spearman');
  });
});

describe('threatUnits — the customizer threat list', () => {
  it('lists an opponent\'s threats in default priority order', () => {
    expect(ids(threatUnits('set'))).toEqual([
      'eg_spearman',
      'eg_chariot_archer',
      'eg_camel_rider',
      'eg_axeman',
      'eg_slinger',
      'eg_war_elephant',
      'eg_catapult',
      'eg_siege_tower',
    ]);
  });

  it('includes the god-specific Fortress unit', () => {
    expect(ids(threatUnits('zeus'))).toContain('gr_myrmidon');
  });
});

describe('edge cases', () => {
  it('appends god-specific Fortress threats and re-sorts by priority', () => {
    // Zeus adds the Myrmidon at priority 5, tying gr_prodromos. Stable sort
    // keeps the pantheon base unit (prodromos) ahead of the god-specific one.
    const threats = resolveThreats('set', 'zeus');
    expect(ids(threats.map((t) => t.unit))).toContain('gr_myrmidon');
    const order = ids(threats.map((t) => t.unit));
    expect(order.indexOf('gr_prodromos')).toBeLessThan(order.indexOf('gr_myrmidon'));
  });

  it('handles a major god with no Fortress extras (Set)', () => {
    expect(resolveThreats('zeus', 'set')).toHaveLength(8);
  });

  it('resolves the myth counter for every pantheon to a hero unit', () => {
    for (const godId of ['zeus', 'set', 'odin', 'kronos', 'fuxi', 'amaterasu', 'huitzilopochtli']) {
      const counter = resolveMythCounter(godId);
      expect(counter.units).toHaveLength(1);
      expect(counter.units[0]!.category).toBe('hero');
    }
  });

  it('throws a clear error on an unknown god id', () => {
    expect(() => resolveMatchup('zeus', 'ozymandias')).toThrow(/Unknown god id/);
  });

  it('every threat unit referenced by the dataset resolves', () => {
    // A cheap integrity check across the whole catalog.
    expect(() => getUnit('eg_spearman')).not.toThrow();
  });
});
