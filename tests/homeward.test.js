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

// ---- chapter-level checks (js/ch/homeward.js) ----
const { loadChapter } = require('./helpers/chapter.js');
const { checkGenerators, checkQuiz } = require('./helpers/practice.js');
const H = loadChapter('homeward', ['SCEN', 'PHI_NOM', 'figBurn'], { Phys_homeward: Ph });
const deg = 180 / Math.PI;
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x}, text says ${want}`);

test('17.1-17.3 numbers quoted in the text (110 km example)', () => {
  const h = Ph.handMinEnergy(110e3, 40e3);
  near(h.a / 1e3, 195409, 1, 'a'); near(h.tof / 3600 / 24, 5, 0.1, 'five days');
  near(h.vM, 1018.3, 0.1, 'Moon speed (real mean 1.02 km/s)'); near(h.va, 184.5, 0.1, 'apogee speed'); near(h.vinf, 833.8, 0.1, 'v∞');
  near(h.vc, 1629.1, 0.1, 'circular speed'); near(h.dv, 821, 1, 'Δv of the example');
  // vacuum perigee 40 km gives −6.4° and the corridor is about 12 to 65 km tall
  near(Ph.gammaFromPerigee(40e3), -6.4, 0.05, 'γ at 40 km');
  near(Ph.perigeeForGamma(-5.3) / 1e3 - Ph.perigeeForGamma(-7.4) / 1e3, 55, 3, 'corridor height, text says about 55 km');
  near(2.1 / (Ph.perigeeForGamma(-5.3) / 1e3 - Ph.perigeeForGamma(-7.4) / 1e3), 0.04, 0.005, 'degrees per km of perigee');
  // real flights: about 1 km/s and about 2.5 days
  const roots = Ph.solvePhi({ alt: 110e3, dv: 1000 }), f = Ph.fly({ alt: 110e3, dv: 1000, phi: roots[0], rev: 1 });
  near(f.tof / 3600, 60, 1, 'return time at 1 000 m/s (about 2.5 days)');
  // leaving the sphere of influence: 13 to 18 hours, the Moon moves about 7 to 10 degrees meanwhile
  near((f.tSOI - f.t0) / 3600, 13, 0.5, 'SOI exit, fast return');
  const hm = Ph.fly({ alt: 110e3, dv: h.dv, phi: Ph.solvePhi({ alt: 110e3, dv: h.dv })[0] });
  near((hm.tSOI - hm.t0) / 3600, 18, 0.5, 'SOI exit, minimum-energy return');
  near((hm.tSOI - hm.t0) / 3600 * Ph.W * 3600 * deg, 10, 0.5, 'Moon motion, minimum energy'); near((f.tSOI - f.t0) / 3600 * Ph.W * 3600 * deg, 7, 0.5, 'Moon motion, fast');
  // hand vs simulated burn position: within a few degrees for 1 000 m/s, about 30° apart for the slow return
  near(Ph.handGivenDv(110e3, 1000).phi, roots[0], 4, 'hand φ at 1 000 m/s');
  near(Math.abs(Ph.solvePhi({ alt: 110e3, dv: h.dv })[0] - h.phi), 30, 3, 'hand vs simulated φ, slow return');
  assert.ok(hm.tof < 5 * 86400, 'simulated slow return is shorter than five days');
});

test('17.4 revolution: period, synodic period, 30° of longitude, 20 s per degree, occultation', () => {
  const lo = Ph.lunarOrbit(110e3);
  near(lo.P / 60, 118.8, 0.1, 'orbit period'); near(lo.Psyn / 60, 118.4, 0.1, 'period seen from the Earth');
  near(15 * lo.Psyn / 3600, 30, 0.5, 'longitude shift per revolution'); near(lo.Psyn / 360, 20, 0.5, 'seconds per degree');
  near(2 * lo.losPhi / (2 * Math.PI) * lo.Psyn / 60, 46, 1, 'time behind the Moon, min (Phys.lunarLOS agrees to ~1 min)');
  // one more revolution adds exactly Psyn to the burn time and leaves the trajectory unchanged
  const a = Ph.fly({ alt: 110e3, dv: 1000, phi: -13.8, rev: 1 }), b = Ph.fly({ alt: 110e3, dv: 1000, phi: -13.8, rev: 2 });
  near(b.t0 - a.t0, lo.Psyn, 1e-6, 'one revolution'); near(b.tof, a.tof, 1, 'same flight time'); near(b.periAlt, a.periAlt, 1, 'same perigee');
});

test('17.5 sensitivities quoted in the text', () => {
  const o = { alt: 110e3, dv: 1000, phi: Ph.solvePhi({ alt: 110e3, dv: 1000 })[0], rev: 1 };
  near(Math.abs(Ph.sensitivity(o, 'dv', 0.1)), 150, 10, 'km per m/s');
  near(Math.abs(Ph.sensitivity(o, 'phi', 0.005)), 1270, 20, 'km per degree');
  near(Ph.sensitivity({ ...o, mcc: { dt: 24 * 3600, dv: 0 } }, 'mcc', 0.1), 50, 2, 'MCC at 24 h, km per m/s');
  near(Ph.sensitivity({ ...o, mcc: { dt: 48 * 3600, dv: 0 } }, 'mcc', 0.1), 25, 2, 'MCC at 48 h, km per m/s');
});

test('lab scenarios: defaults are not already a success, every objective is reachable', () => {
  const run = (s, o = {}) => Ph.fly({ alt: s.alt, dv: s.dv, phi: s.phi, rev: s.rev, dvErr: s.err, ...o });
  for (const [k, s] of Object.entries(H.SCEN)) assert.notEqual(run(s).outcome, 'corridor', `${k}: the loaded plan must not already be in the corridor`);
  // nominal: the hand Δv is not the default, and with it a burn position exists
  const nom = H.SCEN.nominal, hand = Ph.handMinEnergy(nom.alt, 40e3);
  assert.ok(Math.abs(nom.dv - hand.dv) > 3, 'default Δv is outside the 3 m/s window');
  const phi = Ph.solvePhi({ alt: nom.alt, dv: Math.round(hand.dv) }); assert.ok(phi.length);
  assert.equal(run(nom, { dv: Math.round(hand.dv), phi: phi[0] }).outcome, 'corridor');
  // fast: a Δv exists that returns within 52 h and stays in the corridor
  let ok = false; for (let dv = 1000; dv <= 1300 && !ok; dv += 10) { const r = Ph.solvePhi({ alt: 110e3, dv }); if (r.length) { const f = run(H.SCEN.fast, { dv, phi: r[0] }); ok = f.outcome === 'corridor' && f.tof <= 52 * 3600; } }
  assert.ok(ok, 'fast return objective reachable');
  // landing: some revolution puts splashdown in the window (the window is one lap wide)
  const L = H.SCEN.landing, lp = Ph.solvePhi({ alt: L.alt, dv: L.dv })[0];
  const hit = [...Array(20).keys()].map((i) => run(L, { phi: lp, rev: i + 1 })).filter((r) => r.outcome === 'corridor' && Math.abs(r.tEI - L.target) <= L.window);
  assert.ok(hit.length >= 1, 'a revolution meets the window');
  // dispersed burn: the loaded plan misses, a correction of 4 m/s or less at 24 h fixes it, 0 m/s does nothing
  const D = H.SCEN.disp, d0 = run(D);
  assert.notEqual(d0.outcome, 'corridor');
  assert.equal(run(D, { mcc: { dt: 24 * 3600, dv: 0 } }).mccT, undefined, 'no correction without a Δv');
  const m = Ph.solveMCC({ alt: D.alt, dv: D.dv, phi: D.phi, rev: 1, dvErr: D.err, mcc: { dt: 24 * 3600, dv: 1 } });
  assert.ok(m != null && Math.abs(m) <= 4, `correction ${m}`);
  const fixed = run(D, { mcc: { dt: 24 * 3600, dv: m } }); assert.equal(fixed.outcome, 'corridor'); assert.ok(fixed.mccT);
  // too early (still inside the Moon's sphere of influence): not executed
  assert.equal(run(D, { mcc: { dt: 3600, dv: m } }).mccT, undefined);
});

test('fly: no NaN or exception for extreme inputs, sensible outcomes', () => {
  for (const dv of [-100, 0, 300, 700, 800, 1000, 2000, 1e5]) for (const phi of [-720, -60, 0, 52, 180, 361]) for (const rev of [1, 20]) for (const alt of [0, 60e3, 110e3, 500e3]) {
    const f = Ph.fly({ alt, dv, phi, rev });
    assert.ok(['corridor', 'shallow', 'steep', 'miss', 'escape', 'captured'].includes(f.outcome), f.outcome);
    for (const k of ['periAlt', 'gamma', 'tof', 'vEI']) if (f[k] != null) assert.ok(Number.isFinite(f[k]), `${k} ${f[k]} (${dv}, ${phi}, ${rev}, ${alt})`);
    Ph.samples(f, 30);
  }
  assert.equal(Ph.fly({ alt: 110e3, dv: 300, phi: 50 }).outcome, 'captured', 'a small Δv stays in lunar orbit');
  assert.equal(Ph.handGivenDv(110e3, 200), null);
});

test('figBurn and the practice generators', () => {
  const svg = H.figBurn(Ph.handMinEnergy(110e3, 40e3)); assert.ok(!/NaN|undefined/.test(svg));
  checkGenerators(H.practice); checkQuiz(H.practice);
  for (const q of H.practice.quiz) assert.equal(new Set(q.opts).size, q.opts.length);
  // the speed problem is consistent with a circular orbit: 384 400 km gives 1 018 m/s
  for (let i = 0; i < 20; i++) { const p = H.practice.gens[0].make(); assert.ok(p.answer > 980 && p.answer < 1060, `Moon speed ${p.answer}`); }
  for (let i = 0; i < 20; i++) { const p = H.practice.gens[3].make(); assert.ok(p.answer > 500 && p.answer < 1100, `TEI Δv ${p.answer}`); }
});
