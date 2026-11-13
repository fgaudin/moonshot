// progress.js, app.js ordering, i18n helpers, UI helpers, content tables (history, glossary, primers).
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const { makeEnv } = require('./helpers/appenv.js');
const env = makeEnv();
const { Progress, App, UI, I18N, T, N } = env;

test('module codes follow App.ORDER and the count is not hard-coded', () => {
  const mods = App.ORDER.filter((id) => Progress.MODULES[id]);
  assert.deepEqual(Progress.ORDER, mods);
  mods.forEach((id, i) => assert.equal(Progress.code(id), 'TM-' + (i + 1)));
  assert.equal(Progress.ORDER.length, mods.length); assert.ok(mods.length >= 19);
  assert.equal(App.sec('moon', 1), Progress.code('moon').replace('TM-', '') + '.1');
  for (const id of App.ORDER) assert.ok(env.App.chapters[id], 'chapter file registered: ' + id);
});

test('README module counts match the code', () => {
  const md = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8'), n = Progress.ORDER.length;
  assert.ok(md.includes(`TM-1 … TM-${n}`), 'TM range');
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  assert.ok(md.includes(`all ${words[n]} patches`), 'patch count word');
  const { Practice } = env;
  assert.ok(Practice.GEN.length > 100 && Practice.QUIZ.length > 50 && md.includes('over 100 problem generators') && md.includes('over 50 concept questions'), 'practice counts');
  assert.ok(md.includes(`${Object.keys(env.ctx.Primer.PRIMERS).length === 12 ? 'Twelve' : '??'} refreshers`));
  // every module chapter appears in the README table
  for (const id of Progress.ORDER) assert.ok(md.includes(env.App.chapters[id].title), id);
});

test('every module: unique objective ids, a qual objective whose topic has generators, a lab name, a glyph', () => {
  for (const id of Progress.ORDER) {
    const m = Progress.MODULES[id], ids = m.objectives.map((o) => o.id);
    assert.equal(new Set(ids).size, ids.length, id);
    assert.ok(ids.includes('qual'), id);
    assert.ok(env.Practice.GEN.some((g) => g.topic === m.topic), `${id}: topic ${m.topic}`);
    assert.equal(typeof App.chapters[id].lab, 'string', id);
    assert.ok(m.briefing && m.debrief && m.name);
  }
  const topics = Progress.ORDER.map((id) => Progress.MODULES[id].topic);
  assert.equal(new Set(topics).size, topics.length, 'one practice topic per module');
});

test('qualification is earned from practice scores, count/complete/totals/reset', () => {
  const e = makeEnv({ storage: { 'moonshot:stats': JSON.stringify({ newton: { tries: 3, right: 2 }, orbits: { tries: 3, right: 1 } }) } });
  e.Progress.checkQual();
  assert.ok(e.Progress.isDone('newton', 'qual')); assert.ok(!e.Progress.isDone('orbits', 'qual'));
  assert.equal(e.Progress.count('newton'), 1); assert.ok(!e.Progress.complete('newton'));
  const t = e.Progress.totals(); assert.equal(t.d, 1); assert.equal(t.patches, 0); assert.equal(t.n, e.Progress.ORDER.reduce((a, k) => a + e.Progress.MODULES[k].objectives.length, 0));
  assert.equal(e.Progress.nextModule(), e.Progress.ORDER[0]);
  e.Progress.reset(); assert.equal(e.Progress.count('newton'), 0);
  assert.equal(JSON.parse(e.store['moonshot:stats']) && Object.keys(JSON.parse(e.store['moonshot:stats'])).length, 0);
  assert.equal(e.Progress.count('nope'), 0); assert.equal(e.Progress.complete('nope'), false);
});

test('callsign: trimmed, limited, and never carries markup characters', () => {
  const e = makeEnv();
  e.Progress.setCallsign('  <img src=x onerror=1>Eagle-with-a-very-long-name-indeed  ');
  assert.ok(!/[<>]/.test(e.Progress.callsign())); assert.ok(e.Progress.callsign().length <= 24);
  e.Progress.setCallsign(''); assert.equal(e.Progress.hasCallsign(), false); assert.equal(e.Progress.callsign(), 'Candidate');
});

test('storage that throws does not break Progress, UI.store or I18N', () => {
  const e = makeEnv({ throwingStorage: true });
  assert.equal(e.UI.store.get('x', 7), 7); e.UI.store.set('x', 1);
  e.Progress.setCallsign('Eagle'); assert.equal(e.Progress.callsign(), 'Eagle');
  assert.equal(e.I18N.lang, 'en');
});

