# Design

## Context

See `proposal.md` — Why. The current Badr scene is a single Three.js r128 module with instanced primitive figures; the owner rejected its visual quality. The direction is now fixed: **hybrid carved maquette**, **heroes-only CC0 rigged GLTF**, **no faces**, **no Prophet**, **hero-frame proof before the full rebuild**. The current build q remains local and unpushed.

## Goals / Non-Goals

**Goals:**
- A hero frame that clears the “Minecraft” bar on silhouette, motion and atmosphere.
- Natural walk/attack/hit/death motion on the named figures, with faces covered.
- A field that reads as a sculpted valley, not a flat tiled plane.
- A shot rhythm with cuts and impact frames.
- A repeatable asset/animation pipeline for Uhud and Khandaq.

**Non-Goals:**
- Photoreal humans, facial rigs, or a React 3D rewrite.
- Rebuilding all 1,313 crowd members as skinned characters.
- Additional battles or historical content beyond the approved ledger.

## Decisions

### Hybrid cast: rigged heroes, instanced crowd
The ~10 named figures use rigged GLTF; the 1,313 crowd stays instanced with a procedural gait/thrust. A fully skinned crowd is not viable on the mobile budget; a fully procedural hero will not produce natural motion quickly enough.

### Assets: CC0 rigged heroes; Gobkit round rejected
Round 1 used the Gobkit **Free Character Pack Vol.3** (`Footman`, `Scout`, `Archer`, `HeavyWarrior`, `KnightCaptain`, `PeasantMilitia`). It is CC0, direct `.glb`, rigged, with `Idle`, `Walk`, `Run`, `Attack`, `Hit`, `Death`, `Special`, and a fixed **7×** scale brings it to ~1.75 m. The side-by-side sheet, however, showed **chibi/Clash-of-Clans proportions with exposed faces** — a weaker fit than the current model, not a stronger one. Rejected.

Round 2 tests **KayKit Adventurers** and **Quaternius Animated Men / Ultimate Modular Men** (both CC0, normal-proportioned, rigged, face-coverable). The chosen champion/soldier/Quraysh still needs a side-by-side sheet before the hero frame. `GLTFLoader` and `SkeletonUtils` remain in the pipeline. Faces are covered with a procedural turban + face veil (Muslims) or a full helm/mask (Quraysh).

### Hero-frame test before the rebuild
`app/proto/hero.html` is a standalone proof: terrain patch, well, tent, horse, champion, soldier, Quraysh fighter, dawn light, haze, post, a five-second advance → strike → hit with a wide-to-close cut. It uses the real assets and real animations; if it does not clear the bar, the direction changes before the scene rewrite.

### Field: heightfield + atmosphere, not a texture plane
A displaced heightfield with sculpted dunes, stratified rock (Gobkit Nature Kit), scrub, procedural palms and layered tents; a warm key, cool fill, `FogExp2`, aerial perspective and a restrained CSS/ shader grade. The plinth/duel/well layout stays as the corrected build q layout.

### Motion: gait, thrust, hit, fall
Crowd: per-instance leg/arm/spear motion (or a small set of instanced body parts) with phase offsets, plus formation dispersion. Heroes: `AnimationMixer` with crossfades; the strike has a hit reaction, dust, a small camera shake and a held impact.

### Transitions: a shot list
The phase director gets per-phase shots: establishing, tracking, duel side, command close, rout pull-back, reckoning overview → al-Qalib. Cuts/holds are deliberate; the paused orbit remains.

### Performance
Crowd instancing/LOD; hero clones limited; field batched; post minimal; measure 390×844 draw calls/tris and keep the low-hundreds budget.

## Risks / Trade-offs

- **Historical fit of the hero gear** → add turbans/veils/robes, shields and spears; treat it as a carved maquette, not a documentary; the hero-frame review decides.
- **Faces remain visible under some animations** → attach the veil/turban to the head bone, not the root; verify in the close shot.
- **Hero asset scale/units** → verify each candidate against the well/tent; do not reuse the Gobkit 7× blindly.
- **Crowd gait cost** → split the man into a few instanced parts or use a vertex shader; benchmark before the full rebuild.
- **Scope** → the hero-frame gate prevents a full-scene rewrite before the look is approved.
- **No reference** → the owner approved the hybrid recommendation; the hero frame is the reference-setting artifact.

## Migration Plan

1. Finish round 2 of the asset sheet (KayKit/Quaternius): scale, face coverage, weapons, style.
2. Build the hero-frame prototype and capture stills + a five-second clip.
3. Owner gate. If approved:
4. Rigged heroes in the duel/vignette; crowd gait; field/atmosphere/post; shot list.
5. Mobile performance; integrate Badr; build **r**; `PROGRESS.md`; local commit; no push.

Rollback: the hero prototype is isolated under `app/proto/`; the main Badr scene stays on build q until the gate.

## Open Questions

- Which round-2 model (KayKit vs Quaternius) best reads as the Muslim champion vs the Quraysh champion? Resolve on the asset sheet/hero frame.
- Is a full crowd gait affordable at 1,313 men on the phone? Resolve with the hero-frame/bench pass.
- Does the owner want a specific historical silhouette for the turban/veil? No reference supplied; use the carved-maquette abstraction.