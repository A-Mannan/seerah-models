/* Badr · the battle in 3D — the Badr scene module.
   Layout, formations, choreography, the Abu Jahl vignette, ledger-graded copy
   and the public BATTLE clock API, all built on the shared ENGINE (engine.js):
   renderer, dawn sky, heightfield, props, merge, crowd, rigged heroes, labels,
   director (clock + shot list + orbit) and particles.
   Vocabulary: ground, valley, wells, basin, the ʻarish, banner-bands, rigged
   faceless champions. The Prophet ﷺ is never depicted; no face is ever shown. */
(function () {
  'use strict';
  var U = ENGINE.util;
  var easeIO = U.easeIO, clamp01 = U.clamp01, hash2 = U.hash2, smoothN = U.smoothN, fbm = ENGINE.fbm;
  var ctx = ENGINE.boot({
    failText: 'The 3D battle needs WebGL. The graded ledger in data/badr.json carries every fact; nothing is hidden behind the model.',
    grade: false, linearFog: true, fogColor: 0x8a7355
  });
  if (!ctx) return;
  var canvas = ctx.canvas, labelBox = ctx.labelBox, reduce = ctx.reduce, MOBILE = ctx.MOBILE;
  var renderer = ctx.renderer, scene = ctx.scene, camera = ctx.camera;

  /* ------------------------------ night-to-dawn sky and lights (build q) */
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
  for (var st2 = 0; st2 < 520; st2++) {
    var r1 = Math.random() * Math.PI * 2;
    var r2 = Math.random() * Math.PI * 0.42 + 0.16;
    starPos[st2 * 3] = Math.cos(r1) * Math.sin(r2) * 560;
    starPos[st2 * 3 + 1] = Math.cos(r2) * 520 + 40;
    starPos[st2 * 3 + 2] = Math.sin(r1) * Math.sin(r2) * 560;
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

  var hemi = new THREE.HemisphereLight(0x8fa0b8, 0x3a2f22, 0.44);
  scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xffc27d, 0.9);
  sun.position.set(64, 34, -46);
  sun.castShadow = true;
  sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
  sun.shadow.camera.left = -72; sun.shadow.camera.right = 72;
  sun.shadow.camera.top = 72; sun.shadow.camera.bottom = -72;
  sun.shadow.camera.near = 5; sun.shadow.camera.far = 240;
  sun.shadow.bias = -0.0006;
  scene.add(sun); scene.add(sun.target);
  var fill = new THREE.DirectionalLight(0x7d8ea8, 0.2);
  fill.position.set(-40, 30, 40);
  scene.add(fill);
  var rim = new THREE.DirectionalLight(0xffd9b0, 0.3);
  rim.position.set(10, 14, 60);
  scene.add(rim);
  /* the lamp at the ʻarish and a glow at the wells */
  var brassLight = new THREE.PointLight(0xffb54d, 0.5, 14, 2);
  brassLight.position.set(-7.5, 2.6, 20.5);
  scene.add(brassLight);
  var wellLight = new THREE.PointLight(0xffb54d, 0.3, 11, 2);
  wellLight.position.set(-5.8, 1.8, 2.6);
  scene.add(wellLight);

  /* ------------------------------ terrain: a sculpted valley around a flat
     battle corridor. The wells, both lines, both camps, the plinth and
     al-Qalib all sit on flat sand; dune fields rise beyond the corridor and
     the valley walls lift toward the horizon. */
  function heightAt(x, z) {
    var out = Math.max(
      smoothN(Math.abs(x), 44, 62),
      smoothN(z, 28, 46),
      smoothN(-z, 36, 54)
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
  /* build q's sand: a painted canvas texture with bump, vertex-coloured bright */
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
  var groundMat = new THREE.MeshPhongMaterial({ vertexColors: true, map: sandTex, bumpMap: sandTex, bumpScale: 0.12, shininess: 0 });
  ENGINE.heightfield(ctx, heightAt, {
    material: groundMat,
    sand: new THREE.Color(0xd3bf9b), crest: new THREE.Color(0xe0cda8),
    trough: new THREE.Color(0xb3a284), grit: new THREE.Color(0xc4b393)
  });

  /* distant ridges: the valley closes against the horizon */
  var props = ENGINE.props(ctx, heightAt);
  [[-96, -122, 62, 9], [86, -138, 56, 11], [148, -58, 42, 7], [-150, -40, 46, 8], [-240, -180, 90, 16], [210, -200, 84, 18]].forEach(function (r) {
    props.ridge(r[0], r[1], r[2], r[3]);
  });
  props.pebbleField(260, -34, -26, 68, 56);

  /* ------------------------------ landmarks */
  var stoneM = props.mats.stoneM, stoneDark = props.mats.stoneDark, waterM = props.mats.waterM, woodM = props.mats.woodM;
  [[8.0, 3.2], [9.5, 4.2], [10.8, 3.4]].forEach(function (w, wi) { props.well(w[0], w[1], wi === 0); });
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
  var ridgePole = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 0.16), woodM);
  ridgePole.position.set(0, 2.56, 0); ridgePole.castShadow = true; arish.add(ridgePole);
  var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffc766, emissive: 0xffa93c, emissiveIntensity: 0.9 }));
  lamp.position.set(0.5, 2.0, 1.15);
  arish.add(lamp);
  arish.position.set(-7.5, 0, 20.5);
  scene.add(arish);

  var aftermathGroup = new THREE.Group();
  aftermathGroup.userData.keep = true;
  aftermathGroup.visible = false;
  scene.add(aftermathGroup);

  var well24 = props.well(36, 8, true);
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

  /* ------------------------------ set dressing */
  [[-26, 6, 1.3], [-23, -9, 0.8], [18, 9, 1.1], [24, 2.6, 0.7], [-16, -22, 1.4], [10, -19, 0.9], [33, -14, 1.6], [-34, 16, 1.8], [40, 12, 1.2], [6, 26, 0.9], [-9, 30, 1.1], [30, -30, 2.2], [-13, 23, 1.5], [12, 24, 1.3], [-19, 26, 1.7]].forEach(function (r) { props.rock(r[0], r[1], r[2]); });
  props.scrubField(240, 0);
  props.palm(-16.4, 14.6, 3.6, 0.8); props.palm(-19.2, 10.8, 3.0, 0.5); props.palm(-14.6, 9.2, 2.6, 0.9);
  props.palm(26.8, -6.8, 3.2, 0.6); props.palm(23.4, -3.4, 2.7, 0.7);
  /* the grove at the wells */
  props.palm(-16.0, 5.2, 3.3, 0.7, true); props.palm(-15.2, 8.2, 2.4, 0.9, true);
  props.reeds(-6.6, 0.4, 26);

  /* camps on the banks (BADR-018: both armies camped on their bank through the rain-night) */
  [-22, -18].forEach(function (x) { props.ridgeTent(x, 18.5, false, 3.8, 4.8, 1.4); });
  [18, 22].forEach(function (x) { props.ridgeTent(x, 18.5, false, 3.8, 4.8, 1.4); });
  /* Quraysh: ten tents in the front row and five behind, scaled to the army */
  [-23, -18, -13, -8, -3, 2, 7, 12, 17, 22].forEach(function (x) { props.ridgeTent(x, -26.5, true, 3.4, 4.2, 1.25); });
  [-19, -9, 1, 11, 21].forEach(function (x) { props.ridgeTent(x, -31.6, true, 3.4, 4.2, 1.25); });
  props.campClutter(-19, 17.2); props.campClutter(20.6, 17.4);
  props.campClutter(-21.5, -25.2); props.campClutter(-6.5, -25.4); props.campClutter(9.5, -25.2); props.campClutter(21.5, -25.5);
  props.campClutter(-14.5, -31.2); props.campClutter(4.5, -31.4);

  var particles = ENGINE.particles(ctx, heightAt);
  particles.smoke.add(-19, 16.6); particles.smoke.add(20.6, 16.8);
  particles.smoke.add(-11.5, -24.6); particles.smoke.add(6.5, -25.0);

  /* cavalry and camels — representative animals, no riders, no figures.
     Two horses with the Muslims (BADR-011); Quraysh had 100 horsemen (BADR-004). */
  props.horse(-15.8, 12.4, 0.5, false); props.horse(15.8, 14.2, -0.4, false);
  [[-24, -18, 0.3], [-20, -21, 0.5], [24, -18, -0.3], [20, -21, -0.5], [-27, -13, 0.4], [27, -13, -0.4]].forEach(function (h) {
    props.horse(h[0], h[1], h[2], true);
  });
  props.camel(-6.5, 26.5, 0.4); props.camel(-1, 27.5, -0.2); props.camel(4.5, 26.8, 0.2); props.camel(9, 28.4, -0.5);
  /* the Quraysh baggage train behind their camp */
  props.camel(-12, -35.5, 0.5); props.camel(-6, -36.5, -0.3); props.camel(1, -35.8, 0.2); props.camel(8, -36.6, -0.4); props.camel(14, -35.6, 0.3);

  /* ------------------------------ armies: standards, not plates.
     A band is a stand of spears and one banner; a champion carries a taller standard. */
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
    /* a champion's standard carries only the pole and cloth — the rigged figure
       at its foot carries the weapons. Band standards keep the unit's arms. */
    if (champion) return;
    /* spear stand: grouped shafts, one banner-man's spear taller */
    var nSp = side ? 7 : 3;
    for (var k = 0; k < nSp; k++) {
      var h = 1.9 + rnd() * 0.4;
      var sp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, h, 5), iron);
      var a = rnd() * Math.PI * 2, rr = 0.15 + rnd() * 0.5;
      sp.position.set(Math.cos(a) * rr, h / 2, Math.sin(a) * rr);
      sp.rotation.set((rnd() - 0.5) * 0.08, 0, (rnd() - 0.5) * 0.08);
      sp.castShadow = true;
      g.add(sp);
      /* iron tips: forged blades on every shaft */
      var tipH = 0.2;
      var tip = new THREE.Mesh(new THREE.BoxGeometry(0.06, tipH, 0.022), iron);
      tip.position.set(sp.position.x, h + tipH / 2, sp.position.z);
      g.add(tip);
      var collar = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.05, 5), brassM);
      collar.position.set(sp.position.x, h - 0.03, sp.position.z);
      g.add(collar);
    }
    /* shields standing at the front, faces toward the enemy */
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
      /* iron helms piled by the standards: the mailed men of Quraysh */
      for (var hl = 0; hl < 2; hl++) {
        var helm = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), ironM);
        helm.position.set(0.3 + hl * 0.3, 0.13, -0.5 - hl * 0.25);
        g.add(helm);
      }
    } else {
      /* a helm rest by the standard: the believers' kit */
      var rest = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), ironM);
      rest.position.set(0.75, 0.14, -0.45);
      rest.rotation.y = 0.8;
      g.add(rest);
      /* one water-skin: the light kit of the believers */
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
  chH = championUnit(0, -3.2, 11.5, 'Ḥamzah (RA)', 'BADR-028');
  chA = championUnit(0, 0, 11.2, 'ʻAlī (RA)', 'BADR-029'); chA.labelY = 3.9;
  chU = championUnit(0, 3.2, 11.5, 'ʻUbaydah (RA)', 'BADR-028');
  chS = championUnit(1, -5.5, -13.8, 'Shaybah', 'BADR-028');
  chW = championUnit(1, 0, -13.4, 'al-Walīd', 'BADR-029'); chW.labelY = 3.9;
  chB = championUnit(1, 5.5, -13.8, 'ʻUtbah', 'BADR-028');
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

  /* champions walk to the middle ground and fight at sword range: each pair
     meets face to face, an exchange the ledger keys (BADR-028) */
  chH.plan[1] = P(-3.2, 1.3); chA.plan[1] = P(0, 0.8); chU.plan[1] = P(3.2, 1.3);
  chS.plan[1] = P(-3.2, 0.3, { fallAt: 0.74 }); chW.plan[1] = P(0, -0.1, { fallAt: 0.86 }); chB.plan[1] = P(3.2, 0.3, { fallAt: 0.93 });
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
/* Bilāl (RA) runs down ʻUmayyah ibn Khalaf in the rout (BADR-041): his standard
   pursues ʻUmayyah's across the field; ʿUmayyah's falls when the crowd reaches
   him. The Muʿādh/Muʿawwidh/Ikrimah action is told by the named vignette
   figures on their plinth. */
  var bilalMark = eventStandard(0, 8.0, 0, 0, false);
  var umayyahMark = eventStandard(8.5, 5.0, 1, 0, false);
  var umayyahEntry = { group: umayyahMark, side: 1, label: 'ʻUmayyah ibn Khalaf', k: 'umayyah', labelY: 2.4, event: true, priority: 1, labelAlways: true, ph: [5, 6] };
  var EVENT_MARKS = [
    { group: bilalMark, side: 0, label: 'Bilāl (RA)', k: 'bilal', labelY: 3.9, event: true, priority: 1, labelAlways: true, ph: [5, 6] },
    umayyahEntry
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
  var chestBox = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.5, 0.55), new THREE.MeshLambertMaterial({ color: 0x6b5236 }));
  chestBox.position.set(26.5, 0.25, 11.5); chestBox.castShadow = true; chestBox.receiveShadow = true; aftermathGroup.add(chestBox);
  props.camel(23.5, 13.2, 0.6, aftermathGroup); props.camel(26.5, 12.4, -0.4, aftermathGroup);

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

  var SC = 1.15;
  var abdur = makeFighter({ x: -10.8, y: STAGE.y, z: 1.8, ry: Math.PI, robe: 0xcfc6b2, robeDark: 0x8a7a60, weapon: 'none', scale: SC });
  /* BADR-037: the two Helpers struck with swords simultaneously — Muʿādh's
     right arm is cut, and he fights on with the left */
  var muadh = makeFighter({ x: -10.2, y: STAGE.y, z: -0.8, ry: Math.PI, robe: 0xcfc6b2, robeDark: 0x8a7a60, weapon: 'sword', leftWeapon: 'sword', shield: true, scale: SC });
  var muawwidh = makeFighter({ x: -8.6, y: STAGE.y, z: -0.8, ry: Math.PI, robe: 0xcfc6b2, robeDark: 0x8a7a60, weapon: 'sword', scale: SC });
  var abujahl = makeFighter({ x: -8.8, y: STAGE.y, z: -2.2, ry: 0, robe: 0x3a332a, robeDark: 0x241f19, helmet: true, weapon: 'sword', scale: SC });
  var ikrimah = makeFighter({ x: -11.2, y: STAGE.y, z: -1.6, ry: 0, robe: 0x3a332a, robeDark: 0x241f19, helmet: true, weapon: 'sword', scale: SC });
  muadh.weaponL.visible = false; /* the left sword is taken up after the cut */
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
    /* the strike: the two Helpers' swords fall together (BADR-037) */
    var strike = i === 4 ? clamp01((t - 0.34) / 0.12) : (i > 4 ? 1 : 0);
    var swing = -0.35 - strike * 1.35;
    muadh.armL.rotation.set(swing, 0, 0);
    muawwidh.armR.rotation.set(swing, 0, 0);
    muadh.group.rotation.x = -0.1 * strike;
    /* the step: Muʿadh plants his foot on the severed arm and tears it free */
    var step = (i > 4 || (i === 4 && t > 0.72)) ? 1 : (i === 4 ? clamp01((t - 0.62) / 0.10) : 0);
    /* Ikrimah's cut: the right arm hangs, then drops; the stump is exposed and
       Muʿādh takes up the left sword */
    var cut = (i > 4 || (i === 4 && t > 0.60)) ? 1 : (i === 4 ? clamp01((t - 0.52) / 0.08) : 0);
    if (cut > 0) {
      muadh.stump.visible = true;
      muadh.armR.position.set(0.2, 0.12 + (1 - cut) * 0.9, 0.22 - 0.06 * step);
      muadh.armR.scale.setScalar(0.85 + 0.15 * (1 - cut));
      muadh.armR.rotation.set(Math.PI / 2 * cut, 0, 0.3);
    }
    if (muadh.weaponL) muadh.weaponL.visible = cut > 0.6;
    muadh.stepLeg.visible = step > 0;
    muadh.stepLeg.rotation.x = -0.62 * step;
    /* the one-armed fight: the left sword keeps working */
    if (i > 4 || (i === 4 && t > 0.72)) {
      var swing2 = 0.5 + 0.5 * Math.sin(t * Math.PI * 4);
      muadh.armL.rotation.set(-0.6 - 0.5 * swing2, 0, 0);
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

  /* ------------------------------ the duel figures: the same faceless
     maquette fighters as the Abu Jahl vignette (the owner's reference — no
     async assets, nothing to fail). Each champion walks out with his
     standard, like the Anṣār trio. The exchange is keyed to BADR-028:
     Shaybah swings first, Ḥamzah answers and kills him (0.74); al-Walīd and
     ʿAlī cross blades and al-Walīd falls (0.86); ʿUtbah's thrust wounds
     ʿUbaydah (0.9); Ḥamzah finishes ʿUtbah (0.93). */
  function attachFigure(group, opts) {
    var f = makeFighter({
      x: 0, y: 0, z: 0.35, ry: opts.ry || 0,
      robe: opts.robe, robeDark: opts.robeDark,
      weapon: opts.weapon, leftWeapon: opts.leftWeapon,
      shield: opts.shield, helmet: opts.helmet, scale: opts.scale || 1.2
    });
    group.add(f.group);
    f.group.position.set(0, 0, 0.35);
    f.stump.visible = false; f.stump.userData.keep = true;
    f.stepLeg.visible = false; f.stepLeg.userData.keep = true;
    return f;
  }
  [
    [chH, { ry: Math.PI, robe: 0xcfc6b2, robeDark: 0x8a7a60, weapon: 'sword', shield: true }],
    [chA, { ry: Math.PI, robe: 0xcfc6b2, robeDark: 0x8a7a60, weapon: 'sword', shield: true }],
    [chU, { ry: Math.PI, robe: 0xcfc6b2, robeDark: 0x8a7a60, weapon: 'spear', shield: true }],
    [chS, { ry: 0, robe: 0x3a332a, robeDark: 0x241f19, weapon: 'sword', shield: true, helmet: true }],
    [chW, { ry: 0, robe: 0x3a332a, robeDark: 0x241f19, weapon: 'sword', shield: true, helmet: true }],
    [chB, { ry: 0, robe: 0x3a332a, robeDark: 0x241f19, weapon: 'spear', shield: true, helmet: true }]
  ].forEach(function (x) { x[0].figure = attachFigure(x[0].group, x[1]); });
  ANSAR_MARKS.forEach(function (g) {
    attachFigure(g, { ry: Math.PI, robe: 0xcfc6b2, robeDark: 0x8a7a60, weapon: 'spear', shield: true, scale: 1.1 });
  });
  /* the duel exchange: each beat swings the fighter's weapon arm */
  var DUEL_BEATS = [
    { u: chS, win: [[0.50, 0.58]] },
    { u: chH, win: [[0.60, 0.68], [0.87, 0.93]] },
    { u: chW, win: [[0.72, 0.80]] },
    { u: chA, win: [[0.76, 0.86]] },
    { u: chB, win: [[0.78, 0.88]] },
    { u: chU, win: [[0.84, 0.90]], wound: true }
  ];
  function updateDuelArms(i, t) {
    DUEL_BEATS.forEach(function (b) {
      var f = b.u.figure;
      if (!f) return;
      var swing = 0;
      if (i === 1) {
        for (var k = 0; k < b.win.length; k++) {
          var w = b.win[k];
          if (t >= w[0] && t <= w[1]) { swing = Math.sin(clamp01((t - w[0]) / (w[1] - w[0])) * Math.PI); break; }
        }
      }
      var arm = b.wound ? f.armL : f.armR;
      arm.rotation.x = -0.25 - swing * 1.35;
    });
  }

  /* ------------------------------ squads and platoons.
     A squad is eight men (engine crowd): hooded body, upright spear, front shields. */
  ENGINE.crowd.build({ side: 0, count: 313, cols: 9, dxS: 2.2, dzS: 1.9, z0: 12.2, h: 1.9, blocks: mBands, scene: scene });
  ENGINE.crowd.build({ side: 1, count: 1000, cols: 21, dxS: 2.0, dzS: 1.9, z0: -14.2, h: 2.15, blocks: qBands, scene: scene });

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
    var geo = ENGINE.merge.mergeParts([
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

  /* ------------------------------ labels */
  function mkLabel(txt, cls) { return ENGINE.labels.mkLabel(labelBox, txt, cls); }
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

  /* ------------------------------ arrows */
  particles.arrows.makePool(props.makeArrow, 40);
  /* arrows spent into the sand after the volleys */
  var stuckArrows = new THREE.Group();
  for (var sa2 = 0; sa2 < 30; sa2++) {
    var arw = props.makeArrow(), ax, az;
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

  /* ------------------------------ static merge.
     Merge every rigid mesh into a handful of vertex-coloured batches; keep only
     what animates (banner cloth, palm crowns, arrows, the men) separate. */
  var merge = ENGINE.merge;
  function mergeStaticScene() {
    scene.updateMatrixWorld(true);
    /* banner cloth is vertex-animated */
    WAVERS.forEach(function (w) { w.mesh.userData.keep = true; });
    /* arrows fly as groups: bake each one to a single mesh */
    particles.arrows.pool.forEach(function (a) {
      a.m.updateMatrixWorld(true);
      merge.mergeMeshList(merge.collectMergeable(a.m), a.m, true);
      a.m.userData.keep = true;
    });
    stuckArrows.updateMatrixWorld(true);
    merge.mergeMeshList(merge.collectMergeable(stuckArrows), stuckArrows, true);
    stuckArrows.userData.keep = true;
    /* the named vignette figures: merge the body, keep arms/stump separate */
    VIGNETTE.forEach(function (f) {
      f.armR.userData.keep = true;
      f.armL.userData.keep = true;
      f.stump.userData.keep = true;
      f.stepLeg.userData.keep = true;
      f.group.updateMatrixWorld(true);
      merge.mergeMeshList(merge.collectMergeable(f.group), f.group, true);
      f.group.userData.dynamicRoot = true;
    });

    /* banners ride on moving unit blocks: merge each block's rigid parts locally */
    champs.concat(mBands, qBands).forEach(function (b) {
      var bg = b.group || b;
      bg.updateMatrixWorld(true);
      merge.mergeMeshList(merge.collectMergeable(bg), bg, true);
      bg.userData.dynamicRoot = true;
      bg.userData.banners = bg.children.filter(function (c) { return c.isMesh; });
    });
    ANSAR_MARKS.forEach(function (bg) {
      bg.updateMatrixWorld(true);
      merge.mergeMeshList(merge.collectMergeable(bg), bg, true);
      bg.userData.dynamicRoot = true;
    });
    /* palm crowns sway: merge each crown locally, leave its trunk to the world batch */
    props.palms.forEach(function (p) {
      p.crown.updateMatrixWorld(true);
      merge.mergeMeshList(merge.collectMergeable(p.crown), p.crown, true);
      p.crown.userData.keep = true;
    });
    /* everything else rigid, in world space */
    var statics = [];
    scene.traverse(function (o) {
      if (!o.isMesh || o.isInstancedMesh) return;
      var p = o;
      while (p) { if (p.userData && (p.userData.keep || p.userData.dynamicRoot)) return; p = p.parent; }
      if (merge.isMergeable(o)) statics.push(o);
    });
    merge.mergeMeshList(statics, scene, false);
  }
  mergeStaticScene();
  merge.mergeMeshList(merge.collectMergeable(aftermathGroup), aftermathGroup, true);

  /* ------------------------------ phases + shot list */
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
  /* the shot list: one continuous move per phase, the proven pushed-build
     camera paths (origin/main, build q) — no cuts, no shakes */
  var SHOTS = {
    ground: [
      { t0: 0, t1: 1.001, p0: [0, 30, 44], p1: [4, 27, 40], l0: [0, 1.4, 0], l1: [0, 1.4, -1] }
    ],
    duel: [
      { t0: 0, t1: 1.001, p0: [15, 6, 10], p1: [9, 3.4, 4.5], l0: [0, 1.2, 1.6], l1: [0, 1.3, 1.2] }
    ],
    advance: [
      { t0: 0, t1: 1.001, p0: [34, 20, 22], p1: [24, 15, 8], l0: [-2, 1, 0], l1: [-4, 1, -2] }
    ],
    clash: [
      { t0: 0, t1: 1.001, p0: [30, 13, 20], p1: [20, 9, 8], l0: [-2, 1, 0], l1: [-4, 1, -2] }
    ],
    turn: [
      { t0: 0, t1: 1.001, p0: [24, 16, 26], p1: [12, 13, 18], l0: [-4, 1, -4], l1: [-8, 1, -8] }
    ],
    rout: [
      { t0: 0, t1: 1.001, p0: [14, 22, 34], p1: [2, 20, 30], l0: [-14, 0, -18], l1: [-18, 0, -22] }
    ],
    quiet: [
      { t0: 0, t1: 1.001, p0: [32, 18, 30], p1: [30, 9, 19], l0: [0, 0.6, 0], l1: [36, 1.2, 8] }
    ]
  };
  /* no impact shakes: the pushed build's steady camera reads better */
  var IMPACTS = [];
  var PRESETS = {
    ground:  { p: [0, 30, 44], l: [0, 1.4, 0] },
    aerial:  { p: [0, 80, 16], l: [0, 0, 6] },
    duel:    { p: [10, 4.6, 8], l: [0, 1, 0] },
    line:    { p: [24, 5, 18], l: [0, 0.6, 8] },
    far:     { p: [-26, 6, -16], l: [-4, 0.5, -8] },
    wells:   { p: [6, 5, 9], l: [9.2, 0.6, 3.8] },
    command: { p: [-20, 5.6, 3.5], l: [-9.0, 1.1, -0.6] }
  };
  var director = ENGINE.director(ctx);
  director.setup({ phases: PHASES, shots: SHOTS, impacts: IMPACTS, presets: PRESETS });
  var clock = director.clock;

  /* ------------------------------ applying a global frame */
  var UNITS = champs.concat(mBands, qBands);
  var curPhaseIdx = 0;
  var curPhaseT = 0;
  function applyFrac(frac) {
    var info = director.phaseInfo(frac);
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
      var fallen = 0;
      for (var fi = i; fi >= 0; fi--) {
        if (u.plan[fi].fallAt !== undefined) { fPhase = fi; break; }
      }
      if (fPhase >= 0) {
        fallen = fPhase < i ? 1 : clamp01((t - u.plan[fPhase].fallAt) / 0.14);
      }
      if (u._wound && (i > u._wound.i || (i === u._wound.i && t >= u._wound.at))) {
        p.tilt = Math.max(p.tilt, u._wound.tilt);
      }
      applyPose(u, p, fallen);
    }

    updateDuelArms(i, t);
    updateVignette(i, t);

    /* the Ansari trio steps out, is refused, and withdraws before the champions engage */
    var ansarZ = 10.5;
    if (i === 1) {
      var ansarAdv = clamp01((t - 0.04) / 0.16);
      var ansarBack = clamp01((t - 0.30) / 0.14);
      ansarZ = 10.5 - 6.0 * ansarAdv + 6.0 * ansarBack;
    }
    ANSAR_MARKS.forEach(function (m) { m.position.z = ansarZ; });

    /* the Bilāl (RA) / ʻUmayyah reckoning belongs to the rout (BADR-041):
       ʻUmayyah tries to slip away with the fleeing army, Bilāl's standard
       pursues along the rout path and the crowd reaches him — his standard
       falls; Bilāl's stands over it */
    if (i >= 5) {
      bilalMark.visible = true;
      umayyahMark.visible = true;
      var chase = i > 5 ? 1 : clamp01((t - 0.05) / 0.40);
      var fall = i > 5 ? 1 : easeIO(clamp01((t - 0.50) / 0.12));
      var ux = 8.5 + (-4.0 - 8.5) * easeIO(clamp01(chase * 1.05));
      var uz = 5.0 + (-8.0 - 5.0) * easeIO(clamp01(chase * 1.05));
      umayyahMark.position.set(ux, 0.18 * fall, uz);
      umayyahMark.rotation.z = 1.25 * fall;
      if (umayyahEntry) umayyahEntry.labelY = 2.4 - 1.7 * fall;
      var bx = 0 + (-5.4 - 0) * easeIO(chase);
      var bz = 8.0 + (-6.2 - 8.0) * easeIO(chase);
      bilalMark.position.set(bx, 0, bz);
    } else {
      bilalMark.visible = false;
      umayyahMark.visible = false;
    }
    ANSAR_MARKS.forEach(function (m) { m.visible = i === 1; });

    /* the plinth belongs to the command/rout, not the duel/advance foreground */
    stageGroup.visible = i >= 4;

    /* the aftermath (graves, dead, captives, spoils, the pit) belongs to the rout and reckoning */
    aftermathGroup.visible = i >= 5;

    /* arrows: late advance into clash; in-flight arrows keep flying after the window closes */
    var arrowWindow = (i === 2 && t > 0.35) || (i === 3 && t < 0.9);
    if (arrowWindow && !reduce) particles.arrows.spawn(clock.dt || 0, clock.speed, function (ar) {
      var fromM = Math.random() > 0.55;
      ar.from.set(fromM ? -9 + Math.random() * 18 : -10 + Math.random() * 12, 1.4 + Math.random() * 0.8, fromM ? 6 + Math.random() * 3 : -2 - Math.random() * 3);
      ar.to.set(fromM ? -10 + Math.random() * 12 : -9 + Math.random() * 18, 1.1, fromM ? -2 : 6);
    });
    particles.arrows.update(clock.dt || 0);
    particles.arrows.setAllVisible(true);

    /* the sand: from ʻUtbah-side cast of the Prophet (PBUH) toward the Quraysh */
    var dustAmt = (i === 4) ? Math.sin(clamp01(t) * Math.PI) : (i === 5 && t < 0.35 ? (1 - t / 0.35) * 0.5 : 0);
    particles.dust.update(dustAmt);

    /* the angels: gold motes over the Muslim line through the clash */
    var angelAmt = (i === 3) ? Math.sin(clamp01(t) * Math.PI) : (i === 4 && t < 0.45 ? (1 - t / 0.45) : 0);
    particles.angels.update(angelAmt);

    /* spent arrows stay in the sand after the volleys */
    stuckArrows.visible = i >= 3;

    /* camera */
    director.applyCamera(i, t);
  }

  function applyPose(u, p, fallen) {
    var g = u.group;
    g.position.x = p.x; g.position.z = p.z;
    var fr = easeIO(clamp01(fallen));
    g.rotation.x = -1.42 * fr; /* a fallen standard lies flat, its figure with it */
    g.position.y = -0.1 * fr;
    if (!fr && u === chU) g.rotation.x = 0.55 * p.tilt; /* the wounded ʻUbaydah's grievous kneel */
  }

  /* the crowd env: computed once per frame, reused by benchMass.
     Gait frequency is matched to the actual travel speed so feet do not
     slide: the advance is a deliberate march (~0.78 u/s), the rout is a run
     (~1.7 u/s), and in the fight the stance is planted. */
  function crowdEnv() {
    var ph = curPhaseIdx;
    var fight = ph === 3 ? 1 : ph === 4 ? 0.75 : ph === 2 ? 0.35 : ph === 5 ? 0.25 : 0;
    var marching = ph === 2 || ph === 5;
    return {
      ph: ph,
      frac: clock.frac,
      total: TOTAL,
      fight: fight,
      disp: ph === 2 ? 1 : ph === 3 ? 0.7 : ph === 4 ? 0.3 : ph === 5 ? 0.75 : 0,
      marching: marching,
      gaitHz: ph === 5 ? 1.35 : ph === 2 ? 0.55 : 1.0,
      gaitAmp: marching ? (ph === 5 ? 0.62 : 0.5) : (fight > 0 ? 0 : 0.045),
      leanRun: ph === 5 ? 0.22 : 0
    };
  }
  function updateMass() { ENGINE.crowd.update(crowdEnv()); }
  updateMass();

  /* ------------------------------ main loop */
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
    /* follow wall-clock time even on slow devices: a 50 ms cap made playback
       crawl to a near-stop at phone frame rates */
    var dt = Math.min(0.5, (now - clock.last) / 1000);
    clock.last = now;
    clock.dt = dt || 0.016;
    director.perfTick(now, clock.playing, renderer);
    if (clock.playing) {
      clock.frac += dt * clock.speed / TOTAL;
      if (clock.frac >= 1) { clock.frac = 1; clock.playing = false; }
      if (tickCb) { try { tickCb(clock.frac, director.phaseInfo(clock.frac)); } catch (err) { console.error('[badr] tick', err); } }
      applyFrac(clock.frac);
      updateMass();
    }
    /* paused: turntable drift happens inside the orbit step; only mode-switch here */
    if (!clock.playing) director.autoOrbit();
    director.orbitStep(dt, clock.playing);
    /* labels project; nearer labels win their pixels */
    var w = window.innerWidth, h = window.innerHeight;
    placedRects.length = 0;
    var ordered = ULABS.slice().sort(function (a, b) { return (b.u.priority || 0) - (a.u.priority || 0); });
    var env = { camera: camera, phaseIdx: curPhaseIdx, phaseT: curPhaseT, w: w, h: h, MOBILE: MOBILE, reduce: reduce };
    ENGINE.labels.place(ordered, true, env, placedRects);
    ENGINE.labels.place(LANDL, false, env, placedRects);
    if (!reduce && !MOBILE) {
      updateCloth(now / 1000);
      for (var pw = 0; pw < props.palms.length; pw++) {
        var pp = props.palms[pw];
        pp.crown.rotation.z = Math.sin(now / 1600 + pp.phase) * 0.035;
        pp.crown.rotation.x = Math.cos(now / 2100 + pp.phase) * 0.022;
      }
      particles.smoke.update(clock.dt || 0, now);
    } else if (MOBILE && (Math.floor(now / 140) % 2 === 0)) {
      /* a light breath of cloth on mobile: update the largest banners only */
      updateCloth(now / 2500);
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  applyFrac(0);
  director.applyCamera(0, 0, true);

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
    if (tickCb) { try { tickCb(clock.frac, director.phaseInfo(clock.frac)); } catch (err) { console.error('[badr] tick', err); } }
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

  /* ------------------------------ public clock/camera API */
  window.BATTLE = {
    total: TOTAL,
    phases: PHASES,
    phaseInfo: director.phaseInfo,
    frac: function () { return clock.frac; },
    seek: function (f) {
      clock.frac = clamp01(f);
      applyFrac(clock.frac);
      updateMass();
      if (tickCb) tickCb(clock.frac, director.phaseInfo(clock.frac));
    },
    play: function () {
      clock.playing = true;
      clock.last = performance.now();
      director.setMode('phase');
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
        director.setMode('phase');
        return;
      }
      director.preset(name);
    },
    explore: function (on) {
      if (on) {
        director.setMode('orbit');
        director.orbitFromCam();
      } else {
        director.setMode('phase');
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
    benchMass: function (n) { return ENGINE.crowd.bench(crowdEnv(), n); },
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
    debugChamp: function () {
      return champs.map(function (u) {
        var n = 0, types = [];
        u.group.traverse(function (o) { if (o.isMesh) { n++; if (types.length < 6) types.push(o.geometry.type); } });
        var fig = null;
        if (u.figure) fig = { meshes: u.figure.group.children.length };
        return { label: u.label, pos: u.group.position.toArray().map(function (v) { return +v.toFixed(2); }), meshes: n, types: types, figure: fig };
      });
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
    dbgParticles: function () {
      return { angelOp: +particles.angels.material.opacity.toFixed(3), dustOp: +particles.dust.material.opacity.toFixed(3) };
    }
  };
})();