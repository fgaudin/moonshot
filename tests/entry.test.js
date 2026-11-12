const test = require('node:test');
const assert = require('node:assert');
const { loadChapter } = require('./helpers/chapter.js');
const { AE } = loadChapter('entry', ['AE']);
const g0 = 9.80665;

test('18.2 Allen–Eggers: numbers quoted in the text and the figure', () => {
  const c = AE.peak(AE.capsule), s = AE.peak(AE.slim);
  // same peak deceleration whatever the vehicle: 36 g at 11 km/s and −6.5°
  assert.ok(Math.abs(c.a - s.a) < 1e-9);
  assert.equal(Math.round(c.a / g0), 36);
  // … at different altitudes: 39 km and 20 km, in air 14 times denser
  assert.equal(Math.round(c.h / 1e3), 39);
  assert.equal(Math.round(s.h / 1e3), 20);
  assert.equal(Math.round(s.rho / c.rho), 14);
  // the closed-form peak is the maximum of the profile
  for (const [beta, p] of [[AE.capsule, c], [AE.slim, s]]) {
    assert.ok(Math.abs(AE.at(beta, p.h).a - p.a) < 1e-6 * p.a);
    assert.ok(AE.at(beta, p.h + 2000).a < p.a && AE.at(beta, p.h - 2000).a < p.a);
  }
  // speeds at 30 km quoted in the text: 2 km/s against almost 10 km/s
  assert.equal(Math.round(AE.at(AE.capsule, 30e3).v / 1e3), 2);
  assert.equal(Math.round(AE.at(AE.slim, 30e3).v / 1e3), 10);
});

test('lab presets: outcomes quoted in the text above the lab', () => {
  const Phys = require('../js/physics.js');
  const run = (v, g, b, ld) => Phys.simulateEntry({ v0: v * 1000, gamma0: g, bank: b, ld });
  assert.equal(Math.round(run(11.03, -6.5, 45, 0.3).maxG), 8);       // Apollo 11
  assert.equal(run(11.03, -5.0, 90, 0.3).outcome, 'skip');           // too shallow
  assert.equal(Math.round(run(11.03, -8.5, 0, 0.3).maxG), 19);       // too steep
  assert.equal(Math.round(run(11.03, -6.5, 0, 0).maxG), 16);         // ballistic: about twice Apollo 11
  assert.equal(Math.round(run(7.8, -1.5, 0, 0.18).maxG), 3);         // from LEO
});

test('deorbit lab: flight samples, miss distance and the hand method agree', () => {
  const { ER, flight, missKm, AIM } = loadChapter('entry', ['ER', 'flight', 'missKm', 'AIM']);
  for (const sc of Object.values(AIM.scen)) {
    const fl = flight(sc.h, 150);
    assert.ok(fl.ok && fl.landed, `150 m/s from ${sc.h / 1e3} km lands`);
    // samples run forward in time and angle, from the orbit down to the sea
    const S = fl.samples;
    for (let i = 1; i < S.length; i++) assert.ok(S[i].t >= S[i - 1].t && S[i].ang >= S[i - 1].ang - 1e-9, `sample ${i}`);
    assert.ok(Math.abs(S[0].alt - sc.h) < 1 && S[S.length - 1].alt === 0);
    assert.ok(Math.abs(S[S.length - 1].t - fl.time) < 1e-6 && Math.abs(S[S.length - 1].ang - fl.total) < 1e-6);
    // the lead angle of the hand method (step 4) puts the capsule on the ship; one degree off is about 111 km
    const L = ER.lead(fl.g, fl.cm.atmDeg, fl.cm.atmT);
    assert.ok(Math.abs(missKm(fl, L.lead)) < 0.01);
    assert.ok(Math.abs(missKm(fl, L.lead - 1) - 111.3) < 0.5);
    // the mission rule on the entry angle can be met, and the text's example (200 km, 120 m/s) is not one of the orbits
    assert.ok(fl.g.gammaDeg <= AIM.gMax && fl.g.gammaDeg >= AIM.gMin);
    assert.notEqual(sc.h, 200e3);
  }
  assert.equal(flight(400e3, 80).ok, false);   // too small a burn: no entry
});
