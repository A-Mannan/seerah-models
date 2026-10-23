/* Badr · the battle in 3D — a figureless, graded reconstruction.
   Vocabulary: ground, valley, wells, basin, the ʻarish, banner-bands (no human figures).
   The engine replays the day in seven phases; page boot drives the clock from main.js. */
(function () {
  'use strict';

  var canvas = document.getElementById('gl');
  var labelBox = document.getElementById('labels');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var easeIO = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var clamp01 = function (t) { return Math.max(0, Math.min(1, t)); };

  function fail() {
    var d = document.createElement('div');
    d.className = 'gl-fail';
    d.textContent = 'The 3D battle needs WebGL. The graded ledger in data/badr.json carries every fact; nothing is hidden behind the model.';
    var old = document.querySelector('.gl-fail'); if (old) old.remove();
    document.body.appendChild(d);
  }
  if (!window.THREE || !canvas) { fail(); return; }

  var MOBILE = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 700;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !MOBILE });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x232936, 1);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x8a7355, 130, 460);

  var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 900);

  /* ------------------------------ night sky: gradient dome, moon, stars */
  var skyGeo = new THREE.SphereGeometry(620, 32, 20);
  var skyPos = skyGeo.attributes.position;
  var skyCols = new Float32Array(skyPos.count * 3);
  var zen = new THREE.Color(0x24304a), hor = new THREE.Color(0x9a7850), skyTmp = new THREE.Color();
  for (var si = 0; si < skyPos.count; si++) {
    var yy = Math.max(0, Math.min(1, skyPos.getY(si) / 620));
    skyTmp.copy(hor).lerp(zen, Math.pow(yy, 0.55));
    skyCols[si * 3] = skyTmp.r; skyCols[si * 3 + 1] = skyTmp.g; skyCols[si * 3 + 2] = skyTmp.b;
  }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(skyCols, 3));
  var skyDome = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
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
  var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xdfe4ee, size: 2.0, sizeAttenuation: false, transparent: true, opacity: 0.22, fog: false }));
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
  var moonGlow = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), softDisc('rgba(226,232,244,0.25)', 'rgba(160,176,200,0.08)', 0xcfd8e6));
  moonGlow.position.set(-160, 62, -240); moonGlow.lookAt(0, 0, 0);
  scene.add(moonGlow);
  var moonDisk = new THREE.Mesh(new THREE.CircleGeometry(5.4, 26), new THREE.MeshBasicMaterial({ color: 0xe9edf5, transparent: true, opacity: 0.3, fog: false }));
  moonDisk.position.set(-160, 62, -240);
  moonDisk.lookAt(0, 0, 0);
  scene.add(moonDisk);

  /* ------------------------------ light */
  var hemi = new THREE.HemisphereLight(0x8fa0b8, 0x3a2f22, 0.44);
  scene.add(hemi);

  /* low eastern sun: the ranks formed at dawn and the fighting was by day */
  var moonLight = new THREE.DirectionalLight(0xffc27d, 0.9);
  moonLight.position.set(64, 34, -46);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
  moonLight.shadow.camera.left = -72;
  moonLight.shadow.camera.right = 72;
  moonLight.shadow.camera.top = 72;
  moonLight.shadow.camera.bottom = -72;
  moonLight.shadow.camera.near = 5;
  moonLight.shadow.camera.far = 240;
  moonLight.shadow.bias = -0.0006;
  scene.add(moonLight);
  scene.add(moonLight.target);

  var fill = new THREE.DirectionalLight(0x7d8ea8, 0.2);
  fill.position.set(-40, 30, 40);
  scene.add(fill);
  var rim = new THREE.DirectionalLight(0xffd9b0, 0.3); /* dawn rim on the ivory standards */
  rim.position.set(10, 14, 60);
  scene.add(rim);

  var brassLight = new THREE.PointLight(0xffb54d, 0.5, 14, 2);
  brassLight.position.set(-17.5, 2.6, 12.5); /* the lamp at the ʻarish */
  scene.add(brassLight);
  var wellLight = new THREE.PointLight(0xffb54d, 0.3, 11, 2);
  wellLight.position.set(-5.8, 1.8, 2.6);
  scene.add(wellLight);

  /* ------------------------------ terrain */
  var T = 420, SEG = 160;
  var groundGeo = new THREE.PlaneGeometry(T, T, SEG, SEG);
  groundGeo.rotateX(-Math.PI / 2);
  var pos = groundGeo.attributes.position;
  var colors = new Float32Array(pos.count * 3);
  var cSand = new THREE.Color(0xd3bf9b);
  var cValley = new THREE.Color(0xb3a284);
  var cDune = new THREE.Color(0xe0cda8);
  var tmp = new THREE.Color();
  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i), z = pos.getZ(i);
    var az = Math.abs(z), ax = Math.abs(x);
    var flat = Math.max(0, 1 - Math.max(0, az - 22) / 12) * Math.max(0, 1 - Math.max(0, ax - 40) / 16);
    var crest = Math.pow(Math.abs(Math.sin(z * 0.075 + Math.sin(x * 0.035) * 0.9 + 0.4)), 2.2);
    var rise = Math.min(1, Math.max(0, (az - 22) / 34) + Math.max(0, (ax - 40) / 40));
    var dune = crest * (2.2 + rise * 5.5) * rise;
    var ripple = Math.sin(x * 1.45 + Math.sin(z * 0.5) * 1.7) * 0.07 * flat;
    var h = dune + ripple - flat * 0.2;
    pos.setY(i, h);
    tmp.copy(cSand);
    if (flat > 0.4) tmp.lerp(cValley, 0.3 * flat);
    if (dune > 0.8) tmp.lerp(cDune, Math.min(0.5, dune / 8));
    tmp.multiplyScalar(0.94 + crest * 0.08);
    if (Math.sin(x * 0.09 + z * 0.045) > 0.7) tmp.multiplyScalar(0.975);
    tmp.offsetHSL(0, 0, (Math.random() - 0.5) * 0.008);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();
  function sandTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 1024;
    var g = c.getContext('2d');
    g.fillStyle = '#eee6d4'; g.fillRect(0, 0, 1024, 1024);
    var img = g.getImageData(0, 0, 1024, 1024), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var n = (Math.random() - 0.5) * 22;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
    g.globalAlpha = 0.07;
    for (var k = 0; k < 160; k++) {
      g.strokeStyle = k % 2 ? '#fff8e8' : '#6b5f4a';
      g.lineWidth = 1 + Math.random() * 2.4;
      g.beginPath();
      var yy = Math.random() * 1024;
      g.moveTo(0, yy);
      for (var x = 0; x <= 1024; x += 32) {
        g.lineTo(x, yy + Math.sin(x * 0.018 + k) * 7 + Math.sin(x * 0.004 + k * 2.3) * 18);
      }
      g.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(26, 26);
    return tex;
  }
  var sandTex = sandTexture();
  sandTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  /* under-floor lid: a huge disc below the sand so nothing shows beneath the terrain */
  var lid = new THREE.Mesh(new THREE.CircleGeometry(600, 48), new THREE.MeshBasicMaterial({ color: 0x2a251d }));
  lid.rotation.x = -Math.PI / 2;
  lid.position.y = -6.5;
  scene.add(lid);
  var ground = new THREE.Mesh(groundGeo, new THREE.MeshPhongMaterial({ vertexColors: true, map: sandTex, bumpMap: sandTex, bumpScale: 0.12, shininess: 0 }));
  ground.receiveShadow = true;
  scene.add(ground);

  /* distant ridges: the valley closes against the horizon */
  [[-96, -122, 62, 9], [86, -138, 56, 11], [148, -58, 42, 7], [-150, -40, 46, 8], [-240, -180, 90, 16], [210, -200, 84, 18]].forEach(function (r) {
    var ridgeM = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), new THREE.MeshLambertMaterial({ color: 0xb0a184 }));
    ridgeM.scale.set(r[2], r[3], r[2] * 0.55);
    ridgeM.position.set(r[0], -1.5, r[1]);
    scene.add(ridgeM);
  });

  /* pebbles scattered across the plain */
  var pebbles = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0x968b76 }), 260);
  var pd = new THREE.Object3D();
  for (var pi = 0; pi < 260; pi++) {
    var px = -34 + Math.random() * 68;
    var pz = -26 + Math.random() * 56;
    var ps = 0.05 + Math.random() * 0.12;
    pd.position.set(px, ps * 0.4, pz);
    pd.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    pd.scale.set(ps, ps * 0.6, ps);
    pd.updateMatrix();
    pebbles.setMatrixAt(pi, pd.matrix);
  }
  pebbles.castShadow = true; pebbles.receiveShadow = true;
  scene.add(pebbles);

  /* ------------------------------ landmarks */
  var stoneM = new THREE.MeshLambertMaterial({ color: 0x8d8371 });
  var stoneDark = new THREE.MeshLambertMaterial({ color: 0x6b6354 });
  var waterM = new THREE.MeshLambertMaterial({ color: 0x2f3a3d });
  var woodM = new THREE.MeshLambertMaterial({ color: 0x5c4f3a });

  function wellAt(wx, wz, big) {
    var g = new THREE.Group();
    var R = big ? 1.12 : 0.94;
    var n = big ? 16 : 12;
    for (var k = 0; k < n; k++) {
      var a = (k / n) * Math.PI * 2;
      var st = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.26, 0.3), k % 2 ? stoneM : stoneDark);
      st.position.set(Math.cos(a) * R, 0.13, Math.sin(a) * R);
      st.rotation.y = -a;
      st.castShadow = true; st.receiveShadow = true;
      g.add(st);
      var st2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.26), k % 2 ? stoneDark : stoneM);
      st2.position.set(Math.cos(a + 0.13) * (R - 0.04), 0.35, Math.sin(a + 0.13) * (R - 0.04));
      st2.rotation.y = -a;
      st2.castShadow = true;
      g.add(st2);
    }
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.24, R - 0.28, 0.48, 16, 1, true),
      new THREE.MeshLambertMaterial({ color: 0x453c2e, side: THREE.DoubleSide }));
    shaft.position.y = 0.24; g.add(shaft);
    var water = new THREE.Mesh(new THREE.CircleGeometry(R - 0.3, 16), new THREE.MeshLambertMaterial({ color: 0x1c2427 }));
    water.rotation.x = -Math.PI / 2; water.position.y = 0.07; g.add(water);
    if (big) {
      var post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.9, 6), woodM);
      post1.position.set(-R, 0.95, 0); post1.castShadow = true; g.add(post1);
      var post2 = post1.clone(); post2.position.x = R; g.add(post2);
      var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, R * 2 + 0.2, 6), woodM);
      bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.86, 0); bar.castShadow = true; g.add(bar);
      var rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.85, 4), new THREE.MeshLambertMaterial({ color: 0x8a7a5a }));
      rope.position.set(0, 1.36, 0); g.add(rope);
      var bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.2, 8), woodM);
      bucket.position.set(0, 0.9, 0); g.add(bucket);
    }
    g.position.set(wx, 0, wz); scene.add(g); return g;
  }
  [[-9.8, 2.2], [-6.8, 3.4], [-4.2, 2.0]].forEach(function (w, wi) { wellAt(w[0], w[1], wi === 0); });
  var basin = new THREE.Group();
  var basinBed = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), waterM);
  basinBed.rotation.x = -Math.PI / 2; basinBed.position.y = 0.1; basin.add(basinBed);
  for (var bs = 0; bs < 14; bs++) {
    var ba = (bs / 14) * Math.PI * 2;
    var bst = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.26), bs % 2 ? stoneM : stoneDark);
    bst.position.set(Math.cos(ba) * 1.62, 0.11, Math.sin(ba) * 1.62);
    bst.rotation.y = -ba;
    bst.castShadow = true; bst.receiveShadow = true;
    basin.add(bst);
  }
  basin.position.set(-6.6, 0.02, 0.4);
  scene.add(basin);
  var trough = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.34, 0.52), stoneM);
  trough.position.set(-4.3, 0.17, 1.0);
  trough.castShadow = true; trough.receiveShadow = true;
  scene.add(trough);

  var arish = new THREE.Group();
  var aPosts = [[-1.7, -1.3], [1.7, -1.3], [-1.7, 1.3], [1.7, 1.3]];
  aPosts.forEach(function (p) {
    var post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.35, 6), woodM);
    post.position.set(p[0], 1.17, p[1]);
    post.castShadow = true;
    arish.add(post);
  });
  for (var sl = 0; sl < 7; sl++) {
    var slat = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.06, 0.44), new THREE.MeshLambertMaterial({ color: 0x776a4e }));
    slat.position.set(0, 2.42, -1.35 + sl * 0.45);
    slat.rotation.x = 0.06;
    slat.castShadow = true;
    arish.add(slat);
  }
  var ridge = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 0.16), woodM);
  ridge.position.set(0, 2.56, 0); ridge.castShadow = true; arish.add(ridge);
  var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffc766, emissive: 0xffa93c, emissiveIntensity: 0.9 }));
  lamp.position.set(0.5, 2.0, 1.15);
  arish.add(lamp);
  arish.position.set(-17.5, 0, 12.5);
  scene.add(arish);

  var dune = new THREE.Mesh(new THREE.SphereGeometry(30, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhongMaterial({ color: 0xdccaa6, map: sandTex, bumpMap: sandTex, bumpScale: 0.1, shininess: 0 }));
  dune.scale.set(1.5, 0.3, 1);
  dune.position.set(58, -0.4, -54);
  dune.receiveShadow = true;
  scene.add(dune);
  var well24 = wellAt(36, 8, true);

  /* framing dunes at the near corners: the field sits inside the valley */
  [[-28, 36, 16, 2.4, 10], [28, 34, 18, 2.2, 11]].forEach(function (d) {
    var fd = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 12), new THREE.MeshPhongMaterial({ color: 0xd6c4a2, map: sandTex, bumpMap: sandTex, bumpScale: 0.1, shininess: 0 }));
    fd.scale.set(d[2], d[3], d[4]);
    fd.position.set(d[0], -0.6, d[1]);
    fd.receiveShadow = true;
    scene.add(fd);
  });

  /* ------------------------------ set dressing: rocks, scrub, palms */
  var rockM = new THREE.MeshPhongMaterial({ color: 0x968c78, flatShading: true, shininess: 0 });
  [[-26, 6, 1.3], [-23, -9, 0.8], [18, 9, 1.1], [24, 2.6, 0.7], [-16, -22, 1.4], [10, -19, 0.9], [33, -14, 1.6], [-34, 16, 1.8], [40, 12, 1.2], [6, 26, 0.9], [-9, 30, 1.1], [30, -30, 2.2], [-13, 23, 1.5], [12, 24, 1.3], [-19, 26, 1.7]].forEach(function (r, ri) {
    var rock = new THREE.Mesh(new THREE.IcosahedronGeometry(r[2], 0), rockM);
    rock.position.set(r[0], r[2] * 0.32, r[1]);
    rock.rotation.set(ri * 0.7, ri * 1.3, ri * 0.4);
    rock.scale.y = 0.62;
    rock.castShadow = true; rock.receiveShadow = true;
    scene.add(rock);
  });
  var scrubM = new THREE.MeshLambertMaterial({ color: 0x6f6547 });
  function scrub(x, z, sc) {
    for (var k = 0; k < 5; k++) {
      var b = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.5, 4), scrubM);
      var a = (k / 5) * Math.PI * 2;
      b.position.set(x + Math.cos(a) * 0.12, 0.24, z + Math.sin(a) * 0.12);
      b.rotation.set(Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35);
      b.scale.setScalar(sc);
      scene.add(b);
    }
  }
  [[-11, 8.4], [-2.5, 9.2], [7, 7.6], [14, 5], [-15, 3.4], [3, 21], [-8, 25], [12, 24], [-20, -6], [8, -9], [21, -12], [-4, -25], [16, -27], [36, -8]].forEach(function (s) { scrub(s[0], s[1], 0.8 + Math.random() * 0.7); });
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
    function frond(a, len, lift, droop, mat, simple) {
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
        if (!simple) {
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
    g.position.set(x, 0, z);
    scene.add(g);
  }
  palm(-16.4, 14.6, 3.6, 0.8); palm(-19.2, 10.8, 3.0, 0.5); palm(-14.6, 9.2, 2.6, 0.9);
  palm(26.8, -6.8, 3.2, 0.6); palm(23.4, -3.4, 2.7, 0.7);
  /* the grove at the wells */
  palm(-12.8, 5.6, 3.3, 0.7, true); palm(-2.2, 5.2, 2.9, 0.5, true); palm(-15.2, 8.2, 2.4, 0.9, true);

  /* reeds at the basin edge */
  for (var rd = 0; rd < 26; rd++) {
    var ra = (rd / 26) * Math.PI * 2 + 0.2;
    var rr = 2.0 + Math.random() * 0.5;
    var reed = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.5 + Math.random() * 0.5, 4), new THREE.MeshLambertMaterial({ color: 0x6f7a4a }));
    reed.position.set(-6.6 + Math.cos(ra) * rr, 0.3, 0.4 + Math.sin(ra) * rr);
    reed.rotation.z = (Math.random() - 0.5) * 0.3;
    scene.add(reed);
  }

  /* camps on the banks (BADR-018: both armies camped on their bank through the rain-night) */
  function tent(x, z, dark) {
    var t = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.5, 4), new THREE.MeshLambertMaterial({ color: dark ? 0x4b4437 : 0xc4b99f }));
    t.position.set(x, 0.75, z);
    t.rotation.y = Math.PI / 4;
    t.castShadow = true; t.receiveShadow = true;
    scene.add(t);
    var flap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.05), new THREE.MeshLambertMaterial({ color: dark ? 0x2e2a22 : 0x6f6450 }));
    flap.position.set(x, 0.45, z + 1.05);
    flap.rotation.x = 0.1;
    scene.add(flap);
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.95, 5), woodM);
    pole.position.set(x, 0.98, z);
    pole.castShadow = true;
    scene.add(pole);
    var ropeMat = new THREE.LineBasicMaterial({ color: 0x8a7a5a, transparent: true, opacity: 0.8 });
    [[1.35, 1.1], [-1.35, 1.1], [0, -1.5]].forEach(function (d) {
      var geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 1.68, z),
        new THREE.Vector3(x + d[0], 0.02, z + d[1])
      ]);
      scene.add(new THREE.Line(geo, ropeMat));
    });
  }
  [-22, -18].forEach(function (x) { tent(x, 18.5, false); });
  [18, 22].forEach(function (x) { tent(x, 18.5, false); });
  /* Quraysh: ten tents in the front row and five behind, scaled to the army */
  [-23, -18, -13, -8, -3, 2, 7, 12, 17, 22].forEach(function (x) { tent(x, -26.5, true); });
  [-19, -9, 1, 11, 21].forEach(function (x) { tent(x, -31.6, true); });

  /* camp clutter: sacks, jars, stacked spears and a fire ring */
  var sackM = new THREE.MeshLambertMaterial({ color: 0x9a8462 });
  var sackM2 = new THREE.MeshLambertMaterial({ color: 0x7d6a4e });
  var jarM = new THREE.MeshLambertMaterial({ color: 0x8a7a5a });
  var spearM = new THREE.MeshLambertMaterial({ color: 0x6b5f4a });
  function campClutter(x, z) {
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
    scene.add(g);
  }
  campClutter(-19, 17.2); campClutter(20.6, 17.4);
  campClutter(-21.5, -25.2); campClutter(-6.5, -25.4); campClutter(9.5, -25.2); campClutter(21.5, -25.5);
  campClutter(-14.5, -31.2); campClutter(4.5, -31.4);

  /* campfire smoke */
  var SMOKE = [];
  var smokeDot = softDot();
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
    var mat = new THREE.PointsMaterial({ color: 0xcbbca6, size: 0.8, map: smokeDot, transparent: true, opacity: 0.13, depthWrite: false });
    var pts = new THREE.Points(geo, mat);
    scene.add(pts);
    SMOKE.push({ pts: pts, x: x, z: z });
  }
  smoke(-19, 16.6); smoke(20.6, 16.8); smoke(-11.5, -24.6); smoke(6.5, -25.0);

  /* cavalry and camels — representative animals, no riders, no figures.
     Two horses with the Muslims (BADR-011); Quraysh had 100 horsemen (BADR-004). */
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
  }
  horse(-15.8, 12.4, 0.5, false); horse(15.8, 14.2, -0.4, false);
  [[-24, -18, 0.3], [-20, -21, 0.5], [24, -18, -0.3], [20, -21, -0.5], [-27, -13, 0.4], [27, -13, -0.4]].forEach(function (h) {
    horse(h[0], h[1], h[2], true);
  });

  function camel(x, z, ry) {
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
    scene.add(g);
  }
  camel(-6.5, 26.5, 0.4); camel(-1, 27.5, -0.2); camel(4.5, 26.8, 0.2); camel(9, 28.4, -0.5);
  /* the Quraysh baggage train behind their camp */
  camel(-12, -35.5, 0.5); camel(-6, -36.5, -0.3); camel(1, -35.8, 0.2); camel(8, -36.6, -0.4); camel(14, -35.6, 0.3);

  /* arrows: shaft, iron head, three fletchings */
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

  /* arrows spent into the sand after the volleys */
  var stuckArrows = new THREE.Group();
  for (var sa = 0; sa < 30; sa++) {
    var arw = makeArrow();
    arw.position.set(-11 + Math.random() * 21, 0.28, -2.5 + Math.random() * 7);
    arw.rotation.x = 1.1 + Math.random() * 0.5;
    arw.rotation.z = (Math.random() - 0.5) * 0.8;
    stuckArrows.add(arw);
  }
  stuckArrows.visible = false;
  scene.add(stuckArrows);

  /* (the rain of the night before is recorded in the ledger, BADR-018, but not rendered) */

  /* ------------------------------ armies: standards, not plates.
     A band is a stand of spears and one banner; a champion carries a taller standard.
     No human figure is ever drawn. */
  var WAVERS = [];
  var poleM = new THREE.MeshLambertMaterial({ color: 0x6b5f4a });
  var poleQ = new THREE.MeshLambertMaterial({ color: 0x2c271f });
  var ironM = new THREE.MeshLambertMaterial({ color: 0x9a9382 });
  var ironQ = new THREE.MeshLambertMaterial({ color: 0x565043 });
  var brassM = new THREE.MeshLambertMaterial({ color: 0xc39a33, emissive: 0x241804 });
  var clothM = new THREE.MeshLambertMaterial({ color: 0xf2ead8, side: THREE.DoubleSide, emissive: 0x3d3529 });
  var clothQ = new THREE.MeshLambertMaterial({ color: 0x342c22, side: THREE.DoubleSide, emissive: 0x0d0a07 });
  var shieldM = new THREE.MeshLambertMaterial({ color: 0xb5a583, side: THREE.DoubleSide });
  var shieldQ = new THREE.MeshLambertMaterial({ color: 0x4a4132, side: THREE.DoubleSide });

  function seedRand(seed) {
    var t = seed + 0x6D2B79F5;
    return function () {
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function banner(side, g, champion, rnd) {
    var ph = side ? poleQ : poleM;
    var iron = side ? ironQ : ironM;
    var clothMat = side ? clothQ : clothM;
    var poleH = champion ? 4.15 : 3.45;
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(champion ? 0.13 : 0.08, champion ? 0.18 : 0.11, poleH, 7), ph);
    pole.position.y = poleH / 2;
    g.add(pole);
    /* a brass shoe anchors the standard: at distance the cloth reads, the pole must too */
    var shoe = new THREE.Mesh(new THREE.CylinderGeometry(champion ? 0.18 : 0.12, champion ? 0.24 : 0.15, champion ? 0.18 : 0.1, 7), brassM);
    shoe.position.y = champion ? 0.09 : 0.05;
    g.add(shoe);
    /* finial */
    var fin = new THREE.Mesh(new THREE.SphereGeometry(champion ? 0.14 : 0.075, 8, 6), brassM);
    fin.position.y = poleH + 0.05;
    g.add(fin);
    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 6), brassM);
    tip.position.y = poleH + 0.2;
    g.add(tip);
    /* short crossbar with cloth loops; the cloth drapes from it */
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
      if (vy > 0) pa.setY(vi, vy - u * u * 0.1); /* the free edge sags */
    }
    geo.computeVertexNormals();
    var cloth = new THREE.Mesh(geo, clothMat);
    cloth.position.set(0.16 + cw / 2, poleH - 0.2 - chh / 2, 0);
    cloth.castShadow = true;
    cloth.receiveShadow = false; /* waving geometry collects dark artifacts */
    g.add(cloth);
    for (var lp = 0; lp < 3; lp++) {
      var loop = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.011, 5, 8), brassM);
      loop.position.set(0.3 + lp * (barLen - 0.2) / 2, poleH - 0.14, 0);
      g.add(loop);
    }
    /* brass tassels at the bar ends */
    [0.18, 0.18 + barLen].forEach(function (tx) {
      var tas = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.2, 5), brassM);
      tas.position.set(tx, poleH - 0.28, 0);
      tas.rotation.x = Math.PI;
      g.add(tas);
    });
    /* rosette on the pole: the standard's ornament */
    var rose = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 10), brassM);
    rose.rotation.x = Math.PI / 2;
    rose.position.set(0, poleH - 0.62, 0.06);
    g.add(rose);
    WAVERS.push({ mesh: cloth, base: geo.attributes.position.array.slice(0), w: cw, phase: rnd() * 6.28 });
    /* spear stand: grouped shafts, one banner-man's spear taller */
    var nSp = champion ? 3 : (side ? 7 : 3);
    for (var k = 0; k < nSp; k++) {
      var h = (champion ? 2.5 : 1.9) + rnd() * 0.4;
      var sp = new THREE.Mesh(new THREE.CylinderGeometry(champion ? 0.055 : 0.035, champion ? 0.075 : 0.045, h, 5), iron);
      var a = rnd() * Math.PI * 2, rr = 0.15 + rnd() * 0.5;
      sp.position.set(Math.cos(a) * rr, h / 2, Math.sin(a) * rr);
      sp.rotation.set((rnd() - 0.5) * 0.08, 0, (rnd() - 0.5) * 0.08);
      sp.castShadow = true;
      g.add(sp);
      /* iron tips: forged blades on every shaft */
      var tipH = 0.2;
      var tip = new THREE.Mesh(new THREE.BoxGeometry(champion ? 0.09 : 0.06, tipH, champion ? 0.03 : 0.022), iron);
      tip.position.set(sp.position.x, h + tipH / 2, sp.position.z);
      g.add(tip);
      var collar = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.05, 5), brassM);
      collar.position.set(sp.position.x, h - 0.03, sp.position.z);
      g.add(collar);
    }
    /* shields standing at the front, faces toward the enemy */
    var nSh = champion ? 1 : (side ? 2 : 1);
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
    if (side && !champion) {
      /* iron helms piled by the standards: the mailed men of Quraysh */
      for (var hl = 0; hl < 2; hl++) {
        var helm = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), ironM);
        helm.position.set(0.3 + hl * 0.3, 0.13, -0.5 - hl * 0.25);
        g.add(helm);
      }
    } else if (!side && !champion) {
      /* a helm rest by the standard: the believers' kit */
      var rest = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), ironM);
      rest.position.set(0.75, 0.14, -0.45);
      rest.rotation.y = 0.8;
      g.add(rest);
    }
    if (!side && !champion) {
      /* one water-skin: the light kit of the believers */
      var jar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.34, 8), new THREE.MeshLambertMaterial({ color: 0x8a7a5a }));
      jar.position.set(0.45, 0.17, 0.55);
      g.add(jar);
    }
    /* a sword planted at the standard: blade, crossguard, pommel */
    var blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, 0.012), new THREE.MeshLambertMaterial({ color: 0xc9c4b6 }));
    blade.position.set(0.95, 0.55, -0.35);
    blade.rotation.z = 0.04;
    g.add(blade);
    var guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.045), brassM);
    guard.position.set(0.95, 0.98, -0.35);
    g.add(guard);
    var pommel = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), brassM);
    pommel.position.set(0.95, 1.02, -0.35);
    g.add(pommel);
  }

  function band(side, x, z, label, entry) {
    var g = new THREE.Group();
    banner(side, g, false, seedRand(Math.round((x + 100) * 733 + (z + 100) * 191)));
    g.position.set(x, 0, z);
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(g);
    return { side: side, group: g, flag: g.children[4], phase: Math.random() * 6.28, home: [x, z], label: label || null, entry: entry || null, isChampion: false };
  }
  function champion(side, x, z, label, entry) {
    var g = new THREE.Group();
    banner(side, g, true, seedRand(Math.round((x + 200) * 311 + (z + 200) * 97)));
    g.position.set(x, 0, z);
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(g);
    return { side: side, group: g, flag: g.children[4], phase: Math.random() * 6.28, home: [x, z], label: label || null, entry: entry || null, isChampion: true };
  }

  /* Formation tables: x across the front, +z toward the Muslims.
     About 313 Muslims against about 1,000: a thin line against five deep ranks.
     Muslim lines hold a centre gap on the duel corridor; the standard-band sits mid-rear. */
  var m1 = [-7.2, -3.6, 3.6, 7.2];
  var m2 = [-9.4, -4.7, 4.7, 9.4];
  var q3 = [-22.6, -20, -17.4, -2.6, 0, 2.6, 17.4, 20, 22.6];
  var mBands = [], qBands = [];
  m1.forEach(function (x) { mBands.push(band(0, x, 13.5)); });
  m2.forEach(function (x) { mBands.push(band(0, x, 16.8)); });
  q3.forEach(function (x, qi) {
    var zBase = (qi >= 3 && qi <= 5) ? -13.2 : -15.4;
    for (var r = 0; r < 2; r++) qBands.push(band(1, x, zBase - r * 4.2));
  });
  var musab = mBands[1], jabal = qBands[10];
  musab.label = 'Musʻab’s white standard (RA)'; musab.entry = 'BADR-013'; musab.home = [-0.2, 18.2];
  musab.group.position.set(musab.home[0], 0, musab.home[1]);
  jabal.label = 'Abū Jahl’s standard'; jabal.entry = 'BADR-037';

  /* champions: Ḥamzah/ʻAlī/ʻUbaydah vs Shaybah/al-Walīd/ʻUtbah (Bukhari 3965 pairing; both versions on the card) */
  var chH, chA, chU, chS, chW, chB;
  chH = champion(0, -3.2, 11.5, 'Ḥamzah (RA)', 'BADR-028');
  chA = champion(0, 0, 11.2, 'ʻAlī (RA)', 'BADR-029'); chA.labelY = 4.9;
  chU = champion(0, 3.2, 11.5, 'ʻUbaydah (RA)', 'BADR-028');
  chS = champion(1, -5.5, -13.8, 'Shaybah', 'BADR-028');
  chW = champion(1, 0, -13.4, 'al-Walīd', 'BADR-029'); chW.labelY = 4.9;
  chB = champion(1, 5.5, -13.8, 'ʻUtbah', 'BADR-028');
  var champs = [chH, chA, chU, chS, chW, chB];

  /* Division standards: mark the three front-rank bands at the division centres with a brass
     pennant seated on the pole top, rather than adding duplicate banners beside them. */
  function markDivision(u) {
    var penn = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 4), brassM);
    penn.position.y = 3.86; /* base sits on the pole tip (3.65), no floating */
    u.group.add(penn);
    return u;
  }
  markDivision(qBands[4]);  /* left division, x -17.4 */
  markDivision(qBands[8]);  /* centre division, x 0 */
  markDivision(qBands[12]); /* right division, x +17.4 */

  /* unit plans: pose per phase {p, rot, tilt, fallAt?, hold?} */
  var PH = ['ground', 'duel', 'advance', 'clash', 'turn', 'rout', 'quiet'];
  function P(px, pz, o) { o = o || {}; return { x: px, z: pz, rot: o.rot || 0, tilt: o.tilt || 0, fallAt: o.fallAt, flee: o.flee || 0 }; }
  function initUnit(u) {
    var plan = [];
    plan[0] = P(u.home[0], u.home[1]);
    plan[1] = P(u.home[0], u.home[1]);
    plan[6] = plan[5] = plan[4] = plan[3] = plan[2] = plan[1];
    u.plan = plan;
  }
  champs.forEach(initUnit);
  champs.forEach(function (u) { u._stag = 0.18; });
  mBands.concat(qBands).forEach(initUnit);

  /* champions walk to the middle ground; both trios meet on the same line, not in either camp */
  chH.plan[1] = P(-3.2, 2.2); chA.plan[1] = P(0, 1.6); chU.plan[1] = P(3.2, 2.2);
  chS.plan[1] = P(-3.2, 0.0, { fallAt: 0.74 }); chW.plan[1] = P(0, -0.4, { fallAt: 0.86 }); chB.plan[1] = P(3.2, 0.0, { fallAt: 0.93 });
  chU._wound = { i: 1, at: 0.9, tilt: 0.5 };
  /* ʻUbaydah walks off wounded; the three killed champions lie where they fell through every later phase */
  chU.plan[2] = P(0.4, 5.4, { tilt: 0.5 });
  chH.plan[2] = P(-1.2, 6.0); chA.plan[2] = P(0.8, 6.0);
  chS.plan[2] = P(-3.2, 0.0); chW.plan[2] = P(0, -0.4); chB.plan[2] = P(3.2, 0.0);
  chH.plan[6] = chH.plan[5] = chH.plan[4] = chH.plan[3] = chH.plan[2];
  chA.plan[6] = chA.plan[5] = chA.plan[4] = chA.plan[3] = chA.plan[2];
  chU.plan[6] = chU.plan[5] = chU.plan[4] = chU.plan[3] = chU.plan[2];
  chS.plan[6] = chS.plan[5] = chS.plan[4] = chS.plan[3] = chS.plan[2];
  chW.plan[6] = chW.plan[5] = chW.plan[4] = chW.plan[3] = chW.plan[2];
  chB.plan[6] = chB.plan[5] = chB.plan[4] = chB.plan[3] = chB.plan[2];

  /* Muslim bands: hold, then close around the wells, then hold through the quiet */
  mBands.forEach(function (u, idx) {
    var col = idx % 4, r = idx < 4 ? 0 : 1;
    var x = r ? m2[col] : m1[col];
    u.plan[2] = P(r ? x * 1.04 : x, r ? 9.2 : 6.8);
    u.plan[3] = P(x * 0.9, r ? 7.0 : 4.8);
    u.plan[4] = P(x * 0.88, r ? 6.8 : 4.6);
    u.plan[6] = u.plan[5] = u.plan[4];
    if (u === musab) { u.plan[2] = P(-0.2, 12.4); u.plan[3] = P(-0.2, 11.8); u.plan[4] = u.plan[5] = u.plan[6] = u.plan[3]; }
  });
  /* two Muslim bands fall in the mêlée — fourteen men died (BADR-047); the count lives on the phase card */
  mBands[4].plan[3].fallAt = 0.62;
  mBands[6].plan[5] = P(mBands[6].plan[4].x, mBands[6].plan[4].z, { fallAt: 0.34 });
  /* Quraysh: three ranks close to the wells.
     qBands is pushed two per x (front, back), so index maps column-major. */
  qBands.forEach(function (u, idx) {
    var col = Math.floor(idx / 2), row = idx % 2;
    var x = q3[col], z = (col >= 3 && col <= 5 ? -13.2 : -15.4) - row * 4.2;
    u.plan[2] = P(x, -4.5 - row * 2.4);
    u.plan[3] = P(x * 0.98, 1.2 - row * 2.2);
    u.plan[4] = P(x * 0.96, 1.0 - row * 2.2);
    /* the rout: the divisions break toward the far north-west, staggered */
    u.plan[5] = P(-40 - row * 3.0 - col * 1.2, -28 - row * 2.6 - col * 0.8);
    u.plan[6] = u.plan[5];
    u._stag = ((row * 3 + col) % 6) * 0.045;
  });
  /* Abū Jahl stays on the field: his banner falls here (BADR-037), it does not flee */
  jabal.plan[2] = P(-6.8, -3.2); jabal.plan[3] = P(-5.4, -1.4); jabal.plan[4] = P(-5.4, -1.4);
  jabal.plan[5] = P(-5.4, -1.4, { fallAt: 0.55 }); jabal.plan[6] = jabal.plan[5];

  /* ------------------------------ battlefield event markers.
     Named individuals are never figured: a standard or a spear marks the spot. */
  function eventStandard(x, z, side, tilt, fallen) {
    var g = new THREE.Group();
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 2.7, 6), woodM);
    pole.position.y = 1.35;
    g.add(pole);
    var cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.48),
      new THREE.MeshLambertMaterial({ color: side ? 0x2b2620 : 0xe8e2d2, side: THREE.DoubleSide }));
    cloth.position.set(0.38, 2.28, 0);
    g.add(cloth);
    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 4), brassM);
    tip.position.y = 2.78;
    g.add(tip);
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    if (fallen) { g.rotation.z = 1.25; g.position.set(x, 0.18, z); }
    else { g.rotation.z = tilt || 0; g.position.set(x, 0, z); }
    scene.add(g);
    return g;
  }
  /* Muʿādh (RA) loses an arm to Ikrimah's blow and fights on; Bilāl (RA) runs
     down ʻUmayyah ibn Khalaf. The props are standards/spears, never figures. */
  var muadhMark = eventStandard(-3.4, 2.4, 0, 0.16, false);
  var muawwidhMark = eventStandard(-1.2, 2.8, 0, 0.12, false);
  var ikrimahMark = eventStandard(3.4, -2.4, 1, 0, false);
  var bilalMark = eventStandard(8.5, 5.0, 0, 0, false);
  var umayyahMark = eventStandard(13.2, -5.8, 1, 0, true);
  var EVENT_MARKS = [
    { group: muadhMark, side: 0, label: 'Muʿādh (RA) & Muʿawwidh (RA)', k: 'muadhMuawwidh', labelY: 3.5, ph: [3, 4, 5] },
    { group: ikrimahMark, side: 1, label: 'Ikrimah ibn Abi Jahl', k: 'ikrimah', labelY: 3.3, ph: [3, 4, 5] },
    { group: bilalMark, side: 0, label: 'Bilāl (RA)', k: 'bilal', labelY: 3.5, ph: [4, 5] },
    { group: umayyahMark, side: 1, label: 'ʻUmayyah ibn Khalaf', k: 'umayyah', labelY: 2.2, ph: [4, 5] }
  ];
  /* Before the Hashimi champions, the first Ansari trio steps out: ʻAwf and
     Muʿawwidh (sons of al-Harith / Afraʾ) and ʿAbdullah ibn Rawahah (RA).
     Quraysh refuses them as not their equals; the trio withdraws. */
  var ansarA = eventStandard(-6.0, 10.5, 0, 0, false);
  var ansarB = eventStandard(-4.2, 10.5, 0, 0, false);
  var ansarC = eventStandard(-2.4, 10.5, 0, 0, false);
  var ANSAR_MARKS = [ansarA, ansarB, ansarC];
  /* these three standards move, so keep them out of the static merge */
  ANSAR_MARKS.forEach(function (g) { g.userData.dynamicRoot = true; });
  EVENT_MARKS.push({ group: ansarB, side: 0, label: 'the Anṣār trio (RA)', k: 'ansarTrio', labelY: 3.6, ph: [1], tRange: [0.02, 0.44], priority: 1 });

  /* ------------------------------ squads and platoons.
     A squad is eight men: each is a hooded body holding an upright spear,
     tip seated on the shaft. Front-rank men carry shields facing the enemy;
     every fourth man holds a sword at his side. Nothing floats. */
  var MASS = [];
  /* merge body, head, spear and tip into one instanced geometry: one matrix
     per man per frame instead of four — this is what makes mobile smooth */
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
  function buildMass(side, count, cols, dxS, dzS, z0, h) {
    var blocks = side ? qBands : mBands;
    var squadSize = 8;
    var squads = Math.ceil(count / squadSize);
    var bodyGeo = new THREE.CylinderGeometry(0.16, 0.2, 1.05, 6);
    var headGeo = new THREE.SphereGeometry(0.13, 8, 6);
    var shaftGeo = new THREE.CylinderGeometry(0.02, 0.028, h, 5);
    var tipGeo = new THREE.BoxGeometry(0.035, 0.2, 0.014);
    var manGeo = mergeParts([
      { geo: bodyGeo, p: [0, 0.53, 0], c: new THREE.Color(side ? 0x5f5544 : 0xcfc6b2) },
      { geo: headGeo, p: [0, 1.19, 0], c: new THREE.Color(side ? 0x463d32 : 0xbfb49d) },
      { geo: shaftGeo, p: [0.2, 0.95, 0.06], c: new THREE.Color(0x6b5c42) },
      { geo: tipGeo, p: [0.2, 0.95 + h / 2 + 0.1, 0.06], c: (side ? ironQ : ironM).color }
    ]);
    var men = new THREE.InstancedMesh(manGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), count);
    men.castShadow = true;
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
    var rims = new THREE.InstancedMesh(new THREE.TorusGeometry(0.345, 0.02, 5, 14), side ? ironQ : brassM, squads * shieldsPer);
    var swords = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, 0.72, 0.013), new THREE.MeshLambertMaterial({ color: 0xc9c4b6 }), squads);
    var guards = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.03, 0.05), side ? ironQ : brassM, squads);
    var helms = new THREE.InstancedMesh(new THREE.SphereGeometry(0.145, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), side ? ironQ : ironM, squads);
    shields.castShadow = true; swords.castShadow = true;
    var sq = [], recs = [], idx = 0;
    for (var s = 0; s < squads; s++) {
      var rk = Math.floor(s / cols), cl = s % cols;
      var hsh = Math.abs(Math.sin(s * 12.9898) * 43758.5453) % 1;
      var cx;
      if (side && cols === 21) {
        /* three divisions of seven files: 1,000 men read as one army */
        var seg = cl < 7 ? -1 : (cl < 14 ? 0 : 1);
        cx = seg * 18 + ((cl % 7) - 3) * 2.0 + (rk % 2 ? 1.0 : 0);
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
        recs.push({
          s: s,
          ox: (m % 4 - 1.5) * 0.42 + (Math.abs(Math.sin(idx * 7.31) * 9123) % 1 - 0.5) * 0.1,
          oz: (Math.floor(m / 4) - 0.5) * 0.5,
          hs: 0.94 + (Math.abs(Math.sin(idx * 3.7) * 917) % 1) * 0.12,
          ry: (Math.abs(Math.sin(idx * 1.7) * 537) % 1) * 0.3 - 0.15,
          tilt: (Math.abs(Math.sin(idx * 2.3) * 719) % 1 - 0.5) * 0.05
        });
      }
    }
    scene.add(men); scene.add(shields); scene.add(rims); scene.add(swords); scene.add(guards); scene.add(helms);
    MASS.push({ men: men, shields: shields, rims: rims, swords: swords, guards: guards, helms: helms, shieldsPer: shieldsPer, sq: sq, recs: recs, blocks: blocks, h: h, side: side });
  }
  buildMass(0, 313, 9, 2.2, 1.9, 12.2, 1.9);
  buildMass(1, 1000, 21, 2.0, 1.9, -14.2, 2.15);

  function updateMass() {
    var dm = new THREE.Object3D();
    for (var m = 0; m < MASS.length; m++) {
      var M = MASS[m];
      var anchors = [];
      for (var s = 0; s < M.sq.length; s++) {
        var S = M.sq[s], u = M.blocks[S.block];
        anchors.push([u.group.position.x + S.lx, u.group.position.z + S.lz]);
      }
      var helmN = 0;
      for (var i = 0; i < M.recs.length; i++) {
        var rec = M.recs[i], a = anchors[rec.s];
        var px = a[0] + rec.ox, pz = a[1] + rec.oz;
        /* the man: body, head, spear and tip are one baked geometry */
        dm.position.set(px, 0, pz);
        dm.rotation.set(0, rec.ry, 0);
        dm.scale.set(1, rec.hs, 1);
        dm.updateMatrix();
        M.men.setMatrixAt(i, dm.matrix);
      }
      var si = 0;
      for (var s2 = 0; s2 < M.sq.length; s2++) {
        var a2 = anchors[s2];
        var sqv = M.sq[s2], sv = 0.9 + sqv.hsh * 0.18;
        for (var k = 0; k < M.shieldsPer; k++) {
          var off = (k - (M.shieldsPer - 1) / 2) * 0.62;
          var face = M.side ? 0.58 : -0.58;
          dm.position.set(a2[0] + off, 0.62 * sv, a2[1] + face);
          dm.rotation.set(Math.PI / 2 - 0.08, 0.03, 0);
          if (M.side) dm.rotation.y = Math.PI;
          dm.scale.set(sv, 1, sv);
          dm.updateMatrix();
          M.shields.setMatrixAt(si, dm.matrix);
          dm.rotation.x = 0;
          dm.updateMatrix();
          M.rims.setMatrixAt(si, dm.matrix);
          si++;
        }
        /* the squad's helm-rack behind the shields */
        dm.position.set(a2[0] - (M.side ? 0.8 : -0.8), 0.14, a2[1] - (M.side ? 0.5 : -0.5));
        dm.rotation.set(0, 0.3 * sqv.hsh, 0);
        dm.scale.set(sv, 1, sv);
        dm.updateMatrix();
        M.helms.setMatrixAt(s2, dm.matrix);
        /* the sword held hilt-up at the front man's side */
        dm.position.set(a2[0] + 0.4, 0.72, a2[1] + (M.side ? -0.5 : 0.5));
        dm.rotation.set(0.03, 0.3, 0.04);
        dm.updateMatrix();
        M.swords.setMatrixAt(s2, dm.matrix);
        dm.position.y = 1.05;
        dm.updateMatrix();
        M.guards.setMatrixAt(s2, dm.matrix);
      }
      M.men.instanceMatrix.needsUpdate = true;
      M.shields.instanceMatrix.needsUpdate = true;
      M.rims.instanceMatrix.needsUpdate = true;
      M.swords.instanceMatrix.needsUpdate = true;
      M.guards.instanceMatrix.needsUpdate = true;
      M.helms.instanceMatrix.needsUpdate = true;
    }
  }
  updateMass();

  /* ------------------------------ labels */
  function mkLabel(txt, cls) {
    var d = document.createElement('span');
    d.className = 'hud-label' + (cls ? ' ' + cls : '');
    d.textContent = txt;
    labelBox.appendChild(d);
    return d;
  }
  var LAND = [
    { w: [20, 0.6, 17], t: 'al-ʻUdwat ad-Dunya · the near bank', e: 'BADR-019', k: 'near', cls: 'is-land-name is-far' },
    { w: [-24, 0.4, -32], t: 'al-Quswa · the far bank', e: 'BADR-019', k: 'far', cls: 'is-land-name is-far' },
    { w: [-6.9, 1.2, 1.2], t: 'wells of Badr', e: 'BADR-019', k: 'wells', cls: 'is-tap' },
    { w: [-17.5, 2.6, 13.1], t: 'the ʻarish · the Prophet’s station (PBUH)', e: 'BADR-020', k: 'arish', cls: 'is-tap' },
    { w: [36, 1.3, 8], t: 'al-Qalib · the well of the twenty-four', e: 'BADR-049', k: 'well24', cls: 'is-tap' },
    { w: [0, 8.4, 1], t: 'the angels · 8:9', e: 'BADR-031', k: 'angels', cls: 'is-land-name', ph: [3], tRange: [0.12, 0.9] }
  ];
  var LANDL = LAND.map(function (l) {
    var el = mkLabel(l.t, l.cls);
    return { el: el, v: new THREE.Vector3(l.w[0], l.w[1], l.w[2]), k: l.k, ph: l.ph, tRange: l.tRange };
  });
  var ULABS = [jabal].concat(champs, [musab], EVENT_MARKS).map(function (u) {
    var el = mkLabel(u.label, u.side ? '' : 'is-side');
    if (u === jabal) el.classList.add('is-q');
    return { el: el, u: u, k: u.k };
  });
  chH.k = 'hamzah'; chA.k = 'ali'; chU.k = 'ubaydah';
  chS.k = 'shaybah'; chW.k = 'walid'; chB.k = 'utbah';
  musab.k = 'musab'; jabal.k = 'command'; jabal.labelAlways = true; jabal.priority = 2;

  var LABELS = {
    en: {
      hamzah: 'Ḥamzah (RA)', ali: 'ʻAlī (RA)', ubaydah: 'ʻUbaydah (RA)',
      shaybah: 'Shaybah', walid: 'al-Walīd', utbah: 'ʻUtbah',
      musab: 'Musʻab’s white standard (RA)', command: 'Abū Jahl’s standard',
      near: 'al-ʻUdwat ad-Dunya · the near bank', far: 'al-Quswa · the far bank',
      basin: 'the basin', wells: 'wells of Badr', arish: 'the ʻarish · the Prophet’s station (PBUH)',
      well24: 'al-Qalib · the well of the twenty-four', katheeb: 'Katheeb al-Hannan (a modern name)',
      muadhMuawwidh: 'Muʿādh (RA) & Muʿawwidh (RA)', ikrimah: 'Ikrimah ibn Abi Jahl',
      bilal: 'Bilāl (RA)', umayyah: 'ʻUmayyah ibn Khalaf', ansarTrio: 'the Anṣār trio (RA)', angels: 'the angels · 8:9'
    },
    ur: {
      hamzah: 'حمزہ رضی اللہ عنہ', ali: 'علی رضی اللہ عنہ', ubaydah: 'عبیدہ رضی اللہ عنہ',
      shaybah: 'شیبہ', walid: 'ولید', utbah: 'عتبہ',
      musab: 'مصعب کا سفید پرچم رضی اللہ عنہ', command: 'ابو جہل کا پرچم',
      near: 'العدوۃ الدنیا · قریب کا کنارہ', far: 'القصوی · دور کا کنارہ',
      basin: 'حوض', wells: 'بدر کے کنویں', arish: 'عرش · مقامِ نبوی ﷺ',
      well24: 'القليب · چوبیس کا کنواں', katheeb: 'کتیبة الحنان (جدید نام)',
      muadhMuawwidh: 'معاذ و معوذ رضی اللہ عنہما', ikrimah: 'عکرمہ بن ابی جہل',
      bilal: 'بلال رضی اللہ عنہ', umayyah: 'امیہ بن خلف', ansarTrio: 'تین انصاری (رضی اللہ عنہم)', angels: 'فرشتے · ۸:۹'
    }
  };
  function setLang(lang) {
    var d = LABELS[lang] || LABELS.en;
    LANDL.forEach(function (it) { it.el.textContent = d[it.k] || it.el.textContent; });
    ULABS.forEach(function (it) { it.el.textContent = d[it.u.k] || it.el.textContent; });
  }
  var placedRects = [];

  /* ------------------------------ particles: arrows + the sand */
  var arrowGeo = null;
  var arrows = [];
  for (var ai = 0; ai < 40; ai++) {
    var am = makeArrow();
    am.visible = false; scene.add(am);
    arrows.push({ m: am, live: false, t: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), dir: new THREE.Vector3() });
  }

  /* ------------------------------ static merge.
     The palms alone were ~200 meshes each and the camp ~1,700 draw calls. Merge every
     rigid mesh into a handful of vertex-coloured batches; keep only what animates
     (banner cloth, palm crowns, arrows, the men) separate. */
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
  function mergeStaticScene() {
    scene.updateMatrixWorld(true);
    /* banner cloth is vertex-animated */
    WAVERS.forEach(function (w) { w.mesh.userData.keep = true; });
    /* arrows fly as groups: bake each one to a single mesh */
    arrows.forEach(function (a) {
      a.m.updateMatrixWorld(true);
      mergeMeshList(collectMergeable(a.m), a.m, true);
      a.m.userData.keep = true;
    });
    stuckArrows.updateMatrixWorld(true);
    mergeMeshList(collectMergeable(stuckArrows), stuckArrows, true);
    stuckArrows.userData.keep = true;
    /* banners ride on moving unit blocks: merge each block's rigid parts locally */
    champs.concat(mBands, qBands).forEach(function (b) {
      var bg = b.group || b;
      bg.updateMatrixWorld(true);
      mergeMeshList(collectMergeable(bg), bg, true);
      bg.userData.dynamicRoot = true;
    });
    /* palm crowns sway: merge each crown locally, leave its trunk to the world batch */
    PALMS.forEach(function (p) {
      p.crown.updateMatrixWorld(true);
      mergeMeshList(collectMergeable(p.crown), p.crown, true);
      p.crown.userData.keep = true;
    });
    /* everything else rigid, in world space */
    var statics = [];
    scene.traverse(function (o) {
      if (!o.isMesh || o.isInstancedMesh) return;
      var p = o;
      while (p) { if (p.userData && (p.userData.keep || p.userData.dynamicRoot)) return; p = p.parent; }
      if (isMergeable(o)) statics.push(o);
    });
    mergeMeshList(statics, scene, false);
  }
  mergeStaticScene();
  var DN = MOBILE ? 700 : 1400;
  var dustGeo = new THREE.BufferGeometry();
  var dustP = new Float32Array(DN * 3), dustS = new Float32Array(DN), dustB = new Float32Array(DN * 3);
  for (var di = 0; di < DN; di++) { dustS[di] = Math.random(); resetDust(di); }
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
  function resetDust(i) {
    dustP[i * 3] = -24 + Math.random() * 48;
    dustP[i * 3 + 1] = 0.15 + Math.random() * 2.6;
    dustP[i * 3 + 2] = -12 + Math.random() * 16;
    dustB[i * 3] = dustP[i * 3];
    dustB[i * 3 + 1] = dustP[i * 3 + 1];
    dustB[i * 3 + 2] = dustP[i * 3 + 2];
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustP, 3));
  var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xd0bd99, size: 3.2, map: softDot(), transparent: true, opacity: 0, depthWrite: false }));
  scene.add(dust);

  /* the angels' help: a gold shimmer, never a figure (Qur'an 8:9; BADR-031/032) */
  var AN = MOBILE ? 80 : 150;
  var angelGeo = new THREE.BufferGeometry();
  var angelP = new Float32Array(AN * 3), angelS = new Float32Array(AN);
  for (var ag = 0; ag < AN; ag++) {
    angelP[ag * 3] = -12 + Math.random() * 24;
    angelP[ag * 3 + 1] = 1.6 + Math.random() * 7.2;
    angelP[ag * 3 + 2] = -5 + Math.random() * 12;
    angelS[ag] = Math.random();
  }
  angelGeo.setAttribute('position', new THREE.BufferAttribute(angelP, 3));
  var angels = new THREE.Points(angelGeo, new THREE.PointsMaterial({
    color: 0xffe2a8, size: 2.6, map: softDot(), transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending
  }));
  scene.add(angels);

  /* slow motes in the air: the field breathes */
  var MOTES = 160;
  var moteGeo = new THREE.BufferGeometry();
  var moteP = new Float32Array(MOTES * 3);
  for (var mi = 0; mi < MOTES; mi++) {
    moteP[mi * 3] = -40 + Math.random() * 80;
    moteP[mi * 3 + 1] = 0.4 + Math.random() * 5;
    moteP[mi * 3 + 2] = -30 + Math.random() * 60;
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(moteP, 3));
  var motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: 0xe3d3b4, size: 0.09, transparent: true, opacity: 0.35, depthWrite: false }));
  scene.add(motes);

  /* ------------------------------ phases + clock */
  var PHASES = [
    { id: 'ground',  name: 'the ground',   dur: 6 },
    { id: 'duel',    name: '3 v 3',        dur: 16 },
    { id: 'advance', name: 'the advance',  dur: 12 },
    { id: 'clash',   name: 'the wells',    dur: 12 },
    { id: 'turn',    name: 'the sand',     dur: 8 },
    { id: 'rout',    name: 'the rout',     dur: 12 },
    { id: 'quiet',   name: 'the reckoning', dur: 10 }
  ];
  var TOTAL = 0; PHASES.forEach(function (p) { TOTAL += p.dur; });
  var CAMS = {
    ground:  { a: { p: [0, 30, 44], l: [0, 1.4, 0] },  b: { p: [4, 27, 40], l: [0, 1.4, -1] } },
    duel:    { a: { p: [15, 6, 10], l: [0, 1.2, 1.6] }, b: { p: [9, 3.4, 4.5], l: [0, 1.3, 1.2] } },
    advance: { a: { p: [34, 20, 22], l: [-2, 1, 0] }, b: { p: [24, 15, 8], l: [-4, 1, -2] } },
    clash:   { a: { p: [30, 13, 20], l: [-2, 1, 0] }, b: { p: [20, 9, 8], l: [-4, 1, -2] } },
    turn:    { a: { p: [24, 16, 26], l: [-4, 1, -4] }, b: { p: [12, 13, 18], l: [-8, 1, -8] } },
    rout:    { a: { p: [14, 22, 34], l: [-14, 0, -18] },  b: { p: [2, 20, 30], l: [-18, 0, -22] } },
    quiet:   { a: { p: [32, 18, 30], l: [0, 0.6, 0] }, b: { p: [30, 9, 19], l: [36, 1.2, 8] } }
  };
  var PRESETS = {
    ground:  { p: [0, 30, 44], l: [0, 1.4, 0] },
    aerial:  { p: [0, 80, 16], l: [0, 0, 6] },
    duel:    { p: [10, 4.6, 8], l: [0, 1, 0] },
    line:    { p: [24, 5, 18], l: [0, 0.6, 8] },
    far:     { p: [-26, 6, -16], l: [-4, 0.5, -8] },
    wells:   { p: [6, 5, 9], l: [-5.4, 0.6, 3] }
  };

  var clock = { playing: false, speed: 1, frac: 0, last: performance.now() };
  var camState = { mode: 'phase', tween: null };
  var orbit = { az: 0, pol: 0.42, r: 66, target: new THREE.Vector3(0, 0, 0) };
  var curCam = { p: new THREE.Vector3(0, 40, 58), l: new THREE.Vector3(0, 0.8, 0) };
  var camSm = { p: new THREE.Vector3(0, 40, 58), l: new THREE.Vector3(0, 0.8, 0) };
  camera.position.copy(curCam.p);
  camera.lookAt(curCam.l);

  function phaseInfo(frac) {
    var e = frac * TOTAL, acc = 0;
    for (var i = 0; i < PHASES.length; i++) {
      var d = PHASES[i].dur;
      if (e < acc + d || i === PHASES.length - 1) return { i: i, t: clamp01((e - acc) / d) };
      acc += d;
    }
    return { i: PHASES.length - 1, t: 1 };
  }
  function fracOf(i, t) {
    var acc = 0;
    for (var k = 0; k < i; k++) acc += PHASES[k].dur;
    return (acc + t * PHASES[i].dur) / TOTAL;
  }

  /* ------------------------------ applying a global frame */
  var UNITS = champs.concat(mBands, qBands);
  var curPhaseIdx = 0;
  var curPhaseT = 0;
  function applyFrac(frac) {
    var info = phaseInfo(frac);
    var i = info.i, t = info.t;
    curPhaseIdx = i;
    curPhaseT = t;

    /* units: within phase i we move from plan[i-1] (start pose) toward plan[i] (end pose) */
    for (var k = 0; k < UNITS.length; k++) {
      var u = UNITS[k];
      var start = i === 0 ? u.plan[0] : u.plan[i - 1];
      var end = u.plan[i] || u.plan[u.plan.length - 1];
      var w0 = 0.12 + (u._stag || 0);
      var mm = easeIO(clamp01((t - w0) / (0.84 - w0)));
      var p = {
        x: start.x + (end.x - start.x) * mm,
        z: start.z + (end.z - start.z) * mm,
        tilt: (start.tilt || 0) + ((end.tilt || 0) - (start.tilt || 0)) * mm
      };
      /* the duel is a duel: only the champions step out, the lines press and hold */
      if (i === 1 && t > 0.68 && !u.isChampion) { p.z -= Math.sin(t * 40) * 0.06; }
      /* melee shimmer on the rank bands */
      if (i === 3 && !u.isChampion) { p.x += Math.sin(t * 9 + k * 1.7) * 0.14; p.z += Math.cos(t * 7 + k * 2.1) * 0.1; }
      /* fall: the latest keyed fallAt at or before this phase persists */
      var fPhase = -1;
      for (var fi = i; fi >= 0; fi--) {
        if (u.plan[fi].fallAt !== undefined) { fPhase = fi; break; }
      }
      var fallen = 0;
      if (fPhase >= 0) {
        fallen = fPhase < i ? 1 : clamp01((t - u.plan[fPhase].fallAt) / 0.14);
      }
      if (u._wound && (i > u._wound.i || (i === u._wound.i && t >= u._wound.at))) {
        p.tilt = Math.max(p.tilt, u._wound.tilt);
      }
      applyPose(u, p, fallen);
    }

    /* the Ansari trio steps out, is refused, and withdraws before the champions engage */
    var ansarZ = 10.5;
    if (i === 1) {
      var ansarAdv = clamp01((t - 0.04) / 0.16);
      var ansarBack = clamp01((t - 0.30) / 0.14);
      ansarZ = 10.5 - 6.0 * ansarAdv + 6.0 * ansarBack;
    }
    ANSAR_MARKS.forEach(function (m) { m.position.z = ansarZ; });

    /* arrows: late advance into clash; in-flight arrows keep flying after the window closes */
    var arrowWindow = (i === 2 && t > 0.35) || (i === 3 && t < 0.9);
    if (arrowWindow && !reduce) spawnArrows(clock.dt || 0);
    updateArrows(clock.dt || 0);
    arrows.forEach(function (ar) { ar.m.visible = ar.live; });

    /* the sand: from ʻUtbah-side cast of the Prophet (PBUH) toward the Quraysh */
    var dustAmt = (i === 4) ? Math.sin(clamp01(t) * Math.PI) : (i === 5 && t < 0.35 ? (1 - t / 0.35) * 0.5 : 0);
    dust.material.opacity = dustAmt * 0.36;
    if (dustAmt > 0.02 && !reduce) {
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

    /* the angels: gold motes over the Muslim line through the clash */
    var angelAmt = (i === 3) ? Math.sin(clamp01(t) * Math.PI) : (i === 4 && t < 0.45 ? (1 - t / 0.45) : 0);
    angels.material.opacity = angelAmt * 0.55;
    if (angelAmt > 0.02) {
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

    /* spent arrows stay in the sand after the volleys */
    stuckArrows.visible = i >= 3;

    /* labels: hide champion names after the duel phase settles? keep, they inform the whole day */
    /* camera */
    applyCamera(i, t);
  }

  function applyPose(u, p, fallen) {
    var g = u.group;
    g.position.x = p.x; g.position.z = p.z;
    var fr = easeIO(clamp01(fallen));
    g.rotation.x = -1.42 * fr; /* a fallen standard lies flat */
    g.position.y = -0.1 * fr;
    if (!fr && u === chU) g.rotation.x = 0.55 * p.tilt; /* the wounded ʻUbaydah's grievous kneel */
  }
  function spawnArrows(dt) {
    acc.arr += dt * (clock.speed || 1) * 14;
    while (acc.arr > 1) {
      acc.arr -= 1;
      var ar = arrows.find(function (a) { return !a.live; });
      if (!ar) return;
      var fromM = Math.random() > 0.55;
      ar.from.set(fromM ? -9 + Math.random() * 18 : -10 + Math.random() * 12, 1.4 + Math.random() * 0.8, fromM ? 6 + Math.random() * 3 : -2 - Math.random() * 3);
      ar.to.set(fromM ? -10 + Math.random() * 12 : -9 + Math.random() * 18, 1.1, fromM ? -2 : 6);
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
      v.y += Math.sin(clamp01(ar.t) * Math.PI) * 2.2;
      ar.m.position.copy(v);
      ar.m.rotation.y = Math.atan2(ar.dir.x, ar.dir.z);
      ar.m.rotation.x = 0.35 - Math.cos(ar.t * Math.PI) * 0.6;
    }
  }
  var acc = { arr: 0 };

  /* ------------------------------ camera */
  function applyCamera(i, t, snap) {
    var tgt;
    if (camState.mode === 'orbit') return; /* orbit handled below */
    if (camState.mode === 'preset') { tgt = camState.preset; }
    else {
      var ca = CAMS[PHASES[i].id].a, cb = CAMS[PHASES[i].id].b;
      tgt = {
        p: [ca.p[0] + (cb.p[0] - ca.p[0]) * t, ca.p[1] + (cb.p[1] - ca.p[1]) * t, ca.p[2] + (cb.p[2] - ca.p[2]) * t],
        l: [ca.l[0] + (cb.l[0] - ca.l[0]) * t, ca.l[1] + (cb.l[1] - ca.l[1]) * t, ca.l[2] + (cb.l[2] - ca.l[2]) * t]
      };
    }
    /* portrait phones see a narrow horizontal slice: back the camera off and
       lift it so all three Quraysh divisions stay in frame */
    if (camera.aspect < 1) {
      var k = Math.min(2.1, Math.pow(1 / camera.aspect, 0.9));
      tgt.p = [
        tgt.l[0] + (tgt.p[0] - tgt.l[0]) * k,
        tgt.l[1] + (tgt.p[1] - tgt.l[1]) * k * 1.12,
        tgt.l[2] + (tgt.p[2] - tgt.l[2]) * k
      ];
    }
    lerpCam(tgt, snap ? 1 : (reduce ? 0.22 : 0.09));
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

  /* orbit: available whenever the reel is paused; idle drifts slowly */
  var dragging = false, lx = 0, ly = 0;
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
  /* pinch zoom: two pointers, spread/pinch maps to radius (coin-model inertia) */
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
  /* zoom toward the point under the cursor; pivot follows when you zoom deep,
     so the focus becomes the new centre of rotation */
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

  /* ------------------------------ resize + main loop */
  function size() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 52 : 36; /* portrait keeps the whole field in frame */
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', size);
  size();

  var tickCb = null;
  function updateCloth(time) {
    for (var w = 0; w < WAVERS.length; w++) {
      var it = WAVERS[w];
      var attr = it.mesh.geometry.attributes.position;
      var base = it.base, cw = it.w;
      for (var v = 0; v < attr.count; v++) {
        var bx = base[v * 3], by = base[v * 3 + 1];
        var edge = (bx + cw / 2) / cw; /* 0 at the pole, 1 at the free edge */
        attr.setZ(v, Math.sin(bx * 1.5 + time * 2.1 + it.phase + by * 0.7) * (0.03 + edge * edge * 0.17));
      }
      attr.needsUpdate = true;
    }
  }
  function frame(now) {
    requestAnimationFrame(frame);
    lastRaf = now;
    /* follow wall-clock time even on slow devices: a 50 ms cap made playback
       crawl to a near-stop at phone frame rates */
    var dt = Math.min(0.5, (now - clock.last) / 1000);
    clock.last = now;
    clock.dt = dt || 0.016;
    perfTick(now);
    if (clock.playing) {
      clock.frac += dt * clock.speed / TOTAL;
      if (clock.frac >= 1) { clock.frac = 1; clock.playing = false; }
      if (tickCb) { try { tickCb(clock.frac, phaseInfo(clock.frac)); } catch (err) { console.error('[badr] tick', err); } }
      applyFrac(clock.frac);
      updateMass();
    }
    /* paused: turntable drift happens inside the orbit block; only mode-switch here */
    if (!clock.playing && !dragging && camState.mode !== 'orbit') {
      camState.mode = 'orbit';
      orbitFromCam();
    }
    /* orbit camera: smoothed, with fling inertia and a focus pivot */
    if (camState.mode === 'orbit') {
      if (pendingFocus && !dragging) {
        var pf = new THREE.Vector3(pendingFocus.x, 0, pendingFocus.z);
        orbit.target.lerp(pf, 0.04);
        if (orbit.target.distanceTo(pf) < 0.2) pendingFocus = null;
      }
      if (!dragging && !reduce && Math.abs(flingV) > 0.0002) {
        orbit.az += flingV * dt * 60;
        flingV *= Math.pow(0.06, dt);
      }
      if (!dragging && !clock.playing && !reduce) orbit.az += dt * 0.09;
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
    /* labels project; nearer labels win their pixels */
    var w = window.innerWidth, h = window.innerHeight;
    placedRects.length = 0;
    function place(list, isUnit) {
      for (var q = 0; q < list.length; q++) {
        var it = list[q];
        /* the champions' names belong to the duel; afterwards the field keeps the standards only */
        if (isUnit && it.u.isChampion && curPhaseIdx > 1) { it.el.style.visibility = 'hidden'; continue; }
        if (isUnit && it.u.ph && it.u.ph.indexOf(curPhaseIdx) < 0) { it.el.style.visibility = 'hidden'; continue; }
        if (isUnit && it.u.tRange && (curPhaseT < it.u.tRange[0] || curPhaseT > it.u.tRange[1])) { it.el.style.visibility = 'hidden'; continue; }
        if (!isUnit && it.ph && it.ph.indexOf(curPhaseIdx) < 0) { it.el.style.visibility = 'hidden'; continue; }
        if (!isUnit && it.tRange && (curPhaseT < it.tRange[0] || curPhaseT > it.tRange[1])) { it.el.style.visibility = 'hidden'; continue; }
        var lY = isUnit ? (it.u.labelY !== undefined ? it.u.labelY : (it.u.isChampion ? 4.95 : 4.0)) : 0;
        var v = (isUnit ? it.u.group.position.clone().add(new THREE.Vector3(0, lY, 0)) : it.v).clone();
        v = v.project ? v.project(camera) : v;
        var sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h;
        /* smoothed screen positions keep the labels from vibrating */
        if (it.sx === undefined) { it.sx = sx; it.sy = sy; }
        it.sx += (sx - it.sx) * 0.3;
        it.sy += (sy - it.sy) * 0.3;
        sx = it.sx; sy = it.sy;
        /* landmarks near the edge (the ʻarish on a phone) keep their label on screen */
        if (!isUnit) {
          var lw0 = it.el.offsetWidth || 60;
          sx = Math.max(lw0 / 2 + 26, Math.min(w - lw0 / 2 - 26, sx));
        }
        /* far camera: unit labels fade out, landmarks stay */
        var vis = v.z < 1 && sy > 56 && sy < h - 170;
        var dist = isUnit ? camera.position.distanceTo(it.u.group.position) : 0;
        /* phones: names belong to the close shot, not the pulled-back map */
        var far = MOBILE ? 58 : 95, fade = MOBILE ? 40 : 62, span = MOBILE ? 18 : 33;
        if (isUnit && dist > far && !it.u.labelAlways) vis = false;
        var op = isUnit ? (it.u.labelAlways ? 1 : (dist > fade ? Math.max(0, 1 - (dist - fade) / span) : 1)) : 1;
        if (op < 0.08) vis = false;
        it.el.style.opacity = op === 1 ? '' : op.toFixed(2);
        if (vis) {
          var lw = it.el.offsetWidth || 60, lh = it.el.offsetHeight || 20;
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
    var ordered = ULABS.slice().sort(function (a, b) { return (b.u.priority || 0) - (a.u.priority || 0); });
    place(ordered, true);
    place(LANDL, false);
    if (!reduce && !MOBILE) {
      var mp = motes.geometry.attributes.position;
      for (var mj = 0; mj < MOTES; mj++) {
        mp.setX(mj, mp.getX(mj) + (clock.dt || 0) * 0.35);
        if (mp.getX(mj) > 42) mp.setX(mj, -42);
      }
      mp.needsUpdate = true;
      updateCloth(now / 1000);
      for (var pw = 0; pw < PALMS.length; pw++) {
        var pp = PALMS[pw];
        pp.crown.rotation.z = Math.sin(now / 1600 + pp.phase) * 0.035;
        pp.crown.rotation.x = Math.cos(now / 2100 + pp.phase) * 0.022;
      }
      for (var sk = 0; sk < SMOKE.length; sk++) {
        var sm = SMOKE[sk];
        var sp2 = sm.pts.geometry.attributes.position;
        for (var si2 = 0; si2 < sp2.count; si2++) {
          var ny = sp2.getY(si2) + (clock.dt || 0) * 0.18;
          if (ny > 3.6) { ny = 0.3; sp2.setX(si2, sm.x + (Math.random() - 0.5) * 0.5); sp2.setZ(si2, sm.z + (Math.random() - 0.5) * 0.5); }
          sp2.setY(si2, ny);
          sp2.setX(si2, sp2.getX(si2) + Math.sin(now / 1800 + si2) * 0.002);
        }
        sp2.needsUpdate = true;
      }
    } else if (MOBILE && (Math.floor(now / 140) % 2 === 0)) {
      /* a light breath of cloth on mobile: update the largest banners only */
      updateCloth(now / 2500);
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  applyFrac(0);
  applyCamera(0, 0, true);

  /* fallback ticker: if the device throttles RAF, keep the clock and render alive */
  var lastRaf = 0;
  setInterval(function () {
    if (!clock.playing) return;
    if (performance.now() - lastRaf < 120) return; /* RAF healthy */
    var now = performance.now();
    var dt = Math.min(0.5, (now - clock.last) / 1000);
    clock.last = now;
    clock.dt = dt;
    clock.frac += dt * clock.speed / TOTAL;
    if (clock.frac >= 1) { clock.frac = 1; clock.playing = false; }
    applyFrac(clock.frac);
    updateMass();
    if (tickCb) { try { tickCb(clock.frac, phaseInfo(clock.frac)); } catch (err) { console.error('[badr] tick', err); } }
    renderer.render(scene, camera);
  }, 33);

  /* pause when the tab is hidden, and never fast-forward on return */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (clock.playing) {
        clock.playing = false;
        if (tickCb) tickCb(clock.frac, phaseInfo(clock.frac));
      }
    } else {
      clock.last = performance.now();
    }
  });

  /* adaptive quality: if the device cannot hold ~22 fps, drop to 1x pixels */
  var perfT0 = 0, perfN = 0, perfDone = false;
  function perfTick(now) {
    if (perfDone || !clock.playing) return;
    if (!perfT0) { perfT0 = now; perfN = 0; return; }
    perfN++;
    var el = now - perfT0;
    if (el < 3000) return;
    perfDone = true;
    var fps = perfN / (el / 1000);
    if (MOBILE && fps < 22) {
      renderer.setPixelRatio(1);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      console.log('[badr] adaptive quality: fps ' + fps.toFixed(1) + ', pixel ratio -> 1');
    }
  }

  /* ------------------------------ public clock/camera API */
  window.BATTLE = {
    total: TOTAL,
    phases: PHASES,
    phaseInfo: phaseInfo,
    frac: function () { return clock.frac; },
    seek: function (f) {
      clock.frac = clamp01(f);
      applyFrac(clock.frac);
      updateMass();
      if (tickCb) tickCb(clock.frac, phaseInfo(clock.frac));
    },
    play: function () {
      clock.playing = true;
      clock.last = performance.now();
      camState.mode = 'phase';
      canvas.classList.remove('is-dragging');
      applyFrac(clock.frac);
      updateMass();
    },
    pause: function () { clock.playing = false; },
    isPlaying: function () { return clock.playing; },
    setSpeed: function (x) { clock.speed = x; },
    onTick: function (fn) { tickCb = fn; },
    cam: function (name) {
      if (!name || name === 'ground') {
        camState.mode = 'phase';
        return;
      }
      camState.mode = 'preset';
      camState.preset = PRESETS[name] || PRESETS.ground;
    },
    explore: function (on) {
      if (on) {
        camState.mode = 'orbit';
        orbitFromCam();
      } else {
        camState.mode = 'phase';
      }
    },
    setLang: setLang,
    info: function () { return { calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geoms: renderer.info.memory.geometries }; },
    sceneStats: function () {
      var meshes = 0, inst = 0, points = 0, mats = {}, geos = {};
      scene.traverse(function (o) {
        if (o.isMesh) {
          if (o.isInstancedMesh) { inst++; return; }
          meshes++;
          var mm = o.material;
          var key = mm ? (mm.type + ' · #' + (mm.color ? mm.color.getHexString() : '----') + (mm.map ? ' · map' : '')) : 'none';
          mats[key] = (mats[key] || 0) + 1;
          var gk = o.geometry ? o.geometry.type : 'none';
          geos[gk] = (geos[gk] || 0) + 1;
        } else if (o.isPoints) points++;
      });
      return {
        meshes: meshes, instanced: inst, points: points,
        topMats: Object.keys(mats).map(function (k) { return [k, mats[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 12),
        topGeos: Object.keys(geos).map(function (k) { return [k, geos[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 10)
      };
    },
    benchMass: function (n) { var t0 = performance.now(); for (var i = 0; i < (n || 10); i++) updateMass(); return (performance.now() - t0) / (n || 10); },
    isExplore: function () { return camState.mode === 'orbit'; },
    snapCam: function (name) {
      if (name) { camState.mode = 'preset'; camState.preset = PRESETS[name] || PRESETS.ground; }
      else { camState.mode = 'phase'; }
      var ph = phaseInfo(clock.frac);
      applyCamera(ph.i, ph.t, true);
    },
    debugChamp: function () {
      return champs.map(function (u) {
        var n = 0, types = [];
        u.group.traverse(function (o) { if (o.isMesh) { n++; if (types.length < 6) types.push(o.geometry.type); } });
        return { label: u.label, pos: u.group.position.toArray().map(function (v) { return +v.toFixed(2); }), meshes: n, types: types };
      });
    },
    camInfo: function () { return { fov: camera.fov, aspect: +camera.aspect.toFixed(3), p: camera.position.toArray().map(function (n) { return +n.toFixed(1); }), l: curCam.l.toArray().map(function (n) { return +n.toFixed(1); }), mode: camState.mode }; },
  };
})();
