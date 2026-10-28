/* Muʿtah · the expedition in 3D — the Muʿtah scene module.
   The stony Balqāʾ upland, the village on its low tell, the dry wādī between
   the two hosts, the olive groves and the road north. Seven phases: the
   ground, the march, the field, the three standards, the nine swords, the
   withdrawal, the reckoning. Built on the shared ENGINE; this file carries
   only Muʿtah's ground, layout, plans, standards, shots and copy.
   The Prophet ﷺ is never depicted; no figure shows a face; the three named
   commanders are carried by their standards, never by persons.
   Claims: data/ledger/mutah.json (MUT-001 … MUT-024). */
(function () {
  'use strict';
  var U = ENGINE.util;
  var easeIO = U.easeIO, clamp01 = U.clamp01, smoothN = U.smoothN, fbm = ENGINE.fbm;
  var ctx = ENGINE.boot({
    failText: 'The 3D expedition needs WebGL. The graded ledger in data/ledger/mutah.json carries every fact.',
    grade: false, linearFog: true, fogColor: 0xbca487, fogNear: 165, fogFar: 560
  });
  if (!ctx) return;
  var canvas = ctx.canvas, labelBox = ctx.labelBox, reduce = ctx.reduce, MOBILE = ctx.MOBILE;
  var renderer = ctx.renderer, scene = ctx.scene, camera = ctx.camera;

  /* ------------------------------ a hard, pale Balqāʾ morning.
     The sun is high and south-east: the limestone takes a bleached light, the
     wādī keeps its shadow, and the enemy host to the north stands in its own
     dust. The withdrawal phase takes the key down for the night ruse. */
  var sky = ENGINE.sky(ctx, {
    zenith: 0x31587b, horizon: 0xbb9d78, skyCurve: 0.50,
    stars: 200, starOpacity: 0.0,
    moon: false,
    hemiSky: 0xa9bccb, hemiGround: 0x554a38, hemi: 0.49,
    sunColor: 0xffe0b4, sun: 1.16, sunPos: [130, 82, -50], shadowBounds: 210, shadowFar: 520,
    fillColor: 0x8fa4b8, fill: 0.24, fillPos: [-70, 38, 40],
    rimColor: 0xffe6c6, rim: 0.22, rimPos: [20, 18, 80]
  });

  /* ------------------------------ the ground of Muʿtah.
     Axes: +x east, +z north. The Muslims come up from the south (-z) and form
     south of the dry wādī; the enemy host faces them from the north. The
     village sits on its low tell in the east; the olive groves close the west
     and the south-east. The road north runs to Buṣrā and Maʿān, the road south
     to Madinah (MUT-001, MUT-010). */

  function wadiZ(x) {
    return Math.sin(x * 0.017 + 0.6) * 7 + Math.sin(x * 0.041 + 2.2) * 2.5;
  }

  var TELL = { x: 112, z: 18 };
  function heightAt(x, z) {
    /* The two armies stand on one level shelf: the shared crowd mesh has no
       per-man ground sample, so the whole camp-and-corridor reads at y ~ 0.
       Every rise is pushed outside the shelf, and the wādī alone cuts inside. */
    var inner = (1 - smoothN(Math.abs(x), 118, 190)) * (1 - smoothN(Math.abs(z - 10), 168, 268));
    var h = (fbm(x * 0.013 + 4.1, z * 0.013 + 2.7, 3) - 0.5) * 2.8 * (1 - 0.92 * inner);
    /* the bowl beyond the shelf, north and south */
    h += 8.0 * smoothN(Math.abs(z - 10), 168, 288);
    /* the long limestone rise behind the enemy host; its foot holds the camp */
    h += 11.0 * smoothN(z, 108, 224) * (0.68 + 0.42 * fbm(x * 0.014 + 3.1, z * 0.014 + 0.7, 3));
    /* the outer ridges close the plain */
    h += Math.max(smoothN(-x, 156, 244), smoothN(x, 164, 252)) *
      (10 + 18 * fbm(x * 0.02 + 1.7, z * 0.02 + 5.3, 3));
    h += Math.max(0, Math.hypot(x, z - 30) - 292) * 0.05;
    /* the village tell, east of the battle line */
    var td = Math.hypot(x - TELL.x, z - TELL.z);
    h += 6.4 * (1 - smoothN(td, 7, 40));
    /* the dry wādī: a cut with stone banks, between the two fronts */
    var wd = Math.abs(z - wadiZ(x));
    h -= 3.0 * (1 - smoothN(wd, 3.0, 17));
    /* fine grit, never enough to float a prop */
    h += (fbm(x * 0.055, z * 0.055, 2) - 0.5) * 0.30 * (1 - 0.86 * inner);
    return h;
  }

  var ROCK_LO = new THREE.Color(0x7a756a);
  var ROCK_HI = new THREE.Color(0xb9b2a1);
  var WADI_COL = new THREE.Color(0x847f73);
  var TELL_COL = new THREE.Color(0xc9bb9b);
  var PAVE_COL = new THREE.Color(0xaaa392);
  var GRASS_COL = new THREE.Color(0xa89c76);
  var ROCK = new THREE.Color();
  function colorAt(x, z, y, base) {
    var c = base.clone();
    /* limestone pavement breaks through the dry grass */
    var pave = fbm(x * 0.032 + 7.2, z * 0.032 + 1.4, 3);
    if (pave > 0.56) c.lerp(PAVE_COL, (pave - 0.56) * 1.6);
    var grass = fbm(x * 0.021 + 2.6, z * 0.021 + 8.1, 2);
    if (grass > 0.56) c.lerp(GRASS_COL, (grass - 0.56) * 0.9);
    /* the wādī floor is grey gravel, its banks pale */
    var wd = Math.abs(z - wadiZ(x));
    if (wd < 19) c.lerp(WADI_COL, (1 - smoothN(wd, 3, 19)) * 0.62);
    /* the village tell reads as swept dust */
    if (Math.hypot(x - TELL.x, z - TELL.z) < 32) c.lerp(TELL_COL, 0.26);
    /* the ridges show limestone strata above the shelf */
    var t = smoothN(y, 1.4, 6.5);
    if (t > 0.02) {
      var strata = 0.5 + 0.5 * Math.sin(y * 1.15 + fbm(x * 0.05, z * 0.05, 2) * 4.0);
      ROCK.copy(ROCK_LO).lerp(ROCK_HI, 0.24 + 0.48 * strata);
      c.lerp(ROCK, t * 0.85);
    }
    return c;
  }

  ENGINE.ground(ctx, heightAt, {
    base: '#c9bda2', repeat: 36, bumpScale: 0.11,
    sand: 0xc2b499, crest: 0xd2c6a9, trough: 0x8d8370, grit: 0xa89b83,
    size: 620, seg: 260, colorAt: colorAt,
    light: '#f4efe2', dark: '#6f695c', scoreAlpha: 0.06
  });

  var props = ENGINE.props(ctx, heightAt);
  var cast = ENGINE.cast(ctx);
  var merge = ENGINE.merge;
  var WAVERS = cast.wavers;

  props.scrubField(MOBILE ? 70 : 110, 23);
  props.pebbleField(MOBILE ? 170 : 300, -120, -24, 240, 64);
  props.rock(-140, 22, 2.6); props.rock(-128, 30, 1.8); props.rock(142, -42, 2.2);
  props.rock(134, 52, 1.7); props.rock(-118, -64, 2.0); props.rock(152, 22, 2.4);
  /* limestone shelves that frame the field without standing in the ranks */
  props.rock(-94, -8, 1.5); props.rock(-86, 6, 0.9); props.rock(96, -18, 1.3);
  props.rock(88, 58, 1.1); props.rock(-82, 62, 1.0); props.rock(72, -74, 1.4);
  props.rock(-66, -40, 0.8); props.rock(40, 64, 0.7);
  /* the limestone rise behind the enemy host */
  props.rock(-96, 118, 2.6); props.rock(18, 128, 3.0); props.rock(104, 120, 2.2);

  /* ------------------------------ the olive groves.
     Two instanced batches: pale trunks and three silver-green canopy blobs a
     tree. Olive country is the quiet signature of the Balqāʾ; no palms here. */
  function oliveGrove(x0, z0, w, d, n, seed) {
    var trunks = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.13, 0.21, 2.0, 6),
      new THREE.MeshLambertMaterial({ color: 0x5b4d3a }), n
    );
    var canopies = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1.02, 0),
      new THREE.MeshLambertMaterial({ color: 0x6d7c55, flatShading: true }), n * 3
    );
    var td = new THREE.Object3D(), cd = new THREE.Object3D();
    for (var i = 0; i < n; i++) {
      var hx = Math.abs(Math.sin((i + seed) * 12.9898) * 43758.5453) % 1;
      var hz = Math.abs(Math.sin((i + seed) * 78.233) * 19341.17) % 1;
      var hs = Math.abs(Math.sin((i + seed) * 3.7) * 811) % 1;
      var px = x0 + hx * w, pz = z0 + hz * d;
      var gy = heightAt(px, pz);
      var sc = 0.9 + hs * 0.6;
      td.position.set(px, gy + 1.0 * sc, pz);
      td.rotation.set(0, hs * 6.28, (hx - 0.5) * 0.1);
      td.scale.setScalar(sc);
      td.updateMatrix();
      trunks.setMatrixAt(i, td.matrix);
      for (var b = 0; b < 3; b++) {
        var a = (b / 3) * Math.PI * 2 + hs * 4;
        cd.position.set(px + Math.cos(a) * 0.72 * sc, gy + (2.35 + (b === 1 ? 0.5 : 0)) * sc, pz + Math.sin(a) * 0.72 * sc);
        cd.rotation.set(hs * 3 + b, hx * 4, hs * 2);
        cd.scale.set(sc * (1.2 - b * 0.12), sc * (0.82 + b * 0.06), sc * (1.15 - b * 0.10));
        cd.updateMatrix();
        canopies.setMatrixAt(i * 3 + b, cd.matrix);
      }
    }
    trunks.castShadow = true; trunks.receiveShadow = true;
    canopies.castShadow = true; canopies.receiveShadow = true;
    scene.add(trunks); scene.add(canopies);
  }
  oliveGrove(-150, -34, 44, 58, 34, 3);
  oliveGrove(-118, 42, 32, 38, 21, 7);
  oliveGrove(64, -70, 42, 32, 24, 11);
  oliveGrove(128, 44, 30, 34, 18, 17);
  oliveGrove(-98, -16, 24, 28, 12, 19);
  oliveGrove(88, -22, 18, 18, 8, 23);

  /* dry-stone field walls edge two of the groves */
  function groveWall(x0, z0, w, d) {
    var m = new THREE.MeshLambertMaterial({ color: 0x9c9583 });
    [[x0 + w / 2, z0, w, 0.45], [x0 + w / 2, z0 + d, w, 0.45], [x0, z0 + d / 2, d, Math.PI / 2], [x0 + w, z0 + d / 2, d, Math.PI / 2]
    ].forEach(function (e) {
      var seg = new THREE.Mesh(new THREE.BoxGeometry(e[2], 0.62, 0.42), m);
      seg.position.set(e[0], heightAt(e[0], e[1]) + 0.31, e[1]);
      seg.rotation.y = e[3];
      seg.castShadow = true; seg.receiveShadow = true;
      scene.add(seg);
    });
  }
  /* ------------------------------ roads, fields, the village */
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

  roadRibbon([[12, -206], [8, -170], [2, -140], [0, -112], [0, -74]], 5.0);
  roadRibbon([[30, 64], [48, 96], [78, 128], [120, 166], [162, 206]], 4.2, 0xae9e7c);
  roadRibbon([[6, -12], [38, -4], [72, 6], [100, 12]], 2.8, 0xb2a17f);

  function fieldPlot(x, z, w, d) {
    var g = new THREE.Group();
    g.position.set(x, heightAt(x, z), z);
    var soil = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), new THREE.MeshLambertMaterial({ color: 0x8a774f }));
    soil.position.y = 0.04; soil.receiveShadow = true; g.add(soil);
    var rowM = new THREE.MeshLambertMaterial({ color: 0xa89562 });
    for (var r = 0; r < Math.floor(d / 0.9); r++) {
      var ridge = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.09, 0.24), rowM);
      ridge.position.set(0, 0.1, -d / 2 + 0.6 + r * 0.9);
      ridge.receiveShadow = true;
      g.add(ridge);
    }
    scene.add(g);
    return g;
  }
  fieldPlot(-72, -48, 18, 9);
  fieldPlot(-54, -52, 14, 7);
  fieldPlot(60, -50, 16, 8);
  fieldPlot(94, 38, 14, 8);
  fieldPlot(-122, 24, 12, 7);

  /* dry grass tufts: the field reads as stubble, not bare sand */
  (function dryTufts() {
    var n = MOBILE ? 180 : 380;
    var geo = new THREE.ConeGeometry(0.085, 0.34, 4, 1);
    var mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0x9d9069 }), n);
    var d = new THREE.Object3D();
    for (var i = 0; i < n; i++) {
      var hx = Math.abs(Math.sin((i + 31) * 12.9898) * 43758.5453) % 1;
      var hz = Math.abs(Math.sin((i + 31) * 78.233) * 19341.17) % 1;
      var px = -170 + hx * 340, pz = -190 + hz * 340;
      var sc = 0.6 + (Math.abs(Math.sin((i + 7) * 3.7) * 811) % 1) * 1.1;
      d.position.set(px, heightAt(px, pz) + 0.09 * sc, pz);
      d.rotation.set((hz - 0.5) * 0.4, hx * 6.28, (hx - 0.5) * 0.4);
      d.scale.set(sc, sc, sc);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    }
    mesh.receiveShadow = true;
    scene.add(mesh);
  })();

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
  house(106, 8, 8.2, 6.4, 3.6, 1);
  house(116, 15, 7.0, 5.8, 3.2, 2);
  house(105, 22, 7.6, 6.0, 3.4, 3);
  house(121, 6, 6.6, 5.2, 3.0, 4);
  house(113, 30, 7.8, 6.2, 3.5, 5);
  house(98, 16, 6.2, 5.0, 2.9, 6);
  house(125, 22, 6.8, 5.6, 3.1, 7);
  house(100, 1, 6.4, 5.2, 3.0, 8);
  house(129, 29, 7.0, 5.6, 3.2, 9);
  house(108, 36, 6.4, 5.0, 2.8, 10);
  house(94, 28, 5.8, 4.8, 2.7, 11);
  house(122, 12, 5.8, 4.6, 2.7, 12);

  props.well(100, 13, true);

  /* the village terrace walls hold the tell */
  [[100, 4.5, 22, 0], [118, 4.5, 16, 0], [100, 34, 30, 0], [94, 20, 22, Math.PI / 2], [130, 20, 22, Math.PI / 2]
  ].forEach(function (e) {
    var seg = new THREE.Mesh(new THREE.BoxGeometry(e[2], 1.0, 0.55), new THREE.MeshLambertMaterial({ color: 0xa89a7e }));
    seg.position.set(e[0], heightAt(e[0], e[1]) + 0.5, e[1]);
    seg.rotation.y = e[3];
    seg.castShadow = true; seg.receiveShadow = true;
    scene.add(seg);
  });

  function villageWall(x, z, w, d, ry) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.7, 0.5), new THREE.MeshLambertMaterial({ color: 0xa2947a }));
    m.position.set(x, heightAt(x, z) + 0.34, z);
    m.rotation.y = ry || 0;
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    return m;
  }
  villageWall(100, -2, 22, 0.5, 0);
  villageWall(92, 12, 14, 0.5, Math.PI / 2);
  villageWall(128, 12, 18, 0.5, Math.PI / 2);
  villageWall(112, 36, 20, 0.5, 0);

  /* the threshing floor: a swept circle, a post, two sacks */
  (function threshingFloor() {
    var g = new THREE.Group();
    var px = 122, pz = 34;
    g.position.set(px, heightAt(px, pz), pz);
    var floor = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.5, 0.08, 20), new THREE.MeshLambertMaterial({ color: 0xc0ae87 }));
    floor.position.y = 0.04; floor.receiveShadow = true; g.add(floor);
    var post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.8, 6), cast.mats.poleM);
    post.position.y = 0.9; post.castShadow = true; g.add(post);
    [[1.2, 0.4], [-0.9, 1.1]].forEach(function (p, i) {
      var sack = new THREE.Mesh(new THREE.SphereGeometry(0.34, 7, 5), new THREE.MeshLambertMaterial({ color: i ? 0x9a8462 : 0x877452 }));
      sack.scale.set(1, 0.72, 1);
      sack.position.set(p[0], 0.24, p[1]);
      sack.castShadow = true; g.add(sack);
    });
    scene.add(g);
  })();

  /* a cairn where the road north leaves the plain: the envoy's road (MUT-002) */
  [[118, 140], [120, 142], [117, 143]].forEach(function (p, i) {
    var s = 0.8 + i * 0.25;
    var r = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), new THREE.MeshLambertMaterial({ color: 0x8f8574, flatShading: true }));
    r.position.set(p[0], heightAt(p[0], p[1]) + s * 0.4, p[1]);
    r.rotation.set(i * 1.2, i * 2.1, i * 0.7);
    r.castShadow = true; r.receiveShadow = true;
    scene.add(r);
  });

  /* ------------------------------ the camps and the dust */
  var particles = ENGINE.particles(ctx, heightAt, {
    dustBounds: { x0: -130, xs: 260, z0: -90, zs: 150 },
    dustColor: 0xd3c1a0, dustSize: 2.4, dustGain: 0.20
  });

  /* the Muslim camp behind the army (MUT-003) */
  [[-84, -136], [-68, -144], [-52, -138], [-36, -146], [36, -146], [52, -138], [68, -144], [84, -136], [-24, -156], [0, -158], [24, -156], [96, -150]
  ].forEach(function (p, i) {
    props.ridgeTent(p[0], p[1], false, 3.8 + (i % 3) * 0.4, 4.8 + (i % 2) * 0.6, 1.45);
  });
  var mcl1 = props.campClutter(-70, -152); mcl1.position.y = heightAt(-70, -152);
  var mcl2 = props.campClutter(70, -152); mcl2.position.y = heightAt(70, -152);
  var mc1 = props.camel(-94, -142, 0.6); mc1.position.y = heightAt(-94, -142);
  var mc2 = props.camel(94, -144, -2.2); mc2.position.y = heightAt(94, -144);
  var mh1 = props.horse(36, -148, 2.4, false); mh1.position.y = heightAt(36, -148);
  particles.smoke.add(-70, -148); particles.smoke.add(70, -148); particles.smoke.add(0, -150);

  /* the Byzantine and allied camp on the flanks (MUT-007) */
  [[-116, 62], [-104, 74], [-120, 88], [-108, 100], [-126, 76], [-94, 92], [94, 92], [108, 74], [120, 88], [104, 100], [116, 62], [126, 76]
  ].forEach(function (p, i) {
    props.ridgeTent(p[0], p[1], true, 4.0 + (i % 2) * 0.5, 5.0 + (i % 3) * 0.4, 1.5);
  });
  var ecl1 = props.campClutter(-104, 86); ecl1.position.y = heightAt(-104, 86);
  var ecl2 = props.campClutter(104, 86); ecl2.position.y = heightAt(104, 86);
  var ec1 = props.camel(-120, 78, 0.4); ec1.position.y = heightAt(-120, 78);
  var ec2 = props.camel(120, 78, -2.0); ec2.position.y = heightAt(120, 78);
  particles.smoke.add(-104, 90); particles.smoke.add(104, 90);
  particles.dust.material.color.setHex(0xd2bf9d);

  /* ------------------------------ the two hosts.
     About 3,000 Muslims on the south side of the wādī; the enemy host staged
     as a deep mass, labelled with the reported range, never with a count we
     do not have (MUT-003, MUT-007). */
  var mLeft = cast.band(0, -30, -112, null, null);
  var mCentre = cast.band(0, 0, -112, 'the Muslims · about 3,000', 'MUT-003');
  var mRight = cast.band(0, 30, -112, null, null);
  var mBands = [mLeft, mCentre, mRight];
  mCentre.k = 'army'; mCentre.labelY = 5.6;
  ENGINE.crowd.build({
    side: 0, count: 3000, cols: 24, dxS: 1.7, dzS: 1.65, z0: -112, h: 1.9,
    blocks: mBands, scene: scene
  });

  var eLeft = cast.band(1, -40, 36, null, null);
  var eCentre = cast.band(1, 0, 36, 'the enemy host · reports say 100,000–200,000', 'MUT-007');
  var eRight = cast.band(1, 40, 36, null, null);
  var eBands = [eLeft, eCentre, eRight];
  eCentre.k = 'enemy'; eCentre.labelY = 5.9;
  ENGINE.crowd.build({
    side: 1, count: 6000, cols: 30, dxS: 1.8, dzS: 1.65, z0: 36, h: 2.15,
    blocks: eBands, scene: scene
  });

  var PLAN_M = {
    left: [[-30, -112], [-30, -100], [-30, -76], [-30, -48], [-30, -48], [-30, -86], [-30, -106]],
    centre: [[0, -112], [0, -100], [0, -76], [0, -48], [0, -48], [0, -86], [0, -106]],
    right: [[30, -112], [30, -100], [30, -76], [30, -48], [30, -48], [30, -86], [30, -106]]
  };
  var PLAN_E = {
    left: [[-40, 36], [-40, 34], [-40, 28], [-40, 20], [-40, 18], [-40, 24], [-40, 52]],
    centre: [[0, 36], [0, 34], [0, 28], [0, 20], [0, 18], [0, 24], [0, 52]],
    right: [[40, 36], [40, 34], [40, 28], [40, 20], [40, 18], [40, 24], [40, 52]]
  };
  mLeft.plan = PLAN_M.left; mCentre.plan = PLAN_M.centre; mRight.plan = PLAN_M.right;
  eLeft.plan = PLAN_E.left; eCentre.plan = PLAN_E.centre; eRight.plan = PLAN_E.right;

  /* ------------------------------ the horse, unnumbered in the sources */
  function cavalrySquadron(n, cols, dx, dz, side) {
    var g = new THREE.Group();
    var k = 0;
    for (var r = 0; r < Math.ceil(n / cols); r++) {
      for (var c = 0; c < cols && k < n; c++, k++) {
        var hs = 0.9 + (Math.abs(Math.sin(k * 5.3) * 911) % 1) * 0.2;
        var hx = (c - (cols - 1) / 2) * dx + (Math.abs(Math.sin(k * 5.7)) % 1 - 0.5) * 0.5;
        var hz = r * dz + (c % 2) * 0.55 + (Math.abs(Math.sin(k * 3.1)) % 1 - 0.5) * 0.5;
        var horse = props.horse(0, 0, 0, side === 1);
        scene.remove(horse);
        horse.position.set(hx, 0, hz);
        horse.rotation.y = (Math.abs(Math.sin(k * 2.1)) % 1 - 0.5) * 0.2;
        horse.scale.setScalar(hs);
        g.add(horse);
        var rider = cast.makeFighter({
          x: 0, y: 0, z: 0, ry: 0,
          robe: side ? 0x655a48 : 0xd2c9b4, robeDark: side ? 0x443c30 : 0x8f8168,
          weapon: 'spear', shield: true, helmet: side === 1, scale: 0.9 * hs
        });
        scene.remove(rider.group);
        rider.group.remove(rider.stump); rider.group.remove(rider.stepLeg);
        rider.group.position.set(hx - 0.1, 1.5 * hs, hz);
        rider.group.rotation.y = horse.rotation.y;
        g.add(rider.group);
      }
    }
    merge.mergeMeshList(merge.collectMergeable(g), g, true);
    g.userData.dynamicRoot = true;
    scene.add(g);
    return g;
  }
  var eCavL = cavalrySquadron(8, 4, 2.0, 2.8, 1);
  var eCavR = cavalrySquadron(8, 4, 2.0, 2.8, 1);
  var mCav = cavalrySquadron(6, 3, 2.0, 2.8, 0);
  eCavL.position.set(-78, heightAt(-78, 34), 34);
  eCavR.position.set(78, heightAt(78, 34), 34);
  mCav.position.set(62, heightAt(62, -46), -46);

  /* ------------------------------ the three command standards (MUT-004).
     Named acts ride on standards: Zayd, then Jaʿfar, then ʿAbdullāh ibn
     Rawāḥah. Each falls where it stands; nobody is depicted. */
  function commandStandard(x, z, tint, emissive, scale) {
    var g = new THREE.Group();
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.35, 6), cast.mats.poleM);
    pole.position.y = 2.175; pole.castShadow = true; g.add(pole);
    var shoe = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.13, 8), cast.mats.brassM);
    shoe.position.y = 0.065; shoe.castShadow = true; g.add(shoe);
    var fin = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 6), cast.mats.brassM);
    fin.position.y = 4.40; g.add(fin);
    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.24, 5), cast.mats.brassM);
    tip.position.y = 4.60; g.add(tip);
    var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.5, 5), cast.mats.poleM);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0.72, 4.22, 0); g.add(bar);
    var geo = new THREE.PlaneGeometry(1.62, 1.06, 10, 6);
    var cloth = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
      color: tint, emissive: emissive === undefined ? 0x2c261e : emissive, side: THREE.DoubleSide
    }));
    cloth.position.set(0.84, 3.65, 0);
    cloth.castShadow = true;
    cloth.userData.keep = true;
    g.add(cloth);
    cast.wavers.push({ mesh: cloth, base: geo.attributes.position.array.slice(0), w: 1.62, phase: Math.random() * 6.28 });
    /* a standard's base is a weapon mass, never a body */
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
    g.position.set(x, heightAt(x, z), z);
    if (scale) g.scale.setScalar(scale);
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    merge.mergeMeshList(merge.collectMergeable(g), g, true);
    g.userData.dynamicRoot = true;
    scene.add(g);
    return { group: g, baseY: heightAt(x, z), x: x, z: z, fallen: 0 };
  }

  var zaydStd = commandStandard(-9, -13, 0xf2ead8);
  var jafarStd = commandStandard(0, -13, 0xf2ead8);
  var rawahahStd = commandStandard(9, -13, 0xf2ead8);
  var khalidStd = commandStandard(18, -8, 0xece2cc, 0x3a3124);
  khalidStd.group.rotation.z = 1.34;
  khalidStd.group.visible = false;
  zaydStd.k = 'zaydStd'; zaydStd.label = 'Zayd (RA)';
  jafarStd.k = 'jafarStd'; jafarStd.label = 'Jaʿfar (RA)';
  rawahahStd.k = 'rawahahStd'; rawahahStd.label = 'ʿAbdullāh ibn Rawāḥah (RA)';
  khalidStd.k = 'khalidStd'; khalidStd.label = 'Khālid (RA) · the banner';

  /* ------------------------------ the nine swords (MUT-016).
     Nine broken blades in the ground around the rising banner; weapon-masses,
     never a figure. */
  var swordsGroup = new THREE.Group();
  swordsGroup.userData.dynamicRoot = true;
  swordsGroup.visible = false;
  (function nineSwords() {
    var steel = new THREE.MeshLambertMaterial({ color: 0xc9c4b6 });
    var guardM = new THREE.MeshLambertMaterial({ color: 0xc39a33 });
    var gripM = new THREE.MeshLambertMaterial({ color: 0x4a3a28 });
    for (var i = 0; i < 9; i++) {
      var g = new THREE.Group();
      var a = (i / 9) * Math.PI * 2 + 0.3;
      var r = 1.5 + (i % 3) * 1.1;
      var px = 18 + Math.cos(a) * r, pz = -8 + Math.sin(a) * r;
      var blade = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.78, 0.014), steel);
      blade.position.y = 0.42;
      if (i % 3 === 0) { blade.scale.y = 0.52; blade.position.y = 0.28; }
      blade.castShadow = true; g.add(blade);
      var guard = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.03, 0.05), guardM);
      guard.position.y = 0.04; g.add(guard);
      var grip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.03, 0.16, 5), gripM);
      grip.position.y = -0.05; g.add(grip);
      if (i % 3 === 0) {
        var shard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.013), steel);
        shard.position.set(0.16, 0.08, 0.18);
        shard.rotation.z = 1.1;
        shard.castShadow = true; g.add(shard);
      }
      g.position.set(px, heightAt(px, pz) + 0.02, pz);
      g.rotation.set(0.22 + (i % 2) * 0.1, a, 0.18 + (i % 3) * 0.08);
      g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
      swordsGroup.add(g);
    }
    merge.mergeMeshList(merge.collectMergeable(swordsGroup), swordsGroup, true);
    scene.add(swordsGroup);
  })();

  /* ------------------------------ the memorial (MUT-019, MUT-020).
     Twelve low stones for the fallen and two white pennants for the two
     wings — a title, not a depiction. */
  var memorialGroup = new THREE.Group();
  memorialGroup.userData.dynamicRoot = true;
  memorialGroup.visible = false;
  (function memorial() {
    var stoneM = new THREE.MeshLambertMaterial({ color: 0x8c8371 });
    for (var i = 0; i < 12; i++) {
      var mx = -5.5 + (i % 6) * 2.2;
      var mz = -18.4 - Math.floor(i / 6) * 1.7;
      var st = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.26), stoneM);
      st.position.set(mx, heightAt(mx, mz) + 0.31, mz);
      st.rotation.y = (i % 2 ? 1 : -1) * 0.08;
      st.castShadow = true; st.receiveShadow = true;
      memorialGroup.add(st);
    }
    var base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.7, 0.2, 16), new THREE.MeshLambertMaterial({ color: 0x77705f }));
    base.position.set(9.5, heightAt(9.5, -15) + 0.1, -15);
    base.receiveShadow = true; memorialGroup.add(base);
    [-0.55, 0.55].forEach(function (dx) {
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 3.4, 5), cast.mats.poleM);
      pole.position.set(9.5 + dx, heightAt(9.5, -15) + 1.8, -15);
      pole.castShadow = true; memorialGroup.add(pole);
      var flag = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.5), new THREE.MeshLambertMaterial({ color: 0xefe8d8, side: THREE.DoubleSide }));
      flag.position.set(9.5 + dx + 0.4, heightAt(9.5, -15) + 2.55, -15);
      memorialGroup.add(flag);
    });
    merge.mergeMeshList(merge.collectMergeable(memorialGroup), memorialGroup, true);
    scene.add(memorialGroup);
  })();

  /* ------------------------------ labels */
  function mkLabel(txt, cls) { return ENGINE.labels.mkLabel(labelBox, txt, cls); }
  var LAND = [
    { w: [0, 6.0, -16], t: 'the Muslims · about 3,000', e: 'MUT-003', k: 'army', cls: 'is-side', ph: [] },
    { w: [0, 9.2, 26], t: 'the enemy host · reports say 100,000–200,000', e: 'MUT-007', k: 'enemy', cls: '', ph: [] },
    { w: [TELL.x, heightAt(TELL.x, TELL.z) + 8.0, TELL.z], t: 'Muʿtah · the village', e: 'MUT-001', k: 'village', cls: 'is-land-name', ph: [0, 2, 3, 6] },
    { w: [0, 4.2, 4], t: 'the dry wādī', e: 'MUT-010', k: 'wadi', cls: 'is-land', ph: [0, 2, 3, 4, 5] },
    { w: [138, 12, 158], t: 'the road north · to Buṣrā and Maʿān', e: 'MUT-002', k: 'roadn', cls: 'is-land-name is-far', ph: [0, 1] },
    { w: [2, 7, -182], t: 'the road south · to Madinah', e: 'MUT-023', k: 'roads', cls: 'is-land-name is-far', ph: [0, 1, 6] },
    { w: [0, 2.6, -142], t: 'the Muslim camp', e: 'MUT-003', k: 'mcamp', cls: 'is-land-name', ph: [0, 1, 6] },
    { w: [-110, 6.0, 82], t: 'the enemy camp', e: 'MUT-007', k: 'ecamp', cls: 'is-land-name is-far', ph: [0, 1, 2] },
    { w: [-126, 7.0, -6], t: 'the olive groves', e: 'MUT-010', k: 'olives', cls: 'is-land', ph: [0, 1, 6] },
    { w: [0, 9.0, 58], t: 'the plain of Muʿtah', e: 'MUT-010', k: 'plain', cls: 'is-land-name is-far', ph: [0, 2] }
  ];
  var LANDL = LAND.map(function (l) {
    var node = mkLabel(l.t, l.cls);
    return { el: node, v: new THREE.Vector3(l.w[0], l.w[1], l.w[2]), k: l.k, ph: l.ph, tRange: l.tRange };
  });
  var UNIT_DEFS = [
    { u: mCentre, side: 0, labelY: 6.4, priority: 6, ph: [0, 1, 2, 3, 4, 5], labelAlways: true },
    { u: eCentre, side: 1, labelY: 7.4, priority: 6, ph: [0, 1, 2, 3, 4, 5], labelAlways: true },
    { u: zaydStd, side: 0, labelY: 6.4, priority: 4, event: true, ph: [3], labelAlways: true },
    { u: jafarStd, side: 0, labelY: 6.4, priority: 4, event: true, ph: [3], labelAlways: true },
    { u: rawahahStd, side: 0, labelY: 6.4, priority: 4, event: true, ph: [3], labelAlways: true },
    { u: khalidStd, side: 0, labelY: 5.4, priority: 4, event: true, ph: [4, 5, 6], labelAlways: true }
  ];
  var ULABS = UNIT_DEFS.map(function (d) {
    d.u.k = d.u.k || ('std' + Math.round((d.u.x || 0) * 10) + Math.round((d.u.z || 0) * 10));
    d.u.labelY = d.labelY;
    d.u.priority = d.priority;
    d.u.event = !!d.event;
    if (d.ph) d.u.ph = d.ph;
    if (d.labelAlways) d.u.labelAlways = true;
    var node = mkLabel(d.u.label || '', (d.side ? '' : 'is-side') + (d.event ? ' is-event' : ''));
    return { el: node, u: d.u, k: d.u.k };
  });

  var EVENT_MARKS = [
    { key: 'title', label: 'Jumādā al-Ūlā, 8 AH · the expedition north', e: 'MUT-001', x: 0, y: 11.5, z: 16, ph: [0], tRange: [0.02, 0.40], priority: 4 },
    { key: 'envoy', label: 'the envoy al-Ḥārith (RA) is killed on this road · reported', e: 'MUT-002', x: 64, y: 5.0, z: 126, ph: [0], tRange: [0.42, 0.82], priority: 4 },
    { key: 'march1', label: 'the army of about 3,000 sets out · reported', e: 'MUT-003', x: 0, y: 8.0, z: -104, ph: [1], tRange: [0.02, 0.26], priority: 4 },
    { key: 'commanders', label: 'the three commanders are named in advance', e: 'MUT-004', x: -6, y: 6.4, z: -14, ph: [1], tRange: [0.24, 0.50], priority: 4 },
    { key: 'names', label: 'Zayd (RA) · Jaʿfar (RA) · ʿAbdullāh ibn Rawāḥah (RA)', e: 'MUT-004', x: 0, y: 8.2, z: -20, ph: [1], tRange: [0.30, 0.52], priority: 4 },
    { key: 'maan', label: 'at Maʿān the enemy host is reported as 100,000 and 100,000 allies', e: 'MUT-007', x: 24, y: 8.4, z: -72, ph: [1], tRange: [0.52, 0.76], priority: 4 },
    { key: 'rules', label: 'no treachery · no women, children or aged', e: 'MUT-006', x: 0, y: 10.5, z: -88, ph: [1], tRange: [0.74, 0.96], priority: 4 },
    { key: 'form', label: 'the two hosts form at Muʿtah', e: 'MUT-009', x: 0, y: 10.0, z: 0, ph: [2], tRange: [0.02, 0.24], priority: 4 },
    { key: 'counsel', label: 'ʿAbdullāh ibn Rawāḥah (RA) · “victory or martyrdom”', e: 'MUT-008', x: 0, y: 7.4, z: -44, ph: [2], tRange: [0.24, 0.48], priority: 4 },
    { key: 'numbers', label: 'the enemy numbers are reports, not a count', e: 'MUT-007', x: 0, y: 11.0, z: 30, ph: [2], tRange: [0.50, 0.82], priority: 4 },
    { key: 'zaydTakes', label: 'Zayd (RA) carries the standard', e: 'MUT-011', x: -9, y: 5.0, z: -10, ph: [3], tRange: [0.02, 0.20], priority: 5 },
    { key: 'zaydFalls', label: 'Zayd (RA) falls', e: 'MUT-011', x: -9, y: 4.4, z: -10, ph: [3], tRange: [0.22, 0.38], priority: 5 },
    { key: 'jafarTakes', label: 'Jaʿfar (RA) takes the standard', e: 'MUT-012', x: 0, y: 5.0, z: -10, ph: [3], tRange: [0.34, 0.48], priority: 5 },
    { key: 'hands', label: 'the standard is cut from his hands · reported', e: 'MUT-013', x: 0, y: 4.2, z: -8, ph: [3], tRange: [0.48, 0.60], priority: 5 },
    { key: 'jafarFalls', label: 'Jaʿfar (RA) falls · fifty wounds, none in his back', e: 'MUT-012', x: 0, y: 4.6, z: -10, ph: [3], tRange: [0.58, 0.72], priority: 5 },
    { key: 'rawahahTakes', label: 'ʿAbdullāh ibn Rawāḥah (RA) takes the standard', e: 'MUT-014', x: 9, y: 5.0, z: -10, ph: [3], tRange: [0.64, 0.74], priority: 5 },
    { key: 'rawahahFalls', label: 'ʿAbdullāh ibn Rawāḥah (RA) falls', e: 'MUT-014', x: 9, y: 4.4, z: -10, ph: [3], tRange: [0.74, 0.88], priority: 5 },
    { key: 'stdDown', label: 'the standard is down', e: 'MUT-014', x: 0, y: 5.2, z: -10, ph: [3], tRange: [0.86, 0.99], priority: 5 },
    { key: 'khalid', label: 'Khālid (RA) takes the banner', e: 'MUT-016', x: 18, y: 5.2, z: -6, ph: [4], tRange: [0.02, 0.20], priority: 5 },
    { key: 'nine', label: 'nine swords break in his hand', e: 'MUT-016', x: 18, y: 3.0, z: -5, ph: [4], tRange: [0.22, 0.44], priority: 5 },
    { key: 'yemeni', label: 'only a Yemeni sword remains', e: 'MUT-016', x: 18, y: 2.6, z: -4, ph: [4], tRange: [0.44, 0.64], priority: 5 },
    { key: 'holds', label: 'the line holds', e: 'MUT-016', x: 0, y: 6.0, z: -10, ph: [4], tRange: [0.64, 0.90], priority: 4 },
    { key: 'night', label: 'at night the flanks shift · reported', e: 'MUT-017', x: 0, y: 9.0, z: 4, ph: [5], tRange: [0.05, 0.28], priority: 4 },
    { key: 'hesitate', label: 'at dawn the enemy hesitates · reported', e: 'MUT-017', x: 0, y: 9.6, z: 22, ph: [5], tRange: [0.30, 0.48], priority: 4 },
    { key: 'withdraw', label: 'the army withdraws in order', e: 'MUT-017', x: -12, y: 6.8, z: -48, ph: [5], tRange: [0.42, 0.66], priority: 4 },
    { key: 'victory', label: 'the report calls it a victory', e: 'MUT-018', x: 0, y: 8.4, z: -18, ph: [5], tRange: [0.64, 0.84], priority: 4 },
    { key: 'noRout', label: 'the army was not routed', e: 'MUT-017', x: 0, y: 7.2, z: -52, ph: [5], tRange: [0.80, 0.97], priority: 4 },
    { key: 'after', label: 'the field after', e: 'MUT-019', x: 0, y: 8.0, z: -6, ph: [6], tRange: [0.02, 0.16], priority: 4 },
    { key: 'fallen', label: 'the fallen · twelve by the reports', e: 'MUT-019', x: -2, y: 3.8, z: -18, ph: [6], tRange: [0.10, 0.30], priority: 4 },
    { key: 'wings', label: 'Jaʿfar (RA) · the two wings', e: 'MUT-020', x: 9.5, y: 4.8, z: -14, ph: [6], tRange: [0.28, 0.48], priority: 4 },
    { key: 'names2', label: 'the Prophet (PBUH) names them before the news arrives', e: 'MUT-015', x: 0, y: 8.0, z: -30, ph: [6], tRange: [0.34, 0.56], priority: 4 },
    { key: 'weeps', label: 'the Prophet’s (PBUH) eyes shed tears', e: 'MUT-015', x: 0, y: 8.0, z: -34, ph: [6], tRange: [0.52, 0.68], priority: 4 },
    { key: 'return', label: 'the army returns to Madinah', e: 'MUT-023', x: 0, y: 7.4, z: -42, ph: [6], tRange: [0.62, 0.80], priority: 4 },
    { key: 'verse', label: '3:169 · “alive with their Lord”', e: 'MUT-018', x: -2, y: 5.6, z: -18, ph: [6], tRange: [0.76, 0.94], priority: 4 },
    { key: 'northRoad', label: 'the northern road stays open · reported', e: 'MUT-024', x: 24, y: 8.0, z: 66, ph: [6], tRange: [0.84, 0.99], priority: 4 }
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
      army: 'the Muslims · about 3,000',
      enemy: 'the enemy host · reports say 100,000–200,000',
      village: 'Muʿtah · the village', wadi: 'the dry wādī',
      roadn: 'the road north · to Buṣrā and Maʿān',
      roads: 'the road south · to Madinah',
      mcamp: 'the Muslim camp', ecamp: 'the enemy camp',
      olives: 'the olive groves', plain: 'the plain of Muʿtah',
      zaydStd: 'Zayd (RA)', jafarStd: 'Jaʿfar (RA)',
      rawahahStd: 'ʿAbdullāh ibn Rawāḥah (RA)', khalidStd: 'Khālid (RA) · the banner',
      title: 'Jumādā al-Ūlā, 8 AH · the expedition north',
      envoy: 'the envoy al-Ḥārith (RA) is killed on this road · reported',
      march1: 'the army of about 3,000 sets out · reported',
      commanders: 'the three commanders are named in advance',
      names: 'Zayd (RA) · Jaʿfar (RA) · ʿAbdullāh ibn Rawāḥah (RA)',
      maan: 'at Maʿān the enemy host is reported as 100,000 and 100,000 allies',
      rules: 'no treachery · no women, children or aged',
      form: 'the two hosts form at Muʿtah',
      counsel: 'ʿAbdullāh ibn Rawāḥah (RA) · “victory or martyrdom”',
      numbers: 'the enemy numbers are reports, not a count',
      zaydTakes: 'Zayd (RA) carries the standard',
      zaydFalls: 'Zayd (RA) falls',
      jafarTakes: 'Jaʿfar (RA) takes the standard',
      hands: 'the standard is cut from his hands · reported',
      jafarFalls: 'Jaʿfar (RA) falls · fifty wounds, none in his back',
      rawahahTakes: 'ʿAbdullāh ibn Rawāḥah (RA) takes the standard',
      rawahahFalls: 'ʿAbdullāh ibn Rawāḥah (RA) falls',
      stdDown: 'the standard is down',
      khalid: 'Khālid (RA) takes the banner',
      nine: 'nine swords break in his hand',
      yemeni: 'only a Yemeni sword remains',
      holds: 'the line holds',
      night: 'at night the flanks shift · reported',
      hesitate: 'at dawn the enemy hesitates · reported',
      withdraw: 'the army withdraws in order',
      victory: 'the report calls it a victory',
      noRout: 'the army was not routed',
      after: 'the field after',
      fallen: 'the fallen · twelve by the reports',
      wings: 'Jaʿfar (RA) · the two wings',
      names2: 'the Prophet (PBUH) names them before the news arrives',
      weeps: 'the Prophet’s (PBUH) eyes shed tears',
      return: 'the army returns to Madinah',
      verse: '3:169 · “alive with their Lord”',
      northRoad: 'the northern road stays open · reported'
    },
    ur: {
      army: 'مسلمان · تقریباً ۳۰۰۰',
      enemy: 'دشمن لشکر · روایات کے مطابق ۱۰۰٬۰۰۰–۲۰۰٬۰۰۰',
      village: 'مؤتہ · گاؤں', wadi: 'خشک وادی',
      roadn: 'شمال کا راستہ · بصرٰی اور معان',
      roads: 'جنوب کا راستہ · مدینہ',
      mcamp: 'مسلمانوں کا کیمپ', ecamp: 'دشمن کا کیمپ',
      olives: 'زیتون کے باغ', plain: 'مؤتہ کا میدان',
      zaydStd: 'زید رضی اللہ عنہ', jafarStd: 'جعفر رضی اللہ عنہ',
      rawahahStd: 'عبداللہ بن رواحہ رضی اللہ عنہ', khalidStd: 'خالد رضی اللہ عنہ · پرچم',
      title: 'جمادی الاول ۸ ہجری · شمال کا سفر',
      envoy: 'قاصد حارث رضی اللہ عنہ راستے میں شہید · روایت میں ہے',
      march1: 'تقریباً ۳۰۰۰ کا لشکر روانہ · روایت میں ہے',
      commanders: 'تینوں امیر پہلے سے نامزد',
      names: 'زید رضی اللہ عنہ · جعفر رضی اللہ عنہ · عبداللہ بن رواحہ رضی اللہ عنہ',
      maan: 'معان میں دشمن کا لشکر · ۱۰۰٬۰۰۰ اور ۱۰۰٬۰۰۰ حلیف، روایت میں ہے',
      rules: 'کوئی خیانت نہیں · عورتیں، بچے اور بوڑھے نہیں',
      form: 'دونوں لشکر مؤتہ میں',
      counsel: 'عبداللہ بن رواحہ رضی اللہ عنہ · ”فتح یا شہادت“',
      numbers: 'دشمن کی تعداد روایت ہے، یقینی شمار نہیں',
      zaydTakes: 'زید رضی اللہ عنہ پرچم لے کر آگے بڑھے',
      zaydFalls: 'زید رضی اللہ عنہ شہید',
      jafarTakes: 'جعفر رضی اللہ عنہ پرچم لیتے ہیں',
      hands: 'ان کے ہاتھوں سے پرچم کٹ گیا · روایت میں ہے',
      jafarFalls: 'جعفر رضی اللہ عنہ شہید · پچاس زخم، پیٹھ پر ایک بھی نہیں',
      rawahahTakes: 'عبداللہ بن رواحہ رضی اللہ عنہ پرچم لیتے ہیں',
      rawahahFalls: 'عبداللہ بن رواحہ رضی اللہ عنہ شہید',
      stdDown: 'پرچم گر گیا',
      khalid: 'خالد رضی اللہ عنہ پرچم لیتے ہیں',
      nine: 'ان کے ہاتھ میں نو تلواریں ٹوٹیں',
      yemeni: 'صرف یمنی تلوار باقی رہی',
      holds: 'صف قائم رہی',
      night: 'رات کو صفیں بدلی گئیں · روایت میں ہے',
      hesitate: 'صبح دشمن ہچکچایا · روایت میں ہے',
      withdraw: 'لشکر منظم طور پر واپس',
      victory: 'روایت اسے فتح کہتی ہے',
      noRout: 'لشکر بھاگا نہیں',
      after: 'میدان بعد میں',
      fallen: 'شہداء · روایات کے مطابق بارہ',
      wings: 'جعفر رضی اللہ عنہ · دو پر',
      names2: 'نبی ﷺ خبر پہنچنے سے پہلے نام لیتے ہیں',
      weeps: 'نبی ﷺ کی آنکھیں اشکبار',
      return: 'لشکر مدینہ واپس',
      verse: '۳:۱۶۹ · «أَحْيَاءٌ عِندَ رَبِّهِمْ»',
      northRoad: 'شمالی راستہ کھلا رہا · روایت میں ہے'
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
     Seven phases, one continuous shot each: no cuts and no impact shakes. */
  var PHASES = [
    { id: 'ground', name: 'the ground', dur: 10 },
    { id: 'march', name: 'the march north', dur: 13 },
    { id: 'field', name: 'the field', dur: 12 },
    { id: 'standards', name: 'the three standards', dur: 18 },
    { id: 'swords', name: 'the nine swords', dur: 14 },
    { id: 'withdrawal', name: 'the withdrawal', dur: 15 },
    { id: 'reckoning', name: 'the reckoning', dur: 14 }
  ];
  var TOTAL = 0; PHASES.forEach(function (p) { TOTAL += p.dur; });

  var SHOTS = {
    ground: [
      { t0: 0, t1: 1.001, p0: [0, 24, -252], p1: [0, 32, -216], l0: [0, 5, 18], l1: [2, 4, 44],
        portrait: { p0: [0, 62, -296], p1: [0, 46, -250], l0: [0, 6, 18], l1: [2, 5, 44] } }
    ],
    march: [
      { t0: 0, t1: 1.001, p0: [34, 36, -188], p1: [16, 24, -156], l0: [-4, 3, -104], l1: [0, 3, -92],
        portrait: { p0: [44, 74, -224], p1: [20, 50, -182], l0: [-4, 4, -104], l1: [0, 4, -92] } }
    ],
    field: [
      { t0: 0, t1: 1.001, p0: [26, 40, -170], p1: [12, 26, -120], l0: [0, 4, -30], l1: [0, 3, -10],
        portrait: { p0: [34, 74, -204], p1: [16, 46, -146], l0: [0, 5, -30], l1: [0, 4, -10] } }
    ],
    standards: [
      { t0: 0, t1: 1.001, p0: [8, 14, -50], p1: [6, 11, -38], l0: [0, 3, -14], l1: [0, 2, -12],
        portrait: { p0: [10, 34, -72], p1: [8, 24, -54], l0: [0, 3, -12], l1: [0, 3, -11] } }
    ],
    swords: [
      { t0: 0, t1: 1.001, p0: [22, 9, -30], p1: [18, 7, -20], l0: [17, 2, -9], l1: [17, 1.6, -7],
        portrait: { p0: [30, 30, -50], p1: [24, 22, -36], l0: [17, 2, -7], l1: [17, 2, -6] } }
    ],
    withdrawal: [
      { t0: 0, t1: 1.001, p0: [0, 30, -160], p1: [0, 24, -140], l0: [0, 4, -70], l1: [0, 4, -62],
        portrait: { p0: [0, 64, -196], p1: [0, 48, -168], l0: [0, 5, -70], l1: [0, 5, -62] } }
    ],
    reckoning: [
      { t0: 0, t1: 1.001, p0: [8, 20, -80], p1: [4, 12, -52], l0: [0, 3, -24], l1: [1, 2.5, -18],
        portrait: { p0: [10, 44, -104], p1: [6, 24, -66], l0: [0, 4, -24], l1: [1, 3, -18] } }
    ]
  };
  var IMPACTS = [];
  var PRESETS = {
    ground: { p: [0, 32, -216], l: [2, 4, 44] },
    aerial: { p: [40, 190, 120], l: [10, 8, 30] },
    field: { p: [12, 26, -120], l: [0, 3, -10] },
    standards: { p: [6, 11, -38], l: [0, 2, -12] },
    standard: { p: [18, 7, -20], l: [17, 1.6, -7] },
    march: { p: [16, 24, -156], l: [0, 3, -92] },
    camp: { p: [20, 20, -190], l: [0, 4, -140] },
    memorial: { p: [6, 12, -44], l: [1, 3, -18] },
    village: { p: [70, 20, 24], l: [112, 5, 18] }
  };
  var director = ENGINE.director(ctx);
  var clock = director.clock;

  /* ------------------------------ applying a frame */
  var FOG_BASE = new THREE.Color(0xc7b190);
  var FOG_NIGHT = new THREE.Color(0x3b3c44);
  var curPhaseIdx = 0, curPhaseT = 0;

  function nightK(i, t) {
    if (i !== 5) return 0;
    if (t < 0.08) return 0;
    if (t < 0.32) return 0.72 * easeIO((t - 0.08) / 0.24);
    if (t < 0.44) return 0.72;
    return 0.72 * (1 - easeIO((t - 0.44) / 0.18));
  }
  function applyNight(n) {
    sky.dome.material.color.setRGB(1 - 0.50 * n, 1 - 0.47 * n, 1 - 0.38 * n);
    if (sky.stars) sky.stars.material.opacity = 0.50 * n;
    sky.hemi.intensity = 0.55 * (1 - 0.45 * n);
    sky.sun.intensity = 1.05 * (1 - 0.76 * n);
    sky.fill.intensity = 0.24 * (1 - 0.40 * n);
    sky.rim.intensity = 0.22 * (1 - 0.50 * n);
    scene.fog.color.copy(FOG_BASE).lerp(FOG_NIGHT, n);
    scene.fog.near = 190 - 60 * n;
    scene.fog.far = 600 - 170 * n;
    particles.smoke.list.forEach(function (s) { s.pts.material.opacity = 0.13 * (1 - 0.55 * n); });
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

  function applyFrac(frac) {
    var info = director.phaseInfo(frac);
    var i = info.i, t = info.t;
    curPhaseIdx = i; curPhaseT = t;

    for (var k = 0; k < mBands.length; k++) moveBand(mBands[k], i, t);
    for (var e = 0; e < eBands.length; e++) moveBand(eBands[e], i, t);

    /* the horse rides with its side */
    var ecz = i === 0 ? 34 : i === 1 ? 32 : i === 2 ? 26 : i <= 4 ? 18 : i === 5 ? 24 : 42;
    eCavL.position.set(-78, heightAt(-78, ecz), ecz);
    eCavR.position.set(78, heightAt(78, ecz), ecz);
    eCavL.rotation.y = Math.PI / 2; eCavR.rotation.y = Math.PI / 2;
    var mcz = i === 0 ? -50 : i === 1 ? -48 : i === 2 ? -44 : i <= 4 ? -36 : i === 5 ? -60 : -70;
    mCav.position.set(70, heightAt(70, mcz), mcz);
    mCav.rotation.y = -Math.PI / 2;

    /* the three standards fall in sequence (MUT-011 … MUT-014) */
    var zk = i > 3 ? 1 : i === 3 ? clamp01((t - 0.22) / 0.10) : 0;
    var jk = i > 3 ? 1 : i === 3 ? clamp01((t - 0.58) / 0.10) : 0;
    var rk = i > 3 ? 1 : i === 3 ? clamp01((t - 0.74) / 0.10) : 0;
    zaydStd.fallen = zk; jafarStd.fallen = jk; rawahahStd.fallen = rk;
    zaydStd.group.rotation.z = 1.34 * zk;
    jafarStd.group.rotation.z = 1.34 * jk;
    rawahahStd.group.rotation.z = 1.34 * rk;
    zaydStd.group.position.y = zaydStd.baseY + 0.10 * zk;
    jafarStd.group.position.y = jafarStd.baseY + 0.10 * jk;
    rawahahStd.group.position.y = rawahahStd.baseY + 0.10 * rk;

    /* Khalid's banner rises after the third fall (MUT-016) */
    var kOn = i > 3 || (i === 3 && t > 0.82);
    khalidStd.group.visible = kOn;
    var kr = i > 3 ? 1 : clamp01((t - 0.82) / 0.12);
    khalidStd.group.rotation.z = 1.34 * (1 - kr);

    swordsGroup.visible = i === 4 || i === 5;
    memorialGroup.visible = i === 6 && t > 0.10;

    applyNight(nightK(i, t));

    var dustK = i === 1 ? 0.10 : i === 2 ? 0.30 : i === 3 ? 0.46 : i === 4 ? 0.30 : i === 5 ? 0.14 : 0.08;
    particles.dust.update(dustK);
    particles.angels.update(0);

    director.applyCamera(i, t);
  }

  function crowdEnv() {
    var ph = curPhaseIdx;
    var marching = ph === 1 || ph === 2 || ph === 5 || ph === 6;
    return {
      ph: ph,
      frac: clock.frac,
      total: TOTAL,
      fight: ph === 3 ? 0.62 : ph === 4 ? 0.40 : ph === 2 ? 0.12 : 0.06,
      disp: ph === 0 ? 0.08 : ph === 1 ? 0.52 : ph === 2 ? 0.40 : ph === 3 ? 0.62 : ph === 4 ? 0.42 : ph === 5 ? 0.30 : 0.34,
      marching: marching,
      gaitHz: 1.0,
      gaitAmp: marching ? 0.45 : 0.08,
      leanRun: ph === 5 ? 0.02 : 0,
      lod: MOBILE
    };
  }
  function updateMass() { ENGINE.crowd.update(crowdEnv()); }

  /* the arrow volleys attested through the wounds 'of stabs or shots' (MUT-012) */
  particles.arrows.makePool(props.makeArrow, MOBILE ? 24 : 40);
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
      var volley = (curPhaseIdx === 3 && curPhaseT > 0.18 && curPhaseT < 0.92) ||
        (curPhaseIdx === 4 && curPhaseT < 0.55);
      if (volley && !reduce) {
        particles.arrows.spawn(f.dt, 1.0, function (ar) {
          var ax = -54 + Math.random() * 108;
          ar.from.set(ax, 2.2, 16 + Math.random() * 8);
          ar.to.set(ax + (Math.random() - 0.5) * 6, 1.5, -8 + Math.random() * 10);
        });
      }
      particles.arrows.setAllVisible(true);
      particles.arrows.update(f.dt);
    },
    api: {
      army: function () {
        return {
          muslims: 3000,
          enemyStaged: 6000,
          reportedEnemy: '100,000–200,000',
          commanders: ['Zayd ibn Harithah', "Ja'far ibn Abi Talib", "'Abdullah ibn Rawahah"]
        };
      },
      standards: function () {
        return [zaydStd, jafarStd, rawahahStd, khalidStd].map(function (s) {
          return {
            pos: [s.x, +s.baseY.toFixed(1), s.z],
            fallen: s.fallen > 0.5,
            visible: s.group.visible,
            tilt: +s.group.rotation.z.toFixed(2)
          };
        });
      },
      swords: function () {
        return { count: 9, visible: swordsGroup.visible };
      },
      withdrawal: function () {
        return { phase: curPhaseIdx, night: +nightK(curPhaseIdx, curPhaseT).toFixed(2) };
      },
      memorial: function () {
        return { stones: 12, visible: memorialGroup.visible };
      }
    }
  });
})();
