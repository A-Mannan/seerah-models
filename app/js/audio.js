/* Badr · the battle in 3D — a small procedural sound layer (no audio assets).
   Wind bed, a low field rumble, and the gravel-cast crack. Starts only on a user gesture. */
(function () {
  'use strict';
  var ctx = null, master = null, windGain = null, rumbleGain = null, on = false;

  function noiseBuffer(seconds) {
    var len = Math.floor(ctx.sampleRate * seconds);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  function bed(filterType, freq, q, gain) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer(4);
    src.loop = true;
    var f = ctx.createBiquadFilter();
    f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    var g = ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
    return g;
  }
  function ensure() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.0; master.connect(ctx.destination);
    windGain = bed('lowpass', 420, 0.6, 0.34);
    rumbleGain = bed('bandpass', 90, 0.9, 0.0);
    bed('bandpass', 240, 0.6, 0.014); /* distant field murmur */
    var lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    var lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(windGain.gain);
    lfo.start();
    return true;
  }
  function ramp(node, v, t) {
    node.gain.cancelScheduledValues(ctx.currentTime);
    node.gain.linearRampToValueAtTime(v, ctx.currentTime + (t || 0.6));
  }
  function crack() {
    if (!ctx || !on) return;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.22);
    var f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.setValueAtTime(1800, ctx.currentTime);
    f.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.2);
    f.Q.value = 1.2;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.24);
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
  }
  /* sword clang: two detuned metallic pings */
  function clang() {
    if (!ctx) return;
    var base = 900 + Math.random() * 700;
    [1, 2.41, 3.77].forEach(function (m, k) {
      var o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = base * m * (0.98 + Math.random() * 0.04);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.05 / (k + 1), ctx.currentTime + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14 + Math.random() * 0.1);
      o.connect(g); g.connect(master);
      o.start(); o.stop(ctx.currentTime + 0.3);
    });
  }
  /* arrow release: short bright flick */
  function twang() {
    if (!ctx) return;
    var o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(340 + Math.random() * 120, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.09);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    o.connect(g); g.connect(master);
    o.start(); o.stop(ctx.currentTime + 0.14);
  }
  window.SOUND = {
    start: function () {
      if (!ensure()) return false;
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    },
    setOn: function (v) {
      on = !!v;
      if (!on) { if (master) ramp(master, 0.0, 0.4); return; }
      /* the context is created/resumed only by S.start() from a real user gesture */
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        ramp(master, 0.16, 0.8);
      }
    },
    isOn: function () { return on; },
    /* a battle page passes its own cue table: { rumble, time, crack } per phase */
    cue: function (i, table) {
      if (!ctx || !on) return;
      var c = table && table[i];
      if (c) {
        if (c.rumble !== undefined) ramp(rumbleGain, c.rumble, c.time || 0.9);
        if (c.crack) crack();
        return;
      }
      /* the clash swells, the gravel cast cracks, the rout fades */
      if (i === 3) ramp(rumbleGain, 0.26, 0.9);
      else if (i === 4) { crack(); ramp(rumbleGain, 0.36, 0.5); }
      else if (i === 5) ramp(rumbleGain, 0.2, 0.9);
      else ramp(rumbleGain, 0.0, 1.1);
    },
    melee: function () { if (ctx && on) clang(); },
    volley: function () { if (ctx && on) twang(); }
  };
})();
