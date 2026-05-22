/**
 * Thin bridge to the Tauri backend.
 *
 * Window behaviour is the one job kept in Rust (always-on-top is set in
 * tauri.conf.json; footprint resizing is the `set_window_mode` command). Every
 * call here degrades to a no-op when the app runs outside Tauri — e.g. `vite
 * dev` in a plain browser — so the same frontend can be previewed on the web
 * and later ported there.
 */

import { invoke } from '@tauri-apps/api/core';

/** The four window footprints. `setup` is the pre-match picker; the other
 *  three are the in-match footprint ladder from the requirements. */
export type WindowMode = 'setup' | 'collapsed' | 'default' | 'expanded';

/** True when running inside the Tauri webview (vs. a plain browser). */
export const isTauri: boolean =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** Resize the OS window to the given footprint. No-op outside Tauri. */
export async function setWindowMode(mode: WindowMode): Promise<void> {
  if (!isTauri) return;
  try {
    await invoke('set_window_mode', { mode });
  } catch (err) {
    console.error(`set_window_mode(${mode}) failed:`, err);
  }
}

/** Close the window, which quits the single-window app. No-op outside Tauri. */
export async function quitApp(): Promise<void> {
  if (!isTauri) return;
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  } catch (err) {
    console.error('quitApp failed:', err);
  }
}

/**
 * Read the raw user-settings file text, or null if it does not exist yet (or
 * the app is running outside Tauri). Parsing is the caller's job.
 */
export async function readSettingsFile(): Promise<string | null> {
  if (!isTauri) return null;
  try {
    return await invoke<string | null>('load_settings');
  } catch (err) {
    console.error('load_settings failed:', err);
    return null;
  }
}

/** Write the raw user-settings file text. No-op outside Tauri. */
export async function writeSettingsFile(contents: string): Promise<void> {
  if (!isTauri) return;
  try {
    await invoke('save_settings', { contents });
  } catch (err) {
    console.error('save_settings failed:', err);
  }
}

/**
 * The running app version, read from tauri.conf.json. Returns null outside
 * Tauri (e.g. `vite dev` in a plain browser), where there is no native build.
 */
export async function getAppVersion(): Promise<string | null> {
  if (!isTauri) return null;
  try {
    const { getVersion } = await import('@tauri-apps/api/app');
    return await getVersion();
  } catch (err) {
    console.error('getVersion failed:', err);
    return null;
  }
}

/**
 * Hand off to winget to install the latest release. Opens `winget upgrade` in
 * its own console window so the user sees progress; the caller should then
 * close the app so winget can replace the running executable. No-op outside
 * Tauri. Rejects if winget could not be launched, so callers can fall back.
 */
export async function wingetUpgrade(packageId: string): Promise<void> {
  if (!isTauri) return;
  await invoke('winget_upgrade', { packageId });
}

/** Open a URL in the user's default browser (used for the GCUR link). */
export async function openExternal(url: string): Promise<void> {
  if (!isTauri) {
    window.open(url, '_blank', 'noopener');
    return;
  }
  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
  } catch (err) {
    console.error('openUrl failed:', err);
  }
}
