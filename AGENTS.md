# AGENTS.md — seerah-models

## What this is
A pure-visual, interactive 3D seerah series. **Badr** is the live model; **Uhud** and **Khandaq** are blocked pending owner approval. No article, narration, captions, info cards, references, or scholar's mode. The model speaks for itself.

## Stack / run
- Static site, no build step: `python3 -m http.server 8000` → `/app/index.html`.
- Vanilla JS + Three.js r128; no npm, no bundler, no React in the shipped app.
- `app/js/battle.js` — scene, formations, choreography, cameras, labels.
- `app/js/main.js` — clock, timeline, speeds, language, UI. `app/js/audio.js` — procedural sound.
- `app/index.html`, `app/css/style.css`; ledger in `data/ledger/badr.json`, bundled to `app/assets/data.js`.

## Before changing anything
- Read `PROGRESS.md` and the active change under `openspec/changes/`.
- Verify every new historical claim against the ledger, or add a graded entry with sources. Never invent, harmonize, or silently upgrade a report.
- Badr wells: the Muslims reached the wells first on al-Ḥubāb's advice; rain firmed Muslim sand and muddied the Quraysh slope; the Quraysh were denied water. Do **not** use the reversed “Quraysh took the well / Muslims had no water” account.

## Non-negotiable depiction rules
- The Prophet ﷺ is never depicted, in any form.
- No facial features on any figure. Named Companions may appear as stylized, faceless action figures only where explicitly approved (the Badr Abu Jahl vignette); otherwise use standards/weapons as markers.
- Honorifics in labels: (RA), (PBUH), ﷺ. Full English + Urdu (Nastaliq, RTL, Urdu numerals).
- No public build/version string; `?debug=1` may show a tiny tag.

## UX contract
- Full-screen model. Paused: drag orbit, slow turntable, 1:1 drag with inertia, zoom-to-cursor, pinch zoom.
- Speeds 0.5× / 1× / 1.5× / 2×. Play button reads “play”. Urdu timeline runs right-to-left.
- No camera-preset chip row: the phase cameras and free orbit carry the story. The “sand” phase is the action-vignette beat.
- Mobile first-class: portrait framing, safe areas, no clipped labels or controls.
- Brand reads **badr · the battle**.

## Quality gates
- `node --check app/js/battle.js` and `app/js/main.js`.
- `node .agents/skills/design-taste-frontend/scripts/lint.mjs --app app/index.html app/css/style.css app/js/battle.js app/js/main.js app/js/audio.js`
- `node .agents/skills/design-taste-frontend/scripts/inspect.mjs --app --allow font-not-dealt,gradient,mixed-font-headline,palette-cream app/index.html` (gradient = the approved dawn post grade; mixed face + cream = the intentional brand).
- Visual probes live in `.taste-skill/`; review `.taste-skill/inspect/`.
- Perf: keep draw calls low via instancing; check `BATTLE.info()` and `BATTLE.benchMass()`. Headless RAF at 2–3 fps is not a perf signal.

## Visual quality (current)
- The owner rejected the primitive “Minecraft” look. Direction: **hybrid carved maquette** — sculpted matte forms, one dawn key, haze and a restrained post grade.
- Named heroes: **heroes-only CC0 rigged GLTF**, faces covered by helmet/hood/turban + veil. Round 1 (Gobkit human003) was rejected as chibi with exposed faces; round 2 tests KayKit Adventurers and Quaternius Animated Men/Modular Men.
- Crowd and field stay procedural/instanced; the crowd must have a gait/thrust, not slide.
- **Hero-frame gate:** do not rebuild the full scene until the owner approves the standalone hero frame in `openspec/changes/battle-visual-quality/`.
- Build q is local; no push.

## Docs roles
- `openspec/changes/` — the plan and checklist for the current change; archived when accepted.
- `AGENTS.md` — standing rules and constraints.
- `PROGRESS.md` — a one-screen build log: what shipped, how it was verified, known limits. No task lists or long phase narrative.
- `README.md` — the front door: what the project is, how to run it, current status.

## Git / release
- Commit locally. **Never push to GitHub without explicit owner approval.**
- Cutting a build: bump the build letter in the `app/js/main.js` console log and `?debug=1` tag, bump every `?v=` query in `app/index.html`, add one entry to the `PROGRESS.md` build log.
- Do not add a public version string.

## Architecture / next battles
- Split done (build r): `app/js/engine.js` is the shared engine (renderer boot, dawn sky, heightfield, props, merge, crowd, rigged heroes, labels, camera director with clock/orbit/shots, particles); `app/js/badr.js` is the Badr scene module (layout, plans, vignette, choreography, `BATTLE` API). A new battle is a data/scene module on the same engine. React/R3F is optional for the UI shell only — not the instanced 3D engine.
- Uhud/Khandaq ledgers and scenes remain blocked until the owner approves.
- OpenSpec: planning artifacts live in `openspec/changes/<change>/`; implement through the apply workflow; archive when accepted.

## Current focus
The active OpenSpec change lists the remaining Badr work.