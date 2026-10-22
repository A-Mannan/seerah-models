# seerah-models

**Badr — the battle in 3D.** An interactive, graded 3D reconstruction of the Battle of Badr
(17 Ramadan 2 AH): the ground, the 3-versus-3 champions' duel, the full-scale battle, the rout,
and the reckoning.

Part of a planned series of seerah battle models (Badr → Uhud → Khandaq).

## Run it

No build step. Open `app/index.html` in any modern browser, or serve the folder:

```bash
python3 -m http.server 8000
# → http://localhost:8000/app/index.html
```

## What's inside

- `app/` — the 3D experience (vanilla JS + Three.js r128, no build step)
  - `js/battle.js` — the engine: dawn-lit valley, wells, ʻarish, camps, palms, animals,
    ~313 vs ~1,000 men as instanced squads with shields, spears and swords under platoon
    and division banners; seven-phase choreography; cameras; orbit/zoom-to-cursor.
  - `js/main.js` — clock, timeline, speeds, camera presets, language switching (English/اردو RTL).
  - `js/audio.js` — procedural sound: wind, field murmur, clash rumble, sword clangs,
    arrow twangs, the gravel cast.
- `data/ledger/badr.json` — the source of truth: 74 graded entries (CERTAIN / REPORTED /
  DISPUTED / UNKNOWN), 29 live-fetched Qur'an anchors, hadith verification log.
- `PROGRESS.md` — phase log.

## Principles

- Every fact traces to a graded ledger entry; disputed figures shown as ranges, never harmonized.
- No human figure of the Prophet ﷺ or the Companions is depicted — armies are stylized
  standards and weapon-masses.
- English and Urdu (Noto Nastaliq, full RTL) throughout.

## Status

- Badr: playable model, under active polish.
- Uhud / Khandaq: ledgers not yet written (awaiting approval).
