/* Badr · the page descriptor. Copy, sound cues and the build tag for the shell. */
window.BATTLE_PAGE = {
  key: 'badr',
  build: 'build x · Badr on the shared engine',
  speeds: [0.5, 1, 1.5, 2],
  copy: {
    en: {
      play: 'play', pause: 'pause', replay: 'replay',
      soundOn: 'sound on', soundOff: 'sound off', lang: 'اردو', home: 'atlas',
      brand: 'badr <em>· the battle</em>',
      legendM: '<b>Muslims</b> · lightly equipped',
      legendQ: '<b>Quraysh</b> · fully equipped',
      hint: 'drag to look around · scroll to zoom',
      phases: ['the ground', '3 v 3', 'the advance', 'the wells', 'the sand', 'the rout', 'the reckoning']
    },
    ur: {
      play: 'چلائیں', pause: 'وقفہ', replay: 'دوبارہ',
      soundOn: 'آواز آن', soundOff: 'آواز آف', lang: 'EN', home: 'سلسلہ',
      brand: 'بدر <em>میدانِ بدر</em>',
      legendM: '<b>مسلمان</b> · ہلکے اسلحے سے',
      legendQ: '<b>قریش</b> · مکمل اسلحے سے',
      hint: 'گھُمايو دیکھنے کے لیے · زوم کے لیے اسکرول',
      phases: ['زمین', 'تین بمقابلہ تین', 'پیش قدمی', 'کنویں', 'ریت', 'شکست', 'حساب']
    }
  },
  /* the clash swells, the gravel cast cracks, the rout fades */
  cue: [
    { rumble: 0 }, { rumble: 0 }, { rumble: 0 }, { rumble: 0.26, time: 0.9 },
    { rumble: 0.36, time: 0.5, crack: true }, { rumble: 0.2, time: 0.9 }, { rumble: 0, time: 1.1 }
  ],
  audio: {
    tick: function (c) {
      var i = c.info.i;
      if (c.info.t !== undefined && i === 3 && c.info.t < 0.9) {
        if (performance.now() - (c.B._clangT || 0) > 240 + Math.random() * 500) { c.S.melee(); c.B._clangT = performance.now(); }
      }
      if ((i === 2 && c.info.t > 0.4) || (i === 3 && c.info.t < 0.9)) {
        if (performance.now() - (c.B._volleyT || 0) > 380 + Math.random() * 700) { c.S.volley(); c.B._volleyT = performance.now(); }
      }
    }
  }
};
