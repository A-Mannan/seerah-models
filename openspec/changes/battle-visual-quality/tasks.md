# Tasks

**Current:** 3.5 — build **r** is cut (gates passed, `PROGRESS.md` updated); commit locally, then
3.6 engine split.

**Done:** 1.x direction/assets/licence · 2.x hero frame + owner gate (approved 2026-10-25) ·
3.1 rigged champions · 3.2 crowd gait · 3.3 field rebuild · 3.4 shot list.

**Next:** 3.5 local commit → 3.6 shared engine split before Uhud/Khandaq.

## 1. Direction, assets and licence

- [x] 1.1 Lock the hybrid carved-maquette direction, heroes-only CC0 rigged GLTF, face covering and no-Prophet rule; record the decision in `AGENTS.md`.
- [x] 1.2 Asset round 1 (Gobkit human003): reviewed and **rejected** — chibi proportions, exposed faces. Evidence: `.taste-skill/inspect/asset-sheet.jpg`, round 1.
- [x] 1.3 Asset round 2: **KayKit rejected** (big heads, Fortnite silhouette, faces visible). **Quaternius Adventurer chosen** — normal proportions, 24 clips (`Idle_Sword`, `Walk`, `Sword_Slash`, `HitRecieve`, `Death`), loads at 0.01 root scale via `FBXLoader` + `fflate`. Faces recoloured + wrapped; weapons attach to `WristR`. Evidence: `.taste-skill/inspect/hero-wide.jpg`.
- [x] 1.4 Licences, source URLs, loaders and local paths recorded in `app/assets/models/LICENSES.md`; all files verified loading from the local server.

## 2. Hero-frame proof (no full rebuild yet)

- [x] 2.1 `app/proto/hero.html` + `app/proto/hero.js`: displaced heightfield with wind-ripple normal map, sculpted dune ridge, stratified rocks, scrub, pebbles, three masonry wells, two goat-hair ridge tents with guy ropes, palms, dawn key/fill, `FogExp2` haze and a restrained CSS post grade. Verified wide still.
- [x] 2.2 Champion, soldier and Quraysh fighter on the chosen rig, with cloth headwrap / turban or helm, sword and spear; `Idle_Sword`, `Walk`, `Sword_Slash`, `HitRecieve` wired through a deterministic `setAction(fig, clip, t)`. No face visible in the close shot. **Shields deferred** — a rigid shield on this wrist reads as a floating tray; needs a strapped-forearm prop before it ships.
- [x] 2.3 Five-second beat: advance → slash at 2.30 → impact at 2.62 → hit reaction at 2.74 → recover; wide-to-close cut at 2.05, dust burst, camera shake and a held impact. `HERO.seek(t)` poses the whole frame.
- [x] 2.4 Three stills + a five-second clip captured; perf at 1600×900 is 186 draw calls / 111k triangles:
  - `.taste-skill/inspect/hero-wide.jpg`
  - `.taste-skill/inspect/hero-strike.jpg`
  - `.taste-skill/inspect/hero-recover.jpg`
  - `.taste-skill/inspect/hero-clip.mp4` (5.0 s, 12 fps source)
  - Probes: `.taste-skill/probe-hero.mjs`, `.taste-skill/probe-hero-clip.mjs`
- [x] 2.5 **Owner review gate:** approve the hero frame before any full-scene rebuild. If rejected, revise direction or asset choice; do not proceed to section 3. **Approved 2026-10-25:** the owner directed "complete all the remaining tasks" with the hero frame as approved reference (Quaternius rig, carved-maquette field, dawn grade). Section 3 may proceed.

## 3. Full rebuild (only after 2.5)

- [x] 3.1 Apply the approved rig, materials, headwrap/helm and weapons to the six champions and three Anṣār in the main Badr duel/vignette. Add the strapped shield. *(Quaternius rig, one merged skinned mesh per body, turban/helm, wrist weapons, strapped forearm shields; clips driven from the battle clock with structural crossfades; kill beats per BADR-028.)*
- [x] 3.2 Replace the sliding crowd with a leg gait, weapon thrust and hit ripple; keep the 1,313 men instanced/LODed and the three Quraysh divisions legible; benchmark. *(Per-leg hip-pivot instances, battle-clock gait, spear thrust, rank ripple; 246 calls / ~2.9 ms benchMass at 390×844.)*
- [x] 3.3 Rebuild the field: heightfield, sculpted dunes, rocks/scrub, palms, wells, layered camps, haze, aerial perspective and the post grade. *(Flat corridor + dune fields, ripple normal map, masonry wells, ridge tents, FogExp2, dawn sky, ACES + CSS grade.)*
- [x] 3.4 Replace phase lerps with the approved shot list: establishing, tracking, duel side, command close, rout pull-back, reckoning overview → al-Qalib; cuts/holds/impact frames. *(Per-phase SHOTS with cuts/holds and a deterministic impact-shake table.)*
- [ ] 3.5 Integrate Badr, run desktop/mobile/perf gates, cut build **r**, update `PROGRESS.md`, commit locally; do **not** push without explicit approval.
- [ ] 3.6 Split the shared engine (renderer, camera, clock, labels, orbit, particles, merge) from per-battle data/scene modules before Uhud/Khandaq.

## Known limits of the hero frame (carry into 3.x)

- Figures still read low-poly game rather than carved maquette: the base mesh is a modern shirt and
  trousers. Rigid cloth add-ons (tunic, sash, cloak) were tried and removed — they read as barrels
  and boards on this rig. The fix is either a purpose-built skinned garment mesh or a stronger
  material/palette pass, not more stuck-on planes.
- The walk clip swings the sword to a horizontal "pistol" read at some frames; the attack and hit
  poses are correct. Consider a slower walk time-scale or a sword-carry pose.
- Quaternius horse reads as a toy at this scale; it is out of the hero frame.
- Palms are procedural and still slightly graphic; the tents want interior clutter (bags, pots,
  a fire) for the camp layer.

## Workflow follow-up

- Archive after the owner accepts the rebuilt Badr and the local commit.
- Never push without explicit owner approval.