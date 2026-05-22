/** A title-bar icon button (`.win-btn`) — close, minimise, expand, reorder. */

import type { ReactNode } from 'react';

interface WinButtonProps {
  title: string;
  onClick?: () => void;
  children: ReactNode;
  /** `close` tints the hover state red. */
  kind?: 'close';
  disabled?: boolean;
}

export function WinButton({ title, onClick, children, kind, disabled }: WinButtonProps) {
  return (
    <button
      type="button"
      className={`win-btn ${kind ?? ''}`}
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
