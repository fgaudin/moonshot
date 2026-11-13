// Every practice generator and concept question, loaded through the whole app (tests/appenv.js).
const test = require('node:test'), assert = require('node:assert/strict');
const { makeEnv } = require('./helpers/appenv.js');
const env = makeEnv();
const { Practice, UI } = env;
const norm = (s) => s.replace(/[ \s]/g, '');
const RUNS = 60;

test('counts: generators and questions are registered, topics are known, no duplicate titles', () => {
  assert.ok(Practice.GEN.length >= 100 && Practice.QUIZ.length >= 50, `${Practice.GEN.length} / ${Practice.QUIZ.length}`);
  const seen = new Set();
  for (const g of Practice.GEN) {
    assert.ok(Practice.TOPICS[g.topic], 'topic ' + g.topic);
    const k = g.topic + '|' + g.title; assert.ok(!seen.has(k), 'duplicate ' + k); seen.add(k);
  }
  for (const q of Practice.QUIZ) assert.ok(Practice.TOPICS[q.topic], 'quiz topic ' + q.topic);
});

test('every generator: finite non-trivial answer, text complete, solution shows the answer, tolerance sensible', () => {
  const smallAnswer = {};
  for (const g of Practice.GEN) for (let i = 0; i < RUNS; i++) {
    const p = g.make(), id = `${g.topic}/${g.title}`;
    assert.ok(Number.isFinite(p.answer), `${id}: answer ${p.answer}`);
    assert.ok(p.q && p.sol && p.hint && typeof p.unit === 'string', id);
    assert.ok(!/NaN|undefined|Infinity|\[object/.test(p.q + p.sol + p.hint), `${id}: bad text`);
    assert.ok(Math.abs(p.answer) > 1e-3, `${id}: answer ${p.answer} ~ 0`);
    const tol = p.tol ?? 0.01; assert.ok(tol > 0 && tol <= 0.05, `${id}: tol ${tol}`);
    // the worked solution quotes the answer at some precision
    const sol = norm(p.sol);
    assert.ok([0, 1, 2, 3, 4].some((d) => sol.includes(norm(UI.fmt(p.answer, d))) || sol.includes(String(+p.answer.toFixed(d)))), `${id}: solution does not show ${p.answer}`);
    if (Math.abs(p.answer) < 0.5) smallAnswer[id] = (smallAnswer[id] || 0) + 1;
  }
});

test('hand-computed values', () => {
  const by = (title) => Practice.GEN.find((g) => env.T(g.title) === title);
  // circular speed at 400 km: sqrt(398600.4418/6778.137) = 7.6686 km/s (the generator picks the altitude itself)
  for (let i = 0; i < 30; i++) {
    const p = by('Circular orbital speed').make(); const h = +p.q.match(/<b>([\d  ]+) km/)[1].replace(/[  ]/g, '');
    assert.ok(Math.abs(p.answer - Math.sqrt(398600.4418 / (6378.137 + h))) < 1e-9);
  }
  for (let i = 0; i < 30; i++) {            // escape velocity: Earth 11.186, Moon 2.376
    const p = by('Escape velocity').make();
    assert.ok([11.186, 2.376, 5.027, 10.361].some((v) => Math.abs(p.answer - v) < 0.01), '' + p.answer);
  }
  for (let i = 0; i < 30; i++) {            // Apollo 11 TLI is about 3.1–3.2 km/s from a two-body apogee at the Moon's distance
    const p = by('Trans-lunar injection').make(); assert.ok(p.answer > 3.0 && p.answer < 3.2);
  }
});

test('concept questions: valid index, distinct options, explanation present', () => {
  for (const q of Practice.QUIZ) {
    assert.ok(q.q && q.why, q.q);
    assert.ok(Array.isArray(q.opts) && q.opts.length >= 3 && new Set(q.opts).size === q.opts.length, q.q);
    assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < q.opts.length, q.q);
    assert.ok(q.opts.every((o) => o && o.trim()), q.q);
  }
  // every topic that has generators also has at least one concept question except where noted
  const withGen = new Set(Practice.GEN.map((g) => g.topic));
  const noQuiz = [...withGen].filter((t) => !Practice.QUIZ.some((q) => q.topic === t));
  assert.deepEqual(noQuiz, []);
});
