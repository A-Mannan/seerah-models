# Spec Delta

## Purpose

The Uhud model: a graded reconstruction of the battle south of Mount Uhud (7 Shawwal 3 AH), its
ground, forces, seven phases and the archers' decision that turned it.

## ADDED Requirements

### Requirement: Graded Uhud ledger
Every Uhud claim shown in the model SHALL trace to an entry in `data/ledger/uhud.json` with sources,
a grade (CERTAIN / REPORTED / DISPUTED / UNKNOWN) and a render_as rule. The ledger SHALL record the
spine source and its page numbers, and SHALL live-fetch and record the Qur'an anchors it uses. A claim
supported only by the spine SHALL be REPORTED. Conflicting counts SHALL be DISPUTED and shown as a
range.

#### Scenario: Reading a Uhud label
- **WHEN** a label names a person, a number or an event
- **THEN** it maps to a ledger entry
- **AND** a disputed count is shown as a range, never one figure

### Requirement: The ground of Uhud
The scene SHALL place the Muslim line with Mount Uhud behind it, the archers' hill east of the line as
a separate elevated feature, the Quraysh camp to the south-west, and the Muslim camp behind the line.
The field SHALL keep the carved-maquette language of Badr: sculpted heightfield, one dawn key, haze,
masonry and tents, instanced men with a gait.

#### Scenario: The archers' hill
- **WHEN** the ground phase and the flank phase are viewed
- **THEN** the hill reads as a distinct position that can be left and turned
- **AND** the mountain closes the Muslim rear

### Requirement: Forces and formations
The model SHALL show about 700 Muslims in three battalions, a fifty-archer squad on the hill, and a
Quraysh army of about 3,000 with mailed men, camels and 200 cavalry on the wings, using standards
rather than plates. The counts SHALL carry the ledger's grade.

#### Scenario: Both lines arrayed
- **WHEN** the ground phase settles
- **THEN** the Muslim line is thin against a deeper Quraysh array
- **AND** the archer squad is visible on the hill

### Requirement: The archers' decision drives the phases
The seven phases SHALL run: the ground; the archers' hill; the charge; the spoils; the flank; the
turn; the reckoning. The archers SHALL hold during the charge, leave the hill at the spoils, and
Khalid's cavalry SHALL wheel the hill and strike the rear at the flank. The Muslim line SHALL be
driven back to the mountain at the turn, and the reckoning SHALL show the field, the graves and the
martyrs' count.

#### Scenario: The spoils beat
- **WHEN** the spoils phase plays
- **THEN** men leave the hill toward the field
- **AND** the empty hill is legible before the cavalry arrives

### Requirement: Restraint at the named deaths
Ḥamzah's killing, the wounding of the Prophet ﷺ and the mutilation of the dead SHALL be recorded in the
ledger and SHALL NOT be staged as gore. The Prophet ﷺ SHALL never be depicted; his station SHALL be
marked by a standard. The dead SHALL be shown as covered forms, standards or graves, as at Badr.

#### Scenario: The Prophet's station
- **WHEN** the turn is viewed from any camera
- **THEN** the station is a standard and a ring of faceless figures
- **AND** no figure represents the Prophet ﷺ
