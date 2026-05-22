/**
 * About screen — carries the Game Content Usage Rules attribution notice that
 * the app is required to display (requirements section 9.1), and surfaces the
 * update-available notice when a newer release exists.
 */

import { useEffect, useState } from 'react';
import { counterData } from '../data/counterData';
import type { UpdateInfo } from '../lib/updateCheck';
import { WINGET_PACKAGE_ID } from '../lib/updateCheck';
import { getAppVersion, openExternal, quitApp, wingetUpgrade } from '../lib/tauri';
import { WinTitlebar } from '../shell/WinTitlebar';

/** Fallback shown outside Tauri (browser preview), where there is no build.
 *  Injected from package.json at build time — see vite.config.ts. */
const FALLBACK_VERSION = __APP_VERSION__;
const GCUR_URL = 'https://www.xbox.com/en-US/developers/rules';

/** How long to leave winget starting before the app closes itself, so winget
 *  can replace the running executable. */
const QUIT_DELAY_MS = 1500;

export function AboutView({
  onClose,
  updateInfo,
}: {
  onClose: () => void;
  /** A newer release, or null when the app is current / the check failed. */
  updateInfo?: UpdateInfo | null;
}) {
  const [version, setVersion] = useState(FALLBACK_VERSION);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(false);

  useEffect(() => {
    void getAppVersion().then((v) => {
      if (v) setVersion(v);
    });
  }, []);

  async function handleUpdate() {
    setUpdating(true);
    setUpdateError(false);
    try {
      await wingetUpgrade(WINGET_PACKAGE_ID);
      // winget now runs in its own window; close the app so it can replace
      // the executable. The brief delay lets winget spin up first.
      setTimeout(() => void quitApp(), QUIT_DELAY_MS);
    } catch (err) {
      console.error('winget upgrade failed:', err);
      setUpdating(false);
      setUpdateError(true);
    }
  }

  return (
    <div className="win">
      <WinTitlebar title="AOM Counters · About" onClose={onClose} />

      <div className="scroll about" style={{ flex: 1 }}>
        <div className="about-mark">AoM Counters</div>
        <div className="about-ver">Version {version}</div>

        {updateInfo && (
          <div className="about-update">
            <div className="about-update-hd">
              <span className="about-update-dot" />
              Update available — v{updateInfo.latest}
            </div>
            {updating ? (
              <p className="about-update-msg">
                Starting winget… AoM Counters will close so the update can
                finish.
              </p>
            ) : (
              <>
                {updateError && (
                  <p className="about-update-msg">
                    Couldn't start winget. Use the release page, or run{' '}
                    <code>winget upgrade {WINGET_PACKAGE_ID}</code> yourself.
                  </p>
                )}
                <div className="about-update-actions">
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => void handleUpdate()}
                  >
                    Update now
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => void openExternal(updateInfo.releaseUrl)}
                  >
                    Release notes
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <p>
          A glanceable counter companion for Age of Mythology: Retold — pick
          your god and your opponent's, and see what to build.
        </p>

        <h3>Counter data</h3>
        <p>Reflects game balance patch {counterData.gamePatch}.</p>

        <h3>Attribution</h3>
        <p className="gcur">
          Age of Mythology: Retold © Microsoft Corporation. AoM Counters was
          created under Microsoft's "Game Content Usage Rules" using assets from
          Age of Mythology: Retold, and it is not endorsed by or affiliated with
          Microsoft.
        </p>
        <p>
          Every unit and god image is a cropped screenshot taken directly from
          the game. No game asset files are extracted, unpacked, or
          reverse-engineered — using screenshots only keeps the app within the
          Game Content Usage Rules.
        </p>
        <button
          type="button"
          className="about-link"
          onClick={() => void openExternal(GCUR_URL)}
        >
          Microsoft Game Content Usage Rules →
        </button>

        <h3>This app</h3>
        <p>
          AoM Counters is free fan-made software — and it always will be. It is
          100% free, has no paid or premium features, and will never be
          ad-supported. It carries no advertising and earns no revenue. It needs
          no accounts, and your matchup data never leaves your PC. On launch it
          makes one request to GitHub to check for a newer release; it never
          downloads or installs anything itself — updates are delivered through
          winget.
        </p>
      </div>

      <div className="sub-footer">
        <div style={{ flex: 1 }} />
        <button type="button" className="btn primary" onClick={onClose}>
          Back
        </button>
      </div>
    </div>
  );
}
