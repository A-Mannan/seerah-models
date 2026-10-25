# Progress

## Visual quality rebuild — in progress (not committed as a build)
- Direction locked with the owner: **hybrid carved maquette**; **heroes-only CC0 rigged GLTF**; faces covered; no Prophet ﷺ.
- **Round 1 asset sheet rejected:** Gobkit human003 is chibi/Clash-of-Clans with exposed faces, not the carved-maquette bar. Evidence: `.taste-skill/inspect/asset-sheet.jpg`.
- **Current task 1.3:** round 2 asset sheets — KayKit Adventurers and Quaternius Animated Men/Ultimate Modular Men.
- **Next:** 1.4 licence record → 2.1 hero-frame field/light → 2.2 rigged figures → 2.3 five-second cut → 2.4 stills/clip → **2.5 owner gate**. Full rebuild starts only after 2.5.
- OpenSpec: `openspec/changes/battle-visual-quality/`.
- Build q remains local; no push.

## Build q — local, not pushed
Badr · the battle. Cache-bust `?v=20261023q`.

### Shipped
- **Field layout audited.** The wells moved east into the gap between the Quraysh centre and right divisions, clear of the 3v3 and the command lane. The ʿarish moved behind the Muslim line at the rear (headquarters reading). The command plinth is hidden during the duel/advance and appears for the sand beat; the plinth no longer catches the palm-shadow checker.
- **Named figures.** Six faceless champion figures now stand at their standards (Ḥamzah, ʿAlī, ʿUbaydah / Shaybah, al-Walīd, ʿUtbah) and move/fall with them. The first three Anṣār also have faceless figures at their standards, stepping out and withdrawing with the trio.
- **Advance dispersion.** Squads and men spread laterally/unevenly during the advance; the clash keeps a smaller ripple and the rout scatters. The three Quraysh divisions remain legible.
- **Aftermath bodies.** The 70 captives, 70 Quraysh dead and 24 leaders at al-Qalib now have bodies, heads, arms, legs and feet; the captives are unarmed. No faces.
- **Build p carried forward:** Abu Jahl vignette, mass detail/spear hedge, story cameras, gated events, mobile play/brand/type.

### Verification
- `node --check app/js/battle.js` / `main.js`: pass.
- Performance: **169 draw calls**, **~694k triangles**; `benchMass` **~1.7–2.7 ms** at 390×844.
- Probes: `.taste-skill/probe-{desktop,mobile,checks,duel}.mjs`; stills in `.taste-skill/inspect/`.
- Gates: design-taste lint **0 FAIL / 0 WARN**; inspect **0 FAIL / 2 WARN** (intentional brand mixed face; dawn cream palette).
- Wells/rain: Muslims reached the wells first on al-Ḥubāb's advice, seized the nearest, built a basin and stopped the others; the Quraysh were denied water. The night rain refreshed/steadied the Muslims and held back the Quraysh; Qur'an 8:11 adds purification and firm feet; 8:42 places the two banks. See BADR-018/019, Raheeq p. 135.

### Known limits
- The 3v3 is now a wide side view with the six figures at their standards; the wells no longer overlap, but the six are not all hero-framed at once.
- Phone labels show the two central youths; the outer names can still be crowded off at 390px.
- The ʿarish is behind the line; the graded ledger (BADR-020) describes the headquarters and guards but does not grade which flank, so the left-rear side is a staging choice.
- Fonts are still Google-hosted; the shared engine/per-battle split is not started; Uhud/Khandaq remain blocked.

## Build p — local, committed 38b7264
- Abu Jahl vignette; mass action figures; story cameras; chip row removed; gated events; mobile type/play/brand; wells clear of the command lane.
- Gates: lint 0/0; inspect 0 FAIL / 2 WARN (intentional brand mixed face; dawn cream palette).

### Earlier
- **o** — aftermath counts, angel shimmer, persistent event labels.
- **n** — event layer, Anṣār trio, al-Qalib focus, camps and type.

### Next
- OpenSpec `badr-phase-2-finish`: 7.1 architecture direction and 7.2 separate engine-split change remain open.
- Build q is committed locally only; no push until owner approval.