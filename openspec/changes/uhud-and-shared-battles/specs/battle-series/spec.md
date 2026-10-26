# Spec Delta

## Purpose

The series contract: one front door, one shell, one engine, and per-battle models that carry only
their own ground, plans, shots and graded copy.

## ADDED Requirements

### Requirement: Series front door
The root page SHALL present the series as a catalogue: at least one plate per shipped battle with its
name, place, date and a link to the model page. It SHALL state the standing rules (the Prophet ﷺ is
never depicted; every claim traces to a graded ledger) and SHALL offer English and Urdu. It SHALL NOT
show a public build or version string, and SHALL NOT require JavaScript to reach the model links.

#### Scenario: Opening the series
- **WHEN** a visitor opens the root page
- **THEN** Badr and Uhud are both visible as models with a working link
- **AND** the rules and the language switch are readable without a script

### Requirement: One shell per battle page
Every battle page SHALL use the same shell for play, timeline, scrub, speed, reset, language, sound,
hint and the phase name. The shell SHALL be configured by a battle descriptor, not forked per battle.
The timeline SHALL run right-to-left in Urdu with Urdu numerals, and the play button SHALL read "play".

#### Scenario: Switching language on Uhud
- **WHEN** the visitor switches to Urdu
- **THEN** the deck, legend, hint, phase names and every label switch together
- **AND** the timeline direction and numerals switch too

### Requirement: A battle supplies data and choreography only
A new battle SHALL be addable without copying the renderer boot, sky, ground, standards, faceless
figures, clock/RAF loop, label placement, orbit, particles or debug API. Those SHALL live in the shared
engine; the battle module SHALL supply layout, plans, shots, copy and a frame hook.

#### Scenario: Adding a battle
- **WHEN** a second battle module is added
- **THEN** it reuses the engine's sky, ground, standards, figures and runner
- **AND** the shell needs only a descriptor entry

### Requirement: Standing depiction rule
No figure in any model SHALL show a face, and the Prophet ﷺ SHALL never be depicted in any form. Named
Companions SHALL appear only as faceless stylized figures where the owner has approved, or as
standards and weapon-masses.

#### Scenario: Inspecting a close frame
- **WHEN** a close camera frame is inspected
- **THEN** no eyes, nose or mouth are visible on any figure
- **AND** no figure is presented as the Prophet ﷺ
