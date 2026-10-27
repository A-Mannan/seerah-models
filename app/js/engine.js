/* seerah-models · shared battle engine.
   Everything a battle scene needs that is not Badr-specific: renderer boot,
   dawn sky and lights, heightfield terrain, prop builders (wells, ridge tents,
   rocks, scrub, palms, animals, arrows), the static merge, the instanced crowd
   with its gait, the label pass, the camera director (shot list, orbit,
   pinch), the phase clock and the particle systems. A battle module (badr.js)
   supplies layout, choreography and copy.
   Standing rules live in AGENTS.md: the Prophet ﷺ is never depicted; no figure
   shows a face; nothing pushes to GitHub without the owner. */
(function () {
  'use strict';
  var ENGINE = window.ENGINE = {};
  if (!window.THREE) return;

  /* ------------------------------ small utils */
  ENGINE.util = {
    easeIO: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    clamp01: function (t) { return Math.max(0, Math.min(1, t)); },
    hash2: function (x, y) { var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); },
    smoothN: function (x, a, b) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  };
  var U = ENGINE.util;
  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = U.hash2(xi, yi), b = U.hash2(xi + 1, yi), c = U.hash2(xi, yi + 1), d = U.hash2(xi + 1, yi + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }
  function fbm(x, y, o) {
    var s = 0, a = 0.5, f = 1, i;
    for (i = 0; i < (o || 3); i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= 0.5; }
    return s;
  }
  ENGINE.vnoise = vnoise;
  ENGINE.fbm = fbm;

  /* ------------------------------ renderer boot */
  ENGINE.boot = function (opts) {
    opts = opts || {};
    var canvas = document.getElementById('gl');
    var labelBox = document.getElementById('labels');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function fail() {
      var d = document.createElement('div');
      d.className = 'gl-fail';
      d.textContent = opts.failText || 'The 3D model needs WebGL.';
      var old = document.querySelector('.gl-fail'); if (old) old.remove();
      document.body.appendChild(d);
    }
    if (!window.THREE || !canvas) { fail(); return null; }
    var MOBILE = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 700;
    ENGINE.mobile = MOBILE;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !MOBILE });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    if (opts.grade !== false) {
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = opts.exposure || 0.92;
    }
    renderer.setClearColor(opts.clear || 0x232936, 1);
    var scene = new THREE.Scene();
    scene.fog = opts.linearFog
      ? new THREE.Fog(opts.fogColor || 0x8a7355, opts.fogNear || 130, opts.fogFar || 460)
      : new THREE.FogExp2(opts.fogColor || 0xc39a6e, opts.fogDensity || (MOBILE ? 0.0046 : 0.0038));
    var camera = new THREE.PerspectiveCamera(opts.fov || 36, 1, 0.1, opts.far || 900);
    return { canvas: canvas, labelBox: labelBox, reduce: reduce, MOBILE: MOBILE, renderer: renderer, scene: scene, camera: camera };
  };

  /* ------------------------------ dawn sky + lights */
  ENGINE.dawn = function (ctx, opts) {
    opts = opts || {};
    var scene = ctx.scene;
    var sunDir = new THREE.Vector3(opts.sunX || 64, opts.sunY || 34, opts.sunZ || -46).normalize();
    var skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        top: { value: new THREE.Color(opts.skyTop || 0x1a2740) },
        mid: { value: new THREE.Color(opts.skyMid || 0x5d6a7d) },
        bot: { value: new THREE.Color(opts.skyBot || 0xdfae7c) },
        sunDir: { value: sunDir.clone() },
        sunCol: { value: new THREE.Color(0xffdda8) }
      },
      vertexShader: 'varying vec3 vW; void main(){ vW = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'uniform vec3 top, mid, bot, sunCol; uniform vec3 sunDir; varying vec3 vW;',
        'void main(){',
        '  float h = clamp(vW.y * 1.05 + 0.09, 0.0, 1.0);',
        '  vec3 c = mix(bot, mid, smoothstep(0.00, 0.26, h));',
        '  c = mix(c, top, smoothstep(0.20, 0.95, h));',
        '  float d = max(dot(vW, sunDir), 0.0);',
        '  c += sunCol * pow(d, 42.0) * 0.8;',
        '  c += sunCol * pow(d, 5.0) * 0.12;',
        '  c = pow(c, vec3(0.4545));',
        '  gl_FragColor = vec4(c, 1.0);',
        '}'
      ].join('\n')
    });
    var skyDome = new THREE.Mesh(new THREE.SphereGeometry(620, 32, 20), skyMat);
    skyDome.castShadow = false; skyDome.receiveShadow = false;
    scene.add(skyDome);

    var starGeo = new THREE.BufferGeometry();
    var starPos = new Float32Array(520 * 3);
    var r1, r2;
    for (var s = 0; s < 520; s++) {
      r1 = Math.random() * Math.PI * 2;
      r2 = Math.random() * Math.PI * 0.42 + 0.16;
      starPos[s * 3] = Math.cos(r1) * Math.sin(r2) * 560;
      starPos[s * 3 + 1] = Math.cos(r2) * 520 + 40;
      starPos[s * 3 + 2] = Math.sin(r1) * Math.sin(r2) * 560;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xdfe4ee, size: 2.0, sizeAttenuation: false, transparent: true, opacity: 0.13, fog: false }));
    scene.add(stars);

    function softDisc(inner, outer, tint) {
      var c = document.createElement('canvas');
      c.width = c.height = 64;
      var g = c.getContext('2d');
      var gr = g.createRadialGradient(32, 32, 1, 32, 32, 31);
      gr.addColorStop(0, inner);
      gr.addColorStop(0.45, outer);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      var tex = new THREE.CanvasTexture(c);
      return new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, color: tint || 0xffffff });
    }
    var moonGlow = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), softDisc('rgba(226,232,244,0.16)', 'rgba(160,176,200,0.05)', 0xcfd8e6));
    moonGlow.position.set(-160, 62, -240); moonGlow.lookAt(0, 0, 0);
    scene.add(moonGlow);
    var moonDisk = new THREE.Mesh(new THREE.CircleGeometry(5.4, 26), new THREE.MeshBasicMaterial({ color: 0xe9edf5, transparent: true, opacity: 0.18, fog: false }));
    moonDisk.position.set(-160, 62, -240);
    moonDisk.lookAt(0, 0, 0);
    scene.add(moonDisk);

    var hemi = new THREE.HemisphereLight(0x8fa8c8, 0x4a3826, 0.52);
    scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xffc089, 1.15);
    sun.position.set(opts.sunX || 64, opts.sunY || 34, opts.sunZ || -46);
    sun.castShadow = true;
    sun.shadow.mapSize.set(ctx.MOBILE ? 1024 : 2048, ctx.MOBILE ? 1024 : 2048);
    sun.shadow.camera.left = -72; sun.shadow.camera.right = 72;
    sun.shadow.camera.top = 72; sun.shadow.camera.bottom = -72;
    sun.shadow.camera.near = 5; sun.shadow.camera.far = 240;
    sun.shadow.bias = -0.0006;
    scene.add(sun); scene.add(sun.target);
    var fill = new THREE.DirectionalLight(0x7d8ea8, 0.3);
    fill.position.set(-40, 30, 40);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0xffd9b0, 0.4);
    rim.position.set(10, 14, 60);
    scene.add(rim);
    return { hemi: hemi, sun: sun, fill: fill, rim: rim, stars: stars, moonGlow: moonGlow, moonDisk: moonDisk };
  };

  /* ------------------------------ the build-q dawn sky.
     A vertex-gradient dome over a bright horizon, a low moon, stars and the
     four-light rig. Each battle passes its own palette; the shape is shared. */
  ENGINE.sky = function (ctx, opts) {
    opts = opts || {};
    var scene = ctx.scene, MOBILE = ctx.MOBILE;
    var R = opts.radius || 620;
    var skyGeo = new THREE.SphereGeometry(R, 32, 20);
    var skyPos = skyGeo.attributes.position;
    var skyCols = new Float32Array(skyPos.count * 3);
    var zen = new THREE.Color(opts.zenith || 0x24304a), hor = new THREE.Color(opts.horizon || 0x9a7850), tmp = new THREE.Color();
    for (var si = 0; si < skyPos.count; si++) {
      var yy = Math.max(0, Math.min(1, skyPos.getY(si) / R));
      tmp.copy(hor).lerp(zen, Math.pow(yy, opts.skyCurve || 0.55));
      skyCols[si * 3] = tmp.r; skyCols[si * 3 + 1] = tmp.g; skyCols[si * 3 + 2] = tmp.b;
    }
    skyGeo.setAttribute('color', new THREE.BufferAttribute(skyCols, 3));
    var dome = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
    dome.castShadow = false; dome.receiveShadow = false;
    scene.add(dome);

    var stars = null;
    var nStars = opts.stars === undefined ? 520 : opts.stars;
    if (nStars > 0) {
      var starGeo = new THREE.BufferGeometry();
      var starPos = new Float32Array(nStars * 3);
      for (var st = 0; st < nStars; st++) {
        var r1 = Math.random() * Math.PI * 2;
        var r2 = Math.random() * Math.PI * 0.42 + 0.16;
        starPos[st * 3] = Math.cos(r1) * Math.sin(r2) * (R - 60);
        starPos[st * 3 + 1] = Math.cos(r2) * (R - 100) + 40;
        starPos[st * 3 + 2] = Math.sin(r1) * Math.sin(r2) * (R - 60);
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xdfe4ee, size: 2.0, sizeAttenuation: false, transparent: true, opacity: opts.starOpacity === undefined ? 0.22 : opts.starOpacity, fog: false }));
      scene.add(stars);
    }

    var moonGlow = null, moonDisk = null;
    if (opts.moon !== false) {
      var mp = opts.moonPos || [-160, 62, -240];
      function softDisc(inner, outer, tint) {
        var c = document.createElement('canvas');
        c.width = c.height = 64;
        var g = c.getContext('2d');
        var gr = g.createRadialGradient(32, 32, 1, 32, 32, 31);
        gr.addColorStop(0, inner);
        gr.addColorStop(0.45, outer);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
        var tex = new THREE.CanvasTexture(c);
        return new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, color: tint || 0xffffff });
      }
      moonGlow = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), softDisc('rgba(226,232,244,0.25)', 'rgba(160,176,200,0.08)', 0xcfd8e6));
      moonGlow.position.set(mp[0], mp[1], mp[2]); moonGlow.lookAt(0, 0, 0);
      scene.add(moonGlow);
      moonDisk = new THREE.Mesh(new THREE.CircleGeometry(5.4, 26), new THREE.MeshBasicMaterial({ color: 0xe9edf5, transparent: true, opacity: opts.moonOpacity === undefined ? 0.3 : opts.moonOpacity, fog: false }));
      moonDisk.position.set(mp[0], mp[1], mp[2]);
      moonDisk.lookAt(0, 0, 0);
      scene.add(moonDisk);
    }

    var hemi = new THREE.HemisphereLight(opts.hemiSky || 0x8fa0b8, opts.hemiGround || 0x3a2f22, opts.hemi === undefined ? 0.44 : opts.hemi);
    scene.add(hemi);
    var sun = new THREE.DirectionalLight(opts.sunColor || 0xffc27d, opts.sun === undefined ? 0.9 : opts.sun);
    var sp = opts.sunPos || [64, 34, -46];
    sun.position.set(sp[0], sp[1], sp[2]);
    sun.castShadow = opts.shadows !== false;
    var sm = opts.shadowMap || (MOBILE ? 1024 : 2048);
    sun.shadow.mapSize.set(sm, sm);
    var sb = opts.shadowBounds || 72;
    sun.shadow.camera.left = -sb; sun.shadow.camera.right = sb;
    sun.shadow.camera.top = sb; sun.shadow.camera.bottom = -sb;
    sun.shadow.camera.near = 5; sun.shadow.camera.far = opts.shadowFar || 240;
    sun.shadow.bias = -0.0006;
    scene.add(sun); scene.add(sun.target);
    var fill = new THREE.DirectionalLight(opts.fillColor || 0x7d8ea8, opts.fill === undefined ? 0.2 : opts.fill);
    var fp = opts.fillPos || [-40, 30, 40];
    fill.position.set(fp[0], fp[1], fp[2]);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(opts.rimColor || 0xffd9b0, opts.rim === undefined ? 0.3 : opts.rim);
    var rp = opts.rimPos || [10, 14, 60];
    rim.position.set(rp[0], rp[1], rp[2]);
    scene.add(rim);
    return { dome: dome, stars: stars, moonGlow: moonGlow, moonDisk: moonDisk, hemi: hemi, sun: sun, fill: fill, rim: rim };
  };

  /* ------------------------------ heightfield terrain */
  function rippleNormal(renderer, size, repeat) {
    var c = document.createElement('canvas'); c.width = c.height = size;
    var ctx2 = c.getContext('2d');
    var img = ctx2.createImageData(size, size);
    function H(x, y) {
      return Math.sin(x * 0.38 + Math.sin(y * 0.055) * 4.2 + fbm(x * 0.02, y * 0.02, 2) * 5.0) * 0.30 + fbm(x * 0.05, y * 0.05, 3) * 2.2;
    }
    var i, x, y;
    for (y = 0; y < size; y++) {
      for (x = 0; x < size; x++) {
        var nx = H(x - 1, y) - H(x + 1, y);
        var ny = H(x, y - 1) - H(x, y + 1);
        var nz = 2.4, l = Math.hypot(nx, ny, nz);
        i = (y * size + x) * 4;
        img.data[i] = (nx / l * 0.5 + 0.5) * 255;
        img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255;
        img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
    ctx2.putImageData(img, 0, 0);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  ENGINE.heightfield = function (ctx, heightAt, opts) {
    opts = opts || {};
    var T = opts.size || 420, SEG = opts.seg || 168;
    var groundGeo = new THREE.PlaneGeometry(T, T, SEG, SEG);
    groundGeo.rotateX(-Math.PI / 2);
    var pos = groundGeo.attributes.position;
    var colors = new Float32Array(pos.count * 3);
    var cSand = new THREE.Color(opts.sand || 0x8a5c31), cCrest = new THREE.Color(opts.crest || 0xc0905c),
      cTrough = new THREE.Color(opts.trough || 0x46301c), cGrit = new THREE.Color(opts.grit || 0x6f5030);
    var tmp = new THREE.Color();
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i);
      var y = heightAt(x, z);
      pos.setY(i, y);
      var v = fbm(x * 0.07 + 3, z * 0.07 + 5, 3);
      var t = Math.min(1, Math.max(0, y * 0.30 + 0.32 + (v - 0.5) * 0.40));
      tmp.copy(cTrough).lerp(cSand, Math.min(1, t * 1.6)).lerp(cCrest, Math.max(0, t - 0.52) * 1.5);
      tmp.lerp(cGrit, fbm(x * 0.38, z * 0.38, 2) * 0.34);
      /* a battle may recolour by place (rock on the massif, sand on the plain);
         Badr passes nothing and keeps the plain height ramp */
      if (opts.colorAt) {
        var over = opts.colorAt(x, z, y, tmp);
        if (over) tmp.copy(over);
      }
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();
    /* under-floor lid: a huge disc below the sand so nothing shows beneath the terrain */
    var lid = new THREE.Mesh(new THREE.CircleGeometry(opts.lidR || 600, 48), new THREE.MeshBasicMaterial({ color: opts.lidColor || 0x2a251d }));
    lid.rotation.x = -Math.PI / 2;
    lid.position.y = opts.lidY || -6.5;
    ctx.scene.add(lid);
    var groundMat = opts.material || new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 1, metalness: 0,
      normalMap: rippleNormal(ctx.renderer, 256, opts.rippleRepeat || (ctx.MOBILE ? 30 : 42)),
      normalScale: new THREE.Vector2(0.24, 0.24)
    });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    ctx.scene.add(ground);
    return { ground: ground, lid: lid };
  };

  /* ------------------------------ the painted sand ground.
     Build q's sand: a canvas texture with wind scoring, a bump map and bright
     vertex colours over the heightfield. One texture per scene. */
  ENGINE.ground = function (ctx, heightAt, opts) {
    opts = opts || {};
    var size = opts.texSize || 1024;
    var c = document.createElement('canvas'); c.width = c.height = size;
    var g = c.getContext('2d');
    g.fillStyle = opts.base || '#eee6d4'; g.fillRect(0, 0, size, size);
    var img = g.getImageData(0, 0, size, size), d = img.data;
    var grain = opts.grain === undefined ? 22 : opts.grain;
    for (var i = 0; i < d.length; i += 4) {
      var n = (Math.random() - 0.5) * grain;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
    g.globalAlpha = opts.scoreAlpha === undefined ? 0.07 : opts.scoreAlpha;
    for (var k = 0; k < 160; k++) {
      g.strokeStyle = k % 2 ? (opts.light || '#fff8e8') : (opts.dark || '#6b5f4a');
      g.lineWidth = 1 + Math.random() * 2.4;
      g.beginPath();
      var yy = Math.random() * size;
      g.moveTo(0, yy);
      for (var x = 0; x <= size; x += 32) {
        g.lineTo(x, yy + Math.sin(x * 0.018 + k) * 7 + Math.sin(x * 0.004 + k * 2.3) * 18);
      }
      g.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(opts.repeat || 26, opts.repeat || 26);
    tex.anisotropy = ctx.renderer.capabilities.getMaxAnisotropy();
    var mat = opts.material || new THREE.MeshPhongMaterial({
      vertexColors: true, map: tex, bumpMap: tex,
      bumpScale: opts.bumpScale === undefined ? 0.12 : opts.bumpScale, shininess: 0
    });
    var field = ENGINE.heightfield(ctx, heightAt, {
      material: mat,
      size: opts.size, seg: opts.seg,
      sand: opts.sand === undefined ? 0xd3bf9b : opts.sand,
      crest: opts.crest === undefined ? 0xe0cda8 : opts.crest,
      trough: opts.trough === undefined ? 0xb3a284 : opts.trough,
      grit: opts.grit === undefined ? 0xc4b393 : opts.grit,
      colorAt: opts.colorAt,
      lidColor: opts.lidColor, lidY: opts.lidY
    });
    return { tex: tex, material: mat, ground: field.ground, lid: field.lid };
  };

  /* ------------------------------ volcanic ground (Khaybar's harrat).
     Same path as ENGINE.ground — canvas texture riding the heightfield's
     opts.material hook — but dark basalt: angular contraction cracks, pale
     felsic flecks and a near-flat ramp so the black rock stays matte under
     the one dawn key. Fully optional; Badr's plain ground is untouched. */
  ENGINE.groundBasalt = function (ctx, heightAt, opts) {
    opts = opts || {};
    var size = opts.texSize || 1024;
    var c = document.createElement('canvas'); c.width = c.height = size;
    var g = c.getContext('2d');
    g.fillStyle = opts.base || '#37332f'; g.fillRect(0, 0, size, size);
    var img = g.getImageData(0, 0, size, size), d = img.data;
    var grain = opts.grain === undefined ? 30 : opts.grain;
    for (var i = 0; i < d.length; i += 4) {
      var n = (Math.random() - 0.5) * grain;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
    /* felsic flecks: light mineral specks scattered over the dark flow */
    g.fillStyle = opts.fleck || 'rgba(168,160,148,0.16)';
    for (var f = 0; f < 1400; f++) {
      var fx = Math.random() * size, fy = Math.random() * size, fr = 0.6 + Math.random() * 2.2;
      g.fillRect(fx, fy, fr, fr * 0.6);
    }
    /* contraction cracks: jagged angular polylines, darker than the base */
    g.strokeStyle = opts.crack || 'rgba(16,14,12,0.55)';
    g.lineCap = 'round';
    for (var k = 0; k < 90; k++) {
      g.lineWidth = 1 + Math.random() * 2.0;
      g.beginPath();
      var cx = Math.random() * size, cy = Math.random() * size;
      var a = Math.random() * Math.PI * 2;
      g.moveTo(cx, cy);
      var legs = 3 + Math.floor(Math.random() * 5);
      for (var l = 0; l < legs; l++) {
        a += (Math.random() - 0.5) * 1.5;
        var len = 18 + Math.random() * 52;
        cx += Math.cos(a) * len; cy += Math.sin(a) * len;
        g.lineTo(cx, cy);
      }
      g.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(opts.repeat || 22, opts.repeat || 22);
    tex.anisotropy = ctx.renderer.capabilities.getMaxAnisotropy();
    var mat = opts.material || new THREE.MeshPhongMaterial({
      vertexColors: true, map: tex, bumpMap: tex,
      bumpScale: opts.bumpScale === undefined ? 0.18 : opts.bumpScale, shininess: 0
    });
    var field = ENGINE.heightfield(ctx, heightAt, {
      material: mat,
      size: opts.size, seg: opts.seg,
      sand: opts.sand === undefined ? 0x4b453e : opts.sand,
      crest: opts.crest === undefined ? 0x5d564e : opts.crest,
      trough: opts.trough === undefined ? 0x2c2823 : opts.trough,
      grit: opts.grit === undefined ? 0x413b34 : opts.grit,
      colorAt: opts.colorAt,
      lidColor: opts.lidColor === undefined ? 0x1a1713 : opts.lidColor, lidY: opts.lidY
    });
    return { tex: tex, material: mat, ground: field.ground, lid: field.lid };
  };

  /* ------------------------------ static merge */
  function isMergeable(o) {
    var mm = o.material;
    if (!mm || Array.isArray(mm) || !mm.isMeshLambertMaterial) return false;
    if (mm.map || mm.transparent || mm.opacity < 1) return false;
    if (!o.geometry || !o.geometry.attributes.position) return false;
    return true;
  }
  function collectMergeable(root) {
    var out = [];
    root.traverse(function (o) {
      if (!o.isMesh || o.isInstancedMesh) return;
      var p = o;
      while (p && p !== root) { if (p.userData && (p.userData.keep || p.userData.dynamicRoot)) return; p = p.parent; }
      if (isMergeable(o)) out.push(o);
    });
    return out;
  }
  function mergeMeshList(items, root, local) {
    if (!items.length) return;
    var inv = new THREE.Matrix4();
    if (local) { root.updateMatrixWorld(true); inv.copy(root.matrixWorld).invert(); }
    var groups = {};
    items.forEach(function (o) {
      var mm = o.material;
      var sig = [mm.emissive ? mm.emissive.getHex() : 0, mm.side, mm.flatShading ? 1 : 0, o.castShadow ? 1 : 0, o.receiveShadow ? 1 : 0].join('|');
      if (!groups[sig]) groups[sig] = { mat: mm, cast: o.castShadow, recv: o.receiveShadow, list: [] };
      groups[sig].list.push(o);
    });
    Object.keys(groups).forEach(function (sig) {
      var G = groups[sig];
      var pos = [], norm = [], col = [], idx = [], off = 0;
      var m = new THREE.Matrix4(), v = new THREE.Vector3(), nv = new THREE.Vector3();
      G.list.forEach(function (o) {
        o.updateMatrixWorld(true);
        if (local) m.multiplyMatrices(inv, o.matrixWorld); else m.copy(o.matrixWorld);
        var g = o.geometry, p = g.attributes.position;
        if (!g.attributes.normal) g.computeVertexNormals();
        var n = g.attributes.normal;
        var c = o.material.color;
        for (var i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i).applyMatrix4(m);
          pos.push(v.x, v.y, v.z);
          nv.fromBufferAttribute(n, i).transformDirection(m);
          norm.push(nv.x, nv.y, nv.z);
          col.push(c.r, c.g, c.b);
        }
        if (g.index) {
          for (var j = 0; j < g.index.count; j++) idx.push(g.index.array[j] + off);
        } else {
          for (var j2 = 0; j2 < p.count; j2++) idx.push(j2 + off);
        }
        off += p.count;
      });
      var bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      bg.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
      bg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      bg.setIndex(idx);
      var mat = new THREE.MeshLambertMaterial({
        vertexColors: true,
        emissive: G.mat.emissive ? G.mat.emissive.clone() : new THREE.Color(0x000000),
        side: G.mat.side,
        flatShading: !!G.mat.flatShading
      });
      var mesh = new THREE.Mesh(bg, mat);
      mesh.castShadow = G.cast; mesh.receiveShadow = G.recv;
      mesh.frustumCulled = false;
      root.add(mesh);
      G.list.forEach(function (o) { if (o.parent) o.parent.remove(o); });
    });
  }
  /* mergeParts: bake a list of {geo, p, r, c} into one vertex-coloured geometry */
  function mergeParts(parts) {
    var pos = [], norm = [], col = [], idx = [], off = 0;
    var m = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3();
    parts.forEach(function (part) {
      var g = part.geo;
      m.compose(
        new THREE.Vector3(part.p[0], part.p[1], part.p[2]),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(part.r ? part.r[0] : 0, part.r ? part.r[1] : 0, part.r ? part.r[2] : 0)),
        new THREE.Vector3(1, 1, 1)
      );
      nm.getNormalMatrix(m);
      var p = g.attributes.position, n = g.attributes.normal;
      for (var i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m);
        pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
        norm.push(v.x, v.y, v.z);
        col.push(part.c.r, part.c.g, part.c.b);
      }
      if (g.index) {
        for (var k = 0; k < g.index.count; k++) idx.push(g.index.array[k] + off);
      } else {
        for (var k2 = 0; k2 < p.count; k2++) idx.push(k2 + off);
      }
      off += p.count;
    });
    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
    out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    out.setIndex(idx);
    return out;
  }
  /* bake a small rigid group into one vertex-coloured mesh (one draw call) */
  function bakeToMesh(root, rough) {
    root.updateMatrixWorld(true);
    var inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    var m = new THREE.Matrix4(), v = new THREE.Vector3(), nv = new THREE.Vector3();
    var posA = [], norA = [], colA = [], idx = [], off = 0;
    var grey = new THREE.Color(0x888888);
    root.traverse(function (o) {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      m.multiplyMatrices(inv, o.matrixWorld);
      var g = o.geometry, p = g.attributes.position;
      if (!g.attributes.normal) g.computeVertexNormals();
      var c = (o.material && o.material.color) || grey;
      for (var i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m);
        posA.push(v.x, v.y, v.z);
        nv.fromBufferAttribute(g.attributes.normal, i).transformDirection(m).normalize();
        norA.push(nv.x, nv.y, nv.z);
        colA.push(c.r, c.g, c.b);
      }
      if (g.index) { for (var k = 0; k < g.index.count; k++) idx.push(g.index.array[k] + off); }
      else { for (var k2 = 0; k2 < p.count; k2++) idx.push(k2 + off); }
      off += p.count;
    });
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(norA, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3));
    geo.setIndex(idx);
    var mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rough || 0.95, metalness: 0, flatShading: true }));
    mesh.castShadow = true;
    return mesh;
  }
  ENGINE.merge = { isMergeable: isMergeable, collectMergeable: collectMergeable, mergeMeshList: mergeMeshList, mergeParts: mergeParts, bakeToMesh: bakeToMesh };

  /* ------------------------------ the shared cast.
     A band is a stand of spears under one banner; a champion's standard is the
     pole and the cloth alone; an event standard marks a named act without a
     figure. The faceless fighter is the approved maquette body (no eyes, nose
     or mouth). Every battle uses these builders; none draws a face. */
  ENGINE.cast = function (ctx, opts) {
    opts = opts || {};
    var scene = ctx.scene;
    var poleM = new THREE.MeshLambertMaterial({ color: 0x6b5f4a });
    var poleQ = new THREE.MeshLambertMaterial({ color: 0x2c271f });
    var ironM = new THREE.MeshLambertMaterial({ color: 0x9a9382 });
    var ironQ = new THREE.MeshLambertMaterial({ color: 0x565043 });
    var brassM = new THREE.MeshLambertMaterial({ color: 0xc39a33, emissive: 0x241804 });
    var clothM = new THREE.MeshLambertMaterial({ color: 0xf2ead8, side: THREE.DoubleSide, emissive: 0x3d3529 });
    var clothQ = new THREE.MeshLambertMaterial({ color: 0x342c22, side: THREE.DoubleSide, emissive: 0x0d0a07 });
    var shieldM = new THREE.MeshLambertMaterial({ color: 0xb5a583, side: THREE.DoubleSide });
    var shieldQ = new THREE.MeshLambertMaterial({ color: 0x4a4132, side: THREE.DoubleSide });
    var skinM = new THREE.MeshLambertMaterial({ color: 0x9a7a5c });
    var leatherM = new THREE.MeshLambertMaterial({ color: 0x4a3a28 });
    var steelM = new THREE.MeshLambertMaterial({ color: 0xb9b4a6 });
    var woundM = new THREE.MeshLambertMaterial({ color: 0x5e2b22 });
    var sandalM = new THREE.MeshLambertMaterial({ color: 0xd8c7a4 });
    var woodM = new THREE.MeshLambertMaterial({ color: 0x5c4f3a });
    var WAVERS = [];

    function seedRand(seed) {
      var t = seed + 0x6D2B79F5;
      return function () {
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function vPart(parent, geo, mat, x, y, z, rx, ry, rz) {
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx || 0, ry || 0, rz || 0);
      m.castShadow = true; m.receiveShadow = true;
      parent.add(m);
      return m;
    }
    function vSpear(parent) {
      var w = new THREE.Group();
      var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 2.0, 5), woodM);
      shaft.position.y = 0.72; w.add(shaft);
      var tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 4), brassM);
      tip.position.y = 1.78; w.add(tip);
      var butt = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4), brassM);
      butt.position.y = -0.32; butt.rotation.x = Math.PI; w.add(butt);
      w.traverse(function (o) { if (o.isMesh) { o.castShadow = true; } });
      parent.add(w); return w;
    }
    function vSword(parent) {
      var w = new THREE.Group();
      var blade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.72, 0.012), steelM);
      blade.position.y = 0.4; w.add(blade);
      var guard = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.03, 0.045), brassM);
      guard.position.y = 0.05; w.add(guard);
      var hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.16, 5), leatherM);
      hilt.position.y = -0.05; w.add(hilt);
      w.traverse(function (o) { if (o.isMesh) { o.castShadow = true; } });
      parent.add(w); return w;
    }
    function vShield(parent) {
      var s = new THREE.Group();
      var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.035, 12), new THREE.MeshLambertMaterial({ color: 0x5a4f3c }));
      disc.rotation.x = Math.PI / 2; s.add(disc);
      var rimT = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.015, 5, 14), leatherM);
      s.add(rimT);
      var boss = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), brassM);
      boss.position.z = 0.03; s.add(boss);
      s.position.set(-0.1, -0.34, 0.06);
      s.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      parent.add(s); return s;
    }

    function makeFighter(o) {
      var g = new THREE.Group();
      var robe = new THREE.MeshLambertMaterial({ color: o.robe });
      var robeDark = new THREE.MeshLambertMaterial({ color: o.robeDark });
      vPart(g, new THREE.CylinderGeometry(0.16, 0.2, 0.55, 7), robe, 0, 0.95, 0);
      vPart(g, new THREE.CylinderGeometry(0.2, 0.27, 0.38, 7), robeDark, 0, 0.6, 0);
      vPart(g, new THREE.CylinderGeometry(0.21, 0.21, 0.06, 7), leatherM, 0, 0.79, 0);
      vPart(g, new THREE.CylinderGeometry(0.05, 0.06, 0.1, 6), skinM, 0, 1.26, 0);
      vPart(g, new THREE.SphereGeometry(0.12, 8, 6), skinM, 0, 1.36, 0);
      if (o.helmet) {
        vPart(g, new THREE.SphereGeometry(0.135, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), steelM, 0, 1.4, 0);
        vPart(g, new THREE.ConeGeometry(0.022, 0.1, 4), steelM, 0, 1.56, 0);
        vPart(g, new THREE.BoxGeometry(0.025, 0.12, 0.02), steelM, 0, 1.35, 0.125);
      } else {
        vPart(g, new THREE.CylinderGeometry(0.14, 0.14, 0.09, 8), robeDark, 0, 1.44, 0);
        vPart(g, new THREE.SphereGeometry(0.135, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), robeDark, 0, 1.39, 0);
      }
      vPart(g, new THREE.SphereGeometry(0.07, 6, 5), robe, 0.18, 1.16, 0);
      vPart(g, new THREE.SphereGeometry(0.07, 6, 5), robe, -0.18, 1.16, 0);
      vPart(g, new THREE.CylinderGeometry(0.06, 0.07, 0.55, 5), robeDark, 0.09, 0.28, 0);
      vPart(g, new THREE.CylinderGeometry(0.06, 0.07, 0.55, 5), robeDark, -0.09, 0.28, 0);
      vPart(g, new THREE.BoxGeometry(0.11, 0.06, 0.2), leatherM, 0.09, 0.03, 0.04);
      vPart(g, new THREE.BoxGeometry(0.11, 0.06, 0.2), leatherM, -0.09, 0.03, 0.04);
      function arm(sx) {
        var a = new THREE.Group();
        a.position.set(sx * 0.18, 1.16, 0);
        g.add(a);
        vPart(a, new THREE.CylinderGeometry(0.05, 0.055, 0.3, 5), robe, 0, -0.15, 0);
        vPart(a, new THREE.CylinderGeometry(0.045, 0.05, 0.28, 5), skinM, 0, -0.42, 0);
        vPart(a, new THREE.SphereGeometry(0.055, 6, 5), skinM, 0, -0.58, 0.02);
        return a;
      }
      var armR = arm(1), armL = arm(-1);
      vPart(armR, new THREE.CylinderGeometry(0.06, 0.06, 0.05, 6), woundM, 0, -0.02, 0);
      var stump = vPart(g, new THREE.CylinderGeometry(0.06, 0.07, 0.09, 6), woundM, 0.18, 1.11, 0);
      stump.visible = false;
      /* the stepping leg: a shin and foot that swings forward onto the severed arm */
      var stepLeg = new THREE.Group();
      stepLeg.position.set(0.18, 0.62, 0.0);
      g.add(stepLeg);
      vPart(stepLeg, new THREE.CylinderGeometry(0.075, 0.085, 0.3, 5), robeDark, 0, -0.12, 0.08, 0.45, 0, 0);
      vPart(stepLeg, new THREE.CylinderGeometry(0.06, 0.07, 0.32, 5), robeDark, 0, -0.36, 0.22, -0.2, 0, 0);
      vPart(stepLeg, new THREE.BoxGeometry(0.14, 0.07, 0.24), sandalM, 0, -0.55, 0.30);
      vPart(stepLeg, new THREE.BoxGeometry(0.16, 0.025, 0.27), sandalM, 0, -0.59, 0.31);
      stepLeg.visible = false;
      var weaponR = null, weaponL = null;
      if (o.weapon === 'spear') { weaponR = vSpear(armR); weaponR.position.set(0, -0.58, 0.06); }
      if (o.weapon === 'sword') { weaponR = vSword(armR); weaponR.position.set(0, -0.58, 0.06); }
      if (o.leftWeapon === 'spear') { weaponL = vSpear(armL); weaponL.position.set(0, -0.58, 0.06); }
      if (o.leftWeapon === 'sword') { weaponL = vSword(armL); weaponL.position.set(0, -0.58, 0.06); }
      if (o.shield) vShield(armL);
      var sc = o.scale || 1;
      g.scale.setScalar(sc);
      g.position.set(o.x, o.y || 0, o.z);
      g.rotation.y = o.ry || 0;
      scene.add(g);
      return { group: g, armR: armR, armL: armL, weaponR: weaponR, weaponL: weaponL, stump: stump, stepLeg: stepLeg, scale: sc, baseY: o.y || 0 };
    }

    function banner(side, g, champion, rnd) {
      var ph = side ? poleQ : poleM;
      var iron = side ? ironQ : ironM;
      var clothMat = side ? clothQ : clothM;
      var poleH = champion ? 4.15 : 3.45;
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(champion ? 0.13 : 0.08, champion ? 0.18 : 0.11, poleH, 7), ph);
      pole.position.y = poleH / 2;
      g.add(pole);
      var shoe = new THREE.Mesh(new THREE.CylinderGeometry(champion ? 0.18 : 0.12, champion ? 0.24 : 0.15, champion ? 0.18 : 0.1, 7), brassM);
      shoe.position.y = champion ? 0.09 : 0.05;
      g.add(shoe);
      var fin = new THREE.Mesh(new THREE.SphereGeometry(champion ? 0.14 : 0.075, 8, 6), brassM);
      fin.position.y = poleH + 0.05;
      g.add(fin);
      var tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 6), brassM);
      tip.position.y = poleH + 0.2;
      g.add(tip);
      var cw = champion ? 2.05 : 1.65, chh = champion ? 1.2 : 0.95;
      var barLen = cw * 0.62;
      var bar = new THREE.Mesh(new THREE.CylinderGeometry(champion ? 0.052 : 0.04, champion ? 0.052 : 0.04, barLen, 5), ph);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0.18 + barLen / 2, poleH - 0.1, 0);
      g.add(bar);
      var geo = new THREE.PlaneGeometry(cw, chh, 12, 8);
      var pa = geo.attributes.position;
      for (var vi = 0; vi < pa.count; vi++) {
        var vx = pa.getX(vi), vy = pa.getY(vi);
        var u = (vx + cw / 2) / cw;
        if (vy > 0) pa.setY(vi, vy - u * u * 0.1);
      }
      geo.computeVertexNormals();
      var cloth = new THREE.Mesh(geo, clothMat);
      cloth.position.set(0.16 + cw / 2, poleH - 0.2 - chh / 2, 0);
      cloth.castShadow = true;
      cloth.receiveShadow = false;
      g.add(cloth);
      for (var lp = 0; lp < 3; lp++) {
        var loop = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.011, 5, 8), brassM);
        loop.position.set(0.3 + lp * (barLen - 0.2) / 2, poleH - 0.14, 0);
        g.add(loop);
      }
      [0.18, 0.18 + barLen].forEach(function (tx) {
        var tas = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.2, 5), brassM);
        tas.position.set(tx, poleH - 0.28, 0);
        tas.rotation.x = Math.PI;
        g.add(tas);
      });
      var rose = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 10), brassM);
      rose.rotation.x = Math.PI / 2;
      rose.position.set(0, poleH - 0.62, 0.06);
      g.add(rose);
      WAVERS.push({ mesh: cloth, base: geo.attributes.position.array.slice(0), w: cw, phase: rnd() * 6.28 });
      if (champion) return;
      var nSp = side ? 7 : 3;
      for (var k = 0; k < nSp; k++) {
        var h = 1.9 + rnd() * 0.4;
        var sp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, h, 5), iron);
        var a = rnd() * Math.PI * 2, rr = 0.15 + rnd() * 0.5;
        sp.position.set(Math.cos(a) * rr, h / 2, Math.sin(a) * rr);
        sp.rotation.set((rnd() - 0.5) * 0.08, 0, (rnd() - 0.5) * 0.08);
        sp.castShadow = true;
        g.add(sp);
        var tipH = 0.2;
        var blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, tipH, 0.022), iron);
        blade.position.set(sp.position.x, h + tipH / 2, sp.position.z);
        g.add(blade);
        var collar = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.05, 5), brassM);
        collar.position.set(sp.position.x, h - 0.03, sp.position.z);
        g.add(collar);
      }
      var nSh = side ? 2 : 1;
      for (var sh = 0; sh < nSh; sh++) {
        var shm = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 14), side ? shieldQ : shieldM);
        shm.position.set(-0.55 + sh * 0.85, 0.5, 0.55 - sh * 0.18);
        shm.rotation.x = Math.PI / 2 - 0.08;
        shm.rotation.z = 0.04;
        g.add(shm);
        var boss = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), brassM);
        boss.position.set(-0.55 + sh * 0.85, 0.5, 0.66 - sh * 0.18);
        g.add(boss);
      }
      if (side) {
        for (var hl = 0; hl < 2; hl++) {
          var helm = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), ironM);
          helm.position.set(0.3 + hl * 0.3, 0.13, -0.5 - hl * 0.25);
          g.add(helm);
        }
      } else {
        var rest = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), ironM);
        rest.position.set(0.75, 0.14, -0.45);
        rest.rotation.y = 0.8;
        g.add(rest);
        var jar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.34, 8), new THREE.MeshLambertMaterial({ color: 0x8a7a5a }));
        jar.position.set(0.45, 0.17, 0.55);
        g.add(jar);
      }
    }

    function band(side, x, z, label, entry) {
      var g = new THREE.Group();
      banner(side, g, false, seedRand(Math.round((x + 100) * 733 + (z + 100) * 191)));
      g.position.set(x, 0, z);
      g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(g);
      return { side: side, group: g, flag: g.children[4], phase: Math.random() * 6.28, home: [x, z], label: label || null, entry: entry || null, isChampion: false };
    }
    function championUnit(side, x, z, label, entry) {
      var g = new THREE.Group();
      banner(side, g, true, seedRand(Math.round((x + 200) * 311 + (z + 200) * 97)));
      g.position.set(x, 0, z);
      g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(g);
      return { side: side, group: g, flag: g.children[4], phase: Math.random() * 6.28, home: [x, z], label: label || null, entry: entry || null, isChampion: true, hideAfterPhase: 1 };
    }

    /* a named act marked by a standard or a spear, never by a figure */
    function eventStandard(x, z, side, tilt, fallen, parent) {
      var g = new THREE.Group();
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 3.2, 6), poleM);
      pole.position.y = 1.6;
      g.add(pole);
      var cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.6),
        new THREE.MeshLambertMaterial({ color: side ? 0x2b2620 : 0xe8e2d2, side: THREE.DoubleSide }));
      cloth.position.set(0.46, 2.72, 0);
      g.add(cloth);
      var tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), brassM);
      tip.position.y = 3.3;
      g.add(tip);
      g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      if (fallen) { g.rotation.z = 1.25; g.position.set(x, 0.18, z); }
      else { g.rotation.z = tilt || 0; g.position.set(x, 0, z); }
      (parent || scene).add(g);
      return g;
    }

    return {
      mats: { poleM: poleM, poleQ: poleQ, ironM: ironM, ironQ: ironQ, brassM: brassM, clothM: clothM, clothQ: clothQ,
        shieldM: shieldM, shieldQ: shieldQ, skinM: skinM, leatherM: leatherM, steelM: steelM, woundM: woundM,
        sandalM: sandalM, woodM: woodM },
      wavers: WAVERS,
      seedRand: seedRand,
      makeFighter: makeFighter,
      vPart: vPart, vSpear: vSpear, vSword: vSword, vShield: vShield,
      banner: banner, band: band, championUnit: championUnit, eventStandard: eventStandard
    };
  };

  /* ------------------------------ props */
  ENGINE.props = function (ctx, heightAt) {
    var scene = ctx.scene;
    var stoneM = new THREE.MeshLambertMaterial({ color: 0x8d8371 });
    var stoneDark = new THREE.MeshLambertMaterial({ color: 0x6b6354 });
    var waterM = new THREE.MeshLambertMaterial({ color: 0x2f3a3d });
    var woodM = new THREE.MeshLambertMaterial({ color: 0x5c4f3a });
    var ropeM = new THREE.MeshLambertMaterial({ color: 0x8a7a5a });
    var H = U.hash2;

    function well(wx, wz, big) {
      var g = new THREE.Group();
      var R = big ? 1.12 : 0.94, WH = big ? 1.06 : 0.92;
      var per = big ? 16 : 13;
      var bw = (2 * Math.PI * R / per) * 1.02;
      var wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 1.03, WH, 20, 1, true), stoneDark);
      wall.position.y = WH / 2; wall.castShadow = true; wall.receiveShadow = true;
      g.add(wall);
      for (var c = 0; c < 3; c++) {
        for (var k = 0; k < per; k++) {
          var a = (k + (c % 2 ? 0.5 : 0)) / per * Math.PI * 2;
          var bh = 0.26 + H(k + 9, c) * 0.05;
          var b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.15), c % 2 ? stoneM : stoneDark);
          b.position.set(Math.cos(a) * (R + 0.04), 0.15 + c * (WH / 3) + H(k, c + 2) * 0.012, Math.sin(a) * (R + 0.04));
          b.rotation.y = -a + Math.PI / 2;
          b.rotation.z = (H(k, c + 5) - 0.5) * 0.03;
          b.castShadow = true; b.receiveShadow = true;
          g.add(b);
        }
      }
      for (var rr = 0; rr < per; rr++) {
        var ra = rr / per * Math.PI * 2;
        var cap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.32), stoneDark);
        cap.position.set(Math.cos(ra) * (R + 0.02), WH + 0.02, Math.sin(ra) * (R + 0.02));
        cap.rotation.y = -ra + Math.PI / 2;
        cap.castShadow = true;
        g.add(cap);
      }
      var mouth = new THREE.Mesh(new THREE.CircleGeometry(R - 0.15, 18), new THREE.MeshLambertMaterial({ color: 0x100c08 }));
      mouth.rotation.x = -Math.PI / 2; mouth.position.y = WH - 0.03; g.add(mouth);
      var water = new THREE.Mesh(new THREE.CircleGeometry(R - 0.22, 16), waterM);
      water.rotation.x = -Math.PI / 2; water.position.y = WH - 0.05; g.add(water);
      for (var s2 = 0; s2 < 10; s2++) {
        var sa = s2 / 10 * Math.PI * 2 + 0.3;
        var st = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15 + H(s2, 3) * 0.07, 0), stoneDark);
        st.position.set(Math.cos(sa) * (R + 0.32), 0.07, Math.sin(sa) * (R + 0.32));
        st.rotation.set(H(s2, 1) * 3, H(s2, 2) * 3, H(s2, 3) * 3);
        st.scale.y = 0.6;
        st.castShadow = true;
        g.add(st);
      }
      if (big) {
        var p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 1.66, 7), woodM);
        p1.position.set(-0.82, 0.83, 0); p1.rotation.z = 0.045; p1.castShadow = true; g.add(p1);
        var p2 = p1.clone(); p2.position.x = 0.82; p2.rotation.z = -0.045; g.add(p2);
        var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.74, 6), woodM);
        beam.rotation.z = Math.PI / 2; beam.position.y = 1.6; beam.castShadow = true; g.add(beam);
        var rope = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.9, 4), ropeM);
        rope.position.set(0.1, 1.14, 0); g.add(rope);
        var bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.2, 8), woodM);
        bucket.position.set(0.1, 0.62, 0); bucket.castShadow = true; g.add(bucket);
      }
      g.position.set(wx, heightAt(wx, wz), wz);
      g.rotation.y = 0.5;
      scene.add(g); return g;
    }

    function ridgeTent(x, z, dark, w, d, h) {
      w = w || 3.6; d = d || 4.4; h = h || 1.3;
      var g = new THREE.Group();
      var feltM = new THREE.MeshLambertMaterial({ color: dark ? 0x4b4437 : 0xb9ac92, side: THREE.DoubleSide });
      var innerM = new THREE.MeshLambertMaterial({ color: 0x16100b, side: THREE.DoubleSide });
      var wallM = new THREE.MeshLambertMaterial({ color: dark ? 0x322c23 : 0x8f826a, side: THREE.DoubleSide });
      function roof(scale, dy, mat, sagAmt) {
        var nu = 16, nz = 12;
        var geo = new THREE.BufferGeometry();
        var vs = [], idx = [], uvs = [], iz, iu;
        for (iz = 0; iz <= nz; iz++) {
          var t = iz / nz;
          var ridgedip = 1 - 0.16 * Math.pow(Math.abs(t - 0.5) * 2, 4);
          for (iu = 0; iu <= nu; iu++) {
            var u = iu / nu;
            var arch = Math.pow(1 - Math.abs(u * 2 - 1), 1.45);
            var X = (u - 0.5) * w * scale;
            var Y = h * ridgedip * arch + dy;
            Y -= sagAmt * Math.sin(u * Math.PI) * (0.45 + 0.55 * Math.sin(t * Math.PI));
            var Z = (t - 0.5) * d;
            vs.push(X, Math.max(0.02, Y), Z);
            uvs.push(u, t);
          }
        }
        for (iz = 0; iz < nz; iz++) {
          for (iu = 0; iu < nu; iu++) {
            var a = iz * (nu + 1) + iu, b = a + 1, c = a + nu + 1, dd = c + 1;
            idx.push(a, c, b, b, c, dd);
          }
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vs, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        var m = new THREE.Mesh(geo, mat);
        m.castShadow = true;
        return m;
      }
      g.add(roof(0.90, -0.08, innerM, 0.09));
      g.add(roof(1.0, 0, feltM, 0.12));
      var back = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.98, h * 0.95, 8, 6), wallM);
      var bp = back.geometry.attributes.position;
      for (var bi = 0; bi < bp.count; bi++) {
        var bx = bp.getX(bi), by = bp.getY(bi);
        var arch2 = Math.pow(Math.max(0, 1 - Math.abs(bx / (w * 0.49))), 1.45);
        bp.setY(bi, Math.min(by + h * 0.475, h * arch2 * 0.92));
      }
      back.geometry.computeVertexNormals();
      back.rotation.y = Math.PI;
      back.position.z = -d * 0.49;
      back.castShadow = true;
      g.add(back);
      [-1, 1].forEach(function (f) {
        var p = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, h + 0.26, 6), woodM);
        p.position.set(0, (h + 0.26) / 2, f * d * 0.44);
        p.castShadow = true;
        g.add(p);
        var ex = (f > 0 ? 1 : -1) * w * 0.6, ez = f * d * 0.6;
        var gp = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.7, 3), ropeM);
        var len = Math.hypot(ex, h * 0.5, ez - f * d * 0.44);
        gp.position.set(ex * 0.5, h * 0.45, (f * d * 0.44 + ez) * 0.5);
        gp.lookAt(new THREE.Vector3(ex, 0.02, ez));
        gp.rotateX(Math.PI / 2);
        gp.scale.y = len / 1.7;
        g.add(gp);
        var peg = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.04, 0.13, 5), woodM);
        peg.position.set(ex, 0.04, ez);
        g.add(peg);
      });
      g.position.set(x, heightAt(x, z) - 0.02, z);
      g.rotation.y = (H(Math.round(x * 7 + z * 3), 1) - 0.5) * 0.5;
      scene.add(g);
      return g;
    }

    /* Lambert, not Phong: the static merge only folds Lambert parts, and with
       shininess 0 the faceted look is identical. */
    var rockM = new THREE.MeshLambertMaterial({ color: 0x8f7f68, flatShading: true });
    var rockDarkM = new THREE.MeshLambertMaterial({ color: 0x5d5342, flatShading: true });
    function rock(px, pz, s) {
      var g = new THREE.Group();
      for (var l = 0; l < 3; l++) {
        var geo = new THREE.IcosahedronGeometry(s * (0.72 - l * 0.13), 0);
        var p = geo.attributes.position;
        for (var vi = 0; vi < p.count; vi++) {
          var f = 0.82 + H(vi, l + 2) * 0.36;
          p.setXYZ(vi, p.getX(vi) * f * 1.35, p.getY(vi) * f * 0.55, p.getZ(vi) * f);
        }
        geo.computeVertexNormals();
        var m = new THREE.Mesh(geo, l === 2 ? rockDarkM : rockM);
        m.position.y = 0.10 + l * s * 0.30;
        m.rotation.y = H(l, 7) * 3;
        m.castShadow = true; m.receiveShadow = true;
        g.add(m);
      }
      g.position.set(px, heightAt(px, pz), pz);
      scene.add(g);
      return g;
    }

    function scrubField(n, seed) {
      var geo = new THREE.ConeGeometry(0.13, 0.46, 4, 1);
      var scrub = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0x6f6547 }), n);
      var d = new THREE.Object3D();
      for (var i = 0; i < n; i++) {
        var a = H(i + (seed || 0), 1) * Math.PI * 2, r = 5 + Math.pow(H(i + (seed || 0), 2), 0.6) * 52;
        var x = Math.cos(a) * r, z = Math.sin(a) * r - 3;
        d.position.set(x, heightAt(x, z) + 0.12, z);
        d.rotation.set((H(i, 3) - 0.5) * 0.5, H(i, 4) * 3, (H(i, 5) - 0.5) * 0.5);
        var sc = 0.5 + H(i, 6) * 1.1;
        d.scale.set(sc, sc * (0.7 + H(i, 7) * 0.9), sc);
        d.updateMatrix();
        scrub.setMatrixAt(i, d.matrix);
      }
      scrub.receiveShadow = true;
      scene.add(scrub);
      return scrub;
    }

    function pebbleField(n, x0, z0, spanX, spanZ) {
      var pebbles = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0x8b7658 }), n);
      var d = new THREE.Object3D();
      for (var i = 0; i < n; i++) {
        var x = (x0 || -34) + Math.random() * (spanX || 68);
        var z = (z0 || -26) + Math.random() * (spanZ || 56);
        var s = 0.05 + Math.random() * 0.12;
        d.position.set(x, heightAt(x, z) + s * 0.4, z);
        d.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        d.scale.set(s, s * 0.6, s);
        d.updateMatrix();
        pebbles.setMatrixAt(i, d.matrix);
      }
      pebbles.castShadow = true; pebbles.receiveShadow = true;
      scene.add(pebbles);
      return pebbles;
    }

    var PALMS = [];
    function palm(x, z, h, lean, simple) {
      var g = new THREE.Group();
      var trunkMat = new THREE.MeshLambertMaterial({ color: 0x6a5940 });
      var ringMat = new THREE.MeshLambertMaterial({ color: 0x574732 });
      var leanX = lean === undefined ? 0.8 : lean;
      var segs = 6;
      for (var s = 0; s < segs; s++) {
        var t = s / segs;
        var rTop = 0.16 - 0.09 * ((s + 1) / segs);
        var rBot = 0.16 - 0.09 * t;
        var seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h / segs * 1.02, 8), trunkMat);
        seg.position.set(leanX * t * t, h / segs * (s + 0.5), 0);
        seg.rotation.z = -0.06;
        seg.castShadow = true; seg.receiveShadow = true;
        g.add(seg);
        if (s > 0) {
          var ring = new THREE.Mesh(new THREE.TorusGeometry(rBot + 0.012, 0.018, 4, 10), ringMat);
          ring.rotation.x = Math.PI / 2;
          ring.position.set(leanX * t * t, h / segs * s, 0);
          g.add(ring);
        }
      }
      var crown = new THREE.Group();
      crown.position.set(leanX, h, 0);
      g.add(crown);
      PALMS.push({ crown: crown, phase: Math.random() * 6.28 });
      var frondMat = new THREE.MeshLambertMaterial({ color: 0x6b7d49 });
      var deadMat = new THREE.MeshLambertMaterial({ color: 0x6b5836 });
      var core = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), new THREE.MeshLambertMaterial({ color: 0x5b6a3e }));
      core.position.y = 0.05; crown.add(core);
      function frond(a, len, lift, droop, mat, simpleF) {
        var root = new THREE.Group();
        root.rotation.y = -a;
        var node = root;
        for (var k = 0; k < 3; k++) {
          var segLen = len / 3;
          var piv = new THREE.Group();
          piv.rotation.x = k === 0 ? lift : droop;
          node.add(piv);
          var blade = new THREE.Mesh(new THREE.BoxGeometry(0.11 - k * 0.02, 0.022, segLen), mat);
          blade.position.z = segLen / 2;
          blade.castShadow = true;
          piv.add(blade);
          if (!simpleF) {
            [0.34, 0.68].forEach(function (t) {
              var lfL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.5), mat);
              lfL.position.set(-0.03, 0, segLen * t);
              lfL.rotation.y = 0.8;
              lfL.rotation.z = 0.14;
              piv.add(lfL);
              var lfR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.5), mat);
              lfR.position.set(0.03, 0, segLen * t);
              lfR.rotation.y = -0.8;
              lfR.rotation.z = -0.14;
              piv.add(lfR);
            });
          }
          var next = new THREE.Group();
          next.position.z = segLen;
          piv.add(next);
          node = next;
        }
        return root;
      }
      for (var f = 0; f < 13; f++) {
        var a = (f / 13) * Math.PI * 2 + 0.2;
        crown.add(frond(a, 2.4 + (f % 3) * 0.22, 0.55, -0.42, frondMat, simple));
      }
      for (var d = 0; d < 4; d++) {
        crown.add(frond((d / 4) * Math.PI * 2 + 0.7, 1.3, -0.15, -0.5, deadMat, true));
      }
      var dates = new THREE.Mesh(new THREE.SphereGeometry(0.16, 7, 5), new THREE.MeshLambertMaterial({ color: 0x9a6f2e }));
      dates.position.set(0.12, -0.12, 0.1);
      crown.add(dates);
      g.position.set(x, heightAt(x, z), z);
      scene.add(g);
      return g;
    }

    function reeds(x, z, n) {
      for (var rd = 0; rd < (n || 26); rd++) {
        var ra = (rd / (n || 26)) * Math.PI * 2 + 0.2;
        var rr = 2.0 + Math.random() * 0.5;
        var reed = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.5 + Math.random() * 0.5, 4), new THREE.MeshLambertMaterial({ color: 0x6f7a4a }));
        reed.position.set(x + Math.cos(ra) * rr, 0.3, z + Math.sin(ra) * rr);
        reed.rotation.z = (Math.random() - 0.5) * 0.3;
        scene.add(reed);
      }
    }

    function campClutter(x, z, parent) {
      var sackM = new THREE.MeshLambertMaterial({ color: 0x9a8462 });
      var sackM2 = new THREE.MeshLambertMaterial({ color: 0x7d6a4e });
      var jarM = new THREE.MeshLambertMaterial({ color: 0x8a7a5a });
      var spearM = new THREE.MeshLambertMaterial({ color: 0x6b5f4a });
      var g = new THREE.Group();
      for (var k = 0; k < 4; k++) {
        var s = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 5), k % 2 ? sackM : sackM2);
        s.scale.set(1, 0.7, 1);
        s.position.set(k % 2 ? 0.35 : -0.3, 0.16, Math.floor(k / 2) * 0.4);
        s.castShadow = true; g.add(s);
      }
      var jar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.3, 8), jarM);
      jar.position.set(0.7, 0.15, 0.1); jar.castShadow = true; g.add(jar);
      for (var sp = 0; sp < 3; sp++) {
        var spe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.4, 4), spearM);
        spe.position.set(-0.8 + sp * 0.12, 0.6, 0.2 - sp * 0.1);
        spe.rotation.z = 0.35 + sp * 0.06;
        spe.castShadow = true; g.add(spe);
      }
      var pit = new THREE.Mesh(new THREE.CircleGeometry(0.45, 10), new THREE.MeshLambertMaterial({ color: 0x2a241d }));
      pit.rotation.x = -Math.PI / 2; pit.position.set(0.1, 0.02, -0.7); g.add(pit);
      for (var st = 0; st < 7; st++) {
        var a = st / 7 * Math.PI * 2;
        var stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 0), stoneM);
        stone.position.set(0.1 + Math.cos(a) * 0.5, 0.07, -0.7 + Math.sin(a) * 0.5);
        stone.castShadow = true; g.add(stone);
      }
      g.position.set(x, 0, z);
      (parent || scene).add(g);
      return g;
    }

    function horse(x, z, ry, dark) {
      var g = new THREE.Group();
      var bm = new THREE.MeshLambertMaterial({ color: dark ? 0x2a241d : 0x5b4630 });
      var darkM = new THREE.MeshLambertMaterial({ color: 0x201b15 });
      var body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 14, 10), bm);
      body.scale.set(1.3, 0.36, 0.32);
      body.position.y = 1.55; g.add(body);
      var chest = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 9), bm);
      chest.scale.set(0.95, 0.9, 0.78); chest.position.set(0.78, 1.5, 0); g.add(chest);
      var haunch = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 9), bm);
      haunch.scale.set(0.9, 0.88, 0.78); haunch.position.set(-0.74, 1.54, 0); g.add(haunch);
      var neck1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.62, 8), bm);
      neck1.position.set(1.0, 1.86, 0); neck1.rotation.z = -0.7; g.add(neck1);
      var neck2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.5, 8), bm);
      neck2.position.set(1.28, 2.22, 0); neck2.rotation.z = -0.45; g.add(neck2);
      var head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.2), bm);
      head.position.set(1.5, 2.42, 0); head.rotation.z = -0.5; g.add(head);
      var muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.15), bm);
      muzzle.position.set(1.68, 2.3, 0); muzzle.rotation.z = -0.5; g.add(muzzle);
      [-0.06, 0.06].forEach(function (zz) {
        var ear = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.11, 4), bm);
        ear.position.set(1.42, 2.55, zz); ear.rotation.z = -0.15; g.add(ear);
      });
      var mane = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.7, 0.1), darkM);
      mane.position.set(1.1, 2.0, 0); mane.rotation.z = -0.62; g.add(mane);
      var tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.85, 6), darkM);
      tail.position.set(-1.05, 1.25, 0); tail.rotation.z = 0.25; g.add(tail);
      for (var l = 0; l < 4; l++) {
        var sx = l < 2 ? 0.62 : -0.62;
        var sz = l % 2 ? 0.17 : -0.17;
        var upper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.62, 7), bm);
        upper.position.set(sx, 0.95, sz); g.add(upper);
        var lower = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.58, 7), bm);
        lower.position.set(sx, 0.36, sz); g.add(lower);
        var hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.11, 6), darkM);
        hoof.position.set(sx, 0.055, sz); g.add(hoof);
      }
      var blanket = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.5), new THREE.MeshLambertMaterial({ color: dark ? 0x33291f : 0x8f6b40 }));
      blanket.position.set(-0.05, 1.83, 0); g.add(blanket);
      var saddle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.38), new THREE.MeshLambertMaterial({ color: dark ? 0x2a2219 : 0x6b4a2c }));
      saddle.position.set(-0.05, 1.92, 0); g.add(saddle);
      var girth = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.4), new THREE.MeshLambertMaterial({ color: 0x3a2c1e }));
      girth.position.set(0.2, 1.55, 0); g.add(girth);
      var bridle = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.03), new THREE.MeshLambertMaterial({ color: 0x3a2c1e }));
      bridle.position.set(1.58, 2.36, 0); bridle.rotation.z = -0.5; g.add(bridle);
      if (dark) {
        var cap = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.38, 0.5), new THREE.MeshLambertMaterial({ color: 0x3a3126 }));
        cap.position.set(-0.1, 1.62, 0); g.add(cap);
      }
      g.position.set(x, 0, z); g.rotation.y = ry;
      g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(g);
      return g;
    }

    function camel(x, z, ry, parent) {
      var g = new THREE.Group();
      var m = new THREE.MeshLambertMaterial({ color: 0xb59a6d });
      var darkM = new THREE.MeshLambertMaterial({ color: 0x7a6446 });
      var body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), m);
      body.scale.set(1.15, 0.42, 0.4); body.position.y = 1.62; g.add(body);
      var hump = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), m);
      hump.scale.set(1, 1.35, 0.9);
      hump.position.set(-0.12, 2.02, 0); g.add(hump);
      var neck1 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.7, 7), m);
      neck1.position.set(0.95, 1.95, 0); neck1.rotation.z = -0.35; g.add(neck1);
      var neck2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.7, 7), m);
      neck2.position.set(1.12, 2.45, 0); neck2.rotation.z = 0.15; g.add(neck2);
      var head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.18), m);
      head.position.set(1.18, 2.8, 0); g.add(head);
      var muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.14), m);
      muzzle.position.set(1.4, 2.76, 0); g.add(muzzle);
      [-0.06, 0.06].forEach(function (zz) {
        var ear = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.1, 4), m);
        ear.position.set(1.06, 2.92, zz); g.add(ear);
      });
      var halter = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.03), new THREE.MeshLambertMaterial({ color: 0x6a4a2a }));
      halter.position.set(1.24, 2.55, 0); halter.rotation.z = 0.2; g.add(halter);
      var pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.44, 0.52), darkM);
      pack.position.set(-0.5, 1.9, 0.36); g.add(pack);
      var pack2 = pack.clone(); pack2.position.z = -0.36; g.add(pack2);
      var rope = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.02, 4, 12), new THREE.MeshLambertMaterial({ color: 0x6a4a2a }));
      rope.rotation.x = Math.PI / 2; rope.position.set(-0.5, 1.62, 0); g.add(rope);
      for (var l = 0; l < 4; l++) {
        var sx = l < 2 ? 0.58 : -0.58, sz = l % 2 ? 0.19 : -0.19;
        var upper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.72, 6), m);
        upper.position.set(sx, 1.0, sz); g.add(upper);
        var lower = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.7, 6), m);
        lower.position.set(sx, 0.36, sz); g.add(lower);
        var foot1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.1), darkM);
        foot1.position.set(sx, 0.04, sz + 0.05); g.add(foot1);
        var foot2 = foot1.clone(); foot2.position.z = sz - 0.05; g.add(foot2);
      }
      var tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.55, 4), m);
      tail.position.set(-1.02, 1.55, 0); tail.rotation.z = 0.4; g.add(tail);
      var tuft = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), darkM);
      tuft.position.set(-1.14, 1.28, 0); g.add(tuft);
      g.position.set(x, 0, z); g.rotation.y = ry;
      g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      (parent || scene).add(g);
      return g;
    }

    function makeArrow() {
      var g = new THREE.Group();
      var wood = new THREE.MeshLambertMaterial({ color: 0x8a744f });
      var iron = new THREE.MeshLambertMaterial({ color: 0xb9b4a6 });
      var fletch = new THREE.MeshLambertMaterial({ color: 0xe8e2d2 });
      var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.92, 4), wood);
      shaft.rotation.x = Math.PI / 2; g.add(shaft);
      var head = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.14, 4), iron);
      head.rotation.x = Math.PI / 2; head.position.z = 0.52; g.add(head);
      for (var f = 0; f < 3; f++) {
        var fe = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.17, 0.16), fletch);
        fe.position.z = -0.38;
        fe.rotation.z = f * Math.PI / 3;
        g.add(fe);
      }
      g.castShadow = true;
      return g;
    }

    /* a carved massif, not a dome: a displaced icosahedron with stepped
       flanks, flat-shaded so it reads as broken rock at maquette distance */
    var RIDGE_GEO = null;
    function ridgeGeo() {
      if (RIDGE_GEO) return RIDGE_GEO;
      var geo = new THREE.IcosahedronGeometry(1, 5);
      var pos = geo.attributes.position;
      var col = new Float32Array(pos.count * 3);
      var v = new THREE.Vector3();
      for (var i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        var n1 = fbm(v.x * 1.9 + 2.1, v.z * 1.9 + 4.4, 4);
        var n2 = fbm(v.y * 2.6 + 9.0, v.x * 2.6 + 1.3, 3);
        var r = 1 + (n1 - 0.5) * 0.62 + (n2 - 0.5) * 0.2;
        /* strata: the flank steps out in shelves rather than swelling smoothly */
        var shelf = 0.12;
        var q = Math.round(r / shelf) * shelf;
        r = q * 0.55 + r * 0.45;
        /* the crest breaks instead of doming */
        var top = Math.max(0, v.y);
        r -= top * top * 0.16 * (fbm(v.x * 3.3 + 5.1, v.z * 3.3 + 2.7, 2) - 0.4);
        pos.setXYZ(i, v.x * r, v.y * r, v.z * r);
        /* light strata: the base sits in shadow, the crest catches the key */
        var yn = Math.max(0, Math.min(1, (v.y + 1) / 2));
        var s = 0.68 + 0.44 * yn + 0.07 * Math.sin(v.y * 15.0 + n1 * 6.0);
        col[i * 3] = s; col[i * 3 + 1] = s; col[i * 3 + 2] = s;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.computeVertexNormals();
      RIDGE_GEO = geo;
      return geo;
    }
    function ridge(x, z, sx, sy, color) {
      var ridgeM = new THREE.Mesh(ridgeGeo(), new THREE.MeshStandardMaterial({
        color: color || 0xb0a184, roughness: 1, metalness: 0, flatShading: true, vertexColors: true
      }));
      ridgeM.scale.set(sx, sy, sx * 0.55);
      ridgeM.rotation.y = (Math.abs(Math.sin(x * 12.9898 + z * 78.233)) % 1) * Math.PI;
      ridgeM.position.set(x, heightAt(x, z) - sy * 0.34, z);
      ridgeM.castShadow = true;
      ridgeM.receiveShadow = true;
      /* keep the strata shading: the static merge flattens to one colour */
      ridgeM.userData.keep = true;
      scene.add(ridgeM);
      return ridgeM;
    }

    /* a carved stone fort tower (Khaybar's chain): battered square lifts,
       string-course ledges, crenellated rim, dark door and arrow slits.
       Scale via opts.h / opts.w; opts.tone passes { stone, dark, trim } for
       the basalt country; opts.ruin breaks the rim and drops rubble;
       opts.annex adds a lower attached block. Every part is Lambert so the
       static merge folds the whole fort into one draw call. */
    function fort(x, z, opts) {
      opts = opts || {};
      var h = opts.h || 6.5, w = opts.w || 5.2;
      var seed = opts.seed === undefined ? 0 : opts.seed;
      var ruin = opts.ruin === undefined ? 0 : opts.ruin;
      var tone = opts.tone || {};
      var sM = new THREE.MeshLambertMaterial({ color: tone.stone === undefined ? 0x8d8371 : tone.stone });
      var sdM = new THREE.MeshLambertMaterial({ color: tone.dark === undefined ? 0x6b6354 : tone.dark });
      var trimM = new THREE.MeshLambertMaterial({ color: tone.trim === undefined ? 0x9a917e : tone.trim });
      var holeM = new THREE.MeshLambertMaterial({ color: 0x14100c });
      var g = new THREE.Group();
      var i, k;
      /* two battered lifts with a string course between them */
      var liftA = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.40, w * 0.48, h * 0.58, 4, 1), sM);
      liftA.rotation.y = Math.PI / 4;
      liftA.position.y = h * 0.29;
      var liftB = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.33, w * 0.385, h * 0.42, 4, 1), sM);
      liftB.rotation.y = Math.PI / 4;
      liftB.position.y = h * 0.58 + h * 0.21;
      var ledge = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.43, w * 0.43, h * 0.045, 4, 1), trimM);
      ledge.rotation.y = Math.PI / 4;
      ledge.position.y = h * 0.58;
      [liftA, liftB, ledge].forEach(function (m) { m.castShadow = true; m.receiveShadow = true; g.add(m); });
      /* corner quoins: slim proud blocks running up the four arrises */
      for (k = 0; k < 4; k++) {
        var qa = Math.PI / 4 + k * Math.PI / 2;
        var q = new THREE.Mesh(new THREE.BoxGeometry(w * 0.07, h * 0.56, w * 0.07), sdM);
        q.position.set(Math.cos(qa) * w * 0.365, h * 0.30, Math.sin(qa) * w * 0.365);
        q.rotation.y = -qa;
        q.castShadow = true; g.add(q);
      }
      /* crenellated rim: merlons on the top walk, broken where ruin asks */
      var merlons = opts.merlons === undefined ? 8 : opts.merlons;
      var rimR = w * 0.30;
      for (k = 0; k < merlons; k++) {
        if (U.hash2(k + seed * 7, 3) < ruin) continue;
        var ma = k / merlons * Math.PI * 2;
        var mh = h * 0.075 * (0.8 + U.hash2(k + seed, 5) * 0.5);
        var mer = new THREE.Mesh(new THREE.BoxGeometry(w * 0.14, mh, w * 0.10), sdM);
        mer.position.set(Math.cos(ma) * rimR, h + mh / 2 - 0.02, Math.sin(ma) * rimR);
        mer.rotation.y = -ma;
        mer.castShadow = true; g.add(mer);
      }
      var walk = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.335, w * 0.335, h * 0.03, 4, 1), trimM);
      walk.rotation.y = Math.PI / 4;
      walk.position.y = h - h * 0.015;
      walk.receiveShadow = true; g.add(walk);
      /* door + arrow slits: dark insets read as openings at maquette distance */
      var door = new THREE.Mesh(new THREE.BoxGeometry(w * 0.16, h * 0.16, w * 0.05), holeM);
      door.position.set(0, h * 0.085, w * 0.40);
      door.castShadow = false; g.add(door);
      var lintel = new THREE.Mesh(new THREE.BoxGeometry(w * 0.20, h * 0.035, w * 0.07), trimM);
      lintel.position.set(0, h * 0.175, w * 0.40);
      g.add(lintel);
      for (i = 0; i < 3; i++) {
        var sl = new THREE.Mesh(new THREE.BoxGeometry(w * 0.035, h * 0.07, w * 0.04), holeM);
        var sa2 = U.hash2(i + seed * 3, 9) * Math.PI * 2;
        sl.position.set(Math.cos(sa2) * w * 0.325, h * (0.46 + i * 0.11), Math.sin(sa2) * w * 0.325);
        sl.rotation.y = -sa2;
        g.add(sl);
      }
      /* optional lower annex block with its own rim */
      if (opts.annex) {
        var aw = w * 0.62, ah = h * 0.40;
        var ann = new THREE.Mesh(new THREE.CylinderGeometry(aw * 0.44, aw * 0.5, ah, 4, 1), sM);
        ann.rotation.y = Math.PI / 4;
        ann.position.set(w * 0.62, ah / 2, w * 0.30);
        ann.castShadow = true; ann.receiveShadow = true; g.add(ann);
        for (k = 0; k < 4; k++) {
          var aa = k / 4 * Math.PI * 2 + 0.4;
          if (U.hash2(k + seed, 11) < ruin * 0.7) continue;
          var am = new THREE.Mesh(new THREE.BoxGeometry(aw * 0.15, ah * 0.09, aw * 0.11), sdM);
          am.position.set(w * 0.62 + Math.cos(aa) * aw * 0.32, ah + ah * 0.045, w * 0.30 + Math.sin(aa) * aw * 0.32);
          am.rotation.y = -aa;
          am.castShadow = true; g.add(am);
        }
      }
      /* ruin rubble: fallen blocks ringing the base */
      var rubble = Math.round(ruin * 7);
      for (i = 0; i < rubble; i++) {
        var ra = U.hash2(i + seed * 5, 13) * Math.PI * 2;
        var rr = w * 0.52 + U.hash2(i, 17) * w * 0.3;
        var rb = new THREE.Mesh(new THREE.IcosahedronGeometry(w * 0.06 + U.hash2(i, 19) * w * 0.05, 0), sdM);
        rb.position.set(Math.cos(ra) * rr, w * 0.04, Math.sin(ra) * rr);
        rb.rotation.set(U.hash2(i, 21) * 3, U.hash2(i, 23) * 3, 0);
        rb.castShadow = true; rb.receiveShadow = true;
        g.add(rb);
      }
      g.position.set(x, heightAt(x, z) - 0.08, z);
      g.rotation.y = U.hash2(seed, 31) * Math.PI;
      scene.add(g);
      return g;
    }

    /* an instanced palm grove for the oasis floor: one vertex-coloured palm
       template baked with mergeParts, stamped n times with per-tree lean,
       scale and turn. opts.rows lays a jittered cultivation grid instead of
       scatter; opts.wall adds low stone field walls on the rectangle edges.
       One draw call for the trees; the walls join the static merge. */
    function palmGrove(x0, z0, w, d, n, opts) {
      opts = opts || {};
      var H2 = H;
      var trunkH = 3.3;
      var trunkC = new THREE.Color(0x6a5940), ringC = new THREE.Color(0x574732);
      var frondC = new THREE.Color(0x6b7d49), frondD = new THREE.Color(0x5d6f41);
      var deadC = new THREE.Color(0x6b5836), dateC = new THREE.Color(0x9a6f2e);
      var parts = [{ geo: new THREE.CylinderGeometry(0.085, 0.15, trunkH, 5), p: [0, trunkH / 2, 0], c: trunkC }];
      var nb = 9, bi;
      for (bi = 0; bi < nb; bi++) {
        var ba = bi / nb * Math.PI * 2;
        var bmat = bi % 2 ? frondD : frondC;
        var lift = 0.45 + H2(bi, 2) * 0.35;
        var bl = 1.05 + H2(bi, 4) * 0.35;
        parts.push({ geo: new THREE.BoxGeometry(0.10, 0.024, bl), p: [Math.cos(ba) * bl * 0.42, trunkH + 0.05 - (bl * 0.42) * 0.28, Math.sin(ba) * bl * 0.42], r: [0, -ba, -lift * 0.55], c: bmat });
      }
      for (bi = 0; bi < 3; bi++) {
        var da = bi / 3 * Math.PI * 2 + 0.5;
        parts.push({ geo: new THREE.BoxGeometry(0.07, 0.02, 0.7), p: [Math.cos(da) * 0.30, trunkH - 0.16, Math.sin(da) * 0.30], r: [0, -da, -0.95], c: deadC });
        parts.push({ geo: new THREE.TorusGeometry(0.13 - bi * 0.012, 0.02, 4, 8), p: [0, trunkH * (0.3 + bi * 0.22), 0], r: [Math.PI / 2, 0, 0], c: ringC });
      }
      parts.push({ geo: new THREE.SphereGeometry(0.14, 7, 5), p: [0.09, trunkH - 0.10, 0.06], c: dateC });
      var palmGeo = mergeParts(parts);
      var grove = new THREE.InstancedMesh(palmGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), n);
      var dmy = new THREE.Object3D();
      var cols = opts.rows ? Math.ceil(Math.sqrt(n * w / Math.max(1, d))) : 0;
      var rowN = opts.rows ? Math.ceil(n / cols) : 0;
      for (var i2 = 0; i2 < n; i2++) {
        var px, pz;
        if (opts.rows) {
          var ci = i2 % cols, ri = Math.floor(i2 / cols);
          px = x0 + (ci + 0.5) / cols * w + (H2(i2, 41) - 0.5) * (w / cols) * 0.5;
          pz = z0 + (ri + 0.5) / rowN * d + (H2(i2, 43) - 0.5) * (d / rowN) * 0.5;
        } else {
          px = x0 + H2(i2, 41) * w;
          pz = z0 + H2(i2, 43) * d;
        }
        var s = 0.72 + H2(i2, 45) * 0.5;
        dmy.position.set(px, heightAt(px, pz) - 0.04, pz);
        dmy.rotation.set(0, H2(i2, 47) * Math.PI * 2, 0);
        dmy.scale.set(s, s * (0.85 + H2(i2, 49) * 0.45), s);
        dmy.updateMatrix();
        grove.setMatrixAt(i2, dmy.matrix);
      }
      grove.castShadow = true; grove.receiveShadow = true;
      scene.add(grove);
      var walls = null;
      if (opts.wall) {
        walls = new THREE.Group();
        var wallM = new THREE.MeshLambertMaterial({ color: 0x6b6354 });
        var pad = 0.9;
        [[w / 2 + pad, 0, 0, d + pad * 2], [-w / 2 - pad, 0, 0, d + pad * 2], [0, d / 2 + pad, w + pad * 2, 0], [0, -d / 2 - pad, w + pad * 2, 0]].forEach(function (e, ei) {
          var wx = x0 + w / 2 + e[0], wz = z0 + d / 2 + e[1];
          var seg = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.3, e[2]), 0.34 + H2(ei, 51) * 0.14, Math.max(0.3, e[3])), wallM);
          seg.position.set(wx, heightAt(wx, wz) + 0.12, wz);
          seg.castShadow = true; seg.receiveShadow = true;
          walls.add(seg);
        });
        scene.add(walls);
      }
      return { grove: grove, walls: walls };
    }

    return {
      mats: { stoneM: stoneM, stoneDark: stoneDark, waterM: waterM, woodM: woodM, ropeM: ropeM },
      well: well, ridgeTent: ridgeTent, rock: rock, scrubField: scrubField, pebbleField: pebbleField,
      palm: palm, palms: PALMS, reeds: reeds, campClutter: campClutter,
      horse: horse, camel: camel, makeArrow: makeArrow, ridge: ridge,
      fort: fort, palmGrove: palmGrove
    };
  };

  /* ------------------------------ instanced crowd with a leg gait */
  var MASS = [];
  function writeTRxRyS(arr, o, tx, ty, tz, ax, cy, sy, hs) {
    var sa = Math.sin(ax), ca = Math.cos(ax);
    arr[o] = cy; arr[o + 1] = sa * sy; arr[o + 2] = -ca * sy; arr[o + 3] = 0;
    arr[o + 4] = 0; arr[o + 5] = ca * hs; arr[o + 6] = sa * hs; arr[o + 7] = 0;
    arr[o + 8] = sy; arr[o + 9] = -sa * cy; arr[o + 10] = ca * cy; arr[o + 11] = 0;
    arr[o + 12] = tx; arr[o + 13] = ty; arr[o + 14] = tz; arr[o + 15] = 1;
  }
  var LOD_FLIP = 0;
  ENGINE.crowd = {
    all: function () { return MASS; },
    build: function (opts) {
      var side = opts.side, count = opts.count, cols = opts.cols;
      var dxS = opts.dxS, dzS = opts.dzS, z0 = opts.z0, h = opts.h;
      var blocks = opts.blocks, scene = opts.scene;
      var squadSize = 8;
      var squads = Math.ceil(count / squadSize);
      var bodyGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.62, 6);
      var skirtGeo = new THREE.CylinderGeometry(0.2, 0.26, 0.3, 6);
      var beltGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.05, 6);
      var headGeo = new THREE.SphereGeometry(0.13, 6, 5);
      var legGeo = new THREE.CylinderGeometry(0.055, 0.07, 0.55, 5);
      var footGeo = new THREE.BoxGeometry(0.11, 0.06, 0.2);
      var armGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.5, 5);
      var helmGeo = new THREE.SphereGeometry(0.145, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2);
      var turbanGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 6);
      var shaftGeo = new THREE.CylinderGeometry(0.02, 0.028, h, 5);
      var tipGeo = new THREE.BoxGeometry(0.035, 0.2, 0.014);
      var buttGeo = new THREE.ConeGeometry(0.03, 0.1, 4);
      /* The depth pass redraws the whole mass: 4.2M triangles a frame on
         Khandaq, and the crowd's contact underfoot is the one thing the wide
         phone framing can lose without a read; desktop keeps the cast. A
         scene can force either way with opts.castShadow. */
      var castCrowd = opts.castShadow === undefined ? !ENGINE.mobile : !!opts.castShadow;
      var bodyC = new THREE.Color(side ? 0x5f5544 : 0xcfc6b2);
      var legC = new THREE.Color(side ? 0x4a4135 : 0xa89a80);
      var headC = new THREE.Color(side ? 0x463d32 : 0xbfb49d);
      var beltC = new THREE.Color(side ? 0x3a3126 : 0x8a7a60);
      var clothC = new THREE.Color(side ? 0x6b5f4c : 0xd8cfba);
      var ironC = new THREE.Color(side ? 0x565043 : 0x9a9382);
      var woodC = new THREE.Color(0x6b5c42);
      /* upper body only: the legs are their own instances so the march has a gait */
      var manParts = [
        { geo: bodyGeo, p: [0, 0.86, 0], c: bodyC },
        { geo: skirtGeo, p: [0, 0.62, 0], c: bodyC },
        (opts.belt === false ? null : { geo: beltGeo, p: [0, 0.79, 0], c: beltC }),
        { geo: headGeo, p: [0, 1.34, 0], c: headC },
        side
          ? { geo: helmGeo, p: [0, 1.38, 0], c: ironC }
          : { geo: turbanGeo, p: [0, 1.42, 0], c: clothC },
        { geo: armGeo, p: [-0.18, 0.9, 0.02], r: [0, 0, 0.22], c: bodyC },
        { geo: armGeo, p: [0.18, 0.9, 0.02], r: [0, 0, -0.22], c: bodyC }
      ];
      var manGeo = mergeParts(manParts.filter(Boolean));
      var men = new THREE.InstancedMesh(manGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), count);
      men.castShadow = castCrowd;
      /* each leg pivots at the hip (y 0.56): leg + foot in one rigid piece */
      var hipY = 0.56;
      var legLGeo = mergeParts([
        { geo: legGeo, p: [-0.08, 0.28 - hipY, 0], r: [0, 0, 0.04], c: legC },
        { geo: footGeo, p: [-0.08, 0.03 - hipY, 0.04], c: legC }
      ]);
      var legRGeo = mergeParts([
        { geo: legGeo, p: [0.08, 0.28 - hipY, 0], r: [0, 0, -0.04], c: legC },
        { geo: footGeo, p: [0.08, 0.03 - hipY, 0.04], c: legC }
      ]);
      var legsL = new THREE.InstancedMesh(legLGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), count);
      var legsR = new THREE.InstancedMesh(legRGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), count);
      legsL.castShadow = castCrowd; legsR.castShadow = castCrowd;
      /* the spear is its own instance so the whole hedge can level and thrust */
      var spearGeo = mergeParts([
        { geo: shaftGeo, p: [0, -0.05, 0], c: woodC },
        { geo: tipGeo, p: [0, -0.05 + h / 2 + 0.1, 0], c: ironC },
        { geo: buttGeo, p: [0, -0.05 - h / 2 - 0.04, 0], r: [Math.PI, 0, 0], c: ironC }
      ]);
      var spears = new THREE.InstancedMesh(spearGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), count);
      spears.castShadow = castCrowd;
      var shieldsPer = side ? 3 : 2;
      var shields = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 12), new THREE.MeshLambertMaterial({ color: 0xffffff }), squads * shieldsPer);
      if (shields.setColorAt) {
        var palette = side ? [0x5a4f3c, 0x4b3f31, 0x5c3a2f] : [0xb5a583, 0xa8977a];
        for (var ci = 0; ci < squads * shieldsPer; ci++) {
          var hh = Math.abs(Math.sin(ci * 9.7) * 43758.5453) % 1;
          shields.setColorAt(ci, new THREE.Color(palette[Math.floor(hh * palette.length)]));
        }
        shields.instanceColor.needsUpdate = true;
      }
      var rims = new THREE.InstancedMesh(new THREE.TorusGeometry(0.345, 0.02, 5, 14), new THREE.MeshLambertMaterial({ color: side ? 0x565043 : 0xc39a33 }), opts.rims === false ? 1 : squads * shieldsPer);
      rims.visible = opts.rims !== false;
      var swords = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, 0.72, 0.013), new THREE.MeshLambertMaterial({ color: 0xc9c4b6 }), squads);
      var guards = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.03, 0.05), new THREE.MeshLambertMaterial({ color: side ? 0x565043 : 0xc39a33 }), squads);
      var helms = new THREE.InstancedMesh(new THREE.SphereGeometry(0.145, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: side ? 0x565043 : 0x9a9382 }), squads);
      shields.castShadow = castCrowd; swords.castShadow = castCrowd;
      var sq = [], recs = [], idx = 0;
      for (var s = 0; s < squads; s++) {
        var rk = Math.floor(s / cols), cl = s % cols;
        var hsh = Math.abs(Math.sin(s * 12.9898) * 43758.5453) % 1;
        var cx;
        var divFiles = opts.divFiles || 0;
        if (side && cols === 21) {
          /* three divisions of seven files: 1,000 men read as one army */
          var seg = cl < 7 ? -1 : (cl < 14 ? 0 : 1);
          cx = seg * 18 + ((cl % 7) - 3) * 2.0 + (rk % 2 ? 1.0 : 0);
        } else if (divFiles > 0) {
          /* the same division rhythm at any scale: colFiles per block with a
             gap between blocks (Uhud fields 3,000 in three wings, not one slab) */
          var ndiv = Math.max(1, Math.ceil(cols / divFiles));
          var dseg = Math.floor(cl / divFiles);
          var inDiv = cl % divFiles;
          var pitch = opts.divPitch || 36;
          cx = (dseg - (ndiv - 1) / 2) * pitch
            + (inDiv - (divFiles - 1) / 2) * dxS
            + (rk % 2 ? dxS * 0.5 : 0);
        } else {
          cx = (cl - (cols - 1) / 2) * dxS + (rk % 2 ? dxS * 0.5 : 0);
        }
        var cz = z0 + rk * dzS;
        var best = 0, bd = 1e9;
        for (var b = 0; b < blocks.length; b++) {
          var bp = blocks[b].group.position;
          var d = (bp.x - cx) * (bp.x - cx) + (bp.z - cz) * (bp.z - cz);
          if (d < bd) { bd = d; best = b; }
        }
        var an = blocks[best].group.position;
        sq.push({ lx: cx - an.x, lz: cz - an.z, block: best, hsh: hsh });
        for (var m = 0; m < squadSize && idx < count; m++, idx++) {
          var recRy = (Math.abs(Math.sin(idx * 1.7) * 537) % 1) * 0.3 - 0.15;
          recs.push({
            s: s,
            row: rk,
            ox: (m % 4 - 1.5) * 0.42 + (Math.abs(Math.sin(idx * 7.31) * 9123) % 1 - 0.5) * 0.1,
            oz: (Math.floor(m / 4) - 0.5) * 0.5,
            hs: 0.94 + (Math.abs(Math.sin(idx * 3.7) * 917) % 1) * 0.12,
            ry: recRy,
            cy: Math.cos(recRy),
            sy: Math.sin(recRy),
            tilt: (Math.abs(Math.sin(idx * 2.3) * 719) % 1 - 0.5) * 0.05,
            fp: (Math.abs(Math.sin(idx * 5.17) * 1931) % 1) * 6.283
          });
        }
      }
      scene.add(men); scene.add(legsL); scene.add(legsR); scene.add(spears); scene.add(shields); scene.add(rims); scene.add(swords); scene.add(guards); scene.add(helms);
      var M = { men: men, legsL: legsL, legsR: legsR, spears: spears, shields: shields, rims: rims, swords: swords, guards: guards, helms: helms, shieldsPer: shieldsPer, sq: sq, recs: recs, blocks: blocks, h: h, side: side, full: false };
      MASS.push(M);
      return M;
    },
    /* env: { ph, frac, total, fight, disp, marching, gaitHz, gaitAmp } */
    update: function (env) {
      var dm = new THREE.Object3D();
      var ph = env.ph;
      var fight = env.fight, disp = env.disp, marching = env.marching;
      var lod = !!env.lod;
      var parity = lod ? (LOD_FLIP ^= 1) : 0;
      var now = performance.now() / 1000;
      var gaitPh = env.frac * env.total * env.gaitHz * 6.283;
      var gaitAmp = env.gaitAmp;
      for (var m = 0; m < MASS.length; m++) {
        var M = MASS[m];
        var dir = M.side ? 1 : -1;
        var anchors = [];
        for (var s = 0; s < M.sq.length; s++) {
          var S = M.sq[s], u = M.blocks[S.block];
          anchors.push([u.group.position.x + S.lx + (S.hsh - 0.5) * 1.0 * disp, u.group.position.z + S.lz + (S.hsh - 0.5) * 0.6 * disp]);
        }
        var menArr = M.men.instanceMatrix.array;
        var legLArr = M.legsL.instanceMatrix.array;
        var legRArr = M.legsR.instanceMatrix.array;
        var spArr = M.spears.instanceMatrix.array;
        /* on a phone the crowd updates half its men each frame: the motion is
           still 30 Hz, the frame keeps its budget, and the first pass fills all */
        var full = !M.full;
        M.full = true;
        for (var i = 0; i < M.recs.length; i++) {
          if (lod && !full && (i & 1) !== parity) continue;
          var rec = M.recs[i], a = anchors[rec.s];
          var px = a[0] + rec.ox * (1 + 0.45 * disp) + Math.sin(rec.fp * 2.7 + now * 0.35) * 0.1 * disp;
          var pz = a[1] + rec.oz + Math.sin(rec.fp * 1.9 + now * 0.3) * 0.14 * disp;
          var thrust = fight * (0.5 + 0.5 * Math.sin(now * 9 + rec.fp));
          var lunge = fight * 0.18 * thrust * dir;
          /* the hit ripple: a stagger wave travelling back through the ranks */
          var ripple = fight * Math.sin(now * 9 - rec.row * 1.05);
          var lean = fight * 0.1 * thrust * dir + ripple * 0.09 + (env.leanRun || 0);
          var gait = Math.sin(gaitPh + rec.fp);
          var bob = marching * Math.abs(Math.cos(gaitPh + rec.fp)) * 0.05 * (gaitAmp / 0.5)
            + fight * Math.abs(Math.sin(now * 6 + rec.fp)) * 0.045;
          var cy = rec.cy, sy = rec.sy;
          var o = i * 16;
          var hipY = 0.56 * rec.hs;
          var swL = gait * gaitAmp;
          writeTRxRyS(menArr, o, px, bob, pz + lunge, lean, cy, sy, rec.hs);
          writeTRxRyS(legLArr, o, px - 0.08 * cy, bob + hipY, pz + lunge + 0.08 * sy, lean + swL, cy, sy, rec.hs);
          writeTRxRyS(legRArr, o, px + 0.08 * cy, bob + hipY, pz + lunge - 0.08 * sy, lean - swL, cy, sy, rec.hs);
          var spLean = dir * (0.15 + fight * (0.5 + 0.25 * thrust)) + (marching ? 0.18 : 0);
          writeTRxRyS(spArr, o,
            px + 0.22 * cy + 0.06 * sy, bob + 1.0 * rec.hs, pz + lunge - 0.22 * sy + 0.06 * cy,
            spLean, cy, sy, 1);
        }
        for (var s2 = 0; s2 < M.sq.length; s2++) {
          if (lod && !full && (s2 & 1) !== parity) continue;
          var a2 = anchors[s2];
          var sqv = M.sq[s2], sv = 0.9 + sqv.hsh * 0.18;
          var si = s2 * M.shieldsPer;
          for (var k = 0; k < M.shieldsPer; k++) {
            var off = (k - (M.shieldsPer - 1) / 2) * 0.62;
            var face = M.side ? 0.58 : -0.58;
            var shieldLift = fight * (0.06 + 0.06 * Math.sin(now * 6 + sqv.hsh * 6));
            dm.position.set(a2[0] + off, 0.62 * sv + shieldLift, a2[1] + face);
            dm.rotation.set(Math.PI / 2 - 0.08 - fight * 0.12, 0.03, 0);
            if (M.side) dm.rotation.y = Math.PI;
            dm.scale.set(sv, 1, sv);
            dm.updateMatrix();
            M.shields.setMatrixAt(si + k, dm.matrix);
            if (M.rims.visible) {
              dm.rotation.x = 0;
              dm.updateMatrix();
              M.rims.setMatrixAt(si + k, dm.matrix);
            }
          }
          /* the squad's helm-rack behind the shields */
          dm.position.set(a2[0] - (M.side ? 0.8 : -0.8), 0.14, a2[1] - (M.side ? 0.5 : -0.5));
          dm.rotation.set(0, 0.3 * sqv.hsh, 0);
          dm.scale.set(sv, 1, sv);
          dm.updateMatrix();
          M.helms.setMatrixAt(s2, dm.matrix);
          /* the sword held hilt-up at the front man's side */
          var swing = fight * Math.sin(now * 7 + sqv.hsh * 6);
          dm.position.set(a2[0] + 0.4, 0.72, a2[1] + (M.side ? -0.5 : 0.5));
          dm.rotation.set(0.03 + swing * 0.28, 0.3, 0.04 + swing * 0.85);
          dm.updateMatrix();
          M.swords.setMatrixAt(s2, dm.matrix);
          dm.position.y = 1.05;
          dm.updateMatrix();
          M.guards.setMatrixAt(s2, dm.matrix);
        }
        M.men.instanceMatrix.needsUpdate = true;
        M.legsL.instanceMatrix.needsUpdate = true;
        M.legsR.instanceMatrix.needsUpdate = true;
        M.spears.instanceMatrix.needsUpdate = true;
        M.shields.instanceMatrix.needsUpdate = true;
        if (M.rims.visible) M.rims.instanceMatrix.needsUpdate = true;
        M.swords.instanceMatrix.needsUpdate = true;
        M.guards.instanceMatrix.needsUpdate = true;
        M.helms.instanceMatrix.needsUpdate = true;
      }
    },
    bench: function (env, n) {
      var t0 = performance.now();
      for (var i = 0; i < (n || 10); i++) ENGINE.crowd.update(env);
      return (performance.now() - t0) / (n || 10);
    }
  };

  /* ------------------------------ labels */
  /* label widths only change with the text, the viewport or a font load, so
     measure them then, not every frame: a read after a style write forces layout */
  var LABEL_FONT_V = 0;
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', function () { LABEL_FONT_V++; });
  }
  ENGINE.labels = {
    /* screen areas the HUD owns (the legend, the deck): labels stay out of them */
    reserved: [],
    mkLabel: function (labelBox, txt, cls) {
      var d = document.createElement('span');
      d.className = 'hud-label' + (cls ? ' ' + cls : '');
      d.textContent = txt;
      labelBox.appendChild(d);
      return d;
    },
    /* one placement pass; env: { camera, phaseIdx, phaseT, w, h, MOBILE, reduce } */
    place: function (list, isUnit, env, placedRects) {
      var camera = env.camera, w = env.w, h = env.h;
      var measV = w + ':' + LABEL_FONT_V;
      for (var q = 0; q < list.length; q++) {
        var it = list[q];
        /* a name that belongs to one beat hides after it; the field keeps the standards */
        if (isUnit && it.u.hideAfterPhase !== undefined && env.phaseIdx > it.u.hideAfterPhase) { it.el.style.visibility = 'hidden'; continue; }
        if (isUnit && it.u.hideBeforePhase !== undefined && env.phaseIdx < it.u.hideBeforePhase) { it.el.style.visibility = 'hidden'; continue; }
        if (isUnit && it.u.ph && it.u.ph.indexOf(env.phaseIdx) < 0) { it.el.style.visibility = 'hidden'; continue; }
        if (isUnit && it.u.tRange && (env.phaseT < it.u.tRange[0] || env.phaseT > it.u.tRange[1])) { it.el.style.visibility = 'hidden'; continue; }
        if (!isUnit && it.ph && it.ph.indexOf(env.phaseIdx) < 0) { it.el.style.visibility = 'hidden'; continue; }
        if (!isUnit && it.tRange && (env.phaseT < it.tRange[0] || env.phaseT > it.tRange[1])) { it.el.style.visibility = 'hidden'; continue; }
        var txt = it.el.textContent;
        if (it.lw === undefined || it.lwV !== measV || it.lwTxt !== txt) {
          it.lw = it.el.offsetWidth || 60;
          it.lh = it.el.offsetHeight || 20;
          it.lwV = measV; it.lwTxt = txt;
        }
        var lY = isUnit ? (it.u.labelY !== undefined ? it.u.labelY : (it.u.isChampion ? 3.9 : 4.0)) : 0;
        if (env.MOBILE && isUnit && it.u.mobileDY) lY += it.u.mobileDY;
        /* a rigged champion's label follows the walking figure, not the standard */
        var base = isUnit ? (it.u.labelAnchor || it.u.group.position) : null;
        var v = (isUnit ? base.clone().add(new THREE.Vector3(0, lY, 0)) : it.v.clone());
        v = v.project ? v.project(camera) : v;
        var sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h;
        /* smoothed screen positions keep the labels from vibrating */
        if (it.sx === undefined) { it.sx = sx; it.sy = sy; }
        it.sx += (sx - it.sx) * 0.3;
        it.sy += (sy - it.sy) * 0.3;
        sx = it.sx; sy = it.sy;
        /* landmarks near the edge keep their label on screen */
        if (!isUnit) {
          var lw0 = it.lw;
          sx = Math.max(lw0 / 2 + 26, Math.min(w - lw0 / 2 - 26, sx));
        }
        /* far camera: unit labels fade out, landmarks stay */
        var vis = v.z > -1 && v.z < 1 && sy > 56 && sy < h - 170;
        var dist = isUnit ? camera.position.distanceTo(base) : 0;
        var far = env.MOBILE ? 58 : 95, fade = env.MOBILE ? 40 : 62, span = env.MOBILE ? 18 : 33;
        if (isUnit && dist > far && !it.u.labelAlways) vis = false;
        var op = isUnit ? (it.u.labelAlways ? 1 : (dist > fade ? Math.max(0, 1 - (dist - fade) / span) : 1)) : 1;
        if (op < 0.08) vis = false;
        it.el.style.opacity = op === 1 ? '' : op.toFixed(2);
        if (vis) {
          var lw = it.lw, lh = it.lh;
          var l = sx - lw / 2 - 3, r = sx + lw / 2 + 3, t = sy - lh - 8, b = sy + 2;
          if (l < 20 || r > w - 20) vis = false;
          for (var pj = 0; vis && pj < placedRects.length; pj++) {
            var pr = placedRects[pj];
            if (l < pr[2] && r > pr[0] && t < pr[3] && b > pr[1]) { vis = false; break; }
          }
          if (vis) placedRects.push([l, t, r, b]);
        }
        it.el.style.left = sx.toFixed(1) + 'px';
        it.el.style.top = sy.toFixed(1) + 'px';
        if (it.visState !== vis) { it.visState = vis; it.el.style.visibility = vis ? 'visible' : 'hidden'; }
      }
    }
  };

  /* ------------------------------ director: clock, shots, orbit */
  ENGINE.director = function (ctx) {
    var camera = ctx.camera, canvas = ctx.canvas, reduce = ctx.reduce, MOBILE = ctx.MOBILE;
    var easeIO = U.easeIO;
    var clock = { playing: false, speed: 1, frac: 0, last: performance.now(), dt: 0.016 };
    var PHASES = [], SHOTS = {}, IMPACTS = [], PRESETS = {};
    var PORTRAIT = { cap: 2.1 };
    var camState = { mode: 'phase', preset: null };
    var orbit = { az: 0, pol: 0.42, r: 66, target: new THREE.Vector3(0, 0, 0) };
    var curCam = { p: new THREE.Vector3(0, 40, 58), l: new THREE.Vector3(0, 0.8, 0) };
    var camSm = { p: new THREE.Vector3(0, 40, 58), l: new THREE.Vector3(0, 0.8, 0) };
    camera.position.copy(curCam.p);
    camera.lookAt(curCam.l);
    var lastShotKey = '';

    function phaseInfo(frac) {
      var total = 0; PHASES.forEach(function (p) { total += p.dur; });
      var e = frac * total, acc = 0;
      for (var i = 0; i < PHASES.length; i++) {
        var d = PHASES[i].dur;
        if (e < acc + d || i === PHASES.length - 1) return { i: i, t: U.clamp01((e - acc) / d) };
        acc += d;
      }
      return { i: PHASES.length - 1, t: 1 };
    }
    function fracOf(i, t) {
      var total = 0, acc = 0;
      PHASES.forEach(function (p) { total += p.dur; });
      for (var k = 0; k < i; k++) acc += PHASES[k].dur;
      return (acc + t * PHASES[i].dur) / total;
    }
    function phaseTotal() { var t = 0; PHASES.forEach(function (p) { t += p.dur; }); return t; }

    function shotShake(i, t) {
      var sh = { x: 0, y: 0 };
      if (reduce) return sh;
      for (var k = 0; k < IMPACTS.length; k++) {
        var im = IMPACTS[k];
        if (im.ph !== i || t < im.t) continue;
        var age = (t - im.t) * PHASES[i].dur;
        if (age > 1.2) continue;
        var amp = im.amp * Math.exp(-age * 4.2);
        sh.x += Math.sin(age * 57 + k * 3) * amp;
        sh.y += Math.cos(age * 47) * amp * 0.7;
      }
      return sh;
    }
    function lerpCam(tgt, k) {
      /* frame-rate independent: a slow phone must still reach the phase camera */
      var f = Math.min(6, (clock.dt || 0.016) * 60);
      var kk = 1 - Math.pow(1 - k, f);
      curCam.p.x += (tgt.p[0] - curCam.p.x) * kk;
      curCam.p.y += (tgt.p[1] - curCam.p.y) * kk;
      curCam.p.z += (tgt.p[2] - curCam.p.z) * kk;
      curCam.l.x += (tgt.l[0] - curCam.l.x) * kk;
      curCam.l.y += (tgt.l[1] - curCam.l.y) * kk;
      curCam.l.z += (tgt.l[2] - curCam.l.z) * kk;
      camera.position.copy(curCam.p);
      camera.lookAt(curCam.l);
    }
    function applyCamera(i, t, snap) {
      if (camState.mode === 'preset') {
        lerpCam(camState.preset, snap ? 1 : (reduce ? 0.22 : 0.09));
        return;
      }
      var shots = SHOTS[PHASES[i].id];
      if (!shots) return;
      var kShot = shots.length - 1;
      for (var k = 0; k < shots.length; k++) {
        if (t >= shots[k].t0 && t < shots[k].t1) { kShot = k; break; }
      }
      var shot = shots[kShot];
      var u = U.clamp01((t - shot.t0) / (shot.t1 - shot.t0));
      var key = PHASES[i].id + ':' + kShot;
      var cut = key !== lastShotKey;
      lastShotKey = key;
      var tgt = {
        p: [
          shot.p0[0] + (shot.p1[0] - shot.p0[0]) * u,
          shot.p0[1] + (shot.p1[1] - shot.p0[1]) * u,
          shot.p0[2] + (shot.p1[2] - shot.p0[2]) * u
        ],
        l: [
          shot.l0[0] + (shot.l1[0] - shot.l0[0]) * u,
          shot.l0[1] + (shot.l1[1] - shot.l0[1]) * u,
          shot.l0[2] + (shot.l1[2] - shot.l0[2]) * u
        ]
      };
      var sh = shotShake(i, t);
      /* portrait phones see a narrow horizontal slice: back the camera off and
         lift it so the field stays in frame (the pushed build's rule). A shot
         may carry its own portrait framing, and a scene may cap the pull where
         the generic rule would leave the valley. */
      var pr = camera.aspect < 1 ? shot.portrait : null;
      if (pr) {
        tgt.p = [
          pr.p0[0] + (pr.p1[0] - pr.p0[0]) * u,
          pr.p0[1] + (pr.p1[1] - pr.p0[1]) * u,
          pr.p0[2] + (pr.p1[2] - pr.p0[2]) * u
        ];
        tgt.l = [
          pr.l0[0] + (pr.l1[0] - pr.l0[0]) * u,
          pr.l0[1] + (pr.l1[1] - pr.l0[1]) * u,
          pr.l0[2] + (pr.l1[2] - pr.l0[2]) * u
        ];
      }
      tgt.p[0] += sh.x; tgt.p[1] += sh.y;
      if (camera.aspect < 1 && !pr) {
        var k2 = Math.min(PORTRAIT.cap, Math.pow(1 / camera.aspect, 0.9));
        tgt.p = [
          tgt.l[0] + (tgt.p[0] - tgt.l[0]) * k2,
          tgt.l[1] + (tgt.p[1] - tgt.l[1]) * k2 * 1.12,
          tgt.l[2] + (tgt.p[2] - tgt.l[2]) * k2
        ];
      }
      /* paused and handed to the turntable: a scrub must still carry the view
         to the new shot, so gliding the orbit onto it is the shot's job here */
      if (camState.mode === 'orbit') {
        if (!dragging && !clock.playing) shotGoal = { p: tgt.p.slice(), l: tgt.l.slice() };
        lastShotKey = key;
        return;
      }
      if (cut || snap) {
        /* a cut is a cut: land on the shot's opening frame with no smear */
        curCam.p.set(tgt.p[0], tgt.p[1], tgt.p[2]);
        curCam.l.set(tgt.l[0], tgt.l[1], tgt.l[2]);
        camera.position.copy(curCam.p);
        camera.lookAt(curCam.l);
        return;
      }
      lerpCam(tgt, reduce ? 0.22 : 0.085);
    }

    /* orbit: available whenever the reel is paused; idle drifts slowly */
    var dragging = false, lx = 0, ly = 0;
    var shotGoal = null;
    var lastInteract = performance.now();
    var dragBaseAz = 0, dragBasePol = 0, dragDownX = 0, dragDownY = 0;
    var dragLastX = 0, dragLastT = 0, flingV = 0;
    function orbitFromCam() {
      var o = camera.position.clone().sub(curCam.l);
      orbit.r = Math.max(12, o.length());
      orbit.pol = Math.acos(Math.max(-1, Math.min(1, o.y / orbit.r)));
      orbit.az = Math.atan2(o.z, o.x);
      /* hand over without a jump: the turntable starts exactly where the shot left off */
      orbit.target.copy(curCam.l);
      camSm.p.copy(camera.position);
      camSm.l.copy(curCam.l);
    }
    /* pinch zoom: two pointers, spread/pinch maps to radius */
    var pointers = {};
    var pinchBase = 0, pinchR0 = 0;
    function pinchDist() {
      var ids = Object.keys(pointers);
      if (ids.length < 2) return 0;
      var a = pointers[ids[0]], b = pointers[ids[1]];
      return Math.hypot(a.x - b.x, a.y - b.y);
    }
    canvas.addEventListener('pointerdown', function (e) {
      if (clock.playing) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (Object.keys(pointers).length === 2) {
        /* second finger: switch to pinch mode, freeze orbit drag */
        dragging = false;
        pinchBase = pinchDist();
        pinchR0 = orbit.r;
        canvas.classList.remove('is-dragging');
      } else if (Object.keys(pointers).length === 1) {
        if (camState.mode !== 'orbit') { camState.mode = 'orbit'; orbitFromCam(); }
        dragging = true;
        canvas.classList.add('is-dragging');
        dragDownX = e.clientX; dragDownY = e.clientY;
        dragBaseAz = orbit.az; dragBasePol = orbit.pol;
        dragLastX = e.clientX; dragLastT = performance.now();
        flingV = 0;
      }
      lastInteract = performance.now();
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (pointers[e.pointerId] !== undefined) pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (Object.keys(pointers).length >= 2) {
        var d = pinchDist();
        if (pinchBase > 0 && d > 0) {
          orbit.r = Math.max(9, Math.min(240, pinchR0 * (pinchBase / d)));
          lastInteract = performance.now();
        }
        return;
      }
      if (!dragging) return;
      var dx = e.clientX - dragDownX, dy = e.clientY - dragDownY;
      orbit.az = dragBaseAz + dx * 0.011; /* 1:1 with the hand */
      orbit.pol = Math.max(0.1, Math.min(1.45, dragBasePol - dy * 0.005));
      var tnow = performance.now();
      var vx = (e.clientX - dragLastX) / Math.max(1, tnow - dragLastT);
      flingV = Math.max(-0.12, Math.min(0.12, vx * 0.011));
      dragLastX = e.clientX; dragLastT = tnow;
      lastInteract = tnow;
    });
    function dropPointer(e) {
      delete pointers[e.pointerId];
      if (Object.keys(pointers).length === 0) {
        dragging = false;
        canvas.classList.remove('is-dragging');
        lastInteract = performance.now();
      } else if (Object.keys(pointers).length === 1) {
        /* back to one finger: rebase the drag so there is no jump */
        var id = Object.keys(pointers)[0], p = pointers[id];
        dragging = true;
        dragDownX = p.x; dragDownY = p.y;
        dragBaseAz = orbit.az; dragBasePol = orbit.pol;
        dragLastX = p.x; dragLastT = performance.now();
        flingV = 0;
      }
    }
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      canvas.addEventListener(ev, dropPointer);
    });
    /* zoom toward the point under the cursor; pivot follows when you zoom deep */
    var pendingFocus = null;
    canvas.addEventListener('wheel', function (e) {
      if (clock.playing) return;
      e.preventDefault();
      if (camState.mode !== 'orbit') { camState.mode = 'orbit'; orbitFromCam(); }
      var ndc = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      var ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, camera);
      var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      var hit = new THREE.Vector3();
      var f = Math.pow(1.09, Math.sign(e.deltaY) || 1);
      var nr = Math.max(9, Math.min(240, orbit.r * f));
      if (ray.ray.intersectPlane(plane, hit) && nr !== orbit.r) {
        var k = 1 - nr / orbit.r;
        orbit.target.x += (hit.x - orbit.target.x) * k;
        orbit.target.z += (hit.z - orbit.target.z) * k;
        orbit.target.x = Math.max(-48, Math.min(48, orbit.target.x));
        orbit.target.z = Math.max(-48, Math.min(48, orbit.target.z));
        if (nr < 30) pendingFocus = { x: hit.x, z: hit.z };
      }
      orbit.r = nr;
      lastInteract = performance.now();
    }, { passive: false });
    canvas.addEventListener('dblclick', function () {
      if (camState.mode === 'orbit') { orbitFromCam(); orbit.target.set(0, 0, 0); }
    });

    /* adaptive quality: if the device cannot hold ~22 fps, drop to 1x pixels */
    var perfT0 = 0, perfN = 0, perfDone = false;
    function perfTick(now, playing, renderer) {
      if (perfDone || !playing) return;
      if (!perfT0) { perfT0 = now; perfN = 0; return; }
      perfN++;
      var el = now - perfT0;
      if (el < 3000) return;
      perfDone = true;
      var fps = perfN / (el / 1000);
      if (MOBILE && fps < 22) {
        renderer.setPixelRatio(1);
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        console.log('[seerah] adaptive quality: fps ' + fps.toFixed(1) + ', pixel ratio -> 1');
      }
    }

    function size() {
      var w = window.innerWidth, h = window.innerHeight;
      ctx.renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 0.8 ? 52 : 36; /* portrait keeps the whole field in frame */
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', size);
    size();

    return {
      clock: clock,
      phaseInfo: phaseInfo,
      fracOf: fracOf,
      total: phaseTotal,
      setup: function (opts) {
        PHASES = opts.phases; SHOTS = opts.shots; IMPACTS = opts.impacts || []; PRESETS = opts.presets || {};
        PORTRAIT.cap = (opts.portrait && opts.portrait.cap) || 2.1;
      },
      applyCamera: applyCamera,
      lerpCam: lerpCam,
      orbitFromCam: orbitFromCam,
      mode: function () { return camState.mode; },
      setMode: function (m) { camState.mode = m; if (m !== 'orbit') shotGoal = null; },
      preset: function (name) {
        camState.mode = 'preset';
        camState.preset = PRESETS[name] || PRESETS.ground;
        shotGoal = null;
        return camState.preset;
      },
      curPreset: function () { return camState.preset; },
      setPresetRaw: function (p) { camState.mode = 'preset'; camState.preset = p; shotGoal = null; },
      orbit: orbit,
      curCam: curCam,
      camSm: camSm,
      camInfo: function () {
        return { fov: camera.fov, aspect: +camera.aspect.toFixed(3), p: camera.position.toArray().map(function (n) { return +n.toFixed(1); }), l: curCam.l.toArray().map(function (n) { return +n.toFixed(1); }), mode: camState.mode, tgt: orbit.target.toArray().map(function (n) { return +n.toFixed(1); }), r: +orbit.r.toFixed(1), az: +orbit.az.toFixed(2), pol: +orbit.pol.toFixed(2), goal: shotGoal ? shotGoal.p.map(function (n) { return +n.toFixed(1); }) : null, playing: clock.playing };
      },
      isExplore: function () { return camState.mode === 'orbit'; },
      perfTick: perfTick,
      /* paused: hand the camera to the turntable unless the user is dragging */
      autoOrbit: function (playing) {
        if (playing || dragging || camState.mode === 'orbit') return;
        camState.mode = 'orbit';
        orbitFromCam();
      },
      /* orbit camera: smoothed, with fling inertia and a focus pivot */
      orbitStep: function (dt, playing) {
        if (camState.mode !== 'orbit') return;
        if (playing) shotGoal = null;
        if (shotGoal && dragging) shotGoal = null;
        if (pendingFocus && !dragging) {
          var pf = new THREE.Vector3(pendingFocus.x, 0, pendingFocus.z);
          orbit.target.lerp(pf, 0.04);
          if (orbit.target.distanceTo(pf) < 0.2) pendingFocus = null;
        }
        if (!dragging && !reduce && Math.abs(flingV) > 0.0002) {
          orbit.az += flingV * dt * 60;
          flingV *= Math.pow(0.06, dt);
        }
        if (!dragging && !playing && !reduce && !shotGoal) orbit.az += dt * 0.09;
        /* a paused scrub: glide the turntable onto the shot, then drift again */
        if (shotGoal) {
          var g = shotGoal;
          orbit.target.x += (g.l[0] - orbit.target.x) * 0.12;
          orbit.target.y += (g.l[1] - orbit.target.y) * 0.12;
          orbit.target.z += (g.l[2] - orbit.target.z) * 0.12;
          var gx = g.p[0] - orbit.target.x, gy = g.p[1] - orbit.target.y, gz = g.p[2] - orbit.target.z;
          var gr = Math.max(12, Math.sqrt(gx * gx + gy * gy + gz * gz));
          var gPol = Math.acos(Math.max(-1, Math.min(1, gy / gr)));
          var gAz = Math.atan2(gz, gx);
          var dAz = Math.atan2(Math.sin(gAz - orbit.az), Math.cos(gAz - orbit.az));
          orbit.az += dAz * 0.12;
          orbit.pol += (gPol - orbit.pol) * 0.12;
          orbit.r += (gr - orbit.r) * 0.12;
          if (Math.abs(dAz) < 0.012 && Math.abs(gPol - orbit.pol) < 0.012 && Math.abs(gr - orbit.r) < 0.5 &&
            Math.abs(g.l[0] - orbit.target.x) < 0.5 && Math.abs(g.l[1] - orbit.target.y) < 0.5 && Math.abs(g.l[2] - orbit.target.z) < 0.5) {
            shotGoal = null;
          }
        }
        if (orbit.pol > 1.45) orbit.pol = 1.45; /* the Y-floor below keeps us above the sand */
        var sp = new THREE.Vector3(
          orbit.target.x + orbit.r * Math.sin(orbit.pol) * Math.cos(orbit.az),
          orbit.target.y + orbit.r * Math.cos(orbit.pol),
          orbit.target.z + orbit.r * Math.sin(orbit.pol) * Math.sin(orbit.az)
        );
        camSm.p.lerp(sp, 0.1);
        camSm.l.lerp(orbit.target, 0.1);
        if (camSm.p.y < 1.4) camSm.p.y = 1.4; /* hard floor above the sand */
        camera.position.copy(camSm.p);
        camera.lookAt(camSm.l);
      }
    };
  };

  /* ------------------------------ the battle runner.
     One lifecycle for every battle: the clock, RAF, seek/play, the label pass,
     the paused turntable, the throttled-RAF fallback, the visibility pause and
     the debug API. A battle module supplies phases, shots, applyFrac and the
     per-frame extras; it never owns a render loop of its own. */
  ENGINE.runner = function (ctx, o) {
    o = o || {};
    var renderer = ctx.renderer, scene = ctx.scene, camera = ctx.camera, canvas = ctx.canvas;
    var MOBILE = ctx.MOBILE, reduce = ctx.reduce;
    var director = o.director || ENGINE.director(ctx);
    director.setup({ phases: o.phases, shots: o.shots, impacts: o.impacts || [], presets: o.presets || {}, portrait: o.portrait });
    var clock = director.clock;
    var TOTAL = o.total || director.total();
    var tickCb = null;
    var placedRects = [];
    var curPhaseIdx = 0, curPhaseT = 0;

    function apply(frac) {
      var info = director.phaseInfo(frac);
      curPhaseIdx = info.i;
      curPhaseT = info.t;
      o.applyFrac(frac, info);
    }
    function placeLabels() {
      if (!o.labels) return;
      var w = window.innerWidth, h = window.innerHeight;
      placedRects.length = 0;
      var res = ENGINE.labels.reserved;
      for (var ri = 0; ri < res.length; ri++) placedRects.push(res[ri]);
      var env = { camera: camera, phaseIdx: curPhaseIdx, phaseT: curPhaseT, w: w, h: h, MOBILE: MOBILE, reduce: reduce };
      var units = o.labels.units ? o.labels.units.slice().sort(function (a, b) {
        return (b.u.priority || 0) - (a.u.priority || 0);
      }) : [];
      ENGINE.labels.place(units, true, env, placedRects);
      if (o.labels.landmarks) ENGINE.labels.place(o.labels.landmarks, false, env, placedRects);
    }
    function extras(now) {
      if (o.frame) o.frame({ dt: clock.dt || 0.016, now: now, playing: clock.playing });
    }
    function advance(dt) {
      clock.frac += dt * clock.speed / TOTAL;
      if (clock.frac >= 1) { clock.frac = 1; clock.playing = false; }
      apply(clock.frac);
      if (o.updateMass) o.updateMass();
      if (tickCb) {
        try { tickCb(clock.frac, director.phaseInfo(clock.frac)); }
        catch (err) { console.error('[battle] tick', err); }
      }
    }
    var lastRaf = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      /* follow wall-clock time even on slow devices: a capped dt made playback
         crawl at phone frame rates */
      var dt = Math.min(0.5, (now - clock.last) / 1000);
      clock.last = now;
      clock.dt = dt || 0.016;
      lastRaf = now;
      director.perfTick(now, clock.playing, renderer);
      if (clock.playing) advance(dt);
      /* paused: turntable drift happens inside the orbit step */
      if (!clock.playing) director.autoOrbit();
      director.orbitStep(dt, clock.playing);
      placeLabels();
      extras(now);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
    apply(clock.frac);
    director.applyCamera(curPhaseIdx, curPhaseT, true);
    placeLabels();

    /* fallback ticker: if the device throttles RAF, keep the clock and render alive */
    setInterval(function () {
      if (!clock.playing) return;
      if (performance.now() - lastRaf < 120) return; /* RAF healthy */
      var now = performance.now();
      var dt = Math.min(0.5, (now - clock.last) / 1000);
      clock.last = now;
      clock.dt = dt;
      advance(dt);
      placeLabels();
      extras(now);
      renderer.render(scene, camera);
    }, 33);

    /* pause when the tab is hidden, and never fast-forward on return */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (clock.playing) {
          clock.playing = false;
          if (tickCb) tickCb(clock.frac, director.phaseInfo(clock.frac));
        }
      } else {
        clock.last = performance.now();
      }
    });

    function sceneStats() {
      var meshes = 0, inst = 0, points = 0, mats = {}, geos = {};
      scene.traverse(function (obj) {
        if (obj.isMesh) {
          if (obj.isInstancedMesh) { inst++; return; }
          meshes++;
          var mm = obj.material;
          var key = mm ? (mm.type + ' · #' + (mm.color ? mm.color.getHexString() : '----') + (mm.map ? ' · map' : '')) : 'none';
          mats[key] = (mats[key] || 0) + 1;
          var gk = obj.geometry ? obj.geometry.type : 'none';
          geos[gk] = (geos[gk] || 0) + 1;
        } else if (obj.isPoints) points++;
      });
      return {
        meshes: meshes, instanced: inst, points: points,
        topMats: Object.keys(mats).map(function (k) { return [k, mats[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 12),
        topGeos: Object.keys(geos).map(function (k) { return [k, geos[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 10)
      };
    }

    var api = {
      total: TOTAL,
      phases: o.phases,
      phaseInfo: director.phaseInfo,
      frac: function () { return clock.frac; },
      seek: function (f) {
        clock.frac = U.clamp01(f);
        apply(clock.frac);
        if (o.updateMass) o.updateMass();
        if (tickCb) tickCb(clock.frac, director.phaseInfo(clock.frac));
      },
      play: function () {
        clock.playing = true;
        clock.last = performance.now();
        director.setMode('phase');
        canvas.classList.remove('is-dragging');
        apply(clock.frac);
        if (o.updateMass) o.updateMass();
      },
      pause: function () { clock.playing = false; },
      isPlaying: function () { return clock.playing; },
      setSpeed: function (x) { clock.speed = x; },
      onTick: function (fn) { tickCb = fn; },
      cam: function (name) {
        if (!name || name === 'ground') { director.setMode('phase'); return; }
        director.preset(name);
      },
      explore: function (on) {
        if (on) { director.setMode('orbit'); director.orbitFromCam(); }
        else { director.setMode('phase'); }
      },
      setLang: o.setLang || function () {},
      info: function () { return { calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geoms: renderer.info.memory.geometries }; },
      sceneStats: sceneStats,
      benchMass: o.crowdEnv ? function (n) { return ENGINE.crowd.bench(o.crowdEnv(), n); } : function () { return 0; },
      isExplore: function () { return director.isExplore(); },
      setCam: function (p, l) {
        director.setPresetRaw({ p: p, l: l });
        director.applyCamera(curPhaseIdx, curPhaseT, true);
      },
      snapCam: function (name) {
        if (name) { director.preset(name); }
        else { director.setMode('phase'); }
        var ph = director.phaseInfo(clock.frac);
        director.applyCamera(ph.i, ph.t, true);
      },
      camInfo: function () { return director.camInfo(); },
      ray: function (nx, ny) {
        var ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(nx, ny), camera);
        var hits = ray.intersectObjects(scene.children, true);
        return hits.slice(0, 5).map(function (h) {
          return { d: +h.distance.toFixed(2), geo: h.object.geometry && h.object.geometry.type, col: h.object.material && h.object.material.color ? h.object.material.color.getHexString() : null, p: h.point.toArray().map(function (v) { return +v.toFixed(1); }) };
        });
      },
      director: director
    };
    if (o.api) Object.keys(o.api).forEach(function (k) { api[k] = o.api[k]; });
    window.BATTLE = api;
    try { document.dispatchEvent(new CustomEvent('battle:ready', { detail: api })); } catch (e) { /* old browser */ }
    return api;
  };

  /* ------------------------------ particles */
  ENGINE.particles = function (ctx, heightAt, opts) {
    opts = opts || {};
    var scene = ctx.scene, MOBILE = ctx.MOBILE;
    function softDot() {
      var c = document.createElement('canvas');
      c.width = c.height = 32;
      var g = c.getContext('2d');
      var gr = g.createRadialGradient(16, 16, 1, 16, 16, 15);
      gr.addColorStop(0, 'rgba(255,255,255,0.9)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0.35)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
      return new THREE.CanvasTexture(c);
    }
    var dot = softDot();

    /* drifting dust of the field */
    var DN = MOBILE ? 700 : 1400;
    var dustGeo = new THREE.BufferGeometry();
    var dustP = new Float32Array(DN * 3), dustS = new Float32Array(DN), dustB = new Float32Array(DN * 3);
    function resetDust(i, bounds) {
      dustP[i * 3] = bounds.x0 + Math.random() * bounds.xs;
      dustP[i * 3 + 1] = 0.15 + Math.random() * 2.6;
      dustP[i * 3 + 2] = bounds.z0 + Math.random() * bounds.zs;
      dustB[i * 3] = dustP[i * 3];
      dustB[i * 3 + 1] = dustP[i * 3 + 1];
      dustB[i * 3 + 2] = dustP[i * 3 + 2];
    }
    var dustBounds = opts.dustBounds || { x0: -6, xs: 18, z0: -9, zs: 12 };
    for (var di = 0; di < DN; di++) { dustS[di] = Math.random(); resetDust(di, dustBounds); }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustP, 3));
    var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: opts.dustColor || 0xd0bd99, size: opts.dustSize || 2.6, map: dot, transparent: true, opacity: 0, depthWrite: false }));
    scene.add(dust);
    var dustGain = opts.dustGain === undefined ? 0.3 : opts.dustGain;
    function updateDust(amount) {
      dust.material.opacity = amount * dustGain;
      if (amount > 0.02 && !ctx.reduce) {
        var dp = dust.geometry.attributes.position;
        var nowMs = performance.now();
        for (var dj = 0; dj < DN; dj++) {
          var sw = nowMs / 1600 + dustS[dj] * 6.28;
          dp.setX(dj, dustB[dj * 3] + Math.sin(sw) * 0.6);
          dp.setZ(dj, dustB[dj * 3 + 2] + Math.cos(sw * 0.8) * 0.5);
          dp.setY(dj, dustB[dj * 3 + 1] + (Math.sin(sw * 0.6) + 1) * 0.35);
        }
        dp.needsUpdate = true;
      }
    }

    /* a gold shimmer, never a figure (the help of 8:9 in the Badr ledger):
       low over the Muslim line only, brief and quiet */
    var AN = MOBILE ? 110 : 220;
    var angelGeo = new THREE.BufferGeometry();
    var angelP = new Float32Array(AN * 3), angelS = new Float32Array(AN);
    for (var ag = 0; ag < AN; ag++) {
      angelP[ag * 3] = -10 + Math.random() * 20;
      angelP[ag * 3 + 1] = 2.2 + Math.random() * 5.0;
      angelP[ag * 3 + 2] = -3 + Math.random() * 9;
      angelS[ag] = Math.random();
    }
    angelGeo.setAttribute('position', new THREE.BufferAttribute(angelP, 3));
    var angels = new THREE.Points(angelGeo, new THREE.PointsMaterial({
      color: 0xffe2a8, size: 1.0, map: dot, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    scene.add(angels);
    function updateAngels(amount) {
      angels.material.opacity = amount * 0.4;
      if (amount > 0.02) {
        var ap = angels.geometry.attributes.position;
        var nowA = performance.now();
        for (var aj = 0; aj < AN; aj++) {
          var swA = nowA / 2200 + angelS[aj] * 6.28;
          ap.setX(aj, angelP[aj * 3] + Math.sin(swA) * 0.5);
          ap.setY(aj, angelP[aj * 3 + 1] + Math.cos(swA * 0.7) * 0.4);
          ap.setZ(aj, angelP[aj * 3 + 2] + Math.cos(swA * 0.5) * 0.4);
        }
        ap.needsUpdate = true;
      }
    }

    /* campfire smoke */
    var SMOKE = [];
    function smoke(x, z) {
      var n = MOBILE ? 10 : 22;
      var geo = new THREE.BufferGeometry();
      var pos = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) {
        pos[i * 3] = x + (Math.random() - 0.5) * 0.5;
        pos[i * 3 + 1] = 0.3 + Math.random() * 2.2;
        pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.5;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var mat = new THREE.PointsMaterial({ color: 0xcbbca6, size: 0.8, map: dot, transparent: true, opacity: 0.13, depthWrite: false });
      var pts = new THREE.Points(geo, mat);
      scene.add(pts);
      SMOKE.push({ pts: pts, x: x, z: z });
    }
    function updateSmoke(dt, now) {
      for (var sk = 0; sk < SMOKE.length; sk++) {
        var sm = SMOKE[sk];
        var sp2 = sm.pts.geometry.attributes.position;
        for (var si2 = 0; si2 < sp2.count; si2++) {
          var ny = sp2.getY(si2) + dt * 0.18;
          if (ny > 3.6) { ny = 0.3; sp2.setX(si2, sm.x + (Math.random() - 0.5) * 0.5); sp2.setZ(si2, sm.z + (Math.random() - 0.5) * 0.5); }
          sp2.setY(si2, ny);
          sp2.setX(si2, sp2.getX(si2) + Math.sin(now / 1800 + si2) * 0.002);
        }
        sp2.needsUpdate = true;
      }
    }

    /* arrows: a pooled volley */
    var arrows = [];
    var acc = { arr: 0 };
    function makeArrowPool(makeArrow, n) {
      for (var ai = 0; ai < n; ai++) {
        var am = makeArrow();
        am.visible = false; scene.add(am);
        arrows.push({ m: am, live: false, t: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), dir: new THREE.Vector3(), len: 0 });
      }
    }
    function spawnArrows(dt, speed, makeFrom) {
      acc.arr += dt * (speed || 1) * 14;
      while (acc.arr > 1) {
        acc.arr -= 1;
        var ar = arrows.find(function (a) { return !a.live; });
        if (!ar) return;
        makeFrom(ar);
        ar.t = 0; ar.live = true;
        ar.dir.copy(ar.to).sub(ar.from);
        var len = ar.dir.length(); ar.dir.normalize();
        ar.len = len;
      }
    }
    function updateArrows(dt) {
      for (var q = 0; q < arrows.length; q++) {
        var ar = arrows[q];
        if (!ar.live) continue;
        ar.t += dt * 1.25;
        if (ar.t > 1) { ar.live = false; continue; }
        var v = ar.from.clone().addScaledVector(ar.dir, ar.t * ar.len);
        v.y += Math.sin(U.clamp01(ar.t) * Math.PI) * 2.2;
        ar.m.position.copy(v);
        ar.m.rotation.y = Math.atan2(ar.dir.x, ar.dir.z);
        ar.m.rotation.x = 0.35 - Math.cos(ar.t * Math.PI) * 0.6;
      }
    }

    return {
      dust: { update: updateDust, material: dust.material },
      angels: { update: updateAngels, material: angels.material },
      smoke: { add: smoke, update: updateSmoke, list: SMOKE },
      arrows: {
        pool: arrows,
        makePool: makeArrowPool,
        spawn: spawnArrows,
        update: updateArrows,
        setAllVisible: function (v) { arrows.forEach(function (ar) { ar.m.visible = ar.live && v !== false ? ar.live : false; if (v === false) ar.m.visible = false; }); }
      },
      softDot: softDot
    };
  };
})();