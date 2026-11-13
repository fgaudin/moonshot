// TM-13 Going to the Moon (js/ch/moon.js) and the shared lab (MoonLab).
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const { MCC_T } = require('./helpers/lab.js');

test('tests/helpers/lab.js still mirrors MoonLab (MCC time and corridor)', () => {
  const src = fs.readFileSync(path.join(__dirname, '../js/ch/moon.js'), 'utf8');
  assert.match(src, /const MCC_T = 26\.7 \* 3600;/);
  assert.equal(MCC_T, 26.7 * 3600);
  assert.match(src, /const inCorridor = \(s\) => s\.outcome === 'entry' && s\.retAlt >= 20e3 && s\.retAlt <= 65e3 && s\.minM\.alt < 20000e3;/);
});

test('practice generators and concept questions are well formed', () => {
  const { practice } = require('./helpers/chapter.js').loadChapter('moon', []);
  require('./helpers/practice.js').checkGenerators(practice);
  require('./helpers/practice.js').checkQuiz(practice);
});

// ---- numbers quoted in the text of module 13 ----
const { Phys } = require('./helpers/chapter.js');
const { loadChapter } = require('./helpers/chapter.js');
const { fly, km } = require('./helpers/lab.js');
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x}, text says ${want}`);

test('13.1 sphere of influence and 13.2 Hohmann-like TLI', () => {
  near(Phys.R_SOI / 1e3, 66183, 1, 'r_SOI');
  const rp = 6563e3, ra = Phys.C.DEM, vp = Math.sqrt(Phys.C.muE * (2 / rp - 2 / (rp + ra)));
  near(vp / 1e3, 10.93, 0.005, 'v_p'); near((vp - Math.sqrt(Phys.C.muE / rp)) / 1e3, 3.14, 0.01, 'Δv TLI');
});

test('13.3 the lab’s transfer: r1, γ1, v_sc, φ1, θ, v_rel, v∞ (rounding of λ1 and v0 in the text allowed)', () => {
  const { muE, muM } = Phys.C, D = Phys.C.DEM, soi = Phys.R_SOI, l = 43.3 * Math.PI / 180, r0 = 6563e3, v0 = 10953;
  const r1 = Math.sqrt(D * D + soi * soi - 2 * D * soi * Math.cos(l)), g = Math.asin(soi / r1 * Math.sin(l));
  const vsc = Math.sqrt(v0 * v0 - 2 * muE / r0 + 2 * muE / r1), phi = Math.acos(r0 * v0 / (r1 * vsc)), vm = 1024.5, th = phi - g;
  const vrel = Math.sqrt(vsc * vsc + vm * vm - 2 * vsc * vm * Math.cos(th));
  near(r1 / 1e3, 339298, 50, 'r1'); near(g * 180 / Math.PI, 7.7, 0.05, 'γ1'); near(vsc / 1e3, 0.924, 0.005, 'v_sc');
  near(phi * 180 / Math.PI, 76.8, 0.2, 'φ1'); near(th * 180 / Math.PI, 69.1, 0.2, 'θ'); near(vrel / 1e3, 1.108, 0.005, 'v_rel');
  const vinf = Math.sqrt(vrel * vrel - 2 * muM / soi);
  near(vinf / 1e3, 1.039, 0.005, 'v∞'); near(vrel / vinf, 1.07, 0.005, '“7% too high”');
});

test('13.4 aim offset: b = 4 494 km for 110 km, 4 336 km hits the Moon (2.5 R☾)', () => {
  const muM = Phys.C.muM, vinf = 1039, RM = Phys.C.RM, b = (rp) => rp * Math.sqrt(1 + 2 * muM / (rp * vinf * vinf));
  near(b(RM + 110e3) / 1e3, 4494, 1, 'b'); near(b(RM) / 1e3, 4336, 1, 'b of impact'); near(b(RM) / RM, 2.5, 0.01, 'ratio');
  near(2 * muM / ((RM + 110e3) * vinf ** 2), 4.92, 0.01, 'k');
});

test('13.5 LOI period behind the Moon and Apollo 11 burn', () => {
  const L = Phys.lunarLOS(110e3);
  near(L.P / 60, 119, 0.5, 'period'); near(L.t / 60, 46, 0.5, 'minutes behind the Moon');
});

test('13.6 lab scenarios do what the steps say', () => {
  const { PRESETS } = loadChapter('moon', ['PRESETS']);
  const cap = Phys.simulatePatched({ dv: PRESETS.capture.dv, burnAngle: PRESETS.capture.ang, mcc: { t: 26.7 * 3600, dv: 0 }, loi: { dv: PRESETS.capture.loiDv } });
  assert.equal(cap.outcome, 'lunarOrbit'); near(km(cap.minM.alt), 90, 1, 'capture low point');
  assert.equal(fly(PRESETS.impact).outcome, 'impact');
  assert.equal(fly(PRESETS.flyby).outcome, 'entry');
  assert.notEqual(fly(PRESETS.miss).outcome, 'impact');
  // the Apollo band 100–300 km is reachable with the TLI-point slider (step 0.01° or finer)
  let hit = 0; for (let a = -132.6; a <= -132.3; a += 0.01) { const s = fly({ ...PRESETS.flyby, ang: a }); if (s.outcome !== 'impact' && s.minM.alt >= 100e3 && s.minM.alt <= 300e3) hit++; }
  assert.ok(hit >= 3, 'band reachable');
});
