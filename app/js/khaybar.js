/* Khaybar · the campaign in 3D — the Khaybar scene module.
   The volcanic oasis north of Madinah, the fort chain on its rising shelf,
   the groves and wells on the floor, the Muslim camp, the six phases from the
   night march to the reckoning. Built on the shared ENGINE; this file carries
   only Khaybar's ground, layout, plans, siege, duel, shots and copy.
   The Prophet ﷺ is never depicted; no figure shows a face; named acts are
   marked by standards, never by persons.
   Claims: data/ledger/khaybar.json (KHY-001 … KHY-021). */
(function () {
  'use strict';
  var U = ENGINE.util;
  var easeIO = U.easeIO, clamp01 = U.clamp01, smoothN = U.smoothN, fbm = ENGINE.fbm;
  var ctx = ENGINE.boot({
    failText: 'The 3D battle needs WebGL. The graded ledger in data/ledger/khaybar.json carries every fact.',
    grade: false, linearFog: true, fogColor: 0xb59a78, fogNear: 180, fogFar: 560
  });
  if (!ctx) return;
  var canvas = ctx.canvas, labelBox = ctx.labelBox, reduce = ctx.reduce, MOBILE = ctx.MOBILE;
  var renderer = ctx.renderer, scene = ctx.scene, camera = ctx.camera;

  /* ------------------------------ a hard dawn over the ḥarra.
     The sun comes from the east; the basalt shelf takes a raking light, the
     oasis floor stays warm, and the night phase only takes the key down far
     enough for the standards to read as silhouettes. */
  var sky = ENGINE.sky(ctx, {
    zenith: 0x27334c, horizon: 0xa9825a, skyCurve: 0.55,
    stars: 220, starOpacity: 0.20,
    moon: false,
    hemiSky: 0x9fb0c2, hemiGround: 0x3c3127, hemi: 0.46,
    sunColor: 0xffd4a4, sun: 1.18, sunPos: [118, 46, -36], shadowBounds: 190, shadowFar: 460,
    fillColor: 0x8ea0b4, fill: 0.22, fillPos: [-60, 34, 40],
    rimColor: 0xffe6c6, rim: 0.26, rimPos: [24, 16, -60]
  });

  /* ------------------------------ the ground.
     Axes: +x east, +z north. The Muslims come up from the south (-z) and
     camp on the floor; the oasis basin holds the groves and wells; the fort
     chain climbs the northern shelf from Naʿīm in the west to al-Qamūṣ in the
     east. The duel ground lies at the southern foot of al-Qamūṣ (KHY-004,
     KHY-008, KHY-013). */

  var COMPOUNDS = [
    { id: 'naim', x: -92, z: 84, w: 11, h: 7.0, seed: 101, padY: 10.2, cap: [2, 0.20] },
    { id: 'zubair', x: -44, z: 92, w: 12.5, h: 7.4, seed: 102, padY: 12.4, cap: [2, 0.38] },
    { id: 'abi', x: 2, z: 102, w: 11, h: 7.0, seed: 103, padY: 15.2, cap: [2, 0.58] },
    { id: 'nizar', x: 44, z: 92, w: 12, h: 7.2, seed: 104, padY: 13.4, cap: [2, 0.78] },
    { id: 'qamus', x: 94, z: 66, w: 15, h: 9.2, seed: 105, padY: 5.4, cap: [4, 0.76] }
  ];
  var DUEL = { x: 70.5, z: 31.8, y: 1.2 };
  var STATION = { x: 0, z: -92 };

  function heightAt(x, z) {
    var h = 30 * smoothN(z, 26, 180);
    /* the flanking ridges close the basin */
    h += Math.max(smoothN(-x, 130, 215), smoothN(x, 130, 215)) *
      (9 + 16 * fbm(x * 0.02 + 3.4, z * 0.02 + 1.7, 3));
    /* the long rise to the south, behind the camp */
    h += smoothN(-z, 120, 210) * (6 + 12 * fbm(x * 0.03 + 8.1, z * 0.03 + 2.2, 2));
    /* the outer bowl keeps the eye in the oasis */
    h += Math.max(0, Math.hypot(x, z - 10) - 245) * 0.055;
    /* the floor rolls only outside the camp-and-crowd corridor */
    var out = Math.max(smoothN(Math.abs(x), 104, 170), smoothN(z, 26, 70), smoothN(-z, 88, 150));
    h += (fbm(x * 0.021 + 6.4, z * 0.021 + 3.1, 3) - 0.5) * 3.4 * out;
    h += (fbm(x * 0.058 + 1.3, z * 0.058 + 8.7, 2) - 0.5) * 0.9 * out;
    /* the low shelf the Prophet's station stands on */
    h += 0.9 * Math.exp(-Math.pow(x / 16, 2) - Math.pow((z + 92) / 11, 2));
    /* each fort's terrace: a flat pad blended into the shelf (KHY-004) */
    for (var p = 0; p < COMPOUNDS.length; p++) {
      var c = COMPOUNDS[p];
      var halfW = c.w * 1.75, halfD = c.w * 1.45;
      var d = Math.hypot(x - c.x, z - c.z);
      var inside = Math.hypot(halfW, halfD) + 2.5;
      var k = 1 - smoothN(d, inside, inside + 10);
      if (k > 0) h = h * (1 - k) + c.padY * k;
    }
    /* the duel ground below al-Qamūṣ: a broad, low, flat shelf */
    var dd = Math.hypot(x - DUEL.x, z - DUEL.z);
    var dk = 1 - smoothN(dd, 8, 18);
    if (dk > 0) h = h * (1 - dk) + DUEL.y * dk;
    h += (fbm(x * 0.33, z * 0.33, 2) - 0.5) * 0.045;
    return h;
  }

  var ROCK_LO = new THREE.Color(0x3a352e);
  var ROCK_HI = new THREE.Color(0x877a66);
  var ROCK = new THREE.Color();
  function colorAt(x, z, y, base) {
    var t = smoothN(y, 1.2, 5.0);
    if (t < 0.02) return null;
    var strata = 0.5 + 0.5 * Math.sin(y * 1.05 + fbm(x * 0.045, z * 0.045, 2) * 4.2);
    var grain = fbm(x * 0.21, z * 0.21, 2);
    ROCK.copy(ROCK_LO).lerp(ROCK_HI, 0.22 + 0.46 * strata + 0.12 * grain);
    if (z > 40) ROCK.multiplyScalar(0.88);
    if (x < -96) ROCK.multiplyScalar(0.84);
    return base.clone().lerp(ROCK, t);
  }

  ENGINE.ground(ctx, heightAt, {
    base: '#d6c3a2', repeat: 32, bumpScale: 0.10,
    sand: 0xc7b28c, crest: 0xd8c49c, trough: 0x8c7656, grit: 0xa99274,
    size: 560, seg: 240, colorAt: colorAt
  });

  var props = ENGINE.props(ctx, heightAt);
  var cast = ENGINE.cast(ctx);
  var WAVERS = cast.wavers;

  /* basalt boulders: one instanced batch, kept off the camp corridor, the
     duel ground and the fort pads */
  var BOULDERS = MOBILE ? 80 : 140;
  var boulderMesh = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.MeshLambertMaterial({ color: 0x4a4238, flatShading: true }), BOULDERS
  );
  var bD = new THREE.Object3D(), bN = 0;
  for (var bi = 0; bi < 520 && bN < BOULDERS; bi++) {
    var bx, bz;
    var pick = Math.abs(Math.sin(bi * 12.9898) * 43758.5453) % 1;
    if (pick < 0.34) { bx = -138 + Math.random() * 28; bz = -76 + Math.random() * 168; }
    else if (pick < 0.58) { bx = 116 + Math.random() * 26; bz = -56 + Math.random() * 150; }
    else if (pick < 0.82) { bx = -110 + Math.random() * 226; bz = 118 + Math.random() * 44; }
    else { bx = -120 + Math.random() * 240; bz = -146 + Math.random() * 60; }
    if (Math.abs(bx) < 62 && bz > -96 && bz < 26) continue;
    if (Math.hypot(bx - DUEL.x, bz - DUEL.z) < 20) continue;
    var onPad = false;
    for (var bq = 0; bq < COMPOUNDS.length; bq++) {
      var bc = COMPOUNDS[bq];
      if (Math.hypot(bx - bc.x, bz - bc.z) < Math.hypot(bc.w * 1.75, bc.w * 1.45) + 4) { onPad = true; break; }
    }
    if (onPad) continue;
    var bs = 0.7 + Math.random() * 1.9;
    bD.position.set(bx, heightAt(bx, bz) + bs * 0.26, bz);
    bD.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    bD.scale.set(bs * (1.0 + Math.random() * 0.5), bs * (0.45 + Math.random() * 0.4), bs);
    bD.updateMatrix();
    boulderMesh.setMatrixAt(bN++, bD.matrix);
  }
  boulderMesh.count = bN;
  boulderMesh.castShadow = true; boulderMesh.receiveShadow = true;
  scene.add(boulderMesh);

  /* a scatter of scrub and grit on the floor, and pebbles along the groves */
  props.scrubField(MOBILE ? 110 : 190, 13);
  props.pebbleField(MOBILE ? 140 : 240, -112, -56, 232, 112);

  /* ------------------------------ the oasis floor (KHY-001, KHY-003).
     Groves close the flanks, two wells water them, flat-roofed dwellings and
     field plots sit behind the Muslim lines. The palms and walls are shared
     props; the fields and houses are local so the static merge can take them. */

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
    var m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color || 0xb3a07e }));
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  roadRibbon([[6, -184], [10, -158], [16, -134], [22, -112], [27, -92], [30, -76], [32, -58], [34, -40]], 4.4);
  roadRibbon([[30, -58], [26, -20], [24, 8], [30, 30], [38, 48]], 2.8, 0xab9876);

  function fieldPlot(x, z, w, d) {
    var g = new THREE.Group();
    g.position.set(x, heightAt(x, z), z);
    var soil = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), new THREE.MeshLambertMaterial({ color: 0x6f5a3e }));
    soil.position.y = 0.04; soil.receiveShadow = true; g.add(soil);
    var rowM = new THREE.MeshLambertMaterial({ color: 0x7f6947 });
    for (var r = 0; r < Math.floor(d / 0.82); r++) {
      var ridge = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.1, 0.2), rowM);
      ridge.position.set(0, 0.1, -d / 2 + 0.55 + r * 0.82);
      ridge.receiveShadow = true;
      g.add(ridge);
    }
    scene.add(g);
    return g;
  }

  function house(x, z, w, d, h, seed) {
    var g = new THREE.Group();
    g.position.set(x, heightAt(x, z), z);
    var bodyM = new THREE.MeshLambertMaterial({ color: seed % 2 ? 0x9a8b72 : 0x8e7f68 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyM);
    body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
    var roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.24, d + 0.6), new THREE.MeshLambertMaterial({ color: 0x786b56 }));
    roof.position.y = h + 0.12; roof.castShadow = true; roof.receiveShadow = true; g.add(roof);
    var door = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.8, 0.1), new THREE.MeshLambertMaterial({ color: 0x2a2118 }));
    door.position.set(0, 0.9, d / 2 + 0.03); g.add(door);
    var lean = new THREE.Mesh(new THREE.BoxGeometry(w * 0.36, h * 0.55, d * 0.5), bodyM);
    lean.position.set(w * 0.58, h * 0.275, -d * 0.18);
    lean.castShadow = true; lean.receiveShadow = true; g.add(lean);
    scene.add(g);
    return g;
  }

  props.palmGrove(-88, -48, 26, 24, 42, { rows: true, wall: true });
  props.palmGrove(52, -50, 28, 26, 46, { rows: true, wall: true });
  props.palmGrove(-116, -16, 22, 20, 30, { rows: true });
  props.palmGrove(104, -30, 22, 18, 28, { rows: true });
  props.palmGrove(-102, -106, 16, 12, 18, { rows: true });
  props.palmGrove(86, 0, 18, 14, 24, { rows: true });
  props.palmGrove(-22, 26, 26, 18, 28, { rows: true, wall: true });

  props.well(-70, -18, true);
  props.well(66, -10, true);
  [[-76, -24, 4.4, 0.7], [-63, -12, 3.9, 0.5], [60, -16, 4.2, 0.8], [72, -4, 3.7, 0.5]
  ].forEach(function (p) { props.palm(p[0], p[1], p[2], p[3]); });

  house(-64, -66, 7.4, 5.8, 3.0, 1);
  house(-50, -70, 6.2, 5.2, 2.7, 2);
  house(36, -68, 7.0, 5.6, 2.9, 3);
  house(52, -70, 6.4, 5.0, 2.6, 4);
  house(-118, -44, 6.8, 5.4, 2.8, 5);
  house(112, -48, 7.2, 5.8, 3.0, 6);

  fieldPlot(-84, -62, 16, 8);
  fieldPlot(58, -64, 14, 7);
  fieldPlot(-112, -2, 12, 8);
  fieldPlot(98, -6, 12, 7);
  fieldPlot(-30, -108, 12, 7);
  fieldPlot(70, -34, 10, 6);

  /* ------------------------------ the Muslim camp and the empty station
     (KHY-007, KHY-009). The camp lies on the floor south of the crowd line;
     the station is a low paved rise, a white standard and a ring of faceless
     guards. The Prophet ﷺ is never depicted. */
  var particles = ENGINE.particles(ctx, heightAt, {
    dustBounds: { x0: -120, xs: 240, z0: -64, zs: 96 },
    dustColor: 0xcdbaa0, dustSize: 2.3, dustGain: 0.20
  });

  var campTents = [];
  [[-34, -78], [-24, -84], [-14, -80], [14, -80], [24, -84], [34, -78], [-40, -88], [40, -88]
  ].forEach(function (p, i) {
    campTents.push(props.ridgeTent(p[0], p[1], i >= 6, 3.1 + (i % 3) * 0.32, 3.9 + (i % 2) * 0.5, 1.2));
  });
  props.campClutter(-30, -86); props.campClutter(30, -86); props.campClutter(-2, -88);
  props.camel(-44, -90, 0.6); props.camel(44, -92, -2.4); props.camel(-6, -80, 2.8);
  props.horse(16, -90, 2.6, false); props.horse(-18, -92, 0.4, true);
  particles.smoke.add(-30, -86); particles.smoke.add(30, -86); particles.smoke.add(0, -88);
  particles.dust.material.color.setHex(0xcbb89c);

  var station = new THREE.Group();
  station.position.set(STATION.x, heightAt(STATION.x, STATION.z), STATION.z);
  scene.add(station);
  var base = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.9, 0.22, 22), new THREE.MeshLambertMaterial({ color: 0x7f7462 }));
  base.position.y = 0.11; base.receiveShadow = true; base.castShadow = true; station.add(base);
  for (var sl = 0; sl < 7; sl++) {
    var slab = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.075, 1.75),
      new THREE.MeshLambertMaterial({ color: sl % 2 ? 0x8c8069 : 0x978b73 }));
    slab.position.set(0, 0.255, -4.35 + sl * 1.45);
    slab.receiveShadow = true; station.add(slab);
  }
  var stationStd = cast.eventStandard(0, 0.24, 0, -0.035, false, station);
  stationStd.scale.setScalar(1.6);
  [[-4.7, -2.6, 1], [4.7, -2.6, -1], [-4.7, 2.7, 1], [4.7, 2.7, -1]].forEach(function (pp2) {
    var pen = cast.eventStandard(pp2[0], 0.22, pp2[1], 0.04 * pp2[2], false, station);
    pen.scale.setScalar(0.86);
  });
  [[-4.1, -3.2, 2.4], [4.1, -3.2, -2.4], [-5.0, 0.5, 1.7], [5.0, 0.5, -1.7], [-3.5, 3.2, 2.9], [3.5, 3.2, -2.9]
  ].forEach(function (q) {
    var f = cast.makeFighter({ x: 0, y: 0, z: 0, ry: q[2], robe: 0xe4ddcb, robeDark: 0x81755f, weapon: 'spear', scale: 0.96 });
    f.group.remove(f.stump); f.group.remove(f.stepLeg);
    station.add(f.group);
    f.group.position.set(q[0], 0.22, q[1]);
  });
  station.userData.keep = true;
  var merge = ENGINE.merge;
  merge.mergeMeshList(merge.collectMergeable(station), station, true);

  /* ------------------------------ the fort chain (KHY-004, KHY-006 … KHY-008).
     Five named compounds climb the shelf from Naʿīm in the west to al-Qamūṣ in
     the east: battered stone walls, a crenellated gatehouse, a keep tower, a
     garrison, a dark pennant that comes down and a white flag that goes up.
     The gate leaves, flags and garrison are dynamic; the shell is baked. */
  var STONE = new THREE.MeshLambertMaterial({ color: 0x8d7f66 });
  var STONE_D = new THREE.MeshLambertMaterial({ color: 0x695e4b });
  var STONE_L = new THREE.MeshLambertMaterial({ color: 0x9e9076 });
  var HOLE = new THREE.MeshLambertMaterial({ color: 0x17130f });

  function cBlock(parent, w, h, d, x, y, z, m) {
    var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, z);
    b.castShadow = true; b.receiveShadow = true;
    parent.add(b);
    return b;
  }

  var compoundList = [];
  function compound(c) {
    var g = new THREE.Group();
    g.position.set(c.x, c.padY, c.z);
    scene.add(g);
    var halfW = c.w * 1.75, halfD = c.w * 1.45;
    var wallH = 3.4 + Math.min(1.2, c.h * 0.07);
    var th = 0.92, gateHalf = 2.4 + c.w * 0.07;
    var shell = new THREE.Group();
    g.add(shell);
    /* the courtyard floor, then plinth and walls */
    cBlock(shell, halfW * 2, 0.2, halfD * 2, 0, 0.10, 0, STONE_D);
    cBlock(shell, halfW * 2 + 1.2, 0.34, th + 0.7, 0, 0.17, halfD, STONE_D);
    cBlock(shell, halfW * 2 + 1.2, 0.34, th + 0.7, 0, 0.17, -halfD, STONE_D);
    cBlock(shell, th + 0.7, 0.34, halfD * 2, -halfW, 0.17, 0, STONE_D);
    cBlock(shell, th + 0.7, 0.34, halfD * 2, halfW, 0.17, 0, STONE_D);
    cBlock(shell, halfW * 2 + th, wallH, th, 0, wallH / 2, halfD, STONE);
    cBlock(shell, th, wallH, halfD * 2, -halfW, wallH / 2, 0, STONE);
    cBlock(shell, th, wallH, halfD * 2, halfW, wallH / 2, 0, STONE);
    var segLen = halfW - gateHalf;
    cBlock(shell, segLen, wallH, th, -(gateHalf + segLen / 2), wallH / 2, -halfD, STONE);
    cBlock(shell, segLen, wallH, th, gateHalf + segLen / 2, wallH / 2, -halfD, STONE);
    /* string course and merlons on every wall */
    [[halfW * 2 + th, halfD], [halfW * 2 + th, -halfD]].forEach(function (wz) {
      cBlock(shell, wz[0] + 0.25, 0.2, th + 0.25, 0, wallH - 0.1, wz[1], STONE_L);
    });
    [[halfD * 2, -halfW], [halfD * 2, halfW]].forEach(function (wx) {
      cBlock(shell, th + 0.25, 0.2, wx[0] + 0.25, wx[1], wallH - 0.1, 0, STONE_L);
    });
    var mStep = 2.7;
    for (var mx = -halfW + 1.4; mx <= halfW - 1.4; mx += mStep) {
      if (Math.abs(mx) < gateHalf + 0.9) {
        cBlock(shell, 0.58, 0.44, 0.34, mx, wallH + 0.22, halfD, STONE_L);
        continue;
      }
      cBlock(shell, 0.58, 0.44, 0.34, mx, wallH + 0.22, halfD, STONE_L);
      cBlock(shell, 0.58, 0.44, 0.34, mx, wallH + 0.22, -halfD, STONE_L);
    }
    for (var mz = -halfD + 1.4; mz <= halfD - 1.4; mz += mStep) {
      cBlock(shell, 0.34, 0.44, 0.58, -halfW, wallH + 0.22, mz, STONE_L);
      cBlock(shell, 0.34, 0.44, 0.58, halfW, wallH + 0.22, mz, STONE_L);
    }
    /* the gatehouse, its posts and its steps */
    cBlock(shell, gateHalf * 2 + 3.2, 1.5, th + 0.6, 0, wallH + 0.75, -halfD, STONE_D);
    [-(gateHalf + 0.65), gateHalf + 0.65].forEach(function (px) {
      cBlock(shell, 1.15, wallH + 0.85, 1.5, px, (wallH + 0.85) / 2, -halfD, STONE_L);
      cBlock(shell, 1.35, 0.22, 1.7, px, wallH + 0.9, -halfD, STONE_L);
    });
    cBlock(shell, gateHalf * 2 + 3.4, 0.3, 1.0, 0, wallH + 1.55, -halfD, STONE_L);
    cBlock(shell, gateHalf * 2 + 1.0, 0.16, 1.1, 0, 0.08, -halfD - 1.05, STONE_D);
    /* corner towers, a step above the walls */
    [[-halfW, -halfD], [halfW, -halfD], [-halfW, halfD], [halfW, halfD]].forEach(function (cn) {
      cBlock(shell, 2.1, wallH + 1.7, 2.1, cn[0], (wallH + 1.7) / 2, cn[1], STONE_L);
      cBlock(shell, 2.4, 0.22, 2.4, cn[0], wallH + 1.78, cn[1], STONE_D);
      cBlock(shell, 0.7, 0.5, 0.4, cn[0] - 0.5, wallH + 2.14, cn[1], STONE_D);
      cBlock(shell, 0.7, 0.5, 0.4, cn[0] + 0.5, wallH + 2.14, cn[1], STONE_D);
    });
    /* the keep: the shared carved tower, re-parented and scaled */
    var keepH = c.h * 0.82;
    var keep = props.fort(c.x, c.z, {
      h: keepH, w: c.w * 0.66, seed: c.seed,
      tone: { stone: 0x8a7c63, dark: 0x615643, trim: 0x9d8e72 }, annex: c.w > 12
    });
    scene.remove(keep);
    shell.add(keep);
    keep.position.set(0, 0.12, halfD * 0.16);

    /* the gate leaves: pivoted, baked locally, swung open on capture */
    var gateL = new THREE.Group(), gateR = new THREE.Group();
    gateL.position.set(-gateHalf - 0.65, 0, -halfD - 0.55);
    gateR.position.set(gateHalf + 0.65, 0, -halfD - 0.55);
    cBlock(gateL, gateHalf + 0.6, wallH * 0.86, 0.2, (gateHalf + 0.6) / 2, wallH * 0.43 + 0.1, 0, STONE_D);
    cBlock(gateR, gateHalf + 0.6, wallH * 0.86, 0.2, -(gateHalf + 0.6) / 2, wallH * 0.43 + 0.1, 0, STONE_D);
    [gateL, gateR].forEach(function (leaf) {
      cBlock(leaf, 0.24, wallH * 0.86, 0.3, 0, wallH * 0.43 + 0.1, 0, STONE_L);
      leaf.userData.dynamicRoot = true;
      g.add(leaf);
      merge.mergeMeshList(merge.collectMergeable(leaf), leaf, true);
    });

    /* the dark pennant over the gate and the white flag on the keep */
    var gateFlag = new THREE.Group();
    gateFlag.position.set(0, wallH + 1.55, -halfD);
    var fp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.1, 5), cast.mats.poleQ);
    fp.position.y = 1.05; fp.castShadow = true; gateFlag.add(fp);
    var fcloth = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.66),
      new THREE.MeshLambertMaterial({ color: 0x2b2620, side: THREE.DoubleSide }));
    fcloth.position.set(0.53, 1.72, 0); gateFlag.add(fcloth);
    gateFlag.userData.dynamicRoot = true;
    g.add(gateFlag);
    merge.mergeMeshList(merge.collectMergeable(gateFlag), gateFlag, true);

    var whiteFlag = new THREE.Group();
    whiteFlag.position.set(0, keepH + 0.1, halfD * 0.16);
    var wp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.4, 5), cast.mats.poleM);
    wp.position.y = 1.2; wp.castShadow = true; whiteFlag.add(wp);
    var wcloth = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.72),
      new THREE.MeshLambertMaterial({ color: 0xe8e2d2, side: THREE.DoubleSide }));
    wcloth.position.set(0.58, 1.92, 0); whiteFlag.add(wcloth);
    whiteFlag.userData.dynamicRoot = true;
    whiteFlag.visible = false;
    g.add(whiteFlag);
    merge.mergeMeshList(merge.collectMergeable(whiteFlag), whiteFlag, true);

    /* the garrison: faceless, spear and helmet, inside the courtyard */
    var garrison = new THREE.Group();
    var gn = 5 + (c.seed % 3);
    for (var gi = 0; gi < gn; gi++) {
      var ga = gi / gn * Math.PI * 2 + c.seed * 0.4;
      var gr = Math.min(halfW, halfD) * (0.52 + 0.10 * ((gi + c.seed) % 3));
      var gf = cast.makeFighter({
        x: 0, y: 0, z: 0, ry: -ga + Math.PI,
        robe: 0x6c6150, robeDark: 0x4a4237,
        weapon: gi % 3 === 0 ? 'sword' : 'spear', helmet: true, scale: 0.94
      });
      gf.group.remove(gf.stump); gf.group.remove(gf.stepLeg);
      garrison.add(gf.group);
      gf.group.position.set(Math.cos(ga) * gr, 0.2, halfD * 0.16 + Math.sin(ga) * gr);
    }
    garrison.userData.dynamicRoot = true;
    g.add(garrison);
    merge.mergeMeshList(merge.collectMergeable(garrison), garrison, true);

    merge.mergeMeshList(merge.collectMergeable(shell), shell, true);
    g.userData.keep = true;
    var rec = {
      def: c, group: g, gateL: gateL, gateR: gateR, gateFlag: gateFlag,
      whiteFlag: whiteFlag, garrison: garrison, captured: false
    };
    compoundList.push(rec);
    return rec;
  }
  COMPOUNDS.forEach(compound);

  /* ruined satellites and the dark massifs behind the chain */
  props.fort(-70, 116, { w: 6, h: 6.2, seed: 111, ruin: 0.55, tone: { stone: 0x736853, dark: 0x554b3b, trim: 0x887a61 } });
  props.fort(-18, 120, { w: 5.5, h: 5.8, seed: 112, ruin: 0.7, tone: { stone: 0x6d634f, dark: 0x4f4638, trim: 0x83755e } });
  props.fort(18, 116, { w: 6, h: 6.0, seed: 113, ruin: 0.5, tone: { stone: 0x746954, dark: 0x564c3c, trim: 0x897b62 } });
  props.ridge(-170, 180, 70, 34, 0x5c5548);
  props.ridge(-60, 210, 80, 42, 0x61594b);
  props.ridge(70, 200, 75, 38, 0x57503f);
  props.ridge(180, 150, 65, 30, 0x6a6151);

  /* ------------------------------ the Muslim bands and their plans.
     About 1,400 men in three divisions on the flat floor (KHY-002); the plans
     carry them from the night camp to the oasis edge, hold them through the
     siege and bring them back to the camp for the reckoning. */
  var mLeft = cast.band(0, -34, -58, null, null);
  var mCentre = cast.band(0, 0, -58, 'the Muslims · about 1,400', 'KHY-002');
  var mRight = cast.band(0, 34, -58, null, null);
  var mBands = [mLeft, mCentre, mRight];
  mCentre.k = 'army';
  mCentre.labelY = 5.4;
  ENGINE.crowd.build({
    side: 0, count: 1400, cols: 48, dxS: 1.82, dzS: 1.9, z0: -58, h: 1.9,
    divFiles: 16, divPitch: 34, blocks: mBands, scene: scene
  });
  var PLAN_L = [[-34, -58], [-34, -34], [-30, 10], [-28, 12], [-26, 14], [-26, -48]];
  var PLAN_C = [[0, -58], [0, -34], [4, 10], [2, 12], [2, 14], [0, -48]];
  var PLAN_R = [[34, -58], [34, -34], [42, 10], [44, 12], [48, 14], [38, -48]];
  mLeft.plan = PLAN_L; mCentre.plan = PLAN_C; mRight.plan = PLAN_R;

  /* ------------------------------ the horse, about two hundred (KHY-002) */
  function cavalrySquadron(n, cols, dx, dz) {
    var g = new THREE.Group();
    var k = 0;
    for (var r = 0; r < Math.ceil(n / cols); r++) {
      for (var c = 0; c < cols && k < n; c++, k++) {
        var jr = (Math.abs(Math.sin(k * 5.3) * 911) % 1 - 0.5) * 0.2;
        var hx = (c - (cols - 1) / 2) * dx + (Math.abs(Math.sin(k * 5.7)) % 1 - 0.5) * 0.5;
        var hz = r * dz + (c % 2) * 0.55 + (Math.abs(Math.sin(k * 3.1)) % 1 - 0.5) * 0.5;
        var hs = props.horse(0, 0, 0, false);
        scene.remove(hs);
        hs.position.set(hx, 0, hz);
        hs.rotation.y = jr;
        g.add(hs);
        var rider = cast.makeFighter({
          x: 0, y: 0, z: 0, ry: 0,
          robe: 0xd2c9b4, robeDark: 0x8f8168,
          weapon: 'spear', shield: true, scale: 0.9
        });
        scene.remove(rider.group);
        rider.group.remove(rider.stump); rider.group.remove(rider.stepLeg);
        rider.group.position.set(hx - 0.1, 1.5, hz);
        rider.group.rotation.y = jr;
        g.add(rider.group);
      }
    }
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    merge.mergeMeshList(merge.collectMergeable(g), g, true);
    g.userData.dynamicRoot = true;
    scene.add(g);
    return { group: g, label: 'the horse · about 200', entry: 'KHY-002', k: 'horse', labelY: 4.2, home: [96, -44], side: 0 };
  }
  var cav = cavalrySquadron(12, 4, 2.0, 3.0);
  cav.group.position.set(96, heightAt(96, -44), -44);
  cav.group.rotation.y = -Math.PI / 2;
  var CAV_PLAN = [[96, -44], [88, -20], [80, 0], [80, 0], [80, 0], [96, -44]];

  /* ------------------------------ the ram at an-Nizār (KHY-008).
     A timber shed on wheels with four faceless pushers, kept at the gate after
     the storm. al-Qamūṣ gets no ram: its manner is disputed (KHY-013). */
  var ram = (function () {
    var g = new THREE.Group();
    var wood = new THREE.MeshLambertMaterial({ color: 0x6a583c });
    var woodD = new THREE.MeshLambertMaterial({ color: 0x4d3f2b });
    var iron = new THREE.MeshLambertMaterial({ color: 0x4b4640 });
    function bp(w, h, d, x, y, z, m, rx) {
      var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m || wood);
      b.position.set(x, y, z);
      if (rx) b.rotation.x = rx;
      b.castShadow = true; b.receiveShadow = true;
      g.add(b);
      return b;
    }
    [-0.95, 0.95].forEach(function (sx) {
      bp(0.16, 1.9, 3.4, sx, 0.95, 0);
      bp(1.9, 0.14, 0.14, 0, 1.9, -1.5);
      bp(1.9, 0.14, 0.14, 0, 1.9, 1.5);
    });
    bp(2.15, 0.16, 3.6, 0, 2.1, 0, woodD);
    bp(2.0, 0.12, 3.2, 0, 2.32, 0, wood);
    [-0.55, 0.55].forEach(function (wz) {
      [-1.05, 1.05].forEach(function (wx) {
        var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 12), woodD);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.42, wz);
        wheel.castShadow = true; g.add(wheel);
      });
    });
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 3.8, 7), wood);
    beam.rotation.x = Math.PI / 2;
    beam.position.set(0, 1.25, 0.5);
    beam.castShadow = true; g.add(beam);
    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.5, 6), iron);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(0, 1.25, 2.6);
    tip.castShadow = true; g.add(tip);
    [-0.8, 0.8].forEach(function (rz) {
      var rope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.0, 4), new THREE.MeshLambertMaterial({ color: 0x8a7a5a }));
      rope.position.set(0, 1.72, rz);
      rope.rotation.z = 0.3;
      g.add(rope);
    });
    [[-0.55, -0.7], [0.55, -0.7], [-0.55, 0.7], [0.55, 0.7]].forEach(function (p, pi) {
      var f = cast.makeFighter({
        x: 0, y: 0, z: 0, ry: Math.PI + (pi % 2 ? 0.2 : -0.2),
        robe: 0x8a7c66, robeDark: 0x5c5142, scale: 0.9
      });
      f.group.remove(f.stump); f.group.remove(f.stepLeg);
      g.add(f.group);
      f.group.position.set(p[0], 0, p[1] - 0.3);
    });
    merge.mergeMeshList(merge.collectMergeable(g), g, true);
    g.userData.dynamicRoot = true;
    g.visible = false;
    scene.add(g);
    return { group: g, label: 'the ram at an-Nizār · reported', entry: 'KHY-008', k: 'ram', labelY: 4.6 };
  })();
  var RAM_PATH = [[20, 34], [28, 48], [38, 60], [44, 76.5]];
  ram.group.position.set(20, heightAt(20, 34), 34);
  ram.group.rotation.y = 0.5;

  /* ------------------------------ the siege lines below al-Qamūṣ (KHY-013).
     Pale tents, clutter and wooden mantlets; no ram. Hidden until the siege. */
  var siegeLines = new THREE.Group();
  siegeLines.userData.dynamicRoot = true;
  siegeLines.visible = false;
  scene.add(siegeLines);
  [[88, 36], [100, 33], [112, 35], [120, 40], [124, 31], [112, 26]].forEach(function (p, i) {
    var t = props.ridgeTent(p[0], p[1], false, 2.7 + (i % 2) * 0.4, 3.4, 1.1);
    scene.remove(t);
    siegeLines.add(t);
  });
  [[-0.9, 3, 0.3], [0.9, 3, 0.2]].forEach(function (p) {
    var cl = props.campClutter(96 + p[0], 38 + p[1], null);
    scene.remove(cl);
    cl.position.y = heightAt(96 + p[0], 38 + p[1]);
    siegeLines.add(cl);
  });
  var siegeCamels = [props.camel(84, 30, 0.4), props.camel(118, 28, -1.9)];
  siegeCamels.forEach(function (cm) {
    scene.remove(cm);
    cm.position.y = heightAt(cm.position.x, cm.position.z);
    siegeLines.add(cm);
  });
  var mantletM = new THREE.MeshLambertMaterial({ color: 0x6d5b3f });
  var mantletD = new THREE.MeshLambertMaterial({ color: 0x50432f });
  [[90, 41], [100, 40], [110, 41], [116, 40]].forEach(function (p) {
    var mg = new THREE.Group();
    var face = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.5, 0.12), mantletM);
    face.position.y = 0.15; face.rotation.x = -0.18; face.castShadow = true; mg.add(face);
    [-0.75, 0.75].forEach(function (sx) {
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.3, 5), mantletD);
      leg.position.set(sx, 0.55, 0.32); leg.rotation.x = 0.5; leg.castShadow = true; mg.add(leg);
    });
    mg.position.set(p[0], heightAt(p[0], p[1]), p[1]);
    siegeLines.add(mg);
  });
  merge.mergeMeshList(merge.collectMergeable(siegeLines), siegeLines, true);

  /* ------------------------------ the standard and the duel (KHY-009 … KHY-011).
     Named figures are explicitly approved for this pass and stay faceless.
     The Marḥab pairing and the kill are reported, never certain. */
  function duelFigure(o) {
    var f = cast.makeFighter(o);
    f.group.remove(f.stump); f.group.remove(f.stepLeg);
    f.armR.userData.keep = true;
    f.armL.userData.keep = true;
    f.group.updateMatrixWorld(true);
    merge.mergeMeshList(merge.collectMergeable(f.group), f.group, true);
    merge.mergeMeshList(merge.collectMergeable(f.armR), f.armR, true);
    merge.mergeMeshList(merge.collectMergeable(f.armL), f.armL, true);
    f.group.userData.dynamicRoot = true;
    scene.add(f.group);
    return f;
  }
  var amir = duelFigure({
    x: 60, y: heightAt(60, 20), z: 20, ry: 0.9,
    robe: 0xd8cfba, robeDark: 0x9c8f76, weapon: 'sword', shield: false, scale: 1.0
  });
  var marhab = duelFigure({
    x: 80, y: heightAt(80, 44), z: 44, ry: -2.2,
    robe: 0x5c5142, robeDark: 0x3a332a, weapon: 'sword', shield: true, helmet: true, scale: 1.08
  });
  var ali = duelFigure({
    x: 56, y: heightAt(56, 22), z: 22, ry: 0.7,
    robe: 0xe4ddcb, robeDark: 0x8f8168, weapon: 'sword', shield: true, helmet: true, scale: 1.03
  });
  [[amir, 60, 20], [marhab, 80, 44], [ali, 56, 22]].forEach(function (q) {
    q[0].group.position.set(q[1], heightAt(q[1], q[2]), q[2]);
  });

  var aliStd = cast.championUnit(0, 58, 24, 'ʿAlī (RA)', 'KHY-009');
  var marhabStd = cast.championUnit(1, 79, 40, 'Marḥab · reported', 'KHY-011');
  aliStd.group.position.y = heightAt(58, 24);
  marhabStd.group.position.y = heightAt(79, 40);
  aliStd.group.visible = false;
  marhabStd.group.visible = false;
  delete aliStd.hideAfterPhase; delete marhabStd.hideAfterPhase;
  aliStd.group.userData.dynamicRoot = true;
  marhabStd.group.userData.dynamicRoot = true;
  aliStd.k = 'aliStd'; marhabStd.k = 'marhabStd';
  aliStd.labelY = 4.9; marhabStd.labelY = 4.9;
  var aliStdBaseY = aliStd.group.position.y;
  var marhabStdBaseY = marhabStd.group.position.y;

  /* ------------------------------ the return from Abyssinia (KHY-019) */
  var ret = new THREE.Group();
  ret.userData.dynamicRoot = true;
  ret.visible = false;
  scene.add(ret);
  [[-1.3, 0], [0, 0], [1.3, 0], [-0.7, 1.3], [0.8, 1.3], [1.9, 1.3]].forEach(function (p, i) {
    var f = cast.makeFighter({
      x: 0, y: 0, z: 0, ry: 0,
      robe: 0xd8cfba, robeDark: 0x94876f,
      weapon: 'spear', shield: i < 3, scale: 0.98
    });
    f.group.remove(f.stump); f.group.remove(f.stepLeg);
    ret.add(f.group);
    f.group.position.set(p[0], 0, p[1]);
  });
  var retStd = cast.eventStandard(0, 2.4, 0, 0, false, ret);
  retStd.scale.setScalar(1.15);
  merge.mergeMeshList(merge.collectMergeable(ret), ret, true);
  var RET_PATH = [[120, -160], [100, -130], [70, -104], [44, -82]];

  /* ------------------------------ the reckoning props (KHY-014 … KHY-019).
     Produce baskets, the pale tent, the covered meal and the overturned pots
     each appear on their own beat; the memorial marks the field after. */
  function reckonedGroup(vis) {
    var g = new THREE.Group();
    g.userData.dynamicRoot = true;
    g.visible = !!vis;
    scene.add(g);
    return g;
  }
  var remainGroup = reckonedGroup(false);
  [[56, -79], [59.5, -77], [61, -80], [57, -81.5]].forEach(function (p, i) {
    var b = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.34, 0.55, 9),
      new THREE.MeshLambertMaterial({ color: i % 2 ? 0x9c8358 : 0x86704b }));
    b.position.set(p[0], heightAt(p[0], p[1]) + 0.28, p[1]);
    b.castShadow = true; b.receiveShadow = true;
    remainGroup.add(b);
    for (var fr = 0; fr < 4; fr++) {
      var dt = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5),
        new THREE.MeshLambertMaterial({ color: 0xc39a45 }));
      dt.position.set(p[0] + Math.cos(fr * 1.6) * 0.18, b.position.y + 0.34, p[1] + Math.sin(fr * 1.6) * 0.18);
      remainGroup.add(dt);
    }
  });
  merge.mergeMeshList(merge.collectMergeable(remainGroup), remainGroup, true);

  var safiyyaGroup = reckonedGroup(false);
  var safTent = props.ridgeTent(34, -98, false, 3.2, 4.0, 1.25);
  scene.remove(safTent);
  safiyyaGroup.add(safTent);
  merge.mergeMeshList(merge.collectMergeable(safiyyaGroup), safiyyaGroup, true);

  var mealGroup = reckonedGroup(false);
  var mealStone = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 1.2),
    new THREE.MeshLambertMaterial({ color: 0x776c5a }));
  mealStone.position.set(22, heightAt(22, -84) + 0.11, -84);
  mealStone.castShadow = true; mealStone.receiveShadow = true; mealGroup.add(mealStone);
  var platter = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.56, 0.14, 12),
    new THREE.MeshLambertMaterial({ color: 0xb7a276 }));
  platter.position.set(22, mealStone.position.y + 0.18, -84); platter.castShadow = true; mealGroup.add(platter);
  var cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.58, 0.22, 12),
    new THREE.MeshLambertMaterial({ color: 0xe0d6c2 }));
  cloth.position.set(22, platter.position.y + 0.18, -84); cloth.castShadow = true; mealGroup.add(cloth);
  merge.mergeMeshList(merge.collectMergeable(mealGroup), mealGroup, true);

  var potsGroup = reckonedGroup(false);
  [[18, -72], [19.6, -73.4], [17.6, -74.2]].forEach(function (p, i) {
    var pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.4, 8),
      new THREE.MeshLambertMaterial({ color: i % 2 ? 0x7a6a4e : 0x6a5c44 }));
    pot.position.set(p[0], heightAt(p[0], p[1]) + 0.16, p[1]);
    pot.rotation.z = 1.15 + i * 0.12;
    pot.rotation.y = i * 0.7;
    pot.castShadow = true; potsGroup.add(pot);
  });
  merge.mergeMeshList(merge.collectMergeable(potsGroup), potsGroup, true);

  var memorialGroup = reckonedGroup(false);
  var memBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.2, 12),
    new THREE.MeshLambertMaterial({ color: 0x6e6452 }));
  memBase.position.set(71, heightAt(71, 31) + 0.1, 31);
  memBase.receiveShadow = true; memorialGroup.add(memBase);
  [[-0.34, 0.22, 0.16], [0.34, -0.22, -0.16]].forEach(function (r) {
    var sp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 3.0, 5), cast.mats.poleM);
    sp.position.set(71, memBase.position.y + 1.5, 31);
    sp.rotation.z = r[0];
    sp.rotation.x = r[1];
    sp.castShadow = true; memorialGroup.add(sp);
  });
  var memFlag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6),
    new THREE.MeshLambertMaterial({ color: 0xe8e2d2, side: THREE.DoubleSide }));
  memFlag.position.set(71.7, memBase.position.y + 2.8, 31);
  memorialGroup.add(memFlag);
  merge.mergeMeshList(merge.collectMergeable(memorialGroup), memorialGroup, true);

  /* the dust that hangs at the Qamūṣ gate when it opens */
  var QD_N = MOBILE ? 34 : 70;
  var qdGeo = new THREE.BufferGeometry();
  var qdPos = new Float32Array(QD_N * 3);
  for (var qi = 0; qi < QD_N; qi++) {
    qdPos[qi * 3] = 94 + (Math.random() - 0.5) * 12;
    qdPos[qi * 3 + 1] = 0.4 + Math.random() * 3.4;
    qdPos[qi * 3 + 2] = 43 + (Math.random() - 0.5) * 7;
  }
  qdGeo.setAttribute('position', new THREE.BufferAttribute(qdPos, 3));
  var qamusDust = new THREE.Points(qdGeo, new THREE.PointsMaterial({
    color: 0xcdbaa0, size: 1.5, transparent: true, opacity: 0, depthWrite: false
  }));
  qamusDust.visible = false;
  scene.add(qamusDust);

  /* ------------------------------ labels */
  function mkLabel(txt, cls) { return ENGINE.labels.mkLabel(labelBox, txt, cls); }
  var fortY = {};
  COMPOUNDS.forEach(function (c) { fortY[c.id] = c.padY + c.h * 0.82 + 2.0; });
  var LAND = [
    { w: [0, 13, 22], t: 'the oasis of Khaybar', e: 'KHY-001', k: 'oasis', cls: 'is-land-name', ph: [0, 1, 5] },
    { w: [-150, 26, 44], t: 'the ḥarra · dark volcanic ground', e: 'KHY-003', k: 'harra', cls: 'is-land-name is-far', ph: [0, 5] },
    { w: [0, 5.2, -80], t: 'the Muslim camp', e: 'KHY-007', k: 'camp', cls: 'is-land-name', ph: [0, 1, 5] },
    { w: [STATION.x, heightAt(STATION.x, STATION.z) + 5.6, STATION.z], t: 'the Prophet’s station (PBUH)', e: 'KHY-009', k: 'prophet', cls: 'is-tap is-event', ph: [0, 1] },
    { w: [-70, 6.4, -18], t: 'the wells', e: 'KHY-001', k: 'wells', cls: 'is-land', ph: [0, 1] },
    { w: [52, 10, -50], t: 'the palm groves', e: 'KHY-001', k: 'groves', cls: 'is-land', ph: [0, 1, 5] },
    { w: [-92, fortY.naim, 84], t: 'Naʿīm', e: 'KHY-004', k: 'naim', cls: 'is-land-name', ph: [0, 1, 2, 3, 4, 5] },
    { w: [-44, fortY.zubair, 92], t: 'az-Zubair', e: 'KHY-004', k: 'zubair', cls: 'is-land-name', ph: [0, 1, 2, 3, 4, 5] },
    { w: [2, fortY.abi, 102], t: 'ʿĀbi', e: 'KHY-004', k: 'abi', cls: 'is-land-name', ph: [0, 1, 2, 3, 4, 5] },
    { w: [44, fortY.nizar, 92], t: 'an-Nizār · ash-Shiqq', e: 'KHY-004', k: 'nizar', cls: 'is-land-name', ph: [0, 1, 2, 3, 4, 5] },
    { w: [94, fortY.qamus, 66], t: 'al-Qamūṣ · the chief fort', e: 'KHY-013', k: 'qamus', cls: 'is-land-name', ph: [0, 1, 2, 3, 4, 5] },
    { w: [12, 4.4, -148], t: 'the road north · from Madinah', e: 'KHY-003', k: 'road', cls: 'is-land-name is-far', ph: [0] }
  ];
  var LANDL = LAND.map(function (l) {
    var node = mkLabel(l.t, l.cls);
    return { el: node, v: new THREE.Vector3(l.w[0], l.w[1], l.w[2]), k: l.k, ph: l.ph, tRange: l.tRange };
  });
  var UNIT_DEFS = [
    { u: mCentre, side: 0, labelY: 5.4, priority: 3, ph: [0, 1, 2, 3, 4, 5] },
    { u: cav, side: 0, labelY: 4.2, priority: 2, ph: [0, 1] },
    { u: aliStd, side: 0, labelY: 4.9, priority: 3, event: true, ph: [4], labelAlways: true },
    { u: marhabStd, side: 1, labelY: 4.9, priority: 3, event: true, ph: [4], tRange: [0.22, 0.7], labelAlways: true },
    { u: ram, side: 0, labelY: 4.6, priority: 2, event: true, ph: [2], tRange: [0.28, 0.95] }
  ];
  var ULABS = UNIT_DEFS.map(function (d) {
    d.u.k = d.u.k || ('unit' + Math.round((d.u.home ? d.u.home[0] : 0) * 10));
    d.u.labelY = d.labelY;
    d.u.priority = d.priority;
    d.u.event = !!d.event;
    if (d.ph) d.u.ph = d.ph;
    if (d.tRange) d.u.tRange = d.tRange;
    if (d.labelAlways) d.u.labelAlways = true;
    var node = mkLabel(d.u.label, (d.side ? '' : 'is-side') + (d.event ? ' is-event' : ''));
    return { el: node, u: d.u, k: d.u.k };
  });
  var marhabLabel = ULABS.filter(function (it) { return it.k === 'marhabStd'; })[0];

  var EVENT_MARKS = [
    { key: 'verse', label: '48:20 · “much booty … has hastened for you this [victory]”', e: 'KHY-020', x: 0, y: 9.5, z: 40, ph: [0], tRange: [0.50, 0.88], priority: 4 },
    { key: 'march1', label: 'Muḥarram, 7 AH · the march north', e: 'KHY-003', x: 0, y: 6.4, z: -52, ph: [1], tRange: [0.02, 0.38], priority: 4 },
    { key: 'march3', label: 'ʿĀmir (RA) chants the rajaz', e: 'KHY-014', x: 24, y: 4.6, z: -46, ph: [1], tRange: [0.26, 0.56], priority: 4 },
    { key: 'march2', label: 'they reach Khaybar at night', e: 'KHY-007', x: 0, y: 5.8, z: -30, ph: [1], tRange: [0.48, 0.70], priority: 4 },
    { key: 'march4', label: 'they do not attack until morning', e: 'KHY-007', x: 0, y: 8.0, z: -34, ph: [1], tRange: [0.70, 0.98], priority: 4 },
    { key: 'dawn', label: 'at dawn · “Khaibar is destroyed”', e: 'KHY-007', x: -78, y: 15, z: 54, ph: [2], tRange: [0.02, 0.18], priority: 4 },
    { key: 'naimFall', label: 'Naʿīm falls · reported first', e: 'KHY-008', x: -92, y: 19, z: 76, ph: [2], tRange: [0.08, 0.26], priority: 4 },
    { key: 'zubairFall', label: 'the garrison withdraws into az-Zubair', e: 'KHY-008', x: -44, y: 21, z: 84, ph: [2], tRange: [0.24, 0.42], priority: 4 },
    { key: 'water', label: 'the water is cut', e: 'KHY-008', x: -40, y: 14, z: 82, ph: [2], tRange: [0.40, 0.54], priority: 4 },
    { key: 'abiFall', label: 'ʿĀbi is broken open · Abū Dujānah (RA)', e: 'KHY-008', x: 2, y: 23, z: 94, ph: [2], tRange: [0.52, 0.68], priority: 4 },
    { key: 'nizarFall', label: 'an-Nizār is stormed with rams', e: 'KHY-008', x: 44, y: 23, z: 84, ph: [2], tRange: [0.66, 0.82], priority: 4 },
    { key: 'order', label: 'the order of the falls · reports differ', e: 'KHY-005', x: 52, y: 20, z: 92, ph: [2], tRange: [0.80, 0.96], priority: 4 },
    { key: 'hunger', label: 'the siege bites · severe hunger', e: 'KHY-014', x: 78, y: 5.5, z: 32, ph: [3], tRange: [0.04, 0.26], priority: 4 },
    { key: 'longSiege', label: 'the long siege holds', e: 'KHY-013', x: 94, y: 20, z: 70, ph: [3], tRange: [0.20, 0.62], priority: 4 },
    { key: 'banner', label: 'the banner is promised to ʿAlī (RA)', e: 'KHY-009', x: 54, y: 5.6, z: 23, ph: [4], tRange: [0.02, 0.16], priority: 4 },
    { key: 'eyes', label: 'ʿAlī’s (RA) eyes are cured', e: 'KHY-010', x: 58, y: 4.6, z: 22, ph: [4], tRange: [0.10, 0.24], priority: 4 },
    { key: 'love', label: 'he loves Allah and His Messenger', e: 'KHY-009', x: 56, y: 6.4, z: 24, ph: [4], tRange: [0.22, 0.34], priority: 4 },
    { key: 'amir', label: 'ʿĀmir (RA) advances', e: 'KHY-014', x: 64, y: 4.2, z: 30, ph: [4], tRange: [0.10, 0.26], priority: 4 },
    { key: 'recoil', label: 'ʿĀmir (RA) is struck by his own sword', e: 'KHY-014', x: 66, y: 3.6, z: 30, ph: [4], tRange: [0.26, 0.42], priority: 4 },
    { key: 'duel', label: 'ʿAlī (RA) meets Marḥab · reported', e: 'KHY-011', x: 71, y: 4.6, z: 34, ph: [4], tRange: [0.44, 0.62], priority: 4 },
    { key: 'marhabFalls', label: 'Marḥab falls · reported', e: 'KHY-011', x: 73, y: 4.0, z: 33, ph: [4], tRange: [0.58, 0.72], priority: 4 },
    { key: 'qamusFall', label: 'al-Qamūṣ falls · force or terms, reports differ', e: 'KHY-013', x: 94, y: 15, z: 56, ph: [4], tRange: [0.72, 0.90], priority: 4 },
    { key: 'reward', label: 'ʿĀmir (RA) · a double reward', e: 'KHY-014', x: 72, y: 5.4, z: 40, ph: [4], tRange: [0.82, 0.96], priority: 4 },
    { key: 'remain', label: 'the people remain · half the produce', e: 'KHY-015', x: 58, y: 4.5, z: -79, ph: [5], tRange: [0.14, 0.30], priority: 4 },
    { key: 'pots', label: 'the pots are overturned', e: 'KHY-014', x: 18, y: 3.2, z: -72, ph: [5], tRange: [0.04, 0.18], priority: 4 },
    { key: 'safiyya', label: 'Ṣafiyyah (RA) is freed · her manumission is her dowry', e: 'KHY-016', x: 34, y: 4.6, z: -98, ph: [5], tRange: [0.42, 0.58], priority: 4 },
    { key: 'sheep', label: 'a poisoned sheep · the Prophet (PBUH) stops', e: 'KHY-017', x: 22, y: 3.6, z: -84, ph: [5], tRange: [0.28, 0.44], priority: 4 },
    { key: 'jafar', label: 'Jaʿfar (RA) and Abū Mūsā (RA) return · shares are given', e: 'KHY-019', x: 44, y: 4.8, z: -84, ph: [5], tRange: [0.54, 0.74], priority: 4 },
    { key: 'after', label: 'the field after · the oasis remains', e: 'KHY-015', x: 26, y: 7.0, z: -96, ph: [5], tRange: [0.72, 0.94], priority: 4 }
  ];
  EVENT_MARKS.forEach(function (m) {
    var g = new THREE.Group();
    g.position.set(m.x, 0, m.z);
    g.userData.dynamicRoot = true;
    scene.add(g);
    m.group = g;
    m.labelNode = mkLabel(m.label, m.side ? 'is-event' : 'is-event is-side');
  });
  EVENT_MARKS.forEach(function (m) {
    ULABS.push({ el: m.labelNode, u: { k: m.key, label: m.label, group: m.group, labelY: m.y, event: true, priority: m.priority, labelAlways: true, ph: m.ph, tRange: m.tRange }, k: m.key });
  });

  var LABELS = {
    en: {
      army: 'the Muslims · about 1,400',
      horse: 'the horse · about 200',
      aliStd: 'ʿAlī (RA)',
      marhabStd: 'Marḥab · reported',
      ram: 'the ram at an-Nizār · reported',
      oasis: 'the oasis of Khaybar', harra: 'the ḥarra · dark volcanic ground',
      camp: 'the Muslim camp', prophet: 'the Prophet’s station (PBUH)',
      wells: 'the wells', groves: 'the palm groves',
      naim: 'Naʿīm', zubair: 'az-Zubair', abi: 'ʿĀbi',
      nizar: 'an-Nizār · ash-Shiqq', qamus: 'al-Qamūṣ · the chief fort',
      road: 'the road north · from Madinah',
      verse: '48:20 · “much booty … has hastened for you this [victory]”',
      march1: 'Muḥarram, 7 AH · the march north',
      march3: 'ʿĀmir (RA) chants the rajaz',
      march2: 'they reach Khaybar at night',
      march4: 'they do not attack until morning',
      dawn: 'at dawn · “Khaibar is destroyed”',
      naimFall: 'Naʿīm falls · reported first',
      zubairFall: 'the garrison withdraws into az-Zubair',
      water: 'the water is cut',
      abiFall: 'ʿĀbi is broken open · Abū Dujānah (RA)',
      nizarFall: 'an-Nizār is stormed with rams',
      order: 'the order of the falls · reports differ',
      hunger: 'the siege bites · severe hunger',
      longSiege: 'the long siege holds',
      banner: 'the banner is promised to ʿAlī (RA)',
      eyes: 'ʿAlī’s (RA) eyes are cured',
      love: 'he loves Allah and His Messenger',
      amir: 'ʿĀmir (RA) advances',
      recoil: 'ʿĀmir (RA) is struck by his own sword',
      duel: 'ʿAlī (RA) meets Marḥab · reported',
      marhabFalls: 'Marḥab falls · reported',
      qamusFall: 'al-Qamūṣ falls · force or terms, reports differ',
      reward: 'ʿĀmir (RA) · a double reward',
      remain: 'the people remain · half the produce',
      pots: 'the pots are overturned',
      safiyya: 'Ṣafiyyah (RA) is freed · her manumission is her dowry',
      sheep: 'a poisoned sheep · the Prophet (PBUH) stops',
      jafar: 'Jaʿfar (RA) and Abū Mūsā (RA) return · shares are given',
      after: 'the field after · the oasis remains'
    },
    ur: {
      army: 'مسلمان · تقریباً ۱۴۰۰',
      horse: 'سوار · تقریباً ۲۰۰',
      aliStd: 'علی رضی اللہ عنہ',
      marhabStd: 'مرحب · روایت میں ہے',
      ram: 'النزار پر دہرہ · روایت میں ہے',
      oasis: 'خیبر کا واحہ', harra: 'الحَرّہ · سیاہ آتش فشانی زمین',
      camp: 'مسلمانوں کا کیمپ', prophet: 'مقامِ نبوی ﷺ',
      wells: 'کنویں', groves: 'کھجور کے باغ',
      naim: 'نعیم', zubair: 'الزبیر', abi: 'عابی',
      nizar: 'النزار · الشق', qamus: 'القموص · بڑا قلعہ',
      road: 'شمال کا راستہ · مدینہ سے',
      verse: '۴۸:۲۰ · «وَعَجَّلَ لَكُمْ هَذِهِ»',
      march1: 'محرم ۷ ہجری · شمال کا سفر',
      march3: 'عامر رضی اللہ عنہ رجز پڑھتے ہیں',
      march2: 'رات کو خیبر پہنچے',
      march4: 'صبح تک حملہ نہیں کیا',
      dawn: 'صبح · ”خیبر ویران ہو گیا“',
      naimFall: 'نعیم گرا · پہلے، روایت میں ہے',
      zubairFall: 'چڑھی الزبیر کے قلعے میں چلی گئی',
      water: 'پانی بند',
      abiFall: 'عابی کھل گیا · ابو دجانہ رضی اللہ عنہ',
      nizarFall: 'النزار پر دہرے سے حملہ',
      order: 'گرنے کی ترتیب · روایتیں مختلف ہیں',
      hunger: 'محاصرہ سخت · شدید بھوک',
      longSiege: 'لمبا محاصرہ جاری',
      banner: 'پرچم علی رضی اللہ عنہ کو دینے کا وعدہ',
      eyes: 'علی رضی اللہ عنہ کی آنکھیں ٹھیک ہوئیں',
      love: 'وہ اللہ اور اس کے رسول سے محبت کرتے ہیں',
      amir: 'عامر رضی اللہ عنہ آگے بڑھے',
      recoil: 'عامر رضی اللہ عنہ اپنی تلوار سے زخمی ہوئے',
      duel: 'علی رضی اللہ عنہ مرحب سے ملے · روایت میں ہے',
      marhabFalls: 'مرحب گرا · روایت میں ہے',
      qamusFall: 'القموص گرا · زور یا صلح، روایتیں مختلف ہیں',
      reward: 'عامر رضی اللہ عنہ · دہرا اجر',
      remain: 'لوگ رہے · آدھی پیداوار',
      pots: 'ہانڈیاں الٹ دی گئیں',
      safiyya: 'صفیہ رضی اللہ عنہا آزاد کی گئیں · مہر ان کی آزادی',
      sheep: 'زہر آلود بھیڑ · نبی ﷺ رک گئے',
      jafar: 'جعفر رضی اللہ عنہ اور ابو موسیٰ رضی اللہ عنہ واپس · حصے دیے گئے',
      after: 'میدان بعد میں · واحہ باقی ہے'
    }
  };
  function setLang(lang) {
    var d = LABELS[lang] || LABELS.en;
    LANDL.forEach(function (it) { it.el.textContent = d[it.k] || it.el.textContent; });
    ULABS.forEach(function (it) { it.el.textContent = d[it.u.k] || it.el.textContent; });
  }

  /* ------------------------------ the static merge.
     Cloth stays live (WAVERS); everything that never moves is baked. Fort
     shells, the station and the duel bodies were already baked locally. */
  function mergeStaticScene() {
    scene.updateMatrixWorld(true);
    WAVERS.forEach(function (w) { w.mesh.userData.keep = true; });
    mBands.concat([aliStd, marhabStd]).forEach(function (b) {
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

  /* ------------------------------ phases and shots.
     Six phases, one continuous shot each: no cuts and no impact shakes in
     this pass. Ground → night march → first forts → al-Qamūṣ → the standard
     and the duel → the reckoning. */
  var PHASES = [
    { id: 'ground', name: 'the ground', dur: 10 },
    { id: 'march', name: 'the night march', dur: 13 },
    { id: 'forts', name: 'the first forts', dur: 17 },
    { id: 'qamus', name: 'al-Qamūṣ', dur: 14 },
    { id: 'duel', name: 'the standard · the duel', dur: 18 },
    { id: 'reckoning', name: 'the reckoning', dur: 14 }
  ];
  var TOTAL = 0; PHASES.forEach(function (p) { TOTAL += p.dur; });

  var SHOTS = {
    ground: [
      { t0: 0, t1: 1.001, p0: [-95, 57, -170], p1: [-55, 46, -128], l0: [0, 10, 44], l1: [14, 12, 60],
        portrait: { p0: [-90, 105, -245], p1: [-40, 92, -205], l0: [-6, 12, 46], l1: [10, 12, 60] } }
    ],
    march: [
      { t0: 0, t1: 1.001, p0: [126, 32, -34], p1: [92, 24, -54], l0: [-10, 2, -56], l1: [2, 3, -30],
        portrait: { p0: [152, 72, -70], p1: [118, 52, -86], l0: [-8, 3, -54], l1: [4, 4, -28] } }
    ],
    forts: [
      { t0: 0, t1: 1.001, p0: [-150, 62, -40], p1: [26, 80, 0], l0: [-88, 20, 64], l1: [84, 24, 82],
        portrait: { p0: [-160, 115, -100], p1: [-20, 135, -80], l0: [-80, 18, 56], l1: [70, 22, 80] } }
    ],
    qamus: [
      { t0: 0, t1: 1.001, p0: [22, 18, 4], p1: [62, 15, 30], l0: [90, 12, 54], l1: [94, 14, 60],
        portrait: { p0: [14, 40, -36], p1: [48, 34, 8], l0: [90, 14, 54], l1: [94, 17, 62] } }
    ],
    duel: [
      { t0: 0, t1: 1.001, p0: [46, 20, -12], p1: [60, 26, 4], l0: [68, 5, 32], l1: [80, 8, 50],
        portrait: { p0: [40, 46, -46], p1: [56, 56, -30], l0: [68, 6, 34], l1: [80, 8, 52] } }
    ],
    reckoning: [
      { t0: 0, t1: 1.001, p0: [104, 74, 30], p1: [52, 22, -46], l0: [40, 6, -58], l1: [32, 4, -88],
        portrait: { p0: [122, 118, 4], p1: [46, 48, -78], l0: [38, 7, -58], l1: [30, 4, -90] } }
    ]
  };
  var IMPACTS = [];
  var PRESETS = {
    ground: { p: [-55, 46, -128], l: [14, 12, 60] },
    aerial: { p: [30, 175, 150], l: [20, 10, 40] },
    forts: { p: [26, 80, 0], l: [84, 24, 82] },
    qamus: { p: [62, 15, 30], l: [94, 14, 60] },
    standard: { p: [54, 24, 2], l: [74, 6, 38] },
    duel: { p: [60, 26, 4], l: [80, 8, 50] },
    camp: { p: [58, 20, -34], l: [34, 4, -86] },
    oasis: { p: [-20, 30, -96], l: [20, 6, 10] }
  };
  var director = ENGINE.director(ctx);
  var clock = director.clock;

  /* ------------------------------ applying a frame */
  var FOG_BASE = new THREE.Color(0xb59a78);
  var FOG_NIGHT = new THREE.Color(0x3f4350);
  var curPhaseIdx = 0, curPhaseT = 0;

  function nightK(i, t) {
    if (i === 0) return 0.42;
    if (i === 1) {
      if (t < 0.12) return 0.42 + 0.43 * easeIO(t / 0.12);
      return 0.85 + (0.50 - 0.85) * easeIO((t - 0.12) / 0.88);
    }
    if (i === 2) return 0.50 * (1 - easeIO(clamp01(t / 0.22)));
    return 0;
  }
  function applyNight(n) {
    sky.dome.material.color.setRGB(1 - 0.55 * n, 1 - 0.52 * n, 1 - 0.42 * n);
    sky.stars.material.opacity = 0.20 + 0.30 * n;
    sky.hemi.intensity = 0.46 * (1 - 0.55 * n);
    sky.sun.intensity = 1.18 * (1 - 0.72 * n);
    sky.fill.intensity = 0.22 * (1 - 0.50 * n);
    sky.rim.intensity = 0.26 * (1 - 0.60 * n);
    scene.fog.color.copy(FOG_BASE).lerp(FOG_NIGHT, n);
    scene.fog.near = 180 - 60 * n;
    scene.fog.far = 560 - 140 * n;
  }

  function pathAt(pts, u) {
    var n = pts.length - 1;
    var f = clamp01(u) * n;
    var i = Math.min(n - 1, Math.floor(f));
    var k = f - i;
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
  }

  function applyCaptures(i, t) {
    for (var ci = 0; ci < compoundList.length; ci++) {
      var rec = compoundList[ci];
      var cap = rec.def.cap;
      var k = i > cap[0] ? 1 : (i === cap[0] ? clamp01((t - cap[1]) / 0.10) : 0);
      rec.captured = k > 0.5;
      rec.gateL.rotation.y = -1.22 * k;
      rec.gateR.rotation.y = 1.22 * k;
      rec.gateFlag.visible = k < 0.42;
      rec.garrison.visible = k < 0.42;
      rec.whiteFlag.visible = k > 0.30;
    }
  }

  function poseDuel(f, x, z, ry, walkT, fallen, armRX, armRZ) {
    var y = heightAt(x, z) + 0.02 + Math.abs(walkT) * 0.045;
    f.group.position.set(x, y - 0.10 * fallen, z);
    f.group.rotation.y = ry;
    f.group.rotation.x = -1.42 * fallen;
    f.armR.rotation.x = armRX;
    f.armR.rotation.z = armRZ || 0;
    f.armL.rotation.x = 0.12 * (1 + fallen);
  }

  function applyDuel(t) {
    var on = curPhaseIdx === 4;
    amir.group.visible = on; marhab.group.visible = on; ali.group.visible = on;
    aliStd.group.visible = curPhaseIdx >= 4;
    marhabStd.group.visible = curPhaseIdx >= 4;
    if (!on) {
      if (curPhaseIdx > 4) {
        amir.group.visible = false;
      }
      return;
    }
    /* ʿĀmir: advance, the recoil strike, the fall (KHY-014) */
    var amv = easeIO(clamp01((t - 0.10) / 0.16));
    var amx = t < 0.26 ? 60 + 4 * amv : 64;
    var amz = t < 0.26 ? 20 + 8 * amv : 28;
    var amWalk = (t >= 0.10 && t < 0.26) ? Math.sin(t * 34) : 0;
    var amArm = 0;
    if (t >= 0.26) amArm = -1.5 * clamp01((t - 0.26) / 0.03) * (1 - clamp01((t - 0.31) / 0.04));
    var amFall = easeIO(clamp01((t - 0.31) / 0.09));
    /* Marḥab: out of the gate, strike, fall (reported, KHY-011) */
    var mbv = easeIO(clamp01((t - 0.22) / 0.16));
    var mbx = t < 0.38 ? 80 + (72.8 - 80) * mbv : 72.8;
    var mbz = t < 0.38 ? 44 + (32.8 - 44) * mbv : 32.8;
    var mbWalk = (t >= 0.22 && t < 0.38) ? Math.sin(t * 32) : 0;
    var mbArm = 0;
    if (t >= 0.50) mbArm = -1.6 * clamp01((t - 0.50) / 0.04) * (1 - clamp01((t - 0.58) / 0.05));
    var mbFall = easeIO(clamp01((t - 0.58) / 0.12));
    /* ʿAlī: forward, the answer, the standing triumph (KHY-009 … KHY-011) */
    var alv = easeIO(clamp01((t - 0.30) / 0.18));
    var alx = t < 0.48 ? 56 + (71 - 56) * alv : 71;
    var alz = t < 0.48 ? 22 + (32.2 - 22) * alv : 32.2;
    var alWalk = (t >= 0.30 && t < 0.48) ? Math.sin(t * 30) : 0;
    var alArm = 0;
    if (t >= 0.50) alArm = -2.0 * clamp01((t - 0.50) / 0.03) * (1 - clamp01((t - 0.60) / 0.06));
    var alTriumph = easeIO(clamp01((t - 0.70) / 0.12));

    var amRy = Math.atan2(mbx - amx, mbz - amz);
    var mbRy = Math.atan2(alx - mbx, alz - mbz);
    var alRy = Math.atan2(mbx - alx, mbz - alz);
    poseDuel(amir, amx, amz, amRy, amWalk, amFall, amArm, 0);
    poseDuel(marhab, mbx, mbz, mbRy, mbWalk, mbFall, mbArm, 0);
    poseDuel(ali, alx, alz, alRy, alWalk, 0, alArm, -2.35 * alTriumph);

    var fall = mbFall;
    marhabStd.group.rotation.z = 1.25 * fall;
    marhabStd.group.position.y = marhabStdBaseY + 0.18 * fall;
    marhabLabel.u.labelY = 4.9 - 2.9 * fall;
    aliStd.group.rotation.z = -0.02 * alTriumph;

    remainGroup.visible = false; potsGroup.visible = false;
    safiyyaGroup.visible = false; mealGroup.visible = false; memorialGroup.visible = false;
    ret.visible = false;
  }

  function applyFrac(frac) {
    var info = director.phaseInfo(frac);
    var i = info.i, t = info.t;
    curPhaseIdx = i; curPhaseT = t;

    /* the three divisions */
    for (var k = 0; k < mBands.length; k++) {
      var u = mBands[k];
      var start = i === 0 ? u.plan[0] : u.plan[i - 1];
      var end = u.plan[i];
      var w0 = i === 0 ? 0 : 0.10;
      var mm = easeIO(clamp01((t - w0) / (0.86 - w0)));
      u.group.position.x = start[0] + (end[0] - start[0]) * mm;
      u.group.position.z = start[1] + (end[1] - start[1]) * mm;
      u.group.position.y = 0;
      u.group.rotation.x = 0;
    }

    /* the horse */
    var cStart = i === 0 ? CAV_PLAN[0] : CAV_PLAN[i - 1];
    var cEnd = CAV_PLAN[i];
    var cm = i === 0 ? 0 : easeIO(clamp01((t - 0.12) / 0.66));
    var cpx = cStart[0] + (cEnd[0] - cStart[0]) * cm;
    var cpz = cStart[1] + (cEnd[1] - cStart[1]) * cm;
    var gal = (i === 1 || i === 2 || i === 5) ? Math.abs(Math.sin(t * 30)) * 0.06 : 0;
    cav.group.position.set(cpx, heightAt(cpx, cpz) + gal, cpz);
    cav.group.rotation.y = i === 5 ? Math.PI / 2 : -Math.PI / 2;

    /* the ram at an-Nizār */
    ram.group.visible = i > 2 || (i === 2 && t > 0.22);
    var rp;
    if (i < 2) rp = RAM_PATH[0];
    else if (i === 2) rp = pathAt(RAM_PATH, easeIO(clamp01((t - 0.30) / 0.48)));
    else rp = RAM_PATH[RAM_PATH.length - 1];
    ram.group.position.set(rp[0], heightAt(rp[0], rp[1]), rp[1]);
    ram.group.rotation.y = 0.5;

    siegeLines.visible = i === 3 || i === 4 || i === 5;

    applyCaptures(i, t);
    applyDuel(t);

    /* the reckoning beats */
    if (i === 5) {
      remainGroup.visible = t >= 0.12;
      potsGroup.visible = t >= 0.03;
      safiyyaGroup.visible = t >= 0.40;
      mealGroup.visible = t >= 0.26;
      memorialGroup.visible = true;
      ret.visible = t >= 0.52;
      var ru = clamp01((t - 0.52) / 0.34);
      var rpnt = pathAt(RET_PATH, easeIO(ru));
      ret.position.set(rpnt[0], heightAt(rpnt[0], rpnt[1]), rpnt[1]);
      ret.rotation.y = 0;
    }

    /* the dust at the Qamūṣ gate */
    var qk = 0;
    if (i === 4) {
      qk = clamp01((t - 0.74) / 0.05) * (1 - clamp01((t - 0.86) / 0.12));
    }
    qamusDust.visible = qk > 0.02;
    qamusDust.material.opacity = 0.34 * qk;

    /* the light */
    applyNight(nightK(i, t));

    var dustK = i === 1 ? 0 : i === 2 ? 0.38 : i === 3 ? 0.16 : i === 4 ? 0.24 : 0.10;
    particles.dust.update(dustK);
    particles.angels.update(0);

    director.applyCamera(i, t);
  }

  function crowdEnv() {
    var ph = curPhaseIdx;
    var marching = ph === 1 || ph === 2 || ph === 5;
    return {
      ph: ph,
      frac: clock.frac,
      total: TOTAL,
      fight: ph === 2 ? 0.45 : ph === 3 ? 0.20 : ph === 4 ? 0.35 : 0.06,
      disp: ph === 0 ? 0.10 : ph === 1 ? 0.70 : ph === 2 ? 0.50 : ph === 3 ? 0.20 : ph === 4 ? 0.40 : 0.55,
      marching: marching,
      gaitHz: ph === 4 ? 0.7 : ph === 1 ? 0.9 : 1.0,
      gaitAmp: marching ? 0.45 : 0.05,
      leanRun: marching ? 0.04 : 0,
      lod: MOBILE
    };
  }
  function updateMass() { ENGINE.crowd.update(crowdEnv()); }

  /* ------------------------------ clothing, palms, smoke, the gate dust */
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
  function updateGateDust(dt) {
    if (!qamusDust.visible) return;
    var pa = qamusDust.geometry.attributes.position;
    for (var di = 0; di < pa.count; di++) {
      var dy = pa.getY(di) + dt * 1.4;
      if (dy > 4.4) dy = 0.4;
      pa.setY(di, dy);
      pa.setX(di, pa.getX(di) + Math.sin(dy * 2 + di) * dt * 0.5);
    }
    pa.needsUpdate = true;
  }

  updateMass();

  ENGINE.runner(ctx, {
    phases: PHASES, shots: SHOTS, impacts: IMPACTS, presets: PRESETS,
    director: director,
    portrait: { cap: 1.5 },
    labels: { units: ULABS, landmarks: LANDL },
    applyFrac: applyFrac,
    updateMass: updateMass,
    crowdEnv: crowdEnv,
    setLang: setLang,
    frame: function (f) {
      var now = f.now;
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
      updateGateDust(f.dt);
    },
    api: {
      forts: function () {
        return compoundList.map(function (c) {
          return {
            id: c.def.id, captured: c.captured,
            pos: [c.def.x, +c.def.padY.toFixed(1), c.def.z]
          };
        });
      },
      army: function () {
        return { muslims: 1400, confederates: 0, horse: 200, divisions: mBands.length };
      },
      duel: function () {
        return {
          amir: { pos: amir.group.position.toArray().map(function (v) { return +v.toFixed(1); }), fallen: amir.group.rotation.x < -0.3 },
          marhab: { pos: marhab.group.position.toArray().map(function (v) { return +v.toFixed(1); }), fallen: marhab.group.rotation.x < -0.3 },
          ali: { pos: ali.group.position.toArray().map(function (v) { return +v.toFixed(1); }) },
          standards: { ali: aliStd.group.visible, marhab: marhabStd.group.visible }
        };
      },
      qamus: function () {
        var rec = compoundList.filter(function (c) { return c.def.id === 'qamus'; })[0];
        return { captured: !!(rec && rec.captured), gateOpen: !!(rec && rec.gateL.rotation.y < -0.2) };
      },
      siege: function () {
        return { tents: 6, mantlets: 4, ram: 'an-Nizār', ramAtQamus: false };
      }
    }
  });
})();
