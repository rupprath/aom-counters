# Source captures (not bundled)

This folder holds **raw source screenshots** used to produce the app's god and
unit art. It is *not* part of the build: Vite only bundles `public/`, so
nothing here ships in the app.

- `major/` — unprocessed major-god portrait captures, kept under their original
  capture filenames.

The processed, app-facing art lives in `public/images/{gods,units}/`, named by
the unit/god id the dataset references. Keep this folder out of the shipped
build; treat it as a working archive of source material only.
