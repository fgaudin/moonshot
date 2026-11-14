// TM-16 Landing on the Moon (js/ch/landing.js): numbers quoted in the text and the lab, practice problems of topic 'landing'.
const test = require('node:test'), assert = require('node:assert/strict');
const { makeEnv } = require('./helpers/appenv.js');
const { checkGenerators, checkQuiz } = require('./helpers/practice.js');
const Phys = require('../js/physics.js');
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x}, text says ${want}`);
const G0 = 9.80665, ISP = 311, F = 45040, GM = Phys.C.muM / (Phys.C.RM * Phys.C.RM);

test('9.3 LM table: masses add up, ascent stage numbers', () => {
  assert.equal(2030 + 8200 + 2450 + 2350, 15030);
  // the lab lander: 8 t with 500 kg of propellant at the start
  near(GM, 1.624, 0.001, 'lunar g');
  // ascent stage: 4 800 kg with 2 350 kg of propellant gives about 2 050 m/s, more than the ~1 850 m/s needed
  const dv = ISP * G0 * Math.log(4800 / 2450);
  assert.ok(dv > 1850 && dv < 2150, `ascent Δv ${dv}`);
  // the 7-minute burn: 15.6 kN with 2 350 kg of propellant
  near(2350 * ISP * G0 / 15600 / 60, 7.9, 0.6, 'APS burn time, min');   // full tank; the real burn used less
});

test('9.1 powered descent: lab lander numbers (hover time, thrust-to-weight)', () => {
  // gravity loss: one second of hovering costs g☾ of Δv
  near(GM, 1.62, 0.01, 'g☾ in the text');
  // lab start: 8 t, 500 kg: hover time left (formula of the text)
  // the lab readout uses the log form of the text, like the practice problem: 121 s (the linear form would give 117 s)
  near(ISP * G0 / GM * Math.log(8000 / 7500), 121, 1, 'log form');
  assert.match(require('fs').readFileSync(require('path').join(__dirname, '../js/ch/landing.js'), 'utf8'), /hoverLeft = \(\) => DPS\.isp \* C\.g0 \/ GM \* Math\.log\(S\.m \/ \(S\.m - S\.prop\)\)/);
  // thrust range 10–60 % and 100 %: T/W at 8 t
  near(F * 0.1 / (8000 * GM), 0.35, 0.01, 'T/W at 10 %'); near(F * 0.6 / (8000 * GM), 2.08, 0.01, 'T/W at 60 %'); near(F / (8000 * GM), 3.47, 0.01, 'T/W at 100 %');
  // the 8 t lander can hover at 10 % ... 60 %: hover throttle is below the minimum? (it is: 8000 × 1.624 / 45040 = 28.8 %)
  near(8000 * GM / F * 100, 28.8, 0.1, 'hover throttle');
});

test('9.1 the lab start is a landing the pilot must act on: 40 % thrust does not land by itself', () => {
  // replica of the step loop of mountLander without input: sinking 12 m/s from 500 m at 40 %
  let S = { h: 500, vh: -12, m: 8000, prop: 500 };
  const dt = 1 / 240; let t = 0, crashed = false;
  while (t < 300) {
    const f = S.prop > 0 ? F * 0.4 : 0, md = f / (ISP * G0);
    S.vh += (f / S.m - GM) * dt; S.h += S.vh * dt; S.m -= md * dt; S.prop = Math.max(0, S.prop - md * dt); t += dt;
    if (S.h <= 0) { crashed = Math.abs(S.vh) >= 3; break; }
    if (S.h > 2500) break;
  }
  assert.ok(crashed || S.h > 0, 'doing nothing must not be a safe landing');
});

const env = makeEnv();
const practice = { gens: env.Practice.GEN.filter((g) => g.topic === 'landing'), quiz: env.Practice.QUIZ.filter((q) => q.topic === 'landing') };

test('9 practice (topic landing): generators and concept questions', () => {
  assert.equal(practice.gens.length, 4); assert.ok(practice.quiz.length >= 1);
  checkGenerators(practice); checkQuiz(practice);
  for (const q of practice.quiz) assert.equal(new Set(q.opts).size, q.opts.length);
});

test('9 practice: answers match an independent calculation', () => {
  for (let i = 0; i < 30; i++) {
    const by = (t) => practice.gens.find((g) => g.title === t).make();
    const hover = by('Hover time'), asc = by('LM ascent stage'), tw = by('Lunar thrust-to-weight'), price = by('The price of hovering');
    // independent check: Δv = g☾ t, then the rocket equation
    const t = +price.q.match(/<b>(\d+) s<\/b>/)[1], m = +price.q.match(/mass is ([\d\s ]+) kg/)[1].replace(/\D/g, '');
    assert.ok(Math.abs(price.answer - m * (1 - Math.exp(-1.624 * t / (311 * 9.80665)))) < 1e-6, `hover price ${price.answer}`);
    assert.ok(hover.answer > 40 && hover.answer < 200, `hover ${hover.answer}`);
    assert.ok(asc.answer > 1900 && asc.answer < 2200, `ascent Δv ${asc.answer}`);
    assert.ok(tw.answer > 0.1 && tw.answer < 6, `T/W ${tw.answer}`);
  }
});
