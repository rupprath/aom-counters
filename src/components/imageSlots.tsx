/**
 * Image-slot contents: a real Age of Mythology: Retold screenshot when one is
 * present, the neutral Silhouette until art ships.
 *
 * Images are bundled under `public/images/{units,gods}/{id}.png` (FR-11b) and
 * referenced by the path already stored in the dataset. God portraits have
 * shipped; unit screenshots have not, so those slots still fall back to the
 * silhouette — the slot dimensions, set by the parent CSS, are the contract
 * and do not change when art lands.
 */

import { useState } from 'react';
import { Silhouette } from '../shell/Silhouette';

/** Real god portrait, or a silhouette fallback. Fills its parent slot. */
export function GodImage({
  god,
  silhouetteSize,
}: {
  god: { portrait: string } | null;
  silhouetteSize: number;
}) {
  const [failed, setFailed] = useState(false);
  if (!god || failed) return <Silhouette size={silhouetteSize} kind="god" />;
  return (
    <img
      className="slot-img"
      src={`/${god.portrait}`}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

/** Real unit screenshot, or a silhouette fallback. Fills its parent slot. */
export function UnitImage({
  unit,
  silhouetteSize,
}: {
  unit: { image: string };
  silhouetteSize: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Silhouette size={silhouetteSize} kind="unit" />;
  return (
    <img
      className="slot-img"
      src={`/${unit.image}`}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
