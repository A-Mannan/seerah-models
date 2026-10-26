# Design

## Context

The shared engine (`app/js/engine.js`) already carries the renderer boot, sky, heightfield, props, static merge, instanced crowd, labels, camera director and runner. Badr and Uhud are scene modules on it. Khandaq is the third scene module: it must supply its own ground, layout, plans, shots, copy and ledger, and must not add a render loop.

## Goals / non-goals

**Goals:** a truthful, readable Khandaq model at Badr/Uhud standard; clean portrait framing on a phone; no new engine fork; every visible claim traceable to the graded ledger.

**Non-goals:** narration or scholar's mode; photoreal detail; re-enacting dialogue beyond the ledger; changing the Badr/Uhud scenes; pushing to GitHub.

## Decisions

### Ground and axes

`+x` east, `+z` north. The Confederates come from the north (`+z`); the trench runs east–west at `z = 0`; the Muslim line stands south of it; Sīlāʿ rises at the Muslim rear (south, `-z`); Madinah lies beyond. The trench (`TRENCH {x0:-104, x1:68, mid:-18, depth:2.8, halfW:3.0}`) is cut by `trenchCut` in the heightfield; the eastern end meets the marsh at the narrow crossing (`CROSS_X = 56`); the Qurayẓa forts stand on the eastern spur (`FORT {x:104, z:-38}`); the Prophet's station is an empty stone ring at Sīlāʿ's foot (`STATION {x:-18, z:-52}`). The armies are built around `x = 0` by the shared crowd and shifted onto the ditch axis (`AXIS = -18`) by every plan.

### The seven phases

`ground (8 s) → trench (10 s) → siege (13 s) → crossing (11 s) → covenant (12 s) → storm (13 s) → reckoning (11 s)`, 78 s total. Phases follow the ledger: the ditch, the blockade, ʿAmr's challenge and ʿAlī's answer at the neck (KHANDAQ-011/038), the broken pact with Banū Qurayẓa (KHANDAQ-014/035), the wind and rain that break the camp (KHANDAQ-023), and the withdrawal. The trench is never crossed by the Confederates: the horse forces the filled neck only.

### Depiction

The Prophet ﷺ is never depicted. His station is an empty stone ring/platform with a white standard, four green pennants and eight faceless guards; no figure stands in it. Every figure is faceless. Named acts are carried by standards and weapon-masses, not persons. Labels carry honorifics — ʿAlī (RA), the Prophet's station (PBUH), ﷺ — in English and Urdu (Nastaliq, RTL, Urdu numerals).

### Cameras

The shared director runs per-phase shots with a paused turntable. The generic portrait rule backs the camera off along the look vector; for Khandaq's already-far desktop cameras that could carry the camera outside the valley (ground) or behind the Confederate ranks (crossing). The engine now accepts:

- a per-shot `portrait` block (`p0, p1, l0, l1`) used only when `camera.aspect < 1`, bypassing the pull; and
- a scene-level `portrait.cap` passed through `ENGINE.runner` (default `2.1`, preserving Badr/Uhud).

Khandaq caps the pull at `1.4` and supplies explicit portrait endpoints for both crossing shots (a high over-the-line view at the causeway). Verified at 390×844 for all seven phases: no terrain slab in the sky, no enemy backs filling the frame, no clipped labels.

### Performance

Crowd `crowd.build`: 3,000 Muslims (54 columns) and 10,000 Confederates (90 columns), instanced; mobile updates half the men per frame. Static Lambert meshes merge; instanced meshes never merge. Measured at build v: desktop 216 draw calls / 5.27 M triangles; mobile 198 calls / 5.27 M triangles; `benchMass` ~7 ms desktop and ~4 ms phone at 1×.

### Ledger grading

`data/ledger/khandaq.json` uses the same schema as Badr/Uhud. Raheeq alone is REPORTED; Qur'an or a sound hadith plus Raheeq is CERTAIN; conflicting well-known reports are DISPUTED with both variants. The file stays `awaiting_owner_review`; the model renders ranges and standards rather than harmonising numbers.

## Risks / trade-offs

- **Crowd weight.** 13,000 instanced men cost ~4–7 ms per update; the mobile LOD halves updates. Accepted for the massed-army read.
- **Portrait closeness.** The 1.4 cap fills the narrow frame but crops the far flanks of the ground shot; the establishing crane and labels carry the rest. Accepted after reviewing all seven phases.
- **Fort detail.** The Qurayẓa fort is a maquette-scale block, not a survey; the covenant phase stays readable through the gate and banners.
- **Ledger review.** The historical grading awaits the owner/scholar pass; the model must not outrun it.

## Migration

None. The engine changes are optional and default-off; Badr and Uhud were re-probed for console errors, Urdu deck count and unchanged desktop camera behaviour.
