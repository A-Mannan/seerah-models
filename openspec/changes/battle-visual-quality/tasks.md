# Tasks

**Current:** 1.3 — second asset sheet. Round 1 (Gobkit human003) is **rejected**: chibi/Clash-of-Clans proportions, exposed faces, not the carved-maquette bar. Next candidates are KayKit Adventurers and Quaternius Animated Men (both CC0, normal-proportioned, rigged), then the hero frame.

**Next:** 1.3 asset sheet → 1.4 licence → 2.1 field/light → 2.2 rigged figures → 2.3 five-second cut → 2.4 stills/clip → **2.5 owner gate**. Do not start the full rebuild before 2.5.

## 1. Direction, assets and licence

- [x] 1.1 Lock the hybrid carved-maquette direction, heroes-only CC0 rigged GLTF, face covering and no-Prophet rule; record the decision in `AGENTS.md`.
- [x] 1.2 Round 1 asset sheet (Gobkit human003) reviewed and **rejected** — chibi proportions and visible faces; not the target. Evidence: `.taste-skill/inspect/asset-sheet.jpg`.
- [ ] 1.3 Build round 2 asset sheets: KayKit Adventurers (Knight/Rogue/Ranger) and Quaternius Animated Men / Ultimate Modular Men; normal proportions, rigged, CC0, face-coverable. Choose the champion, soldier and Quraysh champion. Verify side-by-side still.
- [ ] 1.4 Record the CC0 licences, source URLs, `GLTFLoader`/`SkeletonUtils`, and asset paths in `app/assets/models/LICENSES.md`; verify the files load from the local server.

## 2. Hero-frame proof (no full rebuild yet)

- [ ] 2.1 Build `app/proto/hero.html` + scene: a heightfield sand patch, one sculpted dune, stratified rocks, scrub, a masonry well, a layered tent, a horse, the dawn key/fill, `FogExp2` haze and a restrained post grade. Verify a wide still.
- [ ] 2.2 Load the chosen champion, soldier and Quraysh fighter; add the turban/face veil or full helm, shield and spear; set up Idle, Walk, Attack, Hit and Death. Verify a close still with no face visible.
- [ ] 2.3 Choreograph five seconds: advance → strike → hit → recover, with a wide-to-close cut at the strike, a dust puff, a small camera shake and a held impact. Expose `HERO.seek(t)` for capture. Verify the cut and impact.
- [ ] 2.4 Capture three stills and a five-second clip; compare against build q; store under `.taste-skill/inspect/hero-*` and record the paths in `PROGRESS.md`.
- [ ] 2.5 **Owner review gate:** approve the hero frame before any full-scene rebuild. If rejected, revise the direction or asset choice; do not proceed to section 3.

## 3. Full rebuild (only after 2.5)

- [ ] 3.1 Apply the approved rig, materials, turban/veil/helm and weapons to the six champions and three Anṣār in the main Badr duel/vignette.
- [ ] 3.2 Replace the sliding crowd with a leg gait, weapon thrust and hit ripple; keep the 1,313 men instanced/LODed and the three Quraysh divisions legible; benchmark.
- [ ] 3.3 Rebuild the field: heightfield, sculpted dunes, rocks/scrub, palms, wells, layered camps, haze, aerial perspective and the post grade.
- [ ] 3.4 Replace phase lerps with the approved shot list: establishing, tracking, duel side, command close, rout pull-back, reckoning overview → al-Qalib; cuts/holds/impact frames.
- [ ] 3.5 Integrate Badr, run desktop/mobile/perf gates, cut build **r**, update `PROGRESS.md`, commit locally; do **not** push without explicit approval.
- [ ] 3.6 Split the shared engine (renderer, camera, clock, labels, orbit, particles, merge) from per-battle data/scene modules before Uhud/Khandaq.

## Workflow follow-up

- Archive after the owner accepts the rebuilt Badr and the local commit.
- Never push without explicit owner approval.