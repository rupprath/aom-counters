/**
 * Customize screen — the per-opponent threat-priority editor (FR-21..24).
 *
 * A power-user, setup-time feature: reorder which of an opponent god's units
 * are prioritised in the compact strip. Pins attach to the opponent god
 * (FR-22), so the editor is keyed on the opponent alone. Saving stores the
 * order as that god's pins; resetting to the researched default clears them.
 */

import { useMemo, useState } from 'react';
import { UnitImage } from '../components/imageSlots';
import { GodPortrait } from '../components/GodPortrait';
import { counterData } from '../data/counterData';
import { threatUnits } from '../data/resolve';
import type { GodId, UnitId } from '../data/schema';
import { IconDown, IconUp } from '../shell/icons';
import { WinButton } from '../shell/WinButton';
import { WinTitlebar } from '../shell/WinTitlebar';

interface CustomizeViewProps {
  opponentGodId: GodId;
  /** The opponent's currently saved pin order, if any. */
  currentPins: UnitId[] | undefined;
  /** Save: a unit-id order, or null to clear the pin (use the defaults). */
  onSave: (order: UnitId[] | null) => void;
  onClose: () => void;
}

/**
 * Reconcile a saved pin list against the live threat list: drop stale ids,
 * append any threats the pins do not mention, and fall back to the default
 * order when there are no pins.
 */
function reconcile(pins: UnitId[] | undefined, defaultOrder: UnitId[]): UnitId[] {
  if (!pins) return [...defaultOrder];
  const known = new Set(defaultOrder);
  const seen = new Set<UnitId>();
  const result: UnitId[] = [];
  for (const id of pins) {
    if (known.has(id) && !seen.has(id)) {
      result.push(id);
      seen.add(id);
    }
  }
  for (const id of defaultOrder) {
    if (!seen.has(id)) result.push(id);
  }
  return result;
}

const sameOrder = (a: UnitId[], b: UnitId[]): boolean =>
  a.length === b.length && a.every((id, i) => id === b[i]);

export function CustomizeView({
  opponentGodId,
  currentPins,
  onSave,
  onClose,
}: CustomizeViewProps) {
  const opponent = counterData.gods[opponentGodId]!;
  const units = useMemo(() => threatUnits(opponentGodId), [opponentGodId]);
  const defaultOrder = useMemo(() => units.map((u) => u.id), [units]);
  const unitById = useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);

  const [order, setOrder] = useState<UnitId[]>(() => reconcile(currentPins, defaultOrder));

  const isDefault = sameOrder(order, defaultOrder);

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setOrder(next);
  }

  return (
    <div className="win">
      <WinTitlebar title="AOM Counters · Customize" onClose={onClose} />

      <div className="sub-header">
        <GodPortrait god={opponent} size={40} role="opponent" />
        <div style={{ minWidth: 0 }}>
          <div className="sub-eyebrow">Threat priority</div>
          <div className="sub-title">{opponent.name}</div>
        </div>
      </div>

      <div className="sub-hint">
        <span>
          Reorder how {opponent.name}'s units rank in the compact strip. The
          researched defaults work well — change only what you prefer.
        </span>
        <button
          type="button"
          className="btn ghost"
          style={{ alignSelf: 'flex-start' }}
          disabled={isDefault}
          onClick={() => setOrder([...defaultOrder])}
        >
          Reset to default order
        </button>
      </div>

      <div className="scroll" style={{ flex: 1 }}>
        {order.map((id, index) => {
          const unit = unitById.get(id);
          if (!unit) return null;
          return (
            <div className="unit-row" key={id}>
              <div className={`unit-tile cat-${unit.category}`}>
                <span className="cat-edge" />
                <UnitImage unit={unit} silhouetteSize={20} />
              </div>
              <div className="unit-meta">
                <div className="unit-name">{unit.name}</div>
                <div className={`unit-sub cat-${unit.category}`}>
                  <span className="dot" />
                  {unit.category.toUpperCase()}
                </div>
              </div>
              <div className="reorder">
                <WinButton
                  title="Move up"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                >
                  {IconUp}
                </WinButton>
                <WinButton
                  title="Move down"
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                >
                  {IconDown}
                </WinButton>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sub-footer">
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="btn primary"
          onClick={() => onSave(isDefault ? null : order)}
        >
          Save
        </button>
      </div>
    </div>
  );
}
