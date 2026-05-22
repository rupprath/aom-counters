/**
 * Update-availability check.
 *
 * The app ships and updates through winget (DR-11a): winget — not the app —
 * owns installs. This module never downloads or installs anything. It only
 * compares the running build against the latest GitHub release and, if a newer
 * one exists, lets the user hand off to `winget upgrade`.
 *
 * The check runs once per app session (from the Setup screen) and fails
 * silently — offline, rate-limited, repo not found, malformed tag — so core
 * lookup stays fully offline-capable (NFR-5).
 */

import { getAppVersion } from './tauri';

/** GitHub repo publishing the releases. Releases must be tagged `vX.Y.Z`. */
const GITHUB_REPO = 'rupprath/aom-counters';

/**
 * winget PackageIdentifier — the `--id` that `winget upgrade` targets. This
 * must match the `PackageIdentifier` in the published winget manifest exactly,
 * and the `winget install` / `winget upgrade` commands shown in README.md.
 */
export const WINGET_PACKAGE_ID = 'Rupprath.AoMCounters';

const LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

/** Details of a release newer than the running build. */
export interface UpdateInfo {
  /** Latest released version, normalised (no leading `v`). */
  latest: string;
  /** The currently running version. */
  current: string;
  /** GitHub release page — the "Release notes" link target. */
  releaseUrl: string;
}

/**
 * Compare two dotted numeric versions. Returns a positive number if `a` is
 * newer than `b`, negative if older, 0 if equal. A leading `v` and any
 * non-numeric suffix (e.g. `-beta`) are ignored.
 */
export function compareVersions(a: string, b: string): number {
  const parts = (v: string): number[] =>
    v
      .replace(/^v/, '')
      .split('.')
      .map((n) => parseInt(n, 10) || 0);
  const pa = parts(a);
  const pb = parts(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * True for an `https://github.com/...` URL — the only thing we will hand to
 * the OS browser. Guards against a malformed or hostile API response putting
 * an unexpected scheme (`file:`, `javascript:`, …) in front of the opener.
 */
export function isSafeReleaseUrl(url: unknown): url is string {
  return typeof url === 'string' && /^https:\/\/github\.com\//.test(url);
}

let cached: Promise<UpdateInfo | null> | undefined;

/**
 * Check whether a newer release is available. Resolves to an `UpdateInfo` when
 * the latest GitHub release is newer than the running build, or `null` when
 * the app is current, offline, or the check fails for any reason. Memoised:
 * the network request runs at most once per app session.
 */
export function checkForUpdate(): Promise<UpdateInfo | null> {
  if (!cached) cached = runCheck();
  return cached;
}

async function runCheck(): Promise<UpdateInfo | null> {
  try {
    const current = await getAppVersion();
    // No version means we are outside Tauri (browser preview) — nothing to do.
    if (!current) return null;

    // Cap the request: a stalled connection must not leave the check hanging.
    const res = await fetch(LATEST_RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { tag_name?: string; html_url?: string };
    const tag = data.tag_name;
    if (!tag) return null;

    const latest = tag.replace(/^v/, '');
    if (compareVersions(latest, current) <= 0) return null;

    return {
      latest,
      current,
      releaseUrl: isSafeReleaseUrl(data.html_url)
        ? data.html_url
        : `https://github.com/${GITHUB_REPO}/releases/latest`,
    };
  } catch {
    // Offline or any other failure: stay quiet, the app works without this.
    return null;
  }
}
