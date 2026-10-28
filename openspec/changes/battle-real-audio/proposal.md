# Proposal

## Why

The owner's verdict on the shipped audio: "pathetic, doesn't even match the scene, non-existent." Every model pages in the same 126-line procedural layer (`app/js/audio.js`): a filtered-noise wind bed, a band-pass rumble, and three synth blips (a noise "crack", a detuned-oscillator "clang", a sawtooth "twang") reused for swords, arrows, the Khaybar ram and even Ḥunayn's rally call. No recorded sound exists in the repo. The build direction already rejects synthesis for visuals (the maquette, not primitives); the audio layer never got the same pass. This change replaces the synthesized layer with real, licensed recordings, scene-matched per battle, placed by the same cue tables the scenes already fire.

## What Changes

- **A real-recording SFX library** under `app/assets/audio/`: desert-wind, battle-crowd and rain beds plus one-shots (sword clash, blade whoosh, bow release, arrow flyby, impact thud, ram, war horn, battle cry, pickaxe strike, thunder, hooves, campfire). CC0 sources (Freesound), onset-trimmed, mono-safe, loudness-normalized per role (hit ≈ −4 dBFS peak, whoosh ≈ −9, beds ≈ −24 median), loop-seam-faded beds.
- **Curation and verification by tooling, not by ear claim**: candidates gathered from Freesound CC0 search, ranked by `earshot` (CLAP-based `rank` with calibrated descriptions), checked with `realness` (real recording vs code-synthesized) and `measure`; every shipped file keeps its source URL and license in `app/assets/audio/CREDITS.md`. The owner still gets a short "check by ear" list — the tools cannot hear.
- **A sampler audio engine** (`app/js/audio.js` rewritten): fetch + decode of the manifest, looped beds with per-phase gain ramps (the existing `cue` tables), named one-shots (`S.play(name)`) with variant rotation, ±5 % pitch and ±2 dB level jitter, and per-name rate limiting. The public `S` API (`start`, `setOn`, `isOn`, `cue`, `melee`, `volley`) is preserved so `shell.js` keeps working; `melee`/`volley` become aliases of `play('clash')`/`play('arrow')`.
- **Scene-matched cue tables for all six battles**: `badr`, `uhud`, `khandaq`, `khaybar`, `mutah`, `hunayn` page descriptors keep their phase rumbles (now crowd-bed levels) and gain named cues — Khaybar's ram beats fire `ram`, Ḥunayn's "the call" fires `horn`, Khandaq's storm phase raises `rain` and fires `thunder` on the existing `crack` flag, march phases get `drum`/`footsteps` only where the choreography actually marches.
- **No visual, copy, camera or ledger change.** No new claims; audio is not a historical source.

**Out of scope:** narration or voiceover (Fish Audio TTS noted as a follow-up needing an owner API key); music; captions; any change to scenes, ledgers, depiction rules; pushing to GitHub.

## Capabilities

### New Capabilities

- `battle-real-audio`: the shared real-recording audio layer — asset library, manifest and credits, the sampler engine, and the per-battle cue tables.

### Modified Capabilities

None. The `S` API surface is preserved; page descriptors change only their `cue`/`audio` blocks.

## Impact

- New: `app/assets/audio/*.{mp3,json}`, `app/assets/audio/CREDITS.md`.
- Rewritten: `app/js/audio.js`.
- Edited (audio blocks only): `app/js/{badr,uhud,khandaq,khaybar,mutah,hunayn}-page.js`.
- Verified: `node --check` on touched scripts; design-taste lint; inspect on a representative model page; headless console probe on all six pages; per-file loudness/realness report in the change folder.
