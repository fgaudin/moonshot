// Loads a chapter file (js/ch/<id>.js) in Node and returns some of its private top-level names.
// The browser globals it touches (App, UI, Progress, …) are stubbed; T`` and N`` return the English string.
// Usage: const { PRESETS } = loadChapter('freereturn', ['PRESETS']);
const fs = require('fs'), path = require('path'), vm = require('vm');
const Phys = require('../../js/physics.js');

const tag = (s, ...v) => s.reduce((a, x, i) => a + x + (i < v.length ? v[i] : ''), '');
// a stub that accepts any property access and any call, and turns into '' in a string
const any = new Proxy(function () {}, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : any),
  apply: () => any,
});

function loadChapter(id, names) {
  const file = path.join(__dirname, '../../js/ch', id + '.js');
  const src = fs.readFileSync(file, 'utf8'), end = src.lastIndexOf('})();');
  if (end < 0) throw new Error(`${id}.js: no closing })(); found`);
  const hook = `\n;globalThis.__exports = { ${names.join(', ')} };\n`;
  const ctx = {
    T: tag, N: tag, Phys, Math, JSON, console,
    App: any, UI: { ...stubUI() }, Progress: any, Sym: any, Practice: any, MoonLab: any, Glossary: any, I18N: any,
    document: any, performance: { now: () => 0 }, requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(src.slice(0, end) + hook + src.slice(end), ctx, { filename: file });
  return ctx.__exports;
}
// the few UI helpers whose result matters in figures; everything else is a no-op stub
function stubUI() {
  return new Proxy({ fmt: (x, d = 0) => Number(x).toFixed(d), reducedMotion: () => true }, { get: (t, k) => (k in t ? t[k] : any) });
}

module.exports = { loadChapter, Phys };
