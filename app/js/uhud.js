/* Uhud · the battle in 3D — the Uhud scene module.
   The plain south of Mount Uhud, the archers' hill, the two lines, the camps,
   the defile and the seven phases that follow from one decision: the archers
   left the hill. Built on the shared ENGINE (sky, ground, cast, crowd, labels,
   director, particles, runner); this file carries only Uhud's ground, layout,
   plans, shots and copy. The Prophet ﷺ is never depicted; no figure shows a
   face; the station at the defile is a standard inside an empty ring.
   Claims: data/ledger/uhud.json (UHUD-001 … UHUD-039). */
(function () {
  'use strict';
  var U = ENGINE.util;
  var easeIO = U.easeIO, clamp01 = U.clamp01, smoothN = U.smoothN, fbm = ENGINE.fbm;
  var ctx = ENGINE.boot({
    failText: 'The 3D battle needs WebGL. The graded ledger in data/ledger/uhud.json carries every fact.',
    grade: false, linearFog: true, fogColor: 0x9b8064
  });
  if (!ctx) return;
  var canvas = ctx.canvas, labelBox = ctx.labelBox, reduce = ctx.reduce, MOBILE = ctx.MOBILE;
  var renderer = ctx.renderer, scene = ctx.scene, camera = ctx.camera;

  /* ------------------------------ a later, harder morning than Badr.
     The sun is already up and south-east: the massif's south face takes a
     raking light, the plain runs pale, the haze thins out toward Madinah. */
  ENGINE.sky(ctx, {
    zenith: 0x2b5478, horizon: 0xa48a68, skyCurve: 0.42,
    stars: 0, starOpacity: 0,
    moon: false,
    hemiSky: 0x9db2c6, hemiGround: 0x4a3d2d, hemi: 0.62,
    sunColor: 0xffd7a6, sun: 0.92, sunPos: [92, 40, 34], shadowBounds: 110, shadowFar: 300,
    fillColor: 0x8ba1bb, fill: 0.34, fillPos: [-58, 22, -40],
    rimColor: 0xffdcb2, rim: 0.22, rimPos: [8, 16, -66]
  });

  /* ------------------------------ the ground of Uhud.
     Axes: +x east, +z south, -z toward the mountain. The Muslim line faces
     Madinah in the south with Mount Uhud at its back; the enemy stands between
     the Muslims and the city (UHUD-010). The archers' hill is the spur
     south-east of the camp (UHUD-011); the Quraysh camp lies to the south-west.
     The corridor between the two lines stays flat: nothing floats, nothing sinks. */

  /* Mount Uhud: a long, stepped escarpment from x = -150 to x = 150 with the
     front foot near z = -47 and the crest near z = -84. The height is quantised
     into rock shelves so the wall reads as strata and not as a dune. */
  function crestZ(x) {
    return -86 + Math.sin(x * 0.018 + 0.7) * 7 + (fbm(x * 0.012, 4.1, 3) - 0.5) * 22;
  }
  function footZ(x) {
    return -47 + (fbm(x * 0.019, 8.3, 2) - 0.5) * 8;
  }
  function crestH(x) {
    var h = 32 + 30 * Math.pow(Math.abs(fbm(x * 0.016 + 2.7, 1.9, 3) - 0.5) * 2, 0.9);
    h *= 0.80 + 0.34 * fbm(x * 0.05, 6.1, 2);
    /* the massif falls away east and west; one low saddle reads as a pass */
    h *= 1 - 0.5 * Math.exp(-Math.pow((x - 132) / 30, 2));
    h *= 1 - 0.34 * Math.exp(-Math.pow((x + 140) / 34, 2));
    return h;
  }
  function massif(x, z) {
    var cz = crestZ(x), fz = footZ(x);
    if (z > fz) return 0;
    var H = crestH(x), y;
    if (z >= cz) {
      var t = clamp01((fz - z) / Math.max(8, fz - cz));
      y = H * (Math.pow(t, 1.45) + 0.10 * t);
    } else {
      y = H * Math.pow(clamp01(1 - (cz - z) / 58), 0.9);
    }
    /* crags, then shelves: quantised in bands, so every flank steps */
    y *= 1 + 0.20 * ((fbm(x * 0.044 + 11, z * 0.044 + 3, 3) - 0.5) * 2);
    var band = 3.4, s = y / band, q = Math.floor(s), f = s - q;
    y = (q + Math.pow(f, 2.6)) * band;
    y += (fbm(x * 0.15, z * 0.15, 2) - 0.5) * 0.7 * clamp01(y / 8);
    return Math.max(0, y);
  }

  /* the archers' hill: a flat-topped rocky spur, 8 m, shelfed like the massif
     and broken by two rock shoulders so it never reads as a dune */
  var HILL = { x: 42, z: -14, h: 10.0, top: 9.0, skirt: 19.0 };
  function hillAt(x, z) {
    var dh = Math.hypot(x - HILL.x, (z - HILL.z) * 0.94);
    var y = HILL.h * smoothN(HILL.skirt - dh, 0, HILL.skirt - HILL.top);
    var shelf = 2.0, s = y / shelf, q = Math.floor(s), f = s - q;
    y = (q + Math.pow(f, 2.4)) * shelf;
    var flank = smoothN(dh, 6.5, HILL.skirt - 1.0);
    y += (fbm(x * 0.19 + 3.1, z * 0.19 + 7.7, 3) - 0.5) * 3.4 * flank;
    y += 2.6 * Math.exp(-Math.pow((x - 33.5) / 6.0, 2) - Math.pow((z + 21.5) / 5.5, 2));
    y += 1.8 * Math.exp(-Math.pow((x - 50.5) / 5.5, 2) - Math.pow((z + 8.0) / 6.5, 2));
    return Math.max(0, y);
  }

  /* the plain: flat battle ground, low dunes to the flanks, the pass south */
  function heightAt(x, z) {
    var h = massif(x, z) + hillAt(x, z);
    /* the valley floor rolls only outside the fought-over corridor */
    var out = Math.max(smoothN(Math.abs(x), 96, 150), smoothN(z, 62, 120), smoothN(-z, 52, 90));
    h += (fbm(x * 0.021 + 6.4, z * 0.021 + 3.1, 3) - 0.5) * 6.0 * out;
    h += (fbm(x * 0.058 + 1.3, z * 0.058 + 8.7, 2) - 0.5) * 1.4 * out;
    /* the pass south toward Madinah: the ground dips away from the field */
    h -= 1.6 * smoothN(z, 88, 190) * (0.7 + 0.3 * fbm(x * 0.02, 4.4, 2));
    /* the far ring lifts to close the horizon */
    var r = Math.hypot(x, z - 6);
    h += Math.max(0, r - 168) * 0.16 * (0.55 + 0.45 * fbm(x * 0.011, z * 0.011, 2));
    h += Math.max(0, r - 168) * 0.5 * Math.pow(Math.abs(fbm(x * 0.028 + 2.2, z * 0.028 + 5.1, 2) - 0.5) * 2, 1.5);
    /* micro ripple underfoot */
    h += (fbm(x * 0.33, z * 0.33, 2) - 0.5) * 0.045;
    return h;
  }

  /* rock above the talus line, sand below it: the massif and the hill cap are
     stone; the plain and the corridor keep the sand ramp. */
  var ROCK_LO = new THREE.Color(0x4a4a44);
  var ROCK_HI = new THREE.Color(0x7d7767);
  var ROCK = new THREE.Color();
  function colorAt(x, z, y, base) {
    var t = smoothN(y, 1.5, 6.0);
    if (t < 0.02) return null;
    var strata = 0.5 + 0.5 * Math.sin(y * 1.25 + fbm(x * 0.045, z * 0.045, 2) * 4.2);
    var grain = fbm(x * 0.21, z * 0.21, 2);
    ROCK.copy(ROCK_LO).lerp(ROCK_HI, 0.26 + 0.44 * strata + 0.12 * grain);
    /* a little warm dust settling on the shelves keeps the rock from going blue */
    ROCK.lerp(new THREE.Color(0x7a6a52), 0.14 * strata);
    var mass = smoothN(y, 26, 54);
    ROCK.multiplyScalar(0.9 - 0.10 * mass);
    return base.clone().lerp(ROCK, t);
  }

  ENGINE.ground(ctx, heightAt, {
    base: '#d9c8a9', repeat: 30, bumpScale: 0.10,
    sand: 0xbca57e, crest: 0xd0b78c, trough: 0x7e6d52, grit: 0xa89272,
    size: 470, seg: 220, colorAt: colorAt
  });

  var props = ENGINE.props(ctx, heightAt);

  /* boulders: a faceted stone, seated on the ground. The plain is not littered
     with geometry; the rock belongs to the massif's foot and the hill's rim. */
  var boulderGeoCache = null;
  function boulderGeo() {
    if (boulderGeoCache) return boulderGeoCache;
    var g = new THREE.IcosahedronGeometry(1, 1);
    var p = g.attributes.position, v = new THREE.Vector3();
    for (var i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      var n = 0.66 + fbm(v.x * 2.6 + 5.4, v.z * 2.6 + 1.7, 3) * 0.72;
      p.setXYZ(i, v.x * n * 1.2, v.y * n * 0.62, v.z * n);
    }
    g.computeVertexNormals();
    boulderGeoCache = g;
    return g;
  }
  var boulderMat = new THREE.MeshLambertMaterial({ color: 0x55534c });
  function boulder(x, z, s, ry) {
    var m = new THREE.Mesh(boulderGeo(), boulderMat);
    m.scale.setScalar(s);
    m.position.set(x, heightAt(x, z) + s * 0.16, z);
    m.rotation.set((U.hash2(x, z) - 0.5) * 0.3, ry === undefined ? U.hash2(z, x) * 3.1 : ry, (U.hash2(z + 3, x) - 0.5) * 0.25);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    return m;
  }
  /* talus at the massif's foot */
  [[-58, -46, 1.7], [-46, -47, 1.3], [-30, -46.5, 1.1], [-19, -47, 1.5], [6, -47, 1.2],
   [50, -46, 1.0], [56, -46, 1.6], [72, -47, 1.3], [-72, -45, 1.2], [88, -46, 1.1]
  ].forEach(function (r) { boulder(r[0], r[1], r[2]); });

  /* four stones on the hill's skirts; the crest stays clear for the archers */
  [[30.5, -19.5, 1.0], [53.5, -20.5, 0.9], [51.0, -5.0, 0.8], [33.0, -4.0, 0.9]
  ].forEach(function (r) { boulder(r[0], r[1], r[2]); });

  props.pebbleField(220, -40, -20, 88, 46);
  props.pebbleField(90, 24, -30, 24, 14);
  props.pebbleField(70, -24, 2, 40, 20);
  props.pebbleField(50, 10, 24, 30, 18);
  props.scrubField(200, 7);
  /* palms: the farms at the mountain's foot, and a stand by the Quraysh camp */
  props.palm(-62, -38, 3.4, 0.8); props.palm(-58.5, -35.4, 2.8, 0.5); props.palm(-66, -34, 2.6, 0.9);
  props.palm(-72, -30, 3.1, 0.6); props.palm(-54, 44, 2.9, 0.7); props.palm(-50, 48, 2.3, 0.5);

  /* al-Mihras: the hollow rock at the defile (UHUD-036) */
  var mihras = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.2, 0.62, 9, 1, true), props.mats.stoneDark);
  mihras.position.set(20.4, heightAt(20.4, -43.8) + 0.31, -43.8);
  mihras.castShadow = true; mihras.receiveShadow = true;
  scene.add(mihras);
  var mihrasWater = new THREE.Mesh(new THREE.CircleGeometry(0.76, 14), props.mats.waterM);
  mihrasWater.rotation.x = -Math.PI / 2;
  mihrasWater.position.set(20.4, heightAt(20.4, -43.8) + 0.5, -43.8);
  scene.add(mihrasWater);

  /* the defile shelf: a low stone bench against the mountain foot where the
     station held (UHUD-039). It is terrain, not a structure. */
  var shelf = new THREE.Group();
  for (var sh = 0; sh < 7; sh++) {
    var sa = -0.9 + sh * 0.3;
    var sr = 3.4;
    var sb = new THREE.Mesh(new THREE.BoxGeometry(1.5 + (sh % 2) * 0.4, 0.3, 0.9), props.mats.stoneDark);
    sb.position.set(20.8 + Math.cos(sa) * sr * 0.5, heightAt(20.8, -44.2) + 0.12, -44.2 + Math.sin(sa) * sr * 0.4);
    sb.rotation.y = sa;
    sb.castShadow = true; sb.receiveShadow = true;
    shelf.add(sb);
  }
  scene.add(shelf);

  /* camps: the Muslims under the massif, the Quraysh to the south-west */
  [-50, -44, -38, -46, -40, -34].forEach(function (x, k) {
    props.ridgeTent(x, -36 - (k % 2) * 3.2, false, 3.4, 4.4, 1.25);
  });
  [-48, -42, -36].forEach(function (x) { props.ridgeTent(x, -30.4, false, 3.2, 4.0, 1.15); });
  [-52, -44, -36, -28, -20].forEach(function (x, k) {
    props.ridgeTent(x, 50 + (k % 2) * 5.4, true, 3.6, 4.4, 1.3);
  });
  [-48, -34, -22].forEach(function (x) { props.ridgeTent(x, 60, true, 3.3, 4.2, 1.2); });
  props.campClutter(-44, -33); props.campClutter(-36, -28);
  props.campClutter(-46, 50); props.campClutter(-28, 52); props.campClutter(-18, 58);
  props.camel(-54, 46, 0.5); props.camel(-48.5, 47.4, -0.2); props.camel(-42, 45.8, 0.3);
  props.camel(-57, -32, -0.4); props.camel(-51, -34.2, 0.2);

  var particles = ENGINE.particles(ctx, heightAt, {
    dustBounds: { x0: -34, xs: 74, z0: -30, zs: 62 },
    dustSize: 3.4, dustGain: 0.085, dustColor: 0xc9b28c
  });
  particles.smoke.add(-46, 47.4); particles.smoke.add(-20, 49.8); particles.smoke.add(-42, -30.6);

  /* ------------------------------ the shared cast: standards and faceless men */
  var cast = ENGINE.cast(ctx);
  var WAVERS = cast.wavers;
  var brassM = cast.mats.brassM;

  /* ------------------------------ the archers' hill.
     Fifty archers under ʻAbdullāh ibn Jubayr (UHUD-011/012): four squads leave
     the hill for the spoils, one squad of ten — nine and their leader — holds
     (UHUD-022). Each squad is one instanced mesh, so the hill costs five draws
     and moving a squad is a group transform. Bows face the enemy, strings out,
     and no figure shows a face. */
  function bowGeo() {
    var wood = new THREE.Color(0x50452f), gut = new THREE.Color(0xd6ccb0);
    var parts = [];
    function limb(y0, z0, y1, z1, r0, r1) {
      var dy = y1 - y0, dz = z1 - z0;
      var len = Math.hypot(dy, dz);
      var g = new THREE.CylinderGeometry(r1, r0, len, 4);
      parts.push({
        geo: g, c: wood,
        p: [0, (y0 + y1) / 2, (z0 + z1) / 2],
        r: [Math.atan2(dz, dy), 0, 0]
      });
    }
    /* a full bow: grip forward, limbs curving back to the nocks, string across */
    limb(0.03, 0.10, 0.28, 0.19, 0.016, 0.014);
    limb(0.28, 0.19, 0.47, 0.14, 0.014, 0.011);
    limb(0.47, 0.14, 0.60, -0.02, 0.011, 0.007);
    limb(-0.03, 0.10, -0.28, 0.19, 0.016, 0.014);
    limb(-0.28, 0.19, -0.47, 0.14, 0.014, 0.011);
    limb(-0.47, 0.14, -0.60, -0.02, 0.011, 0.007);
    /* the string, nock to nock */
    parts.push({ geo: new THREE.BoxGeometry(0.01, 1.22, 0.01), p: [0, 0, -0.015], c: gut });
    /* the grip wrap */
    parts.push({ geo: new THREE.CylinderGeometry(0.026, 0.026, 0.16, 5), p: [0, 0, 0.10], c: new THREE.Color(0x33291c) });
    return ENGINE.merge.mergeParts(parts);
  }
  var BOW_GEO = bowGeo();

  function archerSquad(count, x, z, cols, dx, dz, ry) {
    var g = new THREE.Group();
    var bodyGeo = new THREE.CylinderGeometry(0.15, 0.19, 0.55, 6);
    var skirtGeo = new THREE.CylinderGeometry(0.19, 0.29, 0.44, 6);
    var headGeo = new THREE.SphereGeometry(0.115, 6, 5);
    var hoodGeo = new THREE.SphereGeometry(0.145, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.62);
    var bandGeo = new THREE.CylinderGeometry(0.147, 0.147, 0.055, 6);
    var legGeo = new THREE.CylinderGeometry(0.048, 0.058, 0.52, 5);
    var footGeo = new THREE.BoxGeometry(0.1, 0.055, 0.19);
    var armGeo = new THREE.CylinderGeometry(0.038, 0.045, 0.44, 4);
    var quiverGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.34, 5);
    var robeC = new THREE.Color(0xc3b89d), darkC = new THREE.Color(0x8e8069);
    var headC = new THREE.Color(0xa89b81), woodC = new THREE.Color(0x50452f);
    var parts = [
      { geo: bodyGeo, p: [0, 1.03, 0], c: robeC },
      { geo: skirtGeo, p: [0, 0.62, 0], c: darkC },
      { geo: headGeo, p: [0, 1.36, 0], c: headC },
      /* a cloth hood over the head and neck: no face is ever shown */
      { geo: hoodGeo, p: [0, 1.38, -0.01], c: robeC },
      { geo: bandGeo, p: [0, 1.29, -0.01], c: darkC },
      { geo: legGeo, p: [-0.07, 0.28, 0], c: darkC },
      { geo: legGeo, p: [0.07, 0.28, 0], c: darkC },
      { geo: footGeo, p: [-0.07, 0.03, 0.04], c: darkC },
      { geo: footGeo, p: [0.07, 0.03, 0.04], c: darkC },
      /* the bow arm reaches forward, the draw arm is bent at the shoulder */
      { geo: armGeo, p: [-0.17, 1.10, 0.13], r: [-1.15, 0, 0.1], c: robeC },
      { geo: armGeo, p: [0.17, 1.10, 0.02], r: [-0.35, 0, -0.2], c: robeC },
      /* a quiver on the back, shafts showing */
      { geo: quiverGeo, p: [0.12, 1.02, -0.17], r: [0.32, 0, 0.24], c: woodC }
    ];
    var geo = ENGINE.merge.mergeParts(parts);
    var mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }), count);
    mesh.castShadow = true;
    var bows = new THREE.InstancedMesh(BOW_GEO, new THREE.MeshLambertMaterial({ vertexColors: true }), count);
    bows.castShadow = true;
    var m = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3();
    var up = new THREE.Vector3(0, 1, 0);
    for (var i = 0; i < count; i++) {
      var r = Math.floor(i / cols), c = i % cols;
      var jr = (Math.abs(Math.sin(i * 3.7) * 917) % 1 - 0.5) * 0.24;
      var hs = 0.95 + (Math.abs(Math.sin(i * 2.3) * 719) % 1) * 0.11;
      var px = c * dx - (cols - 1) * dx / 2 + (Math.abs(Math.sin(i * 5.1)) % 1 - 0.5) * 0.1;
      var pz = r * dz + (Math.abs(Math.sin(i * 7.3)) % 1 - 0.5) * 0.14;
      pos.set(px, 0, pz);
      q.setFromAxisAngle(up, jr);
      sc.setScalar(hs);
      m.compose(pos, q, sc);
      mesh.setMatrixAt(i, m);
      /* the bow sits in the forward hand, upright, a little out to the side */
      pos.set(px - 0.24 * Math.cos(jr), 1.03 * hs, pz + 0.16 + 0.24 * Math.sin(-jr));
      q.setFromAxisAngle(up, jr);
      m.compose(pos, q, sc);
      bows.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    bows.instanceMatrix.needsUpdate = true;
    g.add(mesh); g.add(bows);
    g.position.set(x, heightAt(x, z) + 0.02, z);
    g.rotation.y = ry || 0;
    g.userData.dynamicRoot = true;
    scene.add(g);
    return { group: g, home: [x, z], y: heightAt(x, z) + 0.02, count: count };
  }
  /* five squads on the crest in two ranks, facing the approach from the south */
  var ARCHERS = [
    archerSquad(10, 38.4, -16.6, 5, 0.74, 0.78, -0.16),
    archerSquad(10, 42.2, -17.8, 5, 0.74, 0.78, -0.08),
    archerSquad(10, 46.0, -18.4, 5, 0.74, 0.78, 0.02),
    archerSquad(10, 40.2, -14.2, 5, 0.74, 0.78, -0.12),
    archerSquad(10, 44.4, -15.0, 5, 0.74, 0.78, -0.04)
  ];

  /* ------------------------------ cavalry.
     One merged horse-and-rider per mount; ten to a squadron, merged again to a
     single draw call. Khalid's 200 horse is the force whose wheel decides the
     day (UHUD-002/014/023); the model carries the mass, not the thousands. */
  function cavalrySquadron(n, cols, dx, dz, dark) {
    var g = new THREE.Group();
    var k = 0;
    for (var r = 0; r < Math.ceil(n / cols); r++) {
      for (var c = 0; c < cols && k < n; c++, k++) {
        var hx = (c - (cols - 1) / 2) * dx + (Math.abs(Math.sin(k * 5.7)) % 1 - 0.5) * 0.3;
        var hz = r * dz + (Math.abs(Math.sin(k * 3.1)) % 1 - 0.5) * 0.3;
        var hs = props.horse(0, 0, 0, dark);
        scene.remove(hs);
        hs.position.set(hx, 0, hz);
        hs.rotation.y = 0;
        g.add(hs);
        var rider = cast.makeFighter({
          x: 0, y: 0, z: 0, ry: 0,
          robe: dark ? 0x3d362b : 0xcfc6b2, robeDark: dark ? 0x251f18 : 0x8a7a60,
          weapon: 'spear', shield: true, helmet: dark, scale: 0.9
        });
        scene.remove(rider.group);
        rider.group.position.set(hx - 0.1, 1.58, hz);
        rider.group.rotation.y = 0;
        g.add(rider.group);
      }
    }
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    ENGINE.merge.mergeMeshList(ENGINE.merge.collectMergeable(g), g, true);
    g.userData.dynamicRoot = true;
    scene.add(g);
    return { group: g, home: [0, 0], label: null, entry: null, side: 1, k: 'cav', labelY: 3.6 };
  }
  var khalid = cavalrySquadron(10, 5, 1.9, 2.7, true);
  khalid.k = 'cav';
  var ikrimahHorse = cavalrySquadron(10, 5, 1.9, 2.7, true);
  ikrimahHorse.k = 'cavWest';
  khalid.group.position.set(56, heightAt(56, 4), 4);
  ikrimahHorse.group.position.set(-56, heightAt(-56, 18), 18);

  /* ------------------------------ the lines.
     About 700 Muslims in three battalions (UHUD-007/009); about 3,000 Quraysh
     in three wings, with the standard of Bani ʻAbd ad-Dār at the centre
     (UHUD-002/014/017). Bands are standards, not men: each one anchors the
     crowd squads nearest to it, so a division moves as a body. */
  var musab = cast.band(0, -26, -27.2);
  var usaid = cast.band(0, 0, -27.2);
  var hubab = cast.band(0, 26, -27.2);
  var qWest = cast.band(1, -42, 26.0);
  var qCentre = cast.band(1, 0, 26.0);
  var qEast = cast.band(1, 42, 26.0);
  var mBands = [musab, usaid, hubab];
  var qBands = [qWest, qCentre, qEast];

  musab.label = 'the Muhājirūn · Musʻab (RA)'; musab.entry = 'UHUD-007'; musab.k = 'muhajirun';
  usaid.label = 'Aws · Usaid ibn Ḥuḍair (RA)'; usaid.entry = 'UHUD-007'; usaid.k = 'aws';
  hubab.label = 'Khazraj · al-Ḥubāb (RA)'; hubab.entry = 'UHUD-007'; hubab.k = 'khazraj';
  qWest.label = 'Ikrimah’s wing'; qWest.entry = 'UHUD-014'; qWest.k = 'qWest';
  qCentre.label = 'Quraysh · Abū Sufyān’s centre'; qCentre.entry = 'UHUD-014'; qCentre.k = 'qurayshCentre';
  qEast.label = 'Khalid’s wing'; qEast.entry = 'UHUD-014'; qEast.k = 'qEast';

  /* the standard of Bani ʻAbd ad-Dār: carried in front of the centre, and the
     only standard that falls and is raised again (UHUD-017/024) */
  var abdDar = cast.band(1, -10, 21.6, 'Bani ʻAbd ad-Dār standard', 'UHUD-017');
  abdDar.k = 'abdDar';
  abdDar.labelAlways = true;

  /* division pennants: a brass finial on the three wings */
  function markDivision(u) {
    var penn = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 4), brassM);
    penn.position.y = 3.86;
    u.group.add(penn);
  }
  qBands.forEach(markDivision);

  /* ------------------------------ plans.
     One pose per phase: {x, z, ry, tilt, fallAt}. The runner's clock drives the
     lerp; the battle supplies what each phase means. */
  var PH = ['ground', 'archers', 'charge', 'spoils', 'flank', 'turn', 'reckoning'];
  function P(x, z, o) {
    o = o || {};
    return { x: x, z: z, ry: o.ry || 0, tilt: o.tilt || 0, fallAt: o.fallAt };
  }
  function initPlan(u) {
    u.plan = [];
    for (var i = 0; i < PH.length; i++) u.plan[i] = P(u.home[0], u.home[1]);
  }
  mBands.concat(qBands, [abdDar]).forEach(initPlan);

  /* Muslims: hold, hold, advance, press the spoils, recoil, driven back to the
     mountain foot, hold. The line compresses toward the defile as it breaks. */
  mBands.forEach(function (u, idx) {
    var x = u.home[0];
    u.plan[2] = P(x * 0.97, -13.0 + idx * 0.6);
    u.plan[3] = P(x * 1.06, -1.0 + idx * 0.8, { tilt: 0.03 });
    u.plan[4] = P(x * 0.86, -21.0 - idx * 0.9, { tilt: -0.05 });
    u.plan[5] = P(x * 0.62, -35.4 + idx * 1.2, { tilt: -0.06 });
    u.plan[6] = P(x * 0.62, -36.2 + idx * 1.2, { tilt: -0.06 });
  });

  /* Quraysh: hold, hold, close, break for the camp, rally, press the mountain,
     withdraw. The wings fall back further than the centre. */
  qBands.forEach(function (u, idx) {
    var x = u.home[0];
    var side = idx === 0 ? -1 : (idx === 2 ? 1 : 0);
    u.plan[2] = P(x * 0.94, -1.0 + idx * 0.8);
    u.plan[3] = P(x * 0.9 + side * 8, 40 + idx * 4, { tilt: 0.05, ry: side * 0.1 });
    u.plan[4] = P(x * 0.96 + side * 4, 38 + idx * 2, { tilt: 0.04 });
    u.plan[5] = P(x * 0.82 + side * 2, -4.0 + idx * 1.4, { tilt: -0.03 });
    u.plan[6] = P(x * 1.05 + side * 6, 34 + idx * 3, { tilt: 0.05 });
    u._stag = (idx * 0.035);
  });
  /* the standard of ʻAbd ad-Dār stays at the centre front and falls there */
  abdDar.plan[2] = P(-10, -3.0);
  abdDar.plan[3] = P(-10, 30.0, { tilt: 0.05 });
  abdDar.plan[4] = P(-10, 12.0);
  abdDar.plan[5] = P(-10, -1.0);
  abdDar.plan[6] = P(-10, 30.0, { tilt: 0.05 });
  abdDar.dropAt = 0.38;

  /* ------------------------------ event marks. No named person is figured:
     a standard, a weapon-mass, a ring or a grave marks the act. */
  function stationRing(x, z) {
    var g = new THREE.Group();
    g.position.set(x, 0, z);
    g.userData.dynamicRoot = true;
    scene.add(g);
    /* a band standard at the centre: the station's marker, never a figure */
    var std = cast.band(0, 0, 0);
    scene.remove(std.group);
    std.group.position.set(0, 0, 0);
    std.group.scale.setScalar(1.12);
    g.add(std.group);
    /* seven faceless Companions form a shield wall around it, facing outward,
       leaving the centre empty (UHUD-025/027/039) */
    var n = 7;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + 0.32;
      var rr = 3.1;
      var f = cast.makeFighter({
        x: Math.cos(a) * rr, y: heightAt(x + Math.cos(a) * rr, z + Math.sin(a) * rr), z: Math.sin(a) * rr,
        ry: -a + Math.PI / 2, robe: 0xd3cab5, robeDark: 0x8f8168, weapon: 'sword', shield: true, scale: 0.98
      });
      scene.remove(f.group);
      g.add(f.group);
      f.group.userData.dynamicRoot = false;
    }
    return g;
  }
  var prophetMark = stationRing(20.0, -42.4);
  prophetMark.userData.keep = true;

  /* the spoils: what is left on the ground where the Quraysh line stood */
  var spoilMark = new THREE.Group();
  spoilMark.position.set(2, 0, 18);
  spoilMark.userData.keep = true;
  var spoilShield = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 12), cast.mats.shieldQ);
  spoilShield.rotation.x = Math.PI / 2 + 0.12;
  spoilShield.position.set(0.4, 0.06, 0.2);
  spoilMark.add(spoilShield);
  for (var sp = 0; sp < 7; sp++) {
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.027, 2.2, 5), cast.mats.woodM);
    shaft.rotation.z = Math.PI / 2 - 0.06;
    shaft.rotation.y = sp * 0.61;
    shaft.position.set(-1.5 + (sp % 3) * 1.4, 0.07, -0.6 + Math.floor(sp / 3) * 1.1);
    spoilMark.add(shaft);
  }
  var spoilHelm = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), cast.mats.ironQ);
  spoilHelm.position.set(1.6, 0.08, -0.9); spoilHelm.rotation.y = 0.6;
  spoilMark.add(spoilHelm);
  spoilMark.visible = false;
  scene.add(spoilMark);

  /* the graves of the martyrs at the mountain foot (UHUD-032/034):
     a small field of low mounds, not a wall of stones */
  var graveGroup = new THREE.Group();
  graveGroup.visible = false;
  graveGroup.userData.keep = true;
  var graveStone = new THREE.MeshLambertMaterial({ color: 0x6d6354 });
  var graveMound = new THREE.MeshLambertMaterial({ color: 0xab9575 });
  for (var gv = 0; gv < 18; gv++) {
    var gx = -9 + (gv % 6) * 2.4 + (Math.floor(gv / 6) % 2) * 0.8;
    var gz = -43.0 - Math.floor(gv / 6) * 2.1;
    var mound = new THREE.Mesh(new THREE.SphereGeometry(0.62, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2), graveMound);
    mound.scale.set(1, 0.22, 0.62);
    mound.position.set(gx, heightAt(gx, gz) + 0.03, gz);
    mound.receiveShadow = true;
    graveGroup.add(mound);
    var stone = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.52, 0.14), graveStone);
    stone.position.set(gx, heightAt(gx, gz) + 0.24, gz + 0.62);
    stone.rotation.y = (gv % 2 ? 1 : -1) * 0.09;
    stone.castShadow = true;
    graveGroup.add(stone);
  }
  scene.add(graveGroup);

  /* ------------------------------ the crowd */
  ENGINE.crowd.build({
    side: 0, count: 700, cols: 30, dxS: 1.9, dzS: 1.9, z0: -27.2, h: 1.9,
    divFiles: 10, divPitch: 26, blocks: mBands, scene: scene
  });
  /* three wings of a thousand, the deep ranks mailed: rims, belts and spears
     keep the mass reading as men instead of a carpet */
  ENGINE.crowd.build({
    side: 1, count: 3000, cols: 54, dxS: 1.9, dzS: 1.9, z0: 24.0, h: 2.15,
    divFiles: 18, divPitch: 42, blocks: qBands, scene: scene
  });

  /* ------------------------------ labels */
  function mkLabel(txt, cls) { return ENGINE.labels.mkLabel(labelBox, txt, cls); }
  var LAND = [
    { w: [-30, heightAt(-30, -84) + 7, -84], t: 'Mount Uḥud', e: 'UHUD-010', k: 'mount', cls: 'is-land-name is-far' },
    { w: [42, heightAt(42, -14) + 2.6, -14], t: 'the archers’ hill', e: 'UHUD-011', k: 'hill', cls: 'is-tap', ph: [0, 1, 3, 4] },
    { w: [20.0, heightAt(20.0, -42.4) + 5.2, -42.4], t: 'the Prophet’s station (PBUH)', e: 'UHUD-039', k: 'prophet', cls: 'is-tap is-event', ph: [5, 6] },
    { w: [20.4, heightAt(20.4, -43.8) + 1.5, -43.8], t: 'al-Mihras · the water at the defile', e: 'UHUD-036', k: 'mihras', cls: 'is-land', ph: [5, 6] },
    { w: [-46, heightAt(-46, 52) + 3, 52], t: 'the Quraysh camp', e: 'UHUD-004', k: 'qcamp', cls: 'is-land-name', ph: [0, 3, 6] },
    { w: [-42, heightAt(-42, -33) + 2.2, -33], t: 'the Muslim camp', e: 'UHUD-010', k: 'mcamp', cls: 'is-land-name', ph: [0, 5] },
    { w: [-3, heightAt(-3, -43.6) + 1.6, -43.6], t: 'the graves of the martyrs · 70', e: 'UHUD-032', k: 'graves', cls: 'is-tap is-event', ph: [6] },
    { w: [0, 10, 118], t: 'Madinah · beyond the pass', e: 'UHUD-010', k: 'madinah', cls: 'is-land-name is-far', ph: [0] }
  ];
  var LANDL = LAND.map(function (l) {
    var node = mkLabel(l.t, l.cls);
    return { el: node, v: new THREE.Vector3(l.w[0], l.w[1], l.w[2]), k: l.k, ph: l.ph, tRange: l.tRange };
  });
  var UNIT_DEFS = [
    { u: musab, side: 0, labelY: 4.4, priority: 2, ph: [0, 2, 5] },
    { u: usaid, side: 0, labelY: 4.4, priority: 2, ph: [2, 5] },
    { u: hubab, side: 0, labelY: 4.4, priority: 2, ph: [2, 5] },
    { u: qCentre, side: 1, labelY: 4.4, priority: 2, ph: [0, 2, 4] },
    { u: qWest, side: 1, labelY: 4.4, priority: 2, ph: [2] },
    { u: qEast, side: 1, labelY: 4.4, priority: 2, ph: [2] },
    { u: abdDar, side: 1, labelY: 4.4, priority: 2, ph: [0, 3, 4] },
    { u: khalid, side: 1, labelY: 3.9, priority: 2, event: true, ph: [2, 3, 4, 5, 6] },
    { u: ikrimahHorse, side: 1, labelY: 3.9, priority: 2, ph: [2, 4] }
  ];
  var mLineEntry = { group: new THREE.Group(), label: 'the Muslim line · about 700', k: 'mline', labelY: 4.6, priority: 3, event: true, ph: [0], labelAlways: true };
  mLineEntry.group.position.set(0, 0, -27.2);
  scene.add(mLineEntry.group);
  UNIT_DEFS.push({ u: mLineEntry, side: 0, labelY: 4.6, priority: 3, ph: [0], event: true });
  var EVENT_MARKS = [
    { key: 'archers', label: 'the archers · 50 · ʻAbdullāh ibn Jubayr (RA)', x: 42, y: 12.4, z: -16, ph: [1, 2, 3], tRange: [0, 0.6], priority: 3 },
    { key: 'orders', label: 'hold the hill, whatever happens', x: 42, y: 11.2, z: -16, ph: [1], tRange: [0.26, 0.9], priority: 3 },
    { key: 'leave', label: '40 leave the hill · 9 stay', x: 42, y: 12.0, z: -16, ph: [3], tRange: [0.2, 1], priority: 4 },
    { key: 'wheel', label: 'Khalid wheels the empty hill', x: 40, y: 8.0, z: -2, ph: [4], tRange: [0.06, 0.62], priority: 4 },
    { key: 'rear', label: 'the rear is struck', x: 24, y: 5.0, z: -24, ph: [4], tRange: [0.52, 1], priority: 4 },
    { key: 'station', label: 'the station holds (PBUH)', x: 20.0, y: 5.6, z: -42.4, ph: [5], tRange: [0.16, 0.98], priority: 4 },
    { key: 'qdead', label: '22–37 Quraysh killed', x: -6, y: 3.2, z: 30, ph: [6], priority: 4 }
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
    d.u.k = d.u.k || ('unit' + Math.round(d.u.home[0] * 10));
    d.u.labelY = d.labelY;
    d.u.priority = d.priority;
    d.u.event = !!d.event;
    if (d.ph) d.u.ph = d.ph;
    var node = mkLabel(d.u.label, (d.side ? '' : 'is-side') + (d.event ? ' is-event' : ''));
    return { el: node, u: d.u, k: d.u.k };
  });
  EVENT_MARKS.forEach(function (m) {
    ULABS.push({ el: m.labelNode, u: { k: m.key, label: m.label, group: m.group, labelY: m.y, event: true, priority: m.priority, labelAlways: true, ph: m.ph, tRange: m.tRange }, k: m.key });
  });

  var LABELS = {
    en: {
      muhajirun: 'the Muhājirūn · Musʻab (RA)', aws: 'Aws · Usaid ibn Ḥuḍair (RA)', khazraj: 'Khazraj · al-Ḥubāb (RA)',
      mline: 'the Muslim line · about 700',
      qurayshCentre: 'Quraysh · about 3,000 · Abū Sufyān’s centre',
      qWest: 'Ikrimah’s wing', qEast: 'Khalid’s wing',
      abdDar: 'Bani ʻAbd ad-Dār standard',
      cav: 'Khalid’s horse · 200', cavWest: 'Ikrimah’s horse', mount: 'Mount Uḥud', hill: 'the archers’ hill',
      prophet: 'the Prophet’s station (PBUH)', mihras: 'al-Mihras · the water at the defile',
      qcamp: 'the Quraysh camp', mcamp: 'the Muslim camp', graves: 'the graves of the martyrs · 70',
      madinah: 'Madinah · beyond the pass', archers: 'the archers · 50 · ʻAbdullāh ibn Jubayr (RA)',
      orders: 'hold the hill, whatever happens', leave: '40 leave the hill · 9 stay',
      wheel: 'Khalid wheels the empty hill', rear: 'the rear is struck',
      station: 'the station holds (PBUH)', qdead: '22–37 Quraysh killed'
    },
    ur: {
      muhajirun: 'مہاجرین · مصعب رضی اللہ عنہ', aws: 'اوس · اسید بن حضیر رضی اللہ عنہ', khazraj: 'خزرج · حباب رضی اللہ عنہ',
      mline: 'مسلمانوں کی صف · تقریباً ۷۰۰',
      qurayshCentre: 'قریش · تقریباً ۳۰۰۰ · ابو سفیان کا مرکز',
      qWest: 'عکرمہ کا بازو', qEast: 'خالد کا بازو',
      abdDar: 'بنی عبدالدار کا پرچم',
      cav: 'خالد کے سوار · ۲۰۰', cavWest: 'عکرمہ کے سوار', mount: 'اُحد پہاڑ', hill: 'تیر اندازوں کی پہاڑی',
      prophet: 'مقامِ نبوی ﷺ', mihras: 'المہراس · درے کا پانی',
      qcamp: 'قریش کا کیمپ', mcamp: 'مسلمانوں کا کیمپ', graves: 'شہداء کی قبریں · ۷۰',
      madinah: 'مدینہ · درے کے پار', archers: 'تیر انداز · ۵۰ · عبداللہ بن جبیر رضی اللہ عنہ',
      orders: 'پہاڑی پر جمے رہو، جو بھی ہو', leave: '۴۰ نے پہاڑی چھوڑی · ۹ رہے',
      wheel: 'خالد خالی پہاڑی کا چکر لگاتا ہے', rear: 'پچھواڑے پر وار',
      station: 'مقام قائم رہا ﷺ', qdead: '۲۲–۳۷ قریشی مارے گئے'
    }
  };
  function setLang(lang) {
    var d = LABELS[lang] || LABELS.en;
    LANDL.forEach(function (it) { it.el.textContent = d[it.k] || it.el.textContent; });
    ULABS.forEach(function (it) { it.el.textContent = d[it.u.k] || it.el.textContent; });
  }

  /* ------------------------------ arrows: the archers' volleys */
  particles.arrows.makePool(props.makeArrow, 54);
  var stuckArrows = new THREE.Group();
  for (var sa = 0; sa < 40; sa++) {
    var arw = props.makeArrow();
    var ax = 4 + Math.random() * 34, az = 4 + Math.random() * 22;
    arw.position.set(ax, heightAt(ax, az) + 0.24, az);
    arw.rotation.x = 1.05 + Math.random() * 0.5;
    arw.rotation.z = (Math.random() - 0.5) * 0.8;
    stuckArrows.add(arw);
  }
  stuckArrows.visible = false;
  scene.add(stuckArrows);

  /* ------------------------------ static merge: everything rigid in a few
     batches; the standards, archer squads, cavalry and event marks stay live */
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
    mBands.concat(qBands, [abdDar]).forEach(function (b) {
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
  merge.mergeMeshList(merge.collectMergeable(graveGroup), graveGroup, true);
  merge.mergeMeshList(merge.collectMergeable(spoilMark), spoilMark, true);
  merge.mergeMeshList(merge.collectMergeable(prophetMark), prophetMark, true);

  /* ------------------------------ phases + shots */
  var PHASES = [
    { id: 'ground', name: 'the ground', dur: 8 },
    { id: 'archers', name: 'the archers’ hill', dur: 10 },
    { id: 'charge', name: 'the charge', dur: 13 },
    { id: 'spoils', name: 'the spoils', dur: 9 },
    { id: 'flank', name: 'the flank', dur: 12 },
    { id: 'turn', name: 'the turn', dur: 11 },
    { id: 'reckoning', name: 'the reckoning', dur: 11 }
  ];
  var TOTAL = 0; PHASES.forEach(function (p) { TOTAL += p.dur; });

  /* one continuous move per shot; cuts are motivated, never a wall in frame */
  var SHOTS = {
    ground: [
      { t0: 0, t1: 1.001, p0: [108, 86, 138], p1: [78, 54, 96], l0: [0, 18, -30], l1: [0, 8, -34] }
    ],
    archers: [
      { t0: 0, t1: 0.52, p0: [24, 9.5, 6], p1: [30, 8.6, -2], l0: [42, 9.6, -15], l1: [42, 9.4, -16] },
      { t0: 0.52, t1: 1.001, p0: [35, 12.5, -8], p1: [37, 11.5, -14], l0: [45, 10.0, -17], l1: [47, 9.8, -19] }
    ],
    charge: [
      { t0: 0, t1: 0.58, p0: [2, 11, -50], p1: [0, 6.8, -32], l0: [0, 2.6, 6], l1: [0, 1.6, 20] },
      { t0: 0.58, t1: 1.001, p0: [32, 6.4, -22], p1: [26, 5.4, -14], l0: [-2, 1.6, 12], l1: [-2, 1.4, 18] }
    ],
    spoils: [
      { t0: 0, t1: 0.55, p0: [20, 10, 4], p1: [26, 9, -4], l0: [40, 7.4, -14], l1: [42, 6.8, -16] },
      { t0: 0.55, t1: 1.001, p0: [30, 8, 6], p1: [22, 5.5, 12], l0: [2, 2.0, 16], l1: [-2, 1.6, 22] }
    ],
    flank: [
      { t0: 0, t1: 0.5, p0: [60, 6.5, 12], p1: [52, 5.8, 2], l0: [40, 3.2, -8], l1: [32, 2.8, -14] },
      { t0: 0.5, t1: 1.001, p0: [28, 11, -40], p1: [20, 8, -32], l0: [8, 2.2, -16], l1: [2, 1.8, -10] }
    ],
    turn: [
      { t0: 0, t1: 0.46, p0: [-36, 11, -30], p1: [-20, 8, -20], l0: [10, 4, -38], l1: [14, 3, -40] },
      { t0: 0.46, t1: 1.001, p0: [36, 8, -47], p1: [32, 7, -44], l0: [19, 2.8, -42], l1: [18, 2.4, -43] }
    ],
    reckoning: [
      { t0: 0, t1: 0.42, p0: [88, 64, 98], p1: [60, 40, 62], l0: [0, 8, -12], l1: [0, 5, -26] },
      { t0: 0.42, t1: 1.001, p0: [22, 20, -24], p1: [13, 13, -34], l0: [-4, 1.4, -44], l1: [-4, 1.0, -46] }
    ]
  };
  var IMPACTS = [
    { ph: 2, t: 0.72, amp: 0.09 },
    { ph: 4, t: 0.55, amp: 0.13 },
    { ph: 5, t: 0.28, amp: 0.06 }
  ];
  var PRESETS = {
    ground: { p: [76, 50, 92], l: [0, 8, -34] },
    aerial: { p: [40, 120, 96], l: [0, 0, -18] },
    hill: { p: [56, 16, 12], l: [42, 9, -15] },
    line: { p: [24, 7, 6], l: [0, 1.6, -12] },
    mountain: { p: [30, 10, -20], l: [4, 10, -62] },
    camp: { p: [-16, 8, 40], l: [-46, 2, 52] }
  };
  var director = ENGINE.director(ctx);
  var clock = director.clock;

  /* ------------------------------ applying a frame */
  var UNITS = mBands.concat(qBands, [abdDar]);
  var curPhaseIdx = 0, curPhaseT = 0;

  function pathAt(pts, u) {
    var n = pts.length - 1;
    var f = clamp01(u) * n;
    var i = Math.min(n - 1, Math.floor(f));
    var k = f - i;
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
  }

  function applyFrac(frac) {
    var info = director.phaseInfo(frac);
    var i = info.i, t = info.t;
    curPhaseIdx = i;
    curPhaseT = t;

    /* units: move from plan[i-1] to plan[i], with a staggered start */
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
      /* the melee shimmer */
      if (i === 2 || i === 4 || i === 5) {
        p.x += Math.sin(t * 9 + k * 1.7) * 0.12;
        p.z += Math.cos(t * 7 + k * 2.1) * 0.09;
      }
      var fPhase = -1;
      for (var fi = i; fi >= 0; fi--) {
        if (u.plan[fi].fallAt !== undefined) { fPhase = fi; break; }
      }
      var fallen = 0;
      if (fPhase >= 0) fallen = fPhase < i ? 1 : clamp01((t - u.plan[fPhase].fallAt) / 0.14);
      applyPose(u, p, fallen);
    }

    /* the standard of ʻAbd ad-Dār falls in the spoils and is raised for the
       counter-attack (UHUD-017/024) */
    var drop = 0;
    if (i === 3) drop = clamp01((t - abdDar.dropAt) / 0.12);
    else if (i === 4) drop = 1 - easeIO(clamp01((t - 0.42) / 0.22));
    abdDar.group.rotation.z = 1.22 * drop;
    abdDar.group.position.y = 0.16 * drop;
    abdDar.labelY = 4.4 - 2.5 * drop;

    /* archers: four squads leave the hill for the spoils; one squad of ten
       holds the crest (UHUD-022). At the flank the stayers fall where they stood. */
    var leave = i > 3 ? 1 : (i === 3 ? easeIO(clamp01((t - 0.14) / 0.52)) : 0);
    for (var a = 0; a < ARCHERS.length; a++) {
      var sq = ARCHERS[a];
      if (a === 4) {
        /* nine and their leader: they never leave the hill */
        var stay = i > 4 ? 1 : 0;
        sq.group.position.set(sq.home[0], sq.y - 0.10 * stay, sq.home[1]);
        sq.group.rotation.z = 0.9 * stay;
        continue;
      }
      /* down the south-west slope into the vacated ground, clear of the
         Quraysh line, which has already broken for its camp */
      var tx = 24 + a * 3.4, tz = 4 + (a % 2) * 5.0;
      var bx = sq.home[0] + (tx - sq.home[0]) * leave;
      var bz = sq.home[1] + (tz - sq.home[1]) * leave;
      var gy = heightAt(bx, bz) + 0.02;
      sq.group.position.set(bx, sq.y + (gy - sq.y) * leave, bz);
      sq.group.rotation.y = (a === 0 ? -0.16 : a === 1 ? -0.08 : a === 2 ? 0.02 : -0.12) - 0.5 * leave;
    }

    /* cavalry: the wheel around the empty hill, the rear, the press, the withdrawal */
    var kp;
    if (i < 2) kp = [56, 4];
    else if (i === 2) {
      var probe = Math.sin(clamp01(t) * Math.PI * 2);
      kp = [56 - probe * 4.0, 4 + probe * 6.0];
    } else if (i === 3) kp = [56, 4];
    else if (i === 4) {
      kp = pathAt([[56, 4], [52, -8], [46, -22], [34, -30], [20, -31], [8, -26], [4, -20]], easeIO(clamp01((t - 0.05) / 0.9)));
    } else if (i === 5) kp = pathAt([[4, -20], [0, -12], [-4, -4]], easeIO(t));
    else kp = pathAt([[-4, -4], [10, 12], [30, 28]], easeIO(t));
    khalid.group.position.set(kp[0], heightAt(kp[0], kp[1]), kp[1]);
    khalid.group.rotation.y = i === 4 ? -1.05 * easeIO(clamp01((t - 0.05) / 0.6)) : 0;

    var ip;
    if (i < 4) ip = [-56, 18];
    else if (i === 4) ip = pathAt([[-56, 18], [-48, 8], [-36, 0], [-26, -4]], easeIO(clamp01((t - 0.22) / 0.78)));
    else if (i === 5) ip = pathAt([[-26, -4], [-28, -12], [-30, -18]], easeIO(t));
    else ip = pathAt([[-30, -18], [-34, 6], [-42, 26]], easeIO(t));
    ikrimahHorse.group.position.set(ip[0], heightAt(ip[0], ip[1]), ip[1]);

    /* the station stands from the turn onward; the centre of the ring is empty */
    prophetMark.visible = i >= 5;

    /* the field: spoils, graves */
    spoilMark.visible = i === 3;
    graveGroup.visible = i === 6;

    /* arrows: the archers' volleys through the charge and the first spoils */
    var volley = (i === 1 && t > 0.62) || (i === 2 && t < 0.8) || (i === 3 && t < 0.2);
    if (volley && !reduce) particles.arrows.spawn(clock.dt || 0, clock.speed, function (ar) {
      ar.from.set(38 + Math.random() * 9, heightAt(42, -16) + 1.6 + Math.random() * 1.2, -18 + Math.random() * 5);
      ar.to.set(-30 + Math.random() * 52, 0.9, 6 + Math.random() * 18);
    });
    particles.arrows.update(clock.dt || 0);
    particles.arrows.setAllVisible(true);
    stuckArrows.visible = i >= 2;

    /* dust: the charge, the wheel, the withdrawal; never a fog of particles */
    var dust = (i === 2 ? Math.sin(clamp01(t) * Math.PI) * 0.7 : 0)
      + (i === 4 ? 0.55 + 0.45 * Math.sin(clamp01(t) * Math.PI) : 0)
      + (i === 5 ? 0.5 * Math.sin(clamp01(t) * Math.PI) : 0);
    particles.dust.update(dust);
    particles.angels.update(0);

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

  /* crowd env: gait matched to travel speed per phase */
  function crowdEnv() {
    var ph = curPhaseIdx;
    var marching = ph === 2 || ph === 3 || ph === 5;
    var fight = ph === 4 ? 1 : ph === 2 ? 0.45 : ph === 5 ? 0.7 : ph === 3 ? 0.15 : 0;
    return {
      ph: ph,
      frac: clock.frac,
      total: TOTAL,
      fight: fight,
      disp: ph === 2 ? 0.9 : ph === 3 ? 1.1 : ph === 4 ? 0.7 : ph === 5 ? 0.85 : ph === 6 ? 0.3 : 0,
      marching: marching,
      gaitHz: ph === 5 ? 1.35 : ph === 3 ? 0.95 : ph === 2 ? 0.7 : 1.0,
      gaitAmp: marching ? (ph === 5 ? 0.62 : 0.5) : (fight > 0 ? 0 : 0.04),
      leanRun: ph === 5 ? 0.22 : ph === 3 ? 0.12 : 0,
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
    },
    api: {
      archers: function () {
        return ARCHERS.map(function (a) {
          return { pos: a.group.position.toArray().map(function (v) { return +v.toFixed(1); }), count: a.count };
        });
      },
      cavalry: function () {
        return [khalid, ikrimahHorse].map(function (c) {
          return { pos: c.group.position.toArray().map(function (v) { return +v.toFixed(1); }) };
        });
      },
      army: function () {
        return {
          muslimBands: mBands.length, qurayshBands: qBands.length,
          archers: ARCHERS.reduce(function (n, a) { return n + a.count; }, 0)
        };
      }
    }
  });
})();