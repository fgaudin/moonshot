// js/physics.js: pure functions, loaded directly.
const test = require('node:test'), assert = require('node:assert/strict');
const Phys = require('../js/physics.js');
const { fly, km } = require('./helpers/lab.js');

test('Kepler: mean anomaly → eccentric anomaly round-trips', () => {
  for (const e of [0, 0.1, 0.5, 0.9]) for (const M of [0.1, 1, 2.5, 3.1]) {
    const E = Phys.solveKepler(M, e);
    assert.ok(Math.abs(E - e * Math.sin(E) - M) < 1e-10, `e=${e} M=${M}`);
  }
});

test('patched conics: the return perigee varies smoothly with the MCC (SOI crossing found exactly)', () => {
  // Before the bisection fix, a 5 mm/s MCC change made the perigee jump by ~35 km (step overshoot at the SOI).
  let prev = null, worst = 0;
  for (let m = 0.40; m <= 0.6001; m += 0.005) {
    const r = km(fly({ dv: 3160, ang: -132.303, mcc: m }).retAlt);
    if (prev !== null) worst = Math.max(worst, Math.abs(r - prev));
    prev = r;
  }
  assert.ok(worst < 12, `largest perigee step ${worst.toFixed(1)} km for 5 mm/s`);
});

test('patched conics: periselene varies smoothly with the TLI angle', () => {
  let prev = null, worst = 0;
  for (let a = -132.40; a <= -132.10; a += 0.002) {
    const p = km(fly({ dv: 3160, ang: a }).minM.alt);
    if (prev !== null) worst = Math.max(worst, Math.abs(p - prev));
    prev = p;
  }
  assert.ok(worst < 20, `largest periselene step ${worst.toFixed(1)} km for 0.002°`);
});

test('solveMCC returns a burn within its range, rounded result lands near the target', () => {
  const opts = { dv: 3160, burnAngle: -132.303, mcc: { t: 26.7 * 3600, dv: 0 } };
  const dv = Phys.solveMCC(opts, 40000, 1, Phys.simulatePatched);
  assert.ok(Number.isFinite(dv) && Math.abs(dv) <= 1, `dv = ${dv}`);
  const s = Phys.simulatePatched({ ...opts, mcc: { t: opts.mcc.t, dv } });
  assert.ok(Math.abs(km(s.retAlt) - 40) < 5, `perigee ${km(s.retAlt).toFixed(1)} km`);
});

test('lunarLOS: loss of signal behind the Moon in a 110 km orbit', () => {
  const Phys = require('../js/physics.js');
  const l = Phys.lunarLOS(110e3);
  assert.equal(Math.round(l.P / 60), 119);        // orbital period, minutes
  assert.equal(Math.round(l.arcDeg), 140);        // arc hidden behind the Moon
  assert.equal(Math.round(l.t / 60), 46);         // minutes out of contact per orbit
  assert.ok(Phys.lunarLOS(15e3).frac > l.frac);   // lower orbit: hidden a larger share of the time
});

test('lunarLOS: the hand formula of TM-19 (sin θ = R/r, t = 2θ/360° × T)', () => {
  const Phys = require('../js/physics.js');
  for (const alt of [15e3, 110e3, 300e3]) {
    const r = Phys.C.RM + alt, th = Math.asin(Phys.C.RM / r), T = 2 * Math.PI * Math.sqrt(r ** 3 / Phys.C.muM);
    assert.ok(Math.abs(Phys.lunarLOS(alt).t - 2 * th / (2 * Math.PI) * T) < 1e-6);
  }
});

// ---- review additions (g7) ----
const near7 = (a, b, tol, m = '') => assert.ok(Math.abs(a - b) <= tol, `${m} ${a} vs ${b}`);
const { C } = Phys;

test('constants match the reference values', () => {
  near7(C.muE, 3.986004418e14, 1e6); near7(C.RE, 6378137, 0.1); near7(C.muM, 4.9028e12, 1e8);
  near7(C.RM, 1737400, 1); near7(C.DEM, 3.844e8, 1); near7(C.omegaE * C.RE, 465.10, 0.01);
  near7(C.g0, 9.80665, 1e-9); near7(C.entryInterface, 400000 * 0.3048, 0.5);
  near7(Phys.R_SOI / 1e3, 66183, 5);                       // Moon SOI
  near7(2 * Math.PI / Phys.EM.w / 86400, 27.28, 0.01);     // circular Earth–Moon period
});

