# Proposal

## Why

Badr is a complete model, but it is the only one that exists and it still carries one-off code that a
second battle cannot reuse. The eight shared systems (dawn sky, ground, standards, faceless figures,
clock/camera loop, labels, shell UI, pages) are half-extracted: `badr.js` re-implements the sky and
the ground that `engine.js` already offers, every UI control in `main.js` is Badr-specific, and the
root page is a redirect to one battle. Uhud is the next model in the series and the honest test of
whether that architecture works.

The owner asked for three things in one pass: polish Badr, build Uhud to the same standard, and remove
the duplication so the third battle is cheap. This change does all three and gives the series a front
door.

## What Changes

- **Uhud ships as a real model**: a graded ledger (`data/ledger/uhud.json`) written from the owned
  spine (Raheeq al-Makhtum pp. 155-181) with live-fetched Qur'an anchors from Surah Aal-Imran; a
  scene module on the shared engine (the valley south of Uhud, the archers' hill, the two lines,
  the Quraysh camp, the Muslim camp); a seven-phase choreography (the ground, the archers' hill,
  the charge, the spoils, the flank, the turn, the reckoning); a shot list; English/Urdu labels;
  no figure with a face and no depiction of the Prophet ﷺ.
- **The shared engine is finished**: sky/lights, painted ground, standards, faceless figures,
  the battle runner (clock, RAF, labels, cloth, particles, pause, debug API) and a generalized label
  pass move into `engine.js`. `badr.js` and `uhud.js` become scene + data modules of comparable size.
- **The UI is one shell**: a config-driven shell (`app/js/shell.js`) owns the timeline, scrub,
  play/speed/reset, language, sound and hint for any battle. `main.js` stops carrying Badr's copy.
- **The series has a front door**: `index.html` becomes a designed landing page with both models,
  the series rule and the honourific/never-depicted statement. `app/badr.html` and `app/uhud.html`
  are the model pages; `app/index.html` redirects to Badr so old links keep working.
- **Badr gets a measured polish pass**: the duplicated sky/ground code is removed, label rules are
  generalized, the deck and bar get one shared interaction model, and the camera/labels/layout are
  re-probed. No new historical claim is introduced.

**Out of scope:** Khandaq; narration, articles, captions, info cards or scholar's mode; facial
features; depicting the Prophet ﷺ; photoreal rendering; a framework rewrite; pushing to GitHub.

## Capabilities

### New Capabilities

- `battle-series`: the catalogue/front door, per-battle pages, the shared shell contract and the
  standing depiction and ledger rules that every model in the series must satisfy.
- `uhud-battle`: the Uhud model: its graded ledger, ground and landmarks, formations, seven phases,
  choreography, labels and camera shots.

### Modified Capabilities

- `battle-visual-quality`: the "reusable engine" requirement from task 3.6 is tightened from a
  one-time split to a standing contract: a new battle supplies data and choreography only.

## Impact

- New: `data/ledger/uhud.json`, `app/js/uhud.js`, `app/js/shell.js`, `app/badr.html`,
  `app/uhud.html`, `app/css/home.css`, `.taste-skill/probe-uhud.mjs`.
- Changed: `app/js/engine.js`, `app/js/badr.js`, `app/index.html`, root `index.html`,
  `app/css/style.css`, `.taste-skill/build-data.cjs`, `PROGRESS.md`, `README.md`, `AGENTS.md`.
- Removed: `app/js/main.js` (its behaviour moves into `shell.js`).
- The graded ledger stays the source of truth; every new Uhud label maps to an entry.
