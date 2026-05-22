# AoM Counters

A lightweight, always-on-top counter companion for **Age of Mythology: Retold**.

Pick the major god you're playing and the major god you're facing — AoM Counters
shows the opponent's threatening unit types and the units you should build to
counter them. It's a glanceable reference for use while the game is running, not
a strategy guide or a stat database.

## Install

AoM Counters is distributed through the [Windows Package Manager](https://learn.microsoft.com/windows/package-manager/):

```powershell
winget install Rupprath.AoMCounters
```

Windows 10/11 only. Updates are delivered through winget — run
`winget upgrade Rupprath.AoMCounters`, or use the **Update now** button in the
app's About screen when a new release is detected.

### Latest release

The current release is **v1.0.0**. Download the Windows installer directly from
the [latest release page](https://github.com/rupprath/aom-counters/releases/latest),
or browse [all releases](https://github.com/rupprath/aom-counters/releases).

## Features

- **Matchup counters** — select your god and your opponent's; see enemy threats
  on top and recommended counters on the bottom.
- **Always-on-top overlay** — a small borderless window with three footprint
  states: a collapsed pip, a compact strip, and a full matchup strip.
- **Curated counter data** — all 23 major gods and 7 pantheons, cross-checked
  against multiple sources for the current balance patch.
- **Threat customization** — optionally reorder which enemy units a given
  opponent god prioritizes.
- **Fully offline** — core lookup and display work with no internet connection.
  The only network request the app ever makes is a once-per-launch check to
  GitHub for a newer release.

## Free, forever

AoM Counters is free fan-made software, and it always will be:

- **100% free** — no purchase, no paid or premium features, no trial.
- **Never ad-supported** — it carries no advertising and earns no revenue in any
  form.
- **No accounts, no tracking** — your matchup data never leaves your PC.

This is both a promise and a requirement: Microsoft's Game Content Usage Rules
(see below) permit a fan app like this one only while it stays free of charge
and free of advertising.

## Building from source

Prerequisites: [Node.js](https://nodejs.org/), the
[Rust toolchain](https://rustup.rs/), and the
[Tauri 2 system dependencies](https://v2.tauri.app/start/prerequisites/) for
Windows.

```powershell
npm install
npm run tauri dev      # run the app in development
npm run tauri build    # produce a release build
```

Other useful scripts:

```powershell
npm test               # run the test suite
npm run typecheck      # type-check without emitting
```

## Attribution

Game imagery in AoM Counters is sourced as **cropped screenshots taken directly
from Age of Mythology: Retold**, used under Microsoft's Game Content Usage Rules.
No game asset files are extracted, unpacked, or reverse-engineered — screenshots
only, which is what the rules permit.

> Age of Mythology: Retold © Microsoft Corporation. AoM Counters was created
> under Microsoft's "Game Content Usage Rules" using assets from Age of
> Mythology: Retold, and it is not endorsed by or affiliated with Microsoft.

See the [Microsoft Game Content Usage Rules](https://www.xbox.com/en-US/developers/rules).

AoM Counters is an independent fan project. It is not affiliated with,
endorsed by, or sponsored by Microsoft.
