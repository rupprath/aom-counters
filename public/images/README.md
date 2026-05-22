# Bundled images

Unit and god artwork for the app. Files here are bundled into the app and
served at the root path the dataset already references.

```
public/images/units/{id}.png   e.g. public/images/units/gr_hoplite.png
public/images/gods/{id}.png    e.g. public/images/gods/zeus.png
```

The `{id}` keys match `src/data/counter-data.json` (`units` and `gods`). Until
a file exists, the app renders a neutral silhouette in the slot — drop the PNG
in and it appears, no code change needed.

## Dimensions

Author every image as a **128×128 px square PNG** — units and gods alike.

The largest on-screen slot is the strip's 44×44 CSS-px unit tile; god
portraits top out at 40×40. At 200% Windows display scaling that 44 px slot is
88 device pixels, so 128×128 gives crisp rendering with headroom and
downscales cleanly to every smaller slot (36, 32, 22, 16 px). Files stay small
(a cropped screenshot PNG is a few KB up to ~30 KB).

Slots are square and rendered with `object-fit: cover`, which center-crops a
non-square source. So: crop **square**, and frame each unit/god **centered and
consistently** so it reads at small sizes.

## Sourcing (GCUR compliance)

Images must be **cropped screenshots** from Age of Mythology: Retold, used
under Microsoft's Game Content Usage Rules. Do **not** extract or
reverse-engineer game asset files — screenshots only. See requirements
section 9.1 and the app's About screen.
