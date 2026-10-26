# Design

## Context

The engine split (build r) and the build-t owner verdict fixed the figure and camera language:
faceless procedural maquette figures, build-q dawn light, one continuous shot per phase, no
cuts or shakes. `uhud-and-shared-battles` is in flight in parallel and owns the shell, the series
front door and the finishing of the shared engine — Khaybar must not collide with it. Badr's
`badr.js` is the working pattern for a battle module: layout, plans, vignette, choreography,
`BATTLE` API. The Khaybar ledger exists only as a skeleton (`data/ledger/khaybar.json`): entries
drafted, all UNKNOWN until live verification.

## Goals / Non-Goals

**Goals:**
- A graded Khaybar ledger the owner can review before any scene work.
- The series' first fortress battlefield: dark ḥarra, oasis floor, a legible fort chain.
- Sequential-siege choreography with deterministic seeks, on the battle-clock pattern.
- The ʿAlī/Marḥab duel beat reusing Badr's champion/standard machinery.
- Additive-only engine work that merges cleanly against the Uhud change.

**Non-Goals:**
- Night lighting (Muʾtah's need, a later change).
- Any shell/UI/page work — that belongs to `battle-series`.
- Facial features, depicting the Prophet ﷺ, narration or captions.
- Photoreal rendering, framework rewrites, pushing to GitHub.

## Decisions

### Ledger-first, with an owner gate
Grading (live sunnah.com/api.alquran.cloud verification, spine page locations, glossary terms)
completes before choreography, and the owner reviews the graded ledger before the scene build —
the same discipline as Badr. The skeleton's UNKNOWN entries carry proposed sources so grading is
confirmation work, not research from zero.

### Additive engine strategy, proven hooks only
New props (stone fort tower, basalt rock cluster, palm grove) join `ENGINE.props` as new exports;
the dark rock ground rides the existing `heightfield opts.material` hook that Badr's Phong
sand-ground already uses. No existing signature changes, so Uhud/Khandaq modules are untouched.
Forts merge through the existing merge system; the crowd stays instanced exactly as Badr's is.

### Terrain and palette
One dawn key kept (the standing light contract) against a darker ground: basalt greys for the
ḥarra, warm sand strip for the oasis floor, palm-green accents. The contrast does the depth work
haze used to do alone. `heightAt` lives in `khaybar.js` like Badr's does; the fort chain sits on
a raised line above the groves so each fort silhouettes separately.

### Choreography model
Phase list mirrors the campaign shape: ground, march/arrival, first forts, al-Qamūṣ siege,
standard + duel, reckoning. Per-fort capture states are timeline segments (a taken fort keeps its
state when seeking back to the siege, per the spec scenario). The duel reuses Badr's
champion-out-from-standard pattern with a maquette ʿAlī figure and Marḥab; the strike keys to its
graded entries only — no invented dialogue at any grade.

### Cameras
One continuous shot per phase, structured like Badr's SHOTS with the uniform portrait back-off
rule. No cuts, no impact shakes — owner rule, now in the synced `battle-visual-quality` spec.

### Coordination with the Uhud change
Build `app/khaybar.html` standalone against the engine exactly as Badr runs today; when the
`battle-series` shell lands, the page swaps onto it. If `uhud-and-shared-battles` lands mid-work,
rebase the additive engine edits on top — the additive-only rule is what makes that cheap.

## Risks / Trade-offs

- **Fort order variants** → staged as a range per the ledger rule; never a single confident order.
- **Duel details are sīrah-lineage** → REPORTED treatment: named pair and kill beat stand, wording
  and ornament stay off-screen until graded.
- **Dark palette vs the dawn contract** → keep one key; the risk is mud, so the ground material is
  probed before the scene build commits to it.
- **Fourth battle before the shell lands** → duplication risk is contained by the data-only rule;
  the page-level swap to the shell is one task, not a rewrite.
- **Scope creep into shared engine rewrites** → rejected; anything the fort props genuinely need
  from the engine lands as new exports with Uhud's team in the loop.
