const test = require('node:test');
const assert = require('node:assert');
const Ph = require('../js/ch/homeward.phys.js');

test('17.3 burn position: numbers quoted in the text and the figure', () => {
  const h = Ph.handMinEnergy(110e3, 40e3);
  assert.ok(Math.abs(h.e - 1.262) < 0.001, `e = ${h.e}`);
  assert.ok(Math.abs(h.thInf * 180 / Math.PI - 142.4) < 0.1, `θ∞ = ${h.thInf * 180 / Math.PI}`);
  assert.ok(Math.abs(h.phi - 52.4) < 0.1, `φ = ${h.phi}`);
  // figBurn: asymptote φ − θ∞ from the far-side midpoint, i.e. straight against the Moon's motion
  assert.ok(Math.abs(h.phi - h.thInf * 180 / Math.PI + 90) < 1e-9);
});

test('nominal lab scenario: the text example (110 km) cannot be copied for the Δv objective', () => {
  const lab = Ph.handMinEnergy(60e3, 40e3), text = Ph.handMinEnergy(110e3, 40e3);
  assert.ok(Math.abs(lab.dv - text.dv) > 3 + 3, `lab ${lab.dv} vs text ${text.dv}`);   // tolerance 3 m/s, with margin
  // rounded constants (R☾ = 1 737 km, μ☾ = 4 903 km³/s²) stay inside the tolerance
  const r = 1737e3 + 60e3, mu = 4903e9, vc = Math.sqrt(mu / r), vh = Math.sqrt(lab.vinf ** 2 + 2 * mu / r);
  assert.ok(Math.abs(vh - vc - lab.dv) < 1);
  // the hand Δv, with a burn position found in the lab, reaches the corridor
  const dv = Math.round(lab.dv), phi = Ph.solvePhi({ alt: 60e3, dv })[0];
  assert.equal(Ph.fly({ alt: 60e3, dv, phi, rev: 1, dvErr: 0 }).outcome, 'corridor');
});

test('entry view: corridor edges and path profile', () => {
  // perigees quoted in 17.1 and 17.5: about 65 km (shallow, −5.3°) and 12 km (steep, −7.4°)
  assert.ok(Math.abs(Ph.perigeeForGamma(Ph.CORRIDOR.shallow) / 1e3 - 65) < 1.5);
  assert.ok(Math.abs(Ph.perigeeForGamma(Ph.CORRIDOR.steep) / 1e3 - 12) < 1.5);
  // every entering path crosses 122 km at x = 0 and bottoms out at its vacuum perigee
  const pts = Ph.entryProfile(Ph.returnConic(40e3), -2000e3, 2500e3, 0, 900);
  const at0 = pts.reduce((b, q) => (Math.abs(q[0]) < Math.abs(b[0]) ? q : b));
  assert.ok(Math.abs(at0[1] - (Ph.REI - Ph.RE)) < 1e3);
  assert.ok(Math.abs(Math.min(...pts.map((q) => q[1])) - 40e3) < 500);
  // a path that stays above the atmosphere is lined up on the given perigee position
  const hi = Ph.entryProfile(Ph.returnConic(240e3), -2000e3, 2500e3, 1500e3, 900);
  const low = hi.reduce((b, q) => (q[1] < b[1] ? q : b));
  assert.ok(Math.abs(low[0] - 1500e3) < 10e3 && Math.abs(low[1] - 240e3) < 500);
});
