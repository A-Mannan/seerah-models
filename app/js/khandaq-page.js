/* Khandaq · the page descriptor. Copy, sound cues and the build tag for the shell. */
window.BATTLE_PAGE = {
  key: 'khandaq',
  build: 'build y · Khandaq on the shared engine',
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
    { rumble: 0 }, { rumble: 0.10, time: 0.8 }, { rumble: 0.20, time: 0.8 },
    { rumble: 0.34, time: 0.5, crack: true }, { rumble: 0.22, time: 0.9 },
    { rumble: 0.36, time: 0.6, crack: true }, { rumble: 0, time: 1.6 }
  ],
  audio: {
    tick: function (c) {
      var i = c.info.i;
      if ((i === 2 || i === 3) && c.info.t < 0.55) {
        if (performance.now() - (c.B._volleyT || 0) > 520 + Math.random() * 640) {
          c.S.volley(); c.B._volleyT = performance.now();
        }
      }
      if (i === 3 && c.info.t > 0.32 && c.info.t < 0.78) {
        if (performance.now() - (c.B._clangT || 0) > 340 + Math.random() * 480) {
          c.S.melee(); c.B._clangT = performance.now();
        }
      }
    }
  }
};
