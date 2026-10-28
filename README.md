# seerah-models

**The Seerah Atlas.** Five interactive, graded 3D battle models — Badr (17 Ramadan 2 AH),
Uhud (3 AH), Khandaq (5 AH), Khaybar (7 AH) and Muʿtah (8 AH). Enter a field, orbit the ground,
and follow the day.

## Run it

No build step. Serve the repo and open the gate:

```bash
python3 -m http.server 8000
# → http://localhost:8000/
# direct: /badr/, /uhud/, /khandaq/, /khaybar/, /mutah/
```

Opening `index.html` from disk also works: the doors link to explicit `index.html` files.
The source pages remain at `app/index.html`, `app/uhud.html`, `app/khandaq.html`,
`app/khaybar.html` and `app/mutah.html`.

## What's inside

- `index.html`, `assets/landing/` — the Atlas gate: one field, five doors, each plate carrying a
  window onto the ground it opens.
- `app/` — the 3D experience (vanilla JS + Three.js r128, no build step)
  - `js/engine.js` — the shared engine: renderer, dawn sky, heightfield, wells, camps, palms,
    animals, instanced crowd, labels, camera director and orbit.
  - `js/badr.js`, `js/uhud.js`, `js/khandaq.js`, `js/khaybar.js`, `js/mutah.js` — per-battle
    scenes, formations, choreography and the `BATTLE` API.
  - `js/shell.js`, `js/*-page.js` — page boot and UI shell: clock, timeline, speeds, language
    switching (English/اردو RTL).
  - `js/audio.js` — procedural sound: wind, field murmur, clash rumble, sword clangs,
    arrow twangs, the gravel cast.
- `data/ledger/` — the source of truth for each battle: graded entries (CERTAIN / REPORTED /
  DISPUTED / UNKNOWN), Qur'an anchors, hadith verification log.
- `models.json` — the index of live models and their routes.
- `PROGRESS.md` — build log.

## Principles

- Every fact traces to a graded ledger entry; disputed figures shown as ranges, never harmonized.
- The Prophet ﷺ is never depicted. No figure has a face; named Companions appear only as
  stylized faceless figures where explicitly approved (the Badr vignette); elsewhere standards
  and weapon-masses mark the event.
- English and Urdu (Noto Nastaliq, full RTL) throughout.

## Status

- The Atlas gate: five doors, each with a window onto its field, so every model is identifiable on
  touch without hover. One screen at 1440×900, 768×1024, 390×844, 320×640 and landscape phones.
- Badr: live model on the shared engine.
- Uhud: live model; its ledger is `awaiting_owner_review`.
- Khandaq: live model on the shared engine — the trench, the crossing, the seven phases from the
  digging to the withdrawal; its ledger is `awaiting_owner_review`.
- Khaybar: live model on the shared engine — the volcanic plain, the fort chain, the six phases
  from the muster to the reckoning; its ledger is `awaiting_owner_review`.
- Muʿtah: live model on the shared engine — the wādī, the three standards, the nine swords and the
  ordered withdrawal; its ledger is `awaiting_owner_review`.
- The Atlas gate and all five routes are in the repo; nothing is deployed without owner approval.
