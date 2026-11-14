const test = require('node:test');
const assert = require('node:assert');
const { loadChapter, Phys } = require('./helpers/chapter.js');
const { PRESETS, PROPELLANTS } = loadChapter('rockets', ['PRESETS', 'PROPELLANTS']);
const g0 = 9.80665;
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b}`);

test('3.1 F-1 engine: thrust at sea level and in vacuum, 15 % gain', () => {
  const mdot = 2615, ve = 2805, pe = 44000, Ae = 9.87;
  const F = (pa) => mdot * ve + (pe - pa) * Ae;
  near(F(101325) / 1e6, 6.77, 0.02);
  near(F(0) / 1e6, 7.77, 0.02);
  near(F(0) / F(101325), 1.15, 0.01);
  // overexpanded below 44 kPa threshold: 101 kPa > pe
  assert.ok(101325 > pe && 0 < pe);
});

test('3.2-3.3 numbers quoted in the text', () => {
  near(421 * 9.81 * Math.log(3), 4537, 1);                  // example under the rocket equation
  near(Math.exp(9300 / (304 * g0)), 22.6, 0.1);             // mass ratio near 23 for kerosene
  near(300 * 9.81, 2943, 1);                                // "about 2 940 m/s"
  assert.equal(PROPELLANTS.length, 5);
});

test('3.4 Saturn V: liftoff TWR, S-IC burn time, upper-stage TWR', () => {
  const sv = PRESETS.saturn, st = Phys.rocket.staging(sv.stages, sv.payload);
  const liftoff = st[0].m0;
  near(liftoff / 1e3, 2930, 10);                                // text rounds the real 2 938 t
  near(sv.stages[0].thrust / (2938e3 * 9.81), 1.18, 0.005);     // 1.18, 0.18 g
  near(sv.stages[0].thrust / (liftoff * g0), 1.18, 0.01);
  // burn-time formula: both forms agree; 285 s x 0.73 / 1.18 = 176 s
  const s = sv.stages[0], tb = s.prop * s.isp * g0 / s.thrust;
  const twr0 = s.thrust / (st[0].m0 * g0), frac = 1 - st[0].mf / st[0].m0;
  near(tb, s.isp / twr0 * frac, 1e-6);
  near(285 * 0.73 / 1.18, 176, 1); near(285 * 0.73 / 0.76, 274, 1); near(285 * 0.73 / 2, 104, 1);
  // S-IC ends near 4 g, S-II lights at TWR 0.8 and S-IVB at 0.64
  near(s.thrust / (st[0].mf * g0), 4.4, 0.1);
  near(sv.stages[1].thrust / (st[1].m0 * g0), 0.8, 0.02);
  near(sv.stages[2].thrust / (st[2].m0 * g0), 0.64, 0.01);
  // about 2 700 t of propellant, 45 t of spacecraft
  near(sv.stages.reduce((a, x) => a + x.prop, 0) / 1e3, 2701, 1);
  assert.equal(sv.payload, 45000);
});

test('3.5 staging presets: Saturn V reaches TLI, one stage cannot reach orbit, LM numbers', () => {
  const dv = (p) => Phys.rocket.staging(p.stages, p.payload).reduce((a, r) => a + r.dv, 0);
  assert.ok(dv(PRESETS.saturn) > 12480, 'Saturn V Δv ' + dv(PRESETS.saturn));
  assert.ok(dv(PRESETS.single) < 9300, 'single stage Δv ' + dv(PRESETS.single));
  assert.ok(dv(PRESETS.kerosene) < dv(PRESETS.saturn));
  // same propellant and structure in the single-stage version
  const tot = (p, k) => p.stages.reduce((a, s) => a + s[k], 0);
  assert.equal(tot(PRESETS.single, 'prop'), tot(PRESETS.saturn, 'prop'));
  assert.equal(tot(PRESETS.single, 'dry'), tot(PRESETS.saturn, 'dry'));
  // the Lunar Module lifts off the Moon: TWR against lunar gravity
  const lm = PRESETS.lm, st = Phys.rocket.staging(lm.stages, lm.payload);
  assert.ok(lm.stages[0].thrust / (st[0].m0 * lm.g) > 1);
  assert.ok(lm.stages[0].thrust / (st[0].m0 * g0) < 1);   // would be grounded on Earth gravity
  for (const k in PRESETS) for (const r of Phys.rocket.staging(PRESETS[k].stages, PRESETS[k].payload)) assert.ok(Number.isFinite(r.dv) && r.dv > 0);
});

test('3.5 staging builder: presets respect the tank limit, structure never zero', () => {
  const { PRESETS: P, MAX_PROP_RATIO, minDry } = loadChapter('rockets', ['PRESETS', 'MAX_PROP_RATIO', 'minDry']);
  assert.equal(MAX_PROP_RATIO, 20);
  for (const k of Object.keys(P)) for (const s of P[k].stages) assert.ok(s.dry >= minDry(s.prop), `${k} ${s.name}`);
  assert.equal(minDry(0), 1);                                    // empty stage: 1 kg, so Δv stays finite
  const st = Phys.rocket.staging([{ prop: 0, dry: minDry(0), isp: 300 }], 0);
  assert.ok(isFinite(st[0].dv));
});

test('3.1 F-1 lab: the readout Isp matches the 263 / 304 s quoted in the table and practice', () => {
  const mdot = 2615, ve = 2805, pe = 44000, Ae = 9.87;
  const F = (pa) => mdot * ve + (pe - pa) * Ae;
  near(F(101325) / (mdot * g0), 263.5, 1);
  near(F(0) / (mdot * g0), 303.5, 1);
});
