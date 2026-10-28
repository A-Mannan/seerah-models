# Audio credits

Every file under `app/assets/audio/` is a real recording, not a synthesis.
Sources are Freesound uploads under **CC0 1.0** (public domain); each candidate's
license page was verified before download, and `earshot realness` scored every
shipped file (report in `openspec/changes/battle-real-audio/`).

| Cue | Recording | Author | License |
| --- | --- | --- | --- |
| `arrow` | [Longbow Release 2.wav](https://freesound.org/sounds/394179/) | saturdaysoundguy | CC0 1.0 |
| `arrow` | [Bow Release Hit](https://freesound.org/sounds/536068/) | EminYILDIRIM | CC0 1.0 |
| `arrow` | [Whoosh Bamboo 1](https://freesound.org/sounds/706676/) | Sadiquecat | CC0 1.0 |
| `clash` | [Swords Clash - High Quality #3](https://freesound.org/sounds/364531/) | Christopherderp | CC0 1.0 |
| `clash` | [Sword block combo.wav](https://freesound.org/sounds/440069/) | ethanchase7744 | CC0 1.0 |
| `clash` | [Sword_Clash (7).wav](https://freesound.org/sounds/326868/) | JohnBuhr | CC0 1.0 |
| `crowd` (bed) | [Crowd Murmuring](https://freesound.org/sounds/444900/) | DigestContent | CC0 1.0 |
| `dig` | [Digging in wet course sand (2)](https://freesound.org/sounds/651293/) | f3bbbo | CC0 1.0 |
| `dig` | [Digging in wet course sand (1)](https://freesound.org/sounds/651292/) | f3bbbo | CC0 1.0 |
| `fire` (bed) | [Campfire deer camp — adding kindling — med wind — part 4](https://freesound.org/sounds/660298/) | Ambient-X | CC0 1.0 |
| `horn` | [war horn.wav](https://freesound.org/sounds/539956/) | adharca | CC0 1.0 |
| `rain` (bed) | [rainfall](https://freesound.org/sounds/323427/) | seth-m | CC0 1.0 |
| `ram` | [S10-24 Battering ram hits castle door; big wooden hit](https://freesound.org/sounds/675970/) | craigsmith | CC0 1.0 |
| `roar` | [People screaming in agony when charging into battle](https://freesound.org/sounds/563011/) | florianreichelt | CC0 1.0 |
| `storm` (bed) | [Montana Summer Evening (light rain, crickets, thunder, distant crowd)](https://freesound.org/sounds/867938/) | i_o_i | CC0 1.0 |
| `thud` | [BODY FALL — V HVY — DIRT](https://freesound.org/sounds/504626/) | leonelmail | CC0 1.0 |
| `thud` | [G24-11 Single Body Fall on Wood](https://freesound.org/sounds/438311/) | craigsmith | CC0 1.0 |
| `thunder` | [Big Thunder And Distant Thunder, Rain, Birds](https://freesound.org/sounds/474162/) | morvei01 | CC0 1.0 |
| `thunder` | [Distant Thunder 4](https://freesound.org/sounds/581125/) | Fission9 | CC0 1.0 |
| `whoosh` | [Clean fast Swoosh](https://freesound.org/sounds/507466/) | Danjocross | CC0 1.0 |
| `whoosh` | [quick woosh](https://freesound.org/sounds/683101/) | florianreichelt | CC0 1.0 |
| `wind` (bed) | [Looping Gentle Wind Ambience on an Open Desert Plain](https://freesound.org/sounds/697217/) | dhallcomposer | CC0 1.0 |

Processing: onset-trimmed, mono-summed (antiphase stereo guarded), peak-normalized
to role targets after encode (hit −4 dBFS, whoosh −9, arrow −8, thud −5, ram −6,
horn −10, roar −12, dig −10, thunder −14; beds −14 peak, level set by the
manifest gains), beds loop with 25 ms seam fades. Long multi-event recordings
(ram, roar, thunder) were cut to the loudest single event by measured RMS.
