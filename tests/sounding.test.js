const test = require('node:test');
const assert = require('node:assert');
const Ps = require('../js/ch/sounding.phys.js');
const { loadChapter } = require('./helpers/chapter.js');
const { checkGenerators, checkQuiz } = require('./helpers/practice.js');
const { practice } = loadChapter('sounding', [], { Phys_sounding: Ps });
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b}`);

test('5.2 scale heights quoted in the text', () => {
  near(Ps.scaleHeight(288, 0.02896, 9.81) / 1e3, 8.43, 0.01);
  near(Ps.scaleHeight(216.65, 0.02896, 9.80665) / 1e3, 6.3, 0.05);
  near(Math.exp(7), 1100, 10);
  near(101325 / 9.81, 10330, 2);
});

test('5.3 the 1976 Standard Atmosphere values quoted in the text', () => {
  // the text quotes 22 632 and 5 475 Pa (geopotential 11 and 20 km) and 79.8 Pa (geometric 50 km); the lab takes geometric altitudes
  const geo = (z) => 6356766 * z / (6356766 - z);
  near(Ps.standard(0).p, 101325, 0.01);
  near(Ps.standard(geo(11000)).p, 22632, 5);
  near(Ps.standard(geo(20000)).p, 5475, 2);
  near(Ps.standard(50000).p, 79.8, 0.1);
  near(Ps.standard(0).T, 288.15, 1e-9);
  near(Ps.standard(geo(11000)).T, 216.65, 1e-6);
  for (let h = 0; h <= 200e3; h += 5e3) { const a = Ps.standard(h); assert.ok(a.p > 0 && a.T > 0 && Number.isFinite(a.rho)); }
});

test('5.4 least-squares worked example', () => {
  const f = Ps.fit([0, 10, 20], [11.5, 10.2, 9.1]);
  near(f.b, -0.12, 1e-9); near(f.a, 11.4667, 1e-3); near(f.sxx, 200, 1e-9);
  near(-1 / f.b, 8.33, 0.01); near(Math.exp(f.a), 95480, 30);
  near(f.sigma, 0.082, 0.001); near(f.sb, 0.0058, 0.0002); near(f.sb / (f.b * f.b), 0.4, 0.01);
  assert.equal(Ps.fit([1], [1]), null);
  assert.equal(Ps.fit([2, 2, 2], [1, 2, 3]), null);
});

test('5.6 drag example and ballistic coefficient from a coasting sample', () => {
  near(2 * 2500 * (26.0 - 9.8) / 90000, 0.90, 0.001);
  const s = { v: 300, a: -26.0 };
  near(Ps.betaFrom(s, 0.9, 9.8), 2500, 5);
});

test('lab: the flight, the telemetry and the fit on every world', () => {
  for (const world of Object.keys(Ps.WORLDS)) for (const motor of Object.keys(Ps.MOTORS)) {
    const day = Ps.makeDay(world, 100 + 7 * 2 + 3), fl = Ps.fly(day, motor, 1), tm = Ps.telemetry(day, fl);
    assert.ok(fl.apo.h > day.W.site, `${world}/${motor} climbs`);
    assert.ok(fl.trace.every((s) => Number.isFinite(s.h) && Number.isFinite(s.v) && Number.isFinite(s.a)), `${world}/${motor} finite`);
    assert.ok(tm.samples.every((s) => s.p >= tm.floor && Number.isFinite(s.p)));
    assert.ok(tm.samples.length <= 60 + 1);
    // coasting samples are flagged after burnout
    assert.ok(tm.samples.filter((s) => s.coast).every((s) => s.t > fl.tb));
    const tr = Ps.truth(day, tm.samples);
    if (tm.samples.length >= 3) {
      const fit = Ps.fitAtmos(tm.samples.map((s) => s.h), tm.samples.map((s) => s.p));
      assert.ok(fit.H > 0 && Number.isFinite(fit.H), `${world}/${motor} fit H`);
      if (world !== 'std') assert.ok(fit.H > 0.3 * tr.H && fit.H < 3 * tr.H, `${world}/${motor} fit H ${fit.H} truth ${tr.H}`);
    }
  }
});

test('lab: the large rocket climbs above two scale heights and fits H within 5 %', () => {
  for (const world of ['earth', 'thin', 'dense']) {
    const day = Ps.makeDay(world, 100 + 7 * 0 + 3), fl = Ps.fly(day, 'large', 1), tm = Ps.telemetry(day, fl);
    assert.ok(fl.apo.h - day.W.site > 2 * day.atm.H, `${world}: ${(fl.apo.h - day.W.site) / 1e3} km vs 2H ${2 * day.atm.H / 1e3}`);
    const fit = Ps.fitAtmos(tm.samples.map((s) => s.h), tm.samples.map((s) => s.p));
    near(fit.H / day.atm.H, 1, 0.05, world + ' H');
  }
});

test('lab: burn time scales with the load and the thrust is constant', () => {
  const day = Ps.makeDay('earth', 5);
  const a = Ps.fly(day, 'medium', 1), b = Ps.fly(day, 'medium', 0.5);
  near(a.tb, 8, 1e-9); near(b.tb, 4, 1e-9); near(a.F, b.F, 1e-6);
  assert.ok(b.apo.h < a.apo.h);
});

test('practice: generators and quiz', () => { checkGenerators(practice); checkQuiz(practice); });

test('every flight runs to the ground, even a large motor on the thin world (apogee over 2 000 km)', () => {
  for (const world of Object.keys(Ps.WORLDS)) for (const motor of Object.keys(Ps.MOTORS)) for (let seed = 1; seed <= 8; seed++) {
    const day = Ps.makeDay(world, seed), fl = Ps.fly(day, motor, 1), last = fl.trace[fl.trace.length - 1];
    assert.ok(!fl.escaped && last.h === day.W.site && fl.tEnd > fl.apo.t, `${world} ${motor} ${seed}: ends at ${last.h} m, t ${fl.tEnd}`);
    for (let i = 1; i < fl.trace.length; i++) assert.ok(fl.trace[i].t > fl.trace[i - 1].t);
  }
  const day = Ps.makeDay('thin', 1), fl = Ps.fly(day, 'large', 1);
  assert.ok(fl.apo.h > 2e6 && fl.tEnd > 3000, `${fl.apo.h} ${fl.tEnd}`);
});
