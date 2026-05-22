/**
 * The bundled, read-only counter dataset.
 *
 * `counter-data.json` is the canonical curated dataset (schema v3). It ships
 * with the app and is loaded once at startup — see docs/README.md. The JSON's
 * inferred literal type is too wide to be useful, so it is cast once here to
 * the hand-written `CounterData` model and consumed typed everywhere else.
 */

import type { CounterData } from './schema';
import raw from './counter-data.json';

export const counterData = raw as unknown as CounterData;
