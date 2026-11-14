const test = require('node:test');
const assert = require('node:assert');
const { loadChapter } = require('./helpers/chapter.js');
const { checkGenerators } = require('./helpers/practice.js');
const Phys = require('../js/physics.js');

test('TM-19 practice generators produce finite answers with a solution', () => {
  const { practice } = loadChapter('mcc', [], { Phys_mcc: require('../js/ch/mcc.phys.js') });
  checkGenerators(practice, 20);
  const g = practice.gens.find((x) => x.title === 'Time out of contact behind the Moon');
  assert.ok(g, 'loss-of-signal generator registered');
  for (let i = 0; i < 20; i++) { const p = g.make(); assert.ok(p.answer > 40 && p.answer < 50, `${p.answer} min`); }
});

const M = require('../js/ch/mcc.phys.js');
const cloneStages = () => JSON.parse(JSON.stringify(M.STAGES));

test('budget: nominal margins, heavy payload breaks the descent stage, depletion stages show none', () => {
  const nom = M.budget({ stages: cloneStages(), cargo: 0 }), hv = M.budget({ stages: cloneStages(), cargo: 1000 });
  assert.ok(nom.stages.sic.depletion && nom.stages.sii.depletion && !nom.stages.sivb.depletion);
  // the ascent burns add up to the ideal 9 300 m/s
  assert.ok(Math.abs(nom.rows.filter((r) => r.phase === 'ascent').reduce((a, r) => a + r.dv, 0) - M.ASCENT_DV) < 1e-6);
  for (const id of ['sivb', 'sps', 'dps', 'aps']) assert.ok(nom.stages[id].marginPct >= 5, id);
  assert.ok(hv.stages.dps.marginPct < 5, 'text: the descent stage no longer has 5 % margin');
  // the task text: more descent propellant alone is not enough, the S-IVB runs short (its tank is full)
  const s = cloneStages(); s.dps.prop = M.STAGES.dps.cap;
  const b = M.budget({ stages: s, cargo: 1000 });
  assert.ok(b.stages.dps.marginPct > 5 && b.stages.sivb.marginPct < 5);
  // lightening the payload as well fixes it
  assert.ok(M.STAGE_ORDER.filter((i) => !b.stages[i].depletion).every((i) => M.budget({ stages: s, cargo: 600 }).stages[i].marginPct >= 5));
  // RSS is never larger than the straight sum
  const lin = M.budget({ stages: cloneStages(), cargo: 0, combine: 'linear' });
  for (const id of M.STAGE_ORDER) assert.ok(nom.stages[id].s3 <= lin.stages[id].s3 + 1e-9);
  // mass conservation across the table: propellant used never exceeds the load
  for (const r of nom.rows) assert.ok(r.used > 0 && r.left >= -1e-6, r.id);
});

test('rocket equation helpers invert each other; hover time', () => {
  const m0 = 20000, dv = 1234;
  assert.ok(Math.abs(M.dv(314, m0, M.propFor(314, m0, dv)) - dv) < 1e-6);
  assert.ok(Math.abs(M.hoverFromDv(81) - 50) < 1e-9);
  assert.ok(Math.abs(M.burnTime(311, 10000, 100, 45040) - M.propFor(311, 10000, 100) * 311 * M.g0 / 45040) < 1e-9);
  // 3-4-5 of the concept question
  assert.equal(M.rss([3, 4]), 5);
});

test('PAD arithmetic, GET parsing and number parsing', () => {
  assert.ok(Math.abs(M.padTotal(3, 4, 12) - 13) < 1e-12);
  assert.ok(Math.abs(M.padAlpha(100, 100) - 45) < 1e-12 && Math.abs(M.padBeta(0, 10, 0) - 90) < 1e-12);
  assert.equal(M.parseGET('075:49:50'), 272990);
  assert.equal(M.parseGET('075 49 50'), 272990);
  assert.equal(M.parseGET('75h49m50'), 272990);
  assert.ok(Number.isNaN(M.parseGET('75:61:00')) && Number.isNaN(M.parseGET('')) && Number.isNaN(M.parseGET('1:2:3:4')));
  assert.equal(M.fmtGET(272990), '075:49:50');
  assert.equal(M.fmtGET(3599.7), '001:00:00');   // seconds never print as 60
  assert.equal(M.parseNum('1 234,5'), 1234.5);
  assert.equal(M.parseNum('−3,5'), -3.5);
  assert.ok(Number.isNaN(M.parseNum('abc')) && Number.isNaN(M.parseNum('')) && Number.isNaN(M.parseNum('1,2,3')));
});

test('lunar loss of signal: quoted numbers for the 110 km orbit', () => {
  const L = Phys.lunarLOS(110e3);
  assert.equal(Math.round(L.arcDeg / 2), 70);
  assert.equal(Math.round(L.frac * 100), 39);
  assert.ok(Math.abs(L.P / 60 - 118.7) < 0.15);
  assert.equal(Math.round(L.t / 60), 46);
  assert.equal(Math.round(Phys.lunarLOS(15e3).arcDeg / 2), 82);
});

