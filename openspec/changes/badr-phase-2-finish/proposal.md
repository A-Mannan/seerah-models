# Proposal

## Why

Badr's event layer has outgrown standards and labels. The owner has asked for a staged, faceless action vignette (ʿAbdur-Raḥmān identifies Abu Jahl; the two Anṣār youths strike him; Ikrimah cuts Muʿādh's arm; Muʿādh steps on it and fights one-armed; Muʿawwidh is martyred) and for the massed armies to read as detailed figures fighting with spears, arrows and swords. The current camera-chip row, early event labels and sparse mass detail work against that. This change finishes the Badr model so it can be signed off and used as the pattern for Uhud and Khandaq.

## What Changes

- Stage the Abu Jahl vignette on a compact sand plinth in the gap between the Quraysh centre and left divisions: five faceless, detailed figures, a timed run → strike → arm cut → step/separate → Muʿawwidh's fall → Abu Jahl's fall, with labels carrying the honorifics.
- Give Muʿādh a visible severed arm, a stepping leg and a working one-handed spear; reconcile the old Muʿādh/Muʿawwidh/Ikrimah standards so no duplicate markers remain.
- Detail the massed men (tunics, belts, feet, turbans/helmets) and give the spear hedge its own instanced motion so it levels and thrusts during the clash instead of staying upright.
- Remove the camera-preset chip row. The phase cameras carry the story, including a dedicated approach and close-up for the vignette in "the sand"; free orbit, drag, inertia and zoom remain.
- Gate named event figures and labels to the phases in which they act: the two youths start at the Muslim line, and Bilāl/ʿUmayyah appear only in the rout.
- Verify and deliver the wells/rain account: the Muslims reached the wells first on al-Ḥubāb's advice; rain firmed their ground and muddied the Quraysh slope; the Quraysh were denied water.
- Run the desktop/mobile visual and performance gates, cut build **p**, update `PROGRESS.md`, and commit locally. Do not push without explicit owner approval.

**Out of scope:** any article, narration, captions, info cards, references or scholar's mode; Uhud and Khandaq ledgers/scenes; a React/R3F rewrite; photoreal authored assets. The shared-engine split for future battles is a follow-up change.

## Capabilities

### New Capabilities

- `badr-battle`: the observable Badr replay — seven-phase clock, faceless action figures and mass combat, the Abu Jahl vignette, story cameras without preset chips, phase-gated labels, bilingual honorifics, historical integrity and mobile performance.

### Modified Capabilities

None. `openspec/specs/` is empty; this is the first capability.

## Impact

- `app/js/battle.js`: vignette figures/timing/staging, mass man geometry and spear instances, phase cameras, event visibility, label gates.
- `app/js/main.js`, `app/index.html`, `app/css/style.css`: remove the camera chip row and its strings/styles; build tag.
- `.taste-skill/`: story, mobile, vignette and performance probes; review stills.
- `PROGRESS.md`: build p pass and the wells/rain verification.
- `AGENTS.md`, `openspec/`: project rules and this change.
- No new dependencies. Three.js r128 and the no-build static setup stay.