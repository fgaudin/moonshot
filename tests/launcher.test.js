const test = require('node:test');
const assert = require('node:assert');
const Pl = require('../js/ch/launcher.phys.js');
const { loadChapter, Phys } = require('./helpers/chapter.js');
const { checkGenerators, checkQuiz } = require('./helpers/practice.js');
const { PRESETS, figExpansion, practice } = loadChapter('launcher', ['PRESETS', 'figExpansion'], { Phys_launcher: Pl });
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b}`);
const g0 = 9.80665, RE = Phys.C.RE;
const veh = (p) => ({ payload: p.payload, diameter: p.diameter, cd: p.cd, stages: p.stages });
const fly = (p, rows, o = {}) => Pl.simulate(veh(p), { kickTime: p.kt, kickAngle: p.ka, rows: rows || p.rows.map(([t, pitch]) => ({ t, pitch })), targetAlt: 200e3, ...o }, { dt: 0.5 });

test('7.1-7.2 F-1 numbers: thrust and Isp at 10 km, gain of 15 %', () => {
  const f1 = { fVac: 7.77e6, ispSL: 263, ispVac: 304 };
  near(Pl.fSL(f1) / 1e6, 6.72, 0.01);                      // 7.77 x 263/304: the quoted 6.77 MN within 1 %
  const pr = Math.exp(-10 / 7.5);
  near(pr, 0.26, 0.005);
  near(Pl.thrustAt(f1, 101325 * pr) / 1e6, 7.51, 0.06);
  near(Pl.ispAt(263, 304, 101325 * pr), 293, 0.5);
  near(Math.exp(-30 / 7.5), 0.018, 0.0005);
  // limits: sea level and vacuum
  near(Pl.thrustAt(f1, 101325), Pl.fSL(f1), 1e-6); near(Pl.thrustAt(f1, 0), f1.fVac, 1e-6);
  near(Pl.ispAt(263, 304, 0), 304, 1e-9); near(Pl.ispAt(263, 304, 101325), 263, 1e-9);
  // F = mdot * g0 * Isp(p) at every pressure
  for (const p of [0, 20e3, 60e3, 101325]) near(Pl.thrustAt(f1, p), Pl.mdot(f1) * g0 * Pl.ispAt(263, 304, p), 1);
});

test('7.4 circular speed at 200 km', () => near(Math.sqrt(Phys.C.muE / (RE + 200e3)) / 1e3, 7.78, 0.005));

test('presets: design numbers quoted in the text', () => {
  const s = Pl.summary(veh(PRESETS.sat));
  near(s.stages[0].twr0, 1.31, 0.005); near(s.stages[0].twrF, 5.3, 0.06);
  near(s.stages[1].twr0, 0.99, 0.005); near(s.stages[1].twrF, 5.9, 0.05);
  near(PRESETS.small.stages.reduce((a, x) => a + x.prop + x.dry, PRESETS.small.payload) / 1e3, 13.25, 0.01);
  // the second stage alone could never leave the pad
  assert.ok(PRESETS.sat.stages[1].fVac / (Pl.summary(veh(PRESETS.sat)).m0 * g0) < 1.2 / 2);
});

test('lab: the draft tables do not reach orbit, the linear tangent solution does', () => {
  for (const k of ['sat', 'small']) {
    const p = PRESETS[k], draft = fly(p);
    assert.equal(draft.outcome, 'suborbital', k + ' draft');
    assert.ok(draft.gamma > 0, k + ': still climbing at cutoff');       // hint text says "pitch over more"
    const best = Pl.solve(veh(p), { kickTime: p.kt, kickAngle: p.ka, targetAlt: 200e3 });
    const r = fly(p, best.rows);
    assert.equal(r.outcome, 'orbit', k + ' solved');
    assert.ok(r.perigee > 150e3, `${k}: perigee ${r.perigee}`);
    // cutoff on the energy of a 200 km circular orbit: semi-major axis 6578 km
    near(r.el.a, RE + 200e3, 2e3, k + ' semi-major axis');
    // the ledger adds up: ideal Δv ≈ final speed + gravity + drag + steering (non-rotating Earth, from rest)
    const L = r.losses;
    assert.ok(r.dvIdeal > r.v && r.dvIdeal - (L.gravity + L.drag + L.steering) > 0.9 * r.v, `${k} ledger`);
    assert.ok(r.propLeft >= 0);
  }
  // text: small launcher has little propellant to spare; sat preset reaches orbit with a margin
  const p = PRESETS.small;
  assert.ok(fly(p, Pl.solve(veh(p), { kickTime: p.kt, kickAngle: p.ka, targetAlt: 200e3 }).rows).propLeft < 500);
});

test('lab edge cases: pad, crash, empty table, extreme sliders', () => {
  const p = PRESETS.sat;
  const heavy = { ...veh(p), payload: 200e3 };
  assert.equal(Pl.simulate(heavy, { kickTime: 10, kickAngle: 1, rows: [{ t: 100, pitch: 80 }], targetAlt: 200e3 }).outcome, 'pad');
  assert.equal(fly(p, [], {}).outcome === 'orbit', false);                 // no table: no crash of the code
  assert.equal(fly(p, undefined, { kickAngle: 3, kickTime: 4 }).outcome === 'orbit', false);
  for (const o of [{ kickAngle: 0.2, kickTime: 30 }, { kickAngle: 3, kickTime: 4 }]) {
    const r = fly(p, null, o);
    assert.ok(Number.isFinite(r.perigee) && Number.isFinite(r.t) && r.trace.length > 2);
  }
  // pitch table interpolation and ordering
  const rows = [{ t: 100, pitch: 60 }, { t: 200, pitch: 80 }];
  near(Pl.pitchAt(rows, 130), 66, 1e-9); near(Pl.pitchAt(rows, 0), 60, 1e-9); near(Pl.pitchAt(rows, 999), 80, 1e-9);
  assert.equal(Pl.pitchAt([], 5), null);
  assert.deepEqual(Pl.sortRows([{ t: 5, pitch: 1 }, { t: NaN, pitch: 2 }, { t: 1, pitch: 3 }]).map((r) => r.t), [1, 5]);
});

test('lab objectives are reachable: a custom design with payload ≥ 2.5 %, Δv ≥ 9.5 km/s, TWR > 1.2, orbit, max q < 25 kPa', () => {
  const p = PRESETS.sat, st = JSON.parse(JSON.stringify(p.stages));
  st[1].ispVac = 440; st[1].ispSL = 300;
  const v = { payload: p.payload * 2, diameter: p.diameter, cd: p.cd, stages: st };
  const s = Pl.summary(v);
  assert.ok(s.twr0 > 1.2 && s.dvVac >= 9500 && v.payload / s.m0 >= 0.025, `${s.twr0} ${s.dvVac}`);
  const best = Pl.solve(v, { kickTime: 16, kickAngle: 2.6, targetAlt: 200e3 });
  const r = Pl.simulate(v, { kickTime: 16, kickAngle: 2.6, rows: best.rows, targetAlt: 200e3 }, { dt: 0.5 });
  assert.equal(r.outcome, 'orbit'); assert.ok(r.maxQ.q < 25e3, 'max q ' + r.maxQ.q);
});

test('expansion figure has no NaN; practice generators and quiz', () => {
  assert.ok(!/NaN|undefined/.test(figExpansion()));
  checkGenerators(practice); checkQuiz(practice);
  const twr = practice.gens.find((x) => /thrust-to-weight/.test(x.title));
  for (let i = 0; i < 100; i++) { const q = twr.make(); assert.ok(q.answer > 1.0 && q.answer < 1.6, 'TWR ' + q.answer); }
  const burn = practice.gens.find((x) => /burnout/.test(x.title));
  for (let i = 0; i < 100; i++) { const q = burn.make(); assert.ok(q.answer > 1 && q.answer < 12, 'burnout g ' + q.answer); }
});
