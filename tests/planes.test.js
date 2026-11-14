// TM-11 Plane Changes (js/ch/planes.js + planes.phys.js): numbers quoted in the text, physics vs hand calculation, lab scenarios, figure, practice.
const test = require('node:test'), assert = require('node:assert/strict');
const P = require('../js/ch/planes.phys.js');
const { loadChapter } = require('./helpers/chapter.js');
const { checkGenerators, checkQuiz } = require('./helpers/practice.js');
const { SCEN, figAzimuth, practice } = loadChapter('planes', ['SCEN', 'figAzimuth'], { Phys_planes: P });
const D = Math.PI / 180, { mu, RE, wE } = P.C;
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x} vs text ${want}`);
const vG = P.circV(RE + 35786e3), v185 = P.circV(RE + 185e3);

test('11.2-11.4 numbers quoted in the text', () => {
  near(vG, 3075, 1, 'GEO speed'); near(P.planeDv(vG, 28.5 * D), 1514, 1, 'plane change at GEO');
  near(P.planeDv(P.circV(RE + 300e3), 28.5 * D), 3803, 1, '28.5 deg at 300 km');
  near(P.planeDv(v185, 0.6 * D), 82, 0.5, '0.6 deg at 185 km'); near(v185, 7793, 1, 'speed at 185 km');
  const pd = P.pad(vG, vG, 28.5 * D, 1);
  near(pd.nor, 1467, 1, 'normal'); near(pd.pro, -373, 1, 'prograde'); near(Math.hypot(pd.nor, pd.pro), P.planeDv(vG, 28.5 * D), 1e-6, 'right triangle');
  near(P.pad(v185, v185, 0.6 * D, 1).pro, -0.4, 0.05, 'small angle prograde');
  // a normal burn alone: inclination 28.5 -> 3.0, apogee altitude 60 600 km
  const vn = Math.hypot(vG, pd.nor), a = 1 / (2 / (RE + 35786e3) - vn * vn / mu);
  near(28.5 - Math.atan2(pd.nor, vG) / D, 3.0, 0.05, 'residual inclination'); near((2 * a - (RE + 35786e3) - RE) / 1e3, 60600, 100, 'apogee altitude');
  // GTO: three plans
  const rp = RE + 185e3, ra = RE + 35786e3, at = (rp + ra) / 2, va = P.visViva(ra, at), vtp = P.visViva(rp, at);
  near(va, 1596, 1, 'speed at apogee'); near(vG - va, 1479, 1, 'circularize');
  near(vG - va + P.planeDv(vG, 28.5 * D), 2993, 1, 'plan 1'); near(P.planeDv(va, 28.5 * D) + vG - va, 2264, 1, 'plan 2');
  const comb = P.combinedDv(va, vG, 28.5 * D), cp = P.pad(va, vG, 28.5 * D, -1);
  near(comb, 1837, 1, 'combined'); near(vG - va + P.planeDv(vG, 28.5 * D) - comb, 1156, 1, 'saving');
  near(cp.pro, 1106, 1, 'PAD prograde'); near(cp.nor, -1467, 1, 'PAD normal'); near(Math.hypot(cp.pro, cp.nor), comb, 1e-6, 'PAD norm = Δv');
  // opposite node: the wrong way doubles the error
  assert.equal(P.nodeSign(-28.5 * D, 'an'), -1); assert.equal(P.nodeSign(-28.5 * D, 'dn'), 1);
  void vtp;
});

test('11.5 launch azimuth: 32.5 deg from Cape Canaveral', () => {
  const lat = 28.5 * D, inc = 32.5 * D, s = Math.cos(inc) / Math.cos(lat);
  near(s, 0.9597, 0.0001, 'sin beta (text says 0.9594)');
  near(P.azInertial(lat, inc) / D, 73.7, 0.05, 'beta');
  near(P.azRelative(lat, P.azInertial(lat, inc), v185) / D, 72.8, 0.05, 'beta rot');
  near(P.vEq, 465, 0.5, 'equatorial speed'); near(P.vEq * Math.cos(lat), 408, 1, 'ground speed at 28.5');
  // round trips
  for (const az of [20, 60, 90, 110, 160]) near(P.azFromRelative(lat, P.azRelative(lat, az * D, v185), v185) / D, az, 1e-6, 'azimuth round trip');
  // flying the inertial azimuth on the ground ends 0.4 deg low (about 50 m/s)
  const flown = P.incFromAz(lat, P.azFromRelative(lat, P.azInertial(lat, inc), v185)) / D;
  near(32.5 - flown, 0.4, 0.05, 'inclination error'); near(P.planeDv(v185, (32.5 - flown) * D), 50, 3, 'plane change to fix it');
  // minimum inclination is the latitude; due east gives it; no solution below it
  near(P.incFromAz(lat, Math.PI / 2) / D, 28.5, 1e-9, 'due east'); assert.ok(Number.isNaN(P.azInertial(lat, 20 * D)));
  // launch windows: 4.2 h apart, next pair about 19.7 h later (text says 19.8)
  const c = P.crossings(lat, inc), gap = (c.south.dl - c.north.dl) / wE / 3600;
  near(gap, 4.2, 0.05, 'windows apart'); near(2 * Math.PI / wE / 3600 - gap, 19.7, 0.05, 'next pair after (text says 19.8)');
  // the site really sits in the plane: launching at the northbound crossing with the right azimuth gives i
  const L = P.launch(lat, c.north.dl, P.azRelative(lat, P.azInertial(lat, inc), v185), v185, 185e3);
  near(L.el.i / D, 32.5, 1e-6, 'launch inclination'); near(L.el.O, 0, 1e-6, 'node at the reference'); assert.ok(L.el.e < 1e-6);
});

test('physics: elements <-> state vectors, propagation, node timing', () => {
  const el = { a: 9e6, e: 0.2, i: 0.7, O: 1.1, w: 2.0, nu: 0.9 }, s = P.rv(el), b = P.elements(s.r, s.v);
  for (const k of ['a', 'e', 'i', 'O', 'w', 'nu']) near(b[k], el[k], 1e-6 * Math.max(1, Math.abs(el[k])), k);
  const T = b.T, s2 = P.propagate(s, T);
  near(P.vec.norm(P.vec.sub(s2.r, s.r)), 0, 1e-3, 'one period returns'); 
  const h = P.vec.unit(P.vec.cross(s.r, s.v)), n = P.normalOf(el.i, el.O);
  near(P.planeAngle(h, n), 0, 1e-9, 'normalOf');
  assert.ok(Math.abs(P.timeTo(s, 'an') - P.timeToU(s, 0)) < 1e-6);
  const tn = P.timeTo(s, 'an'), sn = P.propagate(s, tn);
  near(sn.r[2], 0, 1e-3, 'at the node z = 0'); assert.ok(sn.v[2] > 0, 'going north');
  const td = P.timeTo(s, 'dn'); near(P.propagate(s, td).r[2], 0, 1e-3, 'descending node'); assert.ok(P.propagate(s, td).v[2] < 0);
  assert.equal(P.timeTo(P.rv({ a: 7e6, e: 0, i: 0.5, O: 0, w: 0, nu: 1 }), 'apo'), null);
  assert.equal(P.timeTo(P.rv({ a: 7e6, e: 0.1, i: 0, O: 0, w: 0, nu: 1 }), 'an'), null);
});

test('lab scenarios: Mission Control burns do what the text says', () => {
  for (const [k, sc] of Object.entries(SCEN)) {
    if (sc.kind !== 'pc') continue;
    const s0 = P.rv(sc.el), el = P.elements(s0.r, s0.v), dI = Math.abs(sc.el.i - sc.target.i), down = sc.el.i > sc.target.i;
    let burn, opt;
    if (sc.combined) {
      const va = P.visViva(el.ra, el.a), vg = P.circV(sc.target.a);
      burn = [{ when: 'apo', ...P.pad(va, vg, dI, down ? -1 : 1) }]; opt = P.combinedDv(va, vg, dI);
    } else { const v = P.circV(el.a); burn = [{ when: 'an', ...P.pad(v, v, dI, down ? -1 : 1) }]; opt = P.planeDv(v, dI); }
    const r = P.execute(s0, burn);
    const err = P.planeAngle(r.final.hv, P.normalOf(sc.target.i, sc.target.O)) / D;
    assert.ok(err < 0.01, `${k}: plane error ${err}`);
    near(r.dvTotal, opt, 1e-6 * opt, `${k} cost`);
    if (sc.combined) { assert.ok(r.final.i / D < 0.01 && r.final.e < 0.001 && Math.abs(r.final.a - sc.target.a) < 5e3, 'GEO reached'); assert.ok(el.e > 0.7); }
    else assert.ok(Math.abs(r.final.a - el.a) / el.a < 1e-6, 'shape unchanged');
    // burning the wrong way at the node doubles the error
    const wrong = P.execute(s0, [{ ...burn[0], nor: -burn[0].nor }]);
    assert.ok(P.planeAngle(wrong.final.hv, P.normalOf(sc.target.i, sc.target.O)) > 1.9 * dI, `${k}: wrong way`);
  }
  // the combined scenario: the apoapsis is on the line of nodes (the text's condition)
  const sc = SCEN.combined, s0 = P.rv(sc.el), e = P.elements(s0.r, s0.v);
  near(((e.w + Math.PI) % (2 * Math.PI)), 0, 1e-9, 'apoapsis at the ascending node (u = 360)') ;
  // a burn at the wrong place cannot reach the plane: objective 'plane' needs a node
  const trim = SCEN.trim, t0 = P.rv(trim.el), v = P.circV(trim.el.a), pd = P.pad(v, v, 0.6 * D, -1);
  const off = P.execute(t0, [{ when: 'in', minutes: 10, ...pd }]);
  assert.ok(P.planeAngle(off.final.hv, P.normalOf(trim.target.i, trim.target.O)) / D > 0.1, 'a burn away from the node misses');
  // launch scenario
  const L = SCEN.launch, st = L.site, cr = P.crossings(st.lat, st.i);
  assert.ok(cr && cr.north.dl > 0 && cr.south.dl > cr.north.dl);
});

test('edge cases: no NaN for tiny and huge changes, equatorial and polar', () => {
  for (const di of [0, 1e-9, 0.1 * D, Math.PI / 2, Math.PI]) for (const v of [1, 3075, 7800]) assert.ok(Number.isFinite(P.planeDv(v, di)));
  assert.equal(P.planeDv(7800, 0), 0);
  assert.ok(Number.isFinite(P.incFromAz(0, Math.PI / 2)) && Number.isFinite(P.incFromAz(Math.PI / 2, 0)));
  assert.equal(P.crossings(80 * D, 30 * D), null);
  const polar = P.execute(P.rv({ a: 7e6, e: 0, i: Math.PI / 2, O: 0.3, w: 0, nu: 1 }), [{ when: 'an', pro: 0, nor: 100, rad: 0 }]);
  assert.ok(Number.isFinite(polar.dvTotal) && Number.isFinite(polar.final.i));
});

test('figure of the azimuth has no NaN', () => { assert.ok(!/NaN|undefined|Infinity/.test(figAzimuth())); });

test('practice: generators and concept questions', () => { checkGenerators(practice, 100); checkQuiz(practice); });

test('an escape burn stops the plan with an error instead of NaN; a normal-only burn fails the component check of trim', () => {
  const s0 = P.rv({ a: 6.8e6, e: 0, i: 30 * D, O: 0.2, w: 0, nu: 0.5 });
  const r = P.execute(s0, [{ when: 'in', minutes: 0, pro: 3500, nor: 0, rad: 0 }, { when: 'an', pro: 10, nor: 0, rad: 0 }]);
  assert.equal(r.burns.length, 1); assert.equal(r.burns[0].error, 'open');
  assert.ok(r.burns.every((b) => Number.isFinite(b.dv)));
  // trim (0.6°): the exact PAD has a prograde part of −0.43 m/s, so a burn of 0 prograde misses it by more than 0.1 m/s,
  // although its plane comes within 0.1° (why the lab checks the components, not only the plane)
  const t = SCEN.trim, v = P.circV(t.el.a), pd = P.pad(v, v, Math.abs(t.el.i - t.target.i), 1);
  assert.ok(Math.abs(pd.pro) > 0.1 + 0.03 * Math.abs(pd.pro), String(pd.pro));
  const st = P.rv(t.el), normalOnly = P.execute(st, [{ when: 'an', pro: 0, nor: -Math.abs(pd.nor), rad: 0 }]);
  const err = P.planeAngle(normalOnly.final.hv, P.normalOf(t.target.i, t.target.O)) / D;
  assert.ok(err < 0.1, `normal-only plane error ${err}`);
  const src = require('fs').readFileSync(require('path').join(__dirname, '../js/ch/planes.js'), 'utf8');
  assert.ok(/isPure && padOk\) Progress\.done\('planes', 'plane'\)/.test(src));
});
