/**
 * A circular god portrait slot (`.god-portrait`). Used by the setup picker —
 * in the vs-strip (32px, role-ringed) and the pantheon grid (40px, plain).
 */

import { GodImage } from './imageSlots';

interface GodPortraitProps {
  god: { portrait: string } | null;
  size: number;
  /** Rings the portrait cyan (player) or orange (opponent) when a god is set. */
  role?: 'player' | 'opponent';
}

export function GodPortrait({ god, size, role }: GodPortraitProps) {
  const ring =
    role === 'player'
      ? 'var(--select)'
      : role === 'opponent'
        ? 'var(--threat)'
        : 'var(--line)';
  return (
    <div
      className="god-portrait"
      style={{
        width: size,
        height: size,
        borderColor: god ? ring : undefined,
        boxShadow: god && role ? `0 0 0 1px ${ring} inset` : undefined,
      }}
    >
      <GodImage god={god} silhouetteSize={Math.round(size * 0.55)} />
    </div>
  );
}
