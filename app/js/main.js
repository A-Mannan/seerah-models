/* Badr · the battle in 3D — clock, cameras, sound. The model speaks for itself. */
(function () {
  'use strict';

  var B = window.BATTLE;
  if (!B) return;
  function $(s) { return document.querySelector(s); }
  var el = function (tag, cls, txt) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (txt !== undefined) d.textContent = txt;
    return d;
  };

  var playBtn = $('#playBtn');
  var resetBtn = $('#resetBtn');
  var speedBtn = $('#speedBtn');
  var timeline = $('#timeline');
  var scrubHead = $('#scrubHead');
  var segsEl = $('#segs');
  var deckCount = $('#deckCount');
  var camBtns = Array.prototype.slice.call(document.querySelectorAll('.cam'));
  var langBtn = $('#langBtn');
  var nameEls = [];

  /* ------------------------------ language */
  var TEXT = {
    en: {
      play: 'play', pause: 'pause', replay: 'replay',
      soundOn: 'sound on', soundOff: 'sound off', lang: 'اردو',
      brand: 'badr <em>· the battle</em>',
      legendM: '<b>Muslims</b> · about 313, lightly equipped',
      legendQ: '<b>Quraysh</b> · about 1,000, fully equipped',
      cams: { ground: 'the ground', aerial: 'aerial · map', duel: 'the duel', line: 'our line', far: 'their line', wells: 'the wells' },
      explore: 'free orbit',
      hint: 'drag to look around · scroll to zoom',
      phases: ['the ground', '3 v 3', 'the advance', 'the wells', 'the sand', 'the rout', 'the reckoning']
    },    ur: {
      play: 'چلائیں', pause: 'وقفہ', replay: 'دوبارہ',
      soundOn: 'آواز آن', soundOff: 'آواز آف', lang: 'EN',
      brand: 'بدر <em>میدانِ بدر</em>',
      legendM: '<b>مسلمان</b> · تقریباً ۳۱۳، ہلکے اسلحے سے',
      legendQ: '<b>قریش</b> · تقریباً ۱،۰۰۰، مکمل اسلحے سے',
      cams: { ground: 'زمین', aerial: 'فضائی نقشہ', duel: 'مقابلہ', line: 'ہماری صف', far: 'ان کی صف', wells: 'کنویں' },
      explore: 'آزاد گردش',
      hint: 'گھُمايو دیکھنے کے لیے · زوم کے لیے اسکرول',
      phases: ['زمین', 'تین بمقابلہ تین', 'پیش قدمی', 'کنویں', 'ریت', 'شکست', 'حساب']
    }
  };
  var lang = 'en';
  try { lang = window.localStorage.getItem('badr-lang') === 'ur' ? 'ur' : 'en'; } catch (e) { lang = 'en'; }
  function T() { return TEXT[lang]; }
  var UR_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function urNum(n) {
    return String(n).split('').map(function (d) { return UR_DIGITS[+d] || d; }).join('');
  }
  function applyLang() {
    var t = T();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.body.classList.toggle('is-ur', lang === 'ur');
    langBtn.textContent = t.lang;
    langBtn.setAttribute('aria-pressed', lang === 'ur' ? 'true' : 'false');
    soundBtn.textContent = soundOn ? t.soundOn : t.soundOff;
    playBtn.querySelector('.txt').textContent = B.isPlaying() ? t.pause : (B.frac() >= 1 ? t.replay : t.play);
    camBtns.forEach(function (b) { b.textContent = t.cams[b.dataset.cam] || b.textContent; });
    document.querySelectorAll('[data-i18n]').forEach(function (n) { n.innerHTML = t[n.dataset.i18n]; });
    nameEls.forEach(function (n, i) { n.textContent = t.phases[i]; });
    if (B.setLang) B.setLang(lang);
    if (typeof setScrub === 'function') setScrub(B.frac());
    var hintEl = $('#hint');
    if (hintEl && B.isPlaying()) hintEl.classList.add('is-gone');
  }
  langBtn.addEventListener('click', function () {
    lang = lang === 'en' ? 'ur' : 'en';
    try { window.localStorage.setItem('badr-lang', lang); } catch (e) { /* private mode */ }
    applyLang();
  });

  /* ------------------------------ sound */
  var S = window.SOUND || { start: function () { return false; }, setOn: function () {}, cue: function () {}, melee: function () {}, volley: function () {}, isOn: function () { return false; } };
  var soundBtn = $('#soundBtn');
  var soundOn = false;
  try { soundOn = window.localStorage.getItem('badr-sound') === '1'; } catch (e) { soundOn = false; }
  function applySound() {
    soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    soundBtn.textContent = soundOn ? T().soundOn : T().soundOff;
    S.setOn(soundOn);
  }
  soundBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    try { window.localStorage.setItem('badr-sound', soundOn ? '1' : '0'); } catch (e) { /* private mode */ }
    if (soundOn) S.start();
    applySound();
  });

  /* ------------------------------ timeline segments */
  var segEls = B.phases.map(function (ph) {
    var s = el('button', 'seg');
    s.style.setProperty('--w', String(ph.dur));
    s.setAttribute('aria-label', ph.name);
    var nm = el('span', 'name', ph.name);
    s.appendChild(nm);
    nameEls.push(nm);
    s.addEventListener('click', function () {
      var acc = 0;
      for (var k = 0; k < B.phases.length; k++) {
        if (B.phases[k].id === ph.id) break;
        acc += B.phases[k].dur;
      }
      B.seek(acc / B.total + 0.001);
    });
    segsEl.appendChild(s);
    return s;
  });

  var SPEEDS = [0.5, 1, 1.5, 2];
  var speedIdx = 1;
  function speedLabel() {
    var x = SPEEDS[speedIdx];
    speedBtn.textContent = (x === Math.floor(x) ? x : x.toFixed(1)) + '×';
    B.setSpeed(x);
  }
  speedBtn.addEventListener('click', function () {
    speedIdx = (speedIdx + 1) % SPEEDS.length;
    speedLabel();
  });

  function setPlayState(playing) {
    playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    playBtn.querySelector('.glyph').textContent = playing ? '||' : '▶';
    playBtn.querySelector('.txt').textContent = playing ? T().pause : (B.frac() >= 1 ? T().replay : T().play);
    canvasEl.classList.toggle('is-playing', playing);
    var hintEl = $('#hint');
    if (hintEl && (playing || dismissed)) hintEl.classList.add('is-gone');
  }
  var canvasEl = document.getElementById('gl');
  var dismissed = false;
  function dismissHint() { dismissed = true; var h = $('#hint'); if (h) h.classList.add('is-gone'); }
  canvasEl.addEventListener('pointerdown', dismissHint, { once: true });
  canvasEl.addEventListener('wheel', dismissHint, { once: true, passive: true });
  function togglePlay() {
    if (B.isPlaying()) { B.pause(); setPlayState(false); return; }
    if (B.frac() >= 1) B.seek(0);
    B.play();
    setPlayState(true);
    if (soundOn) S.start();
  }
  /* touch fires pointerup then a synthesized click: dedupe so play never double-toggles */
  var lastPlayTap = 0;
  function requestToggle() {
    var t = Date.now();
    if (t - lastPlayTap < 900) return; /* a slow phone can deliver the synthesized click late */
    lastPlayTap = t;
    togglePlay();
  }
  playBtn.addEventListener('pointerup', function (e) {
    if (e.isPrimary === false) return;
    if (e.button !== undefined && e.button !== 0) return;
    if (e.pointerType) requestToggle();
  });
  /* keyboard / assistive activation arrives as a click with no pointerType */
  playBtn.addEventListener('click', function (e) {
    if (!e.pointerType) requestToggle();
  });
  resetBtn.addEventListener('click', function () { B.seek(0); B.play(); setPlayState(true); });

  /* ------------------------------ scrub */
  var scrubbing = false;
  /* the rail runs with the reading direction: in Urdu 0 is the right edge */
  function setScrub(frac) {
    scrubHead.style.left = ((lang === 'ur' ? 1 - frac : frac) * 100).toFixed(2) + '%';
  }
  function fracFromEvent(e) {
    var r = timeline.getBoundingClientRect();
    var f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    return lang === 'ur' ? 1 - f : f;
  }
  timeline.addEventListener('pointerdown', function (e) {
    scrubbing = true;
    timeline.setPointerCapture(e.pointerId);
    if (B.isPlaying()) { B.pause(); setPlayState(false); }
    B.seek(fracFromEvent(e));
  });
  timeline.addEventListener('pointermove', function (e) {
    if (scrubbing) B.seek(fracFromEvent(e));
  });
  ['pointerup', 'pointercancel'].forEach(function (ev) {
    timeline.addEventListener(ev, function () { scrubbing = false; });
  });

  /* ------------------------------ cameras */
  camBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      camBtns.forEach(function (b) { b.classList.remove('is-on'); });
      btn.classList.add('is-on');
      B.cam(btn.dataset.cam);
    });
  });

  /* ------------------------------ keyboard */
  document.addEventListener('keydown', function (e) {
    if (e.target && /BODY/.test(e.target.tagName)) {
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      var back = lang === 'ur' ? 'ArrowRight' : 'ArrowLeft';
      var fwd = lang === 'ur' ? 'ArrowLeft' : 'ArrowRight';
      if (e.code === fwd) B.seek(Math.min(1, B.frac() + 0.02));
      if (e.code === back) B.seek(Math.max(0, B.frac() - 0.02));
    }
  });

  /* ------------------------------ tick */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastPhase = -1;
  var clangT = 0, volleyT = 0;
  B.onTick(function (frac, info) {
    setScrub(frac);
    deckCount.textContent = lang === 'ur'
      ? urNum(info.i + 1) + ' / ' + urNum(B.phases.length)
      : ('0' + (info.i + 1)).slice(-2) + ' / 0' + B.phases.length;
    segEls.forEach(function (s, k) {
      s.classList.toggle('is-today', k === info.i);
      s.classList.toggle('is-past', k < info.i);
    });
    if (info.i !== lastPhase) { lastPhase = info.i; S.cue(info.i); }
    /* the fight: random sword clangs and arrow volleys */
    if (B.isPlaying() && !reduce) {
      if (info.i === 3 && info.t < 0.9) {
        if (performance.now() - clangT > 240 + Math.random() * 500) { S.melee(); clangT = performance.now(); }
      }
      if ((info.i === 2 && info.t > 0.4) || (info.i === 3 && info.t < 0.9)) {
        if (performance.now() - volleyT > 380 + Math.random() * 700) { S.volley(); volleyT = performance.now(); }
      }
    }
    if (!B.isPlaying()) setPlayState(false);
  });

  /* ------------------------------ boot */
  console.log('[badr] build 2026-10-23n · event markers + angels + Ansar trio');
  setPlayState(false);
  setScrub(B.frac());
  segEls[0].classList.add('is-today');
  speedLabel();
  applySound();
  applyLang();
})();
