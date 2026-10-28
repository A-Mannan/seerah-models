# Tasks

## 1. Library

- [x] 1.1 Gather CC0 candidates (Freesound search scrape), download previews (`/tmp/opencode/sfx-raw/`).
- [x] 1.2 Rank candidates per cue description with `earshot` `rank`; `realness` check every file; keep the report in this change folder.
- [x] 1.3 Pick the final set; reject anything that reads synthesized, cartoonish or studio-clean against the scene (the top-ranked desert wind read "uncertain" on `realness` and was dropped for `wind open plain__697217`).
- [x] 1.4 Process with ffmpeg: trim to onset, mono-safe, beds loop-faded, one-shots peak-normalized to role targets (re-measured after encode, MP3 overshoot compensated); encode mono MP3 96 kbps.
- [x] 1.5 Write `app/assets/audio/manifest.json` (+ `manifest.js` script twin for file:// pages) and `CREDITS.md`.

## 2. Engine

- [x] 2.1 Rewrite `app/js/audio.js` as a sampler: manifest fetch + decode pool, beds (loop, calibrated base gain + per-phase ramps), one-shots (variant rotation, jitter, rate limit), gesture-gated start, same `S` API + `S.play(name)`; media-element fallback for `file://` pages.
- [x] 2.2 Degraded path: missing file or decode failure → that cue silently skips; engine still boots.

## 3. Per-battle cues

- [x] 3.1 Badr: wind always; crowd swell into the wells/sand clash; `clash` on the 3 v 3 (was silent before) and the wells; `arrow` on the advance tail and the sand volley; `roar` on the rout; quiet reckoning.
- [x] 3.2 Uhud: `horn` at the ground (the hook), volleys on the charge and the flank; `clash` in the flank mêlée and the turn.
- [x] 3.3 Khandaq: `dig` through the trench; `clash` on the crossing duel; storm → `rain` + `storm` beds up, `thunder` sparse, crowd falls.
- [x] 3.4 Khaybar: `arrow` + `ram` at the first forts (the ram was a sword clang before); `clash` in the Marḥab duel window; wind up on the night march; `fire` under the reckoning.
- [x] 3.5 Muʿtah: `clash` on the standards and the nine swords (sparse — a small line holding); `arrow` covering the withdrawal; march bed under the advance.
- [x] 3.6 Ḥunayn: `arrow` in the ambush; `clash` through the stand; `horn` on "the call" (was a sword clang); `fire` under Ṭāʾif/ Spoils lull. (Makkah's descriptor was already written against this API and now works.)

## 4. Verification

- [x] 4.1 `node --check` on every touched script; JSON parse of the manifest.
- [x] 4.2 Design-taste lint (0 FAIL / standing WARNs) + inspect 0 FAIL / 0 WARN on `app/khandaq.html`.
- [x] 4.3 Headless probe: all seven model pages load, boot the full audio graph, sweep every phase — zero console errors; file:// pass boots through the element fallback.
- [x] 4.4 Per-file report: earshot realness + measured peak/mean in `verify.md`; the five-moment "check by ear" list for the owner.
- [x] 4.5 PROGRESS.md build ab entry; routes rebuilt; local commit.
