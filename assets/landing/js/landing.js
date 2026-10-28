/* The Seerah Atlas · the gate.
   The field keeps its own slow day; the doors choose which field is shown.
   No behaviour here is required to reach a model. */
(function () {
  'use strict';

  var gate = document.getElementById('gate');
  if (!gate) return;

  var doors = document.getElementById('doors');
  var frames = Array.prototype.slice.call(gate.querySelectorAll('.day-frame'));
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  var plate = document.getElementById('fieldPlate');
  var plateYear = document.getElementById('fieldYear');
  var plateName = document.getElementById('fieldName');
  var plateTimer = null;

  var FIELDS = {
    badr: { year: '2 AH', name: 'Badr', place: 'the wells' },
    uhud: { year: '3 AH', name: 'Uhud', place: 'the archers’ hill' },
    khandaq: { year: '5 AH', name: 'Khandaq', place: 'the trench' },
    khaybar: { year: '7 AH', name: 'Khaybar', place: 'the forts' },
    mutah: { year: '8 AH', name: 'Muʿtah', place: 'the wādī' },
    hunayn: { year: '8 AH', name: 'Ḥunayn', place: 'the valley' }
  };

  var active = 'badr';
  var frame = 2;
  var timer = null;

  function isReduced() {
    return !!(reduce && reduce.matches);
  }

  function paintPlate(name) {
    var field = FIELDS[name] || FIELDS.badr;
    if (plate) plate.setAttribute('data-field', FIELDS[name] ? name : 'badr');
    if (!plate || !plateYear || !plateName) return;
    plateYear.textContent = field.year;
    plateName.textContent = field.name;
    var place = document.createElement('span');
    place.className = 'field-plate-place';
    place.textContent = '· ' + field.place;
    plateName.appendChild(place);
  }

  function setPlate(name) {
    if (!plate) return;
    window.clearTimeout(plateTimer);
    if (isReduced() || !plateYear) { paintPlate(name); return; }
    plate.classList.add('is-swapping');
    plateTimer = window.setTimeout(function () {
      paintPlate(name);
      plate.classList.remove('is-swapping');
    }, 150);
  }

  function advance() {
    if (!frames.length) return;
    frame = (frame + 1) % frames.length;
    frames.forEach(function (item, index) {
      item.classList.toggle('is-on', index === frame);
    });
  }

  function schedule() {
    window.clearTimeout(timer);
    if (!frames.length || isReduced() || document.hidden || active !== 'badr') return;
    timer = window.setTimeout(function () {
      advance();
      schedule();
    }, 7000);
  }

  function setBattle(name) {
    if (!name || !FIELDS[name] || name === active) return;
    active = name;
    gate.setAttribute('data-battle', name);
    setPlate(name);
    schedule();
  }

  /* On a narrow screen the field is a gallery you swipe; the plate rides with it.
     The register below still enters on one tap, so this is an enhancement. */
  var track = document.getElementById('stageTrack');
  var layers = track ? Array.prototype.slice.call(track.querySelectorAll('.stage-layer')) : [];
  var order = layers.map(function (layer) { return layer.getAttribute('data-field'); });
  var trackTick = false;

  function syncTrack() {
    trackTick = false;
    if (!track || !order.length) return;
    var width = track.clientWidth;
    if (!width || track.scrollWidth <= width + 4) return;
    var index = Math.round(track.scrollLeft / width);
    index = Math.max(0, Math.min(order.length - 1, index));
    if (order[index]) setBattle(order[index]);
  }

  function revealField(name) {
    if (!track || !order.length) return;
    var width = track.clientWidth;
    var index = order.indexOf(name);
    if (!width || index < 0 || track.scrollWidth <= width + 4) return;
    var left = index * width;
    if (Math.abs(track.scrollLeft - left) > 1) track.scrollLeft = left;
  }

  if (track) {
    track.addEventListener('scroll', function () {
      if (trackTick) return;
      trackTick = true;
      window.requestAnimationFrame(syncTrack);
    }, { passive: true });

    var resizeTick = false;
    window.addEventListener('resize', function () {
      if (resizeTick) return;
      resizeTick = true;
      window.requestAnimationFrame(function () {
        resizeTick = false;
        revealField(active);
      });
    }, { passive: true });
  }

  if (doors) {
    /* A mouse or pen previews the field its door opens; a finger follows the link. */
    doors.addEventListener('pointerover', function (event) {
      if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      var door = event.target.closest ? event.target.closest('[data-door]') : null;
      if (!door) return;
      setBattle(door.getAttribute('data-door'));
      revealField(door.getAttribute('data-door'));
    });

    /* keyboard travel is a preview too */
    doors.addEventListener('focusin', function (event) {
      var door = event.target.closest ? event.target.closest('[data-door]') : null;
      if (!door) return;
      setBattle(door.getAttribute('data-door'));
      revealField(door.getAttribute('data-door'));
    });
  }

  document.addEventListener('visibilitychange', schedule);
  if (reduce && reduce.addEventListener) reduce.addEventListener('change', schedule);

  paintPlate(active);
  schedule();

  /* The last register keeps its separator; if it begins a new line, the dot would
     read as a bullet, so drop it there. */
  var ahead = document.querySelector('.ahead');
  var aheadLine = ahead ? ahead.querySelector('.ahead-line') : null;
  var aheadTail = ahead ? ahead.querySelector('.ahead-tail') : null;

  function fitAhead() {
    if (!aheadLine || !aheadTail) return;
    var line = aheadLine.getBoundingClientRect();
    var tail = aheadTail.getBoundingClientRect();
    ahead.classList.toggle('ahead--orphan', tail.left - line.left < 12);
  }

  fitAhead();
  window.addEventListener('resize', fitAhead, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAhead);

  /* Warm the alternate fields once the page is quiet, so a door never opens onto black. */
  function warm() {
    var pictures = Array.prototype.slice.call(gate.querySelectorAll('.stage-layer img'));
    pictures.forEach(function (picture) {
      picture.loading = 'eager';
      if (picture.decode) picture.decode().catch(function () {});
    });
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(warm, { timeout: 2400 });
  } else {
    window.setTimeout(warm, 1400);
  }
})();
