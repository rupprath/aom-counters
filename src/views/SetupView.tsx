/**
 * Setup screen — the pre-match god picker (360x600), built to the design
 * handoff "Setup · first launch" spec.
 *
 * Flow: click a vs-slot to make it active, click a god to fill it. Picking
 * the player auto-advances to the opponent slot. A god already chosen for the
 * other slot is dimmed and disabled. Once both are set the footer confirms.
 *
 * Selection is held as a local draft, seeded from the current matchup. Only
 * "Start matchup" commits it; Cancel / close discard the draft and leave the
 * current matchup untouched (per the handoff).
 *
 * The setup screen is also the hub for the two setup-time sub-screens: the
 * per-opponent threat customizer (FR-21) and the About screen. They render in
 * place of the picker, so the picker's draft survives the round trip.
 */

import { useEffect, useState } from 'react';
import { GodPortrait } from '../components/GodPortrait';
import { pantheonList } from '../data/catalog';
import { counterData } from '../data/counterData';
import type { GodId, UnitId } from '../data/schema';
import { checkForUpdate } from '../lib/updateCheck';
import type { UpdateInfo } from '../lib/updateCheck';
import { WinTitlebar } from '../shell/WinTitlebar';
import { AboutView } from './AboutView';
import { CustomizeView } from './CustomizeView';

type Slot = 'player' | 'opponent';
type SubScreen = 'customize' | 'about' | null;

interface SetupViewProps {
  firstLaunch: boolean;
  /** The current matchup's gods, used to seed the picker draft. */
  initialPlayer: GodId | null;
  initialOpponent: GodId | null;
  /** Per-opponent pins, for the customizer sub-screen. */
  pins: Record<GodId, UnitId[]>;
  onConfirm: (player: GodId, opponent: GodId) => void;
  onClose: () => void;
  /** Save (order) or clear (null) the pins for an opponent god. */
  onPinsChange: (opponentGodId: GodId, order: UnitId[] | null) => void;
}

const PANTHEONS = pantheonList();

