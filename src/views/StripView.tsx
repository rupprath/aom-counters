/**
 * Strip — the in-game always-on-top counter display, built to the design
 * handoff "Strip" spec. Two stacked regions: enemy threats on top, the units
 * to build against them below. Each column is a matchup pair — read down a
 * column to see what to queue against the unit above it.
 *
 * Footprints (FR-18/19): `default` summarises the enemy myth units as one
 * tile; `expanded` lists every possible myth unit by name. Both resolve to
 * the single hero counter (FR-13). The two tracks scroll in lockstep so the
 * paired columns stay aligned.
 */

import { useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { GodImage, UnitImage } from '../components/imageSlots';
import { counterData } from '../data/counterData';
import type { ResolvedMatchup } from '../data/resolve';
import type { UnitWithId } from '../data/schema';
import { IconClose, IconCollapse, IconExpand, IconMinus, IconSwap } from '../shell/icons';
import { Silhouette } from '../shell/Silhouette';
import { WinButton } from '../shell/WinButton';
import { Grip } from '../shell/WinTitlebar';

/** The patch number alone, e.g. "19.10195" from "19.10195 Obsidian Mirror". */
const PATCH = counterData.gamePatch.split(' ')[0] ?? counterData.gamePatch;

/** Identifies a threat-counter column pair for hover linking ('myth' = group). */
type PairKey = string;

interface HoverProps {
  hovered: PairKey | null;
  setHovered: (key: PairKey | null) => void;
}

/** The 44x44 image slot inside a strip column, with its category edge stripe. */
function StripImg({ unit, silhouetteSize }: { unit: UnitWithId; silhouetteSize: number }) {
  return (
    <div className={`img cat-${unit.category} ${unit.category === 'myth' ? 'myth' : ''}`}>
      <span className="edge" />
      <UnitImage unit={unit} silhouetteSize={silhouetteSize} />
    </div>
  );
}

/** The category label line under a unit (FR-10: category + name + image). */
function CategoryCaption({ unit }: { unit: UnitWithId }) {
  return <div className={`cat cat-${unit.category}`}>{unit.category.toUpperCase()}</div>;
}

/** One matchup column — an enemy threat or its recommended counter. */
function UnitCol({
  unit,
  pairKey,
  caption,
  possible,
  hovered,
  setHovered,
}: HoverProps & {
  unit: UnitWithId;
  pairKey: PairKey;
  caption: ReactNode;
  possible?: boolean;
}) {
  const isMyth = unit.category === 'myth';
  const classes = ['col'];
  if (possible) classes.push('possible');
  if (isMyth) classes.push('myth-col');
  if (hovered === pairKey) classes.push('pair-hover');
  return (
    <div
      className={classes.join(' ')}
      onMouseEnter={() => setHovered(pairKey)}
      onMouseLeave={() => setHovered(null)}
      title={unit.name}
    >
      <StripImg unit={unit} silhouetteSize={isMyth ? 18 : 22} />
      <div className="name">{unit.name}</div>
      {caption}
    </div>
  );
}

/** Default footprint: the whole myth group shown as one summary tile (FR-14). */
function MythSummaryCol({
  count,
  onExpand,
  hovered,
  setHovered,
}: HoverProps & { count: number; onExpand: () => void }) {
  return (
    <button
      type="button"
      className={`col myth-summary ${hovered === 'myth' ? 'pair-hover' : ''}`}
      onMouseEnter={() => setHovered('myth')}
      onMouseLeave={() => setHovered(null)}
      onClick={onExpand}
      title={`Show ${count} possible myth units`}
    >
      <div className="img myth stack">
        <span className="edge" />
        <span className="t t3" />
        <span className="t t2" />
        <span className="t t1">
          <Silhouette size={18} kind="unit" />
        </span>
        <span className="badge">×{count}</span>
      </div>
      <div className="name">Myth units</div>
      <div className="via">
        {count} possible
        <span className="chev">▾</span>
      </div>
    </button>
  );
}

/** The single hero cell that answers the entire enemy myth group (FR-13). */
function HeroZone({
  hero,
  mythCount,
  expanded,
  hovered,
  setHovered,
}: HoverProps & { hero: UnitWithId; mythCount: number; expanded: boolean }) {
  return (
    <div
      className={`hero-zone ${hovered === 'myth' ? 'hov' : ''}`}
      onMouseEnter={() => setHovered('myth')}
      onMouseLeave={() => setHovered(null)}
    >
      <div className="img cat-hero">
        <span className="edge" />
        <UnitImage unit={hero} silhouetteSize={20} />
      </div>
      <div className="body">
        <div className="name">{hero.name}</div>
        <div className="sub">
          {expanded ? `Beats all ${mythCount} myth units` : 'Beats every myth unit'}
        </div>
      </div>
    </div>
  );
}

interface StripViewProps {
  matchup: ResolvedMatchup;
  expanded: boolean;
  onToggleExpand: () => void;
  onMinimise: () => void;
  onNewMatch: () => void;
  onClose: () => void;
}

export function StripView({
  matchup,
  expanded,
  onToggleExpand,
  onMinimise,
  onNewMatch,
  onClose,
}: StripViewProps) {
  const [hovered, setHovered] = useState<PairKey | null>(null);
  const enemyTrack = useRef<HTMLDivElement>(null);
  const counterTrack = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  // Keep the two horizontal tracks aligned so each column reads top-to-bottom.
  function syncScroll(from: RefObject<HTMLDivElement>, to: RefObject<HTMLDivElement>) {
    if (syncing.current) return;
    const source = from.current;
    const target = to.current;
    if (!source || !target) return;
    syncing.current = true;
    target.scrollLeft = source.scrollLeft;
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }

  const { player, opponent, threats, mythUnits, mythCounter } = matchup;
  const hero = mythCounter.units[0];
  const showMyth = mythUnits.length > 0;
  const hover: HoverProps = { hovered, setHovered };

  return (
    <div className="strip">
      <div className="strip-bar" data-tauri-drag-region>
        <Grip />
        <span className="vs-mini" data-tauri-drag-region>
          <span className="gp p1">
            <GodImage god={player} silhouetteSize={10} />
          </span>
          <span className="glyph">{player.name}</span>
          <span className="arrow">→</span>
          <span className="glyph">{opponent.name}</span>
          <span className="gp p2">
            <GodImage god={opponent} silhouetteSize={10} />
          </span>
        </span>
        <span className="meta" data-tauri-drag-region>
          AOM Patch: {PATCH}
        </span>
        <span className="strip-actions">
          <button
            type="button"
            className="new-match-btn"
            onClick={onNewMatch}
            title="Pick a new matchup"
          >
            {IconSwap}
            <span>New match</span>
          </button>
          <WinButton
            title={expanded ? 'Collapse to compact view' : 'Expand to full matchup'}
            onClick={onToggleExpand}
          >
            {expanded ? IconCollapse : IconExpand}
          </WinButton>
          <WinButton title="Collapse to icon" onClick={onMinimise}>
            {IconMinus}
          </WinButton>
          <WinButton title="Close" kind="close" onClick={onClose}>
            {IconClose}
          </WinButton>
        </span>
      </div>

      <div className="strip-body">
        {/* Enemy threats */}
        <div className="strip-row enemy">
          <div className="row-label enemy">
            <div className="kicker">They build</div>
            <div className="head">Enemy uses</div>
          </div>
          <div
            className="row-track"
            ref={enemyTrack}
            onScroll={() => syncScroll(enemyTrack, counterTrack)}
          >
            {threats.map((threat) => (
              <UnitCol
                key={threat.unit.id}
                unit={threat.unit}
                pairKey={threat.unit.id}
                caption={<CategoryCaption unit={threat.unit} />}
                {...hover}
              />
            ))}
            {showMyth && (
              <>
                <div className="myth-divider" />
                {expanded ? (
                  <>
                    {mythUnits.map((myth) => (
                      <UnitCol
                        key={myth.unit.id}
                        unit={myth.unit}
                        pairKey="myth"
                        possible
                        caption={<div className="via">via {myth.via[0]?.name ?? '—'}</div>}
                        {...hover}
                      />
                    ))}
                    <button
                      type="button"
                      className="myth-fold"
                      onClick={onToggleExpand}
                      title="Collapse myth list"
                    >
                      ▴
                    </button>
                  </>
                ) : (
                  <MythSummaryCol count={mythUnits.length} onExpand={onToggleExpand} {...hover} />
                )}
              </>
            )}
            <div className="row-end" />
          </div>
        </div>

        {/* Recommended counters */}
        <div className="strip-row counter">
          <div className="row-label counter">
            <div className="kicker">You build</div>
            <div className="head">Counter with</div>
          </div>
          <div
            className="row-track"
            ref={counterTrack}
            onScroll={() => syncScroll(counterTrack, enemyTrack)}
          >
            {threats.map((threat) => {
              const counterUnit = threat.counter.units[0];
              if (!counterUnit) return null;
              return (
                <UnitCol
                  key={threat.unit.id}
                  unit={counterUnit}
                  pairKey={threat.unit.id}
                  caption={<CategoryCaption unit={counterUnit} />}
                  {...hover}
                />
              );
            })}
            {showMyth && hero && (
              <>
                <div className="myth-divider" />
                <HeroZone
                  hero={hero}
                  mythCount={mythUnits.length}
                  expanded={expanded}
                  {...hover}
                />
              </>
            )}
            <div className="row-end" />
          </div>
        </div>
      </div>
    </div>
  );
}
