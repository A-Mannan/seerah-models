# Proposal

## Why

Badr and Uhud are live on the shared engine, but the third battle in the Atlas — Ghazwat al-Khandaq (5 AH) — is still a door without a model. The owner asked for the Khandaq model to be completed to the standard of the other two: a graded ledger, a real scene on the shared engine, a page and route, and a place on the Atlas gate. This change delivers that model.

## What Changes

- **A graded Khandaq ledger** (`data/ledger/khandaq.json`): 38 entries (KHANDAQ-001 … 038) written from the owned spine, Raheeq al-Makhtum pp. 195–203, with Qur'an and hadith anchors, grading (CERTAIN / REPORTED / DISPUTED / UNKNOWN), render guidance and a verification log.
- **A Khandaq scene module** (`app/js/khandaq.js`) on the shared engine: the northern approach to Madinah, the trench cut from the ḥarrah to the marsh, the narrow crossing, the Qurayẓa forts on the eastern spur, the Prophet's station at Sīlāʿ marked without a figure, the three Confederate camps, and ~3,000 Muslims against ~10,000 Confederates, instanced.
- **Seven phases** (`ground, trench, siege, crossing, covenant, storm, reckoning`, 78 s total): the ditch is dug; the siege holds; the horse forces the neck and ʿAmr ibn ʿAbd Wudd challenges, answered by ʿAlī (RA); the pact of Banū Qurayẓa breaks; the storm and wind break the Confederates; the enemy withdraws.
- **Portrait-first cameras**: a scene-level cap on the shared portrait pull plus per-shot portrait endpoints for the crossing, so every phase frames cleanly at 390×844 rather than backing outside the valley or behind the enemy.
- **A page and an Atlas entry**: `app/khandaq.html`, `app/js/khandaq-page.js` and the generated `khandaq/index.html`; the landing gate opens Khandaq with its own field plate, live door and preview; `models.json` lists it live.
- **Shared UI fixes**: the deck counter now switches to Urdu numerals when the language changes while paused (shared shell bug exposed by the Khandaq probe).

**Out of scope:** narration, articles, captions, info cards, references or scholar's mode; facial features; depicting the Prophet ﷺ; photoreal characters; a framework rewrite; changing Badr or Uhud content; pushing to GitHub.

## Capabilities

### New Capabilities

- `khandaq-battle`: the Khandaq model — its graded ledger, ground and landmarks, formations, seven phases, choreography, cameras, labels and page.

### Modified Capabilities

None. The shared engine/shell additions are additive and preserve the Badr and Uhud behaviour (verified by a regression probe).

## Impact

- New: `data/ledger/khandaq.json`, `app/js/khandaq.js`, `app/js/khandaq-page.js`, `app/khandaq.html`, `khandaq/index.html`, `assets/landing/img/khandaq-field-*.webp`, `.taste-skill/probe-khandaq-*.mjs`, `.taste-skill/shot-khandaq-field.mjs`.
- Changed: `app/js/engine.js` (portrait cap and per-shot portrait endpoints), `app/js/shell.js` (paused language deck count), root `index.html`, `assets/landing/css/landing.css`, `assets/landing/js/landing.js`, `models.json`, `data/landing-sources.json`, `AGENTS.md`, `README.md`, `PROGRESS.md`.
- No new historical claim enters the model without a ledger entry; the ledger itself remains `awaiting_owner_review`.
- Build v is committed locally only; no push without explicit owner approval.
