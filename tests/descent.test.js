// TM-15 Planning a Powered Descent (js/ch/descent.js, descent.phys.js).
const test = require('node:test'), assert = require('node:assert/strict');
const { loadChapter } = require('./helpers/chapter.js');
const { checkGenerators, checkQuiz } = require('./helpers/practice.js');
const Phys_descent = require('../js/ch/descent.phys.js');
const { figDOI, SCEN, DEFAULTS, BASE, practice } = loadChapter('descent', ['figDOI', 'SCEN', 'DEFAULTS', 'BASE'], { Phys_descent });
const Pd = Phys_descent;
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x}, text says ${want}`);

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
  // the physics file agrees with the hand numbers, and 1 m/s of error moves the periapsis by about 4 km
  const d = Pd.doi(110e3, 15e3);
  near(d.dv, 21.6, 0.05, 'Pd.doi Δv'); near(d.vc, 1629.1, 0.1, 'vc'); near(d.va, 1607.4, 0.1, 'va'); near(d.vp, 1695, 1, 'vp'); near(d.coast / 60, 57, 1, 'coast');
  near(Math.abs(Pd.periFromDv(110e3, d.dv + 1) - Pd.periFromDv(110e3, d.dv)) / 1e3, 4, 0.5, 'km of periapsis per m/s');
  near(Pd.periFromDv(110e3, d.dv) / 1e3, 15, 0.01, 'periFromDv inverts doi');
});

test('15.2-15.5 numbers quoted in the text', () => {
  near(Pd.C.F / 15000, 3.0, 0.01, 'a at ignition');
  // 15.2 mean-mass estimate: 6 400 kg burned, 8 600 kg at the end (5.2 m/s²), mean 11 800 kg, a ≈ 3.8 m/s², 450 s, 380 km
  const e = Pd.brakeEstimate(1695, 15000, Pd.C.F);
  near(e.mp, 6400, 50, 'propellant burned'); near(e.mf, 8600, 50, 'mass at the end'); near(Pd.C.F / e.mf, 5.2, 0.05, 'a at the end');
  near((15000 + e.mf) / 2, 11800, 50, 'mean mass'); near(e.aAvg, 3.8, 0.05, 'mean a');
  near(1695 / 3.8, 450, 5, 'hand braking time'); near(1695 ** 2 / (2 * 3.8) / 1e3, 380, 3, 'hand braking distance');
  near(e.xConst / 1e3, 380, 5, 'brakeEstimate agrees with the hand numbers');
  near((412 - 380) / 412 * 100, 8, 0.5, 'the estimate is about 8% short of the simulation');
  near(Pd.brakeAlt(100, 4.0, 1.62), 2.1e3, 50, 'vertical braking altitude');   // 2.38 m/s² net
  near(Pd.hoverTime(200, 7500), 50, 0.5, 'hover time example');
  // linear hover form is slightly pessimistic: a few percent for 300 kg
  const lin = Pd.hoverTime(300, 7500), log = Pd.hoverTimeLog(300, 7500);
  assert.ok(lin < log && (log - lin) / log < 0.03, `linear ${lin}, log ${log}`);
  near(Pd.C.c, 3050, 1, 'c = Isp g0'); near(Pd.C.gM, 1.624, 0.001, 'lunar g');
  near(Pd.propFor(15030, 2000) / 15030, 0.48, 0.01, '2 km/s burns a bit under half the mass');
  // crossrange: 4.6 m/s at the equator for an hour is about 16 km
  near(4.6 * 3600 / 1e3, 16, 1, 'Moon turns under the orbit');
});

const nominalOpts = (o = {}) => ({ hc: BASE.hc, doiDv: Pd.doi(BASE.hc, BASE.hpAim).dv, m0: 15030, prop: 8200, throttle: 1, pdiRange: 412e3, delay: 0, hHG: 2000, ...o });

test('15.7 nominal scenario: 412 km, 2.1 km/s at full throttle, then 2.2 and 2.3 for 65% and 50%', () => {
  const r = Pd.simulate(nominalOpts());
  assert.equal(r.outcome, 'landed');
  near(r.hg.dx / 1e3, 412, 1, 'braking distance'); near(Math.abs(r.td.x) / 1e3, 0, 1, 'miss at 412 km');
  near(r.dvTotal, 2100, 50, 'full throttle Δv');
  near(Pd.simulate(nominalOpts({ throttle: 0.65 })).dvTotal, 2200, 50, '65%');
  near(Pd.simulate(nominalOpts({ throttle: 0.5 })).dvTotal, 2300, 70, '50%');
  assert.ok(Math.abs(r.td.vh) < 3, 'soft touchdown');
  assert.ok(r.margin > 60, `hover margin ${r.margin}`);
  // the whole powered descent lasts about 12 minutes (text), a bit more with the final approach
  const T = (r.hg.dt + r.approachTime) / 60; assert.ok(T > 10 && T < 13, `${T} min`);
});

test('15.7 lab scenarios: defaults do not already satisfy the objectives, and each objective is reachable', () => {
  const doiT = Pd.doi(BASE.hc, BASE.hpAim).dv;
  assert.ok(Math.abs(DEFAULTS.doi - doiT) > 2, 'default DOI is outside the 2 m/s window');
  for (const [k, sc] of Object.entries(SCEN)) {
    const base = { m0: sc.m0, prop: sc.prop, delay: sc.delay, pdiRange: (sc.fixedRange ?? DEFAULTS.range) * 1e3, throttle: DEFAULTS.thr / 100, hHG: DEFAULTS.hg * 1e3 };
    const r0 = Pd.simulate(nominalOpts(base));
    if (sc.obj) assert.ok(r0.outcome !== 'landed' || Math.abs(r0.td.x) > 2000, `${k}: the default plan must not land on the site already`);
    if (!sc.obj) continue;
    // reach the site by moving the ignition point (miss is linear in the range), as a candidate would
    const fix = nominalOpts({ ...base, pdiRange: base.pdiRange + r0.td.x });
    const r = Pd.simulate(fix);
    assert.equal(r.outcome, 'landed', k); assert.ok(Math.abs(r.td.x) < 2000, `${k}: miss ${r.td.x}`);
    if (sc.obj === 'reserve') {
      assert.ok(r.margin < 60, `heavy at 2 km high gate: margin ${r.margin} must be short of 60 s (it is the point of the scenario)`);
      const g = Pd.simulate({ ...fix, hHG: 1000 }), g2 = Pd.simulate({ ...fix, hHG: 1000, pdiRange: fix.pdiRange + g.td.x });
      assert.ok(g2.margin >= 60 && Math.abs(g2.td.x) < 2000, `lower high gate buys propellant: ${g2.margin} s, miss ${g2.td.x}`);
    }
  }
  // the late scenario: ignition 8 s late moves the landing about 8 × 1.7 km downrange
  const late = Pd.simulate(nominalOpts({ delay: 8 })), on = Pd.simulate(nominalOpts());
  near((late.td.x - on.td.x) / 1e3, 13.6, 1, 'shift for 8 s late');
  // fixed ignition point of 520 km: a throttle between 65% and 100% reaches the site
  let hit = false; for (let t = 0.5; t <= 1; t += 0.001) if (Math.abs(Pd.simulate(nominalOpts({ throttle: t, pdiRange: 520e3 })).td.x) < 2000) hit = true;
  assert.ok(hit, '520 km ignition point is reachable by throttle');
});

test('simulation edge cases: no NaN, sensible outcomes', () => {
  for (const doiDv of [5, 12, 19.6, 21.6, 23.6, 30, 35]) for (const throttle of [0.5, 0.8, 1]) for (const hHG of [1000, 3000]) for (const m0 of [15030, 15800]) {
    const r = Pd.simulate(nominalOpts({ doiDv, throttle, hHG, m0 }));
    assert.ok(['landed', 'dry', 'crash', 'terrain'].includes(r.outcome), r.outcome);
    if (r.outcome !== 'terrain') for (const k of ['hp', 'vp', 'doiProp', 'dvTotal', 'margin']) assert.ok(Number.isFinite(r[k]), `${k} ${r[k]} for ${doiDv}/${throttle}`);
    for (const p of r.trace) assert.ok(Number.isFinite(p.x + p.h + p.vx + p.vh + p.m), 'trace point');
  }
  // too deep a coast: terrain; too little propellant: dry, never a negative propellant mass
  assert.equal(Pd.simulate(nominalOpts({ doiDv: 35 })).outcome, 'terrain');
  const dry = Pd.simulate(nominalOpts({ prop: 3000 }));
  assert.equal(dry.outcome, 'dry'); assert.ok(dry.td.prop >= 0 && dry.margin === 0);
});

test('15 practice: generators and concept questions', () => {
  checkGenerators(practice); checkQuiz(practice);
  // the DOI generator uses the same vis-viva chain as the physics file
  const g = practice.gens[0];
  for (let i = 0; i < 20; i++) { const p = g.make(); assert.ok(p.answer > 15 && p.answer < 35, `DOI Δv ${p.answer}`); }
  // every quiz question has a single correct option, listed first-class: no duplicate options
  for (const q of practice.quiz) assert.equal(new Set(q.opts).size, q.opts.length);
});

test('0.5 high gate: each 500 m lower buys about 15 s of hover for the heavy lander (text)', () => {
  const sc = SCEN.heavy, base = { m0: sc.m0, prop: sc.prop, delay: sc.delay, pdiRange: (sc.fixedRange ?? DEFAULTS.range) * 1e3, throttle: DEFAULTS.thr / 100 };
  const flown = (hg) => { const o = nominalOpts({ ...base, hHG: hg }); for (let i = 0; i < 3; i++) o.pdiRange += Pd.simulate(o).td.x; return Pd.simulate(o).margin; };
  const m = [2500, 2000, 1500, 1000].map(flown);
  for (let i = 1; i < m.length; i++) assert.ok(m[i] - m[i - 1] > 11 && m[i] - m[i - 1] < 22, `step ${i}: ${m[i] - m[i - 1]} s`);
});
