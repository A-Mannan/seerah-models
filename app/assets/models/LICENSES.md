# Asset licences

All character, animal and weapon assets used by the Badr model are **CC0 1.0 (public domain)**.

## Chosen — Quaternius (CC0)

**Ultimate Modular Men / Animated Men** — hero figures.
- Source: https://quaternius.com/packs/ultimatemodularcharacters.html
- Mirror used for the download: https://poly.pizza/bundle/Animated-Men-Pack-DAC9SDgMQT
- Licence: CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/
- Author: Quaternius.
- Local file: `app/assets/models/quaternius/Adventurer.fbx` (rigged, 24 clips). The unused static
  alternates and the rejected packs were removed after review to keep the repo lean.
- Clips used: `CharacterArmature|Idle_Sword`, `|Walk`, `|Sword_Slash`, `|HitRecieve`,
  `|HitRecieve_2`, `|Death`. Full set also has run, punch, kick, roll, wave, interact, gun idles.

**Medieval Weapons Pack** — sword, spear, round shield.
- Source: same pack page / Quaternius showcase mirror.
- Licence: CC0 1.0.
- Local files: `Sword.glb`, `Spear.glb`, `Shield_Round.glb`.

**Ultimate Animated Animals** — horse.
- Licence: CC0 1.0.
- Local file: `Horse.glb` (13 clips: idle, walk, run, eat, death …). Not used in the hero frame —
  it reads as a toy at the maquette scale; held for the field/camp layer.

## Rejected — kept as comparison only

**Gobkit Free Character Pack Vol.3** (`Footman`, `Scout`, `Archer`, `HeavyWarrior`,
`KnightCaptain`, `PeasantMilitia`) — CC0 1.0, https://gobkit.com/freebies/human003/.
Rejected: chibi / Clash-of-Clans proportions with exposed faces. Files removed from the repo.

**KayKit Adventurers** (`Knight`, `Rogue`, `Rogue_Hooded`, `Mage`, `Barbarian`) — CC0,
https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0.
Rejected: Fortnite-style big heads and exposed faces. Files removed after review.

## Code

- `three.min.js` r128 — MIT.
- `GLTFLoader.js`, `SkeletonUtils.js`, `FBXLoader.js` — Three.js examples, MIT.
- `fflate.js` — MIT (required by `FBXLoader` for binary FBX).

## Rules that outrank the assets

- The Prophet ﷺ is never depicted, in any form.
- No facial features on any figure. Quaternius heads are recoloured to cloth and covered by a
  procedural headwrap (cloth skull + wound turban) or a helm; the `Head` mesh colour is cloth so a
  gap can never reveal a face.
- These are carved-maquette stand-ins, not portraits of named Companions.