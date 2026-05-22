/**
 * Runtime resolution engine.
 *
 * Pure, framework-free functions that turn a (player god, opponent god) pair
 * into the data the UI renders. This is the core value of the app and is kept
 * deliberately free of React / Tauri so it can be unit-tested in isolation and
 * reused unchanged in a future web port.
 *
 * The algorithm follows docs/README.md "Runtime resolution":
 *
 *  1. Enemy threats  = pantheonThreats[opponent.pantheon] + godSpecificThreats[opponent],
 *                      ordered by priority.
 *  2. Enemy myth     = union of minorGods[m].mythUnits for every m in
 *                      godMinorChoices[opponent] across all three Ages; each
 *                      shown as "possible".
 *  3. Counter        = for a threat of category C, build counterPlan[C].roles
 *                      resolved through pantheons[player.pantheon].roster.
 *                      The enemy myth group always resolves to the player's hero.
 *  4. Override       = counterOverrides[player][threatUnit] replaces step 3.
 *
 * Role fallback: when counterPlan lists a role the player's pantheon lacks,
 * that role is skipped and the next role in the list is used instead (see
 * `_rosterNotes._appNote` in the dataset — e.g. the Chinese roster has no
 * counterInfantry, so anti-infantry duty falls through to the ranged unit).
 */

import type {
  Age,
  CategoryId,
  Confidence,
  CounterData,
  GodId,
  GodWithId,
  MinorGodId,
  Pantheon,
  RosterRole,
  ThreatEntry,
  UnitId,
  UnitWithId,
} from './schema';
import { counterData } from './counterData';

/* ---- resolved shapes ---------------------------------------------------- */

/** The recommended response to one threat (or to the myth group). */
export interface ResolvedCounter {
  /** Counter units in preference order. The first is the primary pick. */
  units: UnitWithId[];
  /** Plain-language tip from counterPlan. */
  note: string;
  /** True when a counterOverrides entry replaced the computed plan. */
  isOverride: boolean;
}

/** One enemy threat row: the unit, its default priority, and its counter. */
export interface ResolvedThreat {
  unit: UnitWithId;
  category: CategoryId;
  /** Default priority (1 = highest). Lower sorts first. */
  priority: number;
  counter: ResolvedCounter;
}

/** A minor god that makes a given myth unit possible for the opponent. */
export interface MythVia {
  id: MinorGodId;
  name: string;
  age: Age;
}

/** One possible enemy myth unit. Always "possible" — minor gods are untracked. */
export interface ResolvedMythUnit {
  unit: UnitWithId;
  /** Every minor god (across all Ages) that grants this unit. */
  via: MythVia[];
  /** "low" if any contributing attribution is low-confidence research. */
  confidence: Confidence;
}

/** The full resolved matchup the UI renders. */
export interface ResolvedMatchup {
  player: GodWithId;
  opponent: GodWithId;
  gamePatch: string;
  /** Enemy threats, ordered by default priority. */
  threats: ResolvedThreat[];
  /** Possible enemy myth units, treated as one combined group. */
  mythUnits: ResolvedMythUnit[];
  /** The single counter for the whole myth group: the player's hero. */
  mythCounter: ResolvedCounter;
}

/** Optional inputs to a resolution. */
export interface ResolveOptions {
  /** Dataset override, mainly for tests; defaults to the bundled dataset. */
  data?: CounterData;
  /**
   * The user's pinned threat order for this opponent (FR-21). Pinned units
   * lead, in this order; the rest follow in default priority order.
   */
  pins?: UnitId[];
}

/* ---- catalog lookups ---------------------------------------------------- */

export function getGod(godId: GodId, data: CounterData = counterData): GodWithId {
  const god = data.gods[godId];
  if (!god) throw new Error(`Unknown god id: "${godId}"`);
  return { ...god, id: godId };
}

export function getUnit(unitId: UnitId, data: CounterData = counterData): UnitWithId {
  const unit = data.units[unitId];
  if (!unit) throw new Error(`Unknown unit id: "${unitId}"`);
  return { ...unit, id: unitId };
}

/**
 * Resolve a counterPlan role list against a pantheon roster: each role becomes
 * the roster's unit for that role. Roles the pantheon lacks are skipped (role
 * fallback), and a unit reached by more than one role is kept once. Shared by
 * threat-counter and myth-counter resolution.
 */
function resolveRoles(
  roles: RosterRole[],
  roster: Pantheon['roster'],
  data: CounterData,
): UnitWithId[] {
  const seen = new Set<UnitId>();
  const units: UnitWithId[] = [];
  for (const role of roles) {
    const unitId = roster[role];
    if (unitId && !seen.has(unitId)) {
      seen.add(unitId);
      units.push(getUnit(unitId, data));
    }
  }
  return units;
}

/* ---- resolution --------------------------------------------------------- */

/**
 * Resolve the counter for a single enemy threat unit (steps 3 + 4).
 * Not used for myth units — see `resolveMythCounter`.
 */
export function resolveCounter(
  playerGodId: GodId,
  threatUnitId: UnitId,
  data: CounterData = counterData,
): ResolvedCounter {
  const player = getGod(playerGodId, data);
  const threat = getUnit(threatUnitId, data);
  const plan = data.counterPlan[threat.category];
  if (!plan) throw new Error(`No counterPlan for category "${threat.category}"`);

  // Step 4: a player-god-specific override replaces the computed plan.
  const override = data.counterOverrides[playerGodId]?.[threatUnitId];
  if (override && override.length > 0) {
    return {
      units: override.map((id) => getUnit(id, data)),
      note: plan.note,
      isOverride: true,
    };
  }

  // Step 3: resolve each planned role through the player's roster.
  const roster = data.pantheons[player.pantheon]?.roster;
  if (!roster) throw new Error(`No roster for pantheon "${player.pantheon}"`);

  return { units: resolveRoles(plan.roles, roster, data), note: plan.note, isOverride: false };
}

