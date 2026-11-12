const test = require('node:test');
const assert = require('node:assert');
const { loadChapter } = require('./helpers/chapter.js');
const { checkGenerators } = require('./helpers/practice.js');

test('TM-19 practice generators produce finite answers with a solution', () => {
  const { practice } = loadChapter('mcc', [], { Phys_mcc: require('../js/ch/mcc.phys.js') });
  checkGenerators(practice, 20);
  const g = practice.gens.find((x) => x.title === 'Time out of contact behind the Moon');
  assert.ok(g, 'loss-of-signal generator registered');
  for (let i = 0; i < 20; i++) { const p = g.make(); assert.ok(p.answer > 40 && p.answer < 50, `${p.answer} min`); }
});
