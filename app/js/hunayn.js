/* Ḥunayn · the valley in 3D — the Ḥunayn scene module.
   The valley between Makkah and Ṭā’if: the night march up from Makkah, the
   ambush out of the slopes and narrow places, the stand at the white mule,
   the rally at al-ʿAbbās's call, the siege of Ṭā’if, the spoils at Jiʿrānah
   and the return. Eight phases on the shared ENGINE; this file carries only
   Ḥunayn's ground, layout, plans, standards, shots and copy.
   The Prophet ﷺ is never depicted; no figure shows a face; the station is
   carried by the white standard, the mule and the reins alone.
   Claims: data/ledger/hunayn.json (HUN-001 … HUN-032). */
(function () {
  'use strict';
  var U = ENGINE.util;
  var easeIO = U.easeIO, clamp01 = U.clamp01, smoothN = U.smoothN, fbm = ENGINE.fbm;
  var ctx = ENGINE.boot({
    failText: 'The 3D valley needs WebGL. The graded ledger in data/ledger/hunayn.json carries every fact.',
    grade: false, linearFog: true, fogColor: 0xb7ab94, fogNear: 170, fogFar: 590
  });
  if (!ctx) return;
  var canvas = ctx.canvas, labelBox = ctx.labelBox, reduce = ctx.reduce, MOBILE = ctx.MOBILE;
  var renderer = ctx.renderer, scene = ctx.scene, camera = ctx.camera;

  /* ------------------------------ a dry, broken valley at dawn.
     Ḥunayn is a sloping valley on the Ṭā’if road: pale gravel floor, dark
     rock walls, the town on its height to the north-east. The key is low and
     warm; the march is by night and the ambush by first light, so the sky
     takes the night down through the first two phases and lifts at the rout. */
  var sky = ENGINE.sky(ctx, {
    zenith: 0x3d5a78, horizon: 0xd9b896, skyCurve: 0.50,
    stars: 260, starOpacity: 0.0,
    moon: true, moonPos: [-140, 70, -260], moonOpacity: 0.12,
    hemiSky: 0xa9b4bd, hemiGround: 0x4c4436, hemi: 0.52,
    sunColor: 0xffd9a8, sun: 1.10, sunPos: [150, 48, -60], shadowBounds: 230, shadowFar: 560,
    fillColor: 0x8fa4b8, fill: 0.24, fillPos: [-80, 38, 60],
    rimColor: 0xffe0b8, rim: 0.24, rimPos: [20, 18, 100]
  });

  /* ------------------------------ the ground.
     Axes: +x east, +z north. The army comes up from Makkah in the south,
     descends into the valley from the south-west, and meets the enemy where
     the valley narrows. Awtas lies east on its shelf; Ṭā’if is the walled
     height in the north-east; Jiʿrānah, on the Makkah road, is the depot
     ground of the aftermath (HUN-001, HUN-005, HUN-022). */
  var STATION = { x: 10, z: -34 };
  var TOWN = { x: 150, z: 152 };
  var CAMP = { x: 112, z: 4 };
  var DEPOT = { x: -6, z: -158 };
  var TREE = { x: -44, z: -98 };

  function wadiX(z) { return Math.sin(z * 0.021 + 0.4) * 7; }

  function heightAt(x, z) {
    /* The two hosts stand on one level shelf: the shared crowd mesh has no
       per-man ground sample, so the whole corridor from the pass to the
       enemy camp reads at y ~ 0. Every rise is pushed outside it. */
    var inner = (1 - smoothN(Math.abs(x), 92, 150)) * (1 - smoothN(Math.abs(z + 90), 150, 240));
    var h = (fbm(x * 0.013 + 4.1, z * 0.013 + 2.7, 3) - 0.5) * 2.4 * (1 - 0.92 * inner);
    /* the bowl beyond the shelf, south and north */
    h += 8.0 * smoothN(Math.abs(z + 90), 150, 260);
    /* the rise behind the enemy camp */
    h += 7.0 * smoothN(z, 200, 300) * (0.70 + 0.40 * fbm(x * 0.014 + 3.1, z * 0.014 + 0.7, 3));
    /* the valley walls: the ambush country of both flanks */
    h += Math.max(smoothN(-x, 96, 176), smoothN(x, 96, 176)) *
      (12 + 26 * fbm(x * 0.019 + 1.7, z * 0.019 + 5.3, 3));
    /* the pass the Makkah road climbs, with a gap for the road */
    var pass = 1 - smoothN(Math.abs(x + 6), 10, 44);
    h += 9.0 * smoothN(-z, 236, 330) * (1 - 0.72 * pass);
    h += Math.max(0, Math.hypot(x, z + 60) - 300) * 0.055;
    /* a shallow wādī cut, only outside the hosts' shelf */
    h -= 1.4 * (1 - smoothN(Math.abs(x - wadiX(z)), 4, 18)) * (1 - inner);
    /* Ṭā’if on its height: a flat crown, a steep slope, the camp at the foot */
    var town = 1 - smoothN(Math.hypot(x - TOWN.x, z - TOWN.z), 32, 68);
    h = h * (1 - 0.82 * town) + 24 * 0.82 * town;
    /* the Awtas shelf east of the field */
    var awtas = 1 - smoothN(Math.hypot(x - CAMP.x, z - CAMP.z), 30, 64);
    h = h * (1 - 0.88 * awtas) + 3.2 * 0.88 * awtas;
    h += (fbm(x * 0.055, z * 0.055, 2) - 0.5) * 0.30 * (1 - 0.86 * inner);
    return h;
  }

  var ROCK_LO = new THREE.Color(0x6e685c);
  var ROCK_HI = new THREE.Color(0xb2a88f);
  var WADI_COL = new THREE.Color(0x8b8471);
  var TOWN_DUST = new THREE.Color(0xbfae8c);
  var PAVE_COL = new THREE.Color(0xa79d86);
  var GRASS_COL = new THREE.Color(0x9c9068);
  var ROCK = new THREE.Color();
  function colorAt(x, z, y, base) {
    var c = base.clone();
    var pave = fbm(x * 0.030 + 7.2, z * 0.030 + 1.4, 3);
    if (pave > 0.58) c.lerp(PAVE_COL, (pave - 0.58) * 1.5);
    var grass = fbm(x * 0.021 + 2.6, z * 0.021 + 8.1, 2);
    if (grass > 0.54) c.lerp(GRASS_COL, (grass - 0.54) * 0.9);
    var wd = Math.abs(x - wadiX(z));
    if (wd < 20) c.lerp(WADI_COL, (1 - smoothN(wd, 4, 20)) * 0.5);
    var t = smoothN(y, 1.6, 7.0);
    if (t > 0.02) {
      var strata = 0.5 + 0.5 * Math.sin(y * 1.15 + fbm(x * 0.05, z * 0.05, 2) * 4.0);
      ROCK.copy(ROCK_LO).lerp(ROCK_HI, 0.24 + 0.48 * strata);
      c.lerp(ROCK, t * 0.80);
    }
    var town = 1 - smoothN(Math.hypot(x - TOWN.x, z - TOWN.z), 32, 68);
    if (town > 0.02) c.lerp(TOWN_DUST, town * 0.42);
    var awtas = 1 - smoothN(Math.hypot(x - CAMP.x, z - CAMP.z), 30, 64);
    if (awtas > 0.02) c.lerp(TOWN_DUST, awtas * 0.22);
    return c;
  }

  ENGINE.ground(ctx, heightAt, {
    base: '#b3a68d', repeat: 34, bumpScale: 0.13,
    sand: 0xb0a288, crest: 0xc6b99f, trough: 0x7d7462, grit: 0x998c75,
    size: 720, seg: 260, colorAt: colorAt,
    light: '#f6f0e2', dark: '#5f594c', scoreAlpha: 0.06
  });

  var props = ENGINE.props(ctx, heightAt);
  var cast = ENGINE.cast(ctx);
  var merge = ENGINE.merge;
  var WAVERS = cast.wavers;

  props.scrubField(MOBILE ? 70 : 110, 23);
  props.pebbleField(MOBILE ? 170 : 300, -120, -24, 240, 64);
  /* rock at the foot of both walls, the town slope and the pass */
  props.rock(-120, 30, 2.4); props.rock(-112, -40, 2.0); props.rock(-104, -120, 2.2);
  props.rock(118, 40, 2.2); props.rock(130, -10, 1.8); props.rock(110, -96, 1.9);
  props.rock(-96, 74, 1.6); props.rock(96, 66, 1.5);
  props.rock(26, -258, 2.0);
  props.rock(-86, -176, 1.4); props.rock(72, -212, 1.5);
  props.rock(-140, 96, 2.8); props.rock(142, 62, 2.4);

  /* scrub along the slopes the enemy holds (HUN-004) */
  (function slopeScrub(n, seed) {
    var geo = new THREE.ConeGeometry(0.16, 0.6, 4, 1);
    var mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0x6d6446 }), n);
    var d = new THREE.Object3D();
    for (var i = 0; i < n; i++) {
      var hx = Math.abs(Math.sin((i + seed) * 12.9898) * 43758.5453) % 1;
      var hz = Math.abs(Math.sin((i + seed) * 78.233) * 19341.17) % 1;
      var side = i % 2 ? 1 : -1;
      var px = side * (96 + hx * 54), pz = -150 + hz * 250;
      var sc = 0.6 + (Math.abs(Math.sin((i + 3) * 3.7) * 811) % 1) * 1.2;
      d.position.set(px, heightAt(px, pz) + 0.12 * sc, pz);
      d.rotation.set((hz - 0.5) * 0.4, hx * 6.28, (hx - 0.5) * 0.4);
      d.scale.set(sc, sc, sc);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    }
    mesh.receiveShadow = true;
    scene.add(mesh);
  })(MOBILE ? 90 : 170, 41);

  /* the palm country of the valley floor and Jiʿrānah (permanent ground) */
  props.palmGrove(-76, -200, 30, 24, 20);
  props.palmGrove(58, -196, 30, 22, 18);
  props.palmGrove(88, -18, 30, 24, 16);

  /* ------------------------------ roads */
  function roadRibbon(pts, width, color) {
    var pos = [], nor = [], idx = [];
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      var q = pts[Math.min(pts.length - 1, i + 1)];
      var o = pts[Math.max(0, i - 1)];
      var tx = q[0] - o[0], tz = q[1] - o[1];
      var l = Math.hypot(tx, tz) || 1;
      var nx = -tz / l, nz = tx / l;
      var y = heightAt(p[0], p[1]) + 0.05;
      pos.push(p[0] + nx * width / 2, y, p[1] + nz * width / 2);
      pos.push(p[0] - nx * width / 2, y, p[1] - nz * width / 2);
      nor.push(0, 1, 0, 0, 1, 0);
    }
    for (var k = 0; k < pts.length - 1; k++) {
      var a = k * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setIndex(idx);
    var m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color || 0xb9a985 }));
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  /* the Makkah road runs up the pass, past Jiʿrānah, through the valley */
  roadRibbon([[-6, -244], [-4, -218], [-2, -190], [-1, -164], [0, -140], [1, -116],
    [2, -92], [1, -64], [0, -38], [1, -12], [8, 16], [20, 44]], 5.0);
  /* the Ṭā’if branch leaves the valley at the north-east */
  roadRibbon([[20, 44], [40, 66], [62, 88], [86, 106], [108, 120], [126, 128], [138, 132]], 4.0, 0xae9e7c);
  /* the Awtas track east */
  roadRibbon([[12, 8], [42, 8], [74, 6], [104, 4], [114, 4]], 2.6, 0xb2a17f);

  /* ------------------------------ Ṭā’if inside its ring */
  function house(x, z, w, d, h, seed) {
    var g = new THREE.Group();
    g.position.set(x, heightAt(x, z), z);
    var bodyM = new THREE.MeshLambertMaterial({ color: seed % 2 ? 0xb7a88c : 0xac9d82 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyM);
    body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
    var roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.7, 0.24, d + 0.7), new THREE.MeshLambertMaterial({ color: 0x94856c }));
    roof.position.y = h + 0.12; roof.castShadow = true; roof.receiveShadow = true; g.add(roof);
    var door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.75, 0.1), new THREE.MeshLambertMaterial({ color: 0x2b241a }));
    door.position.set(0, 0.88, d / 2 + 0.03); g.add(door);
    var lean = new THREE.Mesh(new THREE.BoxGeometry(w * 0.34, h * 0.5, d * 0.46), bodyM);
    lean.position.set(w * 0.58, h * 0.25, -d * 0.16);
    lean.castShadow = true; lean.receiveShadow = true; g.add(lean);
    var slit = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.34, 0.08), new THREE.MeshLambertMaterial({ color: 0x2b241a }));
    slit.position.set(-w * 0.24, h * 0.68, d / 2 + 0.04); g.add(slit);
    scene.add(g);
    return g;
  }
  house(144, 142, 7.2, 5.8, 3.3, 1);
  house(158, 146, 6.6, 5.2, 3.0, 2);
  house(148, 160, 7.0, 5.6, 3.2, 3);
  house(162, 154, 6.2, 5.0, 2.9, 4);
  house(138, 156, 6.0, 4.8, 2.8, 5);
  house(154, 170, 6.4, 5.2, 3.0, 6);
  house(136, 142, 5.4, 4.4, 2.6, 7);
  props.well(152, 158, true);

  /* the ring wall: eight towers, the gate on the south-west face */
  var TOWERS = [];
  var TAIF_GATE = [0, 0, 0], TAIF_ROPE = [0, 0, 0];
  (function taifRing() {
    var i, a, tx, tz;
    for (i = 0; i < 8; i++) {
      a = (195 + i * 45) * Math.PI / 180;
      tx = TOWN.x + Math.cos(a) * 30;
      tz = TOWN.z + Math.sin(a) * 30;
      var gate = i === 0 || i === 1;
      props.fort(tx, tz, {
        h: gate ? 8.4 : 7.2, w: gate ? 5.6 : 5.0, seed: i + 3,
        tone: { stone: 0xa39172, dark: 0x7c6d55, trim: 0xb5a487 },
        merlons: 9
      });
      TOWERS.push({ x: tx, z: tz, a: a });
      if (tx > TOWN.x + 20 && tz < TOWN.z + 6) TOWERS[TOWERS.length - 1].out = true;
    }
    /* the curtain walls, one span left open for the gate */
    for (i = 0; i < 8; i++) {
      if (i === 0) continue;
      var t0 = TOWERS[i], t1 = TOWERS[(i + 1) % 8];
      var mx = (t0.x + t1.x) / 2, mz = (t0.z + t1.z) / 2;
      var len = Math.hypot(t1.x - t0.x, t1.z - t0.z) - 3.4;
      var y0 = heightAt(mx, mz);
      var wallM = new THREE.MeshLambertMaterial({ color: 0x9a886b });
      var wall = new THREE.Mesh(new THREE.BoxGeometry(len, 4.2, 1.5), wallM);
      wall.position.set(mx, y0 + 2.1, mz);
      wall.rotation.y = Math.atan2(-(t1.z - t0.z), t1.x - t0.x);
      wall.castShadow = true; wall.receiveShadow = true;
      scene.add(wall);
      var cap = new THREE.Mesh(new THREE.BoxGeometry(len, 0.22, 1.9), new THREE.MeshLambertMaterial({ color: 0x857457 }));
      cap.position.set(mx, y0 + 4.31, mz);
      cap.rotation.y = wall.rotation.y;
      scene.add(cap);
      var nmer = Math.max(2, Math.floor(len / 2.2));
      for (var k = 0; k < nmer; k++) {
        var u = (k + 0.5) / nmer - 0.5;
        var mer = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.55), wallM);
        mer.position.set(
          mx + Math.cos(wall.rotation.y) * u * len,
          y0 + 4.72,
          mz - Math.sin(wall.rotation.y) * u * len
        );
        mer.rotation.y = wall.rotation.y;
        mer.castShadow = true;
        scene.add(mer);
      }
    }
    /* the gate: a dark panel and its lintel between the two south-west towers */
    var g0 = TOWERS[0], g1 = TOWERS[1];
    var gx = (g0.x + g1.x) / 2, gz = (g0.z + g1.z) / 2;
    var gy = heightAt(gx, gz);
    var gRy = Math.atan2(-(g1.z - g0.z), g1.x - g0.x);
    var jambM = new THREE.MeshLambertMaterial({ color: 0x8f7d61 });
    [-6.64, 6.64].forEach(function (u) {
      var jamb = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4.0, 1.1), jambM);
      jamb.position.set(gx + Math.cos(gRy) * u, gy + 2.0, gz - Math.sin(gRy) * u);
      jamb.rotation.y = gRy;
      jamb.castShadow = true; jamb.receiveShadow = true;
      scene.add(jamb);
    });
    var woodM = new THREE.MeshLambertMaterial({ color: 0x6b5236 });
    var ironM = new THREE.MeshLambertMaterial({ color: 0x5a5244 });
    var panel = new THREE.Mesh(new THREE.BoxGeometry(9.2, 3.4, 0.7), woodM);
    panel.position.set(gx, gy + 1.7, gz);
    panel.rotation.y = gRy;
    scene.add(panel);
    [0.85, 2.55].forEach(function (dy) {
      var band = new THREE.Mesh(new THREE.BoxGeometry(9.24, 0.26, 0.78), ironM);
      band.position.set(gx, gy + dy, gz);
      band.rotation.y = gRy;
      scene.add(band);
    });
    var seam = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.38, 0.76), new THREE.MeshLambertMaterial({ color: 0x4a3622 }));
    seam.position.set(gx, gy + 1.7, gz);
    seam.rotation.y = gRy;
    scene.add(seam);
    var sill = new THREE.Mesh(new THREE.BoxGeometry(9.7, 0.26, 1.7), new THREE.MeshLambertMaterial({ color: 0x857457 }));
    sill.position.set(gx, gy + 0.13, gz);
    sill.rotation.y = gRy;
    scene.add(sill);
    var lintel = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.5, 1.3), new THREE.MeshLambertMaterial({ color: 0x857457 }));
    lintel.position.set(gx, gy + 3.6, gz);
    lintel.rotation.y = gRy;
    lintel.castShadow = true;
    scene.add(lintel);
    /* the rope over the wall beside the gate (HUN-024): a marker, no figure */
    var rx = g0.x - 1.2, rz = g0.z + 1.0;
    var ry0 = heightAt(rx, rz);
    var rope = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 4.0, 5), new THREE.MeshLambertMaterial({ color: 0x8a7a5a }));
    rope.position.set(rx, ry0 + 2.4, rz);
    scene.add(rope);
    var coil = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 4, 10), rope.material);
    coil.position.set(rx, ry0 + 0.55, rz);
    coil.rotation.x = Math.PI / 2;
    scene.add(coil);
    TAIF_GATE = [gx, gy, gz];
    TAIF_ROPE = [rx, ry0 + 4.2, rz];
  })();

  /* ------------------------------ the tree of Dhāt Anwāṭ (HUN-009).
     A single green nabk on the road: a marker, no dialogue, no figures. */
  (function nabk() {
    var g = new THREE.Group();
    var bark = new THREE.MeshLambertMaterial({ color: 0x5b4a35 });
    var leaf = new THREE.MeshLambertMaterial({ color: 0x64744a, flatShading: true });
    var leaf2 = new THREE.MeshLambertMaterial({ color: 0x546140, flatShading: true });
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.46, 3.6, 6), bark);
    trunk.position.y = 1.8; trunk.castShadow = true; g.add(trunk);
    [[0.9, 3.1, 0.2, 0.5], [-0.7, 3.3, -0.5, -0.42], [0.1, 3.5, 0.8, 0.3]].forEach(function (l) {
      var limb = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, 2.2, 5), bark);
      limb.position.set(l[0], l[1], l[2]);
      limb.rotation.z = l[3];
      limb.castShadow = true; g.add(limb);
    });
    for (var i = 0; i < 7; i++) {
      var a = i / 7 * Math.PI * 2 + 0.4;
      var r = 1.1 + (i % 3) * 0.7;
      var blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 + (i % 2) * 0.4, 0), i % 2 ? leaf : leaf2);
      blob.position.set(Math.cos(a) * r, 4.9 + (i % 3) * 0.5, Math.sin(a) * r);
      blob.rotation.set(i, i * 1.7, i * 0.6);
      blob.castShadow = true; g.add(blob);
    }
    /* weapons hung at the tree, as the Arabs hung them (the complaint of HUN-009) */
    for (var w = 0; w < 4; w++) {
      var sp = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.03, 1.9, 5), cast.mats.poleM);
      sp.position.set(-0.6 + w * 0.36, 0.9, 1.5);
      sp.rotation.z = 0.2 - w * 0.06;
      sp.rotation.x = 0.18;
      sp.castShadow = true; g.add(sp);
    }
    var sh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 12), cast.mats.shieldM);
    sh.position.set(0.9, 0.72, 1.2);
    sh.rotation.x = Math.PI / 2 - 0.2;
    sh.castShadow = true; g.add(sh);
    g.position.set(TREE.x, heightAt(TREE.x, TREE.z), TREE.z);
    scene.add(g);
  })();

  /* ------------------------------ the cairn at Awtas (HUN-021).
     Three stones; no figure, no blood, no killer named. */
  var cairnGroup = new THREE.Group();
  cairnGroup.userData.dynamicRoot = true;
  (function cairn() {
    [[98, 26], [99.2, 26.8], [97.2, 27.4]].forEach(function (p, i) {
      var s = 0.7 + i * 0.27;
      var r = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), new THREE.MeshLambertMaterial({ color: 0x8f8574, flatShading: true }));
      r.position.set(p[0], heightAt(p[0], p[1]) + s * 0.4, p[1]);
      r.rotation.set(i * 1.2, i * 2.1, i * 0.7);
      r.castShadow = true; r.receiveShadow = true;
      cairnGroup.add(r);
    });
    cairnGroup.visible = false;
    scene.add(cairnGroup);
  })();

  /* ------------------------------ borrowed armour at the head of the march
     (HUN-008): stacks, no figures, no count on screen. */
  var armourGroup = new THREE.Group();
  armourGroup.userData.dynamicRoot = true;
  (function armourStacks() {
    var steelM = new THREE.MeshLambertMaterial({ color: 0x9a9382 });
    var strapM = new THREE.MeshLambertMaterial({ color: 0x54422f });
    for (var i = 0; i < 8; i++) {
      var col = i % 4, row = Math.floor(i / 4);
      var px = -26 + (col - 1.5) * 0.66, pz = -150 + row * 0.55;
      var gy = heightAt(px, pz);
      var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.66, 6), steelM);
      torso.position.set(px, gy + 0.36, pz);
      torso.rotation.x = 0.08;
      torso.castShadow = true; armourGroup.add(torso);
      var shL = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 4), steelM);
      shL.position.set(px - 0.27, gy + 0.6, pz); shL.castShadow = true; armourGroup.add(shL);
      var shR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 4), steelM);
      shR.position.set(px + 0.27, gy + 0.6, pz); shR.castShadow = true; armourGroup.add(shR);
      var strap = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.03), strapM);
      strap.position.set(px, gy + 0.36, pz + 0.24); armourGroup.add(strap);
    }
    var spearM = cast.mats.poleM;
    for (var k = 0; k < 4; k++) {
      var sp = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.03, 2.1, 5), spearM);
      sp.position.set(-27.2 + k * 0.28, heightAt(-27.2, -148.6) + 1.0, -148.6 + k * 0.16);
      sp.rotation.z = 0.12 + k * 0.03;
      sp.castShadow = true; armourGroup.add(sp);
    }
    scene.add(armourGroup);
  })();

  /* ------------------------------ the dust */
  var particles = ENGINE.particles(ctx, heightAt, {
    dustBounds: { x0: -150, xs: 300, z0: -120, zs: 200 },
    dustColor: 0xd6c7a8, dustSize: 2.4, dustGain: 0.20
  });

  /* ------------------------------ the two hosts.
     About twelve thousand Muslims up from Makkah (ten thousand of the
     conquest besides the newly freed); the Hawāzin and Thaqīf mass with no
     count on screen (HUN-006, HUN-007). */
  var mLeft = cast.band(0, -22, -128, null, null);
  var mCentre = cast.band(0, 0, -128, 'the army · ten thousand and the freed', 'HUN-006');
  var mRight = cast.band(0, 22, -128, null, null);
  var mBands = [mLeft, mCentre, mRight];
  mCentre.k = 'army'; mCentre.labelY = 6.8;
  var mMass = ENGINE.crowd.build({
    side: 0, count: 12000, cols: 46, dxS: 1.55, dzS: 1.5, z0: -128, h: 1.9,
    blocks: mBands, scene: scene, divFiles: 23, divPitch: 40
  });

  var eLeft = cast.band(1, -22, 40, null, null);
  var eCentre = cast.band(1, 0, 40, 'Hawāzin and Thaqīf · no count', 'HUN-001');
  var eRight = cast.band(1, 22, 40, null, null);
  var eBands = [eLeft, eCentre, eRight];
  eCentre.k = 'enemy'; eCentre.labelY = 7.6;
  var eMass = ENGINE.crowd.build({
    side: 1, count: 5000, cols: 36, dxS: 1.6, dzS: 1.5, z0: 40, h: 2.15,
    blocks: eBands, scene: scene, divFiles: 18, divPitch: 30
  });

  /* the rally: about a hundred answer the call first (HUN-016, reported) */
  var rallyBand = cast.band(0, 10, -24, null, null);
  rallyBand.group.visible = false;
  rallyBand.group.userData.dynamicRoot = true;
  var rMass = ENGINE.crowd.build({
    side: 0, count: 100, cols: 9, dxS: 1.3, dzS: 1.5, z0: -24, h: 1.9,
    blocks: [rallyBand], scene: scene
  });

  var MASS_KEYS = ['men', 'legsL', 'legsR', 'spears', 'shields', 'rims', 'swords', 'guards', 'helms'];
  function setMassVisible(M, on) {
    for (var i = 0; i < MASS_KEYS.length; i++) M[MASS_KEYS[i]].visible = on;
  }
  setMassVisible(eMass, false);
  setMassVisible(rMass, false);

  var PLAN_M = {
    left: [[-22, -128], [-22, -84], [-54, -196], [-26, -124], [-30, -104], [-20, -40], [-22, -118], [-30, -228]],
    centre: [[0, -128], [0, -84], [2, -206], [0, -118], [0, -98], [0, -34], [0, -118], [0, -238]],
    right: [[22, -128], [22, -84], [54, -192], [26, -124], [30, -104], [20, -40], [22, -118], [30, -228]]
  };
  var PLAN_E = {
    left: [[-22, 40], [-22, 40], [-36, 10], [-30, -6], [-36, 26], [-44, 54], [-44, 54], [-44, 54]],
    centre: [[0, 40], [0, 40], [0, 10], [0, -6], [0, 30], [0, 54], [0, 54], [0, 54]],
    right: [[22, 40], [22, 40], [36, 10], [30, -6], [40, 22], [44, 54], [44, 54], [44, 54]]
  };
  mLeft.plan = PLAN_M.left; mCentre.plan = PLAN_M.centre; mRight.plan = PLAN_M.right;
  eLeft.plan = PLAN_E.left; eCentre.plan = PLAN_E.centre; eRight.plan = PLAN_E.right;

  /* ------------------------------ the standard, the mule, the reins (HUN-013).
     The station is a place, not a person: a white standard, the white mule
     held at the head, the reins hanging. No figure stands in the Prophet's
     place, at any moment, in any shot. */
  function standard(x, z, tint, withWeapons) {
    var g = new THREE.Group();
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.35, 6), cast.mats.poleM);
    pole.position.y = 2.175; pole.castShadow = true; g.add(pole);
    var shoe = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.13, 8), cast.mats.brassM);
    shoe.position.y = 0.065; g.add(shoe);
    var fin = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 6), cast.mats.brassM);
    fin.position.y = 4.40; g.add(fin);
    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.24, 5), cast.mats.brassM);
    tip.position.y = 4.60; g.add(tip);
    var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.5, 5), cast.mats.poleM);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0.72, 4.22, 0); g.add(bar);
    var geo = new THREE.PlaneGeometry(1.62, 1.06, 10, 6);
    var cloth = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
      color: tint, emissive: 0x2c261e, side: THREE.DoubleSide
    }));
    cloth.position.set(0.84, 3.65, 0);
    cloth.castShadow = true;
    cloth.userData.keep = true;
    g.add(cloth);
    cast.wavers.push({ mesh: cloth, base: geo.attributes.position.array.slice(0), w: 1.62, phase: Math.random() * 6.28 });
    if (withWeapons) {
      [[-0.55, 0.1, 0.28], [0.55, -0.12, -0.22], [0.1, 0.5, 0.34]].forEach(function (p, i) {
        var sp = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.03, 1.9, 5), cast.mats.ironM);
        sp.position.set(p[0], 0.95, p[1]);
        sp.rotation.z = 0.18 + i * 0.08;
        sp.rotation.x = (i - 1) * 0.1;
        sp.castShadow = true; g.add(sp);
      });
      var shield = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 12), cast.mats.shieldM);
      shield.position.set(0.62, 0.42, 0.7);
      shield.rotation.x = Math.PI / 2 - 0.08;
      shield.castShadow = true; g.add(shield);
    }
    g.position.set(x, heightAt(x, z), z);
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    merge.mergeMeshList(merge.collectMergeable(g), g, true);
    g.userData.dynamicRoot = true;
    scene.add(g);
    return { group: g, baseY: heightAt(x, z), x: x, z: z, fallen: 0 };
  }

  var whiteStd = standard(8.5, -33.5, 0xf4efe2);
  var ansarStd = standard(16.5, -29.5, 0xdfe6d3, true);
  ansarStd.group.rotation.z = 1.34;
  whiteStd.k = 'whiteStd'; whiteStd.label = 'the white standard';
  ansarStd.k = 'ansarStd'; ansarStd.label = 'the standard of the Anṣār';

  /* the white mule, held, with the reins hanging */
  function whiteMule(x, z, ry) {
    var g = new THREE.Group();
    var coat = new THREE.MeshLambertMaterial({ color: 0xe4dccb });
    var shade = new THREE.MeshLambertMaterial({ color: 0xc9bfa9 });
    var dark = new THREE.MeshLambertMaterial({ color: 0x3a3025 });
    var body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 8, 6), coat);
    body.scale.set(1.5, 0.72, 0.72);
    body.position.set(0, 1.30, 0);
    body.castShadow = true; g.add(body);
    var chest = new THREE.Mesh(new THREE.SphereGeometry(0.34, 7, 5), coat);
    chest.position.set(0.74, 1.32, 0);
    chest.scale.set(0.9, 0.9, 0.8);
    chest.castShadow = true; g.add(chest);
    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.95, 6), coat);
    neck.position.set(1.0, 1.72, 0);
    neck.rotation.z = -0.62;
    neck.castShadow = true; g.add(neck);
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 0.20), coat);
    head.position.set(1.36, 2.06, 0);
    head.rotation.z = -0.08;
    head.castShadow = true; g.add(head);
    [-1, 1].forEach(function (s) {
      var ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 4), shade);
      ear.position.set(1.16, 2.20, s * 0.07);
      ear.rotation.z = -0.2; ear.rotation.x = s * 0.15;
      g.add(ear);
    });
    var mane = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.06), shade);
    mane.position.set(1.1, 1.95, 0);
    mane.rotation.z = -0.62; g.add(mane);
    [[-0.5, 0.26], [-0.5, -0.26], [0.52, 0.26], [0.52, -0.26]].forEach(function (l) {
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.1, 5), coat);
      leg.position.set(l[0], 0.55, l[1]);
      leg.castShadow = true; g.add(leg);
    });
    var tail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.9, 5), shade);
    tail.position.set(-0.92, 1.28, 0);
    tail.rotation.z = 0.5; g.add(tail);
    var saddle = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.52), dark);
    saddle.position.set(0.02, 1.86, 0); g.add(saddle);
    var rein = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.5, 4), dark);
    rein.position.set(1.42, 1.35, 0.1);
    rein.rotation.z = 0.28; g.add(rein);
    var rein2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.7, 4), dark);
    rein2.position.set(1.72, 0.35, 0.1);
    rein2.rotation.z = 1.1; g.add(rein2);
    g.position.set(x, heightAt(x, z), z);
    g.rotation.y = ry;
    merge.mergeMeshList(merge.collectMergeable(g), g, true);
    g.userData.dynamicRoot = true;
    scene.add(g);
    return g;
  }
  var mule = whiteMule(12.4, -35.6, -Math.PI / 2);

  /* Mālik's banner rides with the enemy centre (HUN-001) */
  var malikStd = standard(6, 42, 0x453b2f, true);
  malikStd.k = 'malikStd'; malikStd.label = 'the banner of Mālik ibn ʿAwf · reported';
  malikStd.group.visible = false;

  /* ------------------------------ Awtas: tents, herds, goods (HUN-002).
     The families were brought up so the men would stand: the camp is goods
     and animals only. No human figure is staged here. */
  var awtasGroup = new THREE.Group();
  awtasGroup.userData.dynamicRoot = true;
  (function awtasCamp() {
    [[96, -8], [108, -12], [120, -6], [126, 6], [120, 16], [106, 18], [94, 10], [112, 2]
    ].forEach(function (p, i) {
      awtasGroup.add(props.ridgeTent(p[0], p[1], i % 3 === 0, 4.2 + (i % 2) * 0.5, 5.0 + (i % 3) * 0.4, 1.5));
    });
    var c1 = props.camel(102, 8, 0.6, awtasGroup); c1.position.y = heightAt(102, 8);
    var c2 = props.camel(122, 10, -2.1, awtasGroup); c2.position.y = heightAt(122, 10);
    scene.add(awtasGroup);
  })();

  /* ------------------------------ the flora and stores of Jiʿrānah (HUN-022).
     Built as one depot group, hidden until the spoils: bales, pens, herds,
     camels, the leather tent and the standard. No inventory list on screen. */
  function baleStack(x, z, cols, rows, parent) {
    var pale = new THREE.MeshLambertMaterial({ color: 0xc9b78f });
    var dark = new THREE.MeshLambertMaterial({ color: 0xa9946c });
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var b = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.46, 0.85), (r + c) % 2 ? pale : dark);
        b.position.set(x + (c - (cols - 1) / 2) * 1.26 + (r % 2) * 0.3, heightAt(x, z) + 0.24 + r * 0.47, z + (r - rows / 2) * 0.2);
        b.rotation.y = 0.04 * (c % 3);
        b.castShadow = true; b.receiveShadow = true;
        parent.add(b);
      }
    }
  }
  function pen(x, z, w, d, parent) {
    var m = new THREE.MeshLambertMaterial({ color: 0x8a7a5c });
    var g = new THREE.Group();
    var i;
    for (i = 0; i <= 6; i++) {
      [[x - w / 2 + (i / 6) * w, z - d / 2], [x - w / 2 + (i / 6) * w, z + d / 2]].forEach(function (p) {
        var post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.0, 5), m);
        post.position.set(p[0], heightAt(p[0], p[1]) + 0.5, p[1]);
        post.castShadow = true; g.add(post);
      });
    }
    for (i = 0; i <= 4; i++) {
      [[x - w / 2, z - d / 2 + (i / 4) * d], [x + w / 2, z - d / 2 + (i / 4) * d]].forEach(function (p) {
        var post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.0, 5), m);
        post.position.set(p[0], heightAt(p[0], p[1]) + 0.5, p[1]);
        post.castShadow = true; g.add(post);
      });
    }
    [[w, 0, 0], [w, 0, 1]].forEach(function (e, k) {
      var rail = new THREE.Mesh(new THREE.BoxGeometry(e[0], 0.08, 0.06), m);
      rail.position.set(x, heightAt(x, z) + 0.35 + k * 0.3, z + (e[2] ? d / 2 : -d / 2));
      g.add(rail);
    });
    [[d, 0, 0], [d, 0, 1]].forEach(function (e, k) {
      var rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, e[0]), m);
      rail.position.set(x + (e[2] ? w / 2 : -w / 2), heightAt(x, z) + 0.35 + k * 0.3, z);
      g.add(rail);
    });
    parent.add(g);
  }
  function flock(x, z, w, d, n, seed, parent) {
    var body = new THREE.SphereGeometry(0.30, 6, 5);
    body.scale(1.25, 0.9, 0.85);
    var geo = merge.mergeParts([
      { geo: body, p: [0, 0.52, 0], c: new THREE.Color(0xd6cdba) },
      { geo: new THREE.SphereGeometry(0.13, 5, 4), p: [0.38, 0.58, 0], c: new THREE.Color(0x8b8069) },
      { geo: new THREE.CylinderGeometry(0.035, 0.04, 0.34, 4), p: [-0.18, 0.17, 0.11], c: new THREE.Color(0x7a7059) },
      { geo: new THREE.CylinderGeometry(0.035, 0.04, 0.34, 4), p: [-0.18, 0.17, -0.11], c: new THREE.Color(0x7a7059) },
      { geo: new THREE.CylinderGeometry(0.035, 0.04, 0.34, 4), p: [0.2, 0.17, 0.11], c: new THREE.Color(0x7a7059) },
      { geo: new THREE.CylinderGeometry(0.035, 0.04, 0.34, 4), p: [0.2, 0.17, -0.11], c: new THREE.Color(0x7a7059) },
      { geo: new THREE.ConeGeometry(0.045, 0.14, 4), p: [-0.4, 0.56, 0], r: [0, 0, 1.2], c: new THREE.Color(0xd6cdba) }
    ]);
    var mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }), n);
    var dd = new THREE.Object3D();
    for (var i = 0; i < n; i++) {
      var hx = Math.abs(Math.sin((i + seed) * 12.9898) * 43758.5453) % 1;
      var hz = Math.abs(Math.sin((i + seed) * 78.233) * 19341.17) % 1;
      var px = x - w / 2 + hx * w, pz = z - d / 2 + hz * d;
      var sc = 0.8 + (Math.abs(Math.sin((i + seed) * 3.7) * 811) % 1) * 0.35;
      dd.position.set(px, heightAt(px, pz) + 0.02, pz);
      dd.rotation.set(0, hx * 6.28, 0);
      dd.scale.set(sc, sc, sc);
      dd.updateMatrix();
      mesh.setMatrixAt(i, dd.matrix);
    }
    mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh);
  }

  var depotGroup = new THREE.Group();
  var jiranahStdRef = null;
  (function jiranahDepot() {
    var g = depotGroup;
    /* the leather tent of the Ansār (HUN-028) and the two seated bands */
    var ansarTent = props.ridgeTent(2, -160, true, 5.4, 6.6, 1.75);
    ansarTent.traverse(function (o) {
      if (!o.material || !o.material.color) return;
      var hex = o.material.color.getHex();
      if (hex === 0x4b4437) o.material.color.setHex(0x6b5a42);
      else if (hex === 0x322c23) o.material.color.setHex(0x4a3d2c);
      else if (hex === 0x16100b) o.material.color.setHex(0x241b12);
    });
    g.add(ansarTent);
    [[-153.6, 0xcabfa6], [-151.4, 0xbdb39b]].forEach(function (r) {
      var strip = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.10, 1.5), new THREE.MeshLambertMaterial({ color: r[1] }));
      strip.position.set(2, heightAt(2, r[0]) + 0.05, r[0]);
      strip.receiveShadow = true;
      g.add(strip);
    });
    /* the stores */
    [[-26, -168], [14, -170], [-34, -154], [22, -158]].forEach(function (p, i) {
      g.add(props.ridgeTent(p[0], p[1], false, 3.8 + (i % 2) * 0.4, 4.6 + (i % 3) * 0.4, 1.4));
    });
    baleStack(-20, -156, 9, 3, g);
    baleStack(8, -164, 7, 4, g);
    /* the silver, stacked, never counted on screen */
    (function ingots() {
      var sM = new THREE.MeshLambertMaterial({ color: 0xb9b4a6 });
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 5; c++) {
          var ing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.20, 0.30), sM);
          ing.position.set(14 + (c - 2) * 0.78, heightAt(14, -150) + 0.12 + r * 0.21, -150 + (r % 2) * 0.06);
          ing.rotation.y = 0.05 * r;
          ing.castShadow = true;
          g.add(ing);
        }
      }
    })();
    /* the herds */
    pen(-48, -146, 24, 16, g);
    pen(30, -142, 26, 16, g);
    flock(-48, -146, 22, 14, 60, 3, g);
    flock(30, -142, 24, 14, 130, 7, g);
    flock(-38, -176, 44, 26, 150, 11, g);
    flock(34, -174, 44, 26, 150, 17, g);
    /* the camels */
    [[-14, -172, 0.5], [-8, -176, -1.9], [-20, -176, 2.6]].forEach(function (p) {
      var c = props.camel(p[0], p[1], p[2], g); c.position.y = heightAt(p[0], p[1]);
    });
    [[6, -172, 0.2], [10, -176, -2.4], [14, -172, 1.1], [18, -176, 0.7], [22, -172, -0.8], [26, -176, 2.2], [30, -172, -1.4]
    ].forEach(function (p) {
      var c = props.camel(p[0], p[1], p[2], g); c.position.y = heightAt(p[0], p[1]);
    });
    [[-30, -164, 1.6], [36, -168, -2.7]].forEach(function (p) {
      var c = props.camel(p[0], p[1], p[2], g); c.position.y = heightAt(p[0], p[1]);
    });
    /* the well and the standard of the depot */
    var w = props.well(12, -178, true); scene.remove(w); g.add(w);
    props.campClutter(-6, -150, g);
    var st = standard(-16, -156, 0xf0ead9, true);
    st.k = 'jiranahStd'; st.label = 'the standard at Jiʿrānah';
    scene.remove(st.group); g.add(st.group);
    jiranahStdRef = st;
  })();
  depotGroup.visible = false;
  depotGroup.userData.dynamicRoot = true;
  merge.mergeMeshList(merge.collectMergeable(depotGroup), depotGroup, true);
  scene.add(depotGroup);

  /* ------------------------------ the siege camp below Ṭā’if (HUN-023).
     Tents at the foot of the height: the wall and its rope are the markers. */
  var siegeGroup = new THREE.Group();
  siegeGroup.userData.dynamicRoot = true;
  (function siegeCamp() {
    [[86, 90], [104, 86], [82, 102], [100, 106]].forEach(function (p, i) {
      siegeGroup.add(props.ridgeTent(p[0], p[1], false, 3.8 + (i % 2) * 0.4, 4.6 + (i % 3) * 0.4, 1.4));
    });
    siegeGroup.add(props.campClutter(94, 96));
    merge.mergeMeshList(merge.collectMergeable(siegeGroup), siegeGroup, true);
    siegeGroup.visible = false;
    scene.add(siegeGroup);
  })();

  particles.smoke.add(94, 96);
  var siegeSmoke = particles.smoke.list[particles.smoke.list.length - 1];
  siegeSmoke.pts.visible = false;
  particles.smoke.add(-2, -166);
  var depotSmoke = particles.smoke.list[particles.smoke.list.length - 1];
  depotSmoke.pts.visible = false;

  /* ------------------------------ labels */
  function mkLabel(txt, cls) { return ENGINE.labels.mkLabel(labelBox, txt, cls); }
  var LAND = [
    { w: [0, heightAt(0, -70) + 11, -70], t: 'the valley of Ḥunayn', e: 'HUN-005', k: 'valley', cls: 'is-land-name is-far', ph: [0, 2] },
    { w: [-2, heightAt(-2, -214) + 3.4, -214], t: 'the road to Makkah', e: 'HUN-005', k: 'makkaRoad', cls: 'is-land-name is-far', ph: [7] },
    { w: [58, heightAt(58, 84) + 4.2, 84], t: 'the road to Ṭā’if', e: 'HUN-005', k: 'taifRoad', cls: 'is-land-name is-far', ph: [0, 1] },
    { w: [112, heightAt(112, 4) + 5, 4], t: 'Awtas · the families · reported', e: 'HUN-002', k: 'awtas', cls: 'is-land-name is-far', ph: [0, 1, 4] },
    { w: [150, 34, 152], t: 'Ṭā’if · the walled town', e: 'HUN-023', k: 'taif', cls: 'is-land-name is-far', ph: [0, 5] },
    { w: [-104, heightAt(-104, 28) + 13, 28], t: 'the narrow places of the valley', e: 'HUN-004', k: 'slopes', cls: 'is-land-name is-far', ph: [0, 1] },
    { w: [-6, heightAt(-6, -158) + 5.5, -158], t: 'Jiʿrānah · the spoils', e: 'HUN-022', k: 'jiranah', cls: 'is-land-name is-far', ph: [6] },
    { w: [-6, heightAt(-6, -248) + 8, -248], t: 'the pass · south to Makkah', e: 'HUN-005', k: 'pass', cls: 'is-land-name is-far', ph: [7] }
  ];
  var LANDL = LAND.map(function (l) {
    var node = mkLabel(l.t, l.cls);
    return { el: node, v: new THREE.Vector3(l.w[0], l.w[1], l.w[2]), k: l.k, ph: l.ph, tRange: l.tRange };
  });
  rallyBand.k = 'rally';
  rallyBand.label = 'about a hundred answer first · reported';
  var UNIT_DEFS = [
    { u: mCentre, side: 0, labelY: 6.8, priority: 6, ph: [0, 1, 2, 3], labelAlways: true },
    { u: eCentre, side: 1, labelY: 7.6, priority: 6, ph: [2, 3, 4], labelAlways: true },
    { u: whiteStd, side: 0, labelY: 6.6, priority: 5, event: true, ph: [2], tRange: [0.60, 1.001], labelAlways: true },
    { u: ansarStd, side: 0, labelY: 6.2, priority: 5, event: true, ph: [3], tRange: [0.80, 1.001], labelAlways: true },
    { u: malikStd, side: 1, labelY: 6.0, priority: 4, event: true, ph: [2], labelAlways: true },
    { u: jiranahStdRef, side: 0, labelY: 5.6, priority: 4, event: true, ph: [6, 7], labelAlways: true },
    { u: rallyBand, side: 0, labelY: 5.2, priority: 5, event: true, ph: [3], tRange: [0.80, 1.001], labelAlways: true }
  ];
  var ULABS = UNIT_DEFS.map(function (d) {
    d.u.k = d.u.k || ('std' + Math.round((d.u.x || 0) * 10) + Math.round((d.u.z || 0) * 10));
    d.u.labelY = d.labelY;
    d.u.priority = d.priority;
    d.u.event = !!d.event;
    if (d.ph) d.u.ph = d.ph;
    if (d.tRange) d.u.tRange = d.tRange;
    if (d.labelAlways) d.u.labelAlways = true;
    var node = mkLabel(d.u.label || '', (d.side ? '' : 'is-side') + (d.event ? ' is-event' : ''));
    return { el: node, u: d.u, k: d.u.k };
  });

  /* every beat on screen carries its ledger id in the source; the label text
     never upgrades a report into a certainty */
  var EVENT_MARKS = [
    /* phase 0 — the ground (HUN-001 … HUN-005) */
    { key: 'title', label: 'Shawwāl 8 AH · the valley of Ḥunayn', e: 'HUN-005', x: 0, y: 12, z: -30, ph: [0], tRange: [0.02, 0.26], priority: 5 },
    { key: 'coalition', label: 'Hawāzin and Thaqīf gather · reported', e: 'HUN-001', x: 4, y: 11, z: 40, ph: [0], tRange: [0.24, 0.50], priority: 4 },
    { key: 'duraids', label: 'Duraid’s warning · reported', e: 'HUN-003', x: 16, y: 8, z: 34, ph: [0], tRange: [0.46, 0.72], priority: 4 },
    { key: 'ambushWait', label: 'the enemy hides in the slopes · reported', e: 'HUN-004', x: 6, y: 12, z: 22, ph: [0], tRange: [0.70, 0.94], priority: 4 },
    /* phase 1 — the night march (HUN-006 … HUN-011) */
    { key: 'march', label: 'the army marches from Makkah · reported', e: 'HUN-005', x: -26, y: 11, z: -112, ph: [1], tRange: [0.02, 0.20], priority: 4 },
    { key: 'armour', label: 'a hundred borrowed armours · reported', e: 'HUN-008', x: -26, y: 6, z: -148, ph: [1], tRange: [0.14, 0.30], priority: 4 },
    { key: 'verse25a', label: '9:25 · “your numbers availed you nothing”', e: 'HUN-010', x: -35, y: 11, z: -92, ph: [1], tRange: [0.26, 0.40], priority: 5 },
    { key: 'dhatAnwat', label: 'Dhāt Anwāṭ · the hanging tree · reported', e: 'HUN-009', x: -44, y: 7, z: -94, ph: [1], tRange: [0.36, 0.56], priority: 4 },
    { key: 'askTree', label: 'some ask for a tree like it · reported', e: 'HUN-009', x: -44, y: 11, z: -90, ph: [1], tRange: [0.48, 0.62], priority: 4 },
    { key: 'night', label: 'the army descends before dawn · reported', e: 'HUN-011', x: -55, y: 7, z: -62, ph: [1], tRange: [0.56, 0.74], priority: 4 },
    { key: 'hidden', label: 'the enemy lies hidden · reported', e: 'HUN-004', x: -55, y: 11, z: 16, ph: [1], tRange: [0.70, 0.90], priority: 4 },
    /* phase 2 — the ambush and the stand (HUN-004, HUN-012, HUN-013) */
    { key: 'spring', label: 'the enemy springs from the slopes', e: 'HUN-012', x: 11, y: 12, z: 18, ph: [2], tRange: [0.02, 0.18], priority: 5 },
    { key: 'arrows', label: 'arrows shower on the Muslims · 9:25', e: 'HUN-012', x: 11, y: 7, z: 16, ph: [2], tRange: [0.14, 0.28], priority: 4 },
    { key: 'verse25b', label: '9:25 · “then you turned back in retreat”', e: 'HUN-012', x: 9, y: 11, z: -16, ph: [2], tRange: [0.24, 0.38], priority: 5 },
    { key: 'prophetNoFlee', label: 'the Prophet (PBUH) does not flee', e: 'HUN-013', x: 9, y: 8, z: -30, ph: [2], tRange: [0.34, 0.50], priority: 5 },
    { key: 'couplet', label: '“I am the Prophet, no lie”', e: 'HUN-013', x: 11, y: 11, z: -33, ph: [2], tRange: [0.46, 0.62], priority: 5 },
    { key: 'stationHolds', label: 'the mule is held · the reins hang', e: 'HUN-013', x: 11, y: 5.4, z: -35.6, ph: [2], tRange: [0.54, 0.76], priority: 5 },
    /* phase 3 — the call and the answer (HUN-014 … HUN-018) */
    { key: 'abbasCall', label: 'al-ʿAbbās (RA) calls the samurah', e: 'HUN-014', x: 6, y: 11, z: -44, ph: [3], tRange: [0.02, 0.18], priority: 5 },
    { key: 'answer', label: '“Here we are, here we are”', e: 'HUN-014', x: 6, y: 7, z: -38, ph: [3], tRange: [0.14, 0.28], priority: 5 },
    { key: 'ansarCall', label: '“O group of the Anṣār!”', e: 'HUN-015', x: 6, y: 11, z: -30, ph: [3], tRange: [0.26, 0.40], priority: 5 },
    { key: 'labbayk', label: '“Labbayk, O Messenger of Allah”', e: 'HUN-015', x: 6, y: 7, z: -32, ph: [3], tRange: [0.36, 0.54], priority: 4 },
    { key: 'hot', label: '“the battle has grown hot”', e: 'HUN-017', x: 6, y: 11, z: -36, ph: [3], tRange: [0.46, 0.60], priority: 5 },
    { key: 'dust', label: 'a handful of dust · “deformed faces”', e: 'HUN-018', x: 6, y: 4.5, z: -28.5, ph: [3], tRange: [0.54, 0.74], priority: 5 },
    { key: 'slave', label: '“Allah’s slave and His Messenger”', e: 'HUN-015', x: 6, y: 7, z: -33, ph: [3], tRange: [0.70, 0.86], priority: 5 },
    /* phase 4 — the enemy breaks, Awtas, the road to Ṭā’if (HUN-019 … HUN-021) */
    { key: 'enemyBreaks', label: 'the enemy breaks · reported', e: 'HUN-019', x: 30, y: 11, z: 26, ph: [4], tRange: [0.02, 0.18], priority: 5 },
    { key: 'verse26', label: '9:26 · “tranquillity on His Messenger”', e: 'HUN-020', x: 24, y: 7, z: 8, ph: [4], tRange: [0.14, 0.30], priority: 5 },
    { key: 'awtasForce', label: 'a force is sent to Awtas', e: 'HUN-021', x: 90, y: 13.5, z: 18, ph: [4], tRange: [0.32, 0.56], priority: 4 },
    { key: 'duraid', label: 'Duraid is killed at Awtas', e: 'HUN-021', x: 98, y: 7, z: 25, ph: [4], tRange: [0.50, 0.64], priority: 4 },
    { key: 'abuAmir', label: 'Abū ʿĀmir (RA) is struck at Awtas', e: 'HUN-021', x: 98, y: 11, z: 20.5, ph: [4], tRange: [0.58, 0.72], priority: 4 },
    { key: 'pursuit', label: 'the pursuit · the families · reported', e: 'HUN-002', x: 104, y: 11, z: 22, ph: [4], tRange: [0.68, 0.82], priority: 4 },
    { key: 'taifMove', label: 'the army moves on Ṭā’if · reported', e: 'HUN-023', x: 120, y: 15, z: 34, ph: [4], tRange: [0.80, 0.96], priority: 4 },
    /* phase 5 — the siege of Ṭā’if (HUN-023 … HUN-026) */
    { key: 'gather', label: 'the camp below Ṭā’if · reported', e: 'HUN-023', x: 94, y: 7, z: 96, ph: [5], tRange: [0.02, 0.18], priority: 4 },
    { key: 'siege', label: 'the siege · ten to twenty days · disputed', e: 'HUN-023', x: 132, y: 11, z: 133, ph: [5], tRange: [0.14, 0.60], priority: 5 },
    { key: 'wall', label: 'Abū Bakrah (RA) comes down the wall', e: 'HUN-024', x: TAIF_ROPE[0], y: TAIF_ROPE[1] + 1.2, z: TAIF_ROPE[2], ph: [5], tRange: [0.30, 0.44], priority: 5 },
    { key: 'gate', label: 'twenty-three come down · reported', e: 'HUN-025', x: TAIF_GATE[0], y: TAIF_GATE[1] + 4.2, z: TAIF_GATE[2], ph: [5], tRange: [0.44, 0.62], priority: 5 },
    { key: 'dua', label: '“O Allah, guide Thaqīf…” · reported', e: 'HUN-026', x: 150, y: 12, z: 152, ph: [5], tRange: [0.62, 0.80], priority: 5 },
    { key: 'lift', label: 'the siege is lifted · reported', e: 'HUN-026', x: 144, y: 8, z: 140, ph: [5], tRange: [0.76, 0.94], priority: 5 },
    /* phase 6 — the spoils at Jiʿrānah (HUN-022, HUN-027 … HUN-029) */
    { key: 'spoils', label: 'the spoils at Jiʿrānah · reported', e: 'HUN-022', x: 6, y: 7, z: -158, ph: [6], tRange: [0.02, 0.18], priority: 5 },
    { key: 'shares', label: 'the shares are counted · reported', e: 'HUN-027', x: 6, y: 11, z: -154, ph: [6], tRange: [0.14, 0.28], priority: 4 },
    { key: 'ansarHurt', label: 'the Anṣār are hurt · no share', e: 'HUN-028', x: 6, y: 11, z: -162, ph: [6], tRange: [0.24, 0.40], priority: 4 },
    { key: 'tent', label: 'the leather tent · reported', e: 'HUN-028', x: 6, y: 7, z: -160, ph: [6], tRange: [0.38, 0.58], priority: 4 },
    { key: 'tentQuote', label: '“you go with the Messenger of Allah”', e: 'HUN-028', x: 5, y: 13, z: -159, ph: [6], tRange: [0.48, 0.66], priority: 5 },
    { key: 'delegation', label: 'the Hawāzin delegation · reported', e: 'HUN-029', x: 6, y: 7, z: -150, ph: [6], tRange: [0.60, 0.78], priority: 5 },
    { key: 'captives', label: '“We prefer to have our captives”', e: 'HUN-029', x: 6, y: 11, z: -152, ph: [6], tRange: [0.70, 0.86], priority: 5 },
    { key: 'captivesHome', label: 'the captives go home · reported', e: 'HUN-029', x: 6, y: 7, z: -146, ph: [6], tRange: [0.80, 0.96], priority: 5 },
    /* phase 7 — the ʿumrah and the return (HUN-031, HUN-032) */
    { key: 'verse27', label: '9:27 · “then Allah turns to whom He wills”', e: 'HUN-020', x: -2, y: 12, z: -184, ph: [7], tRange: [0.04, 0.30], priority: 5 },
    { key: 'umrah', label: 'the ʿumrah from Jiʿrānah · reported', e: 'HUN-031', x: -2, y: 9.5, z: -182, ph: [7], tRange: [0.20, 0.50], priority: 4 },
    { key: 'return', label: 'the army leaves Jiʿrānah · reported', e: 'HUN-031', x: -4, y: 7, z: -196, ph: [7], tRange: [0.36, 0.56], priority: 5 },
    { key: 'closing', label: 'the return to Madinah · reported', e: 'HUN-031', x: -2, y: 16, z: -210, ph: [7], tRange: [0.54, 0.90], priority: 5 }
  ];
  EVENT_MARKS.forEach(function (m) {
    var g = new THREE.Group();
    g.position.set(m.x, 0, m.z);
    g.userData.dynamicRoot = true;
    scene.add(g);
    m.group = g;
    m.labelNode = mkLabel(m.label, 'is-event is-side');
  });
  EVENT_MARKS.forEach(function (m) {
    ULABS.push({ el: m.labelNode, u: { k: m.key, label: m.label, group: m.group, labelY: m.y, event: true, priority: m.priority, labelAlways: true, ph: m.ph, tRange: m.tRange }, k: m.key });
  });

  var LABELS = {
    en: {
      valley: 'the valley of Ḥunayn', makkaRoad: 'the road to Makkah',
      taifRoad: 'the road to Ṭā’if', awtas: 'Awtas · the families · reported',
      taif: 'Ṭā’if · the walled town', slopes: 'the narrow places of the valley',
      jiranah: 'Jiʿrānah · the spoils', pass: 'the pass · south to Makkah',
      army: 'the army · ten thousand and the freed',
      enemy: 'Hawāzin and Thaqīf · no count',
      whiteStd: 'the white standard · the station', ansarStd: 'the standard of the Anṣār',
      malikStd: 'Mālik’s banner · reported', jiranahStd: 'the standard at Jiʿrānah',
      rally: 'about a hundred answer first · reported',
      title: 'Shawwāl 8 AH · the valley of Ḥunayn',
      coalition: 'Hawāzin and Thaqīf gather · reported',
      duraids: 'Duraid’s warning · reported',
      ambushWait: 'the enemy hides in the slopes · reported',
      march: 'the army marches from Makkah · reported',
      armour: 'a hundred borrowed armours · reported',
      verse25a: '9:25 · “your numbers availed you nothing”',
      dhatAnwat: 'Dhāt Anwāṭ · the hanging tree · reported',
      askTree: 'some ask for a tree like it · reported',
      night: 'the army descends before dawn · reported',
      hidden: 'the enemy lies hidden · reported',
      spring: 'the enemy springs from the slopes',
      arrows: 'arrows shower on the Muslims · 9:25',
      verse25b: '9:25 · “then you turned back in retreat”',
      prophetNoFlee: 'the Prophet (PBUH) does not flee',
      couplet: '“I am the Prophet, no lie”',
      stationHolds: 'the mule is held · the reins hang',
      abbasCall: 'al-ʿAbbās (RA) calls the samurah',
      answer: '“Here we are, here we are”',
      ansarCall: '“O group of the Anṣār!”',
      labbayk: '“Labbayk, O Messenger of Allah”',
      hot: '“the battle has grown hot”',
      dust: 'a handful of dust · “deformed faces”',
      slave: '“Allah’s slave and His Messenger”',
      enemyBreaks: 'the enemy breaks · reported',
      verse26: '9:26 · “tranquillity on His Messenger”',
      awtasForce: 'a force is sent to Awtas',
      duraid: 'Duraid is killed at Awtas',
      abuAmir: 'Abū ʿĀmir (RA) is struck at Awtas',
      pursuit: 'the pursuit · the families · reported',
      taifMove: 'the army moves on Ṭā’if · reported',
      gather: 'the camp below Ṭā’if · reported',
      siege: 'the siege · ten to twenty days · disputed',
      wall: 'Abū Bakrah (RA) comes down the wall',
      gate: 'twenty-three come down · reported',
      dua: '“O Allah, guide Thaqīf…” · reported',
      lift: 'the siege is lifted · reported',
      spoils: 'the spoils at Jiʿrānah · reported',
      shares: 'the shares are counted · reported',
      ansarHurt: 'the Anṣār are hurt · no share',
      tent: 'the leather tent · reported',
      tentQuote: '“you go with the Messenger of Allah”',
      delegation: 'the Hawāzin delegation · reported',
      captives: '“We prefer to have our captives”',
      captivesHome: 'the captives go home · reported',
      verse27: '9:27 · “then Allah turns to whom He wills”',
      umrah: 'the ʿumrah from Jiʿrānah · reported',
      return: 'the army leaves Jiʿrānah · reported',
      closing: 'the return to Madinah · reported'
    },
    ur: {
      valley: 'وادیٔ حنین', makkaRoad: 'مکہ کا راستہ',
      taifRoad: 'طائف کا راستہ', awtas: 'اوطاس · خاندان · روایت میں ہے',
      taif: 'طائف · دیواروں والا شہر', slopes: 'وادی کی تنگ گھاٹیاں',
      jiranah: 'جعرانہ · مالِ غنیمت', pass: 'درہ · جنوب میں مکہ',
      army: 'لشکر · دس ہزار اور نومسلم',
      enemy: 'ہوازن اور ثقیف · تعداد نامعلوم',
      whiteStd: 'سفید پرچم · مقام', ansarStd: 'انصار کا پرچم',
      malikStd: 'مالک کا پرچم · روایت میں ہے', jiranahStd: 'جعرانہ کا پرچم',
      rally: 'تقریباً سو پہلے · روایت میں ہے',
      title: 'شوال ۸ ہجری · وادیٔ حنین',
      coalition: 'ہوازن اور ثقیف جمع · روایت میں ہے',
      duraids: 'درید کی تنبیہ · روایت میں ہے',
      ambushWait: 'دشمن تنگ گھاٹیوں میں چھپا · روایت میں ہے',
      march: 'لشکر مکہ سے روانہ · روایت میں ہے',
      armour: 'سو زرہیں مستعار · روایت میں ہے',
      verse25a: '۹:۲۵ · «فَلَمْ تُغْنِ عَنْكُمْ شَيْئًا»',
      dhatAnwat: 'ذات انواط کا درخت · روایت میں ہے',
      askTree: 'ویسا ہی درخت مانگا · روایت میں ہے',
      night: 'لشکر صبح سے پہلے اترا · روایت میں ہے',
      hidden: 'دشمن چھپا ہوا · روایت میں ہے',
      spring: 'دشمن گھاٹیوں سے نکلا',
      arrows: 'مسلمانوں پر تیر برسے · ۹:۲۵',
      verse25b: '۹:۲۵ · «ثُمَّ وَلَّيْتُمْ مُدْبِرِينَ»',
      prophetNoFlee: 'نبی ﷺ نہیں بھاگے',
      couplet: '«أَنَا النَّبِيُّ لَا كَذِب»',
      stationHolds: 'خچر کا سر تھاما · لگام لٹکی',
      abbasCall: 'عباس (رضی اللہ عنہ) نے پکارا',
      answer: '«ہم حاضر ہیں، ہم حاضر ہیں»',
      ansarCall: '«يَا مَعْشَرَ الْأَنْصَارِ»',
      labbayk: '«لَبَّيْكَ يَا رَسُولَ اللَّهِ»',
      hot: '«الْآنَ حَمِيَ الْوَطِيسُ»',
      dust: 'مٹی کی مٹھی · «شَاهَتِ الْوُجُوهُ»',
      slave: '«أَنَا عَبْدُ اللَّهِ وَرَسُولُهُ»',
      enemyBreaks: 'دشمن ٹوٹ گیا · روایت میں ہے',
      verse26: '۹:۲۶ · «سَكِينَتَهُ عَلَىٰ رَسُولِهِ»',
      awtasForce: 'اوطاس لشکر بھیجا گیا',
      duraid: 'درید اوطاس میں قتل ہوا',
      abuAmir: 'ابو عامر (رضی اللہ عنہ) زخمی ہوئے',
      pursuit: 'تعاقب · خاندان پیچھے · روایت میں ہے',
      taifMove: 'لشکر طائف کی طرف · روایت میں ہے',
      gather: 'طائف کے نیچے کیمپ · روایت میں ہے',
      siege: 'محاصرہ · دس تا بیس دن · اختلاف',
      wall: 'ابوبکرہ (رضی اللہ عنہ) دیوار سے اترے',
      gate: 'تئیس اترے · روایت میں ہے',
      dua: '«اللَّهُمَّ اهْدِ ثَقِيفًا» · روایت میں ہے',
      lift: 'محاصرہ اٹھا · روایت میں ہے',
      spoils: 'غنیمت جعرانہ میں · روایت میں ہے',
      shares: 'حصے گنے گئے · روایت میں ہے',
      ansarHurt: 'انصار کو کچھ نہ ملا',
      tent: 'چمڑے کا خیمہ · روایت میں ہے',
      tentQuote: '«تم اللہ کے رسول کے ساتھ جاؤ»',
      delegation: 'ہوازن کا وفد · روایت میں ہے',
      captives: '«ہمیں اپنے قیدی عزیز ہیں»',
      captivesHome: 'قیدی گھر لوٹے · روایت میں ہے',
      verse27: '۹:۲۷ · «ثُمَّ يَتُوبُ اللَّهُ مِن بَعْدِ ذَٰلِكَ»',
      umrah: 'جعرانہ سے عمرہ · روایت میں ہے',
      return: 'لشکر جعرانہ سے روانہ · روایت میں ہے',
      closing: 'مدینہ واپسی · روایت میں ہے'
    }
  };
  function setLang(lang) {
    var d = LABELS[lang] || LABELS.en;
    LANDL.forEach(function (it) { it.el.textContent = d[it.k] || it.el.textContent; });
    ULABS.forEach(function (it) { it.el.textContent = d[it.u.k] || it.el.textContent; });
  }

  /* ------------------------------ the static merge */
  function mergeStaticScene() {
    scene.updateMatrixWorld(true);
    WAVERS.forEach(function (w) { w.mesh.userData.keep = true; });
    mBands.concat(eBands).forEach(function (b) {
      b.group.updateMatrixWorld(true);
      merge.mergeMeshList(merge.collectMergeable(b.group), b.group, true);
      b.group.userData.dynamicRoot = true;
    });
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

  /* ------------------------------ phases and shots.
     Eight phases, one continuous shot each: no cuts inside a phase, no shakes. */
  var PHASES = [
    { id: 'ground', name: 'the valley', dur: 10 },
    { id: 'march', name: 'the night march', dur: 13 },
    { id: 'ambush', name: 'the ambush', dur: 13 },
    { id: 'call', name: 'the call', dur: 16 },
    { id: 'break', name: 'the break', dur: 14 },
    { id: 'taif', name: 'Ṭā’if', dur: 15 },
    { id: 'spoils', name: 'Jiʿrānah', dur: 16 },
    { id: 'return', name: 'the return', dur: 12 }
  ];
  var TOTAL = 0; PHASES.forEach(function (p) { TOTAL += p.dur; });

  var SHOTS = {
    ground: [
      { t0: 0, t1: 1.001, p0: [0, 26, -240], p1: [0, 18, -196], l0: [0, 6, -60], l1: [0, 5, -20],
        portrait: { p0: [-8, 14, -196], p1: [-4, 11, -176], l0: [0, 7, -104], l1: [2, 6, -80] } }
    ],
    march: [
      { t0: 0, t1: 1.001, p0: [-20, 14, -186], p1: [-24, 12, -158], l0: [-10, 4, -108], l1: [-28, 4, -56],
        portrait: { p0: [-20, 11, -160], p1: [-64, 8, -120], l0: [-20, 5, -104], l1: [-64, 4.6, -94] } }
    ],
    ambush: [
      { t0: 0, t1: 1.001, p0: [30, 10, -72], p1: [18, 8, -56], l0: [6, 4, -10], l1: [6, 3, -2],
        portrait: { p0: [11, 10, -72], p1: [11, 9, -60], l0: [11, 5, -28], l1: [11, 5, -22] } }
    ],
    call: [
      { t0: 0, t1: 1.001, p0: [16, 10, -62], p1: [12, 8, -52], l0: [8, 4, -30], l1: [8, 3.6, -26],
        portrait: { p0: [6, 10, -62], p1: [6, 9, -52], l0: [6, 5, -32], l1: [6, 4.6, -28] } }
    ],
    break: [
      { t0: 0, t1: 0.30, p0: [8, 20, -58], p1: [26, 15, -36], l0: [22, 6, 18], l1: [38, 5, 28],
        portrait: { p0: [12, 14, -18], p1: [22, 12, -6], l0: [26, 6, 26], l1: [34, 6, 32] } },
      { t0: 0.30, t1: 1.001, p0: [44, 15, -8], p1: [68, 13, 4], l0: [96, 9, 18], l1: [106, 8, 12],
        portrait: { p0: [62, 13, 6], p1: [78, 11, 10], l0: [92, 7, 20], l1: [102, 7, 22] } }
    ],
    taif: [
      { t0: 0, t1: 1.001, p0: [64, 30, 44], p1: [86, 26, 62], l0: [128, 26, 132], l1: [134, 25, 138],
        portrait: { p0: [60, 18, 62], p1: [78, 17, 80], l0: [120, 19, 122], l1: [126, 19, 130] } }
    ],
    spoils: [
      { t0: 0, t1: 1.001, p0: [-34, 24, -220], p1: [-24, 18, -196], l0: [-2, 4, -154], l1: [-4, 3.4, -150],
        portrait: { p0: [6, 13, -198], p1: [6, 11, -186], l0: [6, 5, -158], l1: [6, 5, -158] } }
    ],
    return: [
      { t0: 0, t1: 1.001, p0: [-4, 34, -126], p1: [-10, 38, -140], l0: [-22, 2, -190], l1: [-26, 3, -212],
        portrait: { p0: [-2, 16, -146], p1: [0, 14, -140], l0: [-4, 4, -190], l1: [-4, 4, -202] } }
    ]
  };
  var IMPACTS = [];
  var PRESETS = {
    ground: { p: [0, 34, -222], l: [0, 4, 20] },
    aerial: { p: [80, 190, 130], l: [40, 8, 20] },
    valley: { p: [0, 70, -190], l: [0, 4, -20] },
    march: { p: [-46, 20, -146], l: [0, 2.5, -92] },
    call: { p: [21, 9, -50], l: [9, 2.8, -29] },
    awtas: { p: [64, 26, -20], l: [112, 4, 4] },
    taif: { p: [108, 50, 98], l: [146, 29, 146] },
    spoils: { p: [-30, 17, -198], l: [-4, 2.8, -148] },
    jiranah: { p: [-14, 28, -226], l: [-2, 4, -156] },
    return: { p: [-7, 36, -136], l: [-24, 3, -200] }
  };
  var director = ENGINE.director(ctx);
  var clock = director.clock;

  /* ------------------------------ applying a frame */
  var FOG_BASE = new THREE.Color(0xb9ae99);
  var FOG_NIGHT = new THREE.Color(0x2f3238);
  var curPhaseIdx = 0, curPhaseT = 0;

  /* The march is by night and the ambush by first light (HUN-011): the day
     goes down through the ground and the march, and comes up at the rout. */
  function nightK(i, t) {
    if (i === 0) return 0.55 * easeIO(clamp01((t - 0.45) / 0.55));
    if (i === 1) return 0.58 + 0.22 * easeIO(clamp01(t / 0.7));
    if (i === 2) return 0.80 * (1 - easeIO(clamp01(t / 0.30)));
    return 0;
  }
  function applyNight(n) {
    sky.dome.material.color.setRGB(1 - 0.42 * n, 1 - 0.38 * n, 1 - 0.28 * n);
    if (sky.stars) sky.stars.material.opacity = 0.55 * n;
    if (sky.moonGlow) sky.moonGlow.material.opacity = 0.30 + 0.70 * n;
    if (sky.moonDisk) sky.moonDisk.material.opacity = 0.10 + 0.62 * n;
    sky.hemi.intensity = 0.52 * (1 - 0.30 * n);
    sky.sun.intensity = 1.10 * (1 - 0.58 * n);
    sky.fill.intensity = 0.24 * (1 - 0.30 * n);
    sky.rim.intensity = 0.24 * (1 - 0.35 * n);
    scene.fog.color.copy(FOG_BASE).lerp(FOG_NIGHT, n);
    scene.fog.near = 180 - 45 * n;
    scene.fog.far = 590 - 120 * n;
    particles.smoke.list.forEach(function (s) { s.pts.material.opacity = 0.13 * (1 - 0.45 * n); });
  }

  function moveBand(u, i, t) {
    var start = i === 0 ? u.plan[0] : u.plan[i - 1];
    var end = u.plan[i];
    var w0 = i === 0 ? 0.06 : 0.08;
    var mm = easeIO(clamp01((t - w0) / (0.84 - w0)));
    u.group.position.x = start[0] + (end[0] - start[0]) * mm;
    u.group.position.z = start[1] + (end[1] - start[1]) * mm;
    u.group.position.y = 0;
    u.group.rotation.x = 0;
  }

  /* the handful of dust thrown at the enemy's faces (HUN-018): a particle beat,
     never a face, never a figure */
  var DUST_N = MOBILE ? 60 : 110;
  var dustThrowGeo = new THREE.BufferGeometry();
  var DTV = [];
  for (var dtp = 0; dtp < DUST_N; dtp++) {
    DTV.push({
      x0: 9 + (Math.random() - 0.5) * 3.0,
      y0: 0.5 + Math.random() * 1.7,
      z0: -29 + (Math.random() - 0.5) * 2.2,
      vx: (Math.random() - 0.35) * 3.0,
      vy: 1.2 + Math.random() * 1.8,
      vz: 6.0 + Math.random() * 6.0,
      delay: Math.random()
    });
  }
  dustThrowGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DUST_N * 3), 3));
  var dustThrow = new THREE.Points(dustThrowGeo, new THREE.PointsMaterial({
    color: 0xe8d8b6, size: MOBILE ? 2.0 : 2.6, map: particles.softDot(),
    transparent: true, opacity: 0, depthWrite: false
  }));
  dustThrow.visible = false;
  scene.add(dustThrow);

  function updateDustThrow(i, t) {
    var on = i === 3 && t > 0.60 && t < 0.98;
    dustThrow.visible = on;
    if (!on) return;
    var u = clamp01((t - 0.60) / 0.30);
    dustThrow.material.opacity = Math.max(0, Math.sin(Math.PI * Math.min(1, u * 1.08)) * 0.55);
    var arr = dustThrow.geometry.attributes.position;
    for (var p = 0; p < DTV.length; p++) {
      var d = DTV[p];
      var uu = clamp01(u * 1.6 - d.delay * 0.6);
      arr.setXYZ(p,
        d.x0 + d.vx * uu * 1.4,
        d.y0 + d.vy * uu * 1.4 - 1.2 * uu * uu,
        d.z0 + d.vz * uu * 1.4);
    }
    arr.needsUpdate = true;
  }

  function applyFrac(frac) {
    var info = director.phaseInfo(frac);
    var i = info.i, t = info.t;
    curPhaseIdx = i; curPhaseT = t;

    for (var k = 0; k < mBands.length; k++) moveBand(mBands[k], i, t);
    for (var e = 0; e < eBands.length; e++) moveBand(eBands[e], i, t);

    /* the enemy hidden in the valley appears only when it springs (HUN-004, HUN-012) */
    var enemyOn = i >= 2 && i <= 4;
    eLeft.group.visible = eCentre.group.visible = eRight.group.visible = enemyOn;
    setMassVisible(eMass, enemyOn);
    malikStd.group.visible = enemyOn;
    if (enemyOn) {
      var ex = eCentre.group.position.x, ez = eCentre.group.position.z;
      malikStd.group.position.set(ex + 6, heightAt(ex + 6, ez - 4), ez - 4);
    }

    /* about a hundred answer first (HUN-016, reported) */
    var rallyOn = i === 3 || i === 4;
    setMassVisible(rMass, rallyOn);
    rallyBand.group.visible = rallyOn;

    /* the station is a place: white standard, mule, reins — never a figure (HUN-013) */
    var stationOn = i >= 1 && i <= 4;
    whiteStd.group.visible = stationOn;
    mule.visible = stationOn;

    /* the standard of the Anṣār goes down in the rout and rises at the call */
    ansarStd.group.visible = i >= 2 && i <= 4;
    var ak = i > 3 ? 1 : i === 3 ? clamp01((t - 0.20) / 0.12) : 0;
    ansarStd.group.rotation.z = 1.34 * (1 - ak);
    ansarStd.group.position.y = ansarStd.baseY + 0.10 * ak;
    ansarStd.fallen = 1 - ak;

    armourGroup.visible = i <= 1;
    cairnGroup.visible = i >= 4 && i <= 6;
    awtasGroup.visible = i <= 5;
    siegeGroup.visible = i === 5;
    depotGroup.visible = i >= 6;
    siegeSmoke.pts.visible = i === 5;
    depotSmoke.pts.visible = i >= 6;

    applyNight(nightK(i, t));
    updateDustThrow(i, t);

    var dustK = i === 1 ? 0.10 : i === 2 ? 0.34 : i === 3 ? 0.30 : i === 4 ? 0.26 :
      i === 5 ? 0.08 : i === 6 ? 0.10 : 0.08;
    particles.dust.update(dustK);
    particles.angels.update(0);

    director.applyCamera(i, t);
  }

  function crowdEnv() {
    var ph = curPhaseIdx;
    var marching = ph === 1 || ph === 2 || ph === 4 || ph === 5 || ph === 6 || ph === 7;
    return {
      ph: ph,
      frac: clock.frac,
      total: TOTAL,
      fight: ph === 3 ? 0.58 : ph === 2 ? 0.14 : ph === 4 ? 0.34 : 0.03,
      disp: ph === 0 ? 0.08 : ph === 1 ? 0.34 : ph === 2 ? 0.62 : ph === 3 ? 0.52 :
        ph === 4 ? 0.40 : ph === 5 ? 0.22 : ph === 6 ? 0.30 : 0.26,
      marching: marching,
      gaitHz: 1.0,
      gaitAmp: marching ? (ph === 2 ? 0.58 : 0.45) : 0.08,
      leanRun: ph === 2 ? 0.05 : 0,
      lod: MOBILE
    };
  }
  function updateMass() { ENGINE.crowd.update(crowdEnv()); }

  /* the arrows of the ambush (HUN-012) */
  particles.arrows.makePool(props.makeArrow, MOBILE ? 26 : 48);
  particles.arrows.pool.forEach(function (a) {
    merge.mergeMeshList(merge.collectMergeable(a.m), a.m, true);
  });

  function updateCloth(time) {
    for (var w = 0; w < WAVERS.length; w++) {
      var it = WAVERS[w];
      var attr = it.mesh.geometry.attributes.position;
      var base = it.base, cw = it.w;
      for (var v = 0; v < attr.count; v++) {
        var bx = base[v * 3], by = base[v * 3 + 1];
        var edge = (bx + cw / 2) / cw;
        attr.setZ(v, Math.sin(bx * 1.4 + time * 2.0 + it.phase + by * 0.6) * (0.03 + edge * edge * 0.16));
      }
      attr.needsUpdate = true;
    }
  }

  updateMass();

  ENGINE.runner(ctx, {
    phases: PHASES, shots: SHOTS, impacts: IMPACTS, presets: PRESETS,
    director: director,
    portrait: { cap: 1.6 },
    labels: { units: ULABS, landmarks: LANDL },
    applyFrac: applyFrac,
    updateMass: updateMass,
    crowdEnv: crowdEnv,
    setLang: setLang,
    frame: function (f) {
      var now = f.now;
      if (!reduce && !MOBILE) {
        updateCloth(now / 1000);
        particles.smoke.update(f.dt, now);
      } else if (MOBILE && (Math.floor(now / 140) % 2 === 0)) {
        updateCloth(now / 2500);
      }
      var volley = curPhaseIdx === 2 && curPhaseT > 0.02 && curPhaseT < 0.52;
      if (volley && !reduce) {
        particles.arrows.spawn(f.dt, 1.1, function (ar) {
          var ax = -40 + Math.random() * 80;
          ar.from.set(ax, 6 + Math.random() * 4, 10 + Math.random() * 24);
          ar.to.set(ax + (Math.random() - 0.5) * 12, 1.2, -70 + Math.random() * 45);
        });
      }
      particles.arrows.setAllVisible(true);
      particles.arrows.update(f.dt);
    },
    api: {
      army: function () {
        return {
          muslims: 12000,
          enemyStaged: 5000,
          enemyReported: 'no count in the reports',
          tulaqa: true,
          noOnScreenCount: true
        };
      },
      station: function () {
        return {
          standardVisible: whiteStd.group.visible,
          muleVisible: mule.visible,
          figure: false,
          reinsHang: true
        };
      },
      siege: function () {
        return {
          visible: siegeGroup.visible,
          daysRange: [10, 20],
          twelveDeadRendered: false
        };
      },
      spoils: function () {
        return {
          visible: depotGroup.visible,
          livestock: true,
          captiveFigures: false,
          inventoryOnScreen: false
        };
      },
      ground: function (x, z) { return heightAt(x, z); }
    }
  });
})();
