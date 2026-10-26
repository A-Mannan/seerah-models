/* seerah-models · the battle shell.
   One UI for every battle page: play, timeline, scrub, speed, reset, language
   (English / Urdu, right-to-left), sound, the hint and the phase name. The page
   supplies window.BATTLE_PAGE; the battle module supplies window.BATTLE. Nothing
   here knows which battle it is on. */
(function () {
  'use strict';
  var page = window.BATTLE_PAGE || {};
  var B = window.BATTLE;
  var booted = false;

  function $(s) { return document.querySelector(s); }
  function el(tag, cls, txt) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (txt !== undefined) d.textContent = txt;
    return d;
  }

  var TEXT = {
    en: {
      play: 'play', pause: 'pause', replay: 'replay',
      soundOn: 'sound on', soundOff: 'sound off', lang: 'اردو', home: 'atlas',
      brand: 'badr <em>· the battle</em>',
      legendM: '<b>Muslims</b> · lightly equipped',
      legendQ: '<b>Quraysh</b> · fully equipped',
      hint: 'drag to look around · scroll to zoom',
      phases: []
    },
    ur: {
      play: 'چلائیں', pause: 'وقفہ', replay: 'دوبارہ',
      soundOn: 'آواز آن', soundOff: 'آواز آف', lang: 'EN', home: 'اطلس',
      brand: 'بدر <em>میدانِ بدر</em>',
      legendM: '<b>مسلمان</b> · ہلکے اسلحے سے',
      legendQ: '<b>قریش</b> · مکمل اسلحے سے',
      hint: 'گھُمايو دیکھنے کے لیے · زوم کے لیے اسکرول',
      phases: []
    }
  };
  var UR_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function urNum(n) {
    return String(n).split('').map(function (d) { return UR_DIGITS[+d] || d; }).join('');
  }

  function run() {
    if (booted) return;
    B = window.BATTLE;
    if (!B) return;
    booted = true;

    var copy = page.copy || {};
    function T() { return copy[lang] || TEXT[lang]; }
    var lang = 'en';
    var storeKey = (page.key || 'battle');
    try { lang = window.localStorage.getItem(storeKey + '-lang') === 'ur' ? 'ur' : 'en'; } catch (e) { lang = 'en'; }

    var playBtn = $('#playBtn');
    var resetBtn = $('#resetBtn');
    var speedBtn = $('#speedBtn');
    var timeline = $('#timeline');
    var scrubHead = $('#scrubHead');
    var segsEl = $('#segs');
    var deckCount = $('#deckCount');
    var deckPhase = $('#deckPhase');
    var langBtn = $('#langBtn');
    var soundBtn = $('#soundBtn');
    var canvasEl = document.getElementById('gl');
    var hintEl = $('#hint');
    var nameEls = [];
    var segEls = [];
    var dismissed = false;

    /* ------------------------------ timeline */
    (B.phases || []).forEach(function (ph, idx) {
      var s = el('button', 'seg');
      s.style.setProperty('--w', String(ph.dur));
      s.setAttribute('aria-label', ph.name);
      var nm = el('span', 'name', ph.name);
      s.appendChild(nm);
      nameEls.push(nm);
      s.addEventListener('click', function () {
        var acc = 0;
        for (var k = 0; k < B.phases.length; k++) {
          if (k === idx) break;
          acc += B.phases[k].dur;
        }
        B.seek(acc / B.total + 0.001);
      });
      segsEl.appendChild(s);
      segEls.push(s);
    });

    /* the deck counter follows the language even while the reel is paused */
    function setDeckCount(info) {
      if (!deckCount) return;
      deckCount.textContent = lang === 'ur'
        ? urNum(info.i + 1) + ' / ' + urNum(B.phases.length)
        : ('0' + (info.i + 1)).slice(-2) + ' / 0' + B.phases.length;
    }

    /* ------------------------------ language */
    function applyLang() {
      var t = T();
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
      document.body.classList.toggle('is-ur', lang === 'ur');
      if (langBtn) {
        langBtn.textContent = t.lang;
        langBtn.setAttribute('aria-pressed', lang === 'ur' ? 'true' : 'false');
      }
      if (soundBtn) soundBtn.textContent = soundOn ? t.soundOn : t.soundOff;
      if (playBtn) playBtn.querySelector('.txt').textContent = B.isPlaying() ? t.pause : (B.frac() >= 1 ? t.replay : t.play);
      document.querySelectorAll('[data-i18n]').forEach(function (n) {
        if (t[n.dataset.i18n] !== undefined) n.innerHTML = t[n.dataset.i18n];
      });
      nameEls.forEach(function (n, i) { n.textContent = t.phases[i] || B.phases[i].name; });
      if (B.setLang) B.setLang(lang);
      setDeckCount(B.phaseInfo(B.frac()));
      if (deckPhase) deckPhase.textContent = t.phases[B.phaseInfo(B.frac()).i] || '';
      syncReserved();
      setScrub(B.frac());
      if (hintEl && B.isPlaying()) hintEl.classList.add('is-gone');
    }
    if (langBtn) {
      langBtn.addEventListener('click', function () {
        lang = lang === 'en' ? 'ur' : 'en';
        try { window.localStorage.setItem(storeKey + '-lang', lang); } catch (e) { /* private mode */ }
        applyLang();
      });
    }

    /* ------------------------------ sound */
    var S = window.SOUND || {
      start: function () { return false; }, setOn: function () {}, cue: function () {},
      melee: function () {}, volley: function () {}, isOn: function () { return false; }
    };
    var soundOn = false;
    try { soundOn = window.localStorage.getItem(storeKey + '-sound') === '1'; } catch (e) { soundOn = false; }
    function applySound() {
      if (!soundBtn) return;
      soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
      soundBtn.textContent = soundOn ? T().soundOn : T().soundOff;
      S.setOn(soundOn);
    }
    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        soundOn = !soundOn;
        try { window.localStorage.setItem(storeKey + '-sound', soundOn ? '1' : '0'); } catch (e) { /* private mode */ }
        if (soundOn) S.start();
        applySound();
      });
    }

    /* ------------------------------ speed */
    var SPEEDS = page.speeds || [0.5, 1, 1.5, 2];
    var speedIdx = 1;
    function speedLabel() {
      var x = SPEEDS[speedIdx];
      if (speedBtn) speedBtn.textContent = (x === Math.floor(x) ? x : x.toFixed(1)) + '×';
      B.setSpeed(x);
    }
    if (speedBtn) {
      speedBtn.addEventListener('click', function () {
        speedIdx = (speedIdx + 1) % SPEEDS.length;
        speedLabel();
      });
    }

    /* ------------------------------ play */
    function setPlayState(playing) {
      if (!playBtn) return;
      playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      playBtn.querySelector('.glyph').textContent = playing ? '||' : '▶';
      playBtn.querySelector('.txt').textContent = playing ? T().pause : (B.frac() >= 1 ? T().replay : T().play);
      if (canvasEl) canvasEl.classList.toggle('is-playing', playing);
      if (hintEl && (playing || dismissed)) hintEl.classList.add('is-gone');
    }
    function dismissHint() {
      dismissed = true;
      if (hintEl) hintEl.classList.add('is-gone');
    }
    if (canvasEl) {
      canvasEl.addEventListener('pointerdown', dismissHint, { once: true });
      canvasEl.addEventListener('wheel', dismissHint, { once: true, passive: true });
    }
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
      if (t - lastPlayTap < 900) return;
      lastPlayTap = t;
      togglePlay();
    }
    if (playBtn) {
      playBtn.addEventListener('pointerup', function (e) {
        if (e.isPrimary === false) return;
        if (e.button !== undefined && e.button !== 0) return;
        if (e.pointerType) requestToggle();
      });
      playBtn.addEventListener('click', function (e) {
        if (!e.pointerType) requestToggle();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () { B.seek(0); B.play(); setPlayState(true); });
    }

    /* ------------------------------ scrub */
    var scrubbing = false;
    function setScrub(frac) {
      if (scrubHead) scrubHead.style.left = ((lang === 'ur' ? 1 - frac : frac) * 100).toFixed(2) + '%';
    }
    function fracFromEvent(e) {
      var r = timeline.getBoundingClientRect();
      var f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      return lang === 'ur' ? 1 - f : f;
    }
    if (timeline) {
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
    }

    /* ------------------------------ keyboard */
    document.addEventListener('keydown', function (e) {
      if (!e.target || !/BODY/.test(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); return; }
      var back = lang === 'ur' ? 'ArrowRight' : 'ArrowLeft';
      var fwd = lang === 'ur' ? 'ArrowLeft' : 'ArrowRight';
      if (e.code === fwd) B.seek(Math.min(1, B.frac() + 0.02));
      if (e.code === back) B.seek(Math.max(0, B.frac() - 0.02));
    });

    /* ------------------------------ tick */
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lastPhase = -1;
    B.onTick(function (frac, info) {
      setScrub(frac);
      setDeckCount(info);
      if (deckPhase) deckPhase.textContent = T().phases[info.i] || '';
      segEls.forEach(function (s, k) {
        s.classList.toggle('is-today', k === info.i);
        s.classList.toggle('is-past', k < info.i);
      });
      if (info.i !== lastPhase) {
        lastPhase = info.i;
        S.cue(info.i, page.cue);
      }
      if (page.audio && page.audio.tick && B.isPlaying() && !reduce) page.audio.tick({ B: B, info: info, S: S, reduce: reduce });
      if (!B.isPlaying()) setPlayState(false);
    });

    /* ------------------------------ reserved screen areas */
    /* the legend and the deck own their corners; world labels stay out of them */
    function syncReserved() {
      if (!window.ENGINE || !window.ENGINE.labels) return;
      var rects = [];
      ['.legend', '.deck'].forEach(function (sel) {
        var n = document.querySelector(sel);
        if (!n) return;
        var b = n.getBoundingClientRect();
        if (b.width && b.height) rects.push([b.left - 8, b.top - 8, b.right + 8, b.bottom + 8]);
      });
      window.ENGINE.labels.reserved = rects;
    }
    window.addEventListener('resize', syncReserved);

    /* ------------------------------ boot */
    if (page.build && window.console) console.log('[' + (page.key || 'battle') + '] ' + page.build);
    if (page.build && /[?&]debug=1/.test(location.search)) {
      var dbg = document.createElement('div');
      dbg.className = 'debug-build';
      dbg.textContent = page.build;
      document.body.appendChild(dbg);
    }
    setPlayState(false);
    setScrub(B.frac());
    if (segEls[0]) segEls[0].classList.add('is-today');
    speedLabel();
    applySound();
    applyLang();
    syncReserved();
    /* deep link: a frame on the home page opens the model on that phase */
    try {
      var want = new URLSearchParams(location.search).get('phase');
      if (want) {
        var acc = 0, found = false;
        for (var pk = 0; pk < B.phases.length; pk++) {
          if (B.phases[pk].id === want) { found = true; break; }
          acc += B.phases[pk].dur;
        }
        if (found) { B.seek(acc / B.total + 0.001); B.snapCam(); }
      }
    } catch (e) { /* no query string */ }
  }

  if (window.BATTLE) run();
  else document.addEventListener('battle:ready', run, { once: true });
})();
