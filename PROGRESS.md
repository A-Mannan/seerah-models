# Progress

## Build p — local, not pushed
Badr · the battle. Cache-bust `?v=20261023p`.

### Shipped
- **Abu Jahl command vignette** on a low sand plinth in the Quraysh centre-left gap: ʿAbdur-Raḥmān ibn ʿAwf pointing, Muʿādh and Muʿawwidh rushing, Ikrimah's cut, the severed arm / stepping leg / one-armed spear, Muʿawwidh's martyrdom, Abu Jahl's fall. Five faceless figures; no duplicate event standards.
- **Mass action figures:** 1,313 men with tunics, belts, feet and Quraysh helmets / Muslim turbans; the spear hedge is a separate instanced mesh that levels and thrusts in the clash.
- **Story cameras:** camera-preset chip row removed. Phase cameras carry ground → 3v3 → advance → wells → sand close-up → rout → reckoning; the reckoning opens on the near-bank counts and ends at al-Qalib.
- **Event gating:** named figures hidden before the advance; Bilāl/ʿUmayyah only from the rout; the Anṣār trio only in the duel; champion names only in the duel.
- **Mobile:** play button reads “play”; brand reads “badr · the battle”; 11px type floor; command beat and rout verified at 390×844.
- **Field fixes:** wells moved clear of the command lane; riderless vignette horse removed; spent arrows kept off the plinth; captives moved into the reckoning overview.

### Verification
- `node --check app/js/battle.js` / `main.js`: pass.
- Design-taste lint: **0 FAIL / 0 WARN**.
- Design-taste inspect: **0 FAIL / 2 WARN** at 1440 / 768 / 390. WARNs accepted: intentional mixed-face brand; dawn cream palette.
- Probes: `.taste-skill/probe-{desktop,mobile,checks,duel}.mjs`; stills in `.taste-skill/inspect/`.
- Performance: **158–243 draw calls**, **~661–675k triangles**; `benchMass(8)` **1.1–3.4 ms** desktop, **0.8–1.3 ms** at 390×844.
- Wells/rain: Muslims reached the wells first on al-Ḥubāb's advice, seized the nearest, built a basin and stopped the others; the Quraysh were denied water. The night rain refreshed/steadied the Muslims and held back the Quraysh; Qur'an 8:11 adds purification and firm feet; 8:42 places the two banks. See BADR-018/019, Raheeq p. 135.

### Known limits
- The 3v3 is carried by standards + labels; at some angles the champions still read as two banner-lines rather than six hero units.
- The plinth picks up long palm/well shadows as a chequer at close range.
- Fonts are still Google-hosted.
- The shared engine + per-battle data split is not started; Uhud and Khandaq remain blocked.

### Earlier builds
- **o** — aftermath counts, angel shimmer, persistent event labels.
- **n** — event layer, Anṣār trio, al-Qalib focus, camps and type.

### Next
- OpenSpec `badr-phase-2-finish`: 7.1 architecture direction (modular vanilla vs React UI shell) and 7.2 separate engine-split change are open.
- Build p is committed locally only; no push until owner approval.