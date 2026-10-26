/* Khandaq · the battle in 3D — the Khandaq scene module.
   The open northern approach to Madinah, the trench cut across it, Sīlāʿ at the
   Muslim rear, the Qurayẓa forts behind the line, the three Confederate camps,
   and the seven phases that follow from one work: the ditch. Built on the
   shared ENGINE; this file carries only Khandaq's ground, layout, plans, storm,
   shots and copy. The Prophet ﷺ is never depicted; no figure shows a face;
   named acts are marked by standards, never by persons.
   Claims: data/ledger/khandaq.json (KHANDAQ-001 … KHANDAQ-038). */
(function () {
  'use strict';
  var U = ENGINE.util;
  var easeIO = U.easeIO, clamp01 = U.clamp01, smoothN = U.smoothN, fbm = ENGINE.fbm;
  var ctx = ENGINE.boot({
    failText: 'The 3D battle needs WebGL. The graded ledger in data/ledger/khandaq.json carries every fact.',
    grade: false, linearFog: true, fogColor: 0xa4967f, fogNear: 165, fogFar: 520
  });
  if (!ctx) return;
  var canvas = ctx.canvas, labelBox = ctx.labelBox, reduce = ctx.reduce, MOBILE = ctx.MOBILE;
  var renderer = ctx.renderer, scene = ctx.scene, camera = ctx.camera;

  /* ------------------------------ a bruised afternoon before the storm.
     The sun is low in the west, so the trench wall takes a raking light and
     the northern plain runs pale. The storm phase takes the light down, but
     never so far that the field loses its silhouettes. */
  var sky = ENGINE.sky(ctx, {
    zenith: 0x354962, horizon: 0xceb184, skyCurve: 0.55,
    stars: 0, starOpacity: 0,
    moon: false,
    hemiSky: 0xa8bacd, hemiGround: 0x3f3427, hemi: 0.52,
    sunColor: 0xffd8ac, sun: 1.32, sunPos: [-80, 52, -28], shadowBounds: 150, shadowFar: 380,
    fillColor: 0x8fa3ba, fill: 0.26, fillPos: [60, 34, 24],
    rimColor: 0xffe6c6, rim: 0.26, rimPos: [24, 16, -66]
  });

  /* ------------------------------ the ground.
     Axes: +x east, +z north. The enemy comes from the north (+z); the trench
     runs east-west at z = 0; the Muslim line stands behind it; Sīlāʿ rises at
     their rear (south, -z); Madinah lies beyond. The northern side is the open
     approach, the other sides are closed by mountain and palm orchard
     (KHANDAQ-005). The eastern end of the trench meets the marsh at the narrow
     crossing (KHANDAQ-011/038); the Qurayẓa forts stand on the eastern spur
     (KHANDAQ-014/035). */

  var TRENCH = { x0: -104, x1: 68, mid: -18, len: 172, depth: 2.8, halfW: 3.0 };
  var CROSS_X = 56;
  var FORT = { x: 104, z: -38 };
  var STATION = { x: -18, z: -52 };
  /* the armies are built around x = 0 by the shared crowd; every plan shifts
     them onto the ditch axis at x = -18 */
  var AXIS = -18;

  function silaCrest(x) {
    return -94 + Math.sin(x * 0.020 + 0.6) * 6 + (fbm(x * 0.012, 4.1, 3) - 0.5) * 18;
  }
  function silaFoot(x) {
    return -58 + (fbm(x * 0.019, 8.3, 2) - 0.5) * 7;
  }
  function silaH(x) {
    var h = 24 + 32 * Math.pow(Math.abs(fbm(x * 0.017 + 2.1, 1.3, 3) - 0.5) * 2, 0.88);
    h *= 0.80 + 0.34 * fbm(x * 0.05 + 4, 6.1, 2);
    h *= 1 - smoothN(x, 42, 78);
    h *= 1 - 0.30 * smoothN(-x, 66, 112);
    return h;
  }
  function sila(x, z) {
    var cz = silaCrest(x), fz = silaFoot(x);
    if (z > fz) return 0;
    var H = silaH(x), y;
    if (z >= cz) {
      var t = clamp01((fz - z) / Math.max(8, fz - cz));
      y = H * (Math.pow(t, 1.45) + 0.10 * t);
    } else {
      y = H * Math.pow(clamp01(1 - (cz - z) / 56), 0.9);
    }
    y *= 1 + 0.19 * ((fbm(x * 0.044 + 11, z * 0.044 + 3, 3) - 0.5) * 2);
    var band = 3.1, s = y / band, q = Math.floor(s), f = s - q;
    y = (q + Math.pow(f, 2.6)) * band;
    y += (fbm(x * 0.15, z * 0.15, 2) - 0.5) * 0.65 * clamp01(y / 8);
    return Math.max(0, y);
  }

  /* the western ḥarrah: a low, broken volcanic ridge the trench ties into */
  function harra(x, z) {
    var mid = smoothN(z, -74, -40) * (1 - smoothN(z, 40, 68));
    if (mid <= 0) return 0;
    var d = Math.abs(x + 130);
    var h = 16 * smoothN(34 - d, 0, 22) * (0.60 + 0.40 * fbm(z * 0.031, 2.2, 2)) * mid;
    var band = 1.8, s = h / band, q = Math.floor(s), f = s - q;
    h = (q + Math.pow(f, 2.3)) * band;
    h *= 1 + 0.26 * (fbm(x * 0.075, z * 0.075, 2) - 0.5);
    return Math.max(0, h);
  }

  /* the eastern spur: a flat-topped rock shelf carrying the Qurayẓa forts */
  function eastSpur(x, z) {
    var d = Math.hypot((x - FORT.x) / 1.15, (z - FORT.z));
    var h = 7.2 * smoothN(26 - d, 0, 11);
    h += 1.0 * Math.exp(-Math.pow((x - 92) / 7, 2) - Math.pow((z + 28) / 6, 2));
    return h;
  }

  function marshDep(x, z) {
    var d = Math.hypot((x - 76) / 1.5, (z + 14) / 0.9);
    return -1.25 * smoothN(22 - d, 0, 13);
  }

  /* the trench: a straight cut from the ḥarrah to the marsh, with a narrow
     filled neck at the crossing where the horsemen forced their way */
  function trenchCut(x, z) {
    var along = smoothN(x, -108, -102) * (1 - smoothN(x, 68, 74));
    var across = 1 - smoothN(Math.abs(z), 2.9, 4.2);
    var neck = smoothN(x, 52.5, 54.5) * (1 - smoothN(x, 58.5, 60.5));
    return -TRENCH.depth * along * across * (1 - 0.92 * neck);
  }

  function heightAt(x, z) {
    var h = sila(x, z) + harra(x, z) + eastSpur(x, z) + marshDep(x, z) + trenchCut(x, z);
    /* the station shelf at Sīlāʿ's foot: a low rise, not a structure */
    h += 1.5 * Math.exp(-Math.pow((x - STATION.x) / 12, 2) - Math.pow((z - STATION.z) / 8, 2));
    /* the plain rolls only outside the fought-over corridor */
    var out = Math.max(smoothN(Math.abs(x), 125, 210), smoothN(z, 92, 160), smoothN(-z, 78, 128));
    h += (fbm(x * 0.021 + 6.4, z * 0.021 + 3.1, 3) - 0.5) * 5.0 * out;
    h += (fbm(x * 0.058 + 1.3, z * 0.058 + 8.7, 2) - 0.5) * 1.2 * out;
    var r = Math.hypot(x, z - 4);
    h += Math.max(0, r - 200) * 0.07 * (0.6 + 0.4 * fbm(x * 0.011, z * 0.011, 2));
    h += (fbm(x * 0.33, z * 0.33, 2) - 0.5) * 0.045;
    return h;
  }

  var ROCK_LO = new THREE.Color(0x4f4b42);
  var ROCK_HI = new THREE.Color(0x938d7b);
  var ROCK = new THREE.Color();
  function colorAt(x, z, y, base) {
    var t = smoothN(y, 1.8, 7.0);
    if (t < 0.02) return null;
    var strata = 0.5 + 0.5 * Math.sin(y * 1.15 + fbm(x * 0.045, z * 0.045, 2) * 4.2);
    var grain = fbm(x * 0.21, z * 0.21, 2);
    ROCK.copy(ROCK_LO).lerp(ROCK_HI, 0.24 + 0.44 * strata + 0.12 * grain);
    var mass = smoothN(y, 22, 48);
    ROCK.multiplyScalar(0.94 - 0.13 * mass);
    if (x < -96) ROCK.multiplyScalar(0.78);
    return base.clone().lerp(ROCK, t);
  }

  ENGINE.ground(ctx, heightAt, {
    base: '#dccfb8', repeat: 32, bumpScale: 0.10,
    sand: 0xcbb994, crest: 0xd9c7a2, trough: 0x907c5d, grit: 0xb09d80,
    size: 500, seg: 230, colorAt: colorAt
  });

  var props = ENGINE.props(ctx, heightAt);
  var cast = ENGINE.cast(ctx);
  var WAVERS = cast.wavers;
  var brassM = cast.mats.brassM;

  /* talus at Sīlāʿ's foot and crags on the ḥarrah face */
  [[-84, -54, 3.0], [-70, -56, 2.2], [-54, -57, 2.6], [-38, -55, 3.2], [-24, -57, 2.1],
   [-8, -56, 2.8], [8, -57, 2.3], [24, -55, 2.9], [40, -56, 2.0], [54, -55, 2.4]
  ].forEach(function (r) { var k = props.rock(r[0], r[1], r[2]); k.position.y = heightAt(r[0], r[1]); });
  [[-104, -40, 2.6], [-96, -34, 2.0], [-92, -22, 2.4], [-96, 10, 2.8], [-90, 22, 2.1],
   [-86, 34, 2.4], [-102, 4, 2.2], [-98, -6, 1.8], [84, -44, 2.4], [92, -50, 1.8],
   [116, -30, 2.2], [124, -40, 1.9], [86, -24, 1.7]
  ].forEach(function (r) { var k = props.rock(r[0], r[1], r[2]); k.position.y = heightAt(r[0], r[1]); });

  props.pebbleField(320, -100, -22, 200, 120);
  props.scrubField(240, 7);

  /* palms: the orchards that close the flanks and the southern rear (005) */
  [[-96, -46, 4.4, 0.8], [-102, -38, 3.8, 0.5], [-90, -54, 4.0, 0.9], [-82, -46, 3.4, 0.6],
   [72, -46, 4.2, 0.8], [82, -50, 3.6, 0.5], [90, -46, 4.4, 0.9], [96, -54, 3.4, 0.6],
   [-118, 24, 3.8, 0.7], [-124, 32, 3.2, 0.5], [116, 22, 3.6, 0.6], [122, 30, 3.0, 0.8],
   [-46, -50, 4.2, 0.7], [-34, -48, 3.6, 0.5], [50, -50, 3.8, 0.6], [42, -44, 3.2, 0.8]
  ].forEach(function (p) { props.palm(p[0], p[1], p[2], p[3]); });

  /* ------------------------------ the trench itself.
     The terrain is cut, then the cut is lined with a dark floor, two walls and
     two spoil berms, so the ditch reads at every angle. The lining stops short
     of the filled neck at the crossing; the causeway spans it. */
  var trenchMat = new THREE.MeshLambertMaterial({ color: 0x4c3e2d });
  var wallMat = new THREE.MeshLambertMaterial({ color: 0x5b4a36 });
  var bermMat = new THREE.MeshLambertMaterial({ color: 0xa8916b });
  var causewayMat = new THREE.MeshLambertMaterial({ color: 0x8d7654 });
  var spoilMat = new THREE.MeshLambertMaterial({ color: 0xb19a72 });

  var BERM_W = 2.8, BERM_OFF = TRENCH.halfW + 1.75;
  function bermSpan(xa, xb, sgn) {
    var L = xb - xa, SEG = Math.max(24, Math.round(L / 1.6));
    var geo = new THREE.PlaneGeometry(L, BERM_W, SEG, 3);
    geo.rotateX(-Math.PI / 2);
    var pa = geo.attributes.position;
    for (var i = 0; i < pa.count; i++) {
      var bx = pa.getX(i), bz = pa.getZ(i);
      var ridge = Math.pow(Math.max(0, 1 - Math.abs(bz) / (BERM_W / 2)), 1.5);
      var noise = 0.78 + 0.28 * fbm((xa + L / 2 + bx) * 0.09 + (sgn > 0 ? 3 : 9), 2.2, 2);
      pa.setY(i, 0.02 + 0.50 * ridge * noise);
    }
    geo.computeVertexNormals();
    var m = new THREE.Mesh(geo, bermMat);
    m.position.set(xa + L / 2, 0, sgn * BERM_OFF);
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }
  function liningSpan(xa, xb) {
    var L = xb - xa, cx = xa + L / 2;
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(L, TRENCH.halfW * 1.8), trenchMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, -TRENCH.depth - 0.05, 0);
    floor.receiveShadow = true;
    scene.add(floor);
    [-1, 1].forEach(function (sgn) {
      var wall = new THREE.Mesh(new THREE.BoxGeometry(L, TRENCH.depth + 0.12, 0.18), wallMat);
      wall.position.set(cx, -TRENCH.depth / 2, sgn * TRENCH.halfW);
      wall.castShadow = true; wall.receiveShadow = true;
      scene.add(wall);
      bermSpan(xa, xb, sgn);
    });
  }
  var NECK_HALF = 4.6;
  liningSpan(TRENCH.x0 + 8, CROSS_X - NECK_HALF);
  liningSpan(CROSS_X + NECK_HALF, TRENCH.x1 - 2);

  /* the causeway at the neck: a narrow mud track across the filled cut */
  var causeway = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.16, 5.6), causewayMat);
  causeway.position.set(CROSS_X, heightAt(CROSS_X, 0) + 0.05, 0);
  causeway.receiveShadow = true;
  scene.add(causeway);

  /* spoil heaps, picks and baskets along the southern berm (004) */
  for (var sp = 0; sp < 16; sp++) {
    var sx = -92 + sp * 9 + (sp % 2 ? 2.4 : 0);
    var sm = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), spoilMat);
    sm.scale.set(0.8 + (sp % 3) * 0.25, 0.28, 0.55 + (sp % 4) * 0.12);
    sm.position.set(sx, heightAt(sx, -6.1) + 0.16, -6.1 + (sp % 2 ? 0.5 : -0.2));
    sm.rotation.y = sp * 1.7;
    sm.castShadow = true; sm.receiveShadow = true;
    scene.add(sm);
  }
  var toolWood = cast.mats.woodM, toolIron = cast.mats.ironM;
  for (var pk = 0; pk < 14; pk++) {
    var px = -90 + pk * 10 + (pk % 2 ? 2.2 : 0);
    var pick = new THREE.Group();
    var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 1.05, 5), toolWood);
    handle.rotation.z = 0.55;
    handle.position.y = 0.48;
    pick.add(handle);
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.07, 0.06), toolIron);
    head.position.set(0.27, 0.94, 0);
    head.rotation.z = 0.55;
    pick.add(head);
    pick.position.set(px, 0.02, -6.5);
    pick.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(pick);
  }
  for (var bk = 0; bk < 10; bk++) {
    var bx2 = -86 + bk * 13 + (bk % 3 ? 1.4 : 0);
    var basket = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.15, 0.24, 7, 1, true), toolWood);
    basket.position.set(bx2, 0.12, -6.2);
    basket.castShadow = true;
    scene.add(basket);
  }
  /* broken stone on both crests, so the berms are not clean sand ridges.
     One instanced batch: the Phong rocks are not part of the Lambert merge. */
  var bankStones = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.34, 0),
    new THREE.MeshLambertMaterial({ color: 0x83755f, flatShading: true }), 44
  );
  var bankD = new THREE.Object3D();
  for (var br = 0; br < 44; br++) {
    var bxr = -101 + br * 3.9 + (br % 3) * 0.8;
    var bzr = (br % 2 ? 1 : -1) * (4.5 + (br % 5) * 0.26);
    var bs = 0.55 + (br % 4) * 0.18;
    bankD.position.set(bxr, heightAt(bxr, bzr) + 0.08, bzr);
    bankD.rotation.set(br * 0.7, br * 1.3, br * 0.4);
    bankD.scale.set(bs * 1.35, bs * 0.7, bs);
    bankD.updateMatrix();
    bankStones.setMatrixAt(br, bankD.matrix);
  }
  bankStones.castShadow = true; bankStones.receiveShadow = true;
  scene.add(bankStones);

  /* the work line on the southern lip: faceless figures with picks, bending
     into the cut while the trench phase runs. Merged per figure, so sixteen
     men cost sixteen draw calls, not a crowd. */
  var workersMark = new THREE.Group();
  workersMark.userData.dynamicRoot = true;
  scene.add(workersMark);
  var WORKERS = [];
  var pickWoodM = new THREE.MeshLambertMaterial({ color: 0x4c3f2c });
  for (var wk = 0; wk < 16; wk++) {
    var wx = -96 + wk * 9.8 + (wk % 2 ? 1.4 : 0);
    var wz = -6.0 - (wk % 3) * 0.25;
    var wf = cast.makeFighter({
      x: 0, y: 0, z: 0, ry: (wk % 2 ? 0.16 : -0.12),
      robe: wk % 3 === 0 ? 0x87795f : 0x96886d, robeDark: 0x5d5341,
      weapon: null, shield: false, scale: 1.02
    });
    scene.remove(wf.group);
    var wpick = new THREE.Group();
    var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.95, 5), pickWoodM);
    wh.position.y = -0.08; wh.rotation.z = 0.34;
    wpick.add(wh);
    var whd = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.07), toolIron);
    whd.position.set(0.18, -0.40, 0); whd.rotation.z = 0.34;
    wpick.add(whd);
    wpick.position.set(0.02, -0.58, 0.06);
    wf.armR.add(wpick);
    wf.group.position.set(wx, heightAt(wx, wz), wz);
    wf.group.rotation.x = 0.18;
    wf.group.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    ENGINE.merge.mergeMeshList(ENGINE.merge.collectMergeable(wf.group), wf.group, true);
    wf.group.userData.dynamicRoot = true;
    workersMark.add(wf.group);
    WORKERS.push({ g: wf.group, base: 0.18, ph: wk * 0.9 });
  }

  /* arrows left in the berms after the exchanges (009) */
  var stuckArrows = new THREE.Group();
  for (var sa = 0; sa < 40; sa++) {
    var arw = props.makeArrow();
    var ax = -88 + Math.random() * 148;
    var az = (Math.random() < 0.5 ? -1 : 1) * (4.9 + Math.random() * 0.7);
    arw.position.set(ax, heightAt(ax, az) + 0.28, az);
    arw.rotation.x = 1.0 + Math.random() * 0.55;
    arw.rotation.z = (Math.random() - 0.5) * 0.8;
    stuckArrows.add(arw);
  }
  stuckArrows.visible = false;
  scene.add(stuckArrows);

  /* ------------------------------ the marsh at the eastern crossing (011) */
  var waterM = props.mats.waterM;
  var shoreM = new THREE.MeshLambertMaterial({ color: 0x8a7c62 });
  [[78, -12, 8.4, 1.45, 0.8, -0.58], [70, -8, 5.0, 1.1, 0.7, -0.52], [85, -18, 5.6, 1.25, 0.7, -0.58]
  ].forEach(function (w) {
    var shore = new THREE.Mesh(new THREE.CircleGeometry(w[2] * 1.4, 20), shoreM);
    shore.rotation.x = -Math.PI / 2;
    shore.scale.set(w[3], w[4], 1);
    shore.position.set(w[0], w[5] - 0.04, w[1]);
    scene.add(shore);
    var pool = new THREE.Mesh(new THREE.CircleGeometry(w[2], 20), waterM);
    pool.rotation.x = -Math.PI / 2;
    pool.scale.set(w[3], w[4], 1);
    pool.position.set(w[0], w[5], w[1]);
    scene.add(pool);
  });
  var REEDS = 110;
  var reedGeo = new THREE.ConeGeometry(0.022, 0.62, 4);
  var reeds = new THREE.InstancedMesh(reedGeo, new THREE.MeshLambertMaterial({ color: 0x6f7a4a }), REEDS);
  var reedD = new THREE.Object3D(), reedN = 0;
  for (var rd = 0; rd < 500 && reedN < REEDS; rd++) {
    var rx = 62 + Math.random() * 34, rz = -30 + Math.random() * 28;
    var gy = heightAt(rx, rz);
    if (gy > -0.12) continue;
    reedD.position.set(rx, gy + 0.26, rz);
    reedD.rotation.set((Math.random() - 0.5) * 0.35, Math.random() * 3, (Math.random() - 0.5) * 0.35);
    reedD.scale.setScalar(0.7 + Math.random() * 0.9);
    reedD.updateMatrix();
    reeds.setMatrixAt(reedN++, reedD.matrix);
  }
  reeds.count = reedN;
  scene.add(reeds);

  /* ------------------------------ the forts of Banū Qurayẓa (014/035).
     Stone walls on the eastern spur, a gate that faces the enemy side. The
     gate opens in the covenant phase and stays open: the pact broken, supplies
     going through, no figure shown. */
  var fort = new THREE.Group();
  fort.position.set(FORT.x, heightAt(FORT.x, FORT.z) - 0.08, FORT.z);
  fort.rotation.y = 0.10;
  scene.add(fort);
  var fortStone = new THREE.MeshLambertMaterial({ color: 0x8b806c, emissive: 0x2a241b });
  var fortStone2 = new THREE.MeshLambertMaterial({ color: 0xa1937a, emissive: 0x2a241b });
  var gateWood = new THREE.MeshLambertMaterial({ color: 0x5d4830, emissive: 0x1c1610 });

  var plinth = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.6, 15.6), fortStone);
  plinth.position.y = -0.28; plinth.receiveShadow = true; fort.add(plinth);
  /* south, east and west curtains */
  [[0, -7.05, 19, 0.8], [-9.1, 0, 0.8, 14.9], [9.1, 0, 0.8, 14.9]].forEach(function (w) {
    var wall = new THREE.Mesh(new THREE.BoxGeometry(w[2], 4.4, w[3]), fortStone2);
    wall.position.set(w[0], 2.2, w[1]);
    wall.castShadow = true; wall.receiveShadow = true;
    fort.add(wall);
  });
  /* north curtain leaves a gate 3.6 wide */
  [-5.4, 5.4].forEach(function (gx) {
    var wall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 4.4, 0.8), fortStone2);
    wall.position.set(gx, 2.2, 7.05);
    wall.castShadow = true; wall.receiveShadow = true;
    fort.add(wall);
  });
  var lintel = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.9, 0.9), fortStone);
  lintel.position.set(0, 4.0, 7.05);
  lintel.castShadow = true; fort.add(lintel);
  /* corner towers */
  [[-9.1, -7.05], [9.1, -7.05], [-9.1, 7.05], [9.1, 7.05]].forEach(function (c) {
    var tower = new THREE.Mesh(new THREE.BoxGeometry(2.7, 6.2, 2.7), fortStone);
    tower.position.set(c[0], 3.0, c[1]);
    tower.castShadow = true; tower.receiveShadow = true;
    fort.add(tower);
  });
  /* crenellations along the curtains */
  for (var cr = 0; cr < 22; cr++) {
    var cx2 = -9 + cr * 0.86;
    if (Math.abs(cx2) < 2.0) continue;
    var merlon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.55), fortStone);
    merlon.position.set(cx2, 4.65, 7.05); fort.add(merlon);
    var merlonS = merlon.clone(); merlonS.position.z = -7.05; fort.add(merlonS);
  }
  for (var cr2 = 0; cr2 < 16; cr2++) {
    var cz2 = -7 + cr2 * 0.9;
    [-9.1, 9.1].forEach(function (ex) {
      var merlonE = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.62, 0.5), fortStone);
      merlonE.position.set(ex, 4.65, cz2); fort.add(merlonE);
    });
  }
  /* the keep at the back */
  var keep = new THREE.Mesh(new THREE.BoxGeometry(6.4, 5.4, 5.0), fortStone2);
  keep.position.set(-0.6, 2.7, -3.4);
  keep.castShadow = true; keep.receiveShadow = true; fort.add(keep);
  var keepCap = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.4, 5.5), fortStone);
  keepCap.position.set(-0.6, 5.6, -3.4); fort.add(keepCap);
  /* shallow buttresses break the long curtains */
  [[-6.6, 7.55], [6.6, 7.55], [-6.6, -7.55], [6.6, -7.55]].forEach(function (bp) {
    var bt = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.6, 0.42), fortStone2);
    bt.position.set(bp[0], 2.3, bp[1]);
    bt.castShadow = true; bt.receiveShadow = true; fort.add(bt);
  });
  /* arrow slits on the north and south curtains */
  var slitM = new THREE.MeshLambertMaterial({ color: 0x2a241c });
  [[-7.2, 7.49], [-4.2, 7.49], [4.2, 7.49], [7.2, 7.49], [-7.2, -7.49], [7.2, -7.49]].forEach(function (sl) {
    var sm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.05, 0.08), slitM);
    sm.position.set(sl[0], 3.0, sl[1]); fort.add(sm);
  });
  /* packed-earth apron outside the gate */
  var apron = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.1, 5.2), new THREE.MeshLambertMaterial({ color: 0xb09a74 }));
  apron.position.set(0, 0.05, 9.6); apron.receiveShadow = true; fort.add(apron);
  /* fallen stone at the wall foot */
  var rubbleM = new THREE.MeshLambertMaterial({ color: 0x7f725d, flatShading: true });
  [[-11.4, 8.4, 0.7], [11.6, 8.8, 0.9], [-12.2, -2.0, 0.6], [12.1, -3.4, 0.8]].forEach(function (rb) {
    var rm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), rubbleM);
    rm.position.set(rb[0], 0.3, rb[1]);
    rm.scale.setScalar(rb[2]);
    rm.rotation.set(rb[0], rb[1], 0);
    rm.castShadow = true; rm.receiveShadow = true; fort.add(rm);
  });

  var gateL = new THREE.Group(), gateR = new THREE.Group();
  gateL.position.set(-1.8, 0, 7.05);
  gateR.position.set(1.8, 0, 7.05);
  gateL.userData.dynamicRoot = true; gateR.userData.dynamicRoot = true;
  [[gateL, 0.88, 1], [gateR, -0.88, -1]].forEach(function (g) {
    var leaf = new THREE.Mesh(new THREE.BoxGeometry(1.75, 3.3, 0.16), gateWood);
    leaf.position.set(g[1], 1.65, 0);
    leaf.castShadow = true; leaf.receiveShadow = true;
    g[0].add(leaf);
    [[0.7, 2.4], [0.7, 1.0]].forEach(function (band) {
      var b = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.12, 0.19), cast.mats.ironM);
      b.position.set(g[1], band[1], 0.01);
      g[0].add(b);
    });
  });
  fort.add(gateL); fort.add(gateR);
  /* a sand yard inside the gate, so an open gate reads as a courtyard and
     not as a black hole in the wall */
  var yard = new THREE.Mesh(new THREE.BoxGeometry(17.4, 0.12, 13.2), new THREE.MeshLambertMaterial({ color: 0xc0aa83, emissive: 0x2a2318 }));
  yard.position.y = 0.04; yard.receiveShadow = true; fort.add(yard);
  /* two banners on the gate towers, for scale against the walls */
  [[-9.1, 7.05], [9.1, 7.05]].forEach(function (tp) {
    var fp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.4, 6), props.mats.poleM);
    fp.position.set(tp[0], 7.3, tp[1] + 0.9); fort.add(fp);
    var fc = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.72), new THREE.MeshLambertMaterial({ color: 0x5a4a3a, emissive: 0x1a140e, side: THREE.DoubleSide }));
    fc.position.set(tp[0] + 0.54, 8.35, tp[1] + 0.9); fort.add(fc);
  });

  /* ------------------------------ the guarded quarter behind the line.
     A low walled enclosure for the women and children's garrison (015): a
     quiet, low compound behind the right of the line, not a monument. */
  var quarter = new THREE.Group();
  quarter.position.set(30, heightAt(30, -48), -48);
  scene.add(quarter);
  var qWallM = new THREE.MeshLambertMaterial({ color: 0x9a8768 });
  [[0, -6.2, 18, 0.5], [0, 6.2, 18, 0.5], [-9, 0, 0.5, 12], [9, 0, 0.5, 12]].forEach(function (w) {
    var q = new THREE.Mesh(new THREE.BoxGeometry(w[2], 1.7, w[3]), qWallM);
    q.position.set(w[0], 0.85, w[1]);
    q.castShadow = true; q.receiveShadow = true;
    quarter.add(q);
  });
  [[25, -50], [31, -51], [37, -49]].forEach(function (t) {
    var tent = props.ridgeTent(t[0], t[1], false, 2.6, 3.2, 0.95);
    tent.position.y = heightAt(t[0], t[1]) - 0.02;
  });

  /* ------------------------------ the Prophet's station at Sīlāʿ (019/033).
     An empty ring around a standard; the Prophet ﷺ is never depicted. */
  var stationMark = new THREE.Group();
  var stationY = heightAt(STATION.x, STATION.z);
  stationMark.position.set(STATION.x, stationY, STATION.z);
  stationMark.userData.keep = true;
  scene.add(stationMark);
  var stationStd = cast.eventStandard(0, 0, 0, 0, false, stationMark);
  stationStd.position.y = 0.42;
  stationStd.scale.setScalar(1.6);
  var stationBase = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.7, 0.42, 16), props.mats.stoneDark);
  stationBase.position.y = 0.2;
  stationBase.castShadow = true; stationBase.receiveShadow = true;
  stationMark.add(stationBase);
  for (var st = 0; st < 6; st++) {
    var aa = (st / 6) * Math.PI * 2 + 0.34;
    var rr = 3.2;
    var sf = cast.makeFighter({
      x: Math.cos(aa) * rr, y: heightAt(STATION.x + Math.cos(aa) * rr, STATION.z + Math.sin(aa) * rr) - stationY,
      z: Math.sin(aa) * rr, ry: -aa + Math.PI / 2,
      robe: 0x8f8269, robeDark: 0x5c5343, weapon: 'sword', shield: true, scale: 0.98
    });
    scene.remove(sf.group);
    stationMark.add(sf.group);
  }
  for (var slab = 0; slab < 7; slab++) {
    var sb = new THREE.Mesh(new THREE.BoxGeometry(1.7 + (slab % 2) * 0.4, 0.12, 0.6), props.mats.stoneDark);
    var sba = slab / 7 * Math.PI * 2;
    sb.position.set(Math.cos(sba) * 3.7, 0.06, Math.sin(sba) * 3.7);
    sb.rotation.y = sba;
    sb.castShadow = true; sb.receiveShadow = true;
    stationMark.add(sb);
  }
  /* four dark pennants make the empty station read from a distance */
  for (var sp2 = 0; sp2 < 4; sp2++) {
    var pa = sp2 / 4 * Math.PI * 2 + 0.6;
    var px2 = Math.cos(pa) * 3.3, pz2 = Math.sin(pa) * 3.3;
    var py2 = heightAt(STATION.x + px2, STATION.z + pz2) - stationY;
    var sp3 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.0, 6), props.mats.poleM);
    sp3.position.set(px2, py2 + 1.5, pz2);
    sp3.castShadow = true;
    stationMark.add(sp3);
    var sflag = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.9), new THREE.MeshLambertMaterial({ color: 0x47533c, side: THREE.DoubleSide }));
    sflag.position.set(px2 + 0.3, py2 + 2.55, pz2);
    stationMark.add(sflag);
  }

  /* ------------------------------ the Confederate camps.
     Three contingents, separate standards (034): Quraysh and Tihāmah under
     Abū Sufyān, Ghaṭafān and the eastern tribes, and the allied wings. The
     tents stand on the flanks and at the rear of the northern approach; the
     storm tents stay live so the wind can take them down (023). */
  var campTents = [];
  [[-114, 64], [-106, 72], [-114, 82], [106, 64], [114, 72], [106, 82],
   [-22, 106], [-8, 114], [8, 106], [-2, 110], [16, 108], [24, 116]
  ].forEach(function (t, k) {
    var tent = props.ridgeTent(t[0], t[1], true, 3.6 + (k % 2) * 0.3, 4.4, 1.3);
    campTents.push(tent);
  });
  [[-110, 72], [110, 72], [0, 110]].forEach(function (c) {
    var clutter = props.campClutter(c[0], c[1]);
    clutter.position.y = heightAt(c[0], c[1]);
  });
  [[-108, 78, 0.5], [-100, 76, -0.2], [110, 78, 0.4], [118, 80, 0.8], [6, 112, -0.4], [-4, 114, 0.3]
  ].forEach(function (c) {
    var camel = props.camel(c[0], c[1], c[2]);
    camel.position.y = heightAt(c[0], c[1]);
  });
  [[-106, 68, 1.2], [112, 69, -1.4], [8, 108, 0.4]].forEach(function (h) {
    var horse = props.horse(h[0], h[1], h[2], true);
    horse.position.y = heightAt(h[0], h[1]);
  });

  /* live storm tents inside the northern camp */
  var stormTents = [];
  [[-12, 96], [0, 100], [12, 94], [-22, 100]].forEach(function (t, k) {
    var tent = props.ridgeTent(t[0], t[1], true, 3.8, 4.6, 1.35);
    tent.userData.keep = true;
    stormTents.push({ g: tent, y: tent.position.y, dir: k % 2 ? 1 : -1, lean: 0.95 + k * 0.05 });
  });
  var stormPots = [];
  [[-6, 94], [6, 98], [18, 96]].forEach(function (p) {
    var pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.34, 8), new THREE.MeshLambertMaterial({ color: 0x7a6a4e }));
    pot.position.set(p[0], heightAt(p[0], p[1]) + 0.17, p[1]);
    pot.castShadow = true;
    pot.userData.keep = true;
    scene.add(pot);
    stormPots.push({ m: pot, y: pot.position.y });
  });

  var particles = ENGINE.particles(ctx, heightAt, {
    dustBounds: { x0: -100, xs: 200, z0: -24, zs: 44 },
    dustColor: 0xc8bda6, dustSize: 2.4, dustGain: 0.24
  });
  particles.smoke.add(-110, 76); particles.smoke.add(110, 76); particles.smoke.add(0, 112);
  particles.dust.material.color.setHex(0xc6bba4);

  /* ------------------------------ the bands and plans.
     No Muslim commander is named by the spine for this battle; the three
     Muslim battalions carry one line label. The Confederate wings carry the
     contingent names the spine gives (034). Homes match the crowd divisions,
     and every plan carries the AXIS shift onto the ditch. */
  var mLeft = cast.band(0, -56, -20);
  var mCentre = cast.band(0, 0, -20);
  var mRight = cast.band(0, 56, -20);
  var qLeft = cast.band(1, -62, 40);
  var qCentre = cast.band(1, 0, 40);
  var qRight = cast.band(1, 62, 40);
  var mBands = [mLeft, mCentre, mRight];
  var qBands = [qLeft, qCentre, qRight];
  mCentre.label = 'the Muslim line · about 3,000'; mCentre.entry = 'KHANDAQ-008'; mCentre.k = 'mline';
  qCentre.label = 'Quraysh · about 4,000 · Abū Sufyān'; qCentre.entry = 'KHANDAQ-002'; qCentre.k = 'qcentre';
  qLeft.label = 'Kinanāh and the Tihāmah allies'; qLeft.entry = 'KHANDAQ-034'; qLeft.k = 'qwest';
  qRight.label = 'Ghaṭafān and the eastern tribes'; qRight.entry = 'KHANDAQ-034'; qRight.k = 'qeast';

  var PH = ['ground', 'trench', 'siege', 'crossing', 'covenant', 'storm', 'reckoning'];
  function P(x, z, o) {
    o = o || {};
    return { x: x, z: z, ry: o.ry || 0, tilt: o.tilt || 0, fallAt: o.fallAt };
  }
  function initPlan(u) {
    u.plan = [];
    for (var i = 0; i < PH.length; i++) u.plan[i] = P(u.home[0] + AXIS, u.home[1]);
  }
  mBands.concat(qBands).forEach(initPlan);

  /* Muslims: hold the lip while the ditch is cut, stand to it, hold through
     the crossing, close the shaken line, hold the storm, stand fast. The
     crowd front rank sits some five paces behind the banner, so the work
     phase only leans the line forward, never onto the cut. */
  mLeft.plan[1] = P(-74, -20);
  mCentre.plan[1] = P(-18, -19.6);
  mRight.plan[1] = P(38, -20);
  mLeft.plan[2] = P(-74, -20.5, { tilt: -0.02 });
  mCentre.plan[2] = P(-18, -19.5);
  mRight.plan[2] = P(38, -20.5, { tilt: -0.02 });
  mLeft.plan[3] = P(-74, -20);
  mCentre.plan[3] = P(-18, -19.5);
  mRight.plan[3] = P(38, -20);
  mLeft.plan[4] = P(-78, -26, { tilt: -0.03 });
  mCentre.plan[4] = P(-20, -22);
  mRight.plan[4] = P(34, -26, { tilt: -0.03 });
  mLeft.plan[5] = P(-72, -20);
  mCentre.plan[5] = P(-18, -19);
  mRight.plan[5] = P(36, -20);
  mLeft.plan[6] = P(-78, -19);
  mCentre.plan[6] = P(-18, -16);
  mRight.plan[6] = P(34, -19);

  /* Confederates: watch the work, close on the trench, press the eastern end,
     draw apart as distrust spreads (021), then fall back through the storm. */
  qBands.forEach(function (u, idx) {
    var x = u.home[0] + AXIS, side = idx === 0 ? -1 : (idx === 2 ? 1 : 0);
    u.plan[1] = P(x, 36);
    u.plan[2] = P(x, 17 + idx * 0.6, { tilt: 0.02 });
    u.plan[3] = P(x + side * 4, 18 + idx * 0.7);
    u.plan[4] = P(x + side * 18, 24, { tilt: 0.03 });
    u.plan[5] = P(x + side * 5, 66, { tilt: 0.03 });
    u.plan[6] = P(x + side * 5, 66);
    u._stag = idx * 0.04;
  });

  /* ------------------------------ the horse at the crossing (011/038) */
  function cavalrySquadron(n, cols, dx, dz, dark) {
    var g = new THREE.Group();
    var k = 0;
    for (var r = 0; r < Math.ceil(n / cols); r++) {
      for (var c = 0; c < cols && k < n; c++, k++) {
        var jr = Math.sin(k * 5.3) * 0.11;
        var hx = (c - (cols - 1) / 2) * dx + (Math.abs(Math.sin(k * 5.7)) % 1 - 0.5) * 0.55;
        var hz = r * dz + (c % 2) * 0.55 + (Math.abs(Math.sin(k * 3.1)) % 1 - 0.5) * 0.55;
        var hs = props.horse(0, 0, 0, dark);
        scene.remove(hs);
        hs.position.set(hx, 0, hz);
        hs.rotation.y = jr;
        g.add(hs);
        var rider = cast.makeFighter({
          x: 0, y: 0, z: 0, ry: 0,
          robe: dark ? 0x3d362b : 0xcfc6b2, robeDark: dark ? 0x251f18 : 0x8a7a60,
          weapon: 'spear', shield: true, helmet: dark, scale: 0.9
        });
        scene.remove(rider.group);
        rider.group.position.set(hx - 0.1, 1.58, hz);
        rider.group.rotation.y = jr;
        g.add(rider.group);
      }
    }
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    ENGINE.merge.mergeMeshList(ENGINE.merge.collectMergeable(g), g, true);
    g.userData.dynamicRoot = true;
    scene.add(g);
    return { group: g, label: null, entry: null, side: 1, k: 'cav', labelY: 4.0, home: [94, 24] };
  }
  var cav = cavalrySquadron(10, 5, 1.9, 2.7, true);
  cav.group.position.set(94, heightAt(94, 24), 24);

  /* ------------------------------ the crossing standards.
     ʿAmr's challenge and ʿAlī's answer are marked by two standards at the
     narrow neck, one of them falling; no named figure is shown (012). */
  var crossingMark = new THREE.Group();
  crossingMark.userData.keep = true;
  scene.add(crossingMark);
  var amrStd = cast.eventStandard(CROSS_X, 5.4, 1, 0, false, crossingMark);
  var aliStd = cast.eventStandard(CROSS_X - 1.5, -5.4, 0, 0, false, crossingMark);
  amrStd.k = 'amrStd'; aliStd.k = 'aliStd';
  var amrBase = { x: CROSS_X, z: 5.4 };
  var aliBase = { x: CROSS_X - 1.5, z: -5.4 };

  /* the night patrol's standard (024): a lone light standard, no figure */
  var hudMark = cast.eventStandard(30, -18, 0, 0, false);
  hudMark.k = 'hud';
  hudMark.userData.keep = true;
  hudMark.visible = false;
  var HUD_PATH = [[30, -18], [44, -12], [52, -4], [56, 3], [52, 16], [40, 28]];

  /* the four sent to ask about the broken pact (016): faceless, generic */
  var scouts = new THREE.Group();
  scouts.userData.dynamicRoot = true;
  scene.add(scouts);
  var SCOUT_OFF = [[0, 0, 0], [0.85, 0, 0.5], [-0.75, 0, 0.62], [0.15, 0, 1.15]];
  SCOUT_OFF.forEach(function (o, k) {
    var f = cast.makeFighter({
      x: o[0], y: 0, z: o[2], ry: (k % 2 ? 0.06 : -0.06),
      robe: 0xd2c9b4, robeDark: 0x8f8168, weapon: 'spear', shield: true, scale: 0.96
    });
    scene.remove(f.group);
    scouts.add(f.group);
  });
  ENGINE.merge.mergeMeshList(ENGINE.merge.collectMergeable(scouts), scouts, true);
  scouts.position.set(44, heightAt(44, -32), -32);
  scouts.rotation.y = 1.45;
  var SCOUT_PATH = [[44, -32], [60, -34], [76, -32], [90, -29], [100, -29]];

  /* ------------------------------ the crowds.
     Three thousand behind the trench, about ten thousand before it. The enemy
     mass is hidden only after it has withdrawn (025). The crowd is built
     around x = 0, then shifted by the band plans onto the ditch axis. */
  ENGINE.crowd.build({
    side: 0, count: 3000, cols: 54, dxS: 1.9, dzS: 1.9, z0: -19, h: 1.9,
    divFiles: 18, divPitch: 56, blocks: mBands, scene: scene
  });
  ENGINE.crowd.build({
    side: 1, count: 10000, cols: 90, dxS: 1.9, dzS: 1.9, z0: 28, h: 2.15,
    divFiles: 30, divPitch: 62, blocks: qBands, scene: scene
  });
  var ENEMY_MASS = ENGINE.crowd.all().filter(function (M) { return M.side === 1; });

  /* ------------------------------ labels */
  function mkLabel(txt, cls) { return ENGINE.labels.mkLabel(labelBox, txt, cls); }
  var LAND = [
    { w: [-18, heightAt(-18, -90) + 6.5, -90], t: 'Sīlāʿ · the mountain at the Muslim rear', e: 'KHANDAQ-006', k: 'sila', cls: 'is-land-name is-far', ph: [0, 1, 2, 6] },
    { w: [TRENCH.mid, 2.7, 0], t: 'the trench', e: 'KHANDAQ-003', k: 'trench', cls: 'is-tap is-event', ph: [1, 2, 3, 4, 5, 6] },
    { w: [0, 7, 86], t: 'the northern approach', e: 'KHANDAQ-005', k: 'approach', cls: 'is-land-name is-far', ph: [0] },
    { w: [CROSS_X, 3.8, 0], t: 'the narrow crossing', e: 'KHANDAQ-011', k: 'crossing', cls: 'is-tap is-event', ph: [3, 4] },
    { w: [82, heightAt(82, -14) + 2.4, -14], t: 'the marsh between the trench and Sīlāʿ', e: 'KHANDAQ-011', k: 'marsh', cls: 'is-land', ph: [3, 4] },
    { w: [FORT.x, heightAt(FORT.x, FORT.z) + 7.6, FORT.z], t: 'the forts of Banū Qurayẓa', e: 'KHANDAQ-014', k: 'fort', cls: 'is-tap is-event', ph: [4] },
    { w: [-18, 11, -132], t: 'Madinah · behind the line', e: 'KHANDAQ-005', k: 'madinah', cls: 'is-land-name is-far', ph: [0, 6] },
    { w: [0, 9, 108], t: 'the Confederate camps · al-Asyāl and Uḥud', e: 'KHANDAQ-037', k: 'camps', cls: 'is-land-name', ph: [0, 1, 5, 6] },
    { w: [30, heightAt(30, -48) + 3.0, -48], t: 'the guarded quarter', e: 'KHANDAQ-015', k: 'quarter', cls: 'is-land', ph: [3, 4] },
    { w: [STATION.x, heightAt(STATION.x, STATION.z) + 5.8, STATION.z], t: 'the Prophet’s station (PBUH)', e: 'KHANDAQ-033', k: 'prophet', cls: 'is-tap is-event', ph: [1, 2, 3, 4, 5, 6] }
  ];
  var LANDL = LAND.map(function (l) {
    var node = mkLabel(l.t, l.cls);
    return { el: node, v: new THREE.Vector3(l.w[0], l.w[1], l.w[2]), k: l.k, ph: l.ph, tRange: l.tRange };
  });
  var UNIT_DEFS = [
    { u: mCentre, side: 0, labelY: 4.9, priority: 3, ph: [0, 2, 3, 6] },
    { u: qCentre, side: 1, labelY: 4.9, priority: 2, ph: [0, 2, 4] },
    { u: qLeft, side: 1, labelY: 4.7, priority: 2, ph: [0, 4] },
    { u: qRight, side: 1, labelY: 4.7, priority: 2, ph: [0, 4] },
    { u: cav, side: 1, labelY: 4.0, priority: 2, event: true, ph: [3, 4] },
    { u: { k: 'amrStd', label: 'ʿAmr’s standard', group: amrStd, home: [CROSS_X, 5.4] }, side: 1, labelY: 4.2, priority: 3, event: true, ph: [3], tRange: [0.08, 0.6] },
    { u: { k: 'aliStd', label: 'ʿAlī (RA)', group: aliStd, home: [aliBase.x, aliBase.z] }, side: 0, labelY: 4.2, priority: 3, event: true, ph: [3, 4], tRange: [0.3, 1] },
    { u: { k: 'hud', label: 'Ḥudhayfah (RA) · the night patrol', group: hudMark, home: [30, -18] }, side: 0, labelY: 4.0, priority: 3, event: true, ph: [5], tRange: [0.35, 0.95] }
  ];
  var amrDef = UNIT_DEFS[5];
  var EVENT_MARKS = [
    { key: 'dig', label: 'forty yards to every ten', x: -18, y: 3.2, z: 0, ph: [1], tRange: [0.03, 0.85], priority: 4 },
    { key: 'holds', label: 'the trench holds · no way across', x: -18, y: 4.0, z: -1, ph: [2], tRange: [0.35, 0.95], priority: 4 },
    { key: 'sad', label: 'Saʿd ibn Muʿādh (RA) is struck', x: 8, y: 4.0, z: -12, ph: [2], tRange: [0.62, 1], priority: 4 },
    { key: 'amr', label: 'ʿAmr ibn ʿAbd Wudd challenges', x: CROSS_X, y: 5.0, z: 3, ph: [3], tRange: [0.12, 0.52], priority: 4 },
    { key: 'ali', label: 'ʿAlī (RA) answers · ʿAmr falls', x: CROSS_X, y: 5.0, z: -1, ph: [3], tRange: [0.5, 0.95], priority: 4 },
    { key: 'pact', label: 'the pact of Banū Qurayẓa is broken', x: FORT.x, y: heightAt(FORT.x, FORT.z) + 8.6, z: FORT.z, ph: [4], tRange: [0.1, 0.55], priority: 4 },
    { key: 'four', label: 'the four go to ask', x: 84, y: 6.0, z: -29, ph: [4], tRange: [0.32, 0.72], priority: 4 },
    { key: 'distrust', label: 'the allies begin to distrust one another', x: -18, y: 8.5, z: 34, ph: [4], tRange: [0.62, 1], priority: 4 },
    { key: 'storm', label: 'a wind, rain and cold', x: 0, y: 9.5, z: 98, ph: [5], tRange: [0.02, 0.42], priority: 4 },
    { key: 'tents', label: 'the tents come down', x: -6, y: 5.2, z: 98, ph: [5], tRange: [0.3, 0.65], priority: 4 },
    { key: 'hudEvent', label: 'Ḥudhayfah (RA) finds them leaving', x: 44, y: 6.0, z: 26, ph: [5], tRange: [0.55, 0.92], priority: 4 },
    { key: 'withdraw', label: 'the Confederates withdraw', x: -18, y: 8.0, z: 64, ph: [6], tRange: [0.0, 0.5], priority: 4 },
    { key: 'killed', label: '6 Muslims · 10 Confederates killed', x: -18, y: 5.0, z: -14, ph: [6], tRange: [0.28, 0.95], priority: 4 },
    { key: 'initiative', label: 'the trench held · the initiative passes to Madinah', x: -18, y: 6.2, z: -48, ph: [6], tRange: [0.5, 1], priority: 4 }
  ];
  EVENT_MARKS.forEach(function (m) {
    var g = new THREE.Group();
    g.position.set(m.x, 0, m.z);
    g.userData.dynamicRoot = true;
    scene.add(g);
    m.group = g;
    m.labelNode = mkLabel(m.label, m.side ? 'is-event' : 'is-event is-side');
  });
  var ULABS = UNIT_DEFS.map(function (d) {
    d.u.k = d.u.k || ('unit' + Math.round((d.u.home ? d.u.home[0] : 0) * 10));
    d.u.labelY = d.labelY;
    d.u.priority = d.priority;
    d.u.event = !!d.event;
    if (d.ph) d.u.ph = d.ph;
    if (d.tRange) d.u.tRange = d.tRange;
    var node = mkLabel(d.u.label, (d.side ? '' : 'is-side') + (d.event ? ' is-event' : ''));
    return { el: node, u: d.u, k: d.u.k };
  });
  EVENT_MARKS.forEach(function (m) {
    ULABS.push({ el: m.labelNode, u: { k: m.key, label: m.label, group: m.group, labelY: m.y, event: true, priority: m.priority, labelAlways: true, ph: m.ph, tRange: m.tRange }, k: m.key });
  });

  var LABELS = {
    en: {
      mline: 'the Muslim line · about 3,000',
      qcentre: 'Quraysh · about 4,000 · Abū Sufyān',
      qwest: 'Kinanāh and the Tihāmah allies',
      qeast: 'Ghaṭafān and the eastern tribes',
      cav: 'the horse at the crossing',
      amrStd: 'ʿAmr’s standard', aliStd: 'ʿAlī (RA)',
      hud: 'Ḥudhayfah (RA) · the night patrol',
      sila: 'Sīlāʿ · the mountain at the Muslim rear', trench: 'the trench',
      approach: 'the northern approach', crossing: 'the narrow crossing',
      marsh: 'the marsh between the trench and Sīlāʿ',
      fort: 'the forts of Banū Qurayẓa', madinah: 'Madinah · behind the line',
      camps: 'the Confederate camps · al-Asyāl and Uḥud',
      quarter: 'the guarded quarter', prophet: 'the Prophet’s station (PBUH)',
      dig: 'forty yards to every ten', holds: 'the trench holds · no way across',
      sad: 'Saʿd ibn Muʿādh (RA) is struck',
      amr: 'ʿAmr ibn ʿAbd Wudd challenges', ali: 'ʿAlī (RA) answers · ʿAmr falls',
      pact: 'the pact of Banū Qurayẓa is broken', four: 'the four go to ask',
      distrust: 'the allies begin to distrust one another',
      storm: 'a wind, rain and cold', tents: 'the tents come down',
      hudEvent: 'Ḥudhayfah (RA) finds them leaving',
      withdraw: 'the Confederates withdraw',
      killed: '6 Muslims · 10 Confederates killed',
      initiative: 'the trench held · the initiative passes to Madinah'
    },
    ur: {
      mline: 'مسلمانوں کی صف · تقریباً ۳۰۰۰',
      qcentre: 'قریش · تقریباً ۴۰۰۰ · ابو سفیان',
      qwest: 'کنانہ اور تہامہ کے حلیف',
      qeast: 'غطفان اور مشرقی قبائل',
      cav: 'گزرگاہ پر سوار',
      amrStd: 'عمرو کا پرچم', aliStd: 'علی رضی اللہ عنہ',
      hud: 'حذیفہ رضی اللہ عنہ · رات کا گشت',
      sila: 'سِلَع · مسلمانوں کے عقب کا پہاڑ', trench: 'خندق',
      approach: 'شمالی راستہ', crossing: 'تنگ گزرگاہ',
      marsh: 'خندق اور سِلَع کے درمیان دلدل',
      fort: 'بنی قریظہ کے قلعے', madinah: 'مدینہ · صف کے پیچھے',
      camps: 'احزاب کے کیمپ · الاصیال اور اُحد',
      quarter: 'محفوظ محلہ', prophet: 'مقامِ نبوی ﷺ',
      dig: 'ہر دس آدمیوں کے لیے چالیس گز', holds: 'خندق قائم رہی · کوئی راستہ نہیں',
      sad: 'سعد بن معاذ رضی اللہ عنہ زخمی ہوئے',
      amr: 'عمرو بن عبدود کا للکارنا', ali: 'علی رضی اللہ عنہ کا جواب · عمرو گرا',
      pact: 'بنی قریظہ کا عہد ٹوٹ گیا', four: 'چار آدمی پوچھنے گئے',
      distrust: 'حلیف ایک دوسرے پر شک کرنے لگے',
      storm: 'آندھی، بارش اور سردی', tents: 'خیمے گر گئے',
      hudEvent: 'حذیفہ رضی اللہ عنہ نے انہیں جاتے پایا',
      withdraw: 'احزاب پیچھے ہٹ گئے',
      killed: '۶ مسلمان · ۱۰ مشرک مارے گئے',
      initiative: 'خندق قائم رہی · پہل مدینہ کو ملی'
    }
  };
  function setLang(lang) {
    var d = LABELS[lang] || LABELS.en;
    LANDL.forEach(function (it) { it.el.textContent = d[it.k] || it.el.textContent; });
    ULABS.forEach(function (it) { it.el.textContent = d[it.u.k] || it.el.textContent; });
  }

  /* ------------------------------ arrows: the exchange across the trench */
  particles.arrows.makePool(props.makeArrow, 48);

  /* ------------------------------ storm weather: rain, a dark lid and the
     lightning flash. All deterministic on the scrub fraction; the rain motion
     alone is wall-clock. */
  var STORM_N = MOBILE ? 260 : 520;
  var rainGeo = new THREE.BufferGeometry();
  var rainPos = new Float32Array(STORM_N * 6);
  var rainX = new Float32Array(STORM_N), rainY = new Float32Array(STORM_N);
  var rainZ = new Float32Array(STORM_N), rainL = new Float32Array(STORM_N);
  for (var rn = 0; rn < STORM_N; rn++) {
    rainX[rn] = -100 + Math.random() * 200;
    rainY[rn] = Math.random() * 26;
    rainZ[rn] = -30 + Math.random() * 140;
    rainL[rn] = 0.6 + Math.random() * 0.9;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  var rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xb9c5d0, transparent: true, opacity: 0, depthWrite: false }));
  rain.frustumCulled = false;
  rain.visible = false;
  scene.add(rain);

  var stormDome = new THREE.Mesh(
    new THREE.SphereGeometry(560, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x3a414c, side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false, fog: false })
  );
  scene.add(stormDome);

  var flashLight = new THREE.AmbientLight(0xdce6f2, 0);
  scene.add(flashLight);

  var FOG_BASE = new THREE.Color(0xa4967f), FOG_STORM = new THREE.Color(0x67655c);
  var rainK = 0;
  function updateRain(dt) {
    if (rainK < 0.03 || reduce) { rain.visible = false; return; }
    rain.visible = true;
    rain.material.opacity = 0.30 * rainK;
    var pa = rain.geometry.attributes.position;
    for (var i = 0; i < STORM_N; i++) {
      rainY[i] -= dt * 26;
      rainX[i] += dt * 7.5;
      if (rainY[i] < 0) rainY[i] = 22 + Math.random() * 7;
      if (rainX[i] > 100) rainX[i] = -100;
      var o = i * 6;
      pa.array[o] = rainX[i]; pa.array[o + 1] = rainY[i]; pa.array[o + 2] = rainZ[i];
      pa.array[o + 3] = rainX[i] + 0.32; pa.array[o + 4] = rainY[i] - rainL[i]; pa.array[o + 5] = rainZ[i] + 0.1;
    }
    pa.needsUpdate = true;
  }

  /* ------------------------------ static merge: rigid ground furniture in a
     few batches; standards, the gate, tents, scouts and the horse stay live */
  var merge = ENGINE.merge;
  function mergeStaticScene() {
    scene.updateMatrixWorld(true);
    WAVERS.forEach(function (w) { w.mesh.userData.keep = true; });
    particles.arrows.pool.forEach(function (a) {
      a.m.updateMatrixWorld(true);
      merge.mergeMeshList(merge.collectMergeable(a.m), a.m, true);
      a.m.userData.keep = true;
    });
    stuckArrows.updateMatrixWorld(true);
    merge.mergeMeshList(merge.collectMergeable(stuckArrows), stuckArrows, true);
    stuckArrows.userData.keep = true;
    mBands.concat(qBands).forEach(function (b) {
      b.group.updateMatrixWorld(true);
      merge.mergeMeshList(merge.collectMergeable(b.group), b.group, true);
      b.group.userData.dynamicRoot = true;
    });
    props.palms.forEach(function (p) {
      p.crown.updateMatrixWorld(true);
      merge.mergeMeshList(merge.collectMergeable(p.crown), p.crown, true);
      p.crown.userData.keep = true;
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
  merge.mergeMeshList(merge.collectMergeable(stationMark), stationMark, true);

  /* ------------------------------ phases + shots */
  var PHASES = [
    { id: 'ground', name: 'the ground', dur: 8 },
    { id: 'trench', name: 'the trench', dur: 10 },
    { id: 'siege', name: 'the siege', dur: 13 },
    { id: 'crossing', name: 'the crossing', dur: 11 },
    { id: 'covenant', name: 'the covenant', dur: 12 },
    { id: 'storm', name: 'the storm', dur: 13 },
    { id: 'reckoning', name: 'the reckoning', dur: 11 }
  ];
  var TOTAL = 0; PHASES.forEach(function (p) { TOTAL += p.dur; });

  var SHOTS = {
    ground: [
      { t0: 0, t1: 1.001, p0: [138, 52, 146], p1: [96, 30, 96], l0: [-4, 9, 52], l1: [-18, 3, -6] }
    ],
    trench: [
      { t0: 0, t1: 0.52, p0: [-56, 13, 17], p1: [-38, 9, 15], l0: [-48, 2.4, -6], l1: [-10, 1.6, -4] },
      { t0: 0.52, t1: 1.001, p0: [-48, 3.0, 6.4], p1: [-36, 2.6, 5.8], l0: [-20, 0.1, -5.2], l1: [4, 0.1, -5] }
    ],
    siege: [
      { t0: 0, t1: 0.52, p0: [-92, 15, -44], p1: [-64, 8.5, -27], l0: [-30, 2.6, 12], l1: [-6, 3.2, 19] },
      { t0: 0.52, t1: 1.001, p0: [96, 12, 36], p1: [76, 7, 24], l0: [38, 2.6, 15], l1: [6, 1.8, 7] }
    ],
    crossing: [
      { t0: 0, t1: 0.5, p0: [76, 11, 52], p1: [68, 8, 38], l0: [58, 1.8, -1], l1: [57, 1.4, 1],
        portrait: { p0: [40, 14, -30], p1: [38.5, 15.5, -33], l0: [57, 2, 3], l1: [57.5, 1.9, 1.5] } },
      { t0: 0.5, t1: 1.001, p0: [96, 14, -30], p1: [86, 10, -22], l0: [57, 1.8, 0], l1: [56, 1.5, 2],
        portrait: { p0: [38.5, 15.5, -33], p1: [37, 17, -36], l0: [57.5, 1.9, 1.5], l1: [58, 1.8, 2] } }
    ],
    covenant: [
      { t0: 0, t1: 0.52, p0: [70, 20, -2], p1: [80, 15, -12], l0: [104, 8.4, -31], l1: [104, 7.8, -32] },
      { t0: 0.52, t1: 1.001, p0: [124, 64, 126], p1: [94, 44, 102], l0: [26, 4, 24], l1: [-2, 4, 26] }
    ],
    storm: [
      { t0: 0, t1: 0.5, p0: [38, 12, 132], p1: [26, 8, 114], l0: [2, 4, 100], l1: [-4, 2.6, 92] },
      { t0: 0.5, t1: 1.001, p0: [-86, 4.6, 6], p1: [-60, 3.4, 3], l0: [10, 1, 0], l1: [46, 1, 1.5] }
    ],
    reckoning: [
      { t0: 0, t1: 0.44, p0: [64, 28, -74], p1: [36, 17, -46], l0: [-4, 4, 28], l1: [-2, 3, 48] },
      { t0: 0.44, t1: 1.001, p0: [-2, 14, -74], p1: [-8, 9, -62], l0: [-18, 4.6, -58], l1: [-18, 2.6, -34] }
    ]
  };
  var IMPACTS = [
    { ph: 2, t: 0.35, amp: 0.05 },
    { ph: 3, t: 0.57, amp: 0.08 },
    { ph: 5, t: 0.42, amp: 0.11 }
  ];
  var PRESETS = {
    ground: { p: [96, 30, 96], l: [-18, 3, -6] },
    aerial: { p: [30, 165, 140], l: [-18, 0, 10] },
    trench: { p: [-44, 9, 15], l: [-12, 1.6, -5] },
    line: { p: [-18, 9, -34], l: [-18, 2, -4] },
    crossing: { p: [86, 10, -22], l: [56, 1.5, 2] },
    fort: { p: [80, 15, -12], l: [104, 7.8, -32] },
    camps: { p: [34, 18, 122], l: [0, 3, 98] },
    storm: { p: [26, 8, 114], l: [-4, 2.6, 92] }
  };
  var director = ENGINE.director(ctx);
  var clock = director.clock;

  /* ------------------------------ applying a frame */
  var UNITS = mBands.concat(qBands);
  var curPhaseIdx = 0, curPhaseT = 0;

  function pathAt(pts, u) {
    var n = pts.length - 1;
    var f = clamp01(u) * n;
    var i = Math.min(n - 1, Math.floor(f));
    var k = f - i;
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
  }

  function setEnemyVisible(v) {
    ENEMY_MASS.forEach(function (M) {
      M.men.visible = v; M.legsL.visible = v; M.legsR.visible = v; M.spears.visible = v;
      M.shields.visible = v; M.rims.visible = v; M.swords.visible = v;
      M.guards.visible = v; M.helms.visible = v;
    });
    qBands.forEach(function (b) { b.group.visible = v; });
    cav.group.visible = v;
  }

  function stormK(i, t) {
    if (i < 5) return 0;
    if (i === 5) return easeIO(clamp01(t / 0.18));
    return 1 - easeIO(clamp01(t / 0.28));
  }

  function applyStorm(k, flash) {
    rainK = k;
    sky.dome.material.color.setRGB(
      1 - 0.42 * k + 0.42 * flash,
      1 - 0.42 * k + 0.40 * flash,
      1 - 0.40 * k + 0.36 * flash
    );
    sky.hemi.intensity = 0.52 - 0.10 * k + 0.20 * flash;
    sky.sun.intensity = 1.32 - 0.90 * k + 0.35 * flash;
    sky.fill.intensity = 0.26 - 0.12 * k;
    sky.rim.intensity = 0.26 - 0.16 * k;
    scene.fog.near = 165 + (100 - 165) * k;
    scene.fog.far = 520 + (330 - 520) * k;
    scene.fog.color.copy(FOG_BASE).lerp(FOG_STORM, k);
    stormDome.material.opacity = 0.24 * k;
    flashLight.intensity = 1.7 * flash;
    rain.visible = !reduce && k > 0.03;
    particles.smoke.list.forEach(function (s) { s.pts.material.opacity = 0.13 * (1 - 0.75 * k); });
  }

  function applyFrac(frac) {
    var info = director.phaseInfo(frac);
    var i = info.i, t = info.t;
    curPhaseIdx = i;
    curPhaseT = t;

    for (var k = 0; k < UNITS.length; k++) {
      var u = UNITS[k];
      var start = i === 0 ? u.plan[0] : u.plan[i - 1];
      var end = u.plan[i] || u.plan[u.plan.length - 1];
      var w0 = 0.1 + (u._stag || 0);
      var mm = easeIO(clamp01((t - w0) / (0.86 - w0)));
      var p = {
        x: start.x + (end.x - start.x) * mm,
        z: start.z + (end.z - start.z) * mm,
        ry: (start.ry || 0) + ((end.ry || 0) - (start.ry || 0)) * mm,
        tilt: (start.tilt || 0) + ((end.tilt || 0) - (start.tilt || 0)) * mm
      };
      if (i === 2 && u.side === 1) {
        p.x += Math.sin(t * 8 + k * 1.7) * 0.10;
        p.z += Math.cos(t * 6 + k * 2.1) * 0.07;
      }
      applyPose(u, p, 0);
    }

    /* the standards at the crossing: ʿAlī steps to the neck, ʿAmr falls */
    var adv = i < 3 ? 0 : i === 3 ? easeIO(clamp01((t - 0.36) / 0.26)) : 1 - easeIO(clamp01(t / 0.34));
    aliStd.position.set(aliBase.x + adv * 1.7, 0.02, aliBase.z + adv * 4.9);
    aliStd.visible = i >= 2;
    var fall = i > 3 ? 1 : (i === 3 ? clamp01((t - 0.56) / 0.12) : 0);
    amrStd.rotation.z = 1.25 * fall;
    amrStd.position.y = 0.18 * fall;
    amrStd.visible = i >= 2;
    amrDef.u.labelY = 4.2 - 2.7 * fall;

    /* the night patrol */
    hudMark.visible = i === 5;
    if (i === 5) {
      var hp = pathAt(HUD_PATH, easeIO(clamp01((t - 0.22) / 0.7)));
      hudMark.position.set(hp[0], heightAt(hp[0], hp[1]) + 0.02, hp[1]);
      hudMark.rotation.y = 1.1;
    }

    /* the four sent to the forts */
    var sp;
    if (i < 4) sp = [44, -32];
    else if (i === 4) sp = pathAt(SCOUT_PATH, easeIO(clamp01((t - 0.15) / 0.62)));
    else if (i === 5) sp = pathAt([[100, -29], [86, -32], [70, -30], [52, -28]], easeIO(clamp01(t / 0.42)));
    else sp = [52, -28];
    scouts.position.set(sp[0], heightAt(sp[0], sp[1]) + 0.02, sp[1]);
    scouts.rotation.y = i === 5 ? -1.6 : 1.45;

    /* the horse: through the neck into the marsh, out again after the duel */
    var cp, cry;
    if (i < 3) { cp = [94, 24]; cry = 0; }
    else if (i === 3) {
      cp = pathAt([[94, 24], [84, 16], [74, 10], [64, 5], [57, 2], [56, -2], [60, -8], [66, -12]], easeIO(clamp01((t - 0.04) / 0.78)));
      cry = 2.25;
    } else if (i === 4) {
      cp = pathAt([[66, -12], [60, -8], [57, -2], [58, 3], [66, 8], [78, 16], [90, 22]], easeIO(t));
      cry = 0.65;
    } else { cp = [94, 24]; cry = 0; }
    var gallop = (i === 3 || i === 4) ? Math.abs(Math.sin(t * 34)) * 0.07 : 0;
    cav.group.position.set(cp[0], heightAt(cp[0], cp[1]) + gallop, cp[1]);
    cav.group.rotation.y = cry;
    cav.group.rotation.z = (i === 3 || i === 4) ? Math.sin(t * 17) * 0.018 : 0;

    /* the gate of the Qurayẓa forts opens and stays open */
    var open = i < 4 ? 0 : i === 4 ? easeIO(clamp01((t - 0.08) / 0.18)) : 1;
    gateL.rotation.y = -1.22 * open;
    gateR.rotation.y = 1.22 * open;

    /* the wind takes the tents and the pots (023) */
    var tf = i < 5 ? 0 : i === 5 ? clamp01((t - 0.30) / 0.16) : 1;
    for (var tt = 0; tt < stormTents.length; tt++) {
      var st2 = stormTents[tt];
      st2.g.rotation.z = st2.dir * st2.lean * tf;
      st2.g.rotation.x = 0.22 * tf;
      st2.g.position.y = st2.y - 0.30 * tf;
    }
    for (var pp = 0; pp < stormPots.length; pp++) {
      stormPots[pp].m.rotation.z = 1.3 * tf;
      stormPots[pp].m.position.y = stormPots[pp].y - 0.12 * tf;
    }

    /* the enemy is gone once the withdrawal has passed */
    var gone = (i === 5 && t > 0.88) || i === 6;
    setEnemyVisible(!gone);

    /* storm light, rain and the flash */
    var sk = stormK(i, t);
    var fl = 0;
    if (i === 5) {
      var a1 = Math.exp(-Math.pow((t - 0.42) / 0.025, 2));
      var a2 = 0.7 * Math.exp(-Math.pow((t - 0.47) / 0.020, 2));
      fl = clamp01(a1 + a2);
    }
    applyStorm(sk, fl);

    /* the field */
    workersMark.visible = i <= 3;
    var dust = (i === 1 ? 0.50 : 0) + (i === 2 ? 0.22 : 0) + (i === 5 ? 0.65 * sk : 0);
    particles.dust.update(dust);
    particles.angels.update(0);

    var volley = (i === 2 && t > 0.12) || (i === 3 && t < 0.5);
    if (volley && !reduce) particles.arrows.spawn(clock.dt || 0, clock.speed, function (ar) {
      ar.from.set(-70 + Math.random() * 104, heightAt(0, 8) + 1.8 + Math.random() * 1.4, 6 + Math.random() * 10);
      ar.to.set(-64 + Math.random() * 92, 1.2, -12 - Math.random() * 8);
    });
    particles.arrows.update(clock.dt || 0);
    particles.arrows.setAllVisible(true);
    stuckArrows.visible = i >= 2;

    director.applyCamera(i, t);
  }

  function applyPose(u, p, fallen) {
    var g = u.group;
    var fr = easeIO(clamp01(fallen));
    g.position.x = p.x;
    g.position.z = p.z;
    g.position.y = -0.1 * fr;
    g.rotation.x = -1.42 * fr;
    if (!fr && p.tilt) g.rotation.x = p.tilt;
  }

  function crowdEnv() {
    var ph = curPhaseIdx;
    var marching = ph === 1 || ph === 2 || (ph === 5 && curPhaseT > 0.15) || ph === 6;
    var fight = ph === 2 ? 0.18 : ph === 3 ? 0.4 : ph === 4 ? 0.08 : 0;
    return {
      ph: ph,
      frac: clock.frac,
      total: TOTAL,
      fight: fight,
      disp: ph === 1 ? 0.8 : ph === 2 ? 0.35 : ph === 3 ? 0.25 : ph === 4 ? 0.55 : ph === 5 ? 0.5 : 0,
      marching: marching,
      gaitHz: ph === 5 ? 1.1 : ph === 1 ? 0.8 : 1.0,
      gaitAmp: marching ? 0.45 : 0.03,
      leanRun: ph === 5 ? 0.12 : 0,
      lod: MOBILE
    };
  }
  function updateMass() { ENGINE.crowd.update(crowdEnv()); }

  /* ------------------------------ shared loop + public API */
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

  ENGINE.runner(ctx, {
    phases: PHASES, shots: SHOTS, impacts: IMPACTS, presets: PRESETS,
    director: director,
    /* the desktop cameras already stand well back; the generic portrait pull
       would carry them outside the valley (the ground) or behind the enemy
       (the crossing), so Khandaq caps it and frames the crossing itself */
    portrait: { cap: 1.4 },
    labels: { units: ULABS, landmarks: LANDL },
    applyFrac: applyFrac,
    updateMass: updateMass,
    crowdEnv: crowdEnv,
    setLang: setLang,
    frame: function (f) {
      var now = f.now;
      if (curPhaseIdx === 1) {
        for (var wi = 0; wi < WORKERS.length; wi++) {
          var ww = WORKERS[wi];
          ww.g.rotation.x = ww.base + Math.sin(now / 150 + ww.ph) * 0.16;
        }
      }
      if (!reduce && !MOBILE) {
        updateCloth(now / 1000);
        for (var pw = 0; pw < props.palms.length; pw++) {
          var pp = props.palms[pw];
          pp.crown.rotation.z = Math.sin(now / 1600 + pp.phase) * 0.035;
          pp.crown.rotation.x = Math.cos(now / 2100 + pp.phase) * 0.022;
        }
        particles.smoke.update(f.dt, now);
      } else if (MOBILE && (Math.floor(now / 140) % 2 === 0)) {
        updateCloth(now / 2500);
      }
      updateRain(f.dt);
    },
    api: {
      trench: function () {
        return { length: TRENCH.len, depth: TRENCH.depth, crossingX: CROSS_X, filledNeck: true };
      },
      army: function () {
        return { muslims: 3000, confederates: 10000, bands: mBands.length + qBands.length, horse: 10 };
      },
      camps: function () {
        return campTents.map(function (t) {
          return { pos: t.position.toArray().map(function (v) { return +v.toFixed(1); }) };
        });
      },
      crossing: function () {
        return {
          amr: { pos: amrStd.position.toArray().map(function (v) { return +v.toFixed(1); }), fallen: amrStd.rotation.z > 0.3 },
          ali: { pos: aliStd.position.toArray().map(function (v) { return +v.toFixed(1); }) },
          horse: cav.group.position.toArray().map(function (v) { return +v.toFixed(1); })
        };
      },
      storm: function () {
        return { phase: 5, tentsLive: stormTents.length, rain: rainK > 0.03 };
      }
    }
  });
})();
