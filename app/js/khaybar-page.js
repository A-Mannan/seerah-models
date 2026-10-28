/* Khaybar · the page descriptor. Copy, sound cues and the build tag for the shell. */
window.BATTLE_PAGE = {
  key: 'khaybar',
  build: 'build ab · Khaybar on the shared engine',
  speeds: [0.5, 1, 1.5, 2],
  copy: {
    en: {
      play: 'play', pause: 'pause', replay: 'replay',
      lang: 'اردو',
      brand: 'khaybar <em>· the battle</em>',
      legendM: '<b>Muslims</b><span class="legend-detail"> · about 1,400</span>',
      legendQ: '<b>the forts</b><span class="legend-detail"> · the oasis</span>',
      hint: 'drag to look · scroll or pinch to zoom',
      phases: ['the ground', 'the night march', 'the first forts', 'al-Qamūṣ', 'the standard · the duel', 'the reckoning']
    },
    ur: {
      play: 'چلائیں', pause: 'وقفہ', replay: 'دوبارہ',
      lang: 'EN',
      brand: 'خیبر <em>· معرکۂ خیبر</em>',
      legendM: '<b>مسلمان</b><span class="legend-detail"> · تقریباً ۱۴۰۰</span>',
      legendQ: '<b>قلعے</b><span class="legend-detail"> · واحہ</span>',
      hint: 'دیکھنے کے لیے گھمائیں · زوم کے لیے اسکرول یا دو انگلیوں کا اشارہ',
      phases: ['زمین', 'رات کا کوچ', 'پہلے قلعے', 'القموص', 'پرچم · مبارزت', 'حساب']
    }
  },
  /* the dark ground, the night march, the first forts, the siege, the duel, the quiet */
  cue: [
    { rumble: 0 },
    { rumble: 0.08, time: 1.2, bed: { wind: 0.6 } },
    { rumble: 0.30, time: 0.8 },
    { rumble: 0.22, time: 0.9 },
    { rumble: 0.34, time: 0.5, crack: true },
    { rumble: 0.10, time: 1.4, bed: { wind: 0.45, fire: 0.5 } }
  ],
  audio: {
    tick: function (c) {
      var i = c.info.i, t = c.info.t;
      /* the first forts — arrows over the walls, the ram at the gate */
      if (i === 2 && t > 0.16 && t < 0.9) {
        if (performance.now() - (c.B._volleyT || 0) > 620 + Math.random() * 700) {
          c.S.play('arrow'); c.B._volleyT = performance.now();
        }
        if (t > 0.3 && performance.now() - (c.B._ramT || 0) > 1100 + Math.random() * 700) {
          c.S.play('ram'); c.B._ramT = performance.now();
        }
      }
      /* the standard · the duel */
      if (i === 4 && t > 0.42 && t < 0.78) {
        if (performance.now() - (c.B._clangT || 0) > 380 + Math.random() * 460) {
          c.S.play('clash'); c.B._clangT = performance.now();
        }
      }
    }
  }
};
