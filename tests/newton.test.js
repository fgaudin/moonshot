// TM-1 Newton & Gravity (js/ch/newton.js).
const test = require('node:test'), assert = require('node:assert/strict');
const { loadChapter, Phys } = require('./helpers/chapter.js');
const ch = loadChapter('newton', ['figInertia', 'figMomentum', 'figSecondLaw', 'figThirdLaw', 'SCENES'], { Phys });

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
