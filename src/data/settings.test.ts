import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings } from './settings';

describe('parseSettings', () => {
  it('falls back to defaults for invalid JSON', () => {
    expect(parseSettings('not json at all')).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to defaults for a non-object payload', () => {
    expect(parseSettings('42')).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to defaults for an unknown schema version', () => {
    expect(parseSettings(JSON.stringify({ schemaVersion: 99 }))).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid gods and footprint', () => {
    const settings = parseSettings(
      JSON.stringify({
        schemaVersion: 1,
        lastPlayerGod: 'zeus',
        lastOpponentGod: 'set',
        lastFootprintState: 'expanded',
        pinsByOpponentGod: {},
      }),
    );
    expect(settings.lastPlayerGod).toBe('zeus');
    expect(settings.lastOpponentGod).toBe('set');
    expect(settings.lastFootprintState).toBe('expanded');
  });

  it('repairs unknown god ids and an invalid footprint', () => {
    const settings = parseSettings(
      JSON.stringify({
        schemaVersion: 1,
        lastPlayerGod: 'ozymandias',
        lastOpponentGod: 42,
        lastFootprintState: 'gigantic',
        pinsByOpponentGod: {},
      }),
    );
    expect(settings.lastPlayerGod).toBeNull();
    expect(settings.lastOpponentGod).toBeNull();
    expect(settings.lastFootprintState).toBe('default');
  });

  it('keeps per-opponent pins and ignores the _comment key', () => {
    // Matches the shape of the shipped user-settings.example.json.
    const settings = parseSettings(
      JSON.stringify({
        schemaVersion: 1,
        lastPlayerGod: null,
        lastOpponentGod: null,
        lastFootprintState: 'default',
        pinsByOpponentGod: {
          _comment: 'documentation, ignored at runtime',
          set: ['eg_axeman', 'eg_spearman', 'eg_war_elephant'],
          notagod: ['x'],
        },
      }),
    );
    expect(settings.pinsByOpponentGod).toEqual({
      set: ['eg_axeman', 'eg_spearman', 'eg_war_elephant'],
    });
  });
});
