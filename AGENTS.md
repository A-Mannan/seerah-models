# AGENTS.md — seerah-models

## What this is
A pure-visual, interactive 3D seerah series. **Badr, Uhud, Khandaq, Khaybar, Muʿtah and Ḥunayn** are live model pages on the shared engine; the Uhud, Khandaq, Khaybar, Muʿtah and Ḥunayn ledgers still await owner review. No article, narration, captions, info cards, references, or scholar's mode. The model speaks for itself.

## Stack / run
- Static site, no build step: `python3 -m http.server 8000` → `/app/index.html`.
- Vanilla JS + Three.js r128; no npm, no bundler, no React in the shipped app.
- `app/js/engine.js` — the shared engine: renderer, sky, heightfield, props, merge, crowd, labels, camera director, runner.
- `app/js/badr.js`, `app/js/uhud.js`, `app/js/khandaq.js`, `app/js/khaybar.js`, `app/js/mutah.js`, `app/js/hunayn.js` — battle scenes on that engine.
- `app/js/shell.js`, `app/js/*-page.js` — the shared UI shell and per-page descriptors. `app/js/audio.js` — real-recording sound (CC0 library under `app/assets/audio/`, credits beside it; never synthesized).
- Pages `app/index.html`, `app/uhud.html`, `app/khandaq.html`, `app/khaybar.html`, `app/mutah.html`, `app/hunayn.html`; generated routes `badr/`, `uhud/`, `khandaq/`, `khaybar/`, `mutah/`, `hunayn/`; ledgers in `data/ledger/*.json`, bundled to `app/assets/data.js`.

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
- Brand reads **badr · the battle**, **uhud · the battle**, **khandaq · the battle**, **khaybar · the battle**, **muʿtah · the battle**, **ḥunayn · the battle**.

## Quality gates
- `node --check` on every touched script under `app/js/` (engine, shell, scene modules included).
- `node .agents/skills/design-taste-frontend/scripts/lint.mjs --app app/index.html app/css/style.css app/js/engine.js app/js/shell.js app/js/audio.js app/js/badr.js app/js/uhud.js app/js/khandaq.js app/js/khaybar.js app/js/khaybar-page.js app/js/mutah.js app/js/mutah-page.js app/js/hunayn.js app/js/hunayn-page.js`
- `node .agents/skills/design-taste-frontend/scripts/inspect.mjs --app --allow font-not-dealt,gradient,mixed-font-headline,palette-cream app/khandaq.html` (gradient = the approved dawn post grade; mixed face + cream = the intentional brand). Run it for the page you touched.
- Visual probes live in `.taste-skill/`; review `.taste-skill/inspect/`. Check every phase at 390×844 as well as desktop.
- Perf: keep draw calls low via instancing; check `BATTLE.info()` and `BATTLE.benchMass()`. Headless RAF at 2–3 fps is not a perf signal.

## Visual quality (current)
- The owner rejected the primitive “Minecraft” look. Direction: **hybrid carved maquette** — sculpted matte forms, one dawn key, haze and a restrained post grade.
- The rigged-GLTF experiment was rejected (chibi, exposed faces); the approved figure language is the faceless procedural maquette. The hero-rig hook stays dormant in the engine.
- Crowd and field stay procedural/instanced; the crowd must have a gait/thrust, not slide.
- Portrait framing is part of the look: a scene may cap the shared portrait pull and supply per-shot portrait endpoints. Every phase must be re-shot at 390×844, not assumed from desktop.
- Build ac is local; no push.

## Docs roles
- `openspec/changes/` — the plan and checklist for the current change; archived when accepted.
- `AGENTS.md` — standing rules and constraints.
- `PROGRESS.md` — a one-screen build log: what shipped, how it was verified, known limits. No task lists or long phase narrative.
- `README.md` — the front door: what the project is, how to run it, current status.

## Git / release
- Commit locally. **Never push to GitHub without explicit owner approval.**
- Cutting a build: bump the build letter in every `app/js/*-page.js` descriptor, bump every `?v=` query in all six model pages (and the gate), run `node scripts/build-routes.mjs`, and add one entry to the `PROGRESS.md` build log.
- Do not add a public version string.

## Architecture / next battles
- Split done (build r): `app/js/engine.js` is the shared engine (renderer boot, dawn sky, heightfield, props, merge, crowd, labels, camera director with clock/orbit/shots, particles, runner); `badr.js`, `uhud.js`, `khandaq.js`, `khaybar.js`, `mutah.js` and `hunayn.js` are scene modules supplying layout, plans, choreography, shots and copy. A new battle is a data/scene module on the same engine. React/R3F is optional for the UI shell only — not the instanced 3D engine.
- Badr, Uhud, Khandaq, Khaybar, Muʿtah and Ḥunayn are live on the shared engine; the Uhud, Khandaq, Khaybar, Muʿtah and Ḥunayn ledgers remain `awaiting_owner_review`.
- OpenSpec: planning artifacts live in `openspec/changes/<change>/`; implement through the apply workflow; archive when accepted.

## Current focus
Build ac shipped Ḥunayn as the sixth model.
All six battles are live on the shared engine, and the five later ledgers await owner review.