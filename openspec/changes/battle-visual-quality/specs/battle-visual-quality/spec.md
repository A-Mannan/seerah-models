# Spec Delta

## Purpose

The battle model's visual contract: a deliberate carved-maquette look, living figures and crowd, a field with real depth, directed camera transitions, and a measured mobile cost.

## ADDED Requirements

### Requirement: Carved-maquette visual language
The scene SHALL use sculpted, tapered forms and matte materials rather than unmodified primitives; one warm dawn key light with long shadows; cool sky fill; atmospheric haze; and a restrained post grade. The sand, tents, wells, palms and figures SHALL share one coherent palette and silhouette language.

#### Scenario: A hero frame reads as a maquette
- **WHEN** the hero frame is rendered
- **THEN** figures, ground, well and tent read as one sculpted set
- **AND** no flat checker, untextured primitive or cone tent dominates the frame

### Requirement: Faceless rigged heroes
The named heroes SHALL use rigged GLTF animation for idle, walk, attack, hit and death. Faces SHALL be covered by helmets, hoods or cloth veils; no figure SHALL show eyes, nose or mouth. The Prophet ﷺ SHALL never be depicted.

#### Scenario: A hero advances and strikes
- **WHEN** the champion walks and attacks
- **THEN** the legs step and the weapon arm follows the animation
- **AND** the face remains covered

### Requirement: Hero-frame acceptance gate
A standalone hero-frame test SHALL be built before the full scene rebuild. It SHALL include one champion, one soldier, one Quraysh fighter, a horse, a well, a tent, a terrain patch, the dawn light and post, and a five-second advance → strike → hit sequence with a wide-to-close camera cut. The owner SHALL approve the frame before hero/crowd/field rollout.

#### Scenario: Reviewing the frame
- **WHEN** the hero frame plays
- **THEN** the motion, figures and field can be judged together
- **AND** no full-scene rebuild starts until the owner approves

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

### Requirement: Directed transitions
Phase cameras SHALL follow a shot list with motivated cuts, holds and impact frames, not one continuous ease between two points. The 3v3, command vignette, rout and reckoning SHALL each have a clear shot rhythm.

#### Scenario: The strike cut
- **WHEN** the champion strikes in the hero frame
- **THEN** the camera cuts or pushes on the impact
- **AND** the hit has a readable reaction and dust beat

### Requirement: Mobile performance budget
The visual rebuild SHALL keep the crowd instanced/LODed, heroes limited to the named cast, and the field batched. Draw calls and triangles SHALL be measured on the 390×844 profile; the rebuild SHALL not regress the existing mobile interaction.

#### Scenario: Phone profile
- **WHEN** the rebuilt scene runs at 390×844
- **THEN** the hero frame and mass advance remain interactive
- **AND** draw calls stay in the low hundreds