# Progress

## Atlas gate — visual doors (on build z, local, not pushed)
Every door now carries a window onto the ground it opens. The gate keeps its full-bleed field, bone
index sheet and verdigris survey light; the register below simply shows the five fields instead of
describing them. No scene, camera, choreography, ledger or model page changed. Cache-bust
`?v=20261028z5` on the landing stylesheet and script.

### Shipped
- **A field window on every plate.** Each of the five doors reuses the 1400w capture the stage
  already preloads — Badr's tents and wells, Uhud's archers' hill, the Khandaq trench lines,
  Khaybar's fort shelf, Muʿtah's wādī — so there are no new image files and no extra sources. The
  window is decorative (`aria-hidden`), unmounted from the type, and follows the active field.
- **Three responsive forms.** A 44–68px strip under the name on desk (228×68 at 1440, 162×53 at
  1024); a 115×48 stamp at the row's top right on tablet; a 54–59×34 stamp beside the enter line
  on phone; a 22px full-width strip at the foot of each column in landscape. Tablet rows deepened
  to 106px so the stamp clears the enter line.
- **Touch reads without hover.** The swipe gallery stays as an enhancement, and the row stamps now
  identify all five fields at rest: the active field's window is fully lit while the others sit
  back. Hover or focus still previews the field, the plate, the folio and the flood.
- **Ahead, one quiet line.** The three-field register is now a single sentence — “Ḥunayn and Fatḥ
  Makkah in preparation · the Hijrah under study” — with Arabic inline on desk and tablet and
  hidden on phones. No years and no links on fields that are not live.

### Verification
- Eight viewports — 1440×900, 1180×820, 1024×768, 901×768, 768×1024, 390×844, 320×800 and
  844×390 — one screen at every one, no page scroll, no horizontal overflow, no console errors.
  Stage / band / ahead at 1440: 900 / 329 / 44; at 768: 458 / 566 / 36; at 390: 363 / 481 / 56;
  at 320: 344 / 456 / 56.
- Door windows measured and checked for collision at every viewport: desk strips sit below the name
  and above the enter line; tablet stamps clear both; phone stamps clear the arrow at 390 and 320;
  landscape strips run under the enter line. The 320 arrow box grazes the stamp box by 1px; the
  visible arrow is separated and the frame reads clear.
- Hover with a real mouse move (Khandaq, then focus Khaybar) switches the field, plate, folio, flood
  and window; the focus ring is visible. On a 390 phone the gallery swipe to Khandaq and Muʿtah
  updates plate, folio and stamps with no errors.
- Landing lint **0 FAIL / 4 WARN** (decorative numbering, two pre-existing `box-shadow: none`
  resets, the standing em-dash aggregate); `inspect --app` **0 FAIL / 1 WARN** — `app-title-size`
  flags the 36px editorial masthead, which is the approved landing scale. `node --check` clean on
  the landing script.

### Known limits
- The windows are still photographs of the models, not live canvases; the gate reuses the stage's
  five 1400w assets rather than adding smaller crops.
- On landscape phones the strips are 22px deep: enough to tell the fields apart, not to survey
  them. The plate carries the plan.
- The gate still lists Ḥunayn, Fatḥ Makkah and the Hijrah as ahead — no routes, no years, no links
  until those models are live.
- The Uhud, Khandaq, Khaybar and Muʿtah ledgers remain `awaiting_owner_review`; this pass is local
  only, no push.

## Build z — label gating repaired across all five fields (local, not pushed)
A label that belongs to one beat could hide once and never return: the gate branches wrote
`visibility:hidden` without resetting the label's state, so the visibility check never fired again.
They now clear the state and screen spot, and a returning label snaps to its anchor instead of
gliding in from a stale position. No scene, camera, copy or ledger changed. Cache-bust
`?v=20261028z` on all five model pages and the gate; routes regenerated.

### Shipped
- **Gate state reset.** All six gate branches — unit `hideAfterPhase`, `hideBeforePhase`, `ph` and
  `tRange`, plus landmark `ph` and `tRange` — clear `visState` and `sx` when they hide a label.
- **Snap on return.** A label coming back from hidden re-enters at its projected anchor; labels that
  stay visible keep the 0.3 smoothing. A seek can no longer leave a stale smoothed position in the
  collision pass.

### Verification
- Repro probe: Muʿtah phase 3 in Urdu at phaseT 0.55 shows the three standards and both Rawāḥah
  event labels — previously lost after an EN→UR switch and a seek.
- Visible labels per phase across all five battles — Badr [7,7,7,8,10,10,12]; Uhud [6,3,2,2,2,4,4];
  Khandaq [3,3,2,5,6,3,2]; Khaybar [8,8,4,3,5,5]; Muʿtah [6,3,5,6,3,5,4] — zero console errors.
- `node --check` clean on every touched script. Lint **0 FAIL / 12 WARN** (pre-existing overlay
  glass/shadows, the atlas kicker and the standing em-dash aggregate); inspect **0 FAIL / 0 WARN**
  on `app/mutah.html`.

### Known limits
- Labels that become visible still enter through the 0.3 smoothing; only the hide→show path snaps.
- The Uhud, Khandaq, Khaybar and Muʿtah ledgers remain `awaiting_owner_review`.
- Build z is committed locally only; no push until owner approval.

## Build y — warm shell, five-field atlas, Atlas gate third pass (local, not pushed)
The model pages return to warm ink and brass; the Atlas gate is rebuilt around one full-bleed
field and a floating bone index sheet; the shared atlas now lists five fields with Muʿtah. The
shell and gate are UI work; the fifth model itself is logged below. Cache-bust `?v=20261027i` on
all five model pages and the gate; routes regenerated.

### Shipped
- **Muʿtah, the fifth model.** A graded ledger of 24 entries (8 CERTAIN, 15 REPORTED, 1 DISPUTED)
  from Raheeq al-Makhtum; the dry wādī, the village on its tell and the olive groves, the reported
  enemy host, the three command standards and the ordered withdrawal; seven phases over 96 s with
  one continuous shot each; a page, a `/mutah/` route and the fifth Atlas door with its captured
  field plate.
- **Warm model shell.** Ink `#14120f`, brass `#c8a84b`, Cormorant at 34/29/25px, a brass play
  button and translucent bar, deck and legend. The cold green/mint palette and thin English type
  are gone.
- **Five-field atlas.** The shell lists Badr, Uhud, Khandaq, Khaybar and Muʿtah with years, places
  and a `here` marker; the sheet is a real `<nav>`, opens from `b` or the bar, and navigates to the
  five routes. Muʿtah is reachable end-to-end from the atlas.
- **Urdu copy pass.** Context-correct terms: `battles` → معرکے, brand → معرکۂ <field>, `field key`
  → میدان کی علامات, `sound on/off` → آواز چالو/بند; phases now read بھگدڑ (rout), پہلو سے حملہ
  (flank), عبور (crossing), رات کا کوچ / شمال کا کوچ (marches) and پرچم · مبارزت (standard · duel);
  the pinch hint no longer transliterates “pinch”.
- **Atlas gate v3.** Full-bleed field, masthead over the scene, a floating bone index sheet with
  numbered plates, a worded folio and register hairlines; hover/focus previews the field and touch
  taps through. One screen at 1440×900, 768×1024, 390×844 and 320×800.

### Verification
- **Muʿtah end to end.** Seven phases re-shot at 1440×900 and checked at 390×844, English and
  Urdu RTL; the `/mutah/` route boots with 7 phases, 95 draw calls and 51 labels, no console
  errors. Phase 3 carries all three standards and both Rawāḥah beats after the row was tightened
  to ±9.
- Official app inspect **0 FAIL / 0 WARN** on `/khandaq/` and `/mutah/`; landing inspect **0 FAIL /
  0 WARN** with the standing gate allowances. `node --check` clean on every touched script.
- Lint **0 FAIL / 12 WARN**, all pre-existing overlay glass/shadows, the atlas kicker and the
  standing em-dash aggregate.
- Urdu RTL at 1440×900 and 390×844: no horizontal overflow, no clipped bar/deck controls; the five
  atlas rows and the ethics line fit the phone sheet after a 3px row trim. Phase names and numerals
  verified on all five pages.
- Fifth door: atlas → `/mutah/` lands with the shell, the seven phases and no console errors.

### Known limits
- The Muʿtah ledger is still `awaiting_owner_review`; the five-field copy mirrors that status.
- The atlas sheet scrolls on very short phones when Urdu line-height expands; content is reachable,
  not clipped.

## Build x — the lean pass: no crowd in the phone depth pass, labels cached (local, not pushed)
The crowd now draws into the depth pass on desktop only, rocks fold into the static merge, and the
label pass stops forcing layout. No composition, choreography or copy changed. Cache-bust
`?v=20261027c` on all four model pages; routes regenerated.

### Shipped
- **The crowd leaves the phone depth pass.** The instanced mass (men, legs, spears, shields, swords)
  was the only caster whose cost scales with the whole army: 4.2M triangles a frame on Khandaq and
  91–98% of the depth pass on Uhud and Khandaq. It casts on desktop and not on mobile, where the
  wide portrait framing loses the contact underfoot without a read. A scene can force either way
  with `castShadow` on `ENGINE.crowd.build`. Per-frame geometry (main + depth) at 390×844:
  Badr 1.21M → 781k, Uhud 2.96M → 1.76M, Khandaq 9.57M → 5.35M, Khaybar 1.38M → 953k.
- **Rocks join the static merge.** `props.rock` built `MeshPhongMaterial` while `isMergeable`
  accepts Lambert only, so every rock stayed three unmerged casters. With `shininess: 0` and flat
  shading the look is identical; Badr's 15 rocks and Khandaq's 23 now fold into the batch. Badr's
  depth pass drops from 524k to 99k triangles.
- **Labels are measured once, not every frame.** Width and height are cached per label and
  re-measured only when the text, the viewport width or a font load changes. The pass used to read
  `offsetWidth`/`offsetHeight` between style writes, a forced layout per visible label per frame;
  now 0 reads in steady state (9 on a language switch).
- **Dead engine surface removed.** The dormant rigged-hero rig and clip driver (337 lines, no
  caller, needing a loader no page loads) is gone. `ENGINE.dawn`, `ENGINE.groundBasalt` and the
  per-scene `PRESETS` stay: the fort-trial pages and the phase-shot tooling still call them.

### Verification
- `node --check` on every `app/js` script; all four pages and the `/badr` route load with no console
  errors, and `?v=20261027c` reaches the route.
- 390×844 phase sweep, 27 stills in `.taste-skill/inspect/build-x/`: labels place, the mass reads,
  no clipped controls. Urdu re-measures and re-fits after the switch.
- Desktop keeps the crowd casters (4 meshes on Badr, 11 on Khandaq), so the dawn contact shadows
  there are unchanged.
- Lint **0 FAIL / 5 WARN** (4 pre-existing sticky-bar glass, the standing em-dash aggregate);
  inspect **0 FAIL / 0 WARN** on `app/khandaq.html`.

### Known limits
- Khandaq is still ~5.35M triangles a frame on a phone: the crowd's main pass now dominates, not
  its depth pass. The next real step there is a crowd LOD, not another depth cut.
- `BATTLE.info()` reports the main pass only; every per-frame figure above adds the depth pass.
- The in-flight Uhud archers'-hill relocation in the working tree was left untouched.
- The Uhud, Khandaq and Khaybar ledgers remain `awaiting_owner_review`.

## Atlas gate + shell — four-door UI polish (on build w, local, not pushed)
The gate and the shared model bar were re-tuned for four doors and 320px phones. Field plates, scene
geometry, ledgers and narrative copy are unchanged. Cache-bust `?v=20261027b` on all four model
pages; routes regenerated from the app pages.

### Shipped
- **The gate.** The visible masthead is now the h1 — the wordmark plus "The life of the Prophet ﷺ,
  mapped in 3D." — at 32px desktop / 26px phone. Door metadata is 13px; the four-door band is
  243px at 1440×900 (27svh); the mobile list tightens to 80px rows at 390. The whole door remains
  the CTA.
- **Small phones.** The "Enter …" label hides at ≤380px and the animated arrow becomes the CTA;
  each row keeps its descriptive `aria-label`. The gate fits exactly at 320×640 and still fits at
  320×568 without scrolling. At 390 the label stays.
- **The shell.** 40px tap targets, no wrapping at 320/360/390; "atlas" hides at ≤380px and the
  "· the battle" suffix at ≤340px; the back arrow keeps its accessible name. Verified in English
  and Urdu RTL on all four routes.
- **Semantics.** The visible wordmark + descriptor is the page h1 (the sr-only duplicate is gone);
  the four doors carry concise accessible names; hover, keyboard focus and Enter verified.

