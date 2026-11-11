// Shared checks for a chapter's practice generators (Practice.register in js/ch/<id>.js).
const assert = require('node:assert/strict');
function checkGenerators(practice, runs = 40) {
  assert.ok(practice && practice.gens.length, 'the chapter registers practice generators');
  for (const g of practice.gens) for (let i = 0; i < runs; i++) {
    const p = g.make();
    assert.ok(Number.isFinite(p.answer), `${g.title}: answer ${p.answer}`);
    assert.ok(p.q && p.sol && p.hint && p.unit, `${g.title}: question, hint, solution and unit`);
    assert.ok(!/NaN|undefined/.test(p.q + p.sol + p.hint), `${g.title}: NaN or undefined in the text`);
    assert.ok(Math.abs(p.answer) > 1e-3, `${g.title}: answer ${p.answer} too close to zero for a relative tolerance`);
  }
}
function checkQuiz(practice) {
  for (const q of practice.quiz) {
    assert.ok(q.q && q.why && Array.isArray(q.opts) && q.opts.length >= 3, `quiz "${q.q}": question, options and why`);
    assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < q.opts.length, `quiz "${q.q}": answer index ${q.a}`);
  }
}
module.exports = { checkGenerators, checkQuiz };
