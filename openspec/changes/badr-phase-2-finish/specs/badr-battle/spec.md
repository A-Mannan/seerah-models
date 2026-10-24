# Spec Delta

## Purpose

The Badr battle model is a pure-visual, seven-phase 3D replay of the day: faceless action figures, a staged command vignette, story cameras and bilingual labels, with every claim anchored to the graded ledger.

## ADDED Requirements

### Requirement: Seven-phase replay and playback
The model SHALL present the battle as seven ordered phases with play, pause, scrub, replay, and 0.5×/1×/1.5×/2× speeds. The play control SHALL read “play” when idle. The timeline SHALL run right-to-left in Urdu and left-to-right in English. No build or version string SHALL appear in the public UI.

#### Scenario: Scrubbing the battle
- **WHEN** the user drags the timeline
- **THEN** the scene, labels and phase counter update to that moment without playing
- **AND** the play control reads “play” while paused

#### Scenario: Urdu timeline direction
- **WHEN** the interface language is Urdu
- **THEN** the timeline origin and scrub direction mirror to right-to-left
- **AND** phase numbers use Urdu numerals

### Requirement: Faceless action figures and mass combat
Massed soldiers SHALL be detailed, instanced figures with bodies, limbs, feet, tunics, head-cover and weapons. During the clash they SHALL fight with leveled spears, arrows and swords rather than standing as static spikes. No figure SHALL have facial features, and the Prophet ﷺ SHALL never be depicted.

#### Scenario: The clash reads as fighting
- **WHEN** the replay reaches the clash
- **THEN** the massed spear hedge levels toward the enemy and thrusts
- **AND** arrows fly and swords swing
- **AND** the figures remain faceless

#### Scenario: Close inspection
- **WHEN** the camera is zoomed onto any soldier or vignette figure
- **THEN** the body, limbs and weapons read as a figure
- **AND** no eyes, nose, mouth or painted face is present

### Requirement: Abu Jahl action vignette
The model SHALL stage the Abu Jahl sequence with five faceless figures: ʿAbdur-Raḥmān ibn ʿAwf identifies Abu Jahl to Muʿādh and Muʿawwidh; the two Anṣār youths rush and strike; Ikrimah cuts Muʿādh's arm; Muʿādh steps on the severed arm, separates it and fights one-armed; Muʿawwidh is martyred; Abu Jahl falls. Labels SHALL carry the honorifics. The old duplicate Muʿādh/Muʿawwidh/Ikrimah standards SHALL NOT remain.

#### Scenario: The sequence plays in order
- **WHEN** the command beat plays
- **THEN** the run, strike, arm cut, step/separate, Muʿawwidh's fall and Abu Jahl's fall occur in that order
- **AND** Muʿādh's stump and one-handed spear remain visible after the cut
- **AND** no duplicate event marker competes with the figures

#### Scenario: Labels are phase-bound
- **WHEN** the replay is before the command beat or after the reckoning
- **THEN** the vignette labels are hidden
- **AND** they appear only while the figures are on stage

### Requirement: Story cameras and free exploration
The camera SHALL carry the story through the phase cameras, including a close approach to the command vignette in “the sand”; a row of camera-preset chips SHALL NOT be shown. When paused, the user SHALL still be able to drag-orbit, turntable, zoom-to-cursor and pinch-zoom.

#### Scenario: Playing without preset chips
- **WHEN** the battle plays
- **THEN** the camera moves with the phase, including the vignette close-up
- **AND** no camera-preset chip row is visible

#### Scenario: Paused exploration
- **WHEN** the user pauses and drags or pinches
- **THEN** the camera orbits or zooms around the current focus with inertia
- **AND** playback stays paused

### Requirement: Phase-gated event layer and initial formation
Named event figures SHALL be hidden until the phase in which they act. The two Anṣār youths SHALL begin at the Muslim line, not in no-man's-land. Bilāl and ʿUmayyah SHALL appear only for the rout. No event label SHALL sit in the opening formation as if that person were already there.

