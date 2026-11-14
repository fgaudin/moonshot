// TM-2 Describing Orbits (js/ch/orbits.js): figures, numbers quoted in the text, designer presets and objectives, practice.
const test = require('node:test'), assert = require('node:assert/strict');
const { loadChapter, Phys } = require('./helpers/chapter.js');
const { checkGenerators, checkQuiz } = require('./helpers/practice.js');
const { topic } = require('./helpers/practiceTopic.js');
const fs = require('fs'), path = require('path');
const ch = loadChapter('orbits', ['figConics', 'figGamma', 'figElements', 'SIDEREAL_DAY', 'solveHyperbolic', 'DESIGNER_PRESETS', 'nearPreset']);
const { C } = Phys;
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x}, text says ${want}`);
// the designer's presets (they live inside mountDesigner, so read them from the source)
const src = fs.readFileSync(path.join(__dirname, '../js/ch/orbits.js'), 'utf8');
const PRESETS = {};
for (const [k, p] of Object.entries(ch.DESIGNER_PRESETS)) PRESETS[k] = { h: p['od-h'], v: p['od-v'], phi: p['od-phi'] };
const elOf = (p) => Phys.elementsFromRV(C.RE + p.h * 1e3, p.v * 1e3, p.phi * Math.PI / 180, C.muE);

test('2.x figures render without NaN', () => {
  for (const f of ['figConics', 'figGamma', 'figElements']) assert.ok(!/NaN|undefined|Infinity/.test(ch[f]()), f);
});

test('the Kepler equation display has no stray semicolon (a single backslash in a template literal turns \; into ;)', () => {
  const eq = src.split('\n').find((l) => /tan\\\\frac\{\\\\nu\}\{2\}/.test(l) && /sqrt/.test(l));
  assert.ok(eq && !/[^\\];\\\\tan/.test(eq), eq);
  assert.ok(/\\\;\\\\tan/.test(eq));
  // and no other single-backslash TeX in a plain page template line
  for (const l of src.split('\n')) if (/class="eq"/.test(l)) assert.ok(!/(^|[^\\])\\[;,!a-zA-Z]/.test(l.replace(/\\\\/g, '')), l);
});

test('2.5–2.6 numbers quoted in the text', () => {
  // canonical units: 1 DU = 6 378.145 km, 1 TU = 806.8 s, 1 DU/TU = 7.905 km/s
  const DU = 6378.145e3, TU = Math.sqrt(DU ** 3 / C.muE);
  near(TU, 806.8, 0.05, 'TU'); near(DU / TU / 1e3, 7.905, 0.001, 'DU/TU');
  // Apollo 11 parking orbit: a ≈ 6 563 km at 185 km
  near((C.RE + 185e3) / 1e3, 6563, 0.5, 'a'); near(C.RE / 1e3 + 185 - 6563, 0, 0.5, 'a');
  // geostationary altitude 35 786 km: one sidereal day
  const aG = Math.cbrt(C.muE * (ch.SIDEREAL_DAY / (2 * Math.PI)) ** 2);
  near((aG - C.RE) / 1e3, 35786, 1, 'GEO altitude');
  near(Math.sqrt(C.muE / aG), 3074.7, 0.5, 'GEO speed');
  // the Earth's rotation rate in Phys.C is the sidereal one
  near(2 * Math.PI / C.omegaE, ch.SIDEREAL_DAY, 1, 'sidereal day');
});

test('Kepler equation: solve, convert, round trip; hyperbolic solver', () => {
  for (const e of [0, 0.1, 0.7, 0.97]) for (let M = -3; M < 10; M += 0.37) {
    const E = Phys.solveKepler(M, e), Mw = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    near(E - e * Math.sin(E), Mw, 1e-9, `M for e=${e}`);
    const nu = Phys.trueFromEcc(E, e);
    near(Math.cos(Phys.eccFromTrue(nu, e) - E), 1, 1e-9, 'E from nu');
  }
  for (const e of [1.01, 1.5, 4]) for (const M of [-20, -1, 0, 0.3, 5, 100]) {
    const F = ch.solveHyperbolic(M, e);
    near(e * Math.sinh(F) - F, M, 1e-7 * Math.max(1, Math.abs(M)), `hyperbolic e=${e} M=${M}`);
  }
});

test('lab presets do what their buttons promise', () => {
  assert.deepEqual(Object.keys(PRESETS), ['gto', 'molniya', 'tli', 'hyp']);   // no circular preset: circles are designed by hand
  const gto = elOf(PRESETS.gto), mol = elOf(PRESETS.molniya);
  near((gto.ra - C.RE) / 1e3, 35786, 10, 'GTO apogee at geostationary altitude');
  near(mol.T, ch.SIDEREAL_DAY / 2, 60, 'Molniya: half a sidereal day');
  near((mol.ra - C.RE) / 1e3, 39770, 50, 'Molniya apogee');
  assert.ok(elOf(PRESETS.tli).e < 1 && elOf(PRESETS.tli).ra > C.DEM, 'after TLI the two-body apogee is beyond the Moon');
  assert.ok(elOf(PRESETS.hyp).e > 1 && elOf(PRESETS.hyp).eps > 0);
  // every preset clears the Earth
  for (const [k, p] of Object.entries(PRESETS)) assert.ok(elOf(p).rp > C.RE + 100e3, k);
  // two-body speed at the Apollo 11 TLI burnout point (≈ 10.84 km/s at 330 km) is below escape
  assert.ok(PRESETS.tli.v < Math.sqrt(2 * C.muE / (C.RE + PRESETS.tli.h * 1e3)) / 1e3);
  // geostationary by hand, as the text says: 35 786 km at about 3.075 km/s takes one sidereal day
  near(elOf({ h: 35786, v: 3.0747, phi: 0 }).T, ch.SIDEREAL_DAY, 30, 'geostationary period');
  // Apollo 11 parking orbit 183 x 186 km: e ≈ 0.0002
  near((186 - 183) / (2 * 6378 + 369), 0.0002, 0.00005, 'parking e');
});

test('objectives are reachable with the sliders: circle (e < 0.01) and apogee at geostationary altitude', () => {
  // slider ranges from the markup: h 100–40 000 km (step 1), v 2.5–13 km/s (step 0.0005), γ −60…60°
  const vc = (h) => Math.round(Math.sqrt(C.muE / (C.RE + h * 1e3)) / 1e3 / 0.0005) * 0.0005;
  for (const h of [100, 185, 1000, 20000, 40000]) assert.ok(elOf({ h, v: vc(h), phi: 0 }).e < 0.01, `circle at ${h} km`);
  // GEO apogee from 250 km: needs v ≈ 10.195 km/s, inside the slider range
  const rp = C.RE + 250e3, ra = C.RE + 35786e3, a = (rp + ra) / 2, v = Math.sqrt(C.muE * (2 / rp - 1 / a)) / 1e3;
  assert.ok(v > 2.5 && v < 13);
  assert.ok(elOf({ h: 250, v: Math.ceil(v / 0.0005) * 0.0005, phi: 0 }).ra - C.RE >= 35786e3);
});

test('a preset plus a nudge is not a design by hand; the starting state and a real design are', () => {
  const st = (h, v, phi) => ({ 'od-h': h, 'od-v': v, 'od-phi': phi });
  for (const p of Object.values(ch.DESIGNER_PRESETS)) {
    assert.ok(ch.nearPreset(p));
    assert.ok(ch.nearPreset({ ...p, 'od-v': p['od-v'] + 0.02 }), 'one speed nudge');
    assert.ok(ch.nearPreset({ ...p, 'od-h': p['od-h'] + 10 }), 'one altitude nudge');
  }
  assert.ok(!ch.nearPreset(st(300, 9.2, 5)), 'starting state');
  assert.ok(!ch.nearPreset(st(300, 10.18, 0)), 'GTO designed from the starting altitude');
  assert.ok(elOf({ h: 300, v: 10.18, phi: 0 }).ra - C.RE >= 35786e3);
});

test('orbits practice: generators match independent hand calculations, quiz keys', () => {
  const p = topic('orbits');
  checkGenerators(p, 100); checkQuiz(p);
  const MU = 398600.4418, RE = 6378.137, num = (s, re) => parseFloat(s.match(re)[1]);
  for (const g of p.gens) for (let i = 0; i < 60; i++) {
    const x = g.make();
    if (g.title === 'Orbital period') { const h = num(x.q, /<b>(\d+) km<\/b>/); near(x.answer, 2 * Math.PI * Math.sqrt((RE + h) ** 3 / MU) / 60, 1e-9, 'T'); }
    if (g.title === 'Eccentricity from apsides') { const hp = num(x.q, /perigee altitude of <b>(\d+) km/), ha = num(x.q, /apogee altitude of <b>(\d+) km/); near(x.answer, (ha - hp) / (ha + hp + 2 * RE), 1e-9, 'e'); }
    if (g.title === 'Vis-viva at perigee') { const hp = num(x.q, /perigee altitude <b>(\d+) km/), ha = num(x.q, /apogee altitude <b>(\d+) km/); const rp = RE + hp, ra = RE + ha; near(x.answer, Math.sqrt(MU * (2 / rp - 2 / (rp + ra))), 1e-9, 'vp'); }
    if (g.title === 'Angular momentum at apogee') {
      const hp = num(x.q, /altitude (\d+) km\) at/), vp = num(x.q, /<b>([\d.]+) km\/s<\/b>/), ha = num(x.q, /apogee altitude is (\d+) km/);
      near(x.answer, vp * (RE + hp) / (RE + ha), 2e-3, 'va (vp is shown rounded)');
      near(vp, Math.sqrt(MU * (2 / (RE + hp) - 2 / (2 * RE + hp + ha))), 1e-3, 'vp');
    }
    if (g.title === 'Specific mechanical energy') { const h = num(x.q, /at (\d+) km altitude/), v = num(x.q, /<b>([\d.]+) km\/s<\/b>/); near(x.answer, v * v / 2 - MU / (RE + h), 1e-6, 'eps'); }
    if (g.title.startsWith('Time of flight')) {
      const hp = num(x.q, /perigee altitude (\d+) km/), ha = num(x.q, /apogee altitude (\d+) km/), nu = num(x.q, /anomaly of <b>(\d+)°/) * Math.PI / 180;
      const rp = RE + hp, ra = RE + ha, a = (rp + ra) / 2, e = (ra - rp) / (ra + rp);
      // independent route: integrate the area law numerically (equal areas): t = ∫ r² dν / h
      const h = Math.sqrt(MU * a * (1 - e * e)), N = 20000; let t = 0;
      for (let k = 0; k < N; k++) { const n = nu * (k + 0.5) / N, r = a * (1 - e * e) / (1 + e * Math.cos(n)); t += r * r * nu / N / h; }
      near(x.answer, t / 60, 1e-4 * t / 60, 'time of flight');
    }
  }
});
