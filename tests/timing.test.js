// TM-? When to Burn (js/ch/timing.js + timing.phys.js): numbers quoted in the text, scenarios, figure, practice.
const test = require('node:test'), assert = require('node:assert/strict');
const Pt = require('../js/ch/timing.phys.js');
const { loadChapter } = require('./helpers/chapter.js');
const { checkGenerators, checkQuiz } = require('./helpers/practice.js');
const { figLiftoff, SCEN, practice } = loadChapter('timing', ['figLiftoff', 'SCEN'], { Phys_timing: Pt });
const D = 180 / Math.PI, muE = 3.986004418e14, RE = 6.378137e6, muM = 4.9028e12, RM = 1.7374e6;
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x} vs text ${want}`);

test('0.1-0.4 numbers quoted in the text (200 km to 700 km)', () => {
  const r1 = RE + 200e3, r2 = RE + 700e3, n1 = Pt.meanMotion(muE, r1), n2 = Pt.meanMotion(muE, r2);
  near(n1 * D * 60, 4.068, 0.0005, 'n at 200 km'); near(n2 * D * 60, 3.645, 0.0005, 'n at 700 km');
  near(2 * Math.PI / n1 / 60, 88.5, 0.05, 'period 200'); near(2 * Math.PI / n2 / 60, 98.8, 0.05, 'period 700');
  const tt = Pt.hohmannTime(muE, r1, r2), req = Pt.requiredPhase(muE, r1, r2) * D;
  near(tt / 60, 46.79, 0.005, 't_t'); near(n2 * tt * D, 170.55, 0.005, 'target moves'); near(req, 9.45, 0.005, 'phi_req');
  near(Pt.waitTime(42 / D, req / D, n1, n2) / 60, 76.9, 0.05, 'wait from 42 deg');
  near((n1 - n2) * D * 60, 0.4233, 0.0001, 'closing rate'); near(Pt.synodic(n1, n2) / 3600, 14.2, 0.05, 'synodic');
  near(Pt.waitTime(8 / D, req / D, n1, n2) / 3600, 14.1, 0.05, 'wait from 8 deg');
  near(1 / ((n1 - n2) * D * 60), 2.4, 0.05, 'minutes per degree');
  near(Pt.requiredPhase(muE, RE + 900e3, RE + 400e3) * D, -10.05, 0.005, 'down 900 to 400');
  assert.equal(Pt.fmtGET(3 * 3600 + 600 + Pt.waitTime(42 / D, req / D, n1, n2)), '04:26:53');
});

test('0.6 lunar liftoff example: -4.43 deg, GET 125:57:18, windows, errors', () => {
  const L = Pt.liftoff(muM, RM, 15e3, 110e3, 420, 300e3 / RM);
  near(300e3 / RM * D, 9.89, 0.005, 'theta_asc'); near(L.tH, 3426, 1, 't_H'); near(L.nC * D * 60, 3.031, 0.0005, 'n_C');
  near(L.period / 60, 118.75, 0.005, 'period'); near(L.nC * (420 + L.tH) * D, 194.32, 0.005, 'CSM travel');
  near(L.phiLift * D, -4.43, 0.005, 'phi_lift');
  const dt = Pt.liftoffDelay(L.phiLift, 0, L.nC);
  assert.equal(Pt.fmtGET(124 * 3600 + dt), '125:57:18');
  assert.equal(Pt.fmtGET(124 * 3600 + L.period), '125:58:45');
  near(Pt.liftoffDelay(L.phiLift, 0, L.nC, 2.66e-6) - dt, 21, 1, 'rotation effect (s)');
  // a liftoff 120 s late misses by about 195 km; the exact one by nothing
  const sc = Pt.SCENARIOS.ascent, s = Pt.setupAscent(sc);
  assert.ok(Pt.flyAscent(sc, s.tig).dist < 1);
  near(Pt.flyAscent(sc, s.tig + 120).dist / 1e3, 195, 2, 'miss 120 s late');
  near((L.nL - L.nC) * D * 60, 0.25, 0.005, 'gain per minute'); near(10 / ((L.nL - L.nC) * D * 60), 40, 0.1, '10 deg coast');
  const nL20 = Pt.meanMotion(muM, RM + 20e3), nC = Pt.meanMotion(muM, RM + 110e3);
  near(2 * Math.PI / nL20 / 60, 110.2, 0.05, 'period 20 km'); near((nL20 - nC) * D * 60, 0.24, 0.005, 'gain 20 km');
  near(Pt.synodic(nL20, nC) / 3600, 25, 0.5, 'synodic 20/110');
});

test('every lab scenario is solvable: the textbook TIG puts the chaser on the target, in the right direction', () => {
  for (const [k, sc] of Object.entries(Pt.SCENARIOS)) {
    const S = Pt.setup(sc);
    assert.ok(Number.isFinite(S.wait) && S.wait >= 0 && S.wait < S.syn + 1e-6, `${k} wait ${S.wait}`);
    assert.ok(Pt.fly(sc, S.tig).dist < 1, `${k} exact TIG`);
    if (k in SCEN) {
      assert.ok(Pt.fly(sc, S.tig + 0.5 * S.syn).dist > SCEN[k].tolKm * 1e3, `${k}: half a cycle later misses`);
      assert.ok(S.tig <= sc.t0 + 6 * S.syn);
    }
  }
  const S = Pt.setup(Pt.SCENARIOS.above);
  assert.ok(S.phiReq < 0 && S.phi0 < 0, 'above: negative angles, phi grows');
  // "long" scenario: just past the window, wait nearly a whole synodic period
  const L = Pt.setup(Pt.SCENARIOS.long);
  assert.ok(L.wait > 0.95 * L.syn);
});

test('wait time, phase and GET helpers: wrap, edge cases', () => {
  near(Pt.wrapPi(Math.PI + 1e-9), -Math.PI + 1e-9, 1e-6, 'wrapPi'); assert.equal(Pt.wrap(-1e-17), 0); assert.ok(Pt.wrap(-1e-3) > 6.28 && Pt.wrap(7) < 1);
  assert.ok(Pt.waitTime(0.3, 0.3, 2, 1) < 1e-9, 'zero wait when already aligned');
  assert.equal(Pt.parseGET('125:57:18'), 125 * 3600 + 57 * 60 + 18);
  assert.equal(Pt.parseGET('04:26'), 4 * 3600 + 26 * 60);
  assert.equal(Pt.parseGET('04:26:53,5'), 4 * 3600 + 26 * 60 + 53.5);
  assert.ok(Number.isNaN(Pt.parseGET('04:61:00')) && Number.isNaN(Pt.parseGET('abc')) && Number.isNaN(Pt.parseGET('')));
  assert.equal(Pt.fmtGET(Pt.parseGET('123:45:06')), '123:45:06');
  // transfer down: the chaser starts at the apoapsis of the ellipse
  const sc = Pt.SCENARIOS.above, S = Pt.setup(sc), f = Pt.fly(sc, S.tig);
  assert.ok(Math.abs(f.chaser(S.tig + 1).r - sc.r1) < 2e3 && Math.abs(f.chaser(f.tArr - 1).r - sc.r2) < 2e3);
  for (let k = 0; k <= 50; k++) { const c = f.chaser(f.tigUsed + f.tof * k / 50); assert.ok(Number.isFinite(c.r) && Number.isFinite(c.th) && c.r >= sc.r2 - 1 && c.r <= sc.r1 + 1); }
});

test('figure of the liftoff has no NaN', () => { assert.ok(!/NaN|undefined|Infinity/.test(figLiftoff())); });

test('practice: generators (answers not too close to zero) and concept questions', () => {
  checkGenerators(practice, 150);
  checkQuiz(practice);
  for (let i = 0; i < 300; i++) {
    for (const g of practice.gens) {
      if (g.title === 'Required phase at liftoff') assert.ok(Math.abs(g.make().answer) >= 1.5);
      if (g.title === 'Liftoff time from the overhead pass') assert.ok(g.make().answer >= 10);
    }
  }
});

test('0.2 and 0.3 in the text: 9.45° is about 1 200 km; the t_wait formula with |rate| gives the lab wait both ways', () => {
  const r = 6378.137 + 700, arc = 9.45 * Math.PI / 180 * r;
  assert.ok(Math.abs(arc - 1200) < 50, String(arc));
  for (const k of ['leo', 'above', 'long']) {
    const S = Pt.setup(Pt.SCENARIOS[k]), up = S.n1 > S.n2, D = 180 / Math.PI;
    const dphi = ((up ? S.phi0 - S.phiReq : S.phiReq - S.phi0) * D % 360 + 360) % 360;
    assert.ok(Math.abs(dphi / D / Math.abs(S.n1 - S.n2) - S.wait) < 1, `${k}: ${dphi}`);
  }
});
