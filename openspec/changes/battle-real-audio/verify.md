# Verification — battle-real-audio (build aa)

Every shipped file: earshot `realness` (real recording vs code-synthesized) at source,
and measured peak/mean (dBFS) after processing. Role peak targets: clash −4, thud −5,
ram −6, whoosh −9, arrow −8, dig −10, horn −10, roar −12, thunder −14, beds −14 peak.

| cue | file | realness | dur s | peak dBFS | mean dBFS | source recording |
| --- | --- | --- | --- | --- | --- | --- |
| wind | `wind.mp3` | 0.932 real or pro-produced | 28.00 | -13.0 | -26.4 | [697217](https://freesound.org/sounds/697217/) |
| crowd | `crowd.mp3` | 0.909 real or pro-produced | 22.00 | -14.1 | -34.7 | [444900](https://freesound.org/sounds/444900/) |
| rain | `rain.mp3` | 0.913 real or pro-produced | 11.40 | -14.0 | -32.5 | [323427](https://freesound.org/sounds/323427/) |
| storm | `storm.mp3` | 0.965 real or pro-produced | 30.00 | -14.1 | -41.3 | [867938](https://freesound.org/sounds/867938/) |
| fire | `fire.mp3` | 0.976 real or pro-produced | 30.00 | -14.0 | -51.4 | [660298](https://freesound.org/sounds/660298/) |
| clash | `clash.mp3` | 0.989 real or pro-produced | 2.086 | -4.1 | -27.8 | [364531](https://freesound.org/sounds/364531/) |
| clash | `clash-2.mp3` | 0.978 real or pro-produced | 1.922 | -4.2 | -19.4 | [440069](https://freesound.org/sounds/440069/) |
| clash | `clash-3.mp3` | 0.982 real or pro-produced | 1.170 | -4.3 | -28.7 | [326868](https://freesound.org/sounds/326868/) |
| whoosh | `whoosh.mp3` | 0.996 real or pro-produced | 0.685 | -9.6 | -30.2 | [507466](https://freesound.org/sounds/507466/) |
| whoosh | `whoosh-2.mp3` | 0.915 real or pro-produced | 1.873 | -9.4 | -35.3 | [683101](https://freesound.org/sounds/683101/) |
| arrow | `arrow.mp3` | 0.994 real or pro-produced | 0.210 | -7.1 | -30.0 | [394179](https://freesound.org/sounds/394179/) |
| arrow | `arrow-2.mp3` | 0.987 real or pro-produced | 0.208 | -7.5 | -29.4 | [536068](https://freesound.org/sounds/536068/) |
| arrow | `arrow-3.mp3` | 0.819 real or pro-produced | 0.865 | -8.4 | -22.9 | [706676](https://freesound.org/sounds/706676/) |
| thud | `thud.mp3` | 0.964 real or pro-produced | 1.538 | -5.3 | -29.0 | [504626](https://freesound.org/sounds/504626/) |
| thud | `thud-2.mp3` | 0.909 real or pro-produced | 5.490 | -5.5 | -28.3 | [438311](https://freesound.org/sounds/438311/) |
| ram | `ram.mp3` | ? ? | 2.751 | -6.5 | -21.4 | [675970](https://freesound.org/sounds/675970/) |
| horn | `horn.mp3` | 0.957 real or pro-produced | 4.328 | -10.0 | -23.4 | [539956](https://freesound.org/sounds/539956/) |
| roar | `roar.mp3` | ? ? | 6.800 | -12.0 | -25.4 | [563011](https://freesound.org/sounds/563011/) |
| dig | `dig.mp3` | 0.994 real or pro-produced | 0.715 | -9.8 | -31.1 | [651293](https://freesound.org/sounds/651293/) |
| dig | `dig-2.mp3` | 0.99 real or pro-produced | 0.369 | -9.8 | -29.0 | [651292](https://freesound.org/sounds/651292/) |
| thunder | `thunder.mp3` | ? ? | 7.685 | -14.0 | -27.5 | [474162](https://freesound.org/sounds/474162/) |
| thunder | `thunder-2.mp3` | ? ? | 7.206 | -14.0 | -36.0 | [581125](https://freesound.org/sounds/581125/) |

## Bed calibration (manifest gains, build ab)

`gain` = bed loudness at cue value 1.0; `default` = fraction it opens at when sound
turns on. Master 0.35 (−9.1 dB). Verified end-to-end in a headless browser:

- http mode (all seven model pages): booted, 5 beds, 9 one-shot cues with their
  variant counts (clash 3, whoosh 2, arrow 3, thud 2, horn 1, ram 1, roar 1, dig 2,
  thunder 2), 8-step phase sweep, zero console errors.
- file:// mode (Badr, Khandaq): the fetch path is blocked on file:// pages, so the
  manifest loads through a generated `manifest.js` script tag and every file loads
  through media elements routed into the same graph; beds start, one-shots fire
  (`active ≥ 1`), zero page errors.

| bed | gain | default | use |
| --- | --- | --- | --- |
| wind | 0.9 | 1.0 | always on, the field's base |
| crowd | 4.0 | 0.0 | the cue tables' `rumble` values |
| rain | 1.6 | 0.0 | Khandaq storm |
| storm | 2.0 | 0.0 | low rumble under Khandaq storm |
| fire | 2.2 | 0.0 | Khaybar reckoning, Ḥunayn spoils |

Master 0.5 (−6 dB). A 12 s simulated Badr wells/sand mix (wind + crowd at
`rumble` 0.42 + clash/arrows/whoosh at their tick rates through the same
chain) measures **−29.7 LUFS integrated, −10.1 dBTP, LRA 10.8** — present on
a phone speaker with clean headroom. The first calibration (master 0.35,
crowd 2.6) measured ≈ −45 LUFS and was replaced.

A stored pre-ab sound choice (the old synth days' "off") is cleared once
(`-sound-reset-ab` marker), so the first play press turns sound on.

## Check by ear (the five moments the numbers cannot settle)

1. Badr · the wells — the clash density against the crowd swell (is the melee too busy?).
2. Badr · the sand — the `thud` at phase entry (is a body-fall the right accent there?).
3. Khandaq · the storm — `storm` bed + rain + thunder together (the storm bed is a
   "Montana Summer Evening" recording; crickets may read through).
4. Khaybar · the first forts — the ram against the arrow volleys.
5. Any page · sound on while paused — the wind alone (too present, or right?).
