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
  var canHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : true;

  var active = 'badr';
  var frame = 2;
  var timer = null;

  function isReduced() {
    return !!(reduce && reduce.matches);
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
    if (!name || name === active) return;
    active = name;
    gate.setAttribute('data-battle', name);
    schedule();
  }

  if (doors) {
    /* A mouse previews the field its door opens; touch follows the link. */
    if (canHover) {
      doors.addEventListener('pointerover', function (event) {
        var door = event.target.closest ? event.target.closest('[data-door]') : null;
        if (door) setBattle(door.getAttribute('data-door'));
      });
    }

    doors.addEventListener('focusin', function (event) {
      var door = event.target.closest ? event.target.closest('[data-door]') : null;
      if (door) setBattle(door.getAttribute('data-door'));
    });
  }

  document.addEventListener('visibilitychange', schedule);
  if (reduce && reduce.addEventListener) reduce.addEventListener('change', schedule);

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
