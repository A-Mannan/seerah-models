/* Muʿtah · the page descriptor. Copy, sound cues and the build tag for the shell. */
window.BATTLE_PAGE = {
  key: 'mutah',
  build: 'build ae · Muʿtah on the shared engine',
  speeds: [0.5, 1, 1.5, 2],
  copy: {
    en: {
      play: 'play', pause: 'pause', replay: 'replay',
      soundOn: 'sound on', soundOff: 'sound off', lang: 'اردو', home: 'atlas',
      brand: 'muʿtah <em>· the battle</em>',
      legendM: '<b>the Muslims</b> · about 3,000',
      legendQ: '<b>the enemy host</b> · reports say 100,000–200,000',
      hint: 'drag to look around · scroll to zoom',
      phases: ['the ground', 'the march north', 'the field', 'the three standards', 'the nine swords', 'the withdrawal', 'the reckoning']
    },
    ur: {
      play: 'چلائیں', pause: 'وقفہ', replay: 'دوبارہ',
      soundOn: 'آواز آن', soundOff: 'آواز آف', lang: 'EN', home: 'اطلس',
      brand: 'مؤتہ <em>· معرکۂ مؤتہ</em>',
      legendM: '<b>مسلمان</b> · تقریباً ۳۰۰۰',
      legendQ: '<b>دشمن لشکر</b> · روایات کے مطابق ۱۰۰٬۰۰۰–۲۰۰٬۰۰۰',
      hint: 'دیکھنے کے لیے گھمائیں · زوم کے لیے اسکرول یا دو انگلیوں کا اشارہ',
      phases: ['زمین', 'شمال کا کوچ', 'میدان', 'تین پرچم', 'نو تلواریں', 'منظم پسپائی', 'حساب']
    }
  },
  /* the ground, the march, the field, the standards, the swords, the night, the quiet */
  cue: [
    { rumble: 0 },
    { rumble: 0.10, time: 1.2, bed: { wind: 0.6 } },
    { rumble: 0.24, time: 0.9 },
    { rumble: 0.32, time: 0.7 },
    { rumble: 0.38, time: 0.5, crack: true },
    { rumble: 0.14, time: 1.3, bed: { wind: 0.6 } },
    { rumble: 0.06, time: 1.5, bed: { wind: 0.5 } }
  ],
  audio: {
    tick: function (c) {
      var i = c.info.i, t = c.info.t;
      /* the three standards — a small line holding, sparse */
      if (i === 3 && t > 0.16 && t < 0.9) {
        if (performance.now() - (c.B._clashT || 0) > 520 + Math.random() * 640) {
          c.S.play('clash'); c.B._clashT = performance.now();
        }
      }
      /* the nine swords */
      if (i === 4 && t > 0.2 && t < 0.7) {
        if (performance.now() - (c.B._swordT || 0) > 420 + Math.random() * 560) {
          c.S.play('clash'); c.B._swordT = performance.now();
        }
      }
      /* covering shots in the withdrawal */
      if (i === 5 && t > 0.05 && t < 0.4) {
        if (performance.now() - (c.B._volleyT || 0) > 900 + Math.random() * 800) {
          c.S.play('arrow'); c.B._volleyT = performance.now();
        }
      }
    }
  }
};
