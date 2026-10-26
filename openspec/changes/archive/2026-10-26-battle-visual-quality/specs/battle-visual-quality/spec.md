# Spec Delta

## Purpose

The battle model's visual contract: a deliberate carved-maquette look, living figures and crowd, a field with real depth, phase-directed camera shots, and a measured mobile cost.

## ADDED Requirements

### Requirement: Carved-maquette visual language
The scene SHALL use sculpted, tapered forms and matte materials rather than unmodified primitives; one warm dawn key light with long shadows; cool sky fill; atmospheric haze; and a restrained post grade. The sand, tents, wells, palms and figures SHALL share one coherent palette and silhouette language.

#### Scenario: A hero frame reads as a maquette
- **WHEN** the hero frame is rendered
- **THEN** figures, ground, well and tent read as one sculpted set
- **AND** no flat checker, untextured primitive or cone tent dominates the frame

### Requirement: Faceless figures
Every figure SHALL be faceless: no eyes, nose or mouth, in any style. Named Companions SHALL appear as stylized faceless figures only where the owner explicitly approved it; elsewhere standards, weapons and banners mark them. Rigged GLTF heroes SHALL replace the procedural figures only after they load reliably on the owner's setup and the owner approves the frame test; until then the approved language SHALL be the faceless procedural maquette. The Prophet ﷺ SHALL never be depicted.

#### Scenario: A champion advances and strikes
- **WHEN** the champion walks and attacks
- **THEN** the legs step and the weapon arm drives the strike
- **AND** the face remains covered

### Requirement: Figure-language acceptance gate
A change to the figure language SHALL be proven on a standalone frame test — candidate figure(s) against the field, light and props, playing a short advance → strike → hit beat — and SHALL NOT roll out scene-wide until the owner approves that frame.

#### Scenario: Reviewing the frame
- **WHEN** a figure-language candidate frame plays
- **THEN** the motion, figures and field can be judged together
- **AND** no scene-wide rollout starts until the owner approves

### Requirement: Living crowd
The massed armies SHALL march and fight with a leg gait, weapon thrust and hit ripple rather than sliding rigid bodies. The crowd SHALL stay instanced and SHALL keep the three Quraysh divisions legible during the advance.

#### Scenario: The advance
- **WHEN** the advance plays
- **THEN** legs alternate and weapons move with the men
- **AND** the crowd does not slide as a single block

### Requirement: Field depth and atmosphere
The field SHALL use a heightfield with sculpted dunes, stratified rock, scrub, palms, masonry wells and layered camps. Atmospheric haze, aerial perspective and a post grade SHALL separate foreground, battle and horizon.

#### Scenario: Looking across the valley
- **WHEN** the camera looks across the field
- **THEN** foreground sand, battle, camp and horizon separate by depth and haze
- **AND** the ground does not read as a flat tiled plane

### Requirement: Phase-directed cameras
Each phase SHALL follow a directed camera shot that carries that phase's story — not a static view and not a single global ease. A phase shot is one continuous move (establishing push, duel side, advance, rout pull-back, reckoning overview) with a uniform portrait back-off; mid-phase cuts and impact shakes SHALL NOT be used without explicit owner approval.

#### Scenario: The duel beat
- **WHEN** the champion strikes
- **THEN** the camera holds the duel shot on the action
- **AND** the strike reads through figure motion and dust, without a camera shake

### Requirement: Mobile performance budget
The visual rebuild SHALL keep the crowd instanced/LODed, heroes limited to the named cast, and the field batched. Draw calls and triangles SHALL be measured on the 390×844 profile; the rebuild SHALL not regress the existing mobile interaction.

#### Scenario: Phone profile
- **WHEN** the rebuilt scene runs at 390×844
- **THEN** the hero frame and mass advance remain interactive
- **AND** draw calls stay in the low hundreds