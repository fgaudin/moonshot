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

test('text numbers of section 10.5: worked example, roll steering, sensitivity', () => {
  const { workedExample, ER } = loadChapter('entry', ['workedExample', 'ER']);
  const Phys = require('../js/physics.js'), W = workedExample();
  // 200 km, 120 m/s: entry angle in the corridor, the vacuum arc and the hand method of the text
  assert.ok(W.g.gammaDeg < -1 && W.g.gammaDeg > -2.5 && W.g.hp < 0);
  assert.equal(W.g.angDeg.toFixed(2), '51.73');
  assert.equal(W.L.total.toFixed(2), '82.75');
  // "with lift up the same entry flies 35.9°, lift sideways 24.0° at 9 g"
  const run = (bank) => Phys.simulateEntry({ v0: W.g.vEI, gamma0: W.g.gammaDeg, bank, ld: 0.3 });
  assert.equal((run(0).range / ER.RE * ER.DEG).toFixed(1), '35.9');
  const side = run(90);
  assert.equal((side.range / ER.RE * ER.DEG).toFixed(1), '24.0');
  assert.equal(Math.round(side.maxG), 9);
  // "five seconds late is 35 km"
  assert.equal(Math.round(W.late * 5), 35);
  // late burn: the ground speed of the capsule is a little under the 7.78 km/s orbital speed
  assert.ok(W.late + ER.wE * ER.RE / 1000 < Math.sqrt(C_muE() / (ER.RE + 200e3)) / 1e3 * 1.0001);
  // sign of the sensitivities: more Δv, lower perigee, steeper entry, shorter landing
  assert.ok(W.sens.hpPerMs < 0 && W.sens.gPerMs < 0 && W.sens.totKm < 0);
  function C_muE() { return Phys.C.muE; }
});

test('lab: no NaN and always terminates over the slider ranges', () => {
  const Phys = require('../js/physics.js');
  for (let v = 7; v <= 12; v += 1) for (let g = -10; g <= -3; g += 1.75) for (const b of [0, 90, 180]) for (const ld of [0, 0.3, 0.5]) {
    const s = Phys.simulateEntry({ v0: v * 1e3, gamma0: g, bank: b, ld });
    assert.ok(Number.isFinite(s.maxG) && Number.isFinite(s.range) && s.t < 2999, `${v} ${g} ${b} ${ld}`);
  }
});

test('lab objectives are reachable: a skip and a <8 g capture at lunar-return speed', () => {
  const Phys = require('../js/physics.js');
  const skip = Phys.simulateEntry({ v0: 11030, gamma0: -5, bank: 90, ld: 0.3 });
  assert.equal(skip.outcome, 'skip');
  const ok = Phys.simulateEntry({ v0: 11030, gamma0: -5.85, bank: 80, ld: 0.3 });
  assert.ok(ok.outcome === 'landed' && ok.maxG < 8);
  // the Apollo 11 preset itself is not enough for the objective (8.3 g)
  assert.ok(Phys.simulateEntry({ v0: 11030, gamma0: -6.5, bank: 45, ld: 0.3 }).maxG > 8);
});

test('entry practice generators and quiz are sound', () => {
  const { checkGenerators } = require('./helpers/practice.js');
  const { practice } = loadChapter('entry', []);
  checkGenerators(practice, 40);
});

test('figure 18.2 geometry has no NaN', () => {
  const { AE } = loadChapter('entry', ['AE']);
  for (const b of [AE.capsule, AE.slim]) for (let h = 0; h <= 80e3; h += 5e3) {
    const r = AE.at(b, h); assert.ok(Number.isFinite(r.v) && Number.isFinite(r.a) && r.v > 0);
  }
});

test('10.4 corridor text: one fixed bank cannot use the whole corridor; the lab Apollo 11 entry is near 8 g', () => {
  const run = (g, b) => Phys.simulateEntry({ v0: 11030, gamma0: g, bank: b, ld: 0.3 });
  const safe = (r) => r.outcome !== 'skip' && r.maxG <= 10;
  // edges by opposite rolls: lift down captures at −5.3°, lift up stays under 10 g at −7.0°
  assert.notEqual(run(-5.3, 180).outcome, 'skip'); assert.ok(run(-7.0, 0).maxG <= 10 || run(-7.0, 0).outcome === 'skip');
  // with one bank held throughout, the safe band is about −5.5° to −6.75°
  const banks = []; for (let b = 0; b <= 180; b += 15) banks.push(b);
  const anySafe = (g) => banks.some((b) => safe(run(g, b)));
  assert.ok(anySafe(-5.5) && anySafe(-6.75), 'inside the band');
  assert.ok(!anySafe(-5.25) && !anySafe(-7.0), 'outside the band');
  const a = run(-6.5, 45); assert.ok(a.maxG > 7.5 && a.maxG < 8.8, String(a.maxG));
  // the "Too shallow" preset is gone (finding the skip boundary is the candidate's job)
  const src = require('fs').readFileSync(require('path').join(__dirname, '../js/ch/entry.js'), 'utf8');
  assert.ok(!/data-p="shallow"/.test(src) && !/shallow: \{ 'en-v'/.test(src));
});
