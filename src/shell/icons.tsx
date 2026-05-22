/**
 * Inline SVG glyphs for the window chrome. Lifted from the design prototype's
 * `app.jsx`; no external icon set is used (keeps the bundle tiny and offline).
 */

export const IconClose = (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const IconMinus = (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const IconSwap = (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.5 5.5h8M9 3l2.5 2.5L9 8M12.5 10.5h-8M7 8l-2.5 2.5L7 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Outward arrows — switch to the expanded footprint. */
export const IconExpand = (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M9 2h5v5M14 2L9.5 6.5M7 14H2V9M2 14l4.5-4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Chevron up — move a list item earlier. */
export const IconUp = (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.5 10.5L8 6l4.5 4.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Chevron down — move a list item later. */
export const IconDown = (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.5 5.5L8 10l4.5-4.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Inward arrows — switch back to the default (compact) footprint. */
export const IconCollapse = (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M13 3L8.5 7.5M8.5 7.5H13M8.5 7.5V3M3 13l4.5-4.5M7.5 8.5H3M7.5 8.5V13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