export function SetupView({
  firstLaunch,
  initialPlayer,
  initialOpponent,
  pins,
  onConfirm,
  onClose,
  onPinsChange,
}: SetupViewProps) {
  const [player, setPlayer] = useState<GodId | null>(initialPlayer);
  const [opponent, setOpponent] = useState<GodId | null>(initialOpponent);
  // The active slot starts on the player, unless one is already chosen.
  const [slot, setSlot] = useState<Slot>(initialPlayer ? 'opponent' : 'player');
  const [sub, setSub] = useState<SubScreen>(null);
  // A newer release, if one exists. The check runs once per session, in the
  // background, and fails silently — surfaced only as a badge and an About row.
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    void checkForUpdate().then((info) => {
      if (!cancelled) setUpdateInfo(info);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sub-screens render in place of the picker; the draft above is preserved.
  if (sub === 'customize' && opponent) {
    return (
      <CustomizeView
        opponentGodId={opponent}
        currentPins={pins[opponent]}
        onSave={(order) => {
          onPinsChange(opponent, order);
          setSub(null);
        }}
        onClose={() => setSub(null)}
      />
    );
  }
  if (sub === 'about') {
    return <AboutView onClose={() => setSub(null)} updateInfo={updateInfo} />;
  }

  const ready = player !== null && opponent !== null;
  // The welcome banner shows on first launch, or whenever both slots are empty.
  const showIntro = firstLaunch || (player === null && opponent === null);
  // Customization is a power-user feature: never surfaced on first launch.
  const showCustomize = opponent !== null && !firstLaunch;

  const godName = (id: GodId | null): string | null =>
    id ? (counterData.gods[id]?.name ?? null) : null;

  function pick(godId: GodId) {
    if (slot === 'player') {
      setPlayer(godId);
      if (opponent === null) setSlot('opponent');
    } else {
      setOpponent(godId);
    }
  }

  return (
    <div className="win">
      <WinTitlebar
        title={`AOM Counters · ${firstLaunch ? 'Welcome' : 'Setup'}`}
        onClose={onClose}
      />

      {showIntro && (
        <div className="setup-intro">
          <div className="setup-intro-eyebrow">
            {firstLaunch ? 'Welcome — first match' : 'New match'}
          </div>
          <div className="setup-intro-msg">
            Pick the god <b>you're playing</b> first, then your opponent's.
          </div>
          <div className="setup-intro-steps">
            <span className={`step ${slot === 'player' ? 'active' : player ? 'done' : ''}`}>
              <span className="n">1</span> Your god
            </span>
            <span className="step-sep" />
            <span className={`step ${slot === 'opponent' ? 'active' : opponent ? 'done' : ''}`}>
              <span className="n">2</span> Opponent
            </span>
          </div>
        </div>
      )}

      <div className="vs-strip">
        <button
          type="button"
          className={`vs-slot player ${slot === 'player' ? 'ring' : ''} ${player ? '' : 'empty'}`}
          onClick={() => setSlot('player')}
        >
          <GodPortrait god={player ? counterData.gods[player]! : null} size={32} role="player" />
          <div style={{ minWidth: 0 }}>
            <div className="vs-label">You play</div>
            <div className="vs-name">{godName(player) ?? 'Tap to pick'}</div>
          </div>
        </button>
        <span className="vs-sep">VS</span>
        <button
          type="button"
          className={`vs-slot opponent ${slot === 'opponent' ? 'ring' : ''} ${opponent ? '' : 'empty'}`}
          onClick={() => setSlot('opponent')}
        >
          <GodPortrait
            god={opponent ? counterData.gods[opponent]! : null}
            size={32}
            role="opponent"
          />
          <div style={{ minWidth: 0 }}>
            <div className="vs-label">Opponent</div>
            <div className="vs-name">{godName(opponent) ?? 'Tap to pick'}</div>
          </div>
        </button>
      </div>

      <div className="scroll" style={{ flex: 1 }}>
        {PANTHEONS.map((pantheon) => (
          <div key={pantheon.id}>
            <div className="pantheon-hd">
              <span>{pantheon.label}</span>
              <span className="rule" />
              <span style={{ color: 'var(--text-faint)' }}>{pantheon.gods.length}</span>
            </div>
            <div className="god-grid">
              {pantheon.gods.map((god) => {
                const selected =
                  (slot === 'player' && player === god.id) ||
                  (slot === 'opponent' && opponent === god.id);
                const takenByOther =
                  (slot === 'player' && opponent === god.id) ||
                  (slot === 'opponent' && player === god.id);
                return (
                  <button
                    key={god.id}
                    type="button"
                    className={`god-cell ${selected ? 'selected' : ''}`}
                    onClick={() => pick(god.id)}
                    disabled={takenByOther}
                    style={takenByOther ? { opacity: 0.32, cursor: 'default' } : undefined}
                    title={
                      takenByOther ? `${god.name} is already the other god` : god.name
                    }
                  >
                    <GodPortrait god={god} size={40} />
                    <div className="god-name">{god.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showCustomize && opponent && (
        <div className="customize-bar">
          <button
            type="button"
            className="btn ghost"
            onClick={() => setSub('customize')}
            title={`Reorder ${godName(opponent)}'s threat priority`}
          >
            ⚙ Customize {godName(opponent)}'s threats
          </button>
        </div>
      )}

      <div className="sub-footer">
        <button
          type="button"
          className="btn ghost"
          onClick={() => setSub('about')}
          title={updateInfo ? `Update available — v${updateInfo.latest}` : undefined}
        >
          About
          {updateInfo && <span className="update-badge" aria-hidden="true" />}
        </button>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="btn primary"
          disabled={!ready}
          onClick={() => {
            if (player && opponent) onConfirm(player, opponent);
          }}
        >
          {ready ? 'Start matchup →' : 'Pick both gods'}
        </button>
      </div>
    </div>
  );
}