test('elementsFromRV: circular, escape, hyperbolic, apoapsis', () => {
  const r = C.RE + 185e3, vc = Math.sqrt(C.muE / r);
  const c = Phys.elementsFromRV(r, vc, 0, C.muE);
  near7(c.e, 0, 1e-9); near7(c.T, 5291.49, 0.01); near7(c.a, r, 1e-3);
  const x = Phys.elementsFromRV(r, Math.SQRT2 * vc, 0, C.muE);
  near7(x.e, 1, 1e-9); assert.equal(x.a, Infinity); assert.equal(x.T, Infinity); assert.equal(x.ra, Infinity);
  const h = Phys.elementsFromRV(r, 12000, 0.1, C.muE);
  assert.ok(h.e > 1 && h.a < 0 && h.eps > 0 && h.T === Infinity);
  near7(h.eps, 12000 ** 2 / 2 - C.muE / r, 1e-3);
  const ap = Phys.elementsFromRV(4.2e7, 3000, 0, C.muE);      // apoapsis: ν = π
  near7(ap.nu, Math.PI, 1e-9);
  const down = Phys.elementsFromRV(4.2e7, 3500, -0.1, C.muE);  // descending: ν negative
  assert.ok(down.nu < 0 || down.nu > -Math.PI);
});

test('solveKepler: high eccentricity, negative and large M', () => {
  for (const [M, e] of [[1e-9, 0.99], [3.14159, 0.999], [-1, 0.5], [7, 0.3], [0.5, 0], [1, 0.9999]]) {
    const E = Phys.solveKepler(M, e), Mn = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    assert.ok(Number.isFinite(E)); near7(E - e * Math.sin(E), Mn, 1e-9, `M=${M} e=${e}`);
  }
  // ν ↔ E round trip and time since periapsis at apoapsis is half a period
  const e = 0.4, a = 1e7, T = 2 * Math.PI * Math.sqrt(a ** 3 / C.muE);
  near7(Phys.trueFromEcc(Phys.eccFromTrue(1.1, e), e), 1.1, 1e-12);
  near7(Phys.timeSincePeriapsis(Math.PI, e, a, C.muE), T / 2, 1e-6);
});

test('rk4 integrates y\'=y to 4th order and conserves a circular orbit', () => {
  let y = [1]; for (let i = 0; i < 10; i++) y = Phys.rk4((t, s) => [s[0]], i * 0.1, y, 0.1);
  near7(y[0], Math.E, 1e-5);
  const r = 7e6, v = Math.sqrt(C.muE / r); let s = [r, 0, 0, v];
  const f = (t, q) => { const r3 = Math.hypot(q[0], q[1]) ** 3; return [q[2], q[3], -C.muE * q[0] / r3, -C.muE * q[1] / r3]; };
  for (let i = 0; i < 580; i++) s = Phys.rk4(f, 0, s, 10);
  near7(Math.hypot(s[0], s[1]), r, 50);
});

test('rocket equation and staging', () => {
  near7(Phys.rocket.dv(300, 100, 50), 300 * C.g0 * Math.LN2, 1e-9);
  near7(Phys.rocket.massRatio(Phys.rocket.dv(300, 100, 50), 300), 2, 1e-9);
  const st = Phys.rocket.staging([{ prop: 80, dry: 10, isp: 300 }, { prop: 8, dry: 1, isp: 400 }], 1);
  assert.equal(st[0].m0, 100); assert.equal(st[0].mf, 20); assert.equal(st[1].m0, 10); assert.equal(st[1].mf, 2);
  near7(Phys.burnTime(1000, 30000, 1e6, 421), 26.64, 0.01);
});

test('Orbit2D: elems/stateAt round trip, timeBetween, circular orbit', () => {
  const O = Phys.Orbit2D;
  const s = [1e7 * Math.cos(0.7), 1e7 * Math.sin(0.7), -4000 * Math.sin(0.7) + 500 * Math.cos(0.7), 4000 * Math.cos(0.7) + 500 * Math.sin(0.7)];
  const e = O.elems(s, C.muE), s2 = O.stateAt(e, e.nu, C.muE);
  s.forEach((x, i) => near7(x, s2[i], 1e-3 * (i < 2 ? 1 : 1e-3)));
  near7(O.timeBetween(e, 0, Math.PI, C.muE) / e.T, 0.5, 1e-9);
  const c = O.elems([7e6, 0, 0, Math.sqrt(C.muE / 7e6)], C.muE); near7(c.e, 0, 1e-9);
});

