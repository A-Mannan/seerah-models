/* Khaybar · the page descriptor. Copy, sound cues and the build tag for the shell. */
window.BATTLE_PAGE = {
  key: 'khaybar',
  build: 'build x · Khaybar on the shared engine',
  speeds: [0.5, 1, 1.5, 2],
  copy: {
    en: {
      play: 'play', pause: 'pause', replay: 'replay',
      soundOn: 'sound on', soundOff: 'sound off', lang: 'اردو', home: 'atlas',
      brand: 'khaybar <em>· the battle</em>',
      legendM: '<b>Muslims</b> · about 1,400',
      legendQ: '<b>the forts</b> · the oasis',
      hint: 'drag to look around · scroll to zoom',
      phases: ['the ground', 'the night march', 'the first forts', 'al-Qamūṣ', 'the standard · the duel', 'the reckoning']
    },
    ur: {
      play: 'چلائیں', pause: 'وقفہ', replay: 'دوبارہ',
      soundOn: 'آواز آن', soundOff: 'آواز آف', lang: 'EN', home: 'اطلس',
      brand: 'خیبر <em>میدانِ خیبر</em>',
      legendM: '<b>مسلمان</b> · تقریباً ۱۴۰۰',
      legendQ: '<b>قلعے</b> · واحہ',
      hint: 'گھُمايو دیکھنے کے لیے · زوم کے لیے اسکرول',
      phases: ['زمین', 'رات کا سفر', 'پہلے قلعے', 'القموص', 'پرچم · مقابلہ', 'حساب']
    }
  },
  /* the dark ground, the night march, the first forts, the siege, the duel, the quiet */
  cue: [
    { rumble: 0 },
    { rumble: 0.12, time: 1.2 },
    { rumble: 0.30, time: 0.8 },
    { rumble: 0.22, time: 0.9 },
    { rumble: 0.34, time: 0.5, crack: true },
    { rumble: 0.10, time: 1.4 }
  ],
  audio: {
    tick: function (c) {
      var i = c.info.i;
      if (i === 2 && c.info.t > 0.16 && c.info.t < 0.9) {
        if (performance.now() - (c.B._volleyT || 0) > 620 + Math.random() * 700) {
          c.S.volley(); c.B._volleyT = performance.now();
        }
        if (c.info.t > 0.3 && performance.now() - (c.B._ramT || 0) > 900 + Math.random() * 600) {
          c.S.melee(); c.B._ramT = performance.now();
        }
      }
      if (i === 4 && c.info.t > 0.42 && c.info.t < 0.78) {
        if (performance.now() - (c.B._clangT || 0) > 380 + Math.random() * 460) {
          c.S.melee(); c.B._clangT = performance.now();
        }
      }
    }
  }
};
