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
  var folio = document.getElementById('fieldFolio');
  var plateTimer = null;

  var FIELDS = {
    badr: { year: '2 AH', name: 'Badr', place: 'the wells', folio: 'first of five' },
    uhud: { year: '3 AH', name: 'Uhud', place: 'the archers’ hill', folio: 'second of five' },
    khandaq: { year: '5 AH', name: 'Khandaq', place: 'the trench', folio: 'third of five' },
    khaybar: { year: '7 AH', name: 'Khaybar', place: 'the forts', folio: 'fourth of five' },
    mutah: { year: '8 AH', name: 'Muʿtah', place: 'the wādī', folio: 'fifth of five' }
  };

  var active = 'badr';
  var frame = 2;
  var timer = null;

  function isReduced() {
    return !!(reduce && reduce.matches);
  }

  function paintPlate(name) {
    var field = FIELDS[name] || FIELDS.badr;
    if (folio) folio.textContent = field.folio;
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

  if (doors) {
    /* A mouse or pen previews the field its door opens; a finger follows the link. */
    doors.addEventListener('pointerover', function (event) {
      if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      var door = event.target.closest ? event.target.closest('[data-door]') : null;
      if (door) setBattle(door.getAttribute('data-door'));
    });

    /* keyboard travel is a preview too */
    doors.addEventListener('focusin', function (event) {
      var door = event.target.closest ? event.target.closest('[data-door]') : null;
      if (door) setBattle(door.getAttribute('data-door'));
    });
  }

  document.addEventListener('visibilitychange', schedule);
  if (reduce && reduce.addEventListener) reduce.addEventListener('change', schedule);

  paintPlate(active);
  schedule();

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
