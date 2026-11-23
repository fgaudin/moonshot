// Section numbers and the cross-references to them. A chapter writes a section's heading as a plain <h2>…</h2>
// and app.js numbers it n.k in page order (a heading with its own .idx, ✓ Check yourself, is not counted), so inserting a section renumbers the
// ones after it. App.sec(id, k) names a section by that k: this test pins each reference to the title it points at,
// so that an inserted or moved section fails here instead of silently shifting a link.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');

// Every App.sec reference in the code: [module id, k, title of section k]. When you add a reference, add it here;
// when a section moves, fix the references in the chapters (and here), not just this table.
const REFS = [
  ['ascent', 1, 'The Δv budget to orbit'],
  ['burns', 5, 'Finite burns'],
  ['docking', 3, 'Orbital mechanics up close'],
  ['docking', 4, 'Closing in: from a few km to 100 m'],
  ['entry', 3, 'Heating and the blunt body'],
  ['entry', 4, 'Lift and the entry corridor'],
  ['freereturn', 1, 'What a flyby does'],
  ['freereturn', 2, 'The free return'],
  ['freereturn', 3, 'Aiming by timing'],
  ['freereturn', 5, 'Measure the sensitivity'],
  ['freereturn', 6, 'Plan versus reality'],
  ['freereturn', 7, 'Lab: free return and corrections'],
  ['homeward', 4, 'Which revolution? Time and longitude'],
  ['maneuvers', 1, 'The Hohmann transfer'],
  ['maneuvers', 2, 'Plane changes'],
  ['maneuvers', 5, 'Rendezvous: lunar orbit rendezvous'],
  ['mcc', 7, 'Mission rules and aborts'],
  ['moon', 3, 'Speed relative to the Moon: v∞'],
  ['moon', 4, 'The hyperbola at the Moon'],
  ['planes', 5, 'Launch azimuth and launch windows'],
  ['rockets', 3, 'The rocket equation'],
  ['sounding', 1, 'What a pressure gauge tells you'],
  ['sounding', 4, 'Fitting a line to noisy data'],
  ['sounding', 5, 'Density, dynamic pressure and max-q'],
  ['timing', 1, 'Two clocks of different speed'],
  ['timing', 2, 'The phase angle a Hohmann transfer needs'],
  ['timing', 3, 'How long to wait'],
  ['timing', 5, 'The Moon moves too'],
];

const chFiles = fs.readdirSync(path.join(root, 'js/ch')).filter((f) => f.endsWith('.js'));
const read = (f) => fs.readFileSync(path.join(root, 'js/ch', f), 'utf8');

// the numbered sections of a module, in source order (= page order): their titles, English
function sections(id) {
  const src = read(id + '.js');
  return [...src.matchAll(/<section class="section"[^>]*>\s*<h2>(?!<span class="idx">)([\s\S]*?)<\/h2>/g)]
    .map((m) => m[1].replace(/^\$\{T`([\s\S]*)`\}$/, '$1').trim());
}

test('no chapter writes a section number by hand', () => {
  for (const f of chFiles) {
    const hand = read(f).match(/<span class="idx">(\d+\.\d+)?<\/span>/g);
    assert.equal(hand, null, `${f}: ${hand} (write a plain <h2>, app.js numbers it)`);
  }
});

test('every App.sec reference is listed in REFS, and every REFS entry is used', () => {
  const used = new Set();
  for (const f of [...chFiles.map((c) => 'js/ch/' + c), 'js/app.js', 'js/practice.js', 'js/progress.js']) {
    const src = fs.readFileSync(path.join(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');   // not the comments
    for (const m of src.matchAll(/App\.sec\(([^)]*)\)/g)) {
      const lit = m[1].match(/^'(\w+)',\s*(\d+)$/);
      assert.ok(lit, `${f}: App.sec(${m[1]}) — use literal arguments so this test can check it`);
      used.add(`${lit[1]} ${lit[2]}`);
    }
  }
  const listed = new Set(REFS.map(([id, k]) => `${id} ${k}`));
  for (const u of used) assert.ok(listed.has(u), `App.sec('${u.replace(' ', "', ")}) is not in REFS: add it with its section title`);
  for (const l of listed) assert.ok(used.has(l), `REFS lists ${l}, which nothing references any more: remove it`);
});

test('every App.sec reference points at the section it was written for', () => {
  for (const [id, k, title] of REFS) {
    const s = sections(id);
    assert.ok(k >= 1 && k <= s.length, `App.sec('${id}', ${k}): ${id} has ${s.length} numbered sections`);
    assert.equal(s[k - 1], title, `App.sec('${id}', ${k}) now points at "${s[k - 1]}": a section was inserted, removed or moved; fix the references`);
  }
});
