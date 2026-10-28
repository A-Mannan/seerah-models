/* Khandaq · the page descriptor. Copy, sound cues and the build tag for the shell. */
window.BATTLE_PAGE = {
  key: 'khandaq',
  build: 'build ae · Khandaq on the shared engine',
  speeds: [0.5, 1, 1.5, 2],
  copy: {
    en: {
      play: 'play', pause: 'pause', replay: 'replay',
      lang: 'اردو',
      brand: 'khandaq <em>· the battle</em>',
      legendM: '<b>Muslims</b><span class="legend-detail"> · about three thousand</span>',
      legendQ: '<b>Confederates</b><span class="legend-detail"> · about ten thousand</span>',
      hint: 'drag to look · scroll or pinch to zoom',
      phases: ['the ground', 'the trench', 'the siege', 'the crossing', 'the covenant', 'the storm', 'the reckoning']
    },
    ur: {
      play: 'چلائیں', pause: 'وقفہ', replay: 'دوبارہ',
      lang: 'EN',
      brand: 'خندق <em>· معرکۂ خندق</em>',
      legendM: '<b>مسلمان</b><span class="legend-detail"> · تقریباً تین ہزار</span>',
      legendQ: '<b>احزاب</b><span class="legend-detail"> · تقریباً دس ہزار</span>',
      hint: 'دیکھنے کے لیے گھمائیں · زوم کے لیے اسکرول یا دو انگلیوں کا اشارہ',
      phases: ['زمین', 'خندق', 'محاصرہ', 'عبور', 'عہد', 'طوفان', 'حساب']
    }
  },
  /* picks, struck earth, the volleys, the duel, the broken pact, the storm, the quiet */
  cue: [
    { rumble: 0 },
    { rumble: 0.10, time: 0.8, bed: { wind: 0.45 } },
    { rumble: 0.20, time: 0.8 },
    { rumble: 0.34, time: 0.5, crack: true },
    { rumble: 0.22, time: 0.9 },
    { rumble: 0.30, time: 0.6, bed: { rain: 0.9, wind: 0.7 } },
    { rumble: 0, time: 1.6, bed: { rain: 0, wind: 0.5 } }
  ],
  audio: {
    tick: function (c) {
      var i = c.info.i, t = c.info.t;
      /* the trench is cut — picks on the earth */
      if (i === 1) {
        if (performance.now() - (c.B._digT || 0) > 420 + Math.random() * 620) {
          c.S.play('dig'); c.B._digT = performance.now();
        }
      }
      /* skirmish fire across the ditch */
      if ((i === 2 || i === 3) && t < 0.55) {
        if (performance.now() - (c.B._volleyT || 0) > 520 + Math.random() * 640) {
          c.S.play('arrow'); c.B._volleyT = performance.now();
        }
      }
      /* ʿAmr's crossing duel */
      if (i === 3 && t > 0.32 && t < 0.78) {
        if (performance.now() - (c.B._clangT || 0) > 340 + Math.random() * 480) {
          c.S.play('clash'); c.B._clangT = performance.now();
        }
      }
      /* the storm — thunder rolls, sparse */
      if (i === 5) {
        if (performance.now() - (c.B._thundT || 0) > 5200 + Math.random() * 4200) {
          c.S.play('thunder'); c.B._thundT = performance.now();
        }
      }
    }
  }
};
