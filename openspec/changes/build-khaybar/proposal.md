# Proposal

## Why

Khaybar (Muḥarram 7 AH) is the next battle in the series after Khandaq, and nothing in the parallel
`uhud-and-shared-battles` change touches it: no shared file, no capability, no ledger overlap. It is
also the visual opposite of the three open-field models — a chain of stone fortresses on dark
volcanic ground above palm groves, taken one by one — which is exactly what keeps the series from
reading as the same battle reskinned. The duel machinery Badr already proved (champions walking out
from standards, a named challenger, a graded kill beat) carries over to ʿAlī (RA) and Marḥab.

The ledger comes first: `data/ledger/khaybar.json` is a skeleton today; every claim must be graded
through live verification (sunnah.com, api.alquran.cloud) before any choreography, per the standing
AGENTS.md rule. Several core Khaybar details (fort order, the Marḥab duel, how al-Qamūṣ fell) are
transmitted in conflicting variants, so grading is real work, not ceremony.

## What Changes

- **A graded Khaybar ledger**: `data/ledger/khaybar.json` in the badr.json format — skeleton
  entries drafted and marked UNKNOWN now, graded through live verification in a working session,
  owner-reviewed before scene build.
- **A Khaybar scene module**: `app/js/khaybar.js` on the shared engine — the ḥarra volcanic
  heightfield, the oasis floor, the fort chain, the two camps, formations, choreography and labels.
  Data + choreography only, matching the `battle-series` rule that the Uhud change is establishing;
  no forked shell/UI/engine code.
- **Additive engine capabilities only**: stone fort/tower props, a dark basalt rock-material
  variant for the heightfield (via the existing `opts.material` hook), and a palm-grove prop.
  No rewrite of anything Uhud or Khandaq depend on.
- **Sequential-siege choreography**: phases that read the campaign's shape — the march and night
  arrival, the first forts, the al-Qamūṣ siege, ʿAlī's standard and the Marḥab duel, the reckoning —
  driven by graded entries only. DISPUTED beats (fort order) render as ranges, never harmonized.
- **One continuous camera shot per phase** with the uniform portrait back-off. No mid-phase cuts,
  no impact shakes — the owner rejected those on Badr and the rule is standing.

**Out of scope:** touching `uhud-and-shared-battles` files (shell, Uhud scene, landing page) — the
Khaybar page plugs into the shell when it lands; night lighting (that is Muʾtah's need, later);
narration, captions, info cards, scholar's mode; facial features; depicting the Prophet ﷺ;
pushing to GitHub.

## Capabilities

### New Capabilities

- `khaybar-battle`: the Khaybar model — its graded ledger, the volcanic fortress field, sequential
  siege choreography, the ʿAlī/Marḥab duel beat, labels, cameras and the mobile budget.

### Modified Capabilities

None. The Khaybar model complies with `battle-series` and `battle-visual-quality` as they stand;
both are being shaped by `uhud-and-shared-battles` in parallel and this change must not double-edit
them.

## Impact

- New: `data/ledger/khaybar.json`, `app/js/khaybar.js`, `app/khaybar.html`, a Khaybar probe under
  `.taste-skill/`.
- Additive changes only: `app/js/engine.js` (new props/material variant — new exports, no changed
  signatures), `data/ledger/glossary.json` (Khaybar terms), `PROGRESS.md`, `README.md`, `AGENTS.md`
  (battle list).
- Depends on: the graded ledger before choreography; the shared shell before the page ships on the
  series front door (until then `app/khaybar.html` runs standalone against the engine, like Badr
  does today).
