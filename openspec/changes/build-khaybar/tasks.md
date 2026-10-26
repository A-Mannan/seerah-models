# Tasks

## 1. Ledger grading (blocks everything else)

- [ ] 1.1 Locate the Khaybar chapter in the owned spine PDF and record exact page ranges in `data/ledger/khaybar.json` (`spine_source.khaybar_chapter_pages`).
- [ ] 1.2 Live-verify every skeleton entry against sunnah.com (HTML pages) and api.alquran.cloud; set grades per the grading policy; convert the worst-known variant clusters into DISPUTED entries with both variants recorded.
- [ ] 1.3 Decide the render set: which entries are solid, approx or hidden; draft no dialogue beyond what a solid/report grade supports.
- [ ] 1.4 Add Khaybar terms to `data/ledger/glossary.json` (al-ḥarra, al-Qamūṣ, the fort names).
- [ ] 1.5 **Owner gate:** present the graded ledger; do not start section 2 choreography-facing work until approved.

## 2. Engine additions (additive only)

- [ ] 2.1 Fort/tower prop in `ENGINE.props` (stone, mergeable, scale-tunable); probe still.
- [ ] 2.2 Basalt rock-material variant riding the `heightfield opts.material` hook; probe still against the dawn key.
- [ ] 2.3 Palm-grove/field prop for the oasis floor; merge into the existing merge pass.
- [ ] 2.4 Verify no existing export signature changed; run the Uhud change's probe list to confirm zero impact.

## 3. Khaybar scene module

- [ ] 3.1 `app/js/khaybar.js`: `heightAt` volcanic layout, fort chain placement, oasis groves, camps; `app/khaybar.html` standalone page.
- [ ] 3.2 Formations and standards from the graded ledger; per-fort capture states as timeline segments.
- [ ] 3.3 Choreography phases (ground → march/arrival → first forts → al-Qamūṣ siege → standard + duel → reckoning) on the battle clock; deterministic seek verified.
- [ ] 3.4 The ʿAlī (RA)/Marḥab duel beat on the Badr champion/standard pattern; strike keys to its entries.
- [ ] 3.5 Labels EN + Urdu (Nastaliq, RTL, Urdu numerals) with honorifics, placed via `ENGINE.labels`; no clipped labels on any phase.

## 4. Cameras

- [ ] 4.1 SHOTS table: one continuous shot per phase, uniform portrait back-off; no cuts, no shakes.
- [ ] 4.2 Probe stills for every phase, desktop and 390×844 portrait; check fort separation and duel readability.

## 5. Gates, build, docs

- [ ] 5.1 Quality gates: `node --check` on all touched JS; design-taste lint and inspect with the standing allowances.
- [ ] 5.2 Perf: draw calls and triangles at 390×844 in the low hundreds; `benchMass` equivalent within Badr's budget; interaction (orbit/pinch/zoom-to-cursor, 0.5×–2×) unregressed.
- [ ] 5.3 Cut the build (letter bump, `?v=` bumps, PROGRESS.md entry); update README.md and AGENTS.md battle list.
- [ ] 5.4 Commit locally. Never push without explicit owner approval.
