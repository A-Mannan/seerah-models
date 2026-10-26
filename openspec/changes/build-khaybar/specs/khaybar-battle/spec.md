# Spec Delta

## Purpose

The Khaybar model: the fortress campaign of Muḥarram 7 AH rendered as the series' first non-open-field battle — a chain of stone forts on dark volcanic ground, a graded ledger, and the ʿAlī/Marḥab duel beat on the shared engine.

## ADDED Requirements

### Requirement: Graded Khaybar ledger
Every Khaybar claim the model renders SHALL trace to a graded entry in `data/ledger/khaybar.json`. UNKNOWN entries SHALL NOT render; DISPUTED entries SHALL render both variants as ranges, never harmonized; no claim SHALL be invented or silently upgraded. Choreography beats SHALL key to ledger entry IDs.

#### Scenario: The duel carries its grade
- **WHEN** the duel beat plays
- **THEN** its staging matches the graded entries it keys to
- **AND** no dialogue or detail appears that the ledger does not grade

### Requirement: Depiction rules
Every figure SHALL be faceless and the Prophet ﷺ SHALL never be depicted in any form. Labels SHALL carry honorifics (RA, PBUH, ﷺ) and SHALL render in full English and Urdu (Nastaliq, RTL, Urdu numerals).

#### Scenario: A close shot stays faceless
- **WHEN** the camera moves close to a named figure
- **THEN** no facial features are visible
- **AND** the label reads correctly in both languages with its honorific

### Requirement: The fortress field
The field SHALL be a volcanic heightfield: dark ḥarra rock rising above an oasis floor of palm groves and fields, with the fort chain placed on raised ground so each fort reads as a separate capture, and haze separating groves, rock and horizon.

#### Scenario: The establishing view
- **WHEN** the ground phase opens
- **THEN** the fort chain, oasis floor and volcanic rise separate by depth and tone
- **AND** no fort reads as part of the same mass as another

### Requirement: Sequential siege choreography
The choreography SHALL render the campaign's shape — march and night arrival, the first forts, the al-Qamūṣ siege, ʿAlī's standard and the duel, the reckoning — as deterministic battle-clock phases, so seeking anywhere lands on the same pose. Where the fort order is DISPUTED, the scene SHALL stage a range, not one confident order.

#### Scenario: Seeking back to the siege
- **WHEN** the timeline scrubs back to the start of the Qamūṣ phase
- **THEN** the siege state matches the state a first viewing showed
- **AND** the captured forts stay visibly taken

### Requirement: The duel beat
The ʿAlī (RA)/Marḥab duel SHALL be staged only as its graded entries support it: the named pair, the standard, the kill beat. Where a detail is single-lineage, it SHALL render without certainty framing; the Prophet ﷺ never appears.

#### Scenario: The strike reads
- **WHEN** the duel phase plays
- **THEN** the two figures come forward from their standards and the strike connects visibly
- **AND** the beat keys to its ledger entry without invented dialogue

### Requirement: Phase-directed cameras
Each phase SHALL follow one continuous directed camera shot with the uniform portrait back-off. Mid-phase cuts and impact shakes SHALL NOT be used.

#### Scenario: The duel holds
- **WHEN** the duel strike lands
- **THEN** the camera holds the duel shot without a cut or shake
- **AND** the beat reads through figure motion and dust

### Requirement: Mobile budget
The crowd SHALL stay instanced, the field and forts batched or merged, and draw calls SHALL stay in the low hundreds at 390×844 without regressing the established interaction (orbit, pinch, zoom-to-cursor, 0.5×–2× speeds).

#### Scenario: Phone profile
- **WHEN** the scene runs at 390×844
- **THEN** the siege wide view and duel close view remain interactive
- **AND** measured draw calls stay in the low hundreds

### Requirement: Data and choreography only
`khaybar.js` SHALL be a scene module on the shared engine supplying layout, plans, choreography and data. Engine changes SHALL be additive (new exports only, no changed signatures); the scene SHALL NOT fork shell, UI, sky, ground or label code.

#### Scenario: No duplicated systems
- **WHEN** the Khaybar page loads
- **THEN** sky, ground, crowd, labels and clock come from the shared engine
- **AND** `khaybar.js` contains only Khaybar scene and data
