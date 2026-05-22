/**
 * Catalog view-models derived from counter-data.json.
 *
 * The god picker needs the 23 major gods grouped by pantheon, in display
 * order. The dataset stores gods and pantheons in separate keyed catalogs;
 * this rebuilds the grouped list the UI wants. Both catalogs are already in
 * the intended order (Greek, Egyptian, Norse, Atlantean, Chinese, Japanese,
 * Aztec — see requirements Appendix A), so insertion order is preserved.
 */

import { counterData } from './counterData';
import type { CounterData, GodId, PantheonId } from './schema';

export interface GodEntry {
  id: GodId;
  name: string;
  pantheon: PantheonId;
  portrait: string;
}

export interface PantheonEntry {
  id: PantheonId;
  label: string;
  gods: GodEntry[];
}

/** The 7 pantheons, each with its major gods, in picker display order. */
export function pantheonList(data: CounterData = counterData): PantheonEntry[] {
  const godsByPantheon = new Map<PantheonId, GodEntry[]>();
  for (const [id, god] of Object.entries(data.gods)) {
    const list = godsByPantheon.get(god.pantheon) ?? [];
    list.push({ id, name: god.name, pantheon: god.pantheon, portrait: god.portrait });
    godsByPantheon.set(god.pantheon, list);
  }

  return Object.entries(data.pantheons)
    .filter(([id]) => !id.startsWith('_'))
    .map(([id, pantheon]) => ({
      id,
      label: pantheon.label,
      gods: godsByPantheon.get(id) ?? [],
    }));
}
