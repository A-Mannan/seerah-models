/* Uhud · the page descriptor. Copy, sound cues and the build tag for the shell. */
window.BATTLE_PAGE = {
  key: 'uhud',
  build: 'build z · Uhud on the shared engine',
  speeds: [0.5, 1, 1.5, 2],
  copy: {
    en: {
      play: 'play', pause: 'pause', replay: 'replay',
      lang: 'اردو',
      brand: 'uhud <em>· the battle</em>',
      legendM: '<b>Muslims</b><span class="legend-detail"> · three battalions</span>',
      legendQ: '<b>Quraysh</b><span class="legend-detail"> · horse and foot</span>',
      hint: 'drag to look · scroll or pinch to zoom',
      phases: ['the ground', 'the archers’ hill', 'the charge', 'the spoils', 'the flank', 'the turn', 'the reckoning']
    },
    ur: {
      play: 'چلائیں', pause: 'وقفہ', replay: 'دوبارہ',
      lang: 'EN',
      brand: 'اُحد <em>· معرکۂ اُحد</em>',
      legendM: '<b>مسلمان</b><span class="legend-detail"> · تین دستے</span>',
      legendQ: '<b>قریش</b><span class="legend-detail"> · سوار اور پیادہ</span>',
      hint: 'دیکھنے کے لیے گھمائیں · زوم کے لیے اسکرول یا دو انگلیوں کا اشارہ',
      phases: ['زمین', 'تیر اندازوں کی پہاڑی', 'حملہ', 'مالِ غنیمت', 'پہلو سے حملہ', 'پلٹ کر وار', 'حساب']
    }
  },
  /* the hill holds, the volleys start, the horse comes round, the field goes quiet */
  cue: [
    { rumble: 0 }, { rumble: 0.06, time: 0.7 }, { rumble: 0.24, time: 0.8 },
    { rumble: 0.1, time: 0.7 }, { rumble: 0.4, time: 0.4, crack: true },
    { rumble: 0.28, time: 0.8 }, { rumble: 0, time: 1.4 }
  ],
  audio: {
    tick: function (c) {
      var i = c.info.i;
      if (i === 2 || i === 3) {
        if (performance.now() - (c.B._volleyT || 0) > 520 + Math.random() * 600) {
          c.S.volley(); c.B._volleyT = performance.now();
        }
      }
      if (i === 4 && c.info.t > 0.4 && c.info.t < 0.9) {
        if (performance.now() - (c.B._clangT || 0) > 300 + Math.random() * 500) {
          c.S.melee(); c.B._clangT = performance.now();
        }
      }
    }
  }
};
