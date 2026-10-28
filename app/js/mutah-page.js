/* Muʿtah · the page descriptor. Copy, sound cues and the build tag for the shell. */
window.BATTLE_PAGE = {
  key: 'mutah',
  build: 'build y · Muʿtah on the shared engine',
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
    { rumble: 0.12, time: 1.2 },
    { rumble: 0.24, time: 0.9 },
    { rumble: 0.32, time: 0.7 },
    { rumble: 0.38, time: 0.5, crack: true },
    { rumble: 0.18, time: 1.3 },
    { rumble: 0.08, time: 1.5 }
  ],
  audio: {
    tick: function (c) {
      var i = c.info.i;
      if (i === 3 && c.info.t > 0.16 && c.info.t < 0.9) {
        if (performance.now() - (c.B._clashT || 0) > 480 + Math.random() * 520) {
          c.S.melee(); c.B._clashT = performance.now();
        }
      }
      if (i === 4 && c.info.t > 0.2 && c.info.t < 0.7) {
        if (performance.now() - (c.B._swordT || 0) > 420 + Math.random() * 480) {
          c.S.melee(); c.B._swordT = performance.now();
        }
      }
      if (i === 5 && c.info.t > 0.05 && c.info.t < 0.4) {
        if (performance.now() - (c.B._volleyT || 0) > 900 + Math.random() * 700) {
          c.S.volley(); c.B._volleyT = performance.now();
        }
      }
    }
  }
};
