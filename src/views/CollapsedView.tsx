/**
 * Collapsed footprint (FR-17) — the smallest state: a single small pip the
 * user can tuck into a corner. Clicking it expands back to the default strip.
 * The pip doubles as the window's drag handle.
 */

import { GodImage } from '../components/imageSlots';
import type { ResolvedMatchup } from '../data/resolve';

interface CollapsedViewProps {
  matchup: ResolvedMatchup;
  onExpand: () => void;
}

export function CollapsedView({ matchup, onExpand }: CollapsedViewProps) {
  const { player, opponent } = matchup;
  return (
    <div className="app-collapsed">
      <div
        className="pip"
        data-tauri-drag-region
        onClick={onExpand}
        title={`${player.name} vs ${opponent.name} — click to expand`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onExpand();
        }}
      >
        <div className="gods">
          <div className="pip-portrait p1">
            <GodImage god={player} silhouetteSize={12} />
          </div>
          <div className="pip-portrait p2">
            <GodImage god={opponent} silhouetteSize={12} />
          </div>
          <div className="pip-vs">VS</div>
        </div>
      </div>
    </div>
  );
}
