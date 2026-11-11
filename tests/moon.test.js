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