/**
 * Resolve the counter for the enemy myth group: always the player's hero
 * (counterPlan.myth -> the `hero` roster role).
 */
export function resolveMythCounter(
  playerGodId: GodId,
  data: CounterData = counterData,
): ResolvedCounter {
  const player = getGod(playerGodId, data);
  const plan = data.counterPlan.myth;
  const roster = data.pantheons[player.pantheon]?.roster;
  if (!roster) throw new Error(`No roster for pantheon "${player.pantheon}"`);

  return { units: resolveRoles(plan.roles, roster, data), note: plan.note, isOverride: false };
}

/**
 * The opponent's threat entries — pantheon base units plus the god's unique
 * extras — sorted by default priority. Sort is stable, so on a priority tie
 * the pantheon base unit precedes the god-specific extra.
 */
function sortedThreatEntries(opponentGodId: GodId, data: CounterData): ThreatEntry[] {
  const opponent = getGod(opponentGodId, data);
  const base = data.pantheonThreats[opponent.pantheon] ?? [];
  const specific = data.godSpecificThreats[opponentGodId] ?? [];
  return [...base, ...specific].slice().sort((a, b) => a.priority - b.priority);
}

/**
 * Reorder threats so the user's pinned units lead, in pin order, with the
 * remaining threats following in default priority order. Pin ids that are not
 * threats for this matchup (stale pins) are ignored; no threat is dropped.
 */
function applyPinOrder(threats: ResolvedThreat[], pins: UnitId[]): ResolvedThreat[] {
  const seen = new Set<UnitId>();
  const pinned: ResolvedThreat[] = [];
  for (const unitId of pins) {
    if (seen.has(unitId)) continue;
    const threat = threats.find((t) => t.unit.id === unitId);
    if (threat) {
      pinned.push(threat);
      seen.add(unitId);
    }
  }
  const rest = threats.filter((t) => !seen.has(t.unit.id));
  return [...pinned, ...rest];
}

/**
 * Resolve the ordered enemy threat list for a matchup (steps 1 + 3 + 4).
 * A pin order in `options.pins`, when present, overrides the default
 * priority ordering (FR-21).
 */
export function resolveThreats(
  playerGodId: GodId,
  opponentGodId: GodId,
  options: ResolveOptions = {},
): ResolvedThreat[] {
  const data = options.data ?? counterData;
  const threats = sortedThreatEntries(opponentGodId, data).map((entry) => {
    const unit = getUnit(entry.unit, data);
    return {
      unit,
      category: unit.category,
      priority: entry.priority,
      counter: resolveCounter(playerGodId, entry.unit, data),
    };
  });

  return options.pins && options.pins.length > 0
    ? applyPinOrder(threats, options.pins)
    : threats;
}

/**
 * The opponent's threat units in default priority order — no counters, no
 * pins applied. Used by the customization UI to list reorderable threats.
 */
export function threatUnits(
  opponentGodId: GodId,
  data: CounterData = counterData,
): UnitWithId[] {
  return sortedThreatEntries(opponentGodId, data).map((entry) => getUnit(entry.unit, data));
}

/**
 * Resolve the opponent's possible myth units (step 2): the union of myth units
 * granted by every minor god the opponent can choose, across all three Ages.
 * A unit reachable through more than one minor god is listed once, with every
 * granting minor god recorded in `via`. Returned in classical -> heroic ->
 * mythic discovery order.
 */
export function resolveMythUnits(
  opponentGodId: GodId,
  data: CounterData = counterData,
): ResolvedMythUnit[] {
  getGod(opponentGodId, data); // validate the id
  const choices = data.godMinorChoices[opponentGodId];
  if (!choices) throw new Error(`No minor-god choices for god "${opponentGodId}"`);

  const minorGodIds: MinorGodId[] = [
    ...choices.classical,
    ...choices.heroic,
    ...choices.mythic,
  ];

  const byUnit = new Map<UnitId, ResolvedMythUnit>();
  for (const minorGodId of minorGodIds) {
    const minorGod = data.minorGods[minorGodId];
    if (!minorGod) throw new Error(`Unknown minor god id: "${minorGodId}"`);

    for (const unitId of minorGod.mythUnits) {
      const via: MythVia = {
        id: minorGodId,
        name: minorGod.name,
        age: minorGod.age,
      };
      const existing = byUnit.get(unitId);
      if (existing) {
        existing.via.push(via);
        // Confidence is "high" if any contributing attribution is high.
        if (minorGod.confidence === 'high') existing.confidence = 'high';
      } else {
        byUnit.set(unitId, {
          unit: getUnit(unitId, data),
          via: [via],
          confidence: minorGod.confidence,
        });
      }
    }
  }

  return [...byUnit.values()];
}

/** Resolve a complete matchup: enemy threats, myth group, and all counters. */
export function resolveMatchup(
  playerGodId: GodId,
  opponentGodId: GodId,
  options: ResolveOptions = {},
): ResolvedMatchup {
  const data = options.data ?? counterData;
  return {
    player: getGod(playerGodId, data),
    opponent: getGod(opponentGodId, data),
    gamePatch: data.gamePatch,
    threats: resolveThreats(playerGodId, opponentGodId, options),
    mythUnits: resolveMythUnits(opponentGodId, data),
    mythCounter: resolveMythCounter(playerGodId, data),
  };
}
