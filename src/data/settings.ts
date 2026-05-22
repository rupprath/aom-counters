/**
 * User settings — local persistence of last-used gods, last footprint, and
 * per-opponent pins (requirements section 5.7 / DR-19).
 *
 * The settings file (`user-settings.json`) is read and written through thin
 * Tauri commands; all the logic — defaults, validation, schema migration —
 * lives here in the frontend. The file is human-editable JSON, so anything
 * stale or malformed is repaired on load rather than trusted blindly.
 */

import { readSettingsFile, writeSettingsFile } from '../lib/tauri';
import { counterData } from './counterData';
import type { FootprintState, GodId, UnitId, UserSettings } from './schema';

/** Current settings schema version (DR-10). Bump when the shape changes. */
export const SETTINGS_SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: UserSettings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  lastPlayerGod: null,
  lastOpponentGod: null,
  lastFootprintState: 'default',
  pinsByOpponentGod: {},
};

function isGodId(value: unknown): value is GodId {
  return typeof value === 'string' && Object.hasOwn(counterData.gods, value);
}

function isFootprintState(value: unknown): value is FootprintState {
  return value === 'collapsed' || value === 'default' || value === 'expanded';
}

/** Keep only valid per-god pin lists; drops the `_comment` key and stale ids. */
function parsePins(value: unknown): Record<GodId, UnitId[]> {
  const pins: Record<GodId, UnitId[]> = {};
  if (typeof value !== 'object' || value === null) return pins;
  for (const [godId, list] of Object.entries(value as Record<string, unknown>)) {
    if (!isGodId(godId) || !Array.isArray(list)) continue;
    const unitIds = list.filter((id): id is string => typeof id === 'string');
    if (unitIds.length > 0) pins[godId] = unitIds;
  }
  return pins;
}

/**
 * Parse raw settings JSON into a validated `UserSettings`. Invalid JSON, an
 * unknown schema version, or stale ids all fall back to defaults — the app
 * never crashes on a bad settings file.
 */
export function parseSettings(raw: string): UserSettings {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ...DEFAULT_SETTINGS };
  }
  const obj = parsed as Record<string, unknown>;

  // Only schema v1 is known. An unknown version may be a newer format from a
  // later app build — start fresh rather than misread it.
  if (obj.schemaVersion !== SETTINGS_SCHEMA_VERSION) {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    lastPlayerGod: isGodId(obj.lastPlayerGod) ? obj.lastPlayerGod : null,
    lastOpponentGod: isGodId(obj.lastOpponentGod) ? obj.lastOpponentGod : null,
    lastFootprintState: isFootprintState(obj.lastFootprintState)
      ? obj.lastFootprintState
      : DEFAULT_SETTINGS.lastFootprintState,
    pinsByOpponentGod: parsePins(obj.pinsByOpponentGod),
  };
}

/** Load and validate the persisted settings (defaults if none/invalid). */
export async function loadSettings(): Promise<UserSettings> {
  const raw = await readSettingsFile();
  return raw === null ? { ...DEFAULT_SETTINGS } : parseSettings(raw);
}

/** Persist settings as pretty-printed, human-editable JSON. */
export async function saveSettings(settings: UserSettings): Promise<void> {
  await writeSettingsFile(`${JSON.stringify(settings, null, 2)}\n`);
}
