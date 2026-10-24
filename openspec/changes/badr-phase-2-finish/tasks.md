# Tasks

Some of this work is already in the working tree (plinth and five figures, mass detail, spear instances, phase-camera beat, chip removal, label gates). The tasks below finish and verify it; do not assume a task is done until its verification passes.

## 1. Vignette staging and sequence

- [x] 1.1 Verify the plinth and all five figures from the “sand” camera; move the plinth or figures if any is occluded by the wells, banners or mass. Verify with `.taste-skill/probe-story.mjs` and `p-sand-mid.jpg`.
- [x] 1.2 Verify the sequence order and legibility at turn t = 0.10, 0.36, 0.55, 0.66, 0.82 and rout t = 0.20: run → strike → cut → step/separate → Muʿawwidh's fall → Abu Jahl's fall. Tune the timings if any beat is unreadable; verify with fresh stills at each t.
- [x] 1.3 Confirm the severed arm, stump, step leg and one-handed spear read correctly at close range; fix floating, clipping or missing geometry. Verify with a close-up still of Muʿādh in the sand and rout.
- [x] 1.4 Confirm no duplicate Muʿādh/Muʿawwidh/Ikrimah event standard or label remains. Verify with `grep -n "muadhMark\|muawwidhMark\|ikrimahMark\|muadhMuawwidh" app/js/battle.js` returning nothing and a clean sand still.
- [x] 1.5 Confirm every vignette figure is faceless and the Prophet ﷺ is never depicted. Verify by inspecting a close-up and searching the figure builder for any face/eye/nose/mouth geometry.

## 2. Mass action figures

- [x] 2.1 Verify the mass bodies show tunics, belts, feet and Quraysh helmets / Muslim turbans from the clash camera; fix any part that reads as a floating box. Verify with `p-wells.jpg` and a close-up.
- [x] 2.2 Verify the instanced spear hedge is upright at the ground/duel, levels and thrusts in the clash, and is not a wall of identical spikes. Tune the tilt if needed; verify with clash and rout stills.
- [x] 2.3 Verify the armies still use instanced meshes with no per-man draw calls. Record `BATTLE.info()` and `BATTLE.sceneStats()` at the clash; flag any regression above the low hundreds of calls.
- [x] 2.4 Benchmark `BATTLE.benchMass(10)` on desktop and the 390×844 phone profile; if the update exceeds the frame budget, reduce geometry segments before removing detail. Record both numbers in `PROGRESS.md`.

## 3. Camera story and UI cleanup

- [x] 3.1 Confirm the camera-chip row is gone from markup, strings and CSS; remove dead `.cams`/`.cam` rules. Verify with `grep -n "cams\|class=\"cam\|data-cam" app/index.html app/js/main.js app/css/style.css` and lint.
- [x] 3.2 Verify the phase camera path reads continuously: ground → duel → advance → clash → sand close-up → rout → quiet. Fix any disorienting jump or a vignette beat that is missed; verify with the ten `p-*.jpg` stills.
- [x] 3.3 Verify paused exploration still works without the chips: 1:1 drag, inertia, turntable, zoom-to-cursor, pinch, double-click recenter. Verify manually and via the existing probe/`camInfo()`.
- [x] 3.4 Verify the phone portrait composition at 390×844: play, timeline, speed, reset, labels, command beat and rout all legible and unclipped. Verify with the `m-*.jpg` stills and inspect at 390.

## 4. Event gating and opening formation

- [x] 4.1 Verify no Muʿādh, Muʿawwidh, Bilāl or ʿUmayyah label appears at the ground or duel; Bilāl/ʿUmayyah appear only from the rout. Verify with phase 0, 1, 4 and 5 stills.
- [x] 4.2 Verify the two Anṣār youths start at the Muslim line and only enter no-man's-land during the sand run; no vignette figure stands in the front at the opening. Verify with `p-ground`, `p-advance` and `p-sand-early`.
- [x] 4.3 Verify label priority and collision at the sand beat: no duplicate Ikrimah/Abū Jahl labels, honorifics present, English and Urdu both readable. Verify with EN and UR stills.

## 5. Historical verification

- [x] 5.1 Deliver the wells/rain correction with citations: Qur'an 8:11 and 8:42; `BADR-018/019`; Raheeq p. 135. State that the Muslims reached the wells first on al-Ḥubāb's advice, the rain firmed their ground and muddied the Quraysh slope, and the Quraysh were denied water. Verify no UI copy asserts the reverse.
- [x] 5.2 Verify the vignette claims against the ledger: `BADR-037/038/039` and Bukhari 3961 for Abu Jahl; Ibn Hishām/Ibn Kathīr for Ikrimah and the arm; `BADR-041` for Bilāl/ʿUmayyah; `BADR-047/048` for the martyrs and the 70/70 counts. Do not add an unledgered claim; verify each label maps to an entry.

## 6. Build p and local commit

- [x] 6.1 Bump the build letter to **p**: `app/js/main.js` console log and `?debug=1` tag; every `?v=` query in `app/index.html`. Verify with `grep -n "20261023o\|build o" app/index.html app/js/main.js` returning nothing.
- [x] 6.2 Run `node --check app/js/battle.js`, `node --check app/js/main.js`, the design-taste lint gate and the inspect gate at desktop/tablet/phone. Record the results; fix all FAILs, and note any accepted WARN.
- [x] 6.3 Rewrite `PROGRESS.md` as a one-screen build log: build **p**, the shipped changes, verification results and known limits. Remove the duplicated task list and long phase narrative; it must not compete with OpenSpec. Verify the file is under ~60 lines and contains no unchecked checklist.
- [x] 6.4 Commit locally with a descriptive message. Verify `git status` is clean and `git log -1` shows the commit. Do **not** push; ask the owner for explicit push approval.

## 7. Follow-up, blocked work

- [ ] 7.1 Confirm the architecture direction with the owner before Uhud/Khandaq: modular vanilla shared engine (recommended) or a React UI shell. Record the decision in AGENTS.md.
- [ ] 7.2 Write a separate OpenSpec change for the shared engine split (renderer, camera, clock, labels, orbit, particles, merge) plus per-battle data/scene modules. Do not implement it in this change.
- [x] 7.3 Confirm the fonts render as intended: Cormorant Garamond display, Archivo UI, Noto Nastaliq Urdu. Verify with a desktop and phone screenshot.
- [x] 7.4 Keep Uhud and Khandaq ledgers, scenes and labels blocked until the owner explicitly approves them.

## Workflow follow-up

- Archive this change after the owner accepts build p.
- Do not push the resulting commit unless the owner explicitly approves.
## 8. Named figures, field layout, dispersion, aftermath bodies

- [x] 8.1 Move the wells east of the duel and the ʿarish behind the Muslim line; verify with `c-duel`, `c-advance` and `c-quiet` stills.
- [x] 8.2 Add six faceless champion figures and three Anṣār figures at their standards; verify the duel and first-challenge beats.
- [x] 8.3 Disperse the advancing mass within the divisions; verify the advance still.
- [x] 8.4 Refine the 70 captives, 70 dead and 24 leaders with bodies, arms, legs and feet; verify the reckoning still.
- [x] 8.5 Hide the command plinth during the duel/advance and clear the stage shadow checker; verify the phone command still.
- [x] 8.6 Run `node --check`, lint and inspect; bump build **q**; update `PROGRESS.md`; commit locally.
