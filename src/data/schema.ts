/**
 * TypeScript model for counter-data.json (schema v3) and user-settings.json.
 *
 * The dataset is normalized: catalogs are keyed by id, everything else
 * references those ids. See docs/README.md for the authoritative description.
 *
 * Keys beginning with `_` in the JSON are documentation and are ignored at
 * runtime. They are not modelled here; resolution code only ever accesses
 * sections by a known id, so `_comment` siblings are never touched.
 */

export type PantheonId = string;
export type GodId = string;
export type UnitId = string;
export type MinorGodId = string;

export type CategoryId =
  | 'infantry'
  | 'ranged'
  | 'cavalry'
  | 'siege'
  | 'myth'
  | 'hero'
  | 'building';

/** Roles used as keys in a pantheon roster and referenced by counterPlan. */
export type RosterRole =
  | 'infantry'
  | 'ranged'
  | 'cavalry'
  | 'siege'
  | 'hero'
  | 'counterInfantry'
  | 'counterRanged'
  | 'counterCavalry';

export type Age = 'classical' | 'heroic' | 'mythic';
export type Confidence = 'high' | 'low';

export interface Category {
  label: string;
  description: string;
}

export interface CounterPlanEntry {
  /** Roster roles to build against this enemy category, in preference order. */
  roles: RosterRole[];
  /** Plain-language tip shown in the app. */
  note: string;
}

export interface Pantheon {
  label: string;
  /** A pantheon may lack some roles (e.g. Norse has no `ranged`). */
  roster: Partial<Record<RosterRole, UnitId>>;
}

export interface God {
  name: string;
  pantheon: PantheonId;
  portrait: string;
}

export interface Unit {
  name: string;
  category: CategoryId;
  pantheon: PantheonId;
  image: string;
  isMyth: boolean;
  /** Fortress/unique units are restricted to one major god. */
  uniqueTo?: GodId;
}

export interface MinorGod {
  name: string;
  pantheon: PantheonId;
  age: Age;
  mythUnits: UnitId[];
  confidence: Confidence;
}

export interface GodMinorChoices {
  classical: MinorGodId[];
  heroic: MinorGodId[];
  mythic: MinorGodId[];
}

export interface ThreatEntry {
  unit: UnitId;
  priority: number;
}

/**
 * A player-god-specific exception to counterPlan. The dataset ships this
 * section empty; modelled here as an ordered list of counter unit ids that
 * replaces the computed recommendation.
 */
export type CounterOverride = UnitId[];

/**
 * Only the sections the resolution engine reads are modelled here.
 * `counter-data.json` also carries `counterRoles` and `categoryCounters`, plus
 * a per-unit `counterRole` tag — curator reference that no runtime code
 * consumes, so they are deliberately left untyped.
 */
export interface CounterData {
  schemaVersion: number;
  gamePatch: string;
  lastUpdated: string;
  categories: Record<CategoryId, Category>;
  counterPlan: Record<CategoryId, CounterPlanEntry>;
  pantheons: Record<PantheonId, Pantheon>;
  gods: Record<GodId, God>;
  units: Record<UnitId, Unit>;
  minorGods: Record<MinorGodId, MinorGod>;
  godMinorChoices: Record<GodId, GodMinorChoices>;
  pantheonThreats: Record<PantheonId, ThreatEntry[]>;
  godSpecificThreats: Record<GodId, ThreatEntry[]>;
  counterOverrides: Record<GodId, Record<UnitId, CounterOverride>>;
}

/** A catalog entry paired with its id, for convenient runtime use. */
export type WithId<T> = T & { id: string };
export type GodWithId = WithId<God>;
export type UnitWithId = WithId<Unit>;

/* ---- user-settings.json (schema v1) ------------------------------------- */

export type FootprintState = 'collapsed' | 'default' | 'expanded';

export interface UserSettings {
  schemaVersion: number;
  lastPlayerGod: GodId | null;
  lastOpponentGod: GodId | null;
  lastFootprintState: FootprintState;
  /** Per-opponent-god ordered unit-id lists overriding default threat order. */
  pinsByOpponentGod: Record<GodId, UnitId[]>;
}
