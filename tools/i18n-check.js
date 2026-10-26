#!/usr/bin/env node
/* i18n checker.
   node tools/i18n-check.js keys <source.js>              list the translation keys used in a source file
   node tools/i18n-check.js check <lang> [<source.js>...] report missing keys (per source file) and unused keys
   Keys are built exactly like T does at runtime: template literal parts joined with {$0}, {$1}… */
const fs = require('fs'), path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const ROOT = path.join(__dirname, '..');
const NAME = (f) => path.basename(f, '.js');

function keysOf(file) {
  const src = fs.readFileSync(file, 'utf8');
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
  const out = [];
  const tpl = (q) => q.quasis.map((x, i) => x.value.cooked + (i < q.quasis.length - 1 ? `{$${i}}` : '')).join('');
  walk.full(ast, (n) => {
    if (n.type === 'TaggedTemplateExpression' && n.tag.type === 'Identifier' && (n.tag.name === 'T' || n.tag.name === 'N')) out.push({ key: tpl(n.quasi), line: n.loc.start.line });
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && (n.callee.name === 'T' || n.callee.name === 'N') && n.arguments[0]) {
      const a = n.arguments[0];
      if (a.type === 'Literal' && typeof a.value === 'string') out.push({ key: a.value, line: n.loc.start.line });
      else if (a.type === 'TemplateLiteral' && a.expressions.length === 0) out.push({ key: a.quasis[0].value.cooked, line: n.loc.start.line });
    }
  });
  return out.filter((k) => k.key.trim() !== '');
}

function dictOf(lang) {
  const all = {}, byFile = {};
  const dir = path.join(ROOT, 'js/i18n', lang);
  if (!fs.existsSync(dir)) return { all, byFile };
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    const got = {};
    const I18N = { add: (l, obj) => Object.assign(got, obj) };
    try { new Function('I18N', fs.readFileSync(path.join(dir, f), 'utf8'))(I18N); }
    catch (e) { console.log(`!! ${lang}/${f}: ${e.message}`); }
    byFile[NAME(f)] = got; Object.assign(all, got);
  }
  return { all, byFile };
}

const SOURCES = () => ['js/app.js', 'js/ui.js', 'js/progress.js', 'js/practice.js', 'js/symbols.js', 'js/primers.js', 'js/history.js', ...fs.readdirSync(path.join(ROOT, 'js/ch')).map((f) => 'js/ch/' + f)]
  .map((f) => path.join(ROOT, f));

const [cmd, a1, ...rest] = process.argv.slice(2);
if (cmd === 'keys') {
  for (const k of keysOf(path.resolve(a1))) console.log(`${k.line}\t${JSON.stringify(k.key)}`);
} else if (cmd === 'check') {
  const lang = a1, files = rest.length ? rest.map((f) => path.resolve(f)) : SOURCES();
  const { all } = dictOf(lang);
  let missing = 0;
  const used = new Set();
  for (const f of SOURCES()) for (const k of keysOf(f)) used.add(k.key);
  for (const f of files) {
    const ks = keysOf(f), miss = ks.filter((k) => !(k.key in all));
    missing += miss.length;
    console.log(`${path.relative(ROOT, f)}: ${ks.length} keys, ${miss.length} missing in ${lang}`);
    for (const m of miss.slice(0, 400)) console.log(`   line ${m.line}: ${JSON.stringify(m.key).slice(0, 160)}`);
    // placeholder sanity: translations must keep the same {$n} placeholders
    for (const k of ks) if (k.key in all) {
      const ph = (s) => (s.match(/\{\$\d+\}/g) || []).sort().join();
      if (ph(k.key) !== ph(all[k.key])) console.log(`   PLACEHOLDER MISMATCH line ${k.line}: ${JSON.stringify(k.key).slice(0, 100)}`);
    }
  }
  if (!rest.length) {
    const unused = Object.keys(all).filter((k) => !used.has(k));
    console.log(`unused ${lang} keys (not found in any T/N call): ${unused.length}`);
    for (const u of unused.slice(0, 50)) console.log('   ' + JSON.stringify(u).slice(0, 140));
  }
  console.log(`TOTAL missing in ${lang}: ${missing}`);
} else console.log('usage: keys <file> | check <lang> [files...]');