### Verification
- Landing lint **0 FAIL / 0 WARN**; inspect **0 FAIL / 4 intentional WARN** (bone cream, three
  intentional faces, still field instead of video, modest motion). Model shell lint **0 FAIL /
  4 pre-existing sticky-bar glass WARN**; the wider gate run adds the standing aggregate em-dash
  (and a transient engine shadow from a parallel edit). Model inspect **0 FAIL / 0 WARN** with the
  standing allowances.
- Chromium: landing at 1440×900, 1200×900, 1024×900, 960×900, 901×900, 900×900, 768×900,
  430×900, 390×844, 360×740, 320×640 and 320×568 — no horizontal overflow; one screen at
  320×640 and 320×568. Four routes at 320/360/390 in English and Urdu — no wrap, no overflow,
  no console errors; the back link returns to the gate.
- Keyboard: skip → masthead → four doors in order; focus moves the field preview; Enter opens the
  focused route. Hover floods the door, flips type and previews its field.
- `node --check` on every `app/js` script and the landing script; `build-routes.mjs` regenerated
  the four routes clean.

### Known limits
- At ≤380px the CTA is arrow-only; the door name and `aria-label` carry the action.
- The field stays still photography with the Badr day cycle; no video was added.
- CSS-only polish on build w; no build letter was cut. The Uhud, Khandaq and Khaybar ledgers
  remain `awaiting_owner_review`.

## Build w — Khaybar on the shared engine (local, not pushed)
Khaybar · the battle. Cache-bust `?v=20261027a` on all four model pages; routes regenerated.

### Shipped
- **Khaybar is live.** A graded ledger of 21 entries (11 CERTAIN, 8 REPORTED, 2 DISPUTED) from
  Raheeq al-Makhtum pp. 233–239, with Qur'an anchors 48:15 / 48:20 / 48:21; a scene module on the
  shared engine; a page, a route and a live fourth door on the Atlas gate.
- **The field.** The volcanic plain north-west of Madinah — the ḥarrah floor, the oasis groves,
  the fort chain on the shelf (Nāʿim, al-Qamūṣ, the lesser forts), the Muslim camp and the
  besiegers' tents, mantlets and the ram. Muslims ~1,600 against the Khaybar Jews of the forts
  and their Ghatafān auxiliaries, instanced with gait.
- **Six phases, 86 s.** ground → march → forts → qamus → duel → reckoning: the muster, the night
  march and the dawn order (reports differ), the fort-by-fort reduction, the siege of al-Qamūṣ,
  ʿAlī's (RA) march out and the duel with Marḥab, and the reckoning — the pots, the sheep, the
  remaining stores, Ṣafiyya (RA), Jaʿfar's (RA) return.
- **Depiction.** The Prophet ﷺ is never shown; no figure has a face; the duel rides the maquette
  champion/standard language with the Marḥab kill keyed to its graded entries and no invented
  dialogue. English + Urdu labels with (RA)/(PBUH)/ﷺ.
- **Sequential siege.** Deterministic: scrubbing back keeps earlier forts taken; `forts()` reports
  per-fort capture state.
- **Atlas gate.** Fourth door live with its own field plate (`khaybar-fort-800/1400.webp`, captured
  from the model), preview and focus states; four-door layout re-tuned and legible down to 320px.

### Verification
- `node --check` on every touched `app/js` script; JSON parse checks on the ledger.
- Lint **0 FAIL / 5 WARN** (four sticky-bar glass + the aggregate em-dash over the wider file set);
  inspect **0 FAIL / 0 WARN** on `app/khaybar.html` and `app/index.html` with the standing
  allowances.
- Desktop 1440×900: no console errors; **119 draw calls / 811,640 triangles**; `benchMass`
  **0.775 ms** at 1× (2.030 ms at 4× CPU). Phone 390×844: no console errors; **116 calls /
  804,008 triangles**; `benchMass` **0.605 ms**; no horizontal overflow; no clipped labels; Urdu
  RTL with deck `۶ / ۶`.
- All six phases re-shot at 390×844; per-beat label coverage verified on every phase (dawn,
  order, hunger, reward, pots, remain, sheep, Ṣafiyya, Jaʿfar, after).
