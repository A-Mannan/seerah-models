# Progress

## Build r — carved-maquette rebuild (local, not pushed)
Badr · the battle. Cache-bust `?v=20261025r`.

### Shipped
- **Owner gate passed.** The hero frame (`app/proto/hero.html`, Quaternius rig, carved-maquette
  field, dawn grade) was approved on 2026-10-25; section 3 of `battle-visual-quality` proceeded.
- **Rigged heroes.** The six duel champions and the three Anṣār are rigged Quaternius Adventurers
  (CC0): one merged skinned mesh per body (single draw call per figure), cloth turban or iron helm
  over the head — no face ever visible — a sword or spear on the right wrist and a shield strapped
  to the left forearm with a visible leather strap. Clips (idle/walk/attack/hit/death) are driven
  from the battle clock with structural crossfades, so every seek lands on the same pose. The
  attack beats follow ledger BADR-028: Ḥamzah kills Shaybah, ʿAlī kills al-Walīd, ʿUtbah wounds
  ʿUbaydah (hunched stagger), Ḥamzah finishes ʿUtbah. Fallen champions crumple through the Death
  clip while their standard topples separately. The Abu Jahl plinth vignette keeps its approved
  faceless action figures.
- **Living crowd.** The 1,313 instanced men now march with a real leg gait: each leg is its own
  instance pivoting at the hip, scissor-swinging in step with the battle clock; spears level and
  thrust; a stagger ripple travels back through the ranks in the mêlée. Hot-loop matrix writes
  skip euler/quaternion compose entirely.
- **Field rebuild.** The flat tiled plane is gone: a displaced heightfield with a flat battle
  corridor and sculpted dune fields beyond, framing mounds at the near corners, valley walls
  rising to the horizon, wind-ripple normal map, stratified rocks, instanced scrub, masonry wells
  (three courses + parapet + curb stones + beam and bucket), goat-hair ridge tents with guys and
  pegs for both camps, pebbles seated on the terrain. `FogExp2` haze, a shader dawn sky with the
  low sun, and the hero frame's CSS post grade (warm cast, grain, vignette) plus ACES tone
  mapping.
- **Shot list.** Phase lerps replaced by per-phase shots with motivated cuts, holds and impact
  frames: establishing crane, duel side then close lanes, advance tracking, clash at the wells,
  the sand beat in three cuts with a held aftermath, rout hold → pull-back → scatter overview,
  reckoning overview → al-Qalib push. A short camera knock lands on each kill, the first clash,
  the strike and Abu Jahl's fall.

### Verification
- `node --check app/js/battle.js` / `main.js`: pass.
- Gates: design-taste lint **0 FAIL / 1 WARN** (em-dash count); inspect **0 FAIL / 0 WARN** with
  allowances `font-not-dealt,gradient,mixed-font-headline,palette-cream` (the grade is the
  approved hero-frame look; the brand mixed face and dawn cream are intentional).
- Perf: desktop 1440×900 **243 draw calls / ~750k triangles**; mobile 390×844 **246 calls**,
  `benchMass` **~2.9 ms** at 1× (10.3 ms at 4× CPU throttle; adaptive pixel-ratio fallback armed).
- Probes: `.taste-skill/probe-rebuild.mjs` (full reel stills), `probe-duel2.mjs` / death-pose
  checks (dead champions' head-bone height ≈ 0.1 after any seek), `probe-perf.mjs`; stills in
  `.taste-skill/inspect/r*.jpg`, `r2-*.jpg`, `m-duel.jpg`.
- Historical fit: kill attribution and the Anṣār trio refusal stay on BADR-028/013; the wells,
  banks and camps keep the build q layout audit; no new claims introduced.

### Known limits
- The hero figures still read low-poly game rather than carved maquette (modern base mesh); the
  material/palette pass is the next lever, not more attached props.
- The crowd gait is a rigid scissor swing per leg, not a skinned walk — correct at maquette
  distance, stiff in close-up.
- ʿUtbah's death completes just past the duel phase cut; the cut to the advance hides the snap.
- The shared engine/per-battle split is next (task 3.6); Uhud/Khandaq remain blocked.

## Build q — local, committed 04e7436
Named figures, layout audit, dispersion, aftermath bodies, event layer, mobile type/play/brand.
Gates at the time: lint 0/0; inspect 0 FAIL / 2 WARN.

### Earlier
- **p** — Abu Jahl vignette; mass action figures; story cameras; chip row removed; gated events.
- **o** — aftermath counts, angel shimmer, persistent event labels.
- **n** — event layer, Anṣār trio, al-Qalib focus, camps and type.

### Next
- OpenSpec `battle-visual-quality` 3.6: split the shared engine (renderer, camera, clock, labels,
  orbit, particles, merge) from per-battle data/scene modules before Uhud/Khandaq.
- Build r is committed locally only; no push until owner approval.
