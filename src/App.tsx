/**
 * App shell — the window-mode state machine plus persistence.
 *
 * Holds the current footprint, the selected matchup, and the user's pins;
 * resolves the matchup from counter-data.json; and keeps the OS window sized
 * to match. Each footprint renders a view:
 *
 *   setup     → SetupView      pre-match god picker (360x600)
 *   collapsed → CollapsedView  the pip (FR-17)
 *   default   → StripView      compact strip overlay (FR-18)
 *   expanded  → StripView      full matchup strip (FR-19)
 *
 * Last-used gods, last footprint, and per-opponent pins persist to
 * user-settings.json: restored once on launch, saved on every change
 * (requirements section 5.7).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveMatchup } from './data/resolve';
import type { FootprintState, GodId, UnitId } from './data/schema';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './data/settings';
import { quitApp, setWindowMode } from './lib/tauri';
import type { WindowMode } from './lib/tauri';
import { CollapsedView } from './views/CollapsedView';
import { SetupView } from './views/SetupView';
import { StripView } from './views/StripView';

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<WindowMode>('setup');
  const [player, setPlayer] = useState<GodId | null>(null);
  const [opponent, setOpponent] = useState<GodId | null>(null);
  const [pins, setPins] = useState<Record<GodId, UnitId[]>>({});
  const [lastFootprint, setLastFootprint] = useState<FootprintState>('default');
  const [firstLaunch, setFirstLaunch] = useState(true);
  // Guards the persist effect from writing the freshly loaded settings
  // straight back, unchanged, on the run right after the initial load.
  const skipNextSave = useRef(true);

  // Restore persisted settings once, on launch.
  useEffect(() => {
    let cancelled = false;
    void loadSettings().then((settings) => {
      if (cancelled) return;
      setPins(settings.pinsByOpponentGod);
      setLastFootprint(settings.lastFootprintState);
      if (settings.lastPlayerGod && settings.lastOpponentGod) {
        setPlayer(settings.lastPlayerGod);
        setOpponent(settings.lastOpponentGod);
        setView(settings.lastFootprintState);
        setFirstLaunch(false);
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Remember the most recent in-match footprint, for restoration on relaunch.
  useEffect(() => {
    if (view !== 'setup') setLastFootprint(view);
  }, [view]);

  // Keep the OS window footprint in sync with the current view.
  useEffect(() => {
    void setWindowMode(view);
  }, [view]);

  // Persist settings whenever they change (but not during the initial load,
  // nor on the first run right after it — that would just re-write what was
  // just read).
  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    void saveSettings({
      schemaVersion: DEFAULT_SETTINGS.schemaVersion,
      lastPlayerGod: player,
      lastOpponentGod: opponent,
      lastFootprintState: lastFootprint,
      pinsByOpponentGod: pins,
    });
  }, [loaded, player, opponent, lastFootprint, pins]);

  // Save or clear an opponent god's threat pins (from the customizer).
  function handlePinsChange(opponentGodId: GodId, order: UnitId[] | null) {
    setPins((prev) => {
      if (order) return { ...prev, [opponentGodId]: order };
      const next = { ...prev };
      delete next[opponentGodId];
      return next;
    });
  }

  // Resolve the matchup once per selection/pin change; the views consume it.
  const matchup = useMemo(
    () =>
      player && opponent
        ? resolveMatchup(player, opponent, { pins: pins[opponent] })
        : null,
    [player, opponent, pins],
  );

  // Setup is shown for the setup footprint, and as a guard if no matchup yet.
  if (view === 'setup' || !matchup) {
    return (
      <SetupView
        firstLaunch={firstLaunch}
        initialPlayer={player}
        initialOpponent={opponent}
        pins={pins}
        onPinsChange={handlePinsChange}
        onConfirm={(nextPlayer, nextOpponent) => {
          setPlayer(nextPlayer);
          setOpponent(nextOpponent);
          setFirstLaunch(false);
          setView('default');
        }}
        onClose={() => {
          // Cancel discards the draft: return to the current matchup, or quit
          // if there is none yet (first launch).
          if (matchup) setView(lastFootprint);
          else void quitApp();
        }}
      />
    );
  }

  if (view === 'collapsed') {
    return <CollapsedView matchup={matchup} onExpand={() => setView('default')} />;
  }

  return (
    <StripView
      matchup={matchup}
      expanded={view === 'expanded'}
      onToggleExpand={() => setView(view === 'expanded' ? 'default' : 'expanded')}
      onMinimise={() => setView('collapsed')}
      onNewMatch={() => setView('setup')}
      onClose={() => void quitApp()}
    />
  );
}
