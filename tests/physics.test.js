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