test('executeBurns: finite Hohmann LEO to GEO ends near GEO and burn times follow the rocket equation', () => {
  const r = C.RE + 300e3, v = Math.sqrt(C.muE / r), ra = C.RE + 35786e3, at = (r + ra) / 2;
  const vt1 = Math.sqrt(C.muE * (2 / r - 1 / at)), vt2 = Math.sqrt(C.muE * (2 / ra - 1 / at)), vc2 = Math.sqrt(C.muE / ra);
  const res = Phys.executeBurns({ s0: [r, 0, 0, v], mu: C.muE, m0: 30000, F: 1e6, isp: 421, burns: [{ when: 'in', minutes: 0, pro: vt1 - v, rad: 0 }, { when: 'apo', pro: vc2 - vt2, rad: 0 }] });
  assert.ok(res.final.e < 0.01, 'e ' + res.final.e); assert.ok(Math.abs(res.final.a - ra) < 300e3);
  near7(res.burns[0].tb, Phys.burnTime(vt1 - v, 30000, 1e6, 421), 1e-6);
  assert.equal(Phys.executeBurns({ s0: [r, 0, 0, v], m0: 3e4, F: 1e5, isp: 300, burns: [{ when: 'peri', pro: 0, rad: 0 }] }).burns.length, 0);
});

test('simulateAscent: defaults are the nominal flight (they used to crash); the Δv ledger closes', () => {
  const s = Phys.simulateAscent({});
  assert.equal(s.outcome, 'orbit');
  // inertial speed gained = ideal − gravity − drag − steering (+ the speed Earth's rotation gave at liftoff)
  const l = s.losses, vEnd = s.dvIdeal - l.gravity - l.drag - l.steering + s.rotV;
  near7(vEnd, s.v, 60, 'ledger');
  near7(s.perigee / 1e3, 185, 40);
});

test('simulateEntry: corridor, load factor, finite results; Sutton–Graves heating scale', () => {
  assert.equal(Phys.simulateEntry({ gamma0: -4.5 }).outcome, 'skip');
  const ok = Phys.simulateEntry({ gamma0: -6.5 });
  assert.equal(ok.outcome, 'landed'); assert.ok(ok.maxG > 4 && ok.maxG < 12 && ok.range > 2000e3 && ok.range < 5000e3, `${ok.maxG} ${ok.range}`);
  assert.ok(Phys.simulateEntry({ gamma0: -9 }).maxG > ok.maxG);
  for (const k of ['maxG', 'maxQdot', 'heatLoad', 't']) assert.ok(Number.isFinite(ok[k]));
});

test('lunarLOS: 110 km orbit is hidden about 46 min of a 119 min orbit', () => {
  const l = Phys.lunarLOS(110e3);
  near7(l.P / 60, 118.75, 0.1); near7(l.arcDeg, 140.26, 0.05); near7(l.t / 60, 46.3, 0.1);
});

test('TLI and patched models: no-burn and NaN inputs terminate without throwing', () => {
  assert.equal(Phys.simulateTLI({ dv: 2000, burnAngle: 0 }).outcome, 'coast');
  assert.equal(Phys.simulateTLI({ dv: 3160, burnAngle: -132.1784 }).outcome, 'entry');   // hero animation of the home page
  const n = Phys.simulatePatched({ dv: NaN, burnAngle: 0 }); assert.ok(n.pts.length >= 1);
  const p = Phys.simulatePatched({ dv: 3160, burnAngle: -132.303 });
  assert.ok(p.conic.soiIn && p.conic.soiIn.vinf > 800 && p.conic.soiIn.vinf < 1300);
});

test('shared entry corridor: perigee altitudes match the flight-path angles; apsis burns do not wait a full orbit', () => {
  const H = require('../js/ch/homeward.phys.js'), K = Phys.C.corridor;
  assert.ok(Math.abs(H.perigeeForGamma(K.steep) - K.periLow) < 1000, String(H.perigeeForGamma(K.steep)));
  assert.ok(Math.abs(H.perigeeForGamma(K.shallow) - K.periHigh) < 1000, String(H.perigeeForGamma(K.shallow)));
  assert.equal(H.CORRIDOR, K);
  const O = Phys.Orbit2D, mu = Phys.C.muE;
  for (let i = 0; i < 400; i++) {
    const el = O.elems(O.stateAt({ p: 9e6, e: 0.2 + i / 400, w: i * 0.37, h: Math.sqrt(mu * 9e6) }, i % 2 ? Math.PI : 0, mu), mu);
    if (el.e >= 1) continue;
    const dt = O.timeBetween(el, el.nu, i % 2 ? Math.PI : 0, mu);
    assert.ok(dt < 1, `case ${i}: waits ${dt} s`);
  }
});
