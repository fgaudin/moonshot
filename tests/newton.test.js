// TM-1 Newton & Gravity (js/ch/newton.js).
const test = require('node:test'), assert = require('node:assert/strict');
const { loadChapter, Phys } = require('./helpers/chapter.js');
const ch = loadChapter('newton', ['figInertia', 'figMomentum', 'figSecondLaw', 'figThirdLaw', 'SCENES', 'ESC_TOL'], { Phys });

test('1.1 animated figures render at every moment without NaN', () => {
  for (const name of ['figInertia', 'figMomentum', 'figSecondLaw', 'figThirdLaw']) assert.ok(!/NaN|undefined/.test(ch[name]()), name);
  for (const [id, S] of Object.entries(ch.SCENES)) S.panels.forEach((P, i) => {
    for (let t = 0; t <= S.t1 + 1e-9; t += S.t1 / 50) {
      const s = P.scene(t);
      assert.ok(!/NaN|undefined/.test(s.svg + s.labels), `${id} panel ${i} at t=${t.toFixed(2)}`);
    }
  });
});

test('momentum figure: top carts stop dead, bottom ones move on the heavy cart’s way', () => {
  const M = ch.SCENES.momentum, end = M.panels.map((P) => P.scene(M.t1).labels).join('');
  assert.match(end, /together: p = 0 kg·m\/s/);
  assert.match(end, /together: p = −2 kg·m\/s/);
  assert.match(end, /stopped/);
});

// ---- numbers quoted in the text, constants, practice (added in the full review) ----
const { C } = Phys;
const { checkGenerators, checkQuiz } = require('./helpers/practice.js');
const { topic } = require('./helpers/practiceTopic.js');
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x}, text says ${want}`);

test('1.1–1.3 numbers quoted in the text', () => {
  near(45e3 * 7800, 3.5e8, 0.05e8, 'momentum of a 45 t spacecraft at 7.8 km/s');
  const g = (h) => C.g0 * (C.RE / (C.RE + h)) ** 2;
  near(g(400e3), 8.7, 0.05, 'g at 400 km');
  near(100 * g(400e3) / C.g0, 89, 0.6, 'percent of surface gravity at 400 km');
  near(C.muE, 3.986004e14, 5e8, 'mu of Earth');
  assert.equal(C.g0, 9.80665);
  assert.equal(1687 + 270, 1957);
  // escape speed is sqrt(2) times circular speed at any radius, and the 0.1% window is about 11 m/s in low orbit
  for (const r of [C.RE, C.RE + 300e3, C.RE + 3000e3]) near(Math.sqrt(2 * C.muE / r) / Math.sqrt(C.muE / r), Math.SQRT2, 1e-12, 'ratio');
  near(ch.ESC_TOL * Math.sqrt(2 * C.muE / (C.RE + 300e3)), 11, 1, 'ESC_TOL in m/s');
});

test('cannon lab: the speed slider (0.01 km/s steps) can reach a circle and the parabola band at any height', () => {
  // the candidate sets the speed by hand (no preset buttons): the nearest slider step must classify as circle / parabola
  for (const h of [0, 300e3, 3000e3]) {
    const r = C.RE + h, vc = Math.sqrt(C.muE / r), ve = Math.sqrt(2 * C.muE / r);
    const vr = Number((vc / 1000).toFixed(2)) * 1000, er = Number((ve / 1000).toFixed(2)) * 1000;
    const el = Phys.elementsFromRV(r, vr, 0, C.muE);
    assert.ok(el.e < 0.005, `circular speed at h=${h / 1e3} km: e=${el.e}`);
    assert.ok(el.rp >= C.RE * 0.999, 'circular speed does not graze the Earth');
    assert.ok(er >= ve * (1 - ch.ESC_TOL) && er <= ve * (1 + ch.ESC_TOL), `escape speed at h=${h / 1e3} km is inside the parabola band`);
  }
  // slider range covers the escape speed from the highest mountain
  assert.ok(Math.sqrt(2 * C.muE / C.RE) / 1000 < 12.5);
});

test('1.1 figure arithmetic quoted in the alt text', () => {
  // inertia: 60 m/s coasting, engine from 4 s at 30 m/s²: steps of 75, 105, 135 m
  const pos = (t) => (t <= 4 ? 60 * t : 240 + 60 * (t - 4) + 15 * (t - 4) ** 2);
  assert.deepEqual([5, 6, 7].map((t) => pos(t) - pos(t - 1)), [75, 105, 135]);
  assert.equal(pos(4) - pos(3), 60);
  // momentum: 1 kg·4 m/s against 2 kg·(−2 m/s); 1·2 against 2·(−2)
  assert.equal(1 * 4 + 2 * -2, 0);
  near((1 * 2 + 2 * -2) / 3, -2 / 3, 1e-12, 'bottom pair velocity');
  // second law boxes: 2/1, 4/1, 2/2
  assert.deepEqual([[2, 1], [4, 1], [2, 2]].map(([F, m]) => F / m), [2, 4, 1]);
});

test('newton practice: generators match independent hand calculations, quiz keys', () => {
  const p = topic('newton');
  checkGenerators(p, 100); checkQuiz(p);
  const num = (s, re) => parseFloat(s.match(re)[1]);
  for (const g of p.gens) for (let i = 0; i < 60; i++) {
    const x = g.make();
    if (g.title === 'Gravity at altitude') { const h = num(x.q, /<b>([\d.]+) km<\/b>/); near(x.answer, 9.80665 * (6378.137 / (6378.137 + h)) ** 2, 1e-9, 'g(h)'); }
    if (g.title === 'Circular orbital speed') { const h = num(x.q, /<b>([\d.]+) km<\/b>/); near(x.answer, Math.sqrt(398600.4418 / (6378.137 + h)), 1e-9, 'vc'); assert.ok(x.answer > 3 && x.answer < 8); }
    if (g.title === 'Escape velocity') { const mu = num(x.q, /μ = ([\d.]+) km/), r = num(x.q, /R = ([\d.]+) km/); near(x.answer, Math.sqrt(2 * mu / r), 1e-4, 'vesc'); }
    if (g.title === 'Surface gravity of another world') { const mu = num(x.q, /mu = ([\d.]+)\\ /), r = num(x.q, /radius of ([\d.]+) km/); near(x.answer, mu / r / r * 1000, 1e-4, 'g'); }
    if (g.title === 'Weight on the Moon') { const m = num(x.q, /<b>([\d.]+) kg<\/b>/); near(x.answer, m * 4902.8 / 1737.4 ** 2 * 1000, 1e-9, 'W'); assert.ok(m >= 150 && m <= 200); }
  }
});