test('I18N: placeholders, decimal commas, language choice from the browser', () => {
  assert.equal(T`a ${1} b ${2}`, 'a 1 b 2'); assert.equal(T('x {$0} y {$1}', 'A', 'B'), 'x A y B');
  assert.equal(T('no placeholders {$0}'), 'no placeholders {$0}');
  assert.equal(T(null), null); assert.equal(N`a ${5} b`, 'a 5 b');
  const fr = makeEnv({ lang: 'fr-FR' });
  assert.equal(fr.I18N.lang, 'fr'); assert.equal(fr.I18N.decimalComma(), true);
  fr.I18N.add('fr', { 'a {$0} b': 'x {$0} y {$0}', 'Hi': '$& $1' });
  assert.equal(fr.T`a ${'<$&>'} b`, 'x <$&> y <$&>');      // replacement text is never interpreted
  assert.equal(fr.T('Hi'), '$& $1');
  assert.equal(fr.T('untranslated'), 'untranslated'); assert.ok(fr.I18N.missing.has('untranslated'));
  assert.equal(makeEnv({ lang: 'ja' }).I18N.lang, 'en');
  assert.equal(makeEnv({ lang: 'de', storage: { 'moonshot:lang': '"en"' } }).I18N.lang, 'en');   // the saved choice wins
  assert.equal(makeEnv({ storage: { 'moonshot:lang': 'not json{' }, lang: 'de' }).I18N.lang, 'de');
});

test('UI.fmt and UI.dec: grouping, decimals, decimal commas, non-finite values', () => {
  assert.equal(UI.fmt(1234567.891, 1), '1 234 567.9'); assert.equal(UI.fmt(0.5, 3), '0.500');
  assert.equal(UI.fmt(Infinity), '∞'); assert.equal(UI.fmt(NaN), '—'); assert.equal(UI.fmt(-1234.5, 0), '-1 235');
  const fr = makeEnv({ lang: 'fr' });
  assert.equal(fr.UI.fmt(1234.5, 2), '1 234,50'); assert.equal(fr.UI.dec('v = 7.79 km/s, 3.0.1'), 'v = 7,79 km/s, 3,0.1');
  assert.equal(UI.fmtTime(3661), '01:01:01'); assert.equal(UI.fmtTime(90061), '1d 01:01:01'); assert.equal(UI.fmtTime(-5), '−00:00:05'); assert.equal(UI.fmtTime(NaN), '—');
  assert.equal(UI.niceStep(100, 5), 20);
});

test('history capsules: image files exist and every file is used, credits are well formed', () => {
  const { CAPSULES } = env.ctx.Archive, dir = path.join(__dirname, '../img/history');
  for (const [k, c] of Object.entries(CAPSULES)) {
    assert.ok(fs.existsSync(path.join(dir, c.img + '.webp')), k);
    assert.ok(/^\d{4}(-\d{2}(-\d{2})?)?$/.test(c.date), k + ' date');
    assert.ok(c.title && c.alt && c.story && c.mission, k);
  }
  const used = new Set(Object.values(CAPSULES).map((c) => c.img + '.webp'));
  assert.deepEqual(fs.readdirSync(dir).filter((f) => !used.has(f)), []);
  for (const m of fs.readFileSync(path.join(__dirname, '../js/history.js'), 'utf8').matchAll(/Archive\.\w+\('(\w+)'\)/g)) assert.ok(CAPSULES[m[1]], m[1]);
  const uses = [...fs.readdirSync(path.join(__dirname, '../js/ch')).map((f) => fs.readFileSync(path.join(__dirname, '../js/ch', f), 'utf8'))].join('');
  for (const m of uses.matchAll(/Archive\.(?:capsule|photo|creditLink)\('(\w+)'\)/g)) assert.ok(CAPSULES[m[1]], 'unknown capsule ' + m[1]);
});

test('glossary: modules exist, terms unique and sorted-able; primers render; symbol keys used in legends exist', () => {
  const G = env.ctx.GLOSSARY, seen = new Set();
  for (const g of G) {
    assert.ok(g.term && g.def, g.term); assert.ok(!seen.has(g.term), 'dup ' + g.term); seen.add(g.term);
    assert.ok(App.chapters[g.module], `${g.term}: module ${g.module}`);
  }
  for (const k of Object.keys(env.ctx.Primer.PRIMERS)) assert.ok(!/undefined|NaN|\{TM:/.test(env.ctx.Primer.box(k)), k);
  const { SYM } = env.ctx.Sym;
  for (const [k, v] of Object.entries(SYM)) assert.ok(Array.isArray(v) && v.length === 3 && v[0] && v[1], k);
});

test('no stale hard-coded module codes in chapter text', () => {
  const dir = path.join(__dirname, '../js');
  const files = [...fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => path.join(dir, f)), ...fs.readdirSync(path.join(dir, 'ch')).map((f) => path.join(dir, 'ch', f))];
  for (const f of files) {
    const hits = fs.readFileSync(f, 'utf8').split('\n').filter((l) => /['"`>\s]TM-\d+/.test(l) && !/^\s*(\/\/|\*)/.test(l) && !/Progress\.code|\.code/.test(l));
    assert.deepEqual(hits, [], path.basename(f));
  }
});
