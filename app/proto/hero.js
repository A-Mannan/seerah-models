/* badr · hero frame  (v2)
   Standalone proof for the carved-maquette direction.
   Three rigged figures (Quaternius Adventurer, CC0), a horse, a masonry well,
   a goat-hair tent, a sculpted sand field, dawn light, haze and a 5 s beat.
   Deterministic: HERO.seek(t) poses the whole frame for capture.            */
(function () {
  'use strict';
  var V = THREE;
  var qs = new URLSearchParams(location.search);
  var CAP = qs.has('cap');
  V.Cache.enabled = true;

  /* ---------------------------------------------------------------- utils */
  function hash(x, y) { var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }
  function fbm(x, y, o) {
    var s = 0, a = 0.5, f = 1, i;
    for (i = 0; i < (o || 3); i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= 0.5; }
    return s;
  }
  function smooth(x, a, b) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* ------------------------------------------------------------- renderer */
  var canvas = document.getElementById('gl');
  var renderer = new V.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = V.sRGBEncoding;
  renderer.toneMapping = V.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = V.PCFSoftShadowMap;

  var scene = new V.Scene();
  scene.fog = new V.FogExp2(0xc99a70, 0.0135);

  var camera = new V.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 500);
  camera.position.set(2.6, 1.28, 4.9);

  /* ----------------------------------------------------------------- sky */
  var sunDir = new V.Vector3(-0.78, 0.205, -0.46).normalize();
  var skyMat = new V.ShaderMaterial({
    side: V.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: {
      top: { value: new V.Color(0x14243a) },
      mid: { value: new V.Color(0x5a6678) },
      bot: { value: new V.Color(0xeeb87f) },
      sunDir: { value: sunDir.clone() },
      sunCol: { value: new V.Color(0xffdda8) }
    },
    vertexShader: 'varying vec3 vW; void main(){ vW = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: [
      'uniform vec3 top, mid, bot, sunCol; uniform vec3 sunDir; varying vec3 vW;',
      'void main(){',
      '  float h = clamp(vW.y * 1.05 + 0.09, 0.0, 1.0);',
      '  vec3 c = mix(bot, mid, smoothstep(0.00, 0.26, h));',
      '  c = mix(c, top, smoothstep(0.20, 0.95, h));',
      '  float d = max(dot(vW, sunDir), 0.0);',
      '  c += sunCol * pow(d, 42.0) * 0.95;',
      '  c += sunCol * pow(d, 5.0) * 0.14;',
      '  c = pow(c, vec3(0.4545));',
      '  gl_FragColor = vec4(c, 1.0);',
      '}'
    ].join('\n')
  });
  var sky = new V.Mesh(new V.SphereGeometry(240, 32, 20), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  /* -------------------------------------------------------------- lights */
  var sun = new V.DirectionalLight(0xffc089, 3.9);
  sun.position.copy(sunDir).multiplyScalar(52);
  sun.target.position.set(0, 0.7, -1.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -14; sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14; sun.shadow.camera.bottom = -14;
  sun.shadow.camera.near = 12; sun.shadow.camera.far = 110;
  sun.shadow.bias = -0.0009;
  sun.shadow.normalBias = 0.035;
  scene.add(sun); scene.add(sun.target);

  var skyFill = new V.HemisphereLight(0x86a4c8, 0x4e3724, 0.40);
  scene.add(skyFill);

  // warm bounce from the camera side so the figures read against the dawn
  var bounce = new V.DirectionalLight(0xffc191, 0.55);
  bounce.position.set(9, 3.0, 11);
  scene.add(bounce);

  var rim = new V.DirectionalLight(0xbcd2f0, 0.55);
  rim.position.set(-5, 4, -12);
  scene.add(rim);

  /* ------------------------------------------------------------- terrain */
  var ARENA = { x: 0, z: -0.4, r: 6.4 };
  function heightAt(x, z) {
    var r = Math.hypot(x - ARENA.x, z - ARENA.z);
    var flat = smooth(r, ARENA.r, ARENA.r + 15);
    var h = (fbm(x * 0.031 + 11.2, z * 0.031 + 7.4, 3) - 0.5) * 2.2 * flat;
    h += 5.4 * Math.exp(-Math.pow((x + 19) / 8.5, 2)) * (0.55 + 0.45 * Math.sin(z * 0.05 + 1.1));
    h += 2.6 * Math.exp(-Math.pow((z + 38) / 14, 2));
    h += 2.0 * Math.exp(-Math.pow((x - 26) / 11, 2));
    h += Math.max(0, r - 42) * 0.06;
    h *= smooth(Math.hypot(x, z), 3.0, 7.0) * 0.9 + 0.1;
    return h;
  }

  function rippleNormal(size, repeat) {
    var c = document.createElement('canvas'); c.width = c.height = size;
    var ctx = c.getContext('2d');
    var img = ctx.createImageData(size, size);
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
    ctx.putImageData(img, 0, 0);
    var t = new V.CanvasTexture(c);
    t.wrapS = t.wrapT = V.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }

  var segs = 168, size = 260;
  var terrGeo = new V.PlaneGeometry(size, size, segs, segs);
  terrGeo.rotateX(-Math.PI / 2);
  var pos = terrGeo.attributes.position;
  var colors = new Float32Array(pos.count * 3);
  var cSand = new V.Color(0x8a5c31), cCrest = new V.Color(0xc0905c),
    cTrough = new V.Color(0x46301c), cGrit = new V.Color(0x6f5030);
  var tmpC = new V.Color();
  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i), z = pos.getZ(i);
    var y = heightAt(x, z);
    pos.setY(i, y);
    var v = fbm(x * 0.07 + 3, z * 0.07 + 5, 3);
    var t = Math.min(1, Math.max(0, y * 0.30 + 0.32 + (v - 0.5) * 0.40));
    tmpC.copy(cTrough).lerp(cSand, Math.min(1, t * 1.6)).lerp(cCrest, Math.max(0, t - 0.52) * 1.5);
    tmpC.lerp(cGrit, fbm(x * 0.38, z * 0.38, 2) * 0.34);
    colors[i * 3] = tmpC.r; colors[i * 3 + 1] = tmpC.g; colors[i * 3 + 2] = tmpC.b;
  }
  terrGeo.setAttribute('color', new V.BufferAttribute(colors, 3));
  terrGeo.computeVertexNormals();
  var terrain = new V.Mesh(terrGeo, new V.MeshStandardMaterial({
    vertexColors: true, roughness: 1, metalness: 0,
    normalMap: rippleNormal(256, 26), normalScale: new V.Vector2(0.22, 0.22)
  }));
  terrain.receiveShadow = true;
  terrain.name = 'terrain';
  scene.add(terrain);

  /* --------------------------------------------------------- prop helpers */
  var MAT = {
    stone: new V.MeshStandardMaterial({ color: 0x8f7f68, roughness: 0.97, flatShading: true }),
    stoneDark: new V.MeshStandardMaterial({ color: 0x5d5342, roughness: 1 }),
    wood: new V.MeshStandardMaterial({ color: 0x4e3a28, roughness: 0.96, flatShading: true }),
    rope: new V.MeshStandardMaterial({ color: 0x7d6844, roughness: 1, flatShading: true }),
    clothDark: new V.MeshStandardMaterial({ color: 0x241d16, roughness: 1, flatShading: true, side: V.DoubleSide }),
    clothWarm: new V.MeshStandardMaterial({ color: 0x4e3c2b, roughness: 1, flatShading: true, side: V.DoubleSide }),
    props: new V.MeshStandardMaterial({ color: 0x9fa3a4, roughness: 0.45, metalness: 0.5, flatShading: true }),
    scrub: new V.MeshStandardMaterial({ color: 0x6b6640, roughness: 1, flatShading: true }),
    palm: new V.MeshStandardMaterial({ color: 0x596236, roughness: 1, flatShading: true, side: V.DoubleSide }),
    trunk: new V.MeshStandardMaterial({ color: 0x503d2c, roughness: 1, flatShading: true }),
    pebble: new V.MeshStandardMaterial({ color: 0x8b7658, roughness: 1, flatShading: true })
  };

  function shadowed(m, cast, receive) { m.castShadow = !!cast; m.receiveShadow = receive !== false; return m; }

  /* ------------------------------------------------------------------ well */
  function buildWell(px, pz) {
    var g = new V.Group();
    var R = 0.92, H = 1.02;

    // solid wall so no light leaks between stones
    var wall = new V.Mesh(new V.CylinderGeometry(R, R * 1.03, H, 20, 1, true), MAT.stoneDark);
    wall.position.y = H / 2;
    g.add(shadowed(wall, true));

    // facing blocks, wide enough to touch
    var per = 14, bw = (2 * Math.PI * R / per) * 1.02;
    for (var c = 0; c < 3; c++) {
      for (var k = 0; k < per; k++) {
        var a = (k + (c % 2 ? 0.5 : 0)) / per * Math.PI * 2;
        var bh = 0.30 + hash(k + 9, c) * 0.05;
        var b = new V.Mesh(new V.BoxGeometry(bw, bh, 0.16), MAT.stone);
        b.position.set(Math.cos(a) * (R + 0.045), 0.17 + c * 0.32 + hash(k, c + 2) * 0.012, Math.sin(a) * (R + 0.045));
        b.rotation.y = -a + Math.PI / 2;
        b.rotation.z = (hash(k, c + 5) - 0.5) * 0.03;
        g.add(shadowed(b, true));
      }
    }

    // parapet ring + stone lip
    for (var rr = 0; rr < per; rr++) {
      var ra = rr / per * Math.PI * 2;
      var cap = new V.Mesh(new V.BoxGeometry(0.40, 0.11, 0.34), MAT.stoneDark);
      cap.position.set(Math.cos(ra) * (R + 0.02), H + 0.02, Math.sin(ra) * (R + 0.02));
      cap.rotation.y = -ra + Math.PI / 2;
      g.add(shadowed(cap, true));
    }

    // dark mouth + water
    var mouth = new V.Mesh(new V.CircleGeometry(R - 0.16, 20),
      new V.MeshStandardMaterial({ color: 0x100c08, roughness: 1 }));
    mouth.rotation.x = -Math.PI / 2; mouth.position.y = H - 0.03; g.add(mouth);
    var shaft = new V.Mesh(new V.CylinderGeometry(R - 0.17, R - 0.22, 1.5, 18, 1, true),
      new V.MeshStandardMaterial({ color: 0x17110c, roughness: 1, side: V.BackSide }));
    shaft.position.y = H - 0.78; g.add(shaft);
    var water = new V.Mesh(new V.CircleGeometry(R - 0.24, 18),
      new V.MeshStandardMaterial({ color: 0x152321, roughness: 0.22, metalness: 0.25 }));
    water.rotation.x = -Math.PI / 2; water.position.y = 0.10; g.add(water);

    // curb stones on the sand
    for (var s2 = 0; s2 < 11; s2++) {
      var sa = s2 / 11 * Math.PI * 2 + 0.3;
      var st = new V.Mesh(new V.IcosahedronGeometry(0.16 + hash(s2, 3) * 0.07, 0), MAT.stoneDark);
      st.position.set(Math.cos(sa) * (R + 0.34), 0.07, Math.sin(sa) * (R + 0.34));
      st.rotation.set(hash(s2, 1) * 3, hash(s2, 2) * 3, hash(s2, 3) * 3);
      st.scale.y = 0.6;
      g.add(shadowed(st, true));
    }

    // posts, beam, rope, bucket
    var p1 = new V.Mesh(new V.CylinderGeometry(0.062, 0.078, 1.72, 7), MAT.wood);
    p1.position.set(-0.86, 0.86, 0); p1.rotation.z = 0.045; g.add(shadowed(p1, true));
    var p2 = p1.clone(); p2.position.x = 0.86; p2.rotation.z = -0.045; g.add(shadowed(p2, true));
    var beam = new V.Mesh(new V.CylinderGeometry(0.042, 0.042, 1.80, 6), MAT.wood);
    beam.rotation.z = Math.PI / 2; beam.position.y = 1.66; g.add(shadowed(beam, true));
    var rope = new V.Mesh(new V.CylinderGeometry(0.013, 0.013, 0.95, 4), MAT.rope);
    rope.position.set(0.10, 1.17, 0); g.add(rope);
    var bucket = new V.Mesh(new V.CylinderGeometry(0.14, 0.11, 0.22, 8), MAT.wood);
    bucket.position.set(0.10, 0.62, 0); g.add(shadowed(bucket, true));

    g.position.set(px, heightAt(px, pz) - 0.04, pz);
    g.rotation.y = 0.5;
    return g;
  }
  scene.add(buildWell(-7.2, -7.8));

  /* ------------------------------------------------------------------ tent */
  function buildTent(px, pz, w, d, h) {
    var g = new V.Group();

    function roof(scale, dy, mat, sagAmt) {
      var nu = 22, nz = 16;
      var geo = new V.BufferGeometry();
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
      geo.setAttribute('position', new V.Float32BufferAttribute(vs, 3));
      geo.setAttribute('uv', new V.Float32BufferAttribute(uvs, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      return shadowed(new V.Mesh(geo, mat), true);
    }

    // dark interior, warm outer felt
    g.add(roof(0.90, -0.10, new V.MeshStandardMaterial({ color: 0x160f0a, roughness: 1, flatShading: true, side: V.DoubleSide }), 0.10));
    g.add(roof(1.0, 0, MAT.clothWarm, 0.13));
    // back wall
    var backMat = new V.MeshStandardMaterial({ color: 0x3a2d21, roughness: 1, flatShading: true, side: V.DoubleSide });
    var bw = new V.Mesh(new V.PlaneGeometry(w * 0.98, h * 0.95, 10, 8), backMat);
    var bp = bw.geometry.attributes.position;
    for (var bi = 0; bi < bp.count; bi++) {
      var bx = bp.getX(bi), by = bp.getY(bi);
      var arch2 = Math.pow(Math.max(0, 1 - Math.abs(bx / (w * 0.49))), 1.45);
      bp.setY(bi, Math.min(by + h * 0.475, h * arch2 * 0.92));
    }
    bw.geometry.computeVertexNormals();
    bw.rotation.y = Math.PI;
    bw.position.z = -d * 0.49;
    g.add(shadowed(bw, true));

    // ridge poles
    [-1, 1].forEach(function (f) {
      var p = new V.Mesh(new V.CylinderGeometry(0.055, 0.07, h + 0.3, 6), MAT.wood);
      p.position.set(0, (h + 0.3) / 2, f * d * 0.44);
      g.add(shadowed(p, true));
      [f > 0 ? 1 : -1].forEach(function (sx) {
        var ex = sx * w * 0.62, ez = f * d * 0.62;
        var gp = new V.Mesh(new V.CylinderGeometry(0.011, 0.011, 1.9, 3), MAT.rope);
        var len = Math.hypot(ex, h * 0.5, ez - f * d * 0.44);
        gp.position.set(ex * 0.5, h * 0.45, (f * d * 0.44 + ez) * 0.5);
        gp.lookAt(new V.Vector3(ex, 0.02, ez));
        gp.rotateX(Math.PI / 2);
        gp.scale.y = len / 1.9;
        g.add(gp);
        var peg = new V.Mesh(new V.CylinderGeometry(0.028, 0.045, 0.15, 5), MAT.wood);
        peg.position.set(ex, 0.05, ez); g.add(peg);
      });
    });
    g.position.set(px, heightAt(px, pz) - 0.03, pz);
    return g;
  }
  var tent = buildTent(-11.2, 1.4, 5.2, 6.6, 1.75);
  tent.rotation.y = 1.52;
  scene.add(tent);
  var tent2 = buildTent(-14.0, -6.2, 3.8, 4.6, 1.4);
  tent2.rotation.y = 1.3;
  scene.add(tent2);

  /* ------------------------------------------------------------- rock/scrub */
  function rock(px, pz, s) {
    var g = new V.Group();
    for (var l = 0; l < 3; l++) {
      var geo = new V.IcosahedronGeometry(s * (0.72 - l * 0.13), 0);
      var p = geo.attributes.position;
      for (var i = 0; i < p.count; i++) {
        var f = 0.82 + hash(i, l + 2) * 0.36;
        p.setXYZ(i, p.getX(i) * f * 1.35, p.getY(i) * f * 0.55, p.getZ(i) * f);
      }
      geo.computeVertexNormals();
      var m = new V.Mesh(geo, l === 2 ? MAT.stoneDark : MAT.stone);
      m.position.y = 0.10 + l * s * 0.30;
      m.rotation.y = hash(l, 7) * 3;
      g.add(shadowed(m, true));
    }
    g.position.set(px, heightAt(px, pz), pz);
    return g;
  }
  [[-3.2, -7.4, 0.95], [2.4, -9.2, 0.7], [-9.6, -8.2, 1.15], [4.6, -4.0, 0.8], [-13.0, 6.4, 0.62]].forEach(function (r) {
    scene.add(rock(r[0], r[1], r[2]));
  });

  var scrubGeo = new V.ConeGeometry(0.13, 0.46, 4, 1);
  var scrubN = 300;
  var scrub = new V.InstancedMesh(scrubGeo, MAT.scrub, scrubN);
  var dummy = new V.Object3D();
  for (var si = 0; si < scrubN; si++) {
    var a2 = hash(si, 1) * Math.PI * 2, rr = 6.5 + Math.pow(hash(si, 2), 0.6) * 46;
    var sx = Math.cos(a2) * rr, sz = Math.sin(a2) * rr - 3;
    dummy.position.set(sx, heightAt(sx, sz) + 0.14, sz);
    dummy.rotation.set((hash(si, 3) - 0.5) * 0.5, hash(si, 4) * 3, (hash(si, 5) - 0.5) * 0.5);
    var sc = 0.5 + hash(si, 6) * 1.1;
    dummy.scale.set(sc, sc * (0.7 + hash(si, 7) * 0.9), sc);
    dummy.updateMatrix();
    scrub.setMatrixAt(si, dummy.matrix);
  }
  scrub.receiveShadow = true;
  scene.add(scrub);

  var pebGeo = new V.DodecahedronGeometry(0.055, 0);
  var pebN = 420;
  var pebbles = new V.InstancedMesh(pebGeo, MAT.pebble, pebN);
  for (var pi = 0; pi < pebN; pi++) {
    var pa = hash(pi, 11) * Math.PI * 2, pr = 1.2 + Math.pow(hash(pi, 12), 0.7) * 26;
    var px2 = Math.cos(pa) * pr, pz2 = Math.sin(pa) * pr - 1.5;
    dummy.position.set(px2, heightAt(px2, pz2) + 0.02, pz2);
    dummy.rotation.set(hash(pi, 13) * 3, hash(pi, 14) * 3, hash(pi, 15) * 3);
    var ps = 0.5 + hash(pi, 16) * 1.6;
    dummy.scale.set(ps, ps * 0.6, ps * (0.8 + hash(pi, 17) * 0.5));
    dummy.updateMatrix();
    pebbles.setMatrixAt(pi, dummy.matrix);
  }
  pebbles.receiveShadow = true;
  scene.add(pebbles);

  /* ------------------------------------------------------------------ palm */
  function frondGeometry(len, droop) {
    var segsF = 7;
    var geo = new V.BufferGeometry();
    var vs = [], idx = [], uv = [];
    for (var i2 = 0; i2 <= segsF; i2++) {
      var t = i2 / segsF;
      var wdt = Math.sin(Math.pow(t, 0.55) * Math.PI) * 0.19 * (1 - t * 0.25);
      var x = t * len;
      var y = -Math.pow(t, 1.9) * droop;
      vs.push(x, y, -wdt, x, y, wdt);
      uv.push(t, 0, t, 1);
    }
    for (var j = 0; j < segsF; j++) {
      var a = j * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, c, b, b, c, d);
    }
    geo.setAttribute('position', new V.Float32BufferAttribute(vs, 3));
    geo.setAttribute('uv', new V.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }
  function palm(px, pz, h) {
    var g = new V.Group();
    var segsN = 8;
    var lean = 0.5;
    for (var i3 = 0; i3 < segsN; i3++) {
      var t = i3 / segsN;
      var seg = new V.Mesh(new V.CylinderGeometry(0.115 * (1 - t * 0.45), 0.15 * (1 - t * 0.4), h / segsN * 1.06, 6), MAT.trunk);
      seg.position.set(Math.sin(t * 1.6) * lean * t, h * (t + 0.5 / segsN), Math.cos(t * 1.1) * 0.22 * t);
      seg.rotation.z = -Math.cos(t * 1.6) * 0.12;
      g.add(shadowed(seg, true));
    }
    var crown = new V.Vector3(Math.sin(1.6) * lean, h, Math.cos(1.1) * 0.22);
    var count = 11;
    for (var f = 0; f < count; f++) {
      var fa = f / count * Math.PI * 2 + 0.25;
      var len = 1.5 + hash(f, 2) * 1.0;
      var droop = 0.9 + hash(f, 4) * 1.3;
      var fr = new V.Mesh(frondGeometry(len, droop), MAT.palm);
      fr.position.copy(crown);
      fr.rotation.y = fa;
      fr.rotation.z = 0.55 + hash(f, 5) * 0.35;
      fr.rotation.x = (hash(f, 6) - 0.5) * 0.25;
      g.add(shadowed(fr, true, true));
    }
    // dates cluster
    var cluster = new V.Mesh(new V.IcosahedronGeometry(0.17, 0), new V.MeshStandardMaterial({ color: 0xa8702f, roughness: 1, flatShading: true }));
    cluster.position.copy(crown).add(new V.Vector3(0.12, -0.18, 0));
    g.add(shadowed(cluster, true));
    g.position.set(px, heightAt(px, pz) - 0.1, pz);
    return g;
  }
  scene.add(palm(-9.4, 6.2, 3.9));
  scene.add(palm(-11.6, -1.6, 3.4));
  scene.add(palm(-7.2, -8.6, 3.0));

  /* --------------------------------------------------------- figure set-up */
  var PAL = {
    champion: { body: 0xd8d2c4, legs: 0x5f5240, feet: 0x3f2f22, head: 0x2a2833, cloak: 0x39433a },
    soldier: { body: 0xbfb2a0, legs: 0x54483a, feet: 0x3a2b20, head: 0x33303b, cloak: 0x64453a },
    quraysh: { body: 0x6d3d29, legs: 0x452e20, feet: 0x33251b, head: 0x3a2c25, cloak: 0x71412d }
  };

  function skinnedMat(color, extra) {
    var o = { color: color, roughness: 0.95, metalness: 0, flatShading: true, skinning: true };
    if (extra) for (var k in extra) o[k] = extra[k];
    return new V.MeshStandardMaterial(o);
  }

  function applyPalette(root, pal) {
    root.traverse(function (o) {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      var nm = o.name || '';
      if (/Backpack/i.test(nm)) { o.visible = false; return; }
      var col = pal.body;
      if (/Legs/i.test(nm)) col = pal.legs;
      else if (/Feet/i.test(nm)) col = pal.feet;
      else if (/Head/i.test(nm)) col = pal.head;
      o.material = skinnedMat(col);
    });
  }

  /* world-aligned holder on a bone: keeps a prop upright at bind, then follows it */
  function boneHolder(bone) {
    bone.updateMatrixWorld(true);
    var q0 = bone.getWorldQuaternion(new V.Quaternion());
    var ws = bone.getWorldScale(new V.Vector3());
    var holder = new V.Group();
    holder.quaternion.copy(q0).invert();
    holder.scale.set(1 / ws.x, 1 / ws.y, 1 / ws.z);
    bone.add(holder);
    return holder;
  }

  function scaleHolder(bone) {
    var ws = bone.getWorldScale(new V.Vector3());
    var h = new V.Group();
    h.scale.set(1 / ws.x, 1 / ws.y, 1 / ws.z);
    bone.add(h);
    return h;
  }

  function faceWrap(bone, height, opts) {
    var s = height / 1.78;
    var g = boneHolder(bone);
    var wrapMat = new V.MeshStandardMaterial({ color: opts.wrap, roughness: 1, flatShading: true });
    var bandMat = new V.MeshStandardMaterial({ color: opts.band, roughness: 1, flatShading: true });
    var darkMat = new V.MeshStandardMaterial({ color: opts.dark, roughness: 1, flatShading: true });

    // cloth-wrapped head: no face, ever
    var skull = new V.Mesh(new V.SphereGeometry(0.114 * s, 14, 10), wrapMat);
    skull.scale.set(1.0, 1.10, 1.04);
    skull.position.y = 0.078 * s;
    g.add(shadowed(skull, true));
    var neck = new V.Mesh(new V.CylinderGeometry(0.056 * s, 0.070 * s, 0.13 * s, 10), wrapMat);
    neck.position.y = -0.045 * s;
    g.add(shadowed(neck, true));

    if (opts.helm) {
      var cap = new V.Mesh(new V.SphereGeometry(0.130 * s, 12, 9, 0, Math.PI * 2, 0, Math.PI * 0.66), bandMat);
      cap.scale.set(1, 1.16, 1.04);
      cap.position.y = 0.078 * s;
      g.add(shadowed(cap, true));
      var brow = new V.Mesh(new V.CylinderGeometry(0.145 * s, 0.141 * s, 0.040 * s, 12), darkMat);
      brow.position.y = 0.055 * s;
      g.add(shadowed(brow, true));
      var nasal = new V.Mesh(new V.BoxGeometry(0.022 * s, 0.10 * s, 0.024 * s), darkMat);
      nasal.position.set(0, 0.005 * s, 0.138 * s);
      g.add(nasal);
      var spike = new V.Mesh(new V.ConeGeometry(0.028 * s, 0.10 * s, 6), darkMat);
      spike.position.y = 0.245 * s;
      g.add(shadowed(spike, true));
      var cheek = new V.Mesh(new V.CylinderGeometry(0.118 * s, 0.100 * s, 0.12 * s, 12, 1, true), darkMat);
      cheek.position.y = -0.025 * s;
      g.add(shadowed(cheek, true));
    } else {
      var wound = new V.Mesh(new V.TorusGeometry(0.104 * s, 0.052 * s, 6, 18), bandMat);
      wound.rotation.x = Math.PI / 2;
      wound.position.y = 0.163 * s;
      g.add(shadowed(wound, true));
      var crease = new V.Mesh(new V.TorusGeometry(0.108 * s, 0.022 * s, 4, 18), darkMat);
      crease.rotation.x = Math.PI / 2;
      crease.position.y = 0.118 * s;
      g.add(shadowed(crease, true));
      var top = new V.Mesh(new V.SphereGeometry(0.108 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), bandMat);
      top.scale.set(1, 0.46, 1);
      top.position.y = 0.170 * s;
      g.add(shadowed(top, true));
      var knot = new V.Mesh(new V.SphereGeometry(0.036 * s, 6, 5), darkMat);
      knot.position.set(0.085 * s, 0.135 * s, -0.055 * s);
      g.add(shadowed(knot, true));
    }
    return g;
  }

  function clothKit(chest, height, pal) {
    var s = height / 1.78;
    var g = boneHolder(chest);
    var sashMat = new V.MeshStandardMaterial({ color: pal.cloak, roughness: 1, flatShading: true, side: V.DoubleSide });

    // diagonal sash: right shoulder to left hip
    var sash = new V.Mesh(new V.PlaneGeometry(0.155 * s, 0.86 * s, 1, 10), sashMat);
    var sp = sash.geometry.attributes.position;
    for (var i = 0; i < sp.count; i++) {
      var yy = sp.getY(i);
      sp.setZ(i, Math.sin((yy / (0.86 * s) + 0.5) * Math.PI) * 0.055 * s);
    }
    sash.geometry.computeVertexNormals();
    sash.position.set(-0.02 * s, -0.16 * s, 0.165 * s);
    sash.rotation.z = 0.62;
    g.add(shadowed(sash, true));

    // short cloak hanging behind the shoulders
    var cloak = new V.Mesh(new V.PlaneGeometry(0.52 * s, 1.02 * s, 6, 8), sashMat);
    var cp = cloak.geometry.attributes.position;
    for (var j = 0; j < cp.count; j++) {
      var x = cp.getX(j), y = cp.getY(j);
      var t = 1 - (y / (1.02 * s) + 0.5);
      cp.setX(j, x * (0.78 + t * 0.42));
      cp.setZ(j, -Math.pow(Math.abs(x) / (0.26 * s), 2) * 0.10 * s + t * 0.05 * s);
    }
    cloak.geometry.computeVertexNormals();
    cloak.position.set(0, -0.10 * s, -0.185 * s);
    cloak.rotation.x = 0.06;
    g.add(shadowed(cloak, true));
    return g;
  }

  function tunic(bone, height, pal) {
    var s = height / 1.78;
    var g = boneHolder(bone);
    var skirt = new V.Mesh(new V.CylinderGeometry(0.198 * s, 0.272 * s, 0.46 * s, 14, 1, true),
      new V.MeshStandardMaterial({ color: pal.body, roughness: 1, flatShading: true, side: V.DoubleSide }));
    skirt.position.y = -0.255 * s;
    g.add(shadowed(skirt, true));
    var belt = new V.Mesh(new V.TorusGeometry(0.208 * s, 0.025 * s, 5, 16),
      new V.MeshStandardMaterial({ color: pal.legs, roughness: 1, flatShading: true }));
    belt.rotation.x = Math.PI / 2;
    belt.position.y = -0.045 * s;
    g.add(shadowed(belt, true));
    return g;
  }

  function mantle(bone, height, color) {
    var s = height / 1.78;
    var g = boneHolder(bone);
    var geo = new V.CylinderGeometry(0.255 * s, 0.33 * s, 0.62 * s, 12, 1, true, Math.PI * 0.34, Math.PI * 1.32);
    var m = new V.Mesh(geo, new V.MeshStandardMaterial({ color: color, roughness: 1, flatShading: true, side: V.DoubleSide }));
    m.position.y = -0.30 * s;
    g.add(shadowed(m, true));
    return g;
  }

  /* normalize a loaded glb prop: centre it, size it, aim its axis */
  function prepProp(src, opts) {
    var obj = src.clone(true);
    obj.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.material = MAT.props; } });
    var wrap = new V.Group();
    wrap.add(obj);
    wrap.updateMatrixWorld(true);
    var box = new V.Box3().setFromObject(wrap);
    var sz = box.getSize(new V.Vector3());
    var arr = [sz.x, sz.y, sz.z];
    var longest = Math.max(arr[0], arr[1], arr[2]);
    var idx = opts.mode === 'disc'
      ? (arr[0] <= arr[1] && arr[0] <= arr[2] ? 0 : (arr[1] <= arr[2] ? 1 : 2))
      : arr.indexOf(longest);
    var s = opts.len / longest;
    obj.scale.multiplyScalar(s);
    wrap.updateMatrixWorld(true);
    var box2 = new V.Box3().setFromObject(wrap);
    var c = box2.getCenter(new V.Vector3());
    obj.position.sub(c);
    var axisVec = new V.Vector3(idx === 0 ? 1 : 0, idx === 1 ? 1 : 0, idx === 2 ? 1 : 0);
    if (opts.grip) obj.position.addScaledVector(axisVec, -opts.grip * opts.len);
    var q = new V.Quaternion().setFromUnitVectors(axisVec, opts.dir.clone().normalize());
    wrap.quaternion.copy(q);
    return wrap;
  }

  var CLIP = {
    idle: 'CharacterArmature|Idle_Sword',
    neutral: 'CharacterArmature|Idle',
    walk: 'CharacterArmature|Walk',
    attack: 'CharacterArmature|Sword_Slash',
    hit: 'CharacterArmature|HitRecieve',
    hit2: 'CharacterArmature|HitRecieve_2',
    death: 'CharacterArmature|Death'
  };

  var world = { ready: false };
  var master = null;
  var figures = {};
  var assets = {};

  function setAction(fig, name, time) {
    var a = fig.actions[name];
    if (!a) return 0;
    for (var k in fig.actions) {
      var o = fig.actions[k];
      if (o === a) continue;
      o.stop();
      o.enabled = false;
      o.setEffectiveWeight(0);
    }
    a.enabled = true;
    a.setEffectiveWeight(1);
    a.play();
    var dur = a.getClip().duration;
    a.time = dur > 0 ? ((time % dur) + dur) % dur : 0;
    a.paused = true;
    fig.current = name;
    fig.mixer.update(0);
    return dur;
  }

  function makeFigure(opts) {
    var root = V.SkeletonUtils.clone(master);
    var holder = new V.Group();
    holder.add(root);
    applyPalette(root, opts.pal);
    var box = new V.Box3().setFromObject(root);
    var h = box.max.y - box.min.y;
    var s = opts.height / h;
    root.scale.setScalar(s);
    root.position.y = -box.min.y * s;

    root.updateMatrixWorld(true);
    var head = root.getObjectByName('Head');
    var wristR = root.getObjectByName('WristR');
    var wristL = root.getObjectByName('WristL');
    var chest = root.getObjectByName('Chest');
    var hips = root.getObjectByName('Hips');

    var mixer = new V.AnimationMixer(root);
    var actions = {};
    master.animations.forEach(function (clip) { actions[clip.name] = mixer.clipAction(clip); });
    var fig = { root: root, holder: holder, mixer: mixer, actions: actions, height: opts.height, kind: opts.kind };

    setAction(fig, opts.baseClip || CLIP.idle, 0);
    root.updateMatrixWorld(true);

    if (head) faceWrap(head, opts.height, opts.hood);
    // cloth add-ons disabled: rigid panels fight the rig; the headwrap carries the silhouette

    var fwd = new V.Vector3(Math.sin(opts.face), 0, Math.cos(opts.face));
    var right = new V.Vector3(Math.cos(opts.face), 0, -Math.sin(opts.face));
    var up = new V.Vector3(0, 1, 0);

    if (wristR && opts.weapon) {
      var w = prepProp(opts.weapon(), {
        mode: 'blade', len: opts.weaponLen,
        dir: new V.Vector3(0, opts.bladeSign || -1, 0), grip: opts.grip || 0
      });
      scaleHolder(wristR).add(w);
      fig.weapon = w;
    }
    return fig;
  }

  /* --------------------------------------------------------------- loader */
  var statusEl = document.getElementById('status');
  var loaderFBX = new V.FBXLoader();
  var loaderGLB = new V.GLTFLoader();
  function loadFBX(url) { return new Promise(function (res, rej) { loaderFBX.load(url, res, undefined, rej); }); }
  function loadGLB(url) { return new Promise(function (res, rej) { loaderGLB.load(url, res, undefined, rej); }); }

  Promise.all([
    loadFBX('../assets/models/quaternius/Adventurer.fbx'),
    loadGLB('../assets/models/quaternius/Sword.glb'),
    loadGLB('../assets/models/quaternius/Spear.glb'),
    loadGLB('../assets/models/quaternius/Shield_Round.glb'),
    loadGLB('../assets/models/quaternius/Horse.glb')
  ]).then(function (r) {
    master = r[0];
    assets.sword = r[1].scene; assets.spear = r[2].scene;
    assets.shield = r[3].scene; assets.horse = r[4];

    figures.champion = makeFigure({
      height: 1.79, kind: 'champion', pal: PAL.champion, face: Math.PI,
      weapon: function () { return assets.sword; }, weaponLen: 0.60, weaponTilt: 0.62, grip: 0.42,
      shield: function () { return assets.shield; }, shieldLen: 0.54,
      hood: { wrap: 0x2d2a35, band: 0xd8cdb2, dark: 0x6f5f49, helm: false }
    });
    figures.soldier = makeFigure({
      height: 1.72, kind: 'soldier', pal: PAL.soldier, face: Math.PI,
      weapon: function () { return assets.spear; }, weaponLen: 2.25, weaponTilt: 1.35, grip: 0.30,
      hood: { wrap: 0x352f3a, band: 0xcfc3a8, dark: 0x7f6a4c, helm: false }
    });
    figures.quraysh = makeFigure({
      height: 1.84, kind: 'quraysh', pal: PAL.quraysh, face: 0,
      weapon: function () { return assets.spear; }, weaponLen: 2.30, weaponTilt: 1.45, grip: 0.32,
      shield: function () { return assets.shield; }, shieldLen: 0.56,
      hood: { wrap: 0x54554f, band: 0x7b7c74, dark: 0x33322e, helm: true }
    });

    scene.add(figures.champion.holder);
    scene.add(figures.soldier.holder);
    scene.add(figures.quraysh.holder);

    var horse = assets.horse.scene;
    horse.traverse(function (o) {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        o.material = skinnedMat(0x412d21, { roughness: 0.92 });
      }
    });
    var hb = new V.Box3().setFromObject(horse);
    var hs = 1.56 / (hb.max.y - hb.min.y);
    horse.scale.setScalar(hs);
    horse.position.y = -hb.min.y * hs;
    var horseWrap = new V.Group();
    horseWrap.add(horse);
    horseWrap.position.set(-6.6, heightAt(-6.6, 3.6) - 0.03, 3.6);
    horseWrap.rotation.y = -1.35;
    // horse held back: the Quaternius horse reads as a toy at this scale
    var hAnim = (assets.horse.animations || []).filter(function (c) { return /Idle/i.test(c.name); })[0] || assets.horse.animations[0];
    if (hAnim) {
      var hm = new V.AnimationMixer(horse);
      hm.clipAction(hAnim).play();
      world.horseMixer = hm;
    }

    world.ready = true;
    statusEl.textContent = 'ready';
    seek(parseFloat(qs.get('t') || '0'));
    wallClock.start();
  }).catch(function (e) {
    statusEl.textContent = 'error: ' + (e && e.message || e);
    console.error(e);
  });

  /* ------------------------------------------------------------ choreography */
  var T = { end: 5.0, cut: 2.05, swing: 2.30, impact: 2.62, hit: 2.74 };
  var CHAMP = { z0: 3.05, z1: 0.18, x: -0.60 };
  var SOLDIER = { z0: 4.60, z1: 3.30, x: -6.00 };
  var QUR = { z0: -0.66, z1: -1.22, x: 0.58 };

  function place(fig, x, z, faceY) {
    fig.holder.position.set(x, heightAt(x, z), z);
    fig.holder.rotation.y = faceY;
  }

  function dustBurst(origin) {
    var N = 80;
    var geo = new V.BufferGeometry();
    var posA = new Float32Array(N * 3);
    var seeds = [];
    for (var i = 0; i < N; i++) {
      seeds.push({
        a: hash(i, 1) * Math.PI * 2, r: Math.pow(hash(i, 2), 0.5),
        sp: 0.45 + hash(i, 3) * 1.7, up: 0.25 + hash(i, 4) * 1.35,
        rf: 0.5 + hash(i, 5) * 1.4
      });
    }
    geo.setAttribute('position', new V.BufferAttribute(posA, 3));
    var cv = document.createElement('canvas'); cv.width = cv.height = 64;
    var ctx = cv.getContext('2d');
    var grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,247,232,.95)');
    grd.addColorStop(0.45, 'rgba(233,205,166,.5)');
    grd.addColorStop(1, 'rgba(200,168,128,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
    var mat = new V.PointsMaterial({
      size: 0.11, map: new V.CanvasTexture(cv), transparent: true, depthWrite: false,
      opacity: 0.40, sizeAttenuation: true, color: 0xd6bd9c
    });
    var pts = new V.Points(geo, mat);
    pts.frustumCulled = false;
    pts.position.copy(origin);
    scene.add(pts);
    return { pts: pts, geo: geo, seeds: seeds, N: N, mat: mat };
  }

  var dust = null;
  var impactPoint = new V.Vector3((CHAMP.x + QUR.x) * 0.5, 0.72, (CHAMP.z1 + QUR.z0) * 0.5);

  function updateDust(t) {
    if (!dust) return;
    var age = t - T.impact;
    var p = dust.geo.attributes.position;
    if (age < 0) { dust.mat.opacity = 0; p.needsUpdate = true; return; }
    dust.mat.opacity = Math.max(0, 0.42 - age * 0.22);
    for (var i = 0; i < dust.N; i++) {
      var s = dust.seeds[i];
      var d = age * s.sp * s.rf;
      p.setXYZ(i,
        Math.cos(s.a) * d * 0.55,
        s.up * age * 0.55 - 0.18 * age * age + 0.12,
        Math.sin(s.a) * d * 0.45
      );
    }
    p.needsUpdate = true;
    dust.mat.size = 0.09 + age * 0.07;
  }

  function shakeAt(t) {
    var age = t - T.impact;
    if (age < 0 || age > 1.3) return { x: 0, y: 0 };
    var amp = 0.05 * Math.exp(-age * 4.6);
    return { x: Math.sin(age * 63) * amp, y: Math.cos(age * 49) * amp * 0.7 };
  }

  function seek(t) {
    if (!world.ready) return;
    t = Math.max(0, Math.min(T.end, t));

    var champT = Math.min(1, t / T.swing);
    var cz = lerp(CHAMP.z0, CHAMP.z1, easeOut(champT));
    place(figures.champion, CHAMP.x, cz, Math.PI);

    if (t < T.swing) {
      setAction(figures.champion, CLIP.walk, t * 0.95);
    } else if (t < T.swing + 1.05) {
      setAction(figures.champion, CLIP.attack, t - T.swing);
    } else {
      setAction(figures.champion, CLIP.idle, t - T.swing - 0.55);
    }

    var solT = Math.max(0, t - 0.2);
    var sz = lerp(SOLDIER.z0, SOLDIER.z1, easeOut(Math.min(1, solT / 3.2)));
    place(figures.soldier, SOLDIER.x, sz, Math.PI);
    if (t < 4.6) setAction(figures.soldier, CLIP.walk, t * 0.86);
    else setAction(figures.soldier, CLIP.idle, t - 4.6);

    var qz = QUR.z0;
    if (t > T.impact) qz = lerp(QUR.z0, QUR.z1, smooth(t, T.hit, T.hit + 0.6));
    place(figures.quraysh, QUR.x, qz, 0);
    if (t < T.hit) setAction(figures.quraysh, CLIP.idle, t);
    else if (t < T.hit + 0.60) setAction(figures.quraysh, CLIP.hit, t - T.hit);
    else setAction(figures.quraysh, CLIP.idle, t - T.hit - 0.60);

    if (world.horseMixer) world.horseMixer.setTime(t * 0.82);
    updateDust(t);

    var sh = shakeAt(t);
    if (t < T.cut) {
      var u = t / T.cut;
      camera.position.set(lerp(5.95, 5.45, u) + sh.x, 1.12 + u * 0.03 + sh.y, lerp(2.45, 2.00, u));
      camera.lookAt(-0.05, 0.98, 0.25);
    } else {
      var v = (t - T.cut) / (T.end - T.cut);
      camera.position.set(lerp(3.55, 3.15, v) + sh.x, 1.56 + v * 0.02 + sh.y, lerp(0.52, 0.22, v));
      camera.lookAt(-0.10, 1.18, -0.42);
    }
    camera.fov = t < T.cut ? 34 : 34;
    camera.updateProjectionMatrix();
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
  }

  /* -------------------------------------------------------------- playback */
  var wallClock = new V.Clock(false);
  var playing = !CAP;
  var tNow = parseFloat(qs.get('t') || '0');

  function loop() {
    requestAnimationFrame(loop);
    if (!world.ready) return;
    if (playing) {
      tNow += wallClock.getDelta();
      if (tNow > T.end) tNow = 0;
      seek(tNow);
    }
  }

  /* ------------------------------------------------------------------- api */
  var HERO = window.HERO = {
    _figs: figures,
    _T: T,
    seek: function (t) { tNow = t; seek(t); return true; },
    play: function () { playing = true; wallClock.start(); },
    pause: function () { playing = false; },
    ready: function () { return world.ready; },
    duration: function () { return T.end; },
    state: function () {
      var o = {};
      ['champion', 'soldier', 'quraysh'].forEach(function (k) {
        var f = figures[k]; if (!f) return;
        var cur = f.current ? f.current + ' @' + (f.actions[f.current] ? f.actions[f.current].time.toFixed(2) : '?') : null;
        var w = f.weapon ? f.weapon.getWorldPosition(new V.Vector3()).toArray().map(function (n2) { return +n2.toFixed(2); }) : null;
        o[k] = { act: cur, weapon: w };
      });
      o.t = tNow;
      return o;
    },
    info: function () {
      renderer.render(scene, camera);
      return { calls: renderer.info.render.calls, tris: renderer.info.render.triangles, programs: renderer.info.programs ? renderer.info.programs.length : 0 };
    },
    measure: function () {
      var out = {};
      ['champion', 'soldier', 'quraysh'].forEach(function (k) {
        var f = figures[k]; if (!f) return;
        var b = new V.Box3().setFromObject(f.root);
        out[k] = { h: +(b.max.y - b.min.y).toFixed(3), minY: +b.min.y.toFixed(3) };
      });
      return out;
    }
  };

  addEventListener('resize', function () {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  dust = dustBurst(impactPoint);
  HERO.seek = HERO.seek;
  seek(tNow);
  loop();
})();