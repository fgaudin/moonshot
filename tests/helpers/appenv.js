// Loads the whole app (index.html script order) in a vm with a minimal fake browser, for tests of
// practice.js, progress.js, app.js, i18n.js, ui.js. Not a test file (not matched by *.test.js).
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '../..');

function makeEnv({ lang = 'en', storage = {}, throwingStorage = false, files } = {}) {
  const any = new Proxy(function () {}, {
    get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : k === 'length' ? 0 : any),
    apply: () => any, construct: () => any,
  });
  const store = { ...storage };
  const localStorage = throwingStorage
    ? { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } }
    : { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  const doc = new Proxy({ documentElement: { lang: '', dataset: {} }, getElementById: () => any, querySelectorAll: () => [], createElement: () => any }, { get: (t, k) => (k in t ? t[k] : any) });
  const ctx = {
    document: doc, localStorage, navigator: { language: lang, languages: [lang] }, console, Math, JSON, Date, Promise, Set, Map,
    setTimeout: () => 0, clearTimeout: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    location: { hash: '', search: '' }, matchMedia: undefined, ResizeObserver: any, URLSearchParams,
    Primer: undefined, MathJax: undefined,
  };
  ctx.addEventListener = () => {}; ctx.scrollY = 0; ctx.scrollTo = () => {};
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  const list = files || ['physics', 'i18n', 'ui', 'symbols', 'app', 'progress', 'primers', 'history', 'practice',
    ...fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/js\/ch\/[\w.]+\.js/g).map((s) => s.slice(3, -3)).map((s) => 'ch/' + s.slice(3)),
    'glossary'];
  const seen = new Set();
  for (const f of list) {
    if (seen.has(f)) continue; seen.add(f);
    const file = path.join(root, 'js', f + '.js');
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  }
  return { ctx, store, App: ctx.App, Progress: ctx.Progress, Practice: ctx.Practice, UI: ctx.UI, I18N: ctx.I18N, T: ctx.T, N: ctx.N };
}
module.exports = { makeEnv };