test('abort decision: the right option in each kind of situation', () => {
  const { KINDS, OPTS, abortEngines } = loadChapter('mcc', ['KINDS', 'OPTS', 'abortEngines'], { Phys_mcc: M });
  const at = (id, cons) => { const k = KINDS.find((x) => x.id === id); const c = { spsGo: k.spsGo, dpsProp: k.dpsProp, cons };
    return OPTS[M.bestOption(OPTS, abortEngines(c), cons, 0.1)].id; };
  assert.equal(at('sps', 125), 'D');    // service engine dead: the speed-up burn with the DPS, the plain free return is too slow
  assert.equal(at('nav', 200), 'A');    // all healthy: fastest direct abort
  assert.equal(at('cell', 78), 'A');    // short on consumables: only the direct abort fits
  assert.equal(at('leak', 150), 'C');   // DPS short of propellant: trim only, the slow way home
});

test('quiz is well formed', () => {
  const { checkQuiz } = require('./helpers/practice.js');
  checkQuiz(loadChapter('mcc', [], { Phys_mcc: M }).practice);
});

test('GET parse and format: strict, signed format; voiced numbers digit by digit', () => {
  assert.strictEqual(M.parseGET('75:49:50'), 75 * 3600 + 49 * 60 + 50);
  assert.strictEqual(M.parseGET('075 49 50'), 75 * 3600 + 49 * 60 + 50);
  assert.strictEqual(M.parseGET('75h49m50s'), 75 * 3600 + 49 * 60 + 50);
  assert.strictEqual(M.parseGET('75'), 75 * 3600);
  for (const bad of ['-75:49:50', '7.5', '1e3', '75:61:00', '75:4:5', '', 'abc']) assert.ok(Number.isNaN(M.parseGET(bad)), bad);
  assert.strictEqual(M.fmtGET(-5), '−000:00:05');
  assert.strictEqual(M.fmtGET(-0.4), '000:00:00');
  assert.deepStrictEqual(M.sayNumber(-12.5, 1), ['minus', 'd1', 'd2', 'point', 'd5_end']);
  assert.deepStrictEqual(M.sayNumber(-0.04, 1), ['d0', 'point', 'd0_end']);
  assert.deepStrictEqual(M.sayNumber(907, 0), ['d9', 'd0', 'd7_end']);
  assert.deepStrictEqual(M.sayGET(75 * 3600 + 49 * 60 + 50), ['d0', 'd7', 'd5', null, 'd4', 'd9', null, 'd5', 'd0_end']);
  // every clip CAPCOM can need exists in each voice file (the falling last-digit clips are optional)
  const all = require('../tools/capcom-phrases.json').phrases;
  for (const lang of ['en', 'fr', 'de']) {
    const ph = all[lang], finals = ph.final_digits !== false;
    const clips = {}; new Function('CapcomClips', require('fs').readFileSync(require('path').join(__dirname, `../audio/capcom-${lang}.js`), 'utf8'))({ add: (l, o) => Object.assign(clips, o) });
    const need = [...Array(10).keys()].flatMap((i) => ['d' + i, ...(finals ? [`d${i}_end`] : [])]).concat(['point', 'minus', 'readback', 'intro_man', 'intro_tei', 'intro_ent'],
      ['tig', 'dvp', 'dvn', 'dvr', 'dv', 'alpha', 'beta', 'tb', 'gei', 'eitime', 'vei', 'range', 'gmax', 'lat', 'lon']);
    for (const k of need) assert.ok(clips[k], `${lang} clip ${k}`);
    assert.equal(Object.keys(clips).length, need.length, lang);
    assert.ok(Object.keys(ph.fields).every((k) => need.includes(k)), lang);
  }
});

test('abort situations: always one passing option, and the right answer varies with the situation', () => {
  const { drawSituation, abortEngines, KINDS } = loadChapter('mcc', ['drawSituation', 'abortEngines', 'KINDS'], { Phys_mcc: M });
  const answers = {};
  for (let i = 0; i < 400; i++) {
    const c = drawSituation();
    const best = M.bestOption(c.opts, abortEngines(c), c.cons, 0.1);
    assert.ok(best >= 0);
    (answers[c.kind.id] = answers[c.kind.id] || new Set()).add(c.opts[best].id);
  }
  assert.equal(JSON.stringify(Object.keys(answers).sort()), JSON.stringify(KINDS.map((k) => k.id).sort()));
  const all = new Set(Object.values(answers).flatMap((s) => [...s]));
  assert.ok(all.size >= 3, [...all].join());
  assert.ok(!all.has('B'), 'the DPS never has the Δv for a direct abort with the stack');
});
