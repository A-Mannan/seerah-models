# Seerah Models — progress

## Phase 1 — Badr ledger (approved)
`data/ledger/badr.json`: 74 graded entries, glossary, 29 live-fetched Qur'an anchors, hadith log.
`app/assets/data.js` bundles LEDGER + GLOSSARY + VERSES.

## Phase 2 — the 3D battle experience
Owner's brief: a **pure visual** 3D model — no article, no narration, no references, no scholar's mode.

### Art direction: the dawn maquette (approved)
A deliberately stylized, museum-diorama battlefield: sculpted sand, one theatrical dawn light,
silhouette-first standards, brass instrument-panel UI. Not attempting photoreal primitives.

### Current state
- `app/index.html` — full-screen field; masthead; army legend with swatches; full-width instrument
  deck (play, hairline phase timeline, speed, counter, replay, camera presets, free orbit); sound;
  English / اردو language toggle.
- `app/css/style.css` — dawn palette; **Cormorant Garamond** display + **Archivo** UI; Nastaliq Urdu +
  RTL; quiet borders, one radius; phone composition.
- `app/js/battle.js` — Three.js r128:
  - dawn sun with soft shadows, sky dome, moon, warm lamps; textured sand (albedo + bump),
    sculpted dunes beyond a flat battle plain, framing dunes, pebbles, rocks, scrub, palms;
  - masonry wells (two courses, shaft, bucket, windlass), basin, trough, ʻarish, well of the 24;
  - camps with ridge tents, flaps, poles and guy ropes;
  - **squads and platoons**: 8-man squads (spear stand, overlapping shield wall with rims, planted
    sword) under platoon standards; ~313 Muslims vs ~1,000 Quraysh in instanced meshes that advance,
    clash and rout with their platoon;
  - two horses (Muslims) and caparisoned cavalry (Quraysh), pack camels;
  - champion standards, duel meeting in the middle, falls per Bukhari 3965; gravel/sand; rout;
  - phase cameras + presets (aerial = map), orbit, label collision culling; labels in EN/UR.
- `app/js/main.js` — clock, scrub, cameras, sound, keyboard, language switching.
- `app/js/audio.js` — procedural wind bed, clash rumble, gravel crack.

### Latest pass — event layer, camp and type (build n)
- Quraysh camp doubled to 15 tents (10 front, 5 back) plus extra clutter; baggage train moved behind it.
- The three division pennants now sit on the existing front-rank standards; duplicate division banners
  removed; qBands index mapping corrected so standards stay with their divisions.
- Brand reads **badr · the battle**; display face is **Cormorant Garamond** (clearly distinct from the
  old Spectral), UI is **Archivo**.
- Abu Jahl's standard labelled on the Quraysh side; Muʿādh/Muʿawwidh markers on the Muslim side;
  Ikrimah on the Quraysh side; Bilāl on the Muslim side, ʻUmayyah's fallen standard on the Quraysh side.
- The first Ansari trio (ʻAwf, Muʿawwidh, Ibn Rawāḥah) steps out, is refused, and withdraws before the
  Hashimi champions engage; label `the Anṣār trio (RA)`.
- Angels: a gold shimmer over the Muslim line at the clash, labelled `the angels · 8:9`; no figures.
- The reckoning camera now ends on **al-Qalib · the well of the twenty-four** (Bukhari 3976/4026).
- The ʻarish is labelled `the ʻarish · the Prophet’s station (PBUH)`; landmark labels clamp on-screen on phones.
- Scope: battlefield events only. Ransom/prisoners, Madinah news and Abu Lahab's death are excluded.

### Latest pass — aftermath counts and visible event layer (build o)
- Event labels are persistent and full-strength in the map view: Muʿādh & Muʿawwidh (Muslim side),
  Ikrimah (Quraysh side), Bilāl (Muslim side), ʻUmayyah (Quraysh side), the Anṣār trio, and the
  Quraysh refusal at the first challenge.
- The angels: gold shimmer over the Muslim line at the clash, labelled `the angels · 8:9`.
- Aftermath (rout/reckoning only): 14 graves (BADR-047), 70 Quraysh dead (BADR-048), 70 unarmed
  captives (BADR-048/050), captured standards/shields/spears/armour/chest/camels (spoils, BADR-052),
  and the 24 leaders at al-Qalib (BADR-049).
- `?debug=1` shows a tiny build tag for cache diagnosis; the public UI stays clean.

### Verification (latest)
- `lint.mjs --app`: 0 FAIL / 0 WARN.
- `inspect.mjs --app`: 0 FAIL, 2 WARN (font-load timing) at 1440 / 768 / 390.
- Full sweep: all 7 phase stills + aerial/duel/wells presets + desktop/tablet/phone + EN/UR checked.
- Interaction: 1:1 drag with fling inertia, continuous turntable drift when paused,
  zoom-to-cursor (point under cursor stays fixed; double-click recenters), 0.5/1/1.5/2 speeds.
- Sound: wind bed + murmur, clash rumble, sword clangs, arrow twangs, gravel crack.

### Known limits (honest)
- Low-poly primitive geometry: animals, tents and standards are stylized, not realistic.
- Sand texture tiles visibly at distance; no PBR/post-processing.
- Photoreal would require authored assets (GLTF/PBR/textures) — a separate pipeline.

### Next
- Label density pass at widest views; Muslim line foreground detail parity.
- Sound mix and camera choreography polish.
- Uhud / Khandaq ledgers blocked pending owner approval.
