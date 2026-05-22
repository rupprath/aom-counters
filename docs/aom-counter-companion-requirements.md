# Requirements Document: Age of Mythology Retold Counter Companion

**Status:** Draft v0.1
**Date:** 2026-05-20
**Owner:** (you)

---

## 1. Purpose

A lightweight desktop companion app for the game *Age of Mythology: Retold*. The app has a single function: tell the player which units to build to counter their opponent. The player selects the major god they are playing and the major god they are playing against, and the app displays the opponent's threatening unit types on top and the recommended counter units on the bottom.

The app is a glanceable reference, used while the game is running. It is not a strategy guide, a build-order tool, or a stat database.

---

## 2. Scope

### In scope
- Single 1v1 matchups only: one player major god versus one opponent major god.
- Selecting the player's major god and the opponent's major god.
- Displaying enemy unit threats and recommended counters for that matchup.
- A small, always-on-top window with three footprint states.
- A researched, curated default counter dataset.
- Optional user customization of which enemy units are prioritized.
- Local persistence of user customizations and last-used settings.

### Out of scope (v1)
- Build orders, economy advice, or god-power timing.
- Minor god selection or tracking.
- Live game-state reading or screen capture.
- Multiplayer, accounts, or online sync.
- Team games or multi-opponent matchups. v1 supports 1v1 only.
- Localization beyond English.

---

## 3. Platform and Distribution

- **Primary target:** Windows desktop, distributed as an `.exe`.
- **Framework:** Tauri, chosen so the same frontend can be brought to the web later with minimal rework.
- **Distribution channel:** winget.
- **Future:** possible web version reusing the Tauri frontend.

> Technical note: Tauri's backend layer is Rust, and the frontend is HTML/CSS/JS. This differs from a Python-based stack. Worth confirming early how much logic lives in the backend versus the frontend, since most of this app (selection, lookup, display) can live almost entirely in the frontend with the dataset bundled as a static file. See Open Questions.

---

## 4. Core User Flow

1. User launches the app before or at the start of a match.
2. User selects their major god.
3. User selects the opponent's major god.
4. The app displays the matchup: enemy unit threats on top, recommended counters on the bottom.
5. The app drops into read-only display mode for the rest of the match.
6. User reads the overlay as needed during play, optionally collapsing or expanding it.
7. Between or before matches, a power user may optionally re-pin which enemy units are prioritized.

Selection happens once per match. There is no required interaction during a fight.

---

## 5. Functional Requirements

### 5.1 God selection
- FR-1: The user selects their major god from the full list of major gods (approximately 23 across 7 pantheons: Greek, Egyptian, Norse, Atlantean, Chinese, Japanese, Aztec).
- FR-2: The user separately selects the opponent's major god from the same list.
- FR-3: Selection is at the **major god** level, not the pantheon level (e.g., Zeus, Set, Loki, Kronos, Tezcatlipoca, not just "Greek" or "Aztec").
- FR-4: The app remembers the last-used selections between sessions.
- FR-5: Selection is a setup-time action. It can be changed at any time, but the design assumes it is normally set once per match.

### 5.2 Counter display
- FR-6: After both gods are selected, the app shows two stacked regions: **enemy unit threats (top)** and **recommended counters (bottom)**.
- FR-7: The default view is a **compact prioritized list**: the most common and most dangerous enemy units for that matchup (target: top 5 to 8), each paired with its recommended counter unit(s).
- FR-8: The user can expand to a **full matchup view** showing every relevant enemy unit type the opponent's major god can field, each with counters.
- FR-9: During a match the display is **read-only**. No interaction is required to keep it useful.

### 5.3 Unit representation
- FR-10: Every unit shown (both enemy threats and recommended counters) is displayed with three elements: its **category** (e.g., hack infantry, ranged soldier, cavalry, myth unit, siege, hero), its **specific unit name** (e.g., Hoplite, Toxotes, Murmillo), and a **picture/icon**.
- FR-11: The image is included because players often recognize a unit visually rather than by name. Images must be legible at the app's small display size.
- FR-11a: Unit and god images are sourced as **cropped screenshots from Age of Mythology: Retold**, used under Microsoft's Game Content Usage Rules (GCUR). Game asset files must not be extracted or reverse-engineered from the game; only screenshots, which the GCUR permits, may be used. Until the screenshots are produced, the app uses **placeholder images** at the paths referenced in `counter-data.json` (e.g., `images/units/gr_hoplite.png`).
- FR-11b: Images are bundled locally with the app (consistent with the offline requirement) in an `images/` directory, mirroring the paths in the dataset.

### 5.4 Myth units
- FR-12: Myth units are determined by the opponent's minor god choices, which this app does not track. The full set of myth units the opponent's major god could possibly field (across all of that god's minor god options) is treated as one group, not as individual threats.
- FR-13: Myth units are **not given individual counters**. Because heroes counter all myth units in Age of Mythology, the enemy myth threat is shown as a **single combined row**: "Myth units" paired with the player's hero as the counter.
- FR-14: In the **collapsed and default views**, this single combined row is all that is shown for myth units.
- FR-15: In the **expanded view**, the individual possible myth units may be listed by name and image underneath the single "Myth units" heading, all sharing the same hero counter. Each is marked as **"possible"** since it depends on the opponent's untracked minor god picks.
- FR-16: The set of possible myth units varies in length by matchup, so any layout displaying it must handle a list that grows and shrinks.

### 5.5 Footprint states
The app has a three-step footprint ladder, all always-on-top:
- FR-17: **Collapsed** - a single small icon, the smallest footprint, used when the user does not need the reference visible. Clicking the icon expands the app to the default view.
- FR-18: **Default** - the compact prioritized list (FR-7).
- FR-19: **Expanded** - the full matchup view (FR-8).
- FR-20: The user can move between these states with minimal interaction.

### 5.6 Customization
- FR-21: The user can re-pin and reorder which enemy units are prioritized in the default compact view.
- FR-22: Customization is scoped **per enemy god**: pins attach to the opponent's major god and apply regardless of which god the user is playing.
- FR-23: Customization is a **setup-time** action (before or between matches), not a mid-match action.
- FR-24: Customization is an optional power-user feature. The researched defaults are the primary product. The customization UI must not be intrusive and must not be presented prominently on first launch.

### 5.7 Persistence
- FR-25: User customizations (per-enemy-god pins and ordering) persist locally between sessions.
- FR-26: Last-used god selections persist locally between sessions.
- FR-27: Persistence is local-only, stored in a settings/config file. No cloud, no account.

---

## 6. Non-Functional Requirements

- NFR-1: **Always-on-top.** The window stays above the game in all footprint states so the user can glance at it during fullscreen-windowed play.
- NFR-2: **Small screen footprint.** The app must occupy minimal screen real estate, since the user is actively playing the game. The collapsed and default states in particular must be compact.
- NFR-3: **Low resource use.** The app must be light on CPU, memory, and GPU so it does not affect game performance.
- NFR-4: **Fast launch and instant lookup.** Selecting two gods and seeing the matchup must feel immediate.
- NFR-5: **Offline-capable.** Core functionality (lookup and display) works without an internet connection. If unit images are bundled, the app is fully offline.
- NFR-6: **Small install size**, consistent with the lightweight intent and winget distribution.

---

## 7. Data Requirements

The accuracy of the counter dataset is the core value of this app. The defaults are the product.

- DR-1: A curated dataset mapping each opponent major god to the unit threats they can field, and each threat to its recommended counter unit(s).
- DR-2: The dataset must cover all current major gods across all 7 pantheons, including the Aztecs (Obsidian Mirror expansion, released April 2026) and any Demeter / Freyr / Chinese / Japanese content.
- DR-3: The dataset must reflect the current game balance patch and be structured so it can be revised when balance patches change unit relationships.
- DR-4: For each enemy god, a default priority ordering of unit threats (which units are the "top 5 to 8") must be researched and assigned. This is a curated judgment, not a computed value.
- DR-5: Counter advice should respect Age of Mythology's category-based counter system (infantry, ranged, cavalry, myth units, heroes, siege) while resolving recommendations down to specific buildable units from the player's god roster.
- DR-6: Myth unit entries must be tagged as "possible" and associated with the minor god that grants them, for clarity.
- DR-7: Each unit entry needs an associated image asset (see Section 8).

**Data research is a defined work item.** Building and verifying this dataset for ~23 major gods is a substantial, separate effort from building the app shell. It should be tracked as its own deliverable, ideally in a format (file or config) that is editable without rebuilding the exe.

### 7.1 Storage format

- DR-8: Data is stored as **JSON**, not a database. The dataset is small (a few hundred entries, read-mostly, loaded once at startup), browsers read JSON natively for the future web port, and JSON is human-editable and diffs cleanly in version control for balance-patch updates. SQLite would add a bundled binary or a WASM build for no runtime benefit at this scale.
- DR-9: The data is split into **two files**:
  - `counter-data.json` - shipped, read-only, the curated counter dataset.
  - `user-settings.json` - local, read-write, the user's per-enemy-god pins and last-used selections.
- DR-10: Both files carry a `schemaVersion` field so future format changes can be migrated safely.
- DR-11: `counter-data.json` carries a `gamePatch` field identifying which balance patch the data reflects.
- DR-11a: Balance-patch updates to the dataset are delivered **bundled in the app via winget updates**. There is no separate data download or in-app update mechanism. A counter data change requires publishing a new app version. This couples data fixes to app releases, which is an accepted tradeoff at this scale and keeps the app fully offline.

### 7.2 Data model

- DR-12: The dataset is **normalized**. A `units` catalog and a `gods` catalog are keyed by id; all other sections reference those ids rather than repeating unit or god data.
- DR-13: `units` - each unit has a name, category, pantheon, image path, and an `isMyth` flag.
- DR-14: `gods` - each major god has a name, pantheon, and portrait. Myth unit availability is not stored on the god; it is derived via `godMinorChoices` and `minorGods` (see DR-15a).
- DR-15: `pantheonThreats` - keyed by pantheon, an ordered list of base threat units with a default `priority` value, since the standard military roster is shared by every major god of a pantheon. `godSpecificThreats` holds god-specific extras such as unique Fortress units.
- DR-15a: `minorGods` - keyed by minor god id, each with a pantheon, Age, and the `mythUnits` it grants, plus a `confidence` flag. `godMinorChoices` - keyed by major god id, the two minor god choices available at each of the three Ages. Together these let the app compute an opponent's possible myth units.
- DR-16: `counters` - keyed by unit id, the list of categories that counter it plus an optional explanatory note. This is the category-based core of the counter system, researched once per unit.
- DR-17: `counterOverrides` - keyed by player god then threat unit, used only for the specific cases where a god has a notably better or worse answer than the generic category counter. Keeping overrides as exceptions avoids researching all ~529 god pairs individually.
- DR-18: **Runtime resolution:** for a given (player god, opponent god) pair, the app reads `threats[opponentGod]` for the enemy row; for each threat it checks `counterOverrides[playerGod][threatUnit]` first, then falls back to `counters[threatUnit]` resolved through `gods[playerGod].roster`.
- DR-19: `user-settings.json` stores `lastPlayerGod`, `lastOpponentGod`, `lastFootprintState`, and `pinsByOpponentGod` (an ordered list of unit ids per opponent god that overrides the default priority order).

### 7.3 Myth units in the counter model

- DR-20: **Enemy myth units are treated as one group, not individual threats.** All myth units the opponent's major god could field resolve to a single counter: the player's hero. The app does not store or display a per-myth-unit counter.
- DR-21: The set of an opponent's possible myth units is computed from the data, not hand-listed per god: it is the union of `minorGods[m].mythUnits` for every minor god `m` in `godMinorChoices[opponentGod]` across all three Ages.
- DR-22: The recommended counter for the myth group is always the player's `hero` from their pantheon `roster`, via `counterPlan.myth`. No minor-god annotation is needed on the counter side, since the hero is universal.
- DR-23: The individual possible myth units are still available in the data (each tagged `isMyth` and "possible") so the expanded view can list them by name and image under the single "Myth units" heading.

---

## 8. UI / UX Requirements

- UX-1: The layout is two stacked regions: enemy threats on top, player counters on the bottom.
- UX-2: Each unit cell shows image, name, and category together and remains legible at small size.
- UX-3: The three footprint states (collapsed, default, expanded) are easy to switch between.
- UX-4: First launch presents god selection cleanly and does not push the customization feature on the user.
- UX-5: Visual design should be readable over a busy game background (sufficient contrast, a solid or semi-opaque panel).
- UX-6: The full matchup view (expanded) may scroll; the compact view should fit without scrolling where possible.

---

## 9. Open Questions and Risks

- **OQ-1 (resolved):** Image sourcing and copyright. Resolved: unit and god images are cropped screenshots from Age of Mythology: Retold, used under Microsoft's Game Content Usage Rules. See Section 9.1 for the compliance conditions the app must meet. This is no longer an open risk provided those conditions are followed.
- **OQ-2 (resolved):** The Aztec major god roster (Huitzilopochtli, Tezcatlipoca, Quetzalcoatl) and the full 23-god roster have been verified against multiple sources. See Appendix A.
- **OQ-3:** Backend/frontend split for Tauri. Recommend keeping nearly all logic and the dataset in the frontend as static data, minimizing Rust backend code, which also eases the future web port.

### 9.1 Game Content Usage Rules compliance

The app uses Age of Mythology: Retold imagery under Microsoft's Game Content Usage Rules (GCUR). The GCUR grants a revocable, limited license to use game content in a free fan app, on these conditions, all of which the app must meet:

- The app is distributed **free of charge** and must remain free. It must not be sold.
- The app must contain **no advertising** and must not earn revenue in any form.
- Images are **screenshots** from the game. Game asset files must not be extracted or reverse-engineered.
- The app must display the **required GCUR attribution notice**: "Age of Mythology: Retold © Microsoft Corporation. [App name] was created under Microsoft's 'Game Content Usage Rules' using assets from Age of Mythology: Retold, and it is not endorsed by or affiliated with Microsoft." A link to the GCUR must accompany it. This notice goes in an About screen and in the README on the distribution page.
- The **app name must not imply Microsoft authorship or endorsement**; a referential name is acceptable. The app must not use official Age of Mythology logos in its own branding.
- The license is **revocable** by Microsoft at any time, and distributing the app grants Microsoft a broad license to the work. These are accepted conditions of the GCUR.

---

## 10. Future Considerations (post-v1)

- Web version reusing the Tauri frontend.
- Minor god awareness, to narrow myth unit predictions from "possible" to "likely."
- Per-matchup customization (currently scoped per enemy god only).
- Team game support (multiple opponent gods at once), excluded from v1.
- In-app dataset updates independent of app releases.

---

## 11. Next Steps

1. Confirm and finalize this requirements document.
2. Verify the full current major god roster, including Aztecs.
3. Resolve the image-sourcing legal question (OQ-1).
4. Define the dataset schema (the structure for gods, units, categories, counters, priorities, images).
5. Begin the counter-data research, god by god.
6. Prototype the three-state always-on-top window shell in Tauri.

---

## Appendix A: Verified Major God Roster

Current as of game update 19.10195 (Obsidian Mirror, April 2026). 23 major gods across 7 pantheons. Each entry was cross-checked against at least two sources, including the official Age of Empires site and the Age of Empires Fandom wiki.

| Pantheon | Major Gods |
|----------|------------|
| Greek | Zeus, Poseidon, Hades, Demeter |
| Egyptian | Ra, Isis, Set |
| Norse | Odin, Thor, Loki, Freyr |
| Atlantean | Kronos, Oranos, Gaia |
| Chinese | Fuxi, Nüwa, Shennong |
| Japanese | Amaterasu, Tsukuyomi, Susanoo |
| Aztec | Huitzilopochtli, Tezcatlipoca, Quetzalcoatl |

Notes:
- Greeks and Norse have four major gods; all other pantheons have three. Demeter (Greek) was added February 2026; Freyr (Norse) is a Premium Edition addition.
- Chinese, Japanese, and Aztec are expansion pantheons (Immortal Pillars, Heavenly Spear, Obsidian Mirror respectively).
- Some names commonly mistaken for major gods are actually minor gods (e.g., Chiyou, Houtu, Nüba for Chinese; Mictlantecuhtli, Malinalxochitl for Aztec). The app must not list these as selectable major gods.

## Appendix B: Counter System Basis

Age of Mythology Retold combat resolves through damage types (hack, pierce, crush, and Divine, which ignores armor) and damage multipliers tied to unit categories. The dataset's category-counter core is built on three overlapping rock-paper-scissors systems:

- Heroes beat myth units, myth units beat human units, human units beat heroes.
- Cavalry beat ranged soldiers, ranged soldiers beat infantry, infantry beat cavalry (with notable exceptions).
- Siege weapons beat buildings.

Specialized "counter" units (counter-infantry, counter-cavalry, counter-archer) carry explicit damage multipliers and act as hard counters within these systems. These exceptions are what the `counterOverrides` section of the dataset exists to capture.