- Deep link `?phase=duel&debug=1` lands at the duel with the tag `build w · Khaybar on the shared
  engine`. Shared-engine regression probe clean: Badr (7 phases / 76 s), Uhud (7 / 74), Khandaq
  (7 / 78, perf unchanged at 216 calls / 5.27M tris) and Khaybar (6 / 86) all load with zero
  console errors and Urdu RTL.
- Landing probe at 1440/1180/1024/820/390/320: four doors fit, no spill, no reachable horizontal
  scroll.

### Known limits
- The Khaybar ledger is `awaiting_owner_review`; the model renders ranges and standards, not a
  harmonised narrative. The REPORTED fort-fall beats carry no certainty marker (house style); the
  DISPUTED beats (`order`, `qamusFall`) read "reports differ" and the Marḥab/ram beats "· reported".
- The fort chain is maquette detail, not a survey; fort separation and the duel read through the
  shot framing, not a plan view.
- Build w is committed locally only; no push until owner approval.

## Build v — Khandaq on the shared engine (local, not pushed)
Khandaq · the battle. Cache-bust `?v=20261026w` on all three model pages; routes regenerated.

### Shipped
- **Khandaq is live.** A graded ledger of 38 entries (KHANDAQ-001 … 038) from Raheeq al-Makhtum
  pp. 195–203, with Qur'an/hadith anchors and CERTAIN / REPORTED / DISPUTED grading; a scene module
  on the shared engine; a page, a route and a live door on the Atlas gate.
- **The field.** The northern approach to Madinah, the trench cut from the western ḥarrah to the
  eastern marsh, the narrow crossing, the Qurayẓa forts on their spur, the three Confederate camps,
  Sīlāʿ at the Muslim rear. About 3,000 Muslims (54 columns) and 10,000 Confederates (90 columns),
  instanced with gait and thrust. The trench is a real heightfield cut with two walls; the
  Confederates force only the filled neck.
- **Seven phases, 78 s.** ground → trench → siege → crossing → covenant → storm → reckoning: the
  digging, the blockade, ʿAmr ibn ʿAbd Wudd's challenge answered by ʿAlī (RA), the broken pact of
  Banū Qurayẓa, the wind and rain, the withdrawal.
- **Depiction.** The Prophet ﷺ is never shown; his station is an empty stone ring with a white
  standard, four green pennants and eight faceless guards. No figure has a face; named acts ride
  on standards and weapon-masses; English + Urdu labels with (RA)/(PBUH)/ﷺ.
- **Shared engine.** The director accepts a scene-level portrait-pull cap and per-shot portrait
  endpoints (portrait only; Badr/Uhud keep the default). Khandaq caps at 1.4 and frames the
  crossing from over the Muslim line.
- **Shared shell.** The deck counter now switches to Urdu numerals when the language changes while
  paused (Badr and Uhud included).
- **Atlas gate.** Khandaq door live with its own field plate (`khandaq-field-800/1400.webp`),
  preview and focus states; `models.json` and `data/landing-sources.json` updated.

### Verification
- `node --check` on every `app/js` script; JSON parse checks on the ledger, `models.json`,
  `landing-sources.json`.
- Lint **0 FAIL / 5 WARN** (four sticky-bar glass + one aggregate em-dash over the wider file set); inspect **0 FAIL / 0 WARN** with the
  standing allowances.
- Desktop 1440×900: no console errors; **216 draw calls / 5,266,764 triangles / 239 geometries**;
  `benchMass` **6.99 ms** at 1× (22.17 ms at 4× CPU). Phone 390×844: no console errors; **198
  draw calls / 5,266,236 triangles / 238 geometries**; `benchMass` **4.15 ms**; no horizontal
  overflow; labels never leave the viewport; Urdu RTL with deck `۷ / ۷` and RTL timeline.
- All seven phases re-shot at 390×844 after the portrait fix; the ground, crossing and reckoning
  shots no longer carry terrain slab, enemy backs or a mountain flank.
- Deep link `?phase=storm` and `?debug=1` verified; Badr/Uhud regression probe clean.
- Landing probe at 1440×900, 768×1024, 390×844, 320×640: no overflow; three doors.

### Known limits
- The Khandaq ledger is `awaiting_owner_review`; the model renders ranges and standards, not a
  harmonised narrative.
- The 1.4 portrait cap crops the far flanks of the ground establishing shot; the labels and crane
  carry the whole field.
