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
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.setClearColor(0x232936, 1);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xc39a6e, MOBILE ? 0.0046 : 0.0038);

  var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 900);

  /* ------------------------------ dawn sky: gradient dome with the low sun,
     the last stars overhead and the setting moon in the west */
  var sunDir = new THREE.Vector3(64, 34, -46).normalize();
  var skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color(0x1a2740) },
      mid: { value: new THREE.Color(0x5d6a7d) },
      bot: { value: new THREE.Color(0xdfae7c) },
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

  /* ------------------------------ light */
  var hemi = new THREE.HemisphereLight(0x8fa8c8, 0x4a3826, 0.52);
  scene.add(hemi);

  /* low eastern sun: the ranks formed at dawn and the fighting was by day */
  var moonLight = new THREE.DirectionalLight(0xffc089, 1.15);
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

  var fill = new THREE.DirectionalLight(0x7d8ea8, 0.3);
  fill.position.set(-40, 30, 40);
  scene.add(fill);
  var rim = new THREE.DirectionalLight(0xffd9b0, 0.4); /* dawn rim on the ivory standards */
  rim.position.set(10, 14, 60);
  scene.add(rim);

  var brassLight = new THREE.PointLight(0xffb54d, 0.5, 14, 2);
  brassLight.position.set(-7.5, 2.6, 20.5); /* the lamp at the ʻarish */
  scene.add(brassLight);
  var wellLight = new THREE.PointLight(0xffb54d, 0.3, 11, 2);
  wellLight.position.set(-5.8, 1.8, 2.6);
  scene.add(wellLight);

  /* ------------------------------ terrain: a sculpted valley around a flat
     battle corridor. The wells, both lines, both camps, the plinth and
     al-Qalib all sit on flat sand; dune fields rise beyond the corridor and
     the valley walls lift toward the horizon. */
  function hash2(x, y) { var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }
  function fbm(x, y, o) {
    var s = 0, a = 0.5, f = 1, i;
    for (i = 0; i < (o || 3); i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= 0.5; }
    return s;
  }
  function smoothstepN(x, a, b) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function heightAt(x, z) {
    var out = Math.max(
      smoothstepN(Math.abs(x), 44, 62),
      smoothstepN(z, 28, 46),
      smoothstepN(-z, 36, 54)
    );
    var h = (fbm(x * 0.024 + 11.2, z * 0.024 + 7.4, 3) - 0.5) * 9.0 * out;
    h += (fbm(x * 0.06 + 3.7, z * 0.06 + 9.1, 2) - 0.5) * 1.8 * out;
    /* framing mounds at the near corners */
    h += 3.2 * Math.exp(-Math.pow((x + 28) / 16, 2) - Math.pow((z - 36) / 12, 2));
    h += 3.0 * Math.exp(-Math.pow((x - 28) / 16, 2) - Math.pow((z - 34) / 12, 2));
    /* the valley walls lift toward the horizon */
    var r = Math.hypot(x, z + 4);
    h += Math.max(0, r - 125) * 0.05 * (0.6 + 0.4 * fbm(x * 0.011, z * 0.011, 2));
    /* micro ripple underfoot, flat enough that nothing floats */
    h += (fbm(x * 0.35, z * 0.35, 2) - 0.5) * 0.05 * (1 - out);
    return Math.max(-5, h);
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
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }

  var T = 420, SEG = 168;
  var groundGeo = new THREE.PlaneGeometry(T, T, SEG, SEG);
  groundGeo.rotateX(-Math.PI / 2);
  var pos = groundGeo.attributes.position;
  var colors = new Float32Array(pos.count * 3);
  var cSand = new THREE.Color(0x8a5c31), cCrest = new THREE.Color(0xc0905c),
    cTrough = new THREE.Color(0x46301c), cGrit = new THREE.Color(0x6f5030);
  var tmp = new THREE.Color();
  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i), z = pos.getZ(i);
    var y = heightAt(x, z);
    pos.setY(i, y);
    var v = fbm(x * 0.07 + 3, z * 0.07 + 5, 3);
    var t = Math.min(1, Math.max(0, y * 0.30 + 0.32 + (v - 0.5) * 0.40));
    tmp.copy(cTrough).lerp(cSand, Math.min(1, t * 1.6)).lerp(cCrest, Math.max(0, t - 0.52) * 1.5);
    tmp.lerp(cGrit, fbm(x * 0.38, z * 0.38, 2) * 0.34);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();
  /* under-floor lid: a huge disc below the sand so nothing shows beneath the terrain */
  var lid = new THREE.Mesh(new THREE.CircleGeometry(600, 48), new THREE.MeshBasicMaterial({ color: 0x2a251d }));
  lid.rotation.x = -Math.PI / 2;
  lid.position.y = -6.5;
  scene.add(lid);
  var ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 1, metalness: 0,
    normalMap: rippleNormal(256, MOBILE ? 30 : 42), normalScale: new THREE.Vector2(0.24, 0.24)
  }));
  ground.receiveShadow = true;
  scene.add(ground);

  /* distant ridges: the valley closes against the horizon */
  [[-96, -122, 62, 9], [86, -138, 56, 11], [148, -58, 42, 7], [-150, -40, 46, 8], [-240, -180, 90, 16], [210, -200, 84, 18]].forEach(function (r) {
    var ridgeM = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), new THREE.MeshLambertMaterial({ color: 0xb0a184 }));
    ridgeM.scale.set(r[2], r[3], r[2] * 0.55);
    ridgeM.position.set(r[0], heightAt(r[0], r[1]) - 1.5, r[1]);
    scene.add(ridgeM);
  });

  /* pebbles scattered across the plain */
  var pebbles = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0x8b7658 }), 260);
  var pd = new THREE.Object3D();
  for (var pi = 0; pi < 260; pi++) {
    var px = -34 + Math.random() * 68;
    var pz = -26 + Math.random() * 56;
    var ps = 0.05 + Math.random() * 0.12;
    pd.position.set(px, heightAt(px, pz) + ps * 0.4, pz);
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
    var R = big ? 1.12 : 0.94, H = big ? 1.06 : 0.92;
    var per = big ? 16 : 13;
    var bw = (2 * Math.PI * R / per) * 1.02;
    /* solid wall so no light leaks between stones */
    var wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 1.03, H, 20, 1, true), stoneDark);
    wall.position.y = H / 2; wall.castShadow = true; wall.receiveShadow = true;
    g.add(wall);
    /* three facing courses of masonry blocks */
    for (var c = 0; c < 3; c++) {
      for (var k = 0; k < per; k++) {
        var a = (k + (c % 2 ? 0.5 : 0)) / per * Math.PI * 2;
        var bh = 0.26 + hash2(k + 9, c) * 0.05;
        var b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.15), c % 2 ? stoneM : stoneDark);
        b.position.set(Math.cos(a) * (R + 0.04), 0.15 + c * (H / 3) + hash2(k, c + 2) * 0.012, Math.sin(a) * (R + 0.04));
        b.rotation.y = -a + Math.PI / 2;
        b.rotation.z = (hash2(k, c + 5) - 0.5) * 0.03;
        b.castShadow = true; b.receiveShadow = true;
        g.add(b);
      }
    }
    /* parapet ring */
    for (var rr = 0; rr < per; rr++) {
      var ra = rr / per * Math.PI * 2;
      var cap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.32), stoneDark);
      cap.position.set(Math.cos(ra) * (R + 0.02), H + 0.02, Math.sin(ra) * (R + 0.02));
      cap.rotation.y = -ra + Math.PI / 2;
      cap.castShadow = true;
      g.add(cap);
    }
    /* dark mouth + water */
    var mouth = new THREE.Mesh(new THREE.CircleGeometry(R - 0.15, 18), new THREE.MeshLambertMaterial({ color: 0x100c08 }));
    mouth.rotation.x = -Math.PI / 2; mouth.position.y = H - 0.03; g.add(mouth);
    var water = new THREE.Mesh(new THREE.CircleGeometry(R - 0.22, 16), waterM);
    water.rotation.x = -Math.PI / 2; water.position.y = H - 0.05; g.add(water);
    /* curb stones on the sand */
    for (var s2 = 0; s2 < 10; s2++) {
      var sa = s2 / 10 * Math.PI * 2 + 0.3;
      var st = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15 + hash2(s2, 3) * 0.07, 0), stoneDark);
      st.position.set(Math.cos(sa) * (R + 0.32), 0.07, Math.sin(sa) * (R + 0.32));
      st.rotation.set(hash2(s2, 1) * 3, hash2(s2, 2) * 3, hash2(s2, 3) * 3);
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
      var rope = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.9, 4), new THREE.MeshLambertMaterial({ color: 0x8a7a5a }));
      rope.position.set(0.1, 1.14, 0); g.add(rope);
      var bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.2, 8), woodM);
      bucket.position.set(0.1, 0.62, 0); bucket.castShadow = true; g.add(bucket);
    }
    g.position.set(wx, heightAt(wx, wz), wz);
    g.rotation.y = 0.5;
    scene.add(g); return g;
  }
  [[8.0, 3.2], [9.5, 4.2], [10.8, 3.4]].forEach(function (w, wi) { wellAt(w[0], w[1], wi === 0); });
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
  basin.position.set(9.0, 0.02, 3.8);
  scene.add(basin);
  var trough = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.34, 0.52), stoneM);
  trough.position.set(7.0, 0.17, 2.8);
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
  arish.position.set(-7.5, 0, 20.5);
  scene.add(arish);

  var aftermathGroup = new THREE.Group();
  aftermathGroup.userData.keep = true;
  aftermathGroup.visible = false;
  scene.add(aftermathGroup);

  var well24 = wellAt(36, 8, true);
  /* the Quraysh leaders thrown into al-Qalib: wrapped bodies at the well, no figures */
  var bodyM = new THREE.MeshLambertMaterial({ color: 0x3a332a });
  function bodyBundle(x, z, rot, parent) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.78, 6), bodyM);
    body.rotation.z = Math.PI / 2; body.position.set(0.02, 0.2, 0); g.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), bodyM);
    head.position.set(0.5, 0.19, 0); g.add(head);
    var armGeo = new THREE.CylinderGeometry(0.055, 0.06, 0.46, 5);
    var legGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.56, 5);
    var footGeo = new THREE.BoxGeometry(0.11, 0.055, 0.18);
    [-1, 1].forEach(function (side) {
      var arm = new THREE.Mesh(armGeo, bodyM);
      arm.rotation.z = Math.PI / 2; arm.rotation.y = side * 0.38;
      arm.position.set(0.2, 0.13, side * 0.2); g.add(arm);
      var leg = new THREE.Mesh(legGeo, bodyM);
      leg.rotation.z = Math.PI / 2; leg.rotation.y = side * 0.18;
      leg.position.set(-0.33, 0.12, side * 0.15); g.add(leg);
      var foot = new THREE.Mesh(footGeo, bodyM);
      foot.position.set(-0.62, 0.06, side * 0.18); foot.rotation.y = side * 0.18; g.add(foot);
    });
    g.position.set(x, 0, z); g.rotation.y = rot;
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    (parent || scene).add(g);
    return g;
  }
  [[34.4,6.5,0.4],[35.2,5.9,1.1],[36.6,5.7,2.0],[37.9,6.3,2.6],[38.3,7.7,0.7],[37.7,9.1,1.5],[36.2,9.7,2.4],[34.8,9.1,0.2]].forEach(function (b) { bodyBundle(b[0], b[1], b[2], aftermathGroup); });

  /* the seventy Quraysh dead on the field (BADR-048) */
  for (var kd = 0; kd < 70; kd++) {
    var kx = -24 + (kd % 14) * 3.6 + (Math.random() - 0.5) * 1.8;
    var kz = -19.5 - Math.floor(kd / 14) * 1.35 + (Math.random() - 0.5) * 0.7;
    bodyBundle(kx, kz, Math.random() * Math.PI, aftermathGroup);
  }

  /* fourteen graves on the near bank (BADR-047) */
  var graveM = new THREE.MeshLambertMaterial({ color: 0x6b6254 });
  var moundM = new THREE.MeshLambertMaterial({ color: 0xb09a78 });
  for (var gm = 0; gm < 14; gm++) {
    var gx = -6.5 + gm;
    var mound = new THREE.Mesh(new THREE.SphereGeometry(0.52, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2), moundM);
    mound.scale.set(1, 0.22, 0.72); mound.position.set(gx, 0.02, 22);
    mound.receiveShadow = true; aftermathGroup.add(mound);
    var stone = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 0.18), graveM);
    stone.position.set(gx, 0.28, 22.55); stone.rotation.y = (Math.random() - 0.5) * 0.18;
    stone.castShadow = true; stone.receiveShadow = true; aftermathGroup.add(stone);
  }

  /* ------------------------------ set dressing: rocks, scrub, palms */
  var rockM = new THREE.MeshPhongMaterial({ color: 0x8f7f68, flatShading: true, shininess: 0 });
  var rockDarkM = new THREE.MeshPhongMaterial({ color: 0x5d5342, flatShading: true, shininess: 0 });
  /* stratified rocks: three stacked slabs, seated on the heightfield */
  function rock(px, pz, s) {
    var g = new THREE.Group();
    for (var l = 0; l < 3; l++) {
      var geo = new THREE.IcosahedronGeometry(s * (0.72 - l * 0.13), 0);
      var p = geo.attributes.position;
      for (var vi = 0; vi < p.count; vi++) {
        var f = 0.82 + hash2(vi, l + 2) * 0.36;
        p.setXYZ(vi, p.getX(vi) * f * 1.35, p.getY(vi) * f * 0.55, p.getZ(vi) * f);
      }
      geo.computeVertexNormals();
      var m = new THREE.Mesh(geo, l === 2 ? rockDarkM : rockM);
      m.position.y = 0.10 + l * s * 0.30;
      m.rotation.y = hash2(l, 7) * 3;
      m.castShadow = true; m.receiveShadow = true;
      g.add(m);
    }
    g.position.set(px, heightAt(px, pz), pz);
    scene.add(g);
  }
  [[-26, 6, 1.3], [-23, -9, 0.8], [18, 9, 1.1], [24, 2.6, 0.7], [-16, -22, 1.4], [10, -19, 0.9], [33, -14, 1.6], [-34, 16, 1.8], [40, 12, 1.2], [6, 26, 0.9], [-9, 30, 1.1], [30, -30, 2.2], [-13, 23, 1.5], [12, 24, 1.3], [-19, 26, 1.7]].forEach(function (r, ri) { rock(r[0], r[1], r[2]); });
  /* scrub: one instanced draw for the whole field */
  var scrubGeo = new THREE.ConeGeometry(0.13, 0.46, 4, 1);
  var scrubN = 240;
  var scrub = new THREE.InstancedMesh(scrubGeo, new THREE.MeshLambertMaterial({ color: 0x6f6547 }), scrubN);
  var scrubD = new THREE.Object3D();
  for (var scI = 0; scI < scrubN; scI++) {
    var scA = hash2(scI, 1) * Math.PI * 2, scR = 5 + Math.pow(hash2(scI, 2), 0.6) * 52;
    var scX = Math.cos(scA) * scR, scZ = Math.sin(scA) * scR - 3;
    scrubD.position.set(scX, heightAt(scX, scZ) + 0.12, scZ);
    scrubD.rotation.set((hash2(scI, 3) - 0.5) * 0.5, hash2(scI, 4) * 3, (hash2(scI, 5) - 0.5) * 0.5);
    var scS = 0.5 + hash2(scI, 6) * 1.1;
    scrubD.scale.set(scS, scS * (0.7 + hash2(scI, 7) * 0.9), scS);
    scrubD.updateMatrix();
    scrub.setMatrixAt(scI, scrubD.matrix);
  }
  scrub.receiveShadow = true;
  scene.add(scrub);
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
  palm(-16.0, 5.2, 3.3, 0.7, true); palm(-15.2, 8.2, 2.4, 0.9, true);

  /* reeds at the basin edge */
  for (var rd = 0; rd < 26; rd++) {
    var ra = (rd / 26) * Math.PI * 2 + 0.2;
    var rr = 2.0 + Math.random() * 0.5;
    var reed = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.5 + Math.random() * 0.5, 4), new THREE.MeshLambertMaterial({ color: 0x6f7a4a }));
    reed.position.set(-6.6 + Math.cos(ra) * rr, 0.3, 0.4 + Math.sin(ra) * rr);
    reed.rotation.z = (Math.random() - 0.5) * 0.3;
    scene.add(reed);
  }

  /* camps on the banks (BADR-018: both armies camped on their bank through the rain-night).
     Goat-hair ridge tents: sagging cloth roof, dark interior, back wall, ridge poles and guys. */
  var ropeM = new THREE.MeshLambertMaterial({ color: 0x8a7a5a });
  function tent(x, z, dark, w, d, h) {
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
    g.rotation.y = (hash2(Math.round(x * 7 + z * 3), 1) - 0.5) * 0.5;
    scene.add(g);
  }
  [-22, -18].forEach(function (x) { tent(x, 18.5, false, 3.8, 4.8, 1.4); });
  [18, 22].forEach(function (x) { tent(x, 18.5, false, 3.8, 4.8, 1.4); });
  /* Quraysh: ten tents in the front row and five behind, scaled to the army */
  [-23, -18, -13, -8, -3, 2, 7, 12, 17, 22].forEach(function (x) { tent(x, -26.5, true, 3.4, 4.2, 1.25); });
  [-19, -9, 1, 11, 21].forEach(function (x) { tent(x, -31.6, true, 3.4, 4.2, 1.25); });

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
    return g;
  }
  horse(-15.8, 12.4, 0.5, false); horse(15.8, 14.2, -0.4, false);
  [[-24, -18, 0.3], [-20, -21, 0.5], [24, -18, -0.3], [20, -21, -0.5], [-27, -13, 0.4], [27, -13, -0.4]].forEach(function (h) {
    horse(h[0], h[1], h[2], true);
  });

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
    var arw = makeArrow(), ax, az;
    do { ax = -11 + Math.random() * 21; az = -2.5 + Math.random() * 7; }
    while (Math.hypot(ax + 9, az + 0.3) < 4.2);
    arw.position.set(ax, 0.28, az);
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
  chA = champion(0, 0, 11.2, 'ʻAlī (RA)', 'BADR-029'); chA.labelY = 3.9;
  chU = champion(0, 3.2, 11.5, 'ʻUbaydah (RA)', 'BADR-028');
  chS = champion(1, -5.5, -13.8, 'Shaybah', 'BADR-028');
  chW = champion(1, 0, -13.4, 'al-Walīd', 'BADR-029'); chW.labelY = 3.9;
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
  function eventStandard(x, z, side, tilt, fallen, parent) {
    var g = new THREE.Group();
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 3.2, 6), woodM);
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
  /* Bilāl (RA) runs down ʻUmayyah ibn Khalaf; the Muʿādh/Muʿawwidh/Ikrimah
     action is now told by the named vignette figures on their plinth. */
  var bilalMark = eventStandard(8.5, 5.0, 0, 0, false);
  var umayyahMark = eventStandard(13.2, -5.8, 1, 0, true);
  var EVENT_MARKS = [
    { group: bilalMark, side: 0, label: 'Bilāl (RA)', k: 'bilal', labelY: 3.9, event: true, priority: 1, labelAlways: true, ph: [5, 6] },
    { group: umayyahMark, side: 1, label: 'ʻUmayyah ibn Khalaf', k: 'umayyah', labelY: 2.4, event: true, priority: 1, labelAlways: true, ph: [5, 6] }
  ];
  /* the refusal is the point of the first challenge: say it plainly, then hide it */
  var refuseMark = new THREE.Group();
  refuseMark.position.set(-6, 0, -12.5);
  EVENT_MARKS.push({ group: refuseMark, side: 1, label: 'the Quraysh refuse', k: 'qurayshRefuse', labelY: 6.2, event: true, priority: 1, labelAlways: true, ph: [1], tRange: [0.03, 0.42] });
  /* Before the Hashimi champions, the first Ansari trio steps out: ʻAwf and
     Muʿawwidh (sons of al-Harith / Afraʾ) and ʿAbdullah ibn Rawahah (RA).
     Quraysh refuses them as not their equals; the trio withdraws. */
  var ansarA = eventStandard(-6.0, 10.5, 0, 0, false);
  var ansarB = eventStandard(-4.2, 10.5, 0, 0, false);
  var ansarC = eventStandard(-2.4, 10.5, 0, 0, false);
  var ANSAR_MARKS = [ansarA, ansarB, ansarC];
  /* these three standards move, so keep them out of the static merge */
  ANSAR_MARKS.forEach(function (g) { g.userData.dynamicRoot = true; });
  EVENT_MARKS.push({ group: ansarB, side: 0, label: 'the Anṣār trio (RA)', k: 'ansarTrio', labelY: 4.0, event: true, priority: 1, labelAlways: true, ph: [1] });

  /* ------------------------------ rigged heroes (Quaternius Adventurer, CC0).
     The six duel champions and the three Anṣār are rigged, faceless figures:
     one merged skinned mesh per body (a single draw call each), a cloth turban
     or iron helm over the head, a weapon on the right wrist and a shield
     strapped to the left forearm. Clip time is driven from the battle clock,
     so every seek poses the figures deterministically. No face is ever visible;
     the Prophet ﷺ is never depicted. */
  var HEROES = { ready: false, kits: {}, specs: [], ansar: [], count: 0, assets: {} };
  var HCLIP = {
    idle: 'CharacterArmature|Idle_Sword',
    neutral: 'CharacterArmature|Idle',
    walk: 'CharacterArmature|Walk',
    attack: 'CharacterArmature|Sword_Slash',
    hit: 'CharacterArmature|HitRecieve',
    death: 'CharacterArmature|Death'
  };
  var HERO_PAL = {
    muslim: { body: 0xd8d2c4, legs: 0x5f5240, feet: 0x3f2f22, head: 0x2a2833 },
    ansar: { body: 0xbfb2a0, legs: 0x54483a, feet: 0x3a2b20, head: 0x33303b },
    quraysh: { body: 0x6d3d29, legs: 0x452e20, feet: 0x33251b, head: 0x3a2c25 }
  };
  var HERO_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, flatShading: true, skinning: true });

  /* world-aligned holder on a bone: keeps a prop upright at bind, then follows it */
  function boneHolder(bone) {
    bone.updateMatrixWorld(true);
    var q0 = bone.getWorldQuaternion(new THREE.Quaternion());
    var ws = bone.getWorldScale(new THREE.Vector3());
    var holder = new THREE.Group();
    holder.quaternion.copy(q0).invert();
    holder.scale.set(1 / ws.x, 1 / ws.y, 1 / ws.z);
    bone.add(holder);
    return holder;
  }
  function scaleHolder(bone) {
    var ws = bone.getWorldScale(new THREE.Vector3());
    var h = new THREE.Group();
    h.scale.set(1 / ws.x, 1 / ws.y, 1 / ws.z);
    bone.add(h);
    return h;
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
  /* merge a clone's skinned parts into one geometry: every part is re-expressed
     in the first part's bind space so a single bind matrix drives them all */
  function mergeHeroBody(root) {
    var parts = [];
    root.traverse(function (o) { if (o.isSkinnedMesh && !/Backpack/i.test(o.name || '')) parts.push(o); });
    if (!parts.length) return null;
    var b0 = parts[0].bindMatrix || new THREE.Matrix4();
    var inv0 = new THREE.Matrix4().copy(b0).invert();
    var m = new THREE.Matrix4(), v = new THREE.Vector3(), nv = new THREE.Vector3();
    var posA = [], norA = [], colA = [], siA = [], swA = [], idx = [], off = 0;
    var grey = new THREE.Color(0x888888);
    for (var pi = 0; pi < parts.length; pi++) {
      var part = parts[pi];
      var g = part.geometry, p = g.attributes.position;
      if (!g.attributes.normal) g.computeVertexNormals();
      m.multiplyMatrices(inv0, part.bindMatrix || b0);
      var c = (part.material && part.material.color) || grey;
      var si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
      for (var i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m);
        posA.push(v.x, v.y, v.z);
        nv.fromBufferAttribute(g.attributes.normal, i).transformDirection(m).normalize();
        norA.push(nv.x, nv.y, nv.z);
        colA.push(c.r, c.g, c.b);
        siA.push(si.getX(i), si.getY(i), si.getZ(i), si.getW(i));
        swA.push(sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i));
      }
      if (g.index) { for (var k = 0; k < g.index.count; k++) idx.push(g.index.array[k] + off); }
      else { for (var k2 = 0; k2 < p.count; k2++) idx.push(k2 + off); }
      off += p.count;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(norA, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3));
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(siA, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(swA, 4));
    geo.setIndex(idx);
    geo.computeBoundingBox();
    var bindBox = new THREE.Box3().copy(geo.boundingBox).applyMatrix4(b0);
    return { geo: geo, bind: b0, bindBox: bindBox };
  }
  function applyPalette(root, pal) {
    root.traverse(function (o) {
      if (!o.isMesh) return;
      var nm = o.name || '';
      if (/Backpack/i.test(nm)) { o.visible = false; return; }
      var col = pal.body;
      if (/Legs/i.test(nm)) col = pal.legs;
      else if (/Feet/i.test(nm)) col = pal.feet;
      else if (/Head/i.test(nm)) col = pal.head;
      o.material = new THREE.MeshStandardMaterial({ color: col, roughness: 0.95, metalness: 0, flatShading: true, skinning: true });
    });
  }
  function buildKit(pal) {
    var c = THREE.SkeletonUtils.clone(HEROES.master);
    applyPalette(c, pal);
    var merged = mergeHeroBody(c);
    return merged;
  }
  /* normalize a loaded glb prop: centre it, size it, aim its axis, one mesh */
  function prepProp(src, opts) {
    var obj = src.clone(true);
    obj.traverse(function (o) { if (o.isMesh) { o.castShadow = true; } });
    var wrap = new THREE.Group();
    wrap.add(obj);
    wrap.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(wrap);
    var sz = box.getSize(new THREE.Vector3());
    var arr = [sz.x, sz.y, sz.z];
    var longest = Math.max(arr[0], arr[1], arr[2]);
    obj.scale.multiplyScalar(opts.len / longest);
    wrap.updateMatrixWorld(true);
    var box2 = new THREE.Box3().setFromObject(wrap);
    var c = box2.getCenter(new THREE.Vector3());
    obj.position.sub(c);
    var axisVec = new THREE.Vector3(
      arr[0] >= arr[1] && arr[0] >= arr[2] ? 1 : 0,
      arr[1] > arr[0] && arr[1] >= arr[2] ? 1 : 0,
      arr[2] > arr[0] && arr[2] > arr[1] ? 1 : 0
    );
    if (opts.grip) obj.position.addScaledVector(axisVec, -opts.grip * opts.len);
    var q = new THREE.Quaternion().setFromUnitVectors(axisVec, opts.dir.clone().normalize());
    var baked = bakeToMesh(wrap, 0.55);
    var out = new THREE.Group();
    out.add(baked);
    out.quaternion.copy(q);
    return out;
  }
  /* cloth-wrapped head: a wound turban or an iron helm. No face, ever. */
  function heroHead(bone, height, opts) {
    var s = height / 1.78;
    var g = boneHolder(bone);
    var tmp = new THREE.Group();
    function part(geo, color, x, y, z, rx, sx, sy, sz2) {
      var mm = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: color, roughness: 1, metalness: 0, flatShading: true }));
      mm.position.set(x || 0, y || 0, z || 0);
      if (rx) mm.rotation.x = rx;
      if (sx) mm.scale.set(sx, sy, sz2);
      tmp.add(mm);
    }
    part(new THREE.SphereGeometry(0.114 * s, 14, 10), opts.wrap, 0, 0.078 * s, 0, 0, 1.0, 1.10, 1.04);
    part(new THREE.CylinderGeometry(0.056 * s, 0.070 * s, 0.13 * s, 10), opts.wrap, 0, -0.045 * s);
    if (opts.helm) {
      part(new THREE.SphereGeometry(0.130 * s, 12, 9, 0, Math.PI * 2, 0, Math.PI * 0.66), opts.band, 0, 0.078 * s, 0, 0, 1, 1.16, 1.04);
      part(new THREE.CylinderGeometry(0.145 * s, 0.141 * s, 0.040 * s, 12), opts.dark, 0, 0.055 * s);
      part(new THREE.BoxGeometry(0.022 * s, 0.10 * s, 0.024 * s), opts.dark, 0, 0.005 * s, 0.138 * s);
      part(new THREE.ConeGeometry(0.028 * s, 0.10 * s, 6), opts.dark, 0, 0.245 * s);
      part(new THREE.CylinderGeometry(0.118 * s, 0.100 * s, 0.12 * s, 12, 1, true), opts.dark, 0, -0.025 * s);
    } else {
      part(new THREE.TorusGeometry(0.104 * s, 0.052 * s, 6, 18), opts.band, 0, 0.163 * s, Math.PI / 2);
      part(new THREE.TorusGeometry(0.108 * s, 0.022 * s, 4, 18), opts.dark, 0, 0.118 * s, Math.PI / 2);
      part(new THREE.SphereGeometry(0.108 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), opts.band, 0, 0.170 * s, 0, 0, 1, 0.46, 1);
      part(new THREE.SphereGeometry(0.036 * s, 6, 5), opts.dark, 0.085 * s, 0.135 * s, -0.055 * s);
    }
    g.add(tmp);
    var baked = bakeToMesh(tmp, 1);
    g.add(baked);
    g.remove(tmp);
    return g;
  }
  /* shield strapped to the left forearm: disc, boss and a leather strap that
     wraps the wrist — the strap is what keeps it from reading as a tray */
  function strappedShield(bone, spec) {
    var s = spec.height / 1.78;
    var holder = boneHolder(bone);
    bone.updateMatrixWorld(true);
    var up = new THREE.Vector3(0, 1, 0);
    var parent = bone.parent;
    parent.updateMatrixWorld(true);
    var d = bone.getWorldPosition(new THREE.Vector3()).sub(parent.getWorldPosition(new THREE.Vector3()));
    if (d.lengthSq() < 1e-8) d.set(0, -1, 0); else d.normalize();
    var fwd = new THREE.Vector3(Math.sin(spec.ry), 0, Math.cos(spec.ry));
    var left = new THREE.Vector3().crossVectors(up, fwd).normalize();
    var tmp = new THREE.Group();
    var faceC = spec.kit === 'quraysh' ? 0x4a4132 : 0x8a7a5c;
    var rimC = spec.kit === 'quraysh' ? 0x33322e : 0x5f5240;
    function part(geo, color, pos, quat) {
      var mm = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: color, roughness: 0.9, metalness: 0.05, flatShading: true }));
      if (pos) mm.position.copy(pos);
      if (quat) mm.quaternion.copy(quat);
      mm.castShadow = true;
      tmp.add(mm);
    }
    var qFace = new THREE.Quaternion().setFromUnitVectors(up, d);
    part(new THREE.CylinderGeometry(0.26 * s, 0.26 * s, 0.035, 14), faceC,
      d.clone().multiplyScalar(0.07 * s).addScaledVector(left, 0.05 * s), qFace);
    part(new THREE.SphereGeometry(0.05 * s, 8, 6), rimC,
      d.clone().multiplyScalar(0.095 * s).addScaledVector(left, 0.05 * s));
    part(new THREE.TorusGeometry(0.07 * s, 0.019 * s, 5, 12), rimC,
      left.clone().multiplyScalar(0.02 * s),
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d));
    holder.add(tmp);
    var baked = bakeToMesh(tmp, 0.9);
    holder.add(baked);
    holder.remove(tmp);
  }
  function makeHero(spec) {
    var root = THREE.SkeletonUtils.clone(HEROES.master);
    var holder = new THREE.Group();
    holder.add(root);
    var kit = HEROES.kits[spec.kit];
    var native = kit.bindBox.max.y - kit.bindBox.min.y;
    var s = spec.height / native;
    root.scale.setScalar(s);
    root.position.y = -kit.bindBox.min.y * s;
    /* the merged kit body replaces the part meshes (same skeleton, one draw) */
    var parts = [];
    root.traverse(function (o) { if (o.isSkinnedMesh) parts.push(o); });
    var body = new THREE.SkinnedMesh(kit.geo, HERO_MAT);
    body.castShadow = true; body.receiveShadow = true; body.frustumCulled = false;
    body.bind(parts[0].skeleton, parts[0].bindMatrix);
    body.position.copy(parts[0].position);
    body.quaternion.copy(parts[0].quaternion);
    body.scale.copy(parts[0].scale);
    parts[0].parent.add(body);
    parts.forEach(function (pm) { pm.visible = false; });

    root.updateMatrixWorld(true);
    var mixer = new THREE.AnimationMixer(root);
    var actions = {};
    HEROES.master.animations.forEach(function (clip) { actions[clip.name] = mixer.clipAction(clip); });
    var fig = { root: root, holder: holder, mixer: mixer, actions: actions, cur: null, from: null, fadeAt: -1, off: spec.offT || 0, idle: spec.idle || 'idle' };
    var idleA = actions[HCLIP[fig.idle]];
    if (idleA) { idleA.enabled = true; idleA.setEffectiveWeight(1); idleA.play(); idleA.time = 0; idleA.paused = true; }
    mixer.update(0);

    var head = root.getObjectByName('Head');
    var wristR = root.getObjectByName('WristR');
    var wristL = root.getObjectByName('WristL');
    if (head) heroHead(head, spec.height, spec.wrap);
    if (wristR && spec.weapon) {
      var wl = spec.weapon === 'sword' ? { len: 0.60, grip: 0.42 } : { len: 2.25, grip: 0.30 };
      var w = prepProp(HEROES.assets[spec.weapon], { len: wl.len, dir: new THREE.Vector3(0, -1, 0), grip: wl.grip });
      scaleHolder(wristR).add(w);
    }
    if (wristL && spec.shield) strappedShield(wristL, spec);
    HEROES.count++;
    return fig;
  }
  /* deterministic clip driving: weights fade on the battle clock keyed to the
     structural state boundary (not the seek time), and clip times are set
     explicitly so a seek always lands on the same pose */
  function heroDrive(f, want, tl, deathT, attackT, fadeStart) {
    if (!f.actions[HCLIP[want]]) want = f.idle;
    if (want !== f.cur) {
      f.from = f.cur;
      if (fadeStart !== undefined && fadeStart <= tl) f.fadeAt = fadeStart;
      else { f.from = null; f.fadeAt = tl - 1; } /* seeked to before the change: snap */
      f.cur = want;
    }
    var w = clamp01((tl - f.fadeAt) / 0.5);
    var states = [];
    function st(name, weight) {
      if (!weight || !name) return;
      var a = f.actions[HCLIP[name]];
      if (!a) return;
      var dur = a.getClip().duration || 1;
      var tt;
      if (name === 'death') tt = Math.min(Math.max(0.01, (deathT || 0) * 1.4), dur - 0.01);
      else if (name === 'attack') tt = Math.min(attackT || 0, dur - 0.01);
      else if (name === 'walk') tt = (tl * 0.85 + f.off) % dur;
      else tt = (tl * 0.55 + f.off) % dur;
      states.push({ a: a, time: tt, w: weight });
    }
    st(want, w);
    if (w < 1 && f.from && f.from !== want) st(f.from, 1 - w);
    for (var nm in f.actions) { var a = f.actions[nm]; a.enabled = false; a.setEffectiveWeight(0); }
    states.forEach(function (ss) {
      ss.a.enabled = true; ss.a.setEffectiveWeight(ss.w); ss.a.play(); ss.a.time = ss.time; ss.a.paused = true;
    });
    f.mixer.update(0);
  }
  function driveHeroUnit(u, i, t, tl, fallen, deathT, deathStart) {
    var f = u.hero;
    if (!f) return;
    var want, atk = null, fadeStart;
    if (fallen > 0.02 || deathT > 0.05) {
      want = 'death';
      fadeStart = deathStart;
    } else {
      var mv = false, mvWin = null;
      if (u._walkWin) for (var wi = 0; wi < u._walkWin.length; wi++) {
        var ww = u._walkWin[wi];
        if (ww.i === i && t >= ww.a && t <= ww.b) { mv = true; mvWin = ww; break; }
      }
      if (mv) u._lastWalkEnd = fracOf(mvWin.i, mvWin.b) * TOTAL;
      if (!mv && u._attackWin) for (var ai = 0; ai < u._attackWin.length; ai++) {
        var aw = u._attackWin[ai];
        if (aw.i === i && t >= aw.a && t <= aw.b) { atk = (t - aw.a) * PHASES[i].dur * 1.4; fadeStart = fracOf(aw.i, aw.a) * TOTAL; break; }
      }
      var wounded = u._wound && (i > u._wound.i || (i === u._wound.i && t >= u._wound.at));
      if (atk !== null) want = 'attack';
      else if (mv) { want = 'walk'; fadeStart = fracOf(mvWin.i, mvWin.a) * TOTAL; }
      else if (wounded) { want = 'neutral'; fadeStart = fracOf(u._wound.i, u._wound.at) * TOTAL; }
      else { want = f.idle; fadeStart = u._lastWalkEnd; }
    }
    heroDrive(f, want, tl, deathT, atk, fadeStart);
  }

  /* the cast: Ḥamzah, ʿAlī and ʿUbaydah (linen, turbans) against Shaybah,
     al-Walīd and ʿUtbah (dark mail, helms); the Anṣār trio in field dress.
     Attack beats follow the graded ledger (BADR-028): Ḥamzah kills Shaybah,
     ʿAlī kills al-Walīd, ʿUtbah wounds ʿUbaydah, Ḥamzah finishes ʿUtbah. */
  HEROES.specs = [
    { u: chH, kit: 'muslim', height: 1.80, weapon: 'sword', shield: true, wrap: { wrap: 0x2d2a35, band: 0xd8cdb2, dark: 0x6f5f49 }, ry: Math.PI, idle: 'idle', offT: 0.0, zoff: 0.38,
      walkWin: [{ i: 1, a: 0.14, b: 0.78 }, { i: 2, a: 0.12, b: 0.84 }],
      attackWin: [{ i: 1, a: 0.62, b: 0.72 }, { i: 1, a: 0.87, b: 0.93 }] },
    { u: chA, kit: 'muslim', height: 1.76, weapon: 'sword', shield: true, wrap: { wrap: 0x2f2c38, band: 0xcfc3a8, dark: 0x6f5f49 }, ry: Math.PI, idle: 'idle', offT: 1.7, zoff: 0.38,
      walkWin: [{ i: 1, a: 0.14, b: 0.78 }, { i: 2, a: 0.12, b: 0.84 }],
      attackWin: [{ i: 1, a: 0.76, b: 0.86 }] },
    { u: chU, kit: 'muslim', height: 1.82, weapon: 'spear', shield: true, wrap: { wrap: 0x35313d, band: 0xd0c4aa, dark: 0x6f5f49 }, ry: Math.PI, idle: 'neutral', offT: 3.1, zoff: 0.38,
      walkWin: [{ i: 1, a: 0.14, b: 0.78 }, { i: 2, a: 0.12, b: 0.84 }] },
    { u: chS, kit: 'quraysh', height: 1.84, weapon: 'sword', shield: true, helm: true, wrap: { wrap: 0x54554f, band: 0x7b7c74, dark: 0x33322e }, ry: 0, idle: 'idle', offT: 4.3, zoff: -0.38,
      walkWin: [{ i: 1, a: 0.14, b: 0.78 }] },
    { u: chW, kit: 'quraysh', height: 1.86, weapon: 'sword', shield: true, helm: true, wrap: { wrap: 0x50514b, band: 0x77786f, dark: 0x31302c }, ry: 0, idle: 'idle', offT: 5.2, zoff: -0.38,
      walkWin: [{ i: 1, a: 0.14, b: 0.78 }] },
    { u: chB, kit: 'quraysh', height: 1.82, weapon: 'spear', shield: true, helm: true, wrap: { wrap: 0x585951, band: 0x7d7e74, dark: 0x35342f }, ry: 0, idle: 'neutral', offT: 6.1, zoff: -0.38,
      walkWin: [{ i: 1, a: 0.14, b: 0.78 }],
      attackWin: [{ i: 1, a: 0.78, b: 0.88 }] },
    { parent: ansarA, kit: 'ansar', height: 1.72, weapon: 'spear', shield: true, wrap: { wrap: 0x352f3a, band: 0xcfc3a8, dark: 0x7f6a4c }, ry: Math.PI, idle: 'neutral', offT: 7.4, zoff: 0.0 },
    { parent: ansarB, kit: 'ansar', height: 1.70, weapon: 'spear', shield: true, wrap: { wrap: 0x3a3340, band: 0xc8bca0, dark: 0x7f6a4c }, ry: Math.PI, idle: 'neutral', offT: 8.3, zoff: 0.0 },
    { parent: ansarC, kit: 'ansar', height: 1.74, weapon: 'spear', shield: true, wrap: { wrap: 0x322c36, band: 0xd4c8ac, dark: 0x7f6a4c }, ry: Math.PI, idle: 'neutral', offT: 9.2, zoff: 0.0 }
  ];
  var fbxLoader = new THREE.FBXLoader();
  var gltfLoader = new THREE.GLTFLoader();
  function loadFBX(url) { return new Promise(function (res, rej) { fbxLoader.load(url, res, undefined, rej); }); }
  function loadGLB(url) { return new Promise(function (res, rej) { gltfLoader.load(url, res, undefined, rej); }); }
  Promise.all([
    loadFBX('assets/models/quaternius/Adventurer.fbx'),
    loadGLB('assets/models/quaternius/Sword.glb'),
    loadGLB('assets/models/quaternius/Spear.glb'),
    loadGLB('assets/models/quaternius/Shield_Round.glb')
  ]).then(function (r) {
    HEROES.master = r[0];
    HEROES.assets.sword = r[1].scene;
    HEROES.assets.spear = r[2].scene;
    HEROES.kits.muslim = buildKit(HERO_PAL.muslim);
    HEROES.kits.ansar = buildKit(HERO_PAL.ansar);
    HEROES.kits.quraysh = buildKit(HERO_PAL.quraysh);
    HEROES.specs.forEach(function (spec) {
      var fig = makeHero(spec);
      var parent = spec.u ? spec.u.group : spec.parent;
      parent.add(fig.holder);
      fig.holder.position.set(0, 0, spec.zoff || 0);
      fig.holder.rotation.y = spec.ry || 0;
      if (spec.u) {
        spec.u.hero = fig;
        spec.u.heroUnit = true;
        spec.u._walkWin = spec.walkWin || null;
        spec.u._attackWin = spec.attackWin || null;
      } else {
        HEROES.ansar.push(fig);
      }
    });
    HEROES.ready = true;
    applyFrac(clock.frac);
  }).catch(function (e) {
    /* the battle stands without heroes rather than failing: standards still tell it */
    HEROES.err = String((e && e.message) || e);
    console.error('[badr] heroes failed to load', e);
  });

  /* ------------------------------ spoils and the aftermath counts.
     The captives and spoils are on the field; the counts follow BADR-047/048/050. */
  eventStandard(21.5, 9.0, 1, 0, true, aftermathGroup);
  eventStandard(23.8, 10.2, 1, 0, true, aftermathGroup);
  eventStandard(25.6, 8.6, 1, 0, true, aftermathGroup);
  var spoilShieldM = new THREE.MeshLambertMaterial({ color: 0x5a4f3c });
  for (var ss = 0; ss < 6; ss++) {
    var sh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 12), spoilShieldM);
    sh.rotation.x = Math.PI / 2; sh.rotation.z = (ss % 3) * 0.4;
    sh.position.set(21 + ss * 1.1, 0.08, 11.5 + (ss % 2) * 0.9);
    sh.castShadow = true; sh.receiveShadow = true; aftermathGroup.add(sh);
  }
  for (var sp = 0; sp < 8; sp++) {
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 2.2, 5), woodM);
    shaft.rotation.z = Math.PI / 2; shaft.rotation.y = (sp % 4) * 0.28;
    shaft.position.set(21.5 + sp * 0.9, 0.07, 13.4 + (sp % 3) * 0.4);
    shaft.castShadow = true; aftermathGroup.add(shaft);
  }
  for (var sa = 0; sa < 3; sa++) {
    var ar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.42, 0.5), new THREE.MeshLambertMaterial({ color: 0x4a4236 }));
    ar.position.set(23 + sa * 1.2, 0.21, 14.5);
    ar.castShadow = true; ar.receiveShadow = true; aftermathGroup.add(ar);
  }
  var chest = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.5, 0.55), new THREE.MeshLambertMaterial({ color: 0x6b5236 }));
  chest.position.set(26.5, 0.25, 11.5); chest.castShadow = true; chest.receiveShadow = true; aftermathGroup.add(chest);
  camel(23.5, 13.2, 0.6, aftermathGroup); camel(26.5, 12.4, -0.4, aftermathGroup);

  var martyrsMark = new THREE.Group(); martyrsMark.position.set(0, 0, 18);
  var killedMark = new THREE.Group(); killedMark.position.set(-18, 0, -16);
  var captivesMark = new THREE.Group(); captivesMark.position.set(-18, 0, 22);
  var spoilsMark = new THREE.Group(); spoilsMark.position.set(24, 0, 12);
  EVENT_MARKS.push(
    { group: martyrsMark, side: 0, label: 'the 14 martyrs (RA)', k: 'martyrs', labelY: 3.6, event: true, priority: 1, labelAlways: true, ph: [5, 6] },
    { group: killedMark, side: 1, label: '70 Quraysh killed', k: 'killed', labelY: 4.2, event: true, priority: 1, labelAlways: true, ph: [5, 6] },
    { group: captivesMark, side: 0, label: '70 captives', k: 'captives', labelY: 3.6, event: true, priority: 1, labelAlways: true, ph: [5, 6] },
    { group: spoilsMark, side: 0, label: 'the spoils', k: 'spoils', labelY: 3.6, event: true, priority: 1, labelAlways: true, ph: [5, 6] }
  );

  /* ------------------------------ the Abu Jahl action vignette.
     Faceless, stylised figures on a low sand plinth in the gap between the Quraysh
     centre and left divisions: ʿAbdur-Rahman points the two Ansari youths to Abu Jahl,
     Ikrimah cuts Muʿadh's arm, Muʿadh steps on it and fights on one-armed,
     Muʿawwidh is martyred, and Abu Jahl is struck down. */
  var skinM = new THREE.MeshLambertMaterial({ color: 0x9a7a5c });
  var leatherM = new THREE.MeshLambertMaterial({ color: 0x4a3a28 });
  var steelM = new THREE.MeshLambertMaterial({ color: 0xb9b4a6 });
  var woundM = new THREE.MeshLambertMaterial({ color: 0x5e2b22 });
  var sandalM = new THREE.MeshLambertMaterial({ color: 0xd8c7a4 });

  /* the plinth: a shallow, trampled sand stage, wide enough for the five figures */
  var STAGE = { x: -9.0, z: -0.3, y: 0.07, r: 3.5 };
  var stageGroup = new THREE.Group();
  stageGroup.userData.keep = true;
  scene.add(stageGroup);
  var stage = new THREE.Mesh(new THREE.CylinderGeometry(STAGE.r, STAGE.r + 0.25, STAGE.y, 30),
    new THREE.MeshLambertMaterial({ color: 0xc7b184 }));
  stage.position.set(STAGE.x, STAGE.y / 2, STAGE.z);
  stage.receiveShadow = false;
  stageGroup.add(stage);
  var stageRim = new THREE.Mesh(new THREE.TorusGeometry(STAGE.r + 0.05, 0.035, 5, 30),
    new THREE.MeshLambertMaterial({ color: 0xa8916a }));
  stageRim.rotation.x = Math.PI / 2;
  stageRim.position.set(STAGE.x, STAGE.y + 0.005, STAGE.z);
  stageRim.receiveShadow = false;
  stageGroup.add(stageRim);
  /* dropped kit at the edge of the stage: a shield, two spears, a helmet */
  var dropShield = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.04, 12), new THREE.MeshLambertMaterial({ color: 0x5a4f3c }));
  dropShield.rotation.x = Math.PI / 2; dropShield.rotation.z = 0.4;
  dropShield.position.set(STAGE.x - 2.5, STAGE.y + 0.03, STAGE.z + 2.2);
  dropShield.castShadow = true; stageGroup.add(dropShield);
  for (var dsi = 0; dsi < 2; dsi++) {
    var dShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 2.1, 5), woodM);
    dShaft.rotation.z = Math.PI / 2; dShaft.rotation.y = dsi * 0.7;
    dShaft.position.set(STAGE.x + 1.9 + dsi * 0.5, STAGE.y + 0.04, STAGE.z - 2.1);
    dShaft.castShadow = true; stageGroup.add(dShaft);
  }
  var dropHelm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), steelM);
  dropHelm.position.set(STAGE.x + 2.2, STAGE.y + 0.04, STAGE.z + 1.4);
  dropHelm.castShadow = true; stageGroup.add(dropHelm);

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
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.015, 5, 14), brassM);
    s.add(rim);
    var boss = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), brassM);
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
    if (o.shield) vShield(armL);
    var sc = o.scale || 1;
    g.scale.setScalar(sc);
    g.position.set(o.x, o.y || 0, o.z);
    g.rotation.y = o.ry || 0;
    scene.add(g);
    return { group: g, armR: armR, armL: armL, weaponR: weaponR, weaponL: weaponL, stump: stump, stepLeg: stepLeg, scale: sc, baseY: o.y || 0 };
  }
  /* The named duel figures and the Anṣār trio are rigged heroes (loaded below);
     the plinth vignette keeps its approved faceless action figures. */

  var SC = 1.15;
  var abdur = makeFighter({ x: -10.8, y: STAGE.y, z: 1.8, ry: Math.PI, robe: 0xcfc6b2, robeDark: 0x8a7a60, weapon: 'none', scale: SC });
  var muadh = makeFighter({ x: -10.2, y: STAGE.y, z: -0.8, ry: Math.PI, robe: 0xcfc6b2, robeDark: 0x8a7a60, weapon: 'none', leftWeapon: 'spear', shield: true, scale: SC });
  var muawwidh = makeFighter({ x: -8.6, y: STAGE.y, z: -0.8, ry: Math.PI, robe: 0xcfc6b2, robeDark: 0x8a7a60, weapon: 'spear', scale: SC });
  var abujahl = makeFighter({ x: -8.8, y: STAGE.y, z: -2.2, ry: 0, robe: 0x3a332a, robeDark: 0x241f19, helmet: true, weapon: 'sword', scale: SC });
  var ikrimah = makeFighter({ x: -11.2, y: STAGE.y, z: -1.6, ry: 0, robe: 0x3a332a, robeDark: 0x241f19, helmet: true, weapon: 'sword', scale: SC });
  var VIGNETTE = [abdur, muadh, muawwidh, abujahl, ikrimah];
  VIGNETTE.forEach(function (f) { f.group.userData.dynamicRoot = true; });
  EVENT_MARKS.push(
    { group: abdur.group, side: 0, label: 'ʿAbdur-Raḥmān ibn ʿAwf (RA)', k: 'abdur', labelY: 3.6, event: true, priority: 4, labelAlways: true, ph: [2, 3, 4, 5, 6] },
    { group: muadh.group, side: 0, label: 'Muʿādh (RA)', k: 'muadhFig', labelY: 2.35, event: true, priority: 3, labelAlways: true, ph: [2, 3, 4, 5, 6] },
    { group: muawwidh.group, side: 0, label: 'Muʿawwidh (RA)', k: 'muawwidhFig', labelY: 2.35, event: true, priority: 3, labelAlways: true, ph: [2, 3, 4, 5, 6] },
    { group: abujahl.group, side: 1, label: 'Abū Jahl', k: 'abujahlFig', labelY: 2.35, event: true, priority: 3, labelAlways: true, ph: [2, 3, 4, 5, 6] },
    { group: ikrimah.group, side: 1, label: 'Ikrimah ibn Abi Jahl', k: 'ikrimahFig', labelY: 2.35, event: true, priority: 3, labelAlways: true, ph: [2, 3, 4, 5, 6] }
  );
  var muawwidhMark = null, abujahlMark = null;
  EVENT_MARKS.forEach(function (m) { if (m.k === 'muawwidhFig') muawwidhMark = m; if (m.k === 'abujahlFig') abujahlMark = m; });
  function updateVignette(i, t) {
    var show = i >= 2;
    VIGNETTE.forEach(function (f) { f.group.visible = show; });
    if (!show) return;
    /* the two youths run from the near edge of the plinth into Abu Jahl's guard */
    var run = i < 4 ? 0 : (i === 4 ? easeIO(clamp01(t / 0.32)) : 1);
    var mx = -9.7 - 0.5 * run, mz = 6.2 - 7.0 * run;
    muadh.group.position.set(mx, muadh.baseY, mz);
    muawwidh.group.position.set(mx + 1.6, muawwidh.baseY, mz);
    /* ʿAbdur-Rahman points across the gap, then follows a step */
    var abdurZ = i >= 4 ? 1.8 : 6.6;
    abdur.group.position.set(-10.8, abdur.baseY, abdurZ);
    abdur.group.rotation.y = Math.PI * 0.78;
    abdur.armR.rotation.set(-1.25, 0, -0.45);
    /* the strike: spears come down on Abu Jahl */
    var strike = i === 4 ? clamp01((t - 0.34) / 0.12) : (i > 4 ? 1 : 0);
    muadh.armL.rotation.set(-0.2 - strike * 1.4, 0, 0);
    muawwidh.armR.rotation.set(-0.2 - strike * 1.4, 0, 0);
    muadh.group.rotation.x = -0.1 * strike;
    /* the step: Muʿadh plants his foot on the severed arm and tears it free */
    var step = (i > 4 || (i === 4 && t > 0.72)) ? 1 : (i === 4 ? clamp01((t - 0.62) / 0.10) : 0);
    /* Ikrimah's cut: the arm hangs, then drops; the stump is exposed */
    var cut = (i > 4 || (i === 4 && t > 0.60)) ? 1 : (i === 4 ? clamp01((t - 0.52) / 0.08) : 0);
    if (cut > 0) {
      muadh.stump.visible = true;
      muadh.armR.position.set(0.2, 0.12 + (1 - cut) * 0.9, 0.22 - 0.06 * step);
      muadh.armR.scale.setScalar(0.85 + 0.15 * (1 - cut));
      muadh.armR.rotation.set(Math.PI / 2 * cut, 0, 0.3);
    }
    muadh.stepLeg.visible = step > 0;
    muadh.stepLeg.rotation.x = -0.62 * step;
    /* the one-armed fight: the left arm keeps the spear working */
    if (i > 4 || (i === 4 && t > 0.72)) {
      var thrust = 0.5 + 0.5 * Math.sin(t * Math.PI * 4);
      muadh.armL.rotation.set(-0.45 - 0.35 * thrust, 0, 0);
    }
    /* Muʿawwidh is struck down; Abu Jahl follows in the rout */
    var mfall = (i > 4 || (i === 4 && t > 0.88)) ? 1 : (i === 4 ? clamp01((t - 0.78) / 0.10) : 0);
    if (muawwidhMark) muawwidhMark.labelY = 2.35 - 1.55 * mfall;
    muawwidh.group.rotation.x = -0.1 * strike - 1.45 * mfall;
    muawwidh.group.position.y = muawwidh.baseY - 0.1 * mfall;
    var jfall = (i > 5 || (i === 5 && t > 0.10)) ? 1 : (i === 5 ? clamp01((t - 0.10) / 0.08) : 0);
    if (abujahlMark) abujahlMark.labelY = 2.35 - 1.55 * jfall;
    abujahl.group.rotation.x = -0.12 * strike - 1.45 * jfall;
    abujahl.group.position.y = abujahl.baseY - 0.1 * jfall;
    /* the horse's rider leans into the cut */
    ikrimah.armR.rotation.set(-0.3 - cut * 0.95, 0, 0.2);
    ikrimah.group.position.y = ikrimah.baseY;
  }

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
    var bodyC = new THREE.Color(side ? 0x5f5544 : 0xcfc6b2);
    var legC = new THREE.Color(side ? 0x4a4135 : 0xa89a80);
    var headC = new THREE.Color(side ? 0x463d32 : 0xbfb49d);
    var beltC = new THREE.Color(side ? 0x3a3126 : 0x8a7a60);
    var clothC = new THREE.Color(side ? 0x6b5f4c : 0xd8cfba);
    var ironC = (side ? ironQ : ironM).color;
    var woodC = new THREE.Color(0x6b5c42);
    /* upper body only: the legs are their own instances so the march has a gait */
    var manGeo = mergeParts([
      { geo: bodyGeo, p: [0, 0.86, 0], c: bodyC },
      { geo: skirtGeo, p: [0, 0.62, 0], c: bodyC },
      { geo: beltGeo, p: [0, 0.79, 0], c: beltC },
      { geo: headGeo, p: [0, 1.34, 0], c: headC },
      side
        ? { geo: helmGeo, p: [0, 1.38, 0], c: ironC }
        : { geo: turbanGeo, p: [0, 1.42, 0], c: clothC },
      { geo: armGeo, p: [-0.18, 0.9, 0.02], r: [0, 0, 0.22], c: bodyC },
      { geo: armGeo, p: [0.18, 0.9, 0.02], r: [0, 0, -0.22], c: bodyC }
    ]);
    var men = new THREE.InstancedMesh(manGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), count);
    men.castShadow = true;
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
    legsL.castShadow = true; legsR.castShadow = true;
    /* the spear is its own instance so the whole hedge can level and thrust */
    var spearGeo = mergeParts([
      { geo: shaftGeo, p: [0, -0.05, 0], c: woodC },
      { geo: tipGeo, p: [0, -0.05 + h / 2 + 0.1, 0], c: ironC },
      { geo: buttGeo, p: [0, -0.05 - h / 2 - 0.04, 0], r: [Math.PI, 0, 0], c: ironC }
    ]);
    var spears = new THREE.InstancedMesh(spearGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), count);
    spears.castShadow = true;
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
    MASS.push({ men: men, legsL: legsL, legsR: legsR, spears: spears, shields: shields, rims: rims, swords: swords, guards: guards, helms: helms, shieldsPer: shieldsPer, sq: sq, recs: recs, blocks: blocks, h: h, side: side });
  }
  buildMass(0, 313, 9, 2.2, 1.9, 12.2, 1.9);
  buildMass(1, 1000, 21, 2.0, 1.9, -14.2, 2.15);

  /* the seventy captives, unarmed, on the Muslim side (BADR-048/050) */
  function buildCaptives(count, x0, z0, cols, dx, dz) {
    var bodyGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.62, 6);
    var skirtGeo = new THREE.CylinderGeometry(0.2, 0.26, 0.3, 6);
    var headGeo = new THREE.SphereGeometry(0.13, 6, 5);
    var legGeo = new THREE.CylinderGeometry(0.055, 0.07, 0.55, 5);
    var footGeo = new THREE.BoxGeometry(0.11, 0.06, 0.2);
    var armGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.5, 5);
    var headC = new THREE.Color(0x554838);
    var robeC = new THREE.Color(0x6a5a45);
    var darkC = new THREE.Color(0x4a4135);
    var geo = mergeParts([
      { geo: bodyGeo, p: [0, 0.86, 0], c: robeC },
      { geo: skirtGeo, p: [0, 0.62, 0], c: robeC },
      { geo: headGeo, p: [0, 1.34, 0], c: headC },
      { geo: legGeo, p: [-0.08, 0.28, 0], c: darkC },
      { geo: legGeo, p: [0.08, 0.28, 0], c: darkC },
      { geo: footGeo, p: [-0.08, 0.03, 0.04], c: darkC },
      { geo: footGeo, p: [0.08, 0.03, 0.04], c: darkC },
      { geo: armGeo, p: [-0.18, 0.9, 0.02], r: [0, 0, 0.22], c: robeC },
      { geo: armGeo, p: [0.18, 0.9, 0.02], r: [0, 0, -0.22], c: robeC }
    ]);
    var mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }), count);
    mesh.castShadow = true;
    var m = new THREE.Matrix4();
    for (var i = 0; i < count; i++) {
      var r = Math.floor(i / cols), c = i % cols;
      m.makeTranslation(x0 + c * dx + (Math.random() - 0.5) * 0.12, 0, z0 + r * dz + (Math.random() - 0.5) * 0.12);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    aftermathGroup.add(mesh);
  }
  buildCaptives(70, -22, 18, 7, 1.05, 1.05);

  /* hot-loop matrix writer: M = T · Rx(ax) · Ry(ry) · S(1, hs, 1), straight
     into the instance array — no euler/quaternion compose per man */
  function writeTRxRyS(arr, o, tx, ty, tz, ax, cy, sy, hs) {
    var sa = Math.sin(ax), ca = Math.cos(ax);
    arr[o] = cy; arr[o + 1] = sa * sy; arr[o + 2] = -ca * sy; arr[o + 3] = 0;
    arr[o + 4] = 0; arr[o + 5] = ca * hs; arr[o + 6] = sa * hs; arr[o + 7] = 0;
    arr[o + 8] = sy; arr[o + 9] = -sa * cy; arr[o + 10] = ca * cy; arr[o + 11] = 0;
    arr[o + 12] = tx; arr[o + 13] = ty; arr[o + 14] = tz; arr[o + 15] = 1;
  }
  function updateMass() {
    var dm = new THREE.Object3D();
    var ph = curPhaseIdx, pt = curPhaseT;
    var fight = ph === 3 ? 1 : ph === 4 ? 0.75 : ph === 2 ? 0.35 : ph === 5 ? 0.25 : 0;
    var disp = ph === 2 ? 1 : ph === 3 ? 0.7 : ph === 4 ? 0.3 : ph === 5 ? 0.55 : 0;
    var marching = ph === 2 || ph === 5;
    var now = performance.now() / 1000;
    /* gait clock runs on the battle timeline: seek-safe, and the march keeps
       step with playback speed */
    var gaitHz = ph === 5 ? 2.3 : 1.85;
    var gaitPh = (clock ? clock.frac : 0) * TOTAL * gaitHz * 6.283;
    var gaitAmp = marching ? (ph === 5 ? 0.62 : 0.5) : (fight > 0 ? 0.1 : 0.045);
    for (var m = 0; m < MASS.length; m++) {
      var M = MASS[m];
      var dir = M.side ? 1 : -1;
      var anchors = [];
      for (var s = 0; s < M.sq.length; s++) {
        var S = M.sq[s], u = M.blocks[S.block];
        anchors.push([u.group.position.x + S.lx + (S.hsh - 0.5) * 1.0 * disp, u.group.position.z + S.lz + (S.hsh - 0.5) * 0.6 * disp]);
      }
      var helmN = 0;
      var menArr = M.men.instanceMatrix.array;
      var legLArr = M.legsL.instanceMatrix.array;
      var legRArr = M.legsR.instanceMatrix.array;
      var spArr = M.spears.instanceMatrix.array;
      for (var i = 0; i < M.recs.length; i++) {
        var rec = M.recs[i], a = anchors[rec.s];
        var px = a[0] + rec.ox * (1 + 0.45 * disp) + Math.sin(rec.fp * 2.7 + now * 0.35) * 0.1 * disp;
        var pz = a[1] + rec.oz + Math.sin(rec.fp * 1.9 + now * 0.3) * 0.14 * disp;
        var thrust = fight * (0.5 + 0.5 * Math.sin(now * 8 + rec.fp));
        var lunge = fight * 0.14 * thrust * dir;
        /* the hit ripple: a stagger wave travelling back through the ranks */
        var ripple = fight * Math.sin(now * 9 - rec.row * 1.05);
        var lean = fight * 0.1 * thrust * dir + ripple * 0.06;
        var gait = Math.sin(gaitPh + rec.fp);
        var bob = marching * Math.abs(Math.cos(gaitPh + rec.fp)) * 0.05 * (gaitAmp / 0.5)
          + fight * Math.abs(Math.sin(now * 6 + rec.fp)) * 0.045;
        /* direct matrix writes: M = T · Rx(a) · Ry(ry) · S(1,hs,1) — no euler
           or quaternion compose in the hot loop */
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
      var si = 0;
      for (var s2 = 0; s2 < M.sq.length; s2++) {
        var a2 = anchors[s2];
        var sqv = M.sq[s2], sv = 0.9 + sqv.hsh * 0.18;
        for (var k = 0; k < M.shieldsPer; k++) {
          var off = (k - (M.shieldsPer - 1) / 2) * 0.62;
          var face = M.side ? 0.58 : -0.58;
          var shieldLift = fight * (0.06 + 0.06 * Math.sin(now * 6 + sqv.hsh * 6));
          dm.position.set(a2[0] + off, 0.62 * sv + shieldLift, a2[1] + face);
          dm.rotation.set(Math.PI / 2 - 0.08 - fight * 0.12, 0.03, 0);
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
    { w: [9.2, 2.6, 3.8], t: 'wells of Badr', e: 'BADR-019', k: 'wells', cls: 'is-tap' },
    { w: [-7.5, 2.6, 21.1], t: 'the ʻarish · the Prophet’s station (PBUH)', e: 'BADR-020', k: 'arish', cls: 'is-tap' },
    { w: [36, 2.6, 8], t: 'al-Qalib · the 24 leaders thrown into the well', e: 'BADR-049', k: 'well24', cls: 'is-tap is-event', ph: [6] },
    { w: [0, 8.4, 1], t: 'the angels · 8:9', e: 'BADR-031', k: 'angels', cls: 'is-land-name is-event', ph: [3, 4], tRange: [0.12, 0.9] }
  ];
  var LANDL = LAND.map(function (l) {
    var el = mkLabel(l.t, l.cls);
    return { el: el, v: new THREE.Vector3(l.w[0], l.w[1], l.w[2]), k: l.k, ph: l.ph, tRange: l.tRange };
  });
  var ULABS = [jabal].concat(champs, [musab], EVENT_MARKS).map(function (u) {
    var el = mkLabel(u.label, (u.side ? '' : 'is-side') + (u.event ? ' is-event' : ''));
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
      well24: 'al-Qalib · the 24 leaders thrown into the well', katheeb: 'Katheeb al-Hannan (a modern name)',
      bilal: 'Bilāl (RA)', umayyah: 'ʻUmayyah ibn Khalaf', ansarTrio: 'the Anṣār trio (RA)', angels: 'the angels · 8:9',
      qurayshRefuse: 'the Quraysh refuse', martyrs: 'the 14 martyrs (RA)', killed: '70 Quraysh killed',
      captives: '70 captives', spoils: 'the spoils',
      abdur: 'ʿAbdur-Raḥmān ibn ʿAwf (RA)', muadhFig: 'Muʿādh (RA)', muawwidhFig: 'Muʿawwidh (RA)',
      abujahlFig: 'Abū Jahl', ikrimahFig: 'Ikrimah ibn Abi Jahl'
    },
    ur: {
      hamzah: 'حمزہ رضی اللہ عنہ', ali: 'علی رضی اللہ عنہ', ubaydah: 'عبیدہ رضی اللہ عنہ',
      shaybah: 'شیبہ', walid: 'ولید', utbah: 'عتبہ',
      musab: 'مصعب کا سفید پرچم رضی اللہ عنہ', command: 'ابو جہل کا پرچم',
      near: 'العدوۃ الدنیا · قریب کا کنارہ', far: 'القصوی · دور کا کنارہ',
      basin: 'حوض', wells: 'بدر کے کنویں', arish: 'عرش · مقامِ نبوی ﷺ',
      well24: 'القليب · ۲۴ سردار کنویں میں ڈالے گئے', katheeb: 'کتیبة الحنان (جدید نام)',
      bilal: 'بلال رضی اللہ عنہ', umayyah: 'امیہ بن خلف', ansarTrio: 'تین انصاری (رضی اللہ عنہم)', angels: 'فرشتے · ۸:۹',
      qurayshRefuse: 'قریش نے انکار کیا', martyrs: '۱۴ شہید (رضی اللہ عنہم)', killed: '۷۰ قریشی مارے گئے',
      captives: '۷۰ قیدی', spoils: 'مالِ غنیمت',
      abdur: 'عبدالرحمٰن بن عوف رضی اللہ عنہ', muadhFig: 'معاذ رضی اللہ عنہ', muawwidhFig: 'معوذ رضی اللہ عنہ',
      abujahlFig: 'ابو جہل', ikrimahFig: 'عکرمہ بن ابی جہل'
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
    /* the named vignette figures: merge the body, keep arms/stump separate */
    VIGNETTE.forEach(function (f) {
      f.armR.userData.keep = true;
      f.armL.userData.keep = true;
      f.stump.userData.keep = true;
      f.stepLeg.userData.keep = true;
      f.group.updateMatrixWorld(true);
      mergeMeshList(collectMergeable(f.group), f.group, true);
      f.group.userData.dynamicRoot = true;
    });

    /* banners ride on moving unit blocks: merge each block's rigid parts locally */
    champs.concat(mBands, qBands).forEach(function (b) {
      var bg = b.group || b;
      bg.updateMatrixWorld(true);
      mergeMeshList(collectMergeable(bg), bg, true);
      bg.userData.dynamicRoot = true;
      bg.userData.banners = bg.children.filter(function (c) { return c.isMesh; });
    });
    ANSAR_MARKS.forEach(function (bg) {
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
  mergeMeshList(collectMergeable(aftermathGroup), aftermathGroup, true);
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
    dustP[i * 3] = -6 + Math.random() * 18;
    dustP[i * 3 + 1] = 0.15 + Math.random() * 2.6;
    dustP[i * 3 + 2] = -9 + Math.random() * 12;
    dustB[i * 3] = dustP[i * 3];
    dustB[i * 3 + 1] = dustP[i * 3 + 1];
    dustB[i * 3 + 2] = dustP[i * 3 + 2];
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustP, 3));
  var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xd0bd99, size: 2.6, map: softDot(), transparent: true, opacity: 0, depthWrite: false }));
  scene.add(dust);

  /* the angels' help: a gold shimmer, never a figure (Qur'an 8:9; BADR-031/032) */
  var AN = MOBILE ? 110 : 220;
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
    color: 0xffe2a8, size: 1.1, map: softDot(), transparent: true, opacity: 0,
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
  /* the shot list: per-phase shots with motivated cuts, holds and impact frames
     instead of one continuous ease. Within a shot the camera dollies subtly;
     between shots it cuts. */
  var SHOTS = {
    ground: [
      { t0: 0, t1: 0.55, p0: [0, 36, 56], p1: [3, 31, 48], l0: [0, 0, -2], l1: [0, 1.2, -2] },
      { t0: 0.55, t1: 1.001, p0: [-30, 13, 36], p1: [-22, 10.5, 30], l0: [2, 1.4, 0], l1: [2, 1.2, -2] }
    ],
    duel: [
      { t0: 0, t1: 0.30, p0: [-32, 9, -3], p1: [-26, 8, -2], l0: [0, 1.6, 0.6], l1: [0, 1.6, 0.6] },
      { t0: 0.30, t1: 0.62, p0: [7.5, 3.6, 9.5], p1: [6.4, 3.1, 7.4], l0: [0, 1.4, 0.5], l1: [0, 1.4, -0.5] },
      { t0: 0.62, t1: 1.001, p0: [4.8, 2.7, 6.2], p1: [4.3, 2.5, 5.4], l0: [0, 1.4, -0.4], l1: [0, 1.3, -0.6] }
    ],
    advance: [
      { t0: 0, t1: 0.5, p0: [7, 17, 31], p1: [2, 13, 24], l0: [0, 1, -4], l1: [0, 1, -8] },
      { t0: 0.5, t1: 1.001, p0: [-9, 3.4, -25], p1: [-5, 3.0, -21], l0: [0, 1.5, 5], l1: [0, 1.3, 3] }
    ],
    clash: [
      { t0: 0, t1: 0.45, p0: [26, 9.5, 18], p1: [17, 7.5, 13], l0: [5, 1.2, 0], l1: [0, 1.0, -3] },
      { t0: 0.45, t1: 1.001, p0: [29, 18, 19], p1: [21, 15, 13], l0: [-4, 0.8, -4], l1: [-8, 0.8, -8] }
    ],
    turn: [
      { t0: 0, t1: 0.4, p0: [-8.6, 5.0, 8.6], p1: [-9.0, 4.4, 7.4], l0: [-9.4, 1.0, -0.4], l1: [-9.4, 1.0, -0.6] },
      { t0: 0.4, t1: 0.75, p0: [-11.6, 3.3, 5.4], p1: [-11.2, 3.0, 4.8], l0: [-9.0, 0.95, -1.2], l1: [-9.0, 0.9, -1.4] },
      { t0: 0.75, t1: 1.001, p0: [-11.8, 3.6, 3.4], p1: [-11.6, 3.4, 3.2], l0: [-9.0, 0.7, -1.6], l1: [-9.0, 0.7, -1.6] }
    ],
    rout: [
      { t0: 0, t1: 0.35, p0: [-9.8, 2.6, 1.0], p1: [-9.8, 2.6, 1.0], l0: [-9.2, 0.7, -2.6], l1: [-9.2, 0.7, -2.6] },
      { t0: 0.35, t1: 0.7, p0: [-9.8, 4.5, 5], p1: [-2, 17, 24], l0: [-9.2, 0.7, -2.6], l1: [-20, 0.5, -24] },
      { t0: 0.7, t1: 1.001, p0: [6, 27, 27], p1: [1, 31, 31], l0: [-24, 0.5, -28], l1: [-26, 0.5, -28] }
    ],
    quiet: [
      { t0: 0, t1: 0.45, p0: [0, 40, 80], p1: [4, 35, 70], l0: [0, 0, 8], l1: [0, 0, 6] },
      { t0: 0.45, t1: 1.001, p0: [45, 7.5, 19], p1: [41, 5.8, 16], l0: [36, 1.2, 8], l1: [36, 1.0, 8] }
    ]
  };
  /* impact frames: a short camera knock at the duel kills, the first clash,
     the strike in the sand, and Abu Jahl's fall */
  var IMPACTS = [
    { ph: 1, t: 0.72, amp: 0.045 }, { ph: 1, t: 0.86, amp: 0.04 }, { ph: 1, t: 0.93, amp: 0.045 },
    { ph: 3, t: 0.02, amp: 0.035 }, { ph: 4, t: 0.52, amp: 0.04 }, { ph: 5, t: 0.09, amp: 0.05 }
  ];
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
  var PRESETS = {
    ground:  { p: [0, 30, 44], l: [0, 1.4, 0] },
    aerial:  { p: [0, 80, 16], l: [0, 0, 6] },
    duel:    { p: [10, 4.6, 8], l: [0, 1, 0] },
    line:    { p: [24, 5, 18], l: [0, 0.6, 8] },
    far:     { p: [-26, 6, -16], l: [-4, 0.5, -8] },
    wells:   { p: [6, 5, 9], l: [9.2, 0.6, 3.8] },
    command: { p: [-20, 5.6, 3.5], l: [-9.0, 1.1, -0.6] }
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
      var fallen = 0, deathT = 0, deathStart = 0;
      if (fPhase >= 0) {
        fallen = fPhase < i ? 1 : clamp01((t - u.plan[fPhase].fallAt) / 0.14);
        deathT = fPhase < i ? 999 : (t - u.plan[fPhase].fallAt) * PHASES[fPhase].dur;
        deathStart = fracOf(fPhase, u.plan[fPhase].fallAt) * TOTAL;
      }
      if (u._wound && (i > u._wound.i || (i === u._wound.i && t >= u._wound.at))) {
        p.tilt = Math.max(p.tilt, u._wound.tilt);
      }
      applyPose(u, p, fallen);
      if (u.hero) driveHeroUnit(u, i, t, frac * TOTAL, fallen, deathT, deathStart);
    }

    updateVignette(i, t);

    /* the Ansari trio steps out, is refused, and withdraws before the champions engage */
    var ansarZ = 10.5;
    if (i === 1) {
      var ansarAdv = clamp01((t - 0.04) / 0.16);
      var ansarBack = clamp01((t - 0.30) / 0.14);
      ansarZ = 10.5 - 6.0 * ansarAdv + 6.0 * ansarBack;
    }
    ANSAR_MARKS.forEach(function (m) { m.position.z = ansarZ; });
    /* the rigged Anṣār walk out, stand while the refusal holds, walk back */
    if (HEROES.ready) {
      var ansarWant = 'neutral', ansarFade = 0;
      if (i === 1 && t >= 0.04 && t <= 0.20) { ansarWant = 'walk'; ansarFade = fracOf(1, 0.04) * TOTAL; }
      else if (i === 1 && t >= 0.30 && t <= 0.44) { ansarWant = 'walk'; ansarFade = fracOf(1, 0.30) * TOTAL; }
      else if (i === 1 && t > 0.20 && t <= 0.30) ansarFade = fracOf(1, 0.20) * TOTAL;
      else if (i === 1 && t > 0.44) ansarFade = fracOf(1, 0.44) * TOTAL;
      for (var ah = 0; ah < HEROES.ansar.length; ah++) heroDrive(HEROES.ansar[ah], ansarWant, frac * TOTAL, 0, null, ansarFade);
    }

    /* Bilal's chase of Umayyah belongs to the rout: the standards wait off-stage */
    bilalMark.visible = i >= 5;
    umayyahMark.visible = i >= 5;
    ANSAR_MARKS.forEach(function (m) { m.visible = i === 1; });

    /* the plinth belongs to the command/rout, not the duel/advance foreground */
    stageGroup.visible = i >= 4;

    /* the aftermath (graves, dead, captives, spoils, the pit) belongs to the rout and reckoning */
    aftermathGroup.visible = i >= 5;

    /* arrows: late advance into clash; in-flight arrows keep flying after the window closes */
    var arrowWindow = (i === 2 && t > 0.35) || (i === 3 && t < 0.9);
    if (arrowWindow && !reduce) spawnArrows(clock.dt || 0);
    updateArrows(clock.dt || 0);
    arrows.forEach(function (ar) { ar.m.visible = ar.live; });

    /* the sand: from ʻUtbah-side cast of the Prophet (PBUH) toward the Quraysh */
    var dustAmt = (i === 4) ? Math.sin(clamp01(t) * Math.PI) : (i === 5 && t < 0.35 ? (1 - t / 0.35) * 0.5 : 0);
    dust.material.opacity = dustAmt * 0.3;
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
    angels.material.opacity = angelAmt * 0.5;
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
    if (u.heroUnit) {
      /* the standard topples; the rigged figure falls through its own death clip */
      g.rotation.x = 0;
      g.position.y = -0.02 * fr;
      var bm = g.userData.banners;
      if (bm) for (var bi = 0; bi < bm.length; bi++) bm[bi].rotation.x = -1.42 * fr;
      if (u.hero) {
        var wound = u._wound && (curPhaseIdx > u._wound.i || (curPhaseIdx === u._wound.i && curPhaseT >= u._wound.at)) ? 1 : 0;
        u.hero.holder.rotation.x = 0.4 * wound; /* ʻUbaydah's hunched stagger */
      }
    } else {
      g.rotation.x = -1.42 * fr; /* a fallen standard lies flat */
      g.position.y = -0.1 * fr;
      if (!fr && u === chU) g.rotation.x = 0.55 * p.tilt; /* the wounded ʻUbaydah's grievous kneel */
    }
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
  var lastShotKey = '';
  function applyCamera(i, t, snap) {
    if (camState.mode === 'orbit') return; /* orbit handled below */
    if (camState.mode === 'preset') {
      lerpCam(camState.preset, snap ? 1 : (reduce ? 0.22 : 0.09));
      return;
    }
    var shots = SHOTS[PHASES[i].id];
    var kShot = shots.length - 1;
    for (var k = 0; k < shots.length; k++) {
      if (t >= shots[k].t0 && t < shots[k].t1) { kShot = k; break; }
    }
    var shot = shots[kShot];
    var u = clamp01((t - shot.t0) / (shot.t1 - shot.t0));
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
    tgt.p[0] += sh.x; tgt.p[1] += sh.y;
    /* portrait phones see a narrow horizontal slice: back the camera off and
       lift it so all three Quraysh divisions stay in frame. The duel and the
       sand beat are the exceptions: close lanes that fit the portrait slice. */
    if (camera.aspect < 1) {
      if (PHASES[i].id === 'duel') {
        tgt = { p: [0, 10, 20], l: [0, 1.5, 2] };
      } else if (PHASES[i].id === 'turn') {
        /* the compact plinth fits the portrait slice; keep the shot path */
      } else {
        var k2 = Math.min(2.1, Math.pow(1 / camera.aspect, 0.9));
        tgt.p = [
          tgt.l[0] + (tgt.p[0] - tgt.l[0]) * k2,
          tgt.l[1] + (tgt.p[1] - tgt.l[1]) * k2 * 1.12,
          tgt.l[2] + (tgt.p[2] - tgt.l[2]) * k2
        ];
      }
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
        var lY = isUnit ? (it.u.labelY !== undefined ? it.u.labelY : (it.u.isChampion ? 3.9 : 4.0)) : 0;
        if (MOBILE && isUnit && (it.u.k === 'abujahlFig' || it.u.k === 'ikrimahFig')) lY -= 0.8;
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
        var vis = v.z > -1 && v.z < 1 && sy > 56 && sy < h - 170;
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
    setCam: function (p, l) {
      camState.mode = 'preset';
      camState.preset = { p: p, l: l };
      applyCamera(curPhaseIdx, curPhaseT, true);
    },
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
        var hero = null;
        if (u.hero) {
          u.hero.holder.updateMatrixWorld(true);
          var hb = new THREE.Box3().setFromObject(u.hero.root);
          hero = {
            clip: u.hero.cur, from: u.hero.from, ready: HEROES.ready,
            pos: u.hero.holder.getWorldPosition(new THREE.Vector3()).toArray().map(function (v) { return +v.toFixed(2); }),
            headY: (function () {
              var hd = u.hero.root.getObjectByName('Head');
              return hd ? +hd.getWorldPosition(new THREE.Vector3()).y.toFixed(2) : null;
            })(),
            h: +(hb.max.y - hb.min.y).toFixed(2), minY: +hb.min.y.toFixed(2)
          };
        }
        return { label: u.label, pos: u.group.position.toArray().map(function (v) { return +v.toFixed(2); }), meshes: n, types: types, hero: hero };
      });
    },
    heroInfo: function () {
      return { ready: HEROES.ready, count: HEROES.count, err: HEROES.err || null, ansar: HEROES.ansar.map(function (f) { return f.cur; }) };
    },
    camInfo: function () { return { fov: camera.fov, aspect: +camera.aspect.toFixed(3), p: camera.position.toArray().map(function (n) { return +n.toFixed(1); }), l: curCam.l.toArray().map(function (n) { return +n.toFixed(1); }), mode: camState.mode }; },
  };
})();
