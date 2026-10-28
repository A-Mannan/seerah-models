/* Badr · the page descriptor. Copy, sound cues and the build tag for the shell. */
window.BATTLE_PAGE = {
  key: 'badr',
  build: 'build ab · Badr on the shared engine',
  speeds: [0.5, 1, 1.5, 2],
  copy: {
    en: {
      play: 'play', pause: 'pause', replay: 'replay',
      lang: 'اردو',
      brand: 'badr <em>· the battle</em>',
      legendM: '<b>Muslims</b><span class="legend-detail"> · lightly equipped</span>',
      legendQ: '<b>Quraysh</b><span class="legend-detail"> · fully equipped</span>',
      hint: 'drag to look · scroll or pinch to zoom',
      phases: ['the ground', '3 v 3', 'the advance', 'the wells', 'the sand', 'the rout', 'the reckoning']
    },
    ur: {
      play: 'چلائیں', pause: 'وقفہ', replay: 'دوبارہ',
      lang: 'EN',
      brand: 'بدر <em>· معرکۂ بدر</em>',
      legendM: '<b>مسلمان</b><span class="legend-detail"> · ہلکے اسلحے سے</span>',
      legendQ: '<b>قریش</b><span class="legend-detail"> · مکمل اسلحے سے</span>',
      hint: 'دیکھنے کے لیے گھمائیں · زوم کے لیے اسکرول یا دو انگلیوں کا اشارہ',
      phases: ['زمین', 'تین کے مقابل تین', 'پیش قدمی', 'کنویں', 'ریت', 'بھگدڑ', 'حساب']
    }
  },
  /* the duel opens, the wells swell, the sand crashes, the rout roars */
  cue: [
    { rumble: 0 },
    { rumble: 0.14, time: 1.1 },
    { rumble: 0.16, time: 1.2 },
    { rumble: 0.30, time: 0.9 },
    { rumble: 0.42, time: 0.5, crack: true },
    { rumble: 0.26, time: 0.9, sfx: 'roar' },
    { rumble: 0, time: 1.4 }
  ],
  audio: {
    tick: function (c) {
      var i = c.info.i, t = c.info.t;
      /* the 3 v 3 — six men, one pair at a time */
      if (i === 1 && t > 0.12 && t < 0.9) {
        if (performance.now() - (c.B._duelT || 0) > 650 + Math.random() * 900) { c.S.play('clash'); c.B._duelT = performance.now(); }
      }
      /* the wells — the lines meet */
      if (i === 3 && t < 0.9) {
        if (performance.now() - (c.B._clangT || 0) > 240 + Math.random() * 500) { c.S.play('clash'); c.B._clangT = performance.now(); }
      }
      /* the advance closes, the sand volley */
      if ((i === 2 && t > 0.4) || (i === 3 && t < 0.9) || (i === 4 && t < 0.5)) {
        if (performance.now() - (c.B._volleyT || 0) > 380 + Math.random() * 700) { c.S.play('arrow'); c.B._volleyT = performance.now(); }
      }
      /* blade swings in the sand beat */
      if (i === 4 && t > 0.25 && t < 0.85) {
        if (performance.now() - (c.B._whooshT || 0) > 480 + Math.random() * 800) { c.S.play('whoosh'); c.B._whooshT = performance.now(); }
      }
    }
  }
};