#### Scenario: The opening formation
- **WHEN** the replay is at the ground or the champions' duel
- **THEN** no Muʿādh, Muʿawwidh, Bilāl or ʿUmayyah label is shown
- **AND** no vignette figure stands in the front

#### Scenario: The rout
- **WHEN** the replay reaches the rout
- **THEN** Bilāl and ʿUmayyah enter the event layer
- **AND** the command figures remain where the fight left them

### Requirement: Ledgered history and bilingual labels
Every event, count and place name SHALL trace to an entry in `data/ledger/badr.json`. Disputed counts SHALL be shown as ranges, never harmonized. Labels SHALL be available in English and Urdu with Nastaliq, RTL and Urdu numerals. The wells account SHALL state that the Muslims reached the wells first on al-Ḥubāb's advice, that rain firmed their ground and muddied the Quraysh slope, and that the Quraysh were denied water.

#### Scenario: Wells and rain
- **WHEN** the wells or the rain are described
- **THEN** the model follows the ledger's account
- **AND** it does not say the Quraysh seized the wells or that the Muslims fought without water

#### Scenario: Language switch
- **WHEN** the user switches to Urdu
- **THEN** labels, honorifics, phase names and the timeline render in Nastaliq and RTL
- **AND** the English labels are restored on switching back

### Requirement: Mobile performance and framing
The model SHALL remain usable on a portrait phone: the field, active labels and controls SHALL stay in frame, and the instanced armies SHALL stay within the established draw-call and triangle budget. Adding figures or detail SHALL NOT introduce per-man draw calls.

#### Scenario: Phone playthrough
- **WHEN** the model runs on a 390 × 844 portrait viewport
- **THEN** the play, timeline and reset controls are reachable
- **AND** the command beat and the rout remain legible
- **AND** no label or control is clipped

#### Scenario: Performance budget
- **WHEN** the scene is measured at the clash
- **THEN** the massed armies still render through instanced meshes
- **AND** draw calls stay in the low hundreds, not one per soldier
### Requirement: Named duel and Anṣār figures
The six champions and the first three Anṣār SHALL be represented by faceless figures at their standards, not by banners alone. Each figure SHALL move and fall with its standard. No figure SHALL have facial features, and the Prophet ﷺ SHALL never be depicted.

#### Scenario: The duel shows six figures
- **WHEN** the 3v3 phase plays
- **THEN** six faceless champion figures stand at their standards
- **AND** the three Anṣār figures step out and withdraw with their standards in the first challenge

#### Scenario: A champion falls
- **WHEN** a champion's standard falls
- **THEN** the figure falls with it

### Requirement: Dispersing advance
During the advance and clash the massed ranks SHALL loosen and spread within their divisions rather than moving as rigid blocks. The three Quraysh divisions SHALL remain legible.

#### Scenario: The advance
- **WHEN** the advance begins
- **THEN** squads and men spread laterally and unevenly
- **AND** the three Quraysh divisions remain readable

### Requirement: Detailed aftermath bodies
The 70 captives, the 70 Quraysh dead and the 24 leaders at al-Qalib SHALL be faceless figures with bodies, heads, arms, legs and feet, not featureless cylinders.

#### Scenario: The reckoning
- **WHEN** the aftermath is shown
- **THEN** captives and dead have limbs and heads
- **AND** no face is present

### Requirement: Clear field layout
The wells SHALL sit clear of the duel and the command plinth. The ʿarish SHALL sit behind the Muslim line. The command plinth SHALL be hidden during the duel and advance and appear for the sand beat.

#### Scenario: The duel layout
- **WHEN** the 3v3 plays
- **THEN** no well or command plinth overlaps the champions
- **AND** the ʿarish reads as a rear headquarters

#### Scenario: The command
- **WHEN** the sand phase plays
- **THEN** the plinth is visible under the five figures
