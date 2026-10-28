/* seerah-models · the battle shell.
   One instrument for every battle page: play, timeline, scrub, speed, restart,
   language (English / Urdu, right-to-left), sound, the phase caption and the
   four-field index. The page supplies window.BATTLE_PAGE; the battle module
   supplies window.BATTLE. Nothing here knows which battle it is on. */
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

  var ARROW = '<svg viewBox="0 0 30 16" aria-hidden="true" focusable="false"><path d="M0 8h27M20 1l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var SIGIL = '<svg viewBox="0 0 20 22" aria-hidden="true" focusable="false"><rect x="8.6" y="1" width="1.8" height="20" fill="currentColor"/><rect x="10.4" y="3" width="8.6" height="6" fill="currentColor"/></svg>';

  /* the six live fields: the only shared content in the shell */
  var ATLAS = [
    {
      key: 'badr', href: '../badr/index.html', ar: 'بدر',
      year: { en: '2 AH', ur: '۲ ہجری' },
      name: { en: 'Badr', ur: 'بدر' },
      place: { en: 'the wells', ur: 'کنویں' }
    },
    {
      key: 'uhud', href: '../uhud/index.html', ar: 'أُحد',
      year: { en: '3 AH', ur: '۳ ہجری' },
      name: { en: 'Uhud', ur: 'اُحد' },
      place: { en: 'the archers’ hill', ur: 'تیر اندازوں کی پہاڑی' }
    },
    {
      key: 'khandaq', href: '../khandaq/index.html', ar: 'الخندق',
      year: { en: '5 AH', ur: '۵ ہجری' },
      name: { en: 'Khandaq', ur: 'خندق' },
      place: { en: 'the trench', ur: 'دفاعی خندق' }
    },
    {
      key: 'khaybar', href: '../khaybar/index.html', ar: 'خيبر',
      year: { en: '7 AH', ur: '۷ ہجری' },
      name: { en: 'Khaybar', ur: 'خیبر' },
      place: { en: 'the forts', ur: 'قلعے' }
    },
    {
      key: 'mutah', href: '../mutah/index.html', ar: 'مؤتة',
      year: { en: '8 AH', ur: '۸ ہجری' },
      name: { en: 'Muʿtah', ur: 'مؤتہ' },
      place: { en: 'the dry wādī', ur: 'خشک وادی' }
    },
    {
      key: 'hunayn', href: '../hunayn/index.html', ar: 'حنين',
      year: { en: '8 AH', ur: '۸ ہجری' },
      name: { en: 'Ḥunayn', ur: 'حنین' },
      place: { en: 'the narrow valley', ur: 'تنگ وادی' }
    }
  ];

  var TEXT = {
    en: {
      play: 'play', pause: 'pause', replay: 'replay',
      soundOn: 'sound on', soundOff: 'sound off',
      sound: 'sound', lang: 'اردو', battles: 'battles',
      restart: 'restart', speed: 'playback speed',
      close: 'close', here: 'here',
      homeAria: 'The Seerah Atlas — all six battles',
      fieldKey: 'field key', tools: 'experience tools',
      timeline: 'battle timeline: drag to scrub',
      hint: 'drag to look · scroll or pinch to zoom',
      atlasKicker: 'the seerah atlas',
      atlasTitle: 'the six fields',
      atlasNote: '2–8 AH · six battlefields, six models',
      ethic: 'Faceless figures throughout; the Prophet <span class="hon" lang="ar">ﷺ</span> is never depicted.',
      keys: '<b>space</b> play · <b>← →</b> scrub · <b>b</b> battles · <b>esc</b> close',
      brand: 'badr <em>· the battle</em>',
      legendM: '<b>Muslims</b><span class="legend-detail"> · lightly equipped</span>',
      legendQ: '<b>Quraysh</b><span class="legend-detail"> · fully equipped</span>',
      phases: []
    },
    ur: {
      play: 'چلائیں', pause: 'وقفہ', replay: 'دوبارہ',
      soundOn: 'آواز چالو', soundOff: 'آواز بند',
      sound: 'آواز', lang: 'EN', battles: 'معرکے',
      restart: 'دوبارہ شروع', speed: 'رفتار',
      close: 'بند کریں', here: 'یہاں',
      homeAria: 'اطلسِ سیرت — چھ معرکے',
      fieldKey: 'میدان کی علامات', tools: 'تجربے کے اختیارات',
      timeline: 'میدان کی ٹائم لائن: گھسیٹ کر آگے پیچھے کریں',
      hint: 'دیکھنے کے لیے گھمائیں · زوم کے لیے اسکرول یا دو انگلیوں کا اشارہ',
      atlasKicker: 'اطلسِ سیرت',
      atlasTitle: 'چھ میدان',
      atlasNote: '۲–۸ ہجری · چھ میدان، چھ نمونے',
      ethic: 'تمام شکلیں بے چہرہ ہیں؛ نبی <span class="hon" lang="ar">ﷺ</span> کو کبھی نہیں دکھایا گیا۔',
      keys: '<b>اسپیس</b> چلائیں · <b>← →</b> آگے پیچھے · <b>b</b> معرکے · <b>esc</b> بند',
      brand: 'بدر <em>· معرکۂ بدر</em>',
      legendM: '<b>مسلمان</b><span class="legend-detail"> · ہلکے اسلحے سے</span>',
      legendQ: '<b>قریش</b><span class="legend-detail"> · مکمل اسلحے سے</span>',
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
    var lang = 'en';
    var storeKey = (page.key || 'battle');
    try { lang = window.localStorage.getItem(storeKey + '-lang') === 'ur' ? 'ur' : 'en'; } catch (e) { lang = 'en'; }

    function T() {
      var base = TEXT[lang] || TEXT.en;
      var own = copy[lang] || {};
      var out = {}, k;
      for (k in base) out[k] = base[k];
      for (k in own) out[k] = own[k];
      return out;
    }

    var playBtn = $('#playBtn');
    var playTxt = playBtn ? playBtn.querySelector('.txt') : null;
    var resetBtn = $('#resetBtn');
    var speedBtn = $('#speedBtn');
    var speedVal = speedBtn ? speedBtn.querySelector('.speed-val') : null;
    var speedMenu = $('#speedMenu');
    var speedWrap = speedBtn ? speedBtn.closest('.speed') : null;
    var timeline = $('#timeline');
    var scrubHead = $('#scrubHead');
    var segsEl = $('#segs');
    var deckPhase = $('#deckPhase');
    var deckTime = $('#deckTime');
    var timeNow = deckTime ? deckTime.querySelector('.t-now') : null;
    var timeTotal = deckTime ? deckTime.querySelector('.t-total') : null;
    var langBtn = $('#langBtn');
    var soundBtn = $('#soundBtn');
    var soundLabel = soundBtn ? soundBtn.querySelector('.sound-label') : null;
    var battlesBtn = $('#battlesBtn');
    var canvasEl = document.getElementById('gl');
    var nameEls = [];
    var segEls = [];
    var dismissed = false;
    var lastPhase = -1;
    var lastTime = '';
    var lastCaption = '';

    /* ------------------------------ the four-field index */
    var atlas = el('dialog', 'atlas');
    atlas.id = 'atlasDialog';
    atlas.setAttribute('aria-labelledby', 'atlasTitle');

    var sheet = el('div', 'atlas-sheet');
    var head = el('div', 'atlas-head');
    var headText = el('div', 'atlas-heading');
    var kicker = el('p', 'atlas-kicker');
    kicker.innerHTML = SIGIL + '<span class="atlas-kicker-txt"></span>';
    var kickerTxt = kicker.querySelector('.atlas-kicker-txt');
    var atlasTitle = el('h2', 'atlas-title');
    atlasTitle.id = 'atlasTitle';
    var atlasNote = el('p', 'atlas-note');
    headText.appendChild(kicker);
    headText.appendChild(atlasTitle);
    headText.appendChild(atlasNote);

    var closeBtn = el('button', 'atlas-close');
    closeBtn.type = 'button';
    closeBtn.innerHTML = '<svg viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M1 1l12 12M13 1L1 13" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
    head.appendChild(headText);
    head.appendChild(closeBtn);

    var list = el('nav', 'atlas-list');
    ATLAS.forEach(function (b) {
      var row, here = null;
      if (b.key === (page.key || 'badr')) {
        row = el('div', 'atlas-row is-here');
        row.setAttribute('aria-current', 'page');
      } else {
        row = el('a', 'atlas-row');
        row.href = b.href;
      }
      row.setAttribute('data-battle', b.key);

      var year = el('span', 'atlas-year');
      var name = el('span', 'atlas-name');
      var nm = el('span', 'atlas-nm');
      var ar = el('span', 'atlas-ar');
      ar.lang = 'ar';
      ar.dir = 'rtl';
      ar.textContent = b.ar;
      name.appendChild(nm);
      name.appendChild(ar);
      var place = el('span', 'atlas-place');
      var flag = el('span', 'atlas-flag');
      if (row.tagName === 'DIV') {
        here = el('span', 'atlas-here');
        flag.appendChild(here);
      } else {
        flag.innerHTML = ARROW;
      }

      row.appendChild(year);
      row.appendChild(name);
      row.appendChild(place);
      row.appendChild(flag);
      list.appendChild(row);
      b._els = { year: year, name: nm, place: place, here: here };
    });

    var foot = el('div', 'atlas-foot');
    var ethic = el('p', 'atlas-ethic');
    var keys = el('p', 'atlas-keys');
    foot.appendChild(ethic);
    foot.appendChild(keys);

    sheet.appendChild(head);
    sheet.appendChild(list);
    sheet.appendChild(foot);
    atlas.appendChild(sheet);
    document.body.appendChild(atlas);

    function openAtlas() {
      if (atlas.open) return;
      closeSpeed();
      if (B.isPlaying()) { B.pause(); setPlayState(false); }
      if (battlesBtn) battlesBtn.setAttribute('aria-expanded', 'true');
      if (typeof atlas.showModal === 'function') atlas.showModal();
      else atlas.setAttribute('open', '');
    }
    function closeAtlas() {
      if (!atlas.open) return;
      if (typeof atlas.close === 'function') atlas.close();
      else atlas.removeAttribute('open');
    }
    if (battlesBtn) {
      battlesBtn.addEventListener('click', function () {
        if (atlas.open) closeAtlas();
        else openAtlas();
      });
    }
    closeBtn.addEventListener('click', closeAtlas);
    atlas.addEventListener('close', function () {
      if (battlesBtn) {
        battlesBtn.setAttribute('aria-expanded', 'false');
        battlesBtn.focus({ preventScroll: true });
      }
    });
    atlas.addEventListener('click', function (e) {
      if (e.target === atlas) closeAtlas();
    });

    /* ------------------------------ timeline */
    (B.phases || []).forEach(function (ph, idx) {
      var s = el('button', 'seg');
      s.type = 'button';
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
        dismissHint();
      });
      segsEl.appendChild(s);
      segEls.push(s);
    });

    function phaseName(i) {
      var names = T().phases || [];
      return names[i] || (B.phases[i] && B.phases[i].name) || '';
    }

    /* ------------------------------ language */
    function applyLang() {
      var t = T();
      lastCaption = '';
      lastTime = '';
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
      document.body.classList.toggle('is-ur', lang === 'ur');
      if (langBtn) {
        langBtn.textContent = t.lang;
        langBtn.setAttribute('lang', lang === 'ur' ? 'en' : 'ur');
        langBtn.setAttribute('aria-pressed', lang === 'ur' ? 'true' : 'false');
      }
      document.querySelectorAll('[data-i18n]').forEach(function (n) {
        if (t[n.dataset.i18n] !== undefined) n.innerHTML = t[n.dataset.i18n];
      });
      document.querySelectorAll('[data-i18n-aria]').forEach(function (n) {
        if (t[n.dataset.i18nAria]) n.setAttribute('aria-label', t[n.dataset.i18nAria]);
      });
      if (soundBtn) soundBtn.setAttribute('aria-label', soundOn ? t.soundOn : t.soundOff);
      if (soundLabel) soundLabel.textContent = soundOn ? t.soundOn : t.soundOff;
      if (speedBtn) speedBtn.setAttribute('aria-label', t.speed);
      if (resetBtn) resetBtn.setAttribute('aria-label', t.restart);
      if (timeline) timeline.setAttribute('aria-label', t.timeline);

      nameEls.forEach(function (n, i) { n.textContent = phaseName(i); });
      segEls.forEach(function (s, i) { s.setAttribute('aria-label', phaseName(i)); });

      kickerTxt.textContent = t.atlasKicker;
      atlasTitle.textContent = t.atlasTitle;
      atlasNote.textContent = t.atlasNote;
      ethic.innerHTML = t.ethic;
      keys.innerHTML = t.keys;
      closeBtn.setAttribute('aria-label', t.close);
      list.setAttribute('aria-label', t.battles);
      ATLAS.forEach(function (b) {
        b._els.year.textContent = b.year[lang];
        b._els.name.textContent = b.name[lang];
        b._els.place.textContent = b.place[lang];
        if (b._els.here) b._els.here.textContent = t.here;
      });

      if (playTxt) playTxt.textContent = B.isPlaying() ? t.pause : (B.frac() >= 1 ? t.replay : t.play);
      renderSpeed();
      updateCaption(B.phaseInfo(B.frac()));
      setScrub(B.frac());
      setTime(B.frac());
      syncReserved();
      if (B.setLang) B.setLang(lang);
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
    var soundOn = false, soundSet = false;
    try {
      /* the sound layer was rebuilt (build ab): a choice made under the old
         synth does not describe what the visitor wants for real recordings —
         clear it once, so the first play press turns sound on */
      if (!window.localStorage.getItem(storeKey + '-sound-reset-ab')) {
        window.localStorage.removeItem(storeKey + '-sound');
        window.localStorage.setItem(storeKey + '-sound-reset-ab', '1');
      }
      var sv = window.localStorage.getItem(storeKey + '-sound');
      soundSet = sv !== null;
      soundOn = sv === '1';
    } catch (e) { soundOn = false; }
    /* the first play press is a real user gesture: if the visitor never chose,
       sound comes on with it instead of the model playing mute */
    function ensureSoundChosen() {
      if (soundSet) return;
      soundSet = true;
      soundOn = true;
      try { window.localStorage.setItem(storeKey + '-sound', '1'); } catch (e) { /* private mode */ }
    }
    function applySound() {
      if (!soundBtn) return;
      soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
      soundBtn.setAttribute('aria-label', soundOn ? T().soundOn : T().soundOff);
      if (soundLabel) soundLabel.textContent = soundOn ? T().soundOn : T().soundOff;
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
    try {
      var savedSpeed = parseFloat(window.localStorage.getItem(storeKey + '-speed'));
      var savedIdx = SPEEDS.indexOf(savedSpeed);
      if (savedIdx !== -1) speedIdx = savedIdx;
    } catch (e) { /* private mode */ }
    if (!SPEEDS[speedIdx]) speedIdx = 0;

    function speedText(x) {
      var s = x === Math.floor(x) ? String(x) : x.toFixed(1);
      return (lang === 'ur' ? urNum(s) : s) + '×';
    }
    function renderSpeed() {
      if (speedVal) speedVal.textContent = speedText(SPEEDS[speedIdx]);
      if (!speedMenu) return;
      Array.prototype.forEach.call(speedMenu.querySelectorAll('button'), function (b, i) {
        b.textContent = speedText(SPEEDS[i]);
        b.setAttribute('aria-checked', i === speedIdx ? 'true' : 'false');
      });
    }
    function setSpeed(i) {
      speedIdx = (i + SPEEDS.length) % SPEEDS.length;
      if (B.setSpeed) B.setSpeed(SPEEDS[speedIdx]);
      try { window.localStorage.setItem(storeKey + '-speed', String(SPEEDS[speedIdx])); } catch (e) { /* private mode */ }
      renderSpeed();
    }
    function openSpeed() {
      if (!speedMenu || !speedMenu.hidden) return;
      speedMenu.hidden = false;
      speedBtn.setAttribute('aria-expanded', 'true');
    }
    function closeSpeed(focus) {
      if (!speedMenu || speedMenu.hidden) return;
      speedMenu.hidden = true;
      speedBtn.setAttribute('aria-expanded', 'false');
      if (focus) speedBtn.focus({ preventScroll: true });
    }
    if (speedMenu) {
      SPEEDS.forEach(function (x, i) {
        var b = el('button');
        b.type = 'button';
        b.setAttribute('role', 'menuitemradio');
        b.setAttribute('aria-checked', i === speedIdx ? 'true' : 'false');
        b.textContent = speedText(x);
        b.addEventListener('click', function () {
          setSpeed(i);
          closeSpeed(true);
        });
        speedMenu.appendChild(b);
      });
      speedMenu.addEventListener('keydown', function (e) {
        var items = Array.prototype.slice.call(speedMenu.querySelectorAll('button'));
        var at = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          items[(at + 1) % items.length].focus();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          items[(at - 1 + items.length) % items.length].focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeSpeed(true);
        } else if (e.key === 'Tab') {
          closeSpeed(false);
        }
      });
    }
    if (speedBtn) {
      speedBtn.addEventListener('click', function () {
        if (speedMenu && speedMenu.hidden) openSpeed();
        else closeSpeed(false);
      });
      speedBtn.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          openSpeed();
          window.requestAnimationFrame(function () {
            var items = speedMenu.querySelectorAll('button');
            if (items[speedIdx]) items[speedIdx].focus();
          });
        }
      });
    }
    document.addEventListener('pointerdown', function (e) {
      if (speedWrap && !speedWrap.contains(e.target)) closeSpeed(false);
    });

    /* ------------------------------ play */
    function setPlayState(playing) {
      if (!playBtn) return;
      playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      if (playTxt) playTxt.textContent = playing ? T().pause : (B.frac() >= 1 ? T().replay : T().play);
      if (canvasEl) canvasEl.classList.toggle('is-playing', playing);
      if (playing) dismissHint();
    }
    function dismissHint() {
      if (dismissed) return;
      dismissed = true;
      updateCaption(B.phaseInfo(B.frac()));
    }
    if (canvasEl) {
      canvasEl.addEventListener('pointerdown', dismissHint, { once: true });
      canvasEl.addEventListener('wheel', dismissHint, { once: true, passive: true });
    }
    function togglePlay() {
      if (B.isPlaying()) { B.pause(); setPlayState(false); return; }
      if (B.frac() >= 1) B.seek(0);
      ensureSoundChosen();
      B.play();
      setPlayState(true);
      if (soundOn) S.start();
      applySound();
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
      resetBtn.addEventListener('click', function () {
        ensureSoundChosen();
        B.seek(0);
        B.play();
        setPlayState(true);
        if (soundOn) S.start();
        applySound();
      });
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
        dismissHint();
        B.seek(fracFromEvent(e));
      });
      timeline.addEventListener('pointermove', function (e) {
        if (scrubbing) B.seek(fracFromEvent(e));
      });
      ['pointerup', 'pointercancel'].forEach(function (ev) {
        timeline.addEventListener(ev, function () { scrubbing = false; });
      });
    }

    /* ------------------------------ caption + clock */
    function updateCaption(info) {
      if (!deckPhase) return;
      var hint = !dismissed;
      var key = (hint ? 'h' : 'p') + info.i + lang;
      if (key === lastCaption) return;
      lastCaption = key;
      var t = T();
      deckPhase.classList.toggle('is-hint', hint);
      deckPhase.textContent = hint ? t.hint : phaseName(info.i);
    }
    function clockText(sec) {
      var s = Math.max(0, Math.round(sec));
      var m = Math.floor(s / 60);
      var r = s % 60;
      var str = m + ':' + (r < 10 ? '0' : '') + r;
      return lang === 'ur' ? urNum(str) : str;
    }
    function setTime(frac) {
      if (!timeNow || !timeTotal) return;
      var total = B.total || 0;
      var now = clockText(frac * total);
      var all = clockText(total);
      var key = now + '/' + all;
      if (key === lastTime) return;
      lastTime = key;
      timeNow.textContent = now;
      timeTotal.textContent = all;
    }

    /* ------------------------------ keyboard */
    document.addEventListener('keydown', function (e) {
      if (atlas.open) return;
      if (speedMenu && !speedMenu.hidden && e.key === 'Escape') {
        e.preventDefault();
        closeSpeed(true);
        return;
      }
      if (!e.target || !/BODY/.test(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); return; }
      if (e.code === 'KeyB') { e.preventDefault(); openAtlas(); return; }
      var back = lang === 'ur' ? 'ArrowRight' : 'ArrowLeft';
      var fwd = lang === 'ur' ? 'ArrowLeft' : 'ArrowRight';
      if (e.code === fwd) B.seek(Math.min(1, B.frac() + 0.02));
      if (e.code === back) B.seek(Math.max(0, B.frac() - 0.02));
    });

    /* ------------------------------ tick */
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    B.onTick(function (frac, info) {
      setScrub(frac);
      setTime(frac);
      updateCaption(info);
      segEls.forEach(function (s, k) {
        s.classList.toggle('is-today', k === info.i);
        s.classList.toggle('is-past', k < info.i);
      });
      if (info.i !== lastPhase) {
        lastPhase = info.i;
        S.cue(info.i, page.cue);
      }
      if (page.audio && page.audio.tick && B.isPlaying() && !reduce) page.audio.tick({ B: B, info: info, S: S, reduce: reduce });
      if (!B.isPlaying() && playBtn && playBtn.getAttribute('aria-pressed') === 'true') setPlayState(false);
    });

    /* ------------------------------ reserved screen areas */
    /* the bar, the key and the deck own their edges; world labels stay out of them */
    function syncReserved() {
      if (!window.ENGINE || !window.ENGINE.labels) return;
      var rects = [];
      ['.bar', '.legend', '.deck'].forEach(function (sel) {
        var n = document.querySelector(sel);
        if (!n) return;
        var b = n.getBoundingClientRect();
        if (b.width && b.height) rects.push([b.left - 8, b.top - 8, b.right + 8, b.bottom + 8]);
      });
      window.ENGINE.labels.reserved = rects;
    }
    window.addEventListener('resize', syncReserved);
    window.addEventListener('load', syncReserved);
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(syncReserved).catch(function () {});
    }

    /* ------------------------------ boot */
    if (page.build && window.console) console.log('[' + (page.key || 'battle') + '] ' + page.build);
    if (page.build && /[?&]debug=1/.test(location.search)) {
      var dbg = document.createElement('div');
      dbg.className = 'debug-build';
      dbg.textContent = page.build;
      document.body.appendChild(dbg);
    }
    B.setSpeed(SPEEDS[speedIdx]);
    setPlayState(false);
    setScrub(B.frac());
    setTime(B.frac());
    updateCaption(B.phaseInfo(B.frac()));
    if (segEls[0]) segEls[0].classList.add('is-today');
    applySound();
    applyLang();

    /* deep link: a frame on the home page opens the model on that phase */
    try {
      var want = new URLSearchParams(location.search).get('phase');
      if (want) {
        var acc = 0, found = false;
        for (var pk = 0; pk < B.phases.length; pk++) {
          if (B.phases[pk].id === want) { found = true; break; }
          acc += B.phases[pk].dur;
        }
        if (found) {
          dismissed = true;
          B.seek(acc / B.total + 0.001);
          B.snapCam();
          updateCaption(B.phaseInfo(B.frac()));
          setScrub(B.frac());
          setTime(B.frac());
        }
      }
    } catch (e) { /* no query string */ }
  }

  if (window.BATTLE) run();
  else document.addEventListener('battle:ready', run, { once: true });
})();
