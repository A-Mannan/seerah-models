/* Ḥunayn · the page descriptor. Copy, sound cues and the build tag for the shell. */
window.BATTLE_PAGE = {
  key: 'hunayn',
  build: 'build ac · Ḥunayn on the shared engine',
  speeds: [0.5, 1, 1.5, 2],
  copy: {
    en: {
      play: 'play', pause: 'pause', replay: 'replay',
      soundOn: 'sound on', soundOff: 'sound off', lang: 'اردو', home: 'atlas',
      brand: 'ḥunayn <em>· the battle</em>',
      legendM: '<b>the Muslims</b> · the sirah counts about 12,000',
      legendQ: '<b>the Hawāzin and Thaqīf</b> · hidden in the valley',
      hint: 'drag to look around · scroll to zoom',
      phases: ['the valley', 'the night march', 'the ambush', 'the call', 'the break', 'Ṭāʾif', 'the spoils', 'the return']
    },
    ur: {
      play: 'چلائیں', pause: 'وقفہ', replay: 'دوبارہ',
      soundOn: 'آواز آن', soundOff: 'آواز آف', lang: 'EN', home: 'اطلس',
      brand: 'حنین <em>· معرکۂ حنین</em>',
      legendM: '<b>مسلمان</b> · سیرت میں تقریباً ۱۲٬۰۰۰',
      legendQ: '<b>ہوازن اور ثقیف</b> · وادی میں چھپے ہوئے',
      hint: 'دیکھنے کے لیے گھمائیں · زوم کے لیے اسکرول یا دو انگلیوں کا اشارہ',
      phases: ['وادی', 'رات کا کوچ', 'گھات', 'پکار', 'شکست', 'طائف', 'مالِ غنیمت', 'واپسی']
    }
  },
  /* the valley, the march, the ambush, the call, the break, Ṭāʾif, the spoils, the return */
  cue: [
    { rumble: 0 },
    { rumble: 0.10, time: 1.3, bed: { wind: 0.6 } },
    { rumble: 0.26, time: 0.8, sfx: 'roar' },
    { rumble: 0.38, time: 0.5, crack: true },
    { rumble: 0.30, time: 0.7, sfx: 'horn' },
    { rumble: 0.20, time: 1.0 },
    { rumble: 0.10, time: 1.2, bed: { fire: 0.45 } },
    { rumble: 0.06, time: 1.5, bed: { fire: 0, wind: 0.5 } }
  ],
  audio: {
    tick: function (c) {
      var i = c.info.i, t = c.info.t;
      /* the ambush from the heights */
      if (i === 2 && t > 0.02 && t < 0.52) {
        if (performance.now() - (c.B._volleyT || 0) > 640 + Math.random() * 800) {
          c.S.play('arrow'); c.B._volleyT = performance.now();
        }
      }
      /* the call — the horn and the fight */
      if (i === 3 && t > 0.12 && t < 0.62) {
        if (performance.now() - (c.B._callT || 0) > 2400 + Math.random() * 1800) {
          c.S.play('horn'); c.B._callT = performance.now();
        }
      }
      if (i === 3 && t > 0.16 && t < 0.92) {
        if (performance.now() - (c.B._clashT || 0) > 480 + Math.random() * 560) {
          c.S.play('clash'); c.B._clashT = performance.now();
        }
      }
      /* the break and the pursuit */
      if (i === 4 && t > 0.08 && t < 0.7) {
        if (performance.now() - (c.B._pursuitT || 0) > 700 + Math.random() * 700) {
          c.S.play('clash'); c.B._pursuitT = performance.now();
        }
      }
    }
  }
};
