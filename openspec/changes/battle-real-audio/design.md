# Design

## Sources (owner-named, what actually worked)

| Source | Verdict |
| --- | --- |
| **Openverse** | API unreachable from this machine (shell: connection fails; harness: timeout). Not used. |
| **Fish Audio** | TTS/SFX generation service; requires `FISH_AUDIO_API_KEY`, none configured. Not used; noted as a follow-up for bespoke beds/voice. |
| **Real SFX** | The named source is a UK film-effects company (realsfx.com), not a library. Read as the requirement: *real recordings, never synthesized*. Satisfied via Freesound CC0 + `realness` verification. The Clipwing `real-sfx` skill's rules (bed at ≈ −54 dBFS median, role levels, arrival anchoring, no machine-gun repeats, mono check, listen list) are adopted as the design contract. |
| **earshot** | Installed (`/tmp/opencode/earshot`), CPU models fetched. Used for `rank` (pick per description), `realness` (real vs synthesized evidence), `measure` (levels). |

Primary recording source: **Freesound CC0 search** (reachable; public preview MP3s; per-file license verified on the sound page before download).

## Asset contract

- **Beds** (loop, no loop seam): `wind` (all battles, base), `crowd` (battle murmur, replaces the synth rumble ramp), `rain` (Khandaq storm), `hooves`, `footsteps`, `campfire` (optional beats). Mono, 96 kbps, 15–40 s, gain-ramped per phase.
- **One-shots**: `clash` ×3, `whoosh` ×2, `arrow` ×2, `thud` ×2, `ram`, `horn`, `roar`, `dig` ×2, `thunder` ×2, `drum`. Mono, trimmed so the attack sits at sample ≈ 0 (arrival anchoring), peak-normalized to role targets: hit −4 dBFS, whoosh −9, ambience −24, horn −10.
- **Mobile-first**: every file is mono-safe (antiphase stereo rejected in processing); first decode burst capped (beds decode first, one-shots lazily) so 390×844 phones don't decode ~100 MB at once. Total shipped target ≤ 4 MB.

## Engine (`app/js/audio.js` v2)

- Same lifecycle as v1: `S.start()` on a user gesture creates/resumes the context; `S.setOn` ramps a master gain (0.16). No autoplay.
- `manifest.json` lists `beds` and `ones` with `{file, dur, gain, loop, variants}`. Fetch + `decodeAudioData` per entry; failures skip that cue (engine boots degraded, like v1's missing-WebAudio path).
- Beds: `BufferSource(loop)` → bed gain → master. The existing per-phase `cue` tables keep their shape — `{rumble}` now means the crowd-bed target (0…1 scaled to the bed's calibrated range), and a new optional `{bed: {rain: 1}}` raises any named bed.
- One-shots: `S.play(name)` → rotate through variants, ±5 % playback-rate and ±2 dB jitter, per-name rate limit (min gap), fire-and-forget gain envelope. `melee()` → `play('clash')`, `volley()` → `play('arrow')`.
- Scrub/seek: beds are continuous (state, not events) so seeking never desyncs them; one-shots stay event-driven from `tick`, exactly as v1's clangs were — scrubbing re-fires them on the way past, which matches the visuals.

## Per-battle intent (scene-grounded, no new historical claims)

Badr wells/sand = the clash + volley peak; Uhud = archer volleys then the mêlée; Khandaq = picks, the crossing duel, then rain+thunder in the storm; Khaybar = arrows + the ram at the forts, the Marḥab duel; Muʿtah = the small force's stand (clash, sparse — they are outnumbered), night withdrawal; Ḥunayn = ambush volleys, the stand, then the horn that rallies ("the call" — currently a sword clang, which is wrong).

## Verification honesty

`earshot` cannot hear taste; it ranks, tags and measures. The change ships with the realness/level table and a five-moment listen list for the owner. No "sounds good" claims without the owner's ear.
