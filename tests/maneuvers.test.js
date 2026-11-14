// TM-5 Orbital manoeuvres (js/ch/maneuvers.js): numbers quoted in the text, figures, practice of the topics maneuvers.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs');
const { loadChapter, Phys } = require('./helpers/chapter.js');
const { makeEnv } = require('./helpers/appenv.js');
const { figPlaneTriangle, figBiElliptic, figHohmann } = loadChapter('maneuvers', ['figPlaneTriangle', 'figBiElliptic', 'figHohmann']);
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x} vs text ${want}`);
const mu = 398600.4418, RE = 6378.137, D = Math.PI / 180;
const cos = (a, b, d) => Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(d));

test('5.2 GEO transfer numbers (the figure here, the full plan in planes 11.4)', () => {
  const r1 = RE + 185, r2 = RE + 35786, at = (r1 + r2) / 2, di = 28.5 * D;
  const v1 = Math.sqrt(mu / r1), vtp = Math.sqrt(mu * (2 / r1 - 1 / at)), vta = Math.sqrt(mu * (2 / r2 - 1 / at)), v2 = Math.sqrt(mu / r2);
  near(2 * v1 * Math.sin(di / 2), 3.84, 0.005, 'turn at 7.8 km/s');
  near(vtp - v1, 2.46, 0.005, 'burn 1');
  near(vta, 1.60, 0.005, 'speed at apogee'); near(v2, 3.07, 0.005, 'GEO speed');
  const comb = cos(vta, v2, di);
  near(comb, 1.84, 0.005, 'combined burn'); near(v2 - vta, 1.48, 0.005, 'circularize'); near(2 * v2 * Math.sin(di / 2), 1.51, 0.005, 'turn at GEO');
  near(Math.atan2(v2 * Math.sin(di), v2 * Math.cos(di) - vta) / D, 53, 0.5, 'burn direction out of plane');
  near(vtp - v1 + comb, 4.30, 0.005, 'total');
  near((v2 - vta) + 2 * v2 * Math.sin(di / 2), 2.99, 0.005, 'circularize then turn (dashed path)');
  // moving about 2° of the tilt into burn 1 saves 24 m/s (best split near 2.2°)
  let best = [1e9, 0];
  for (let d = 0; d <= 8; d += 0.01) { const t = cos(v1, vtp, d * D) + cos(vta, v2, di - d * D); if (t < best[0]) best = [t, d]; }
  near((vtp - v1 + comb - best[0]) * 1000, 24, 1, 'saving of the split'); near(best[1], 2, 0.5, 'split angle');
  // the figure's constants are the same numbers
  const svg = figPlaneTriangle();
  assert.ok(!/NaN|undefined|Infinity/.test(svg));
  assert.ok(svg.includes('1.84') && svg.includes('2.99'));
});

test('5.4 bi-elliptic thresholds: 11.94 and 15.58', () => {
  const hoh = (R) => { const at = (1 + R) / 2; return Math.sqrt(2 - 1 / at) - 1 + Math.sqrt(1 / R) - Math.sqrt(2 / R - 1 / at); };
  const bi = (R, rb) => { const a1 = (1 + rb) / 2, a2 = (R + rb) / 2;
    return Math.sqrt(2 - 1 / a1) - 1 + Math.sqrt(2 / rb - 1 / a2) - Math.sqrt(2 / rb - 1 / a1) + Math.sqrt(2 / R - 1 / a2) - Math.sqrt(1 / R); };
  assert.ok(bi(11.8, 1e6) > hoh(11.8) && bi(12.1, 1e6) < hoh(12.1), 'with rb far out the break-even is 11.94');
  assert.ok(bi(15.4, 1.01 * 15.4) > hoh(15.4) && bi(15.8, 1.01 * 15.8) < hoh(15.8), 'above 15.58 any rb > r2 wins');
  assert.ok(bi(13, 1.5 * 13) > hoh(13) && bi(13, 1e5) < hoh(13), 'between: only a far rb wins');
  assert.ok(bi(13.25, 3 * 13.25) > hoh(13.25) && bi(13.35, 3 * 13.35) < hoh(13.35), 'the lab’s rb = 3 r2 wins above about 13.3');
});

test('5.5 lunar rendezvous lead angle and the Hohmann time', () => {
  const a = Phys.C.RM + 18e3, b = Phys.C.RM + 111e3, at = (a + b) / 2, muM = Phys.C.muM;
  const tof = Math.PI * Math.sqrt(at ** 3 / muM), lead = Math.PI - Math.sqrt(muM / b ** 3) * tof;
  assert.ok(lead > 0 && lead / D < 20, `lead ${lead / D}`);
});

test('figures have no NaN', () => {
  for (const f of [figBiElliptic, figHohmann]) assert.ok(!/NaN|undefined|Infinity/.test(f()));
});

test('planner objectives come only from a typed plan that matches, never after "Show the solution"', () => {
  const src = fs.readFileSync(require('path').join(__dirname, '../js/ch/maneuvers.js'), 'utf8');
  const check = src.indexOf("'#mv-check').addEventListener"), peek = src.indexOf('if (peeked) return;', check);
  const done = [...src.matchAll(/Progress\.done\('maneuvers'/g)].map((m) => m.index);
  assert.equal(done.length, 2);
  for (const i of done) assert.ok(i > peek && peek > check, 'credit after the check and the peek guard');
  assert.ok(/okDv && plan\.geo/.test(src) && /okAl && plan\.lor/.test(src));
});

test('practice generators and concept questions of the topic maneuvers', () => {
  const { Practice } = makeEnv();
  const gens = Practice.GEN.filter((g) => g.topic === 'maneuvers'), quiz = Practice.QUIZ.filter((q) => q.topic === 'maneuvers');
  require('./helpers/practice.js').checkGenerators({ gens });
  require('./helpers/practice.js').checkQuiz({ quiz });
  // answers recomputed by hand: 400 km to GEO Hohmann Δv = 3.85 km/s; lunar lead angle > 0
  for (const g of gens) for (let i = 0; i < 30; i++) {
    const p = g.make();
    if (g.title === 'Hohmann transfer Δv') assert.ok(p.answer > 0.3 && p.answer < 5, `Hohmann ${p.answer}`);
    if (g.title === 'Rendezvous phase angle') assert.ok(p.answer > 3 && p.answer < 12, `lead ${p.answer}`);
    if (g.title === 'Simple plane change') assert.ok(p.answer < 5.5);
  }
});
