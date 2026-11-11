// Every visible English string has a fr and a de entry (tools/i18n-check.js), except in chapters still being
// written: translations come last (CLAUDE.md), so list a source file in WIP while its English is not validated.
const test = require('node:test'), assert = require('node:assert/strict');
const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const WIP = ['js/ch/descent.js'];   // e.g. 'js/ch/descent.js'

const sources = [...fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).map((f) => 'js/' + f),
  ...fs.readdirSync(path.join(ROOT, 'js/ch')).filter((f) => f.endsWith('.js')).map((f) => 'js/ch/' + f)].filter((f) => !WIP.includes(f));

for (const lang of ['fr', 'de']) test(`all validated sources are translated in ${lang}`, () => {
  const out = execFileSync('node', ['tools/i18n-check.js', 'check', lang, ...sources], { cwd: ROOT }).toString();
  const total = out.match(new RegExp(`TOTAL missing in ${lang}: (\\d+)`));
  assert.ok(total, 'checker printed a total');
  assert.ok(!/PLACEHOLDER MISMATCH/.test(out), out.split('\n').filter((l) => /PLACEHOLDER/.test(l)).join('\n'));
  assert.equal(+total[1], 0, out.split('\n').filter((l) => /missing|line \d+/.test(l)).slice(0, 15).join('\n'));
});
