/* Badr · the battle in 3D — the audio layer. Real recordings, not synthesis.
   Beds (wind, the crowd, rain, storm, fire) loop under the field and are
   gain-ramped by the per-battle cue tables; one-shots (clash, arrow, ram, horn,
   thunder, ...) are fired by the page descriptors through S.play(name). Files
   come from assets/audio/manifest.json (CC0; sources in CREDITS.md). A missing
   file or a failed decode only loses that cue — the engine still boots.
   Loading: over http the files are fetched and decoded into buffers. On a
   file:// page (or any fetch failure) the same files load through media
   elements routed into the graph, so a double-clicked index.html still sounds.
   Same public surface as before: S.start / setOn / isOn / cue / melee / volley,
   plus S.play(name). The context is created or resumed only from a real user
   gesture. */
(function () {
  'use strict';
  var manifestURL = null;
  try {
    if (document.currentScript && document.currentScript.src) {
      manifestURL = new URL('../assets/audio/manifest.json', document.currentScript.src).href;
    }
  } catch (e) { /* file:// or odd loader — fall back below */ }
  if (!manifestURL) manifestURL = 'assets/audio/manifest.json';
  var FILE_MODE = (location.protocol === 'file:');

  var ctx = null, master = null, on = false;
  var booted = false, booting = false, active = 0;
  var beds = {};   /* name -> { gain, base, dfault, buf|el, src? } */
  var ones = {};   /* name -> { files:[{buf}|{pool:[el]}], gain, minGap, vi, last } */

  function ensure() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);
    return true;
  }
  function ramp(node, v, t) {
    node.gain.cancelScheduledValues(ctx.currentTime);
    node.gain.linearRampToValueAtTime(v, ctx.currentTime + (t || 0.9));
  }
  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('manifest ' + r.status);
      return r.json();
    });
  }
  function decode(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('audio ' + r.status);
      return r.arrayBuffer();
    }).then(function (b) {
      return new Promise(function (res, rej) {
        ctx.decodeAudioData(b, res, rej);
      });
    });
  }
  /* a media element (file:// path): two players per file so takes can overlap */
  function elementPool(url, n) {
    var pool = [], pi = 0;
    for (var k = 0; k < n; k += 1) {
      var el = document.createElement('audio');
      el.src = url;
      el.preload = 'auto';
      pool.push({ el: el, node: null, g: null, busy: false });
    }
    function route(p, dest, vol) {
      if (!p.node) { p.node = ctx.createMediaElementSource(p.el); }
      if (!p.g) { p.g = ctx.createGain(); }
      p.node.disconnect();
      p.g.disconnect();
      p.node.connect(p.g);
      p.g.gain.setValueAtTime(vol, ctx.currentTime);
      p.g.connect(dest);
    }
    return {
      kind: 'el',
      take: function (dest) {
        var i, pick = null;
        for (i = 0; i < pool.length; i += 1) {
          pi = (pi + 1) % pool.length;
          if (!pool[pi].busy) { pick = pool[pi]; break; }
        }
        if (!pick) pick = pool[pi];
        pick.busy = true;
        return {
          start: function (rate, vol) {
            route(pick, dest, vol);
            pick.el.onended = function () { pick.busy = false; try { pick.g.disconnect(); } catch (e) {} };
            pick.el.playbackRate = rate;
            try { pick.el.currentTime = 0; } catch (e) { /* still loading */ }
            var pr = pick.el.play();
            if (pr && pr.catch) pr.catch(function () { pick.busy = false; });
          }
        };
      },
      loop: function (dest) {
        var p = pool[0];
        p.el.loop = true;
        route(p, dest, 1.0);
        var pr = p.el.play();
        if (pr && pr.catch) pr.catch(function () { /* stays silent until a gesture */ });
        return p;
      }
    };
  }
  /* manifest: { beds: {name:{file,gain,default}}, ones: {name:{files,gain,minGap}} }.
     gain calibrates the bed at cue value 1.0; default is the fraction the bed
     opens at when sound turns on (wind: on; the rest wait for a cue). */
  function poolJobs(jobs, n) {
    var i = 0, done = 0, total = jobs.length;
    return new Promise(function (res) {
      if (!total) { res(); return; }
      function next() {
        if (i >= total) return;
        var j = jobs[i++];
        j().catch(function () {}).then(function () {
          done += 1;
          if (done >= total) res(); else next();
        });
      }
      for (var k = 0; k < Math.min(n, total); k += 1) next();
    });
  }
  function boot() {
    if (booted || booting || !ctx) return Promise.resolve(false);
    booting = true;
    var load = FILE_MODE ? Promise.reject(new Error('file://')) : fetchJSON(manifestURL);
    var run = load.then(function (m) {
      /* http: fetch + decode into buffers */
      var jobs = [], k;
      for (k in (m.beds || {})) {
        (function (name, e) {
          jobs.push(function () {
            return decode(new URL(e.file, manifestURL).href).then(function (buf) {
              beds[name] = { kind: 'buf', gain: makeBedGain(), base: e.gain !== undefined ? e.gain : 1,
                             dfault: e.default !== undefined ? e.default : 0, buf: buf, started: false };
            });
          });
        })(k, m.beds[k]);
      }
      for (k in (m.ones || {})) {
        (function (name, e) {
          ones[name] = { kind: 'buf', files: [], gain: e.gain !== undefined ? e.gain : 0.5,
                         minGap: e.minGap !== undefined ? e.minGap : 170, vi: 0, last: 0 };
          (e.files || []).forEach(function (f) {
            jobs.push(function () {
              return decode(new URL(f, manifestURL).href).then(function (buf) {
                ones[name].files.push({ kind: 'buf', buf: buf });
              });
            });
          });
        })(k, m.ones[k]);
      }
      return poolJobs(jobs, 6).then(function () { return true; });
    }).catch(function () {
      /* file:// (or a blocked fetch): the same files through media elements */
      return loadManifest().then(function (m) {
        if (!m) return false;
        var k;
        for (k in (m.beds || {})) {
          (function (name, e) {
            beds[name] = { kind: 'el', gain: makeBedGain(), base: e.gain !== undefined ? e.gain : 1,
                           dfault: e.default !== undefined ? e.default : 0, started: false,
                           url: new URL(e.file, manifestURL).href };
          })(k, m.beds[k]);
        }
        for (k in (m.ones || {})) {
          (function (name, e) {
            ones[name] = { kind: 'el', files: (e.files || []).map(function (f) {
                             return { kind: 'el', url: new URL(f, manifestURL).href };
                           }),
                           gain: e.gain !== undefined ? e.gain : 0.5,
                           minGap: e.minGap !== undefined ? e.minGap : 170, vi: 0, last: 0 };
          })(k, m.ones[k]);
        }
        return true;
      });
    }).then(function (ok) {
      booted = !!ok;
      booting = false;
      if (booted && on) openBeds();
      return booted;
    }).catch(function () {
      booting = false;
      return false;
    });
    return run;
  }
  /* the manifest itself: fetch, then a script tag (works on file:// pages,
     where fetch and XHR are both blocked for local documents) */
  function loadManifest() {
    return fetchJSON(manifestURL).catch(function () {
      return new Promise(function (res) {
        var s = document.createElement('script');
        var t = setTimeout(function () { res(null); }, 4000);
        window.AUDIO_MANIFEST = null;
        s.src = new URL('manifest.js', manifestURL).href;
        s.onload = function () { clearTimeout(t); res(window.AUDIO_MANIFEST || null); };
        s.onerror = function () { clearTimeout(t); res(null); };
        document.head.appendChild(s);
      });
    });
  }
  function makeBedGain() {
    var g = ctx.createGain();
    g.gain.value = 0.0;
    g.connect(master);
    return g;
  }
  function openBeds() {
    var k, b;
    for (k in beds) {
      b = beds[k];
      if (b.started) continue;
      b.started = true;
      var target = b.base * b.dfault;
      if (b.kind === 'buf') {
        var src = ctx.createBufferSource();
        src.buffer = b.buf;
        src.loop = true;
        src.connect(b.gain);
        src.start(0, Math.random() * 0.5 * (b.buf.duration || 1));
        b.src = src;
        ramp(b.gain, target, 1.2);
      } else {
        elementPool(b.url, 1).loop(b.gain);
        ramp(b.gain, target, 1.2);
      }
    }
  }
  function setBed(name, v, t) {
    var b = beds[name];
    if (!b || !b.started) return;
    ramp(b.gain, b.base * v, t);
  }
  function play(name) {
    if (!ctx || !on) return;
    var e = ones[name];
    if (!e || (!e.files || !e.files.length)) return;
    var now = performance.now();
    if (now - e.last < e.minGap) return;
    if (active > 7) return; /* never let the one-shots pile up */
    e.last = now;
    e.vi = (e.vi + 1) % e.files.length;
    var clip = e.files[e.vi];
    active += 1;
    var done = function () { active -= 1; };
    if (clip.kind === 'buf') {
      var src = ctx.createBufferSource();
      src.buffer = clip.buf;
      src.playbackRate.value = 0.95 + Math.random() * 0.1; /* no machine-gun repeats */
      var g = ctx.createGain();
      g.gain.setValueAtTime(e.gain * (0.88 + Math.random() * 0.24), ctx.currentTime);
      src.connect(g);
      g.connect(master);
      src.onended = done;
      src.start();
    } else {
      var pool = clip.pool || (clip.pool = elementPool(clip.url, 2));
      var taker = pool.take(master);
      taker.start(0.95 + Math.random() * 0.1, e.gain * (0.88 + Math.random() * 0.24));
      setTimeout(done, 4000);
    }
  }

  window.SOUND = {
    start: function () {
      if (!ensure()) return false;
      if (ctx.state === 'suspended') ctx.resume();
      boot();
      return true;
    },
    setOn: function (v) {
      on = !!v;
      if (!on) { if (master) ramp(master, 0.0, 0.4); return; }
      /* the context is created/resumed only by S.start() from a real user gesture */
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        boot();
        ramp(master, 0.5, 0.8);
        openBeds();
      }
    },
    isOn: function () { return on; },
    /* a battle page passes its own cue table: { rumble, time, crack, sfx, bed } per phase.
       rumble drives the crowd bed (0..1 of its calibrated loudness); bed raises any
       named bed the same way; sfx fires a named one-shot; crack lands a dull impact. */
    cue: function (i, table) {
      if (!ctx || !on) return;
      var c = table && table[i];
      if (c) {
        if (c.rumble !== undefined) setBed('crowd', c.rumble, c.time || 0.9);
        if (c.bed) { for (var b in c.bed) setBed(b, c.bed[b], c.time || 0.9); }
        if (c.sfx) play(c.sfx);
        else if (c.crack) play('thud');
        return;
      }
      setBed('crowd', 0.0, 1.1);
    },
    play: play,
    /* diagnostics, same spirit as BATTLE.info(): what actually booted */
    debug: function () {
      var b = [], o = {}, k, started = 0;
      for (k in beds) { b.push(k + (beds[k].kind === 'el' ? '*' : '')); if (beds[k].started) started += 1; }
      for (k in ones) o[k] = (ones[k].files || []).length;
      return { booted: booted, booting: booting, on: on, ctx: !!ctx, mode: FILE_MODE ? 'file' : 'http',
               beds: b, bedsStarted: started, ones: o, active: active };
    },
    melee: function () { play('clash'); },
    volley: function () { play('arrow'); }
  };
})();
