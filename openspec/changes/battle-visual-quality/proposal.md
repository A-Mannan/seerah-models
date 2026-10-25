# Proposal

## Why

The Badr model's current look reads as programmer-primitive — blocky cylinder figures, sliding crowds, a flat tiled field and single-ease camera moves. The owner rejected it as “Minecraft.” This change replaces the primitive look with a deliberate carved-maquette visual language and proves the result on one hero frame before rebuilding the full scene.

## What Changes

- Lock the **hybrid carved-maquette** direction: sculpted matte forms, one theatrical dawn light, atmospheric depth and a restrained post grade.
- Use **CC0 rigged GLTF only for the named hero figures** (Gobkit human003 initially; helmets, hoods or cloth veils cover every face). Crowd and field stay procedural.
- Build a **hero-frame test** first: one champion, one soldier, one Quraysh fighter, a horse, a well, a tent, a terrain patch, the dawn light and post, with a 5-second advance → strike → hit sequence and a wide→close cut.
- Hold a **owner review gate** on the hero frame before any full-scene rebuild.
- After approval: rigged faceless heroes for the duel/vignette, a real walk/thrust cycle for the instanced crowd, a heightfield/field rebuild with haze and post, and a directed shot list with cuts, holds and impact frames.
- Add an asset/licence record and keep every face covered; the Prophet ﷺ is never depicted.

**Out of scope:** photoreal characters, facial features, additional battles (Uhud/Khandaq), and pushing to GitHub.

## Capabilities

### New Capabilities

- `battle-visual-quality`: the carved-maquette look, faceless rigged heroes, living crowd, field depth, directed transitions, the hero-frame gate and the mobile performance budget.

### Modified Capabilities

None.

## Impact

- New prototype: `app/proto/hero.html` and its scene script.
- New CC0 assets under `app/assets/models/` plus `GLTFLoader`/`SkeletonUtils`; licence record.
- Later: `app/js/battle.js` hero rigs, crowd animation, terrain/field, cameras and transitions.
- `AGENTS.md`, `PROGRESS.md`, OpenSpec tasks; no public version string.
- Build q remains local; the new look ships as a later build only after the gate.