/* Makkah · the page descriptor. Copy, sound cues and the build tag for the shell. */
window.BATTLE_PAGE = {
  key: 'makkah',
  build: 'build ab · Makkah on the shared engine',
  speeds: [0.5, 1, 1.5, 2],
  copy: {
    en: {
      play: 'play', pause: 'pause', replay: 'replay',
      soundOn: 'sound on', soundOff: 'sound off', lang: 'اردو', home: 'atlas',
      brand: 'makkah <em>· the opening</em>',
      legendM: '<b>the Muslims</b> · about 10,000',
      legendQ: '<b>Makkah</b> · the city and the Ḥaram',
      hint: 'drag to look around · scroll to zoom',
      phases: ['the city', 'the broken truce', 'the camp', 'the entry', 'al-Khandamah', 'the House', 'the call', 'the road']
    },
    ur: {
      play: 'چلائیں', pause: 'وقفہ', replay: 'دوبارہ',
      soundOn: 'آواز آن', soundOff: 'آواز آف', lang: 'EN', home: 'اطلس',
      brand: 'مکہ <em>· فتح مکہ</em>',
      legendM: '<b>مسلمان</b> · تقریباً ۱۰٬۰۰۰',
      legendQ: '<b>مکہ</b> · شہر اور حرم',
      hint: 'دیکھنے کے لیے گھمائیں · زوم کے لیے اسکرول یا دو انگلیوں کا اشارہ',
      phases: ['شہر', 'عہد کا ٹوٹنا', 'کیمپ', 'داخلہ', 'خندمہ', 'کعبہ', 'پکار', 'راستہ']
    }
  },
  /* the city, the broken truce, the camp, the entry, al-Khandamah, the House, the call, the road */
  cue: [
    { rumble: 0 },
    { rumble: 0.10, time: 1.2, bed: { wind: 0.5 } },
    { rumble: 0.20, time: 1.0, bed: { fire: 0.5, wind: 0.4 } },
    { rumble: 0.26, time: 1.0, bed: { wind: 0.5 } },
    { rumble: 0.34, time: 0.6, crack: true },
    { rumble: 0.12, time: 1.3, bed: { wind: 0.4 } },
    { rumble: 0.10, time: 1.3, bed: { wind: 0.3 } },
    { rumble: 0.06, time: 1.5, bed: { wind: 0.5 } }
  ],
  audio: {
    tick: function (c) {
      var i = c.info.i, t = c.info.t;
      /* the only clash in the model: al-Khandamah, brief and at the lane */
      if (i === 4 && t > 0.14 && t < 0.62) {
        if (performance.now() - (c.B._clashT || 0) > 520 + Math.random() * 620) {
          c.S.play('clash'); c.B._clashT = performance.now();
        }
      }
    }
  }
};
