// TM-6 Planning a burn (js/ch/burns.js): scenarios, numbers quoted in the text, practice of the topic burns.
const test = require('node:test'), assert = require('node:assert/strict');
const { loadChapter, Phys } = require('./helpers/chapter.js');
const { makeEnv } = require('./helpers/appenv.js');
const { SCEN, VEHICLES } = loadChapter('burns', ['SCEN', 'VEHICLES']);
const { muE: mu, RE, g0 } = Phys.C;
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x} vs text ${want}`);
const run = (k, burns, o = {}) => { const sc = SCEN[k], v = VEHICLES[sc.vehicle];
  return Phys.executeBurns({ s0: sc.s0(), mu, m0: v.m0, F: v.F, isp: v.isp, burns, centred: true, ...o }); };
const km = (r) => (r - RE) / 1e3;

test('Mission Control solutions reach the objectives of the lab', () => {
  const c = run('circ', SCEN.circ.solution()).final;
  assert.ok(c.e < 0.003 && Math.abs(km(c.rp) - 1000) < 30 && Math.abs(km(c.ra) - 1000) < 30);
  const h = run('hohmann', SCEN.hohmann.solution()).final;
  assert.ok(h.e < 0.003 && Math.abs(km(h.rp) - 2000) < 30 && Math.abs(km(h.ra) - 2000) < 30);
  for (const k of Object.keys(SCEN)) assert.ok(typeof SCEN[k].solution === 'function' && VEHICLES[SCEN[k].vehicle]);
});

test('6.4 burn time and propellant of the 214 m/s CSM example', () => {
  const ve = 314 * g0, tb = 28800 * ve / 91200 * (1 - Math.exp(-214 / ve)), prop = 28800 * (1 - Math.exp(-214 / ve));
  near(tb, 65, 0.5, 't_b'); near(prop, 1900, 50, 'propellant');
});

test('6.5 long burn with the small stage: 947 m/s, 18 min, 3 760 / 4 610 / 4 820 km, periapsis 390 km', () => {
  const sol = SCEN.long.solution()[0];
  near(sol.pro, 947, 1, 'impulsive Δv');
  const fixed = run('long', [sol]), early = run('long', [sol], { centred: false }), turn = run('long', [sol], { track: true });
  near(fixed.burns[0].tb / 60, 18, 0.5, 'burn time (min)');
  near(km(early.final.ra), 3760, 15, 'ignited at the burn point');
  near(km(fixed.final.ra), 4610, 15, 'centred');
  near(km(turn.final.ra), 4820, 15, 'turning with the velocity');
  near(km(turn.final.rp), 390, 15, 'periapsis when turning');
  // the objective window of 5 000 km ± 100 is reachable with a Δv a little above the impulsive one
  let hit = false;
  for (let k = 1; k <= 1.15 && !hit; k += 0.005) hit = Math.abs(km(run('long', [{ ...sol, pro: sol.pro * k }]).final.ra) - 5000) <= 100;
  assert.ok(hit, 'some Δv completes the objective');
  assert.ok(Math.abs(km(fixed.final.ra) - 5000) > 100, 'the plain impulsive solution does not complete the objective');
});

test('radial scenario: 500 m/s radial out drives the periapsis into the ground, radial in does not', () => {
  const out = run('radial', [{ when: 'in', minutes: 20, pro: 0, rad: 500 }]).final, inn = run('radial', [{ when: 'in', minutes: 20, pro: 0, rad: -500 }]).final;
  assert.ok(km(out.rp) < 0);
  assert.ok(km(inn.rp) > 300);
  const b = run('radial', [{ when: 'in', minutes: 20, pro: 0, rad: 500 }]).burns[0];
  assert.ok(b.dv >= 500 && Math.abs(Math.sin(b.attitude)) >= 0.9);
});

test('formula of 6.3: plane change components make 2 v sin(di/2)', () => {
  const v = 7793, di = 28.5 * Math.PI / 180, N = v * Math.sin(di), P = -v * (1 - Math.cos(di));
  near(Math.hypot(N, P), 2 * v * Math.sin(di / 2), 1e-9, 'norm');
});

test('practice generators and concept questions of the topic burns', () => {
  const { Practice } = makeEnv();
  const gens = Practice.GEN.filter((g) => g.topic === 'burns'), quiz = Practice.QUIZ.filter((q) => q.topic === 'burns');
  require('./helpers/practice.js').checkGenerators({ gens });
  require('./helpers/practice.js').checkQuiz({ quiz });
  for (const g of gens) for (let i = 0; i < 30; i++) {
    const p = g.make();
    if (g.title === 'Circularization burn') assert.ok(p.answer > 0 && p.answer < 700, `circularize ${p.answer}`);
    if (g.title === 'Burn time') assert.ok(p.answer > 0 && p.answer < 2000);
    if (g.title === 'Centring the burn') assert.ok(p.answer > 3600);
  }
});
