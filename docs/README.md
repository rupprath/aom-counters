# Counter Companion - Data Files

Schema reference for the AoM Retold Counter Companion data layer. The data
files themselves live with the app source:

- `src/data/counter-data.json` - shipped, read-only. The curated counter dataset (schema v3).
- `src/data/user-settings.example.json` - template for the local read-write settings file.

## Schema overview (v3)

Normalized. Catalogs are keyed by id; everything else references those ids.

| Section | Keyed by | Purpose |
|---------|----------|---------|
| `categories` | category id | The unit categories. |
| `counterRoles` | role id | Definitions of the counter specializations. |
| `categoryCounters` | category id | Rock-paper-scissors core: which categories beat each category. |
| `counterPlan` | enemy category | Recommendation engine: which player roster roles to build. |
| `pantheons` | pantheon id | The 7 pantheons, each with a `roster` of role to unit id. |
| `gods` | god id | The 23 major gods. |
| `units` | unit id | All units: human, siege, hero, and myth. `isMyth` flags myth units. |
| `minorGods` | minor god id | The 69 minor gods: name, pantheon, age, `mythUnits`, `confidence`. |
| `godMinorChoices` | major god id | The 2 minor god choices each major god has at each Age. |
| `pantheonThreats` | pantheon id | Ordered base threat list shared by every god of that pantheon. |
| `godSpecificThreats` | god id | God-specific extras (Greek Fortress unique units). |
| `counterOverrides` | player god, then threat unit | Exceptions to `counterPlan`. |

Fields beginning with `_` are documentation, ignored at runtime.

## Runtime resolution

For a selected (player god, opponent god) pair:

1. Enemy threat row = `pantheonThreats[opponentGod.pantheon]` + `godSpecificThreats[opponentGod]`.
2. Enemy possible myth units = the union of `minorGods[m].mythUnits` for every `m` in `godMinorChoices[opponentGod]` across all three Ages. Display each as "possible".
3. For each threat unit, read its `category`, look up `counterPlan[category]`, resolve each role to a unit via `pantheons[playerGod.pantheon].roster`. Myth units resolve to the player's `hero`.
4. `counterOverrides[playerGod][threatUnit]` replaces step 3 when present.

## Research status

**Verified against 2+ sources:**
- All 23 major gods, 7 pantheon unit rosters, the counter system.
- 69 minor gods, their pantheon and Age, and the major-god minor-god availability matrix (reflects update 19.3090).
- Greek Fortress unique units: Myrmidon (Zeus), Hetairos (Poseidon), Gastraphetoros (Hades), Amazon Archer (Demeter, added update 19.5934).
- Most minor-god myth unit attributions.

**Lower confidence (`confidence: "low"` on the minor god entry):**
- Myth-unit attributions resting on a single or circumstantial source: most Japanese minor gods, several Aztec minor gods, plus Greek Hephaestus and Hera, Norse Heimdall, Atlantean Helios and Hekate, Chinese Houtu and Rushou.
- Malinalxochitl (Aztec) has no confirmed myth unit yet; its `mythUnits` list is empty.
- These do not affect counter advice (all myth units resolve to the player's hero); they affect only which myth unit names and pictures are shown. Re-verify after future patches.

**Notes:**
- Only the Greek pantheon ties unique Fortress units to major gods. Other pantheons share their Fortress-equivalent roster; major gods there differ via bonuses, god powers, and exclusive minor gods.
- Naval and amphibious myth units (e.g. Scylla, Kraken, Leviathan, Siren) are included for completeness.

## Updating for balance patches

Edit this file and bump `gamePatch`. The counter model is category-based, so most patches change unit stats rather than counter categories. Re-verify any `confidence: "low"` entries when new sources appear.
