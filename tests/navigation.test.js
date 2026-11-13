// TM-3 Where Are We? (js/ch/navigation.js + navigation.phys.js): physics vs hand calculations, numbers quoted in the text,
// lab scenarios, figures, practice.
const test = require('node:test'), assert = require('node:assert/strict');
const { loadChapter, Phys } = require('./helpers/chapter.js');
const { checkGenerators, checkQuiz } = require('./helpers/practice.js');
const Pn = require('../js/ch/navigation.phys.js');
const ch = loadChapter('navigation', ['SCEN', 'SNAP_STEP', 'roundRead', 'seeded', 'figComponents', 'figShape', 'figAnomalies'], { Phys_navigation: Pn });
const { C } = Phys, deg = 180 / Math.PI;
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x}, text says ${want}`);

test('fromReadings: the worked example in 3.2–3.4', () => {
  const s = Pn.fromReadings({ alt: 200e3, v: 7900, hdot: 50 });
  near(s.r / 1e3, 6578, 0.5, 'r'); near(s.gamma * deg, 0.363, 0.0005, 'gamma'); near(s.vh, 7899.84, 0.005, 'v_h');
  near(s.eps / 1e6, -29.390, 0.0005, 'eps'); near(s.a / 1e3, 6781.3, 0.05, 'a'); near(s.H / 1e10, 5.1966, 0.00005, 'H');
  near(s.p / 1e3, 6774.9, 0.05, 'p'); near(s.e, 0.03062, 0.000005, 'e'); near(s.nu * deg, 12.3, 0.05, 'nu');
  near(s.altP / 1e3, 195.5, 0.05, 'perigee altitude'); near(s.altA / 1e3, 610.8, 0.05, 'apogee altitude'); near(s.T / 60, 92.6, 0.05, 'period');
  near(s.M, 0.2018, 0.00005, 'M'); near(s.n * 1e3, 1.1306, 0.00005, 'n'); near(s.tToApo, 2600, 0.5, 't to apoapsis'); near(s.tToApo / 60, 43.3, 0.05, 'minutes');
  // the two apsides average to a, and p = a(1 − e²)
  near((s.rp + s.ra) / 2, s.a, 1e-3, 'rp + ra = 2a'); near(s.p, s.a * (1 - s.e * s.e), 1e-3, 'p');
});

test('fromReadings inverts a true orbit at every anomaly, ascending and descending', () => {
  for (const [pa, aa] of [[-1400, 650], [185, 186], [200, 8000], [250, 3500], [300, 35000]]) {
    const o = Pn.orbit(pa * 1e3, aa * 1e3, 0.3);
    for (let k = 0; k < 24; k++) {
      const t = o.T * k / 24, st = Pn.stateAt(o, t), s = Pn.fromReadings({ alt: st.alt, v: st.v, hdot: st.hdot });
      near(s.altP, pa * 1e3, 5, `perigee, orbit ${pa}x${aa}`); near(s.altA, aa * 1e3, 5, 'apogee');
      near((s.nu - st.nu + 3 * Math.PI) % (2 * Math.PI) - Math.PI, 0, 1e-6, 'nu');
      // time to apoapsis counted forward: after that time the true orbit is at apoapsis
      const at = Pn.stateAt(o, t + s.tToApo);
      near(at.r, o.ra, 2, 'r at the predicted apoapsis'); assert.ok(Math.abs(at.hdot) < 0.05, 'vertical speed zero at apoapsis');
    }
  }
});

test('edge cases: circular, exactly radial, hyperbolic and escape readings stay finite', () => {
  const vc = Math.sqrt(C.muE / (C.RE + 300e3));
  const circ = Pn.fromReadings({ alt: 300e3, v: vc, hdot: 0 });
  assert.ok(circ.e < 1e-9 && Number.isFinite(circ.tToApo) && Number.isFinite(circ.nu));
  const hyp = Pn.fromReadings({ alt: 300e3, v: 12000, hdot: 1000 });
  assert.ok(hyp.e > 1 && hyp.ra === Infinity && hyp.a < 0 && Number.isFinite(hyp.altP));
  const down = Pn.fromReadings({ alt: 300e3, v: 3000, hdot: -3000 });   // straight down: no horizontal speed
  assert.ok(Number.isFinite(down.altP) && down.altP < 0, 'a vertical drop passes through the Earth');
  assert.ok(Pn.fromReadings({ alt: 300e3, v: 5000, hdot: 6000 }).gamma <= Math.PI / 2 + 1e-12, 'hdot > v is clamped');
});

test('3.5 error budget and rules of thumb quoted in the text', () => {
  // near circular at 185 km: 1 m/s moves the opposite apsis by 4/n = 3.37 km, 2 m/s almost 7 km
  near(Pn.ruleOfThumb(1, 185e3) / 1e3, 3.37, 0.005, '4Δv/n'); near(Pn.ruleOfThumb(2, 185e3) / 1e3, 6.74, 0.01, '2 m/s');
  // read at perigee of a 185 × 200 km orbit: the speed error moves the opposite apsis by 4/n, the apsis itself not at all
  const rd = Pn.readings(Pn.orbit(185e3, 200e3, 0), 0), vc = rd.v;
  const d = Pn.partials(rd);
  near(d.v.altA / 1e3, 3.37, 0.05, 'numerical speed sensitivity at an apsis (opposite apsis)');
  near(d.v.altP, 0, 0.01, 'the apsis being read does not move');
  // the climb-rate sensitivity is r/v·|sin ν|: r/v = 0.84 km per m/s at most, reached a quarter of the way round
  const q = Pn.partials(Pn.readings(Pn.orbit(185e3, 200e3, Math.PI / 2), 0));
  near(Math.abs(q.hdot.altA) / 1e3, (C.RE + 185e3) / vc / 1e3, 0.01, 'ḣ sensitivity r/v = 0.84 km per m/s');
  near((C.RE + 185e3) / vc / 1e3, 0.84, 0.005, 'r/v text');
  near((d.alt.altP + d.alt.altA) / 2, 2, 0.2, '1 m of altitude error moves the apsides by about 2 m (mean)');
  // the example orbit: 3.6 km and 0.18 km per m/s, 1.1 km and 7 km 1σ
  const ex = { alt: 200e3, v: 7900, hdot: 50 }, de = Pn.partials(ex);
  near(de.v.altA / 1e3, 3.6, 0.05, 'speed sensitivity at apoapsis'); near(Math.abs(de.hdot.altA) / 1e3, 0.18, 0.005, 'hdot sensitivity');
  near(Pn.budget(ex, Pn.PRECISION.good).altA / 1e3, 1.1, 0.05, 'good instruments 1σ');
  near(Pn.budget(ex, Pn.PRECISION.poor).altA / 1e3, 7, 0.5, 'poor instruments 1σ');
  assert.deepEqual(Pn.budget(ex, Pn.PRECISION.perfect).altA, 0);
});

test('noise generator: unit-variance normal, reproducible with a seed', () => {
  const rng = ch.seeded(42), xs = Array.from({ length: 20000 }, () => Pn.gauss(rng));
  const m = xs.reduce((a, b) => a + b) / xs.length, sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
  near(m, 0, 0.03, 'mean'); near(sd, 1, 0.03, 'sd');
  near(xs.filter((x) => Math.abs(x) < 1).length / xs.length, 0.68, 0.02, 'two out of three inside ±1σ');
  const a = Pn.noisy({ alt: 1, v: 2, hdot: 3 }, Pn.PRECISION.poor, ch.seeded(7)), b = Pn.noisy({ alt: 1, v: 2, hdot: 3 }, Pn.PRECISION.poor, ch.seeded(7));
  assert.deepEqual(a, b);
  assert.deepEqual(Pn.noisy({ alt: 1, v: 2, hdot: 3 }, Pn.PRECISION.perfect), { alt: 1, v: 2, hdot: 3 });
});

test('lab scenarios: the readings are solvable, the tolerance is met by the typed truth, the objectives can be earned', () => {
  for (const [key, sc] of Object.entries(ch.SCEN)) for (let take = 0; take < 6; take++) {
    const o = Pn.orbit(sc.altP * 1e3, sc.altA * 1e3, sc.nu0);
    let tS = take * ch.SNAP_STEP;
    if (o.rp < C.RE) { tS = 0; for (let k = 0; k <= take; k++) { if (k) tS += ch.SNAP_STEP; while (Pn.stateAt(o, tS).alt < 120e3) tS += 30; } }   // as the lab does for the suborbital scenario
    if (take) assert.ok(tS > 0, 'new readings are taken later');
    const exact = Pn.readings(o, tS);
    assert.ok(exact.alt > 0, `${key} take ${take}: the spacecraft is above the ground (alt ${exact.alt})`);
    const rng = ch.seeded(1000 * (Object.keys(ch.SCEN).indexOf(key) + 1) + (take + (sc.seedAdd || 0)) * 7 + 13);
    const disp = ch.roundRead(Pn.noisy(exact, Pn.PRECISION[sc.prec], rng)), sol = Pn.fromReadings(disp), truth = Pn.fromReadings(exact);
    for (const v of [sol.altP, sol.altA, sol.tToApo]) assert.ok(Number.isFinite(v), `${key} take ${take}`);
    const tolKm = Math.max(5, 0.0015 * sol.ra / 1e3);
    if (sc.prec === 'perfect') {   // display rounding alone must not push the true answer out of tolerance
      assert.ok(Math.abs(sol.altP - truth.altP) / 1e3 < tolKm && Math.abs(sol.altA - truth.altA) / 1e3 < tolKm, `${key} take ${take}: rounding error`);
    }
  }
  // 'sub': the periapsis is below the surface, and that is what the objective asks for
  const sub = ch.SCEN.sub, s0 = Pn.fromReadings(Pn.readings(Pn.orbit(sub.altP * 1e3, sub.altA * 1e3, sub.nu0), 0));
  assert.ok(s0.altP < 0);
  // 'park' is nearly circular: altitude and speed alone look circular, the vertical speed separates the apsides
  const park = ch.SCEN.park, o = Pn.orbit(park.altP * 1e3, park.altA * 1e3, park.nu0), rd = Pn.readings(o, 0);
  assert.ok(o.e < 0.01 && Math.abs(rd.hdot) > 10);
});

test('3.x figures render without NaN', () => {
  for (const f of ['figComponents', 'figShape', 'figAnomalies']) assert.ok(!/NaN|undefined|Infinity/.test(ch[f]()), f);
});

test('navigation practice: generators match independent solutions, quiz keys', () => {
  const p = ch.practice;
  checkGenerators(p, 100); checkQuiz(p);
  const num = (s, re) => parseFloat(s.match(re)[1].replace(/[−]/, '-'));
  for (const g of p.gens) for (let i = 0; i < 60; i++) {
    const x = g.make();
    if (/^(Apoapsis from|Periapsis from|Time to apo)/.test(g.title)) {
      const alt = num(x.q, /altitude <b>([\d.]+) km/) * 1e3, v = num(x.q, /speed <b>([\d.]+) km\/s/) * 1e3, hd = num(x.q, /vertical speed <b>([+−\-][\d.]+) km\/s/) * 1e3;
      const s = Pn.fromReadings({ alt, v, hdot: hd });
      const want = g.title.startsWith('Apoapsis') ? s.altA / 1e3 : g.title.startsWith('Periapsis') ? s.altP / 1e3 : s.tToApo / 60;
      near(x.answer, want, Math.abs(want) * 1e-9, g.title);
      assert.ok(alt > 0 && s.e < 1 && s.altP > 0, 'a bound orbit above the ground');
      if (g.title.startsWith('Time')) assert.ok(x.answer > 0 && x.answer < s.T / 120 + 1e-9, 'less than half a period');
    }
    if (g.title.startsWith('Flight-path')) {
      const v = num(x.q, /speed of <b>([\d.]+) km/) * 1e3, hd = num(x.q, /\+([\d.]+) km\/s<\/b>/) * 1e3;
      near(x.answer, Math.asin(hd / v) * deg, 1e-9, 'gamma'); assert.ok(x.answer > 0.5 && x.answer < 15);
    }
    if (g.title.startsWith('A speed error')) {
      const alt = num(x.q, /<b>([\d.]+) km<\/b> altitude/), dv = num(x.q, /wrong by <b>([\d.]+) m\/s/);
      near(x.answer, Pn.ruleOfThumb(dv, alt * 1e3) / 1e3, 1e-9, 'rule of thumb');
    }
  }
});
