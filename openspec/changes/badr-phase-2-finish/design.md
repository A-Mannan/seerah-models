# Design

## Context

The Badr scene is a single Three.js r128 module (`app/js/battle.js`, ~2.3k lines) with a static HTML shell and a UI clock in `main.js`. The armies already render as instanced squads, but the massed men are coarse, the named event layer is standards-and-labels, and the seven camera-preset chips duplicate the phase cameras. Part of this change is already landed in the working tree (plinth, five figures, mass detail, spear instances, phase-camera beat, chip removal, label gates); the tasks finish and verify it.

## Goals / Non-Goals

**Goals:**
- A close, legible command vignette that plays in the “sand” beat without hiding the wider battle.
- Detailed but cheap mass figures: one instanced body mesh per side plus one instanced spear mesh, no per-man draw calls.
- A camera story that needs no preset chips, while preserving paused orbit and zoom.
- Phase-gated event labels and figures so the opening formation is clean.
- A build that passes the existing desktop/mobile gates and can be committed locally.

**Non-Goals:**
- A skeletal animation system, authored GLTF characters, or facial rigs.
- A React/R3F rewrite. The shared-engine split is a separate change before Uhud/Khandaq.
- New historical content beyond the ledgered Abu Jahl/Muʿādh/Bilāl events already approved.
- Photoreal lighting, PBR materials, or post-processing.

## Decisions

### Keep the vanilla instanced renderer
**Decision:** Stay on Three.js r128 with `InstancedMesh` for the armies; no React in the shipped app.
**Why:** The heavy work is 1,313 soldiers and a 660k-triangle scene, not UI state. Instancing keeps one draw call per body/spear/shield batch. A React/R3F migration would add a build step and a reconciler without fixing the geometry cost.
**Alternative:** React Three Fiber for the whole scene — rejected for this change; revisit only if the UI shell needs componentization.

### Stage the vignette on a low sand plinth in the Quraysh gap
**Decision:** Put the five figures on a shallow, trampled plinth at roughly `(-9, -0.3)` — the gap between the Quraysh centre and left divisions — and let the massed files frame it.
**Why:** The gap already exists in both formations, so the fight reads as a pocket opened by the battle rather than a separate diorama. A raised, circular plinth is a maquette convention and hides the feet/ground intersection.
**Alternatives:** A floating inset (too gamey), a stage in the Muslim line (wrong side of the story), or clearing a new hole in the mass (weakens the 313 vs 1,000 read).

### Five faceless figures at 1.15×
**Decision:** Build the vignette figures from the same primitives as the mass, but with separate arms, a stump, a step leg and a severed arm; scale them 1.15× so they read at the command camera without looking like giants beside the 1.5m mass.
**Why:** The owner approved detailed faceless figures for this scene. The scale is a deliberate “hero” lift, not a second army.
**Alternative:** Fully realistic proportions — rejected; the mass is stylized and the scene must stay coherent.

### Separate instanced spear hedge
**Decision:** Remove the spear from the merged body geometry and render it as its own instanced mesh; each spear follows the man’s hand and tilts from upright to leveled as the fight rises.
**Why:** One extra draw call buys the single strongest “they are fighting” cue. Per-man spear matrices are cheap beside the existing body matrices.
**Alternative:** Keep the spear welded to the body — rejected; the hedge stays vertical and the clash reads as a crowd, not a fight.

### Story cameras, no chips
**Decision:** Delete the seven-chip camera row; let `CAMS` carry the story and give the “sand” phase a close approach to the plinth. Keep orbit, drag, inertia and zoom-to-cursor for paused exploration.
**Why:** The chips were a redundant second navigation system; the timeline is the primary control. A single camera beat also guarantees the vignette is seen without a manual preset.
**Alternative:** Keep one “command” chip — rejected for now; it reintroduces the row the owner asked to remove.

### Gate by phase, not opacity
**Decision:** Use the existing `ph` label gates plus group visibility for named figures and event standards. Start the two youths at the Muslim line; hold Bilāl/ʿUmayyah until the rout.
**Why:** Hidden labels cannot collide with the opening formation; invisible groups cost nothing. Fading would still leave labels and silhouettes in the frame.
**Alternative:** Always-visible event layer — rejected; it made the opening look as if the named figures were already in the front.

### Ledger-first verification
**Decision:** Keep `data/ledger/badr.json` as the source of truth; add or cite an entry before any new event label. The wells/rain correction is part of the deliverable.
**Why:** The model’s authority is the graded record, not visual convenience.

## Risks / Trade-offs

- **Vignette occlusion** → The plinth sits in a natural gap and the “sand” camera approaches from the Muslim side; verify from the actual phase stills, not the editor.
- **Scale mismatch** → 1.15× is a compromise; if the figures still look oversized beside the mass, tune the mass height before shrinking the vignette.
- **Spear matrix cost** → One more matrix per man; measure `BATTLE.benchMass()` and keep the update under the existing frame budget.
- **Camera swoop** → The clash-to-sand move crosses the field; if it is disorienting, soften it with the existing camera lerp rather than adding a cut.
- **Duplicate labels** → The old Muʿādh/Muʿawwidh/Ikrimah standards were removed; verify no stale `EVENT_MARKS` entry survives.
- **Future battles** → This design is Badr-specific. The engine split must happen before Uhud/Khandaq, or the second model will copy the same monolith.

## Migration Plan

1. Finish the vignette timing/staging and remove the duplicate markers.
2. Verify mass detail and the spear hedge at desktop and phone sizes.
3. Verify the camera story and the clean opening; remove any leftover chip CSS/strings.
4. Run `node --check`, lint, inspect, the story/mobile probes and `benchMass`.
5. Cut build **p**, update `PROGRESS.md`, commit locally. Push only on explicit owner approval.

Rollback: revert the build-p commit; the previous build **o** remains the live baseline.

## Open Questions

- None blocking. The shared-engine split and the Uhud/Khandaq ledgers are deliberately deferred to separate changes.