/**
 * Shared window chrome for the borderless overlay.
 *
 * `Grip` is the six-dot drag handle used by every footprint. `WinTitlebar` is
 * the full title bar — grip, centered title, close button — shared by the
 * setup-time screens (Setup, Customize, About). The Strip view has its own
 * richer bar and only reuses `Grip`.
 */

import { IconClose } from './icons';
import { WinButton } from './WinButton';

/** The six-dot drag handle. The whole element is a Tauri drag region. */
export function Grip() {
  return (
    <span className="grip" data-tauri-drag-region>
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

/** A `win-titlebar`: drag grip, centered title, and a close button. */
export function WinTitlebar({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="win-titlebar" data-tauri-drag-region>
      <Grip />
      <span className="win-title" data-tauri-drag-region>
        {title}
      </span>
      <div className="win-actions">
        <WinButton title="Close" kind="close" onClick={onClose}>
          {IconClose}
        </WinButton>
      </div>
    </div>
  );
}
