# Tasks

## 1. Ledger grading (blocks everything else)

- [x] 1.1 Locate the Khaybar chapter in the owned spine PDF and record exact page ranges in `data/ledger/khaybar.json` (`spine_source.khaybar_chapter_pages`). — pp. 233-239, print page = PDF page.
- [x] 1.2 Live-verify every skeleton entry against sunnah.com (HTML pages) and api.alquran.cloud; set grades per the grading policy; convert the worst-known variant clusters into DISPUTED entries with both variants recorded. — sunnah.com via web reader only (WebFetch/curl 403); 21 entries: 11 CERTAIN, 8 REPORTED, 2 DISPUTED.
- [x] 1.3 Decide the render set: which entries are solid, approx or hidden; draft no dialogue beyond what a solid/report grade supports. — 9 solid / 9 approx / 3 hidden; render_as set per entry.
- [x] 1.4 Add Khaybar terms to `data/ledger/glossary.json` (al-ḥarra, al-Qamūṣ, the fort names). — 15 places + new khaybar_people group (7); ʿAlī/az-Zubair notes extended.
- [x] 1.5 **Owner gate:** present the graded ledger; do not start section 2 choreography-facing work until approved. — owner instructed "now complete khayber"; ledger stays `awaiting_owner_review`.

## 2. Engine additions (additive only)

- [x] 2.1 Fort/tower prop in `ENGINE.props` (stone, mergeable, scale-tunable); probe still.
- [x] 2.2 Basalt rock-material variant riding the `heightfield opts.material` hook; probe still against the dawn key.
- [x] 2.3 Palm-grove/field prop for the oasis floor; merge into the existing merge pass.
- [x] 2.4 Verify no existing export signature changed; run the Uhud change's probe list to confirm zero impact.

## 3. Khaybar scene module

- [x] 3.1 `app/js/khaybar.js`: `heightAt` volcanic layout, fort chain placement, oasis groves, camps; `app/khaybar.html` standalone page.
- [x] 3.2 Formations and standards from the graded ledger; per-fort capture states as timeline segments.
- [x] 3.3 Choreography phases (ground → march/arrival → first forts → al-Qamūṣ siege → standard + duel → reckoning) on the battle clock; deterministic seek verified.
- [x] 3.4 The ʿAlī (RA)/Marḥab duel beat on the Badr champion/standard pattern; strike keys to its entries.
- [x] 3.5 Labels EN + Urdu (Nastaliq, RTL, Urdu numerals) with honorifics, placed via `ENGINE.labels`; no clipped labels on any phase.

## 4. Cameras

- [x] 4.1 SHOTS table: one continuous shot per phase, uniform portrait back-off; no cuts, no shakes.
- [x] 4.2 Probe stills for every phase, desktop and 390×844 portrait; check fort separation and duel readability.

## 5. Gates, build, docs

- [x] 5.1 Quality gates: `node --check` on all touched JS; design-taste lint and inspect with the standing allowances.
- [x] 5.2 Perf: draw calls and triangles at 390×844 in the low hundreds; `benchMass` equivalent within Badr's budget; interaction (orbit/pinch/zoom-to-cursor, 0.5×–2×) unregressed.
- [x] 5.3 Cut the build (letter bump, `?v=` bumps, PROGRESS.md entry); update README.md and AGENTS.md battle list.
- [x] 5.4 Commit locally. Never push without explicit owner approval.