- The Qurayẓa fort is maquette detail, not a survey; the covenant beat reads through the gate and
  banners.
- 13,000 instanced men cost ~4–7 ms per crowd update; mobile updates half the men per frame.
- Build v is committed locally only; no push until owner approval.

## Atlas gate — first landing pass (three doors; superseded)
The root `index.html` is now the front door to three live models. This is a landing pass, not a
new build of the Badr model.

### Shipped
- **One-screen gate**: a full-bleed field over a bone index of three doors — Badr (2 AH), Uhud
  (3 AH), Khandaq (5 AH). The field previews each battle on hover or focus, and keeps its own
  six-frame day on Badr; reduced motion stops the cycle.
- **The whole door is the CTA**: ink flood from the leading edge, bone type, mint arrow and
  threshold; focus is an ink outline with a bone inset; the active door keeps a deep-verdigris
  threshold. The meta line flips with the flood, including on the active door.
- **Explicit routes**: `badr/index.html`, `uhud/index.html`, `khandaq/index.html`, generated by
  `scripts/build-routes.mjs`. Fixes the `file://` directory-index page behind the old "Enter"
  links.
- **Self-hosted type and plates**: Cormorant Garamond, Archivo, Amiri; local field images; no
  Google Fonts or CDN.
- **Model pages**: back arrow + "atlas" to `../index.html`; the bar respects safe-area insets;
  Khandaq runs on the shared engine.
- **Landing copy**: "The life of the Prophet ﷺ, mapped in 3D." No ledger, source, classroom, or
  no-depiction policy line on the gate.

### Verification
- Landing lint **0 FAIL / 0 WARN**; inspect **0 FAIL / 2 accepted WARN** (three intentional
  typefaces; the sr-only h1 is measured at 36px).
- Model lint **0 FAIL / 4 pre-existing sticky-bar glass WARN**.
- `node --check` on the landing and page modules.
- Chromium probes at 1440x900, 768x1024, 390x844 and 320x640: no horizontal overflow, the gate
  fills the viewport, all three rows in view.
- All three routes load with `window.BATTLE` and no console errors; the back link returns to the
  gate over both HTTP and `file://`.

### Known limits
- The hover preview only runs on hover-capable pointers; touch follows the link directly.
- This first pass kept the h1 screen-reader-only; the four-door polish above made the visible
  wordmark + descriptor the h1.
- Three typefaces are intentional (display serif, UI sans, Arabic).
- Uhud and Khandaq ledgers remain `awaiting_owner_review`.

## Build t — back to the maquette language (local, not pushed)
Badr · the battle. Cache-bust `?v=20261025t`. The owner's verdict on build s: the rigged GLTF
cast never loaded in their setup (async FBX fetch — standards without men) and the darker dawn
palette read as a downgrade. This build reverses both.

### Changed in build t
- **The duel cast is the proven maquette language again.** The six champions and the three
  Anṣār are the same faceless makeFighter figures as the Abu Jahl vignette — inline geometry,
  nothing to load, nothing to fail. Each champion walks out WITH his standard like the Anṣār
  trio did; the exchange swings the weapon arm at the BADR-028 beats (Shaybah first, Ḥamzah
  answers, al-Walīd/ʿAlī cross, ʿUtbah's thrust wounds ʿUbaydah, Ḥamzah finishes) and the
  fallen lie with their standards, as in build q.
- **Build q light and color restored**: linear fog, the vertex-gradient night-to-dawn sky with
  the bright cream canvas-sand ground (painted texture + bump on the heightfield), original
  light intensities, no ACES/sRGB. The dunes, tents, wells and camps keep their sculpted shapes.
- **The pushed build q camera paths remain** (one continuous move per phase). The FBX/GLTF
  loader scripts are off the page; the engine keeps the hero-rig capability for a future
  owner-approved return, dormant.

### Kept from the review rounds
Bilāl (RA) pursuing ʻUmayyah in the rout (BADR-041); the Abu Jahl vignette striking with
swords simultaneously (BADR-037); the march gait matched to travel speed; no floating motes;
the quiet 8:9 shimmer; the UI polish (frosted bar/deck, mobile phase name, scrub head).

## Build s — review fixes (superseded by build t)

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
- Uhud/Khandaq were blocked at build t. Superseded: both are live in the Atlas gate above; their
  ledgers still await owner review.

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
