# Design

## Context

Badr is live; the engine split from build r left `engine.js` with the shared renderer, heightfield,
props, merge, crowd, labels, director and particles, but `badr.js` still carries its own sky, ground
and a Badr-only clock/label loop, and `main.js` hardcodes Badr's copy. Uhud and Khandaq were blocked
on owner approval. The owner has now approved Uhud and asked for the series to share one system.

## Goals / Non-Goals

**Goals**
- A second battle built mainly as data: layout, plans, shots, copy and a choreography hook.
- One shell for every model page, config-driven, English and Urdu.
- A front door that presents the series as a body of work.
- No regression in Badr's look, motion or mobile cost.

**Non-Goals**
- Khandaq, narration, scholar's mode, a 3D engine rewrite or a React scene.
- New historical claims outside the ledger.

## Decisions

### The engine owns the battle lifecycle
`ENGINE.runner(ctx, opts)` takes the scene module's `applyFrac`, `crowdEnv`, label arrays, and the
director, and owns RAF, clock, seek/play/pause, visibility pause, the throttled-RAF fallback, the
label pass and the debug API. Scene modules keep only what is theirs: layout tables, plans, the
choreography, the shots and the copy. This is the line that makes a third battle cheap.

### Sky, ground, standards and figures are engine functions
`ENGINE.sky` is the build-q vertex-gradient dome + stars + moon + hemi/key/fill/rim rig, with palette
overrides per battle (Uhud is a later, harder morning). `ENGINE.ground` paints the sand texture and
calls the heightfield. `ENGINE.standards` and `ENGINE.figures` keep the exact objects Badr's
choreography animates (`waver`, `armR`, `stump`, `stepLeg`), so the move is a move, not a rewrite.

### The shell is a renderer over a descriptor
`app/js/shell.js` reads `window.BATTLE` and a `window.BATTLE_PAGE` descriptor: brand, phase names and
durations, legend, hint, storage prefix, sound cue map, home link, build tag. It owns every control.
The battle modules never touch the DOM except their labels.

### Uhud is a different ground, not a repaint of Badr
The battle ran on the plain south of Uhud with the mountain at the Muslims' backs, the archers' hill
east of the line, and the Quraysh camp to the south-west. The layout is authored from the chapter:
the Muslim line faces south-west, Uhud rises north, the hill is a separate heightfield lobe, and the
Quraysh horse starts wide on the wings. That geometry is what the phases move against.

### The archers' mistake is the hinge
The model's spine is not "a battle" but a decision: the archers held (three cavalry assaults
repulsed), then forty left the hill for the spoils; Khalid's horse turned the empty hill and struck
the rear. Every phase after the spoils follows from that, so the hill stays visible and the camera
returns to it at the flank. The spoils beat is the only place the model shows men leaving a post.

### Depiction
No face, ever. Named events are standards, weapon-masses or faceless action figures at maquette
distance. The Prophet ﷺ is never depicted: his station is a standard beside the defile, and the
wound is told by the ledger and the quiet of the line, as at Badr. Ḥamzah's killing and the
mutilation are recorded in the ledger and never staged: the model shows the standard falling and the
line breaking, then the field.

### Ledger grading for Uhud
The spine is Raheeq al-Makhtum pp. 155-181. A claim from Raheeq alone is REPORTED; a claim carried by
Bukhari/Muslim or the Qur'an and Raheeq is CERTAIN; counts with conflicting transmissions are
DISPUTED and rendered as ranges (Quraysh dead "22, some say 37"). The Uhud labels use only CERTAIN
and REPORTED entries; DISPUTED counts are shown as "22-37".

## Risks / Trade-offs

- **A second battle's ground fights the Badr-tuned director.** The shot list is authored per phase
  and the portrait backing-off rule stays; verify on 390x844 before tuning beauty shots.
- **The refactor could move Badr's approved look.** Mitigation: move code, do not restyle; keep the
  same materials, light values and draw order; probe every phase before and after.
- **Crowd cost with 3,700 men.** Uhud fields 700 + 3,000 (vs 1,313 at Badr); benchmark `benchMass`
  and keep the same instance counts per squad, dropping the Quraysh rows before detail.
- **The landing page could drift into marketing.** Keep it a catalogue: two plates, place and date,
  the rules, no claims.
