// Loads js/practice.js in Node (browser globals stubbed) and returns the generators and concept questions of one topic
// in the shape tests/helpers/practice.js expects: { topic, gens, quiz }. Not a test file (not matched by *.test.js).
// UI.fmt is a plain toFixed here (no digit grouping), so numbers in the question text can be parsed back.
const fs = require('fs'), path = require('path'), vm = require('vm');
const Phys = require('../../js/physics.js');
const any = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : any), apply: () => any });
const tag = (s, ...v) => (typeof s === 'string' ? s.replace(/\{\$(\d+)\}/g, (m, i) => v[+i]) : s.reduce((a, x, i) => a + x + (i < v.length ? v[i] : ''), ''));
let P = null;
function loadPractice() {
  if (P) return P;
  const UI = new Proxy({ fmt: (x, d = 0) => Number(x).toFixed(d), dec: (x) => String(x) }, { get: (t, k) => (k in t ? t[k] : any) });
  const ctx = { T: tag, N: tag, Phys, Math, JSON, console, App: any, UI, Progress: any, Sym: any, document: any, I18N: any, Primer: any };
  ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  const file = path.join(__dirname, '../../js/practice.js');
  vm.runInContext(fs.readFileSync(file, 'utf8') + '\n;globalThis.__P = Practice;', ctx, { filename: file });
  return (P = ctx.__P);
}
function topic(name) {
  const p = loadPractice();
  return { topic: name, gens: p.GEN.filter((g) => g.topic === name), quiz: p.QUIZ.filter((q) => q.topic === name) };
}
module.exports = { topic };
