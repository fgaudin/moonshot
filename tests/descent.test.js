// TM-15 Planning a Powered Descent (js/ch/descent.js).
const test = require('node:test'), assert = require('node:assert/strict');
const { loadChapter } = require('./helpers/chapter.js');
const Phys_descent = require('../js/ch/descent.phys.js');
const { figDOI } = loadChapter('descent', ['figDOI'], { Phys_descent });

test('15.1 DOI figure renders without NaN', () => {
  assert.ok(!/NaN|undefined/.test(figDOI()));
});

test('15.1 numbers: DOI from 110 km to a 15 km periapsis', () => {
  const mu = 4902.8, R = 1737.4, ra = R + 110, rp = R + 15, a = (ra + rp) / 2;
  const vc = Math.sqrt(mu / ra) * 1000, va = Math.sqrt(mu * (2 / ra - 1 / a)) * 1000, vp = Math.sqrt(mu * (2 / rp - 1 / a)) * 1000;
  const coast = Math.PI * Math.sqrt(a ** 3 / mu) / 60;
  assert.ok(Math.abs(vc - va - 21.6) < 0.05, `Δv ${(vc - va).toFixed(2)} m/s, text and figure say 21.6`);
  assert.ok(Math.abs(vp - 1695) < 1, `periapsis speed ${vp.toFixed(1)}, text says 1 695`);
  assert.ok(Math.abs(coast - 57) < 1, `half orbit ${coast.toFixed(1)} min, figure says 57`);
});
