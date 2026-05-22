# Release checklist

Tasks to complete before publishing to winget. See the update-notification
feature in `src/lib/updateCheck.ts`.

## Update notification — before first winget publish

- [ ] **Set the real winget Package Identifier.** `WINGET_PACKAGE_ID` in
      `src/lib/updateCheck.ts` is the placeholder `Rupprath.AoMCounters`. It
      must exactly match the `PackageIdentifier` in the submitted winget
      manifest, or `winget upgrade --id` will not find the package. The same
      placeholder appears twice in `README.md` (the `winget install` and
      `winget upgrade` commands) — update those to match.

- [ ] **Tag GitHub releases as `vX.Y.Z`** on `rupprath/aom-counters`, and keep
      the version in sync across `src-tauri/tauri.conf.json`, `package.json`,
      and `src-tauri/Cargo.toml`. `getAppVersion()` reads `tauri.conf.json`;
      the update check compares it against the GitHub release tag.

- [ ] **Add a note to DR-11a** in `docs/aom-counter-companion-requirements.md`.
      It currently says "no in-app update mechanism" — acknowledge the
      launch-time GitHub release check (notification only; no download or
      install).

## Dependency audit — every release

- [ ] **Run `npm audit`** and review/resolve any advisories in the JS
      dependencies before building the release bundle.
- [ ] **Run `cargo audit`** (`cargo install cargo-audit` once) from
      `src-tauri/` to check the Rust dependency tree, including Tauri itself.

## Verifying before submission

- [ ] Build a release, run it, then lower the version in `tauri.conf.json` —
      the About screen should show the update card against the latest GitHub
      tag.
- [ ] The **Update now** button only succeeds on a machine where the app was
      actually installed via winget.
