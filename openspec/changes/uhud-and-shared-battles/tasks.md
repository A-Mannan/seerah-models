# Tasks

> **Status (2026-10-27):** The implementation shipped with build v, but this checklist was not
> reconciled item-by-item. Tasks 3.2 and 5.1 describe the original two-door landing, which the
> three-door Atlas gate superseded (`index.html` at the repo root; model pages `app/index.html`,
> `app/uhud.html`, `app/khandaq.html`). The Uhud ledger remains `awaiting_owner_review`.

## 1. Uhud ledger (gates every visual claim)

- [ ] 1.1 Write `data/ledger/uhud.json` from Raheeq al-Makhtum pp. 155-181 with the same schema as
      `badr.json` (conventions, grading policy, entries, verse anchors, verification log). Cover only the
      claims the model makes: the Quraysh force, the Muslim force, the archers and their orders, the
      standard-bearers, the archers' mistake, Khalid's flank, the Prophet's stand and wounding, the
      withdrawal, the martyrs and the burial. Grade Raheeq alone as REPORTED; canonical hadith or
      Qur'an + Raheeq as CERTAIN; conflicting counts as DISPUTED. Verify the file parses and every
      entry has an id, sources, grade and render_as.
- [ ] 1.2 Fetch the Aal-Imran anchors live (3:121, 3:122, 3:128, 3:140, 3:144, 3:152, 3:153, 3:155,
      3:165, 3:166, 3:168, 3:172) and record the exact translation text, edition and fetch date in the
      ledger. Verify each anchor is used by at least one entry.
- [ ] 1.3 Bundle the Uhud ledger with `.taste-skill/build-data.cjs`; confirm `window.UHUD_LEDGER`
      exists in `app/assets/data.js` and Badr's `window.LEDGER` is unchanged.

## 2. Shared engine layers

- [ ] 2.1 Move the build-q dawn sky, stars, moon and light rig out of `badr.js` into
      `ENGINE.sky(ctx, opts)` with palette overrides; Badr renders identically.
- [ ] 2.2 Move the painted sand texture, ground material and heightfield call into
      `ENGINE.ground(ctx, heightAt, opts)`; Badr renders identically.
- [ ] 2.3 Move the standard/band/champion/event-standard builders and the faceless `makeFighter`
      into `ENGINE.standards` / `ENGINE.figures`, returning the same objects and wavers list.
- [ ] 2.4 Add `ENGINE.runner(ctx, opts)` for the shared battle loop: clock, RAF with wall-clock dt,
      throttled-RAF fallback, visibility pause, label pass with priorities, cloth/palm/smoke cadence,
      seek/play/pause/speed/setLang hooks, and the debug API (`info`, `sceneStats`, `benchMass`,
      `camInfo`, `ray`). Move the label hardcodes (champion hide, mobile label offsets) into entry
      fields.
- [ ] 2.5 Refactor `badr.js` onto 2.1-2.4 without changing layout, choreography, timings, copy or
      cameras. Verify `node --check`, identical phase durations and shot tables, and a fresh probe
      still for every phase.

## 3. Shared shell and pages

- [ ] 3.1 Build `app/js/shell.js`: config-driven brand, phases, legend, hint, storage prefix, audio cue
      map and home link; keep play/scrub/speed/reset/language/sound, RTL timeline, Urdu numerals,
      keyboard support and the touch dedupe.
- [ ] 3.2 Add `app/badr.html` and `app/uhud.html` from one page structure; make `app/index.html` a
      small redirect to Badr. Verify both pages load with no console error and no 404.
- [ ] 3.3 Restore the Badr polish lost to one-off CSS: one deck/bar interaction model, safe-area
      padding, focus states, reduced-motion, and a legend/hint that belongs to the config. Verify at
      desktop and 390x844.

## 4. Uhud scene

- [ ] 4.1 Layout: the valley south of Uhud, the mountain behind the Muslim line, the archers' hill
      east of it, the Quraysh camp to the south-west, the Muslim camp, the defile and al-Mihras rock.
- [ ] 4.2 Formations: 700 Muslims (three battalions), the 50-archer squad on the hill, Quraysh 3,000
      with 200 cavalry on the wings, all instanced with the engine crowd; standards, not faces.
- [ ] 4.3 Seven phases and plans: ground, archers' hill, the charge, the spoils, the flank, the turn,
      the reckoning. The archers leave the hill at the spoils beat; Khalid's horse wheels the hill and
      strikes the rear; the Muslim line is rolled back to the mountain; the field goes quiet.
- [ ] 4.4 Vignette-scale beats at maquette distance, no gore: the standard-bearers' stand, the archers'
      empty hill, the cavalry sweep, the Prophet's station in the defile marked by a standard (never a
      figure), the martyrs' graves at the foot of Uhud.
- [ ] 4.5 Shot list per phase, English and Urdu labels with honourifics, and label gating so named
      events appear only in their phase.
- [ ] 4.6 Historical audit: every Uhud label maps to a ledger entry; the 700/3,000/50/40/9 figures and
      the 70/22-or-37 casualty counts match the ledger grade (DISPUTED shown as a range).

## 5. Landing page

- [ ] 5.1 Build `index.html` as the series front door: the two models as large plates, date and place,
      the series rule, English/Urdu, no build string, links to `app/badr.html` and `app/uhud.html`.
- [ ] 5.2 Gate it: design-taste lint and inspect, 1440x900 and 390x844, keyboard and reduced motion;
      no clipped text, no scroll trap.

## 6. Verification, docs, commit

- [ ] 6.1 `node --check` every script; run the design-taste lint on the shell, scenes and pages; run
      inspect on both model pages and the landing page with the documented allowances.
- [ ] 6.2 CDP probe: both battles at every phase, label language switch, phone viewport, no console
      error, `BATTLE.info()` and `benchMass()` recorded, screenshots reviewed for clipping or a
      missing figure.
- [ ] 6.3 Update `README.md`, `AGENTS.md` (new paths, standing rules, Uhud no longer blocked) and
      `PROGRESS.md` (build **u**, what shipped, verification, known limits); no public version string.
- [ ] 6.4 Commit locally; do not push. Ask the owner for push approval.
