# Progress

## Build s — review fixes (local, not pushed)
Badr · the battle. Cache-bust `?v=20261025s`. Owner review of build r drove this round.

### Changed after the owner's review
- **The 3v3 is now a fight.** The six champions walk out bare of their standards (the standards
  stay with the line as unit markers — the old pole-and-cloth forest at the mid-ground is gone),
  meet in pairs at sword range and exchange blows keyed to BADR-028: Shaybah swings, Ḥamzah
  answers and kills (0.74); al-Walīd and ʿAlī cross blades, al-Walīd falls (0.86); ʿUtbah's
  thrust wounds ʿUbaydah (0.9); Ḥamzah finishes ʿUtbah (0.93). Hit reactions precede each death;
  champion labels follow the walking figure, not the standard.
- **The pushed build's camera paths are restored** (origin/main, build q): one continuous move
  per phase — establishing crane, the SE duel view, the advance, the wells, the sand, the rout
  pull-back, the reckoning. The interim shot-list cuts, holds and camera knocks are gone, and
  the portrait rule is the pushed uniform backing-off.
- **Bilāl (RA) and ʻUmayyah (BADR-041)**: ʻUmayyah's standard now flees along the rout path with
  Bilāl's pursuing; it falls when the crowd reaches him and Bilāl's stands over it, labels on.
- **The Abu Jahl vignette strikes with swords simultaneously** (BADR-037: the two Helpers struck
  together and both were ruled his killers) — the old spear thrust is gone; Muʿādh takes up the
  left sword after Ikrimah's cut.
- **Champion standards cleaned**: no more bundled spears / planted sword / parked shield at the
  pole — the "3–4 sticks" the owner flagged. Band standards keep their spear stands.
- **March fixed**: gait frequency now matches actual travel speed (the advance was sliding at
  ~3× foot speed), the rout is a forward-leaning run with wider scatter, the fight plants the
  stance.
- **Floating dot particles removed** (the irrelevant motes); the 8:9 angel shimmer is tighter
  over the Muslim line and quieter; dust stays only in the sand beat.
- **UI polish**: frosted top bar and deck, larger scrub head, play-button press state, the active
  phase name under the timeline on phones, play button reads "play", kept to the taste gates.

### Shipped in build r (carried)
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
- **Engine split (task 3.6).** `app/js/engine.js` carries everything a future battle reuses —
  renderer boot, dawn sky/lights, heightfield, prop builders, static merge, the instanced crowd
  with its gait, the rigged-hero rig and deterministic clip driver, the label pass, the camera
  director (shot list, orbit, pinch, adaptive quality) and the particle systems. `app/js/badr.js`
  keeps only Badr: layout, formations and plans, the Abu Jahl vignette, ledger-graded copy, the
  choreography (`applyFrac`) and the public `BATTLE` API (unchanged for `main.js`). Verified
  behavior-identical: same draw calls/triangles, same clips and death poses after seeks, gates
  0 FAIL. Uhud/Khandaq can now be built as data/scene modules on the same engine.

### Verification
- `node --check engine.js / badr.js / main.js`: pass.
- Gates: design-taste lint **0 FAIL / 4 WARN** (two intentional sticky-bar blurs + em-dash count);
  inspect **0 FAIL / 0 WARN** with allowances `font-not-dealt,gradient,mixed-font-headline,palette-cream`.
- Perf: desktop 1440×900 **223 draw calls / ~745k triangles**; mobile 390×844 **233 calls**,
  `benchMass` **~2.3 ms** at 1× (6.2 ms at 4× CPU throttle; adaptive pixel-ratio fallback armed).
- Probes: `.taste-skill/probe-rebuild.mjs`, `probe-fix.mjs` (duel exchange, sand strike, Bilāl
  chase), `probe-perf.mjs`; stills in `.taste-skill/inspect/s*.jpg`.
- Historical fit: the duel exchange, kills and ʿUbaydah's wound stay on BADR-028; the Abu Jahl
  simultaneous sword strike on BADR-037; the Bilāl/ʻUmayyah reckoning on BADR-041; the wells,
  banks and camps keep the build q layout audit; no new claims introduced.

### Known limits
- The hero figures still read low-poly game rather than carved maquette (modern base mesh); the
  material/palette pass is the next lever, not more attached props.
- The crowd gait is a rigid scissor swing per leg, not a skinned walk — correct at maquette
  distance, stiff in close-up.
- ʿUtbah's death completes just past the duel phase cut; the cut to the advance hides the snap.
- Uhud/Khandaq remain blocked pending owner approval.

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
