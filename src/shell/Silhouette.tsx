/**
 * Image-slot placeholder. Every unit tile and god portrait is a fixed-size
 * image slot; until the real Age of Mythology: Retold screenshots land in
 * `images/units/{id}.png` / `images/gods/{id}.png`, a neutral silhouette
 * stands in. The slot dimensions — not this component — are the contract:
 * a real <img> drops in later without the layout shifting.
 *
 * Kept as the graceful fallback for missing assets even after art ships.
 */

interface SilhouetteProps {
  size?: number;
  kind?: 'unit' | 'god';
}

export function Silhouette({ size = 22, kind = 'unit' }: SilhouetteProps) {
  if (kind === 'god') {
    // Head + narrower bust — a portrait crop.
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="slot-silhouette"
      >
        <circle cx="12" cy="9" r="3.4" fill="currentColor" />
        <path
          d="M5.5 21c1.4-3.4 4.2-5.1 6.5-5.1s5.1 1.7 6.5 5.1v.6H5.5z"
          fill="currentColor"
        />
      </svg>
    );
  }
  // Head + broader shoulders — a combatant stance.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="slot-silhouette"
    >
      <circle cx="12" cy="8.5" r="3.4" fill="currentColor" />
      <path
        d="M3.6 21c1.4-3.7 4.6-5.7 8.4-5.7s7 2 8.4 5.7v.6H3.6z"
        fill="currentColor"
      />
    </svg>
  );
}
