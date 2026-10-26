# Spec Delta

## Purpose

The Khandaq model: a graded ledger, the northern approach and its trench, seven phases that follow the siege to the withdrawal, faceless figures and the Prophet's station marked without a person, portrait-first cameras, and a page on the Atlas gate.

## ADDED Requirements

### Requirement: Graded Khandaq ledger
The model SHALL be backed by `data/ledger/khandaq.json`, using the same conventions and grading policy as the Badr and Uhud ledgers. Every claim that appears as a label, count or beat SHALL trace to a graded entry; Raheeq alone SHALL be graded REPORTED; a Qur'an or sound hadith anchor plus Raheeq SHALL be graded CERTAIN; conflicting reports SHALL be recorded as DISPUTED with both variants and SHALL NOT be harmonised. The ledger SHALL remain `awaiting_owner_review` until the owner approves it.

#### Scenario: A label cites its entry
- **WHEN** a Khandaq label states an event or a number
- **THEN** the supporting entry exists in the ledger with a grade and sources
- **AND** no ungraded claim is rendered as fact

### Requirement: The trench and the field
The scene SHALL show the northern approach to Madinah, the trench cut east–west from the western ḥarrah to the eastern marsh, the narrow crossing at its eastern end, the Qurayẓa forts on the eastern spur, Sīlāʿ at the Muslim rear, and the three Confederate camps. The trench SHALL be a real cut in the heightfield with two walls and a filled neck at the crossing. The Muslim force SHALL read as about three thousand and the Confederate force as about ten thousand, both instanced.

#### Scenario: Looking across the ditch
- **WHEN** the ground or trench phase is viewed
- **THEN** the ditch, its berms, the crossing and the two armies are legible against the plain
- **AND** the camps, Sīlāʿ and the forts sit on the correct sides

### Requirement: Seven phases on the shared clock
The battle SHALL run seven phases — ground, trench, siege, crossing, covenant, storm, reckoning — on the shared runner, with deterministic seek. The choreography SHALL show the digging, the blockade, the forcing of the narrow neck and ʿAmr's challenge answered by ʿAlī (RA), the broken pact of Banū Qurayẓa, the wind and rain that break the Confederate camp, and the withdrawal. The Confederates SHALL NOT cross the trench except at the filled neck.

#### Scenario: Seeking to the storm
- **WHEN** the reel is seeked to the storm phase
- **THEN** the tents are down, the rain and wind are running, the sky has darkened and the enemy is still in the field
- **AND** the same frame is reached on a repeat seek

### Requirement: Faceless depiction and the station
The Prophet ﷺ SHALL never be depicted, in any form. No figure SHALL have facial features. The Prophet's station SHALL be marked by an empty stone ring or platform, a white standard, green pennants and faceless guards — never by a person. Named Companions SHALL be marked by standards and weapon-masses; where a named figure is shown it SHALL remain a stylized faceless figure. Labels SHALL use (RA), (PBUH) and ﷺ where appropriate, in full English and Urdu (Nastaliq, RTL, Urdu numerals).

#### Scenario: The station on screen
- **WHEN** a phase showing the Prophet's station plays
- **THEN** the station is visible as an empty marked place with its standard
- **AND** no figure, silhouette or face stands in it

### Requirement: Portrait camera framing
Every phase SHALL be readable at 390×844 without the camera leaving the valley, entering the enemy ranks, or showing terrain above the horizon. A scene MAY cap the shared portrait pull and MAY supply per-shot portrait camera endpoints; these SHALL apply only when the viewport is portrait and SHALL NOT change the desktop shots.

#### Scenario: The crossing on a phone
- **WHEN** the crossing phase is viewed at 390×844
- **THEN** the causeway, the standards and the opposing lines are in frame
- **AND** the view is not filled by the backs of one army

### Requirement: Page, shell and Atlas entry
Khandaq SHALL have a page on the shared shell (`app/khandaq.html`), a route (`khandaq/index.html`) and a door on the Atlas gate. The page SHALL use the shared timeline, play/speed/reset, English/Urdu switch, sound, deep link and debug build tag. The Atlas door SHALL be live, show the Khandaq field plate, and navigate to the route; `models.json` SHALL list Khandaq as live.

#### Scenario: Entering from the gate
- **WHEN** the Khandaq door is activated
- **THEN** the Khandaq page loads with `window.BATTLE`, seven phases and no console error
- **AND** the back link returns to the Atlas gate

### Requirement: Verification and mobile budget
The build SHALL pass `node --check` on every touched script, the design-taste lint and inspect gates with the standing allowances, and a fresh probe at 1440×900 and 390×844. Draw calls SHALL stay in the low hundreds, every label SHALL remain inside the viewport on the phone, the Urdu deck counter SHALL update while paused, and there SHALL be no console errors.

#### Scenario: The final gate
- **WHEN** the build-v probe runs
- **THEN** desktop and phone load with no console errors, labels in view and the Urdu counter in Urdu digits
- **AND** draw calls and `benchMass` are recorded in `PROGRESS.md`
