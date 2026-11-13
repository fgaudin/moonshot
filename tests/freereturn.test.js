// TM-14 Free Return (js/ch/freereturn.js): lab scenarios, numbers quoted in the text, the timing figure.
const test = require('node:test'), assert = require('node:assert/strict');
const { loadChapter } = require('./helpers/chapter.js');
const { fly, inCorridor, km } = require('./helpers/lab.js');
const { PRESETS, svgTwin, figTLIShift, B0, BMIN } = loadChapter('freereturn', ['PRESETS', 'svgTwin', 'figTLIShift', 'B0', 'BMIN']);
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x.toFixed(2)}, text says ${want}`);

test('14.5–14.6: the corrections of the text fit on the lab’s MCC slider (±10 m/s)', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../js/ch/freereturn.js'), 'utf8');
  const m = src.match(/mccMax: (\d+)/g);
  assert.equal(m && m.length, 2, 'markup and mount both pass mccMax');
  for (const dv of [-7.77, -6.95, -6.78]) assert.ok(Math.abs(dv) <= 10);
});

test('rescue objective: Mission Control’s MCC solution does not count, the candidate’s own MCC does', () => {
  // the solver updates the lab with its own source; rescue is awarded only for a change of the MCC slider itself
  const fs = require('fs'), path = require('path');
  const moon = fs.readFileSync(path.join(__dirname, '../js/ch/moon.js'), 'utf8'), fr = fs.readFileSync(path.join(__dirname, '../js/ch/freereturn.js'), 'utf8');
  assert.match(moon, /ctl\.update\(`\$\{id\}-solve`\)/, 'the solver reports the source <id>-solve');
  assert.match(fr, /c\.src === 'fr-mcc' && needRescue && ok\) Progress\.done\('freereturn', 'rescue'\)/);
  // the lab's own scenario: late TLI misses, the solver's −0.78 m/s (within ±1 m/s of slider travel) brings it back
  assert.ok(!inCorridor(fly(PRESETS.late)));
  assert.ok(inCorridor(fly({ ...PRESETS.late, mcc: -0.78 })), 'a hand-set −0.78 m/s rescues the late TLI');
});

test('scenarios do what the lab steps say (patched conics)', () => {
  const free = fly(PRESETS.free), late = fly(PRESETS.late), impact = fly(PRESETS.impact), sling = fly(PRESETS.sling);
  assert.ok(inCorridor(free), 'Free return lands in the entry corridor');
  assert.ok(!inCorridor(late), 'TLI half a second late misses the corridor');
  assert.equal(impact.outcome, 'impact');
  assert.equal(sling.outcome, 'flung');
});

test('free return fails in the three-body model (objective "reality" needs a fix)', () => {
  assert.ok(!inCorridor(fly(PRESETS.free, 'three')));
});

test('numbers quoted in 14.2 and 14.4–14.6', () => {
  const free = fly(PRESETS.free);
  near(km(free.minM.alt), 369, 2, '14.2 free return periselene');
  near(km(free.retAlt), 52, 2, '14.2 free return perigee');
  near(km(fly(PRESETS.late).retAlt), -1250, 15, 'lab step 2: late perigee (below surface)');
  near(km(fly(PRESETS.aim).minM.alt), 899, 2, '14.4 aim scenario periselene');
  near(km(fly({ ...PRESETS.aim, ang: PRESETS.aim.ang - 0.204 }).minM.alt), 199, 3, '14.4 TLI −0.204°');
  near(km(fly({ ...PRESETS.aim, mcc: -7.77 }).minM.alt), 2, 3, '14.5 MCC −7.77 m/s');
  near(km(fly({ ...PRESETS.aim, mcc: -6.95 }).minM.alt), 92, 3, '14.6 MCC −6.95 m/s');
});

test('timing figure: 1 334 s late gives the text’s Δb = −1 066 km', () => {
  const r = svgTwin(1334, null);
  near(r.d, 1367, 1, 'Moon moves v☾Δt');
  near(r.db, 1066, 1, 'Δb');
  near(r.b, B0 - 1066, 1, 'late aim offset');
  assert.ok(svgTwin(1600, null).b < BMIN, 'a long enough delay goes below the impact limit');
});

test('timing figure renders at every time without NaN', () => {
  for (const t of [-6000, -3000, 0, 500, 3000, 5999, null]) for (const dt of [0, 1334, 2400]) {
    const r = svgTwin(dt, t);
    assert.ok(!/NaN|undefined/.test(r.earth + r.moon), `t=${t} dt=${dt}`);
  }
});

test('TLI-shift figure renders without NaN', () => {
  assert.ok(!/NaN|undefined/.test(figTLIShift()));
});

test('practice generators and concept questions are well formed', () => {
  const { practice } = loadChapter('freereturn', []);
  require('./helpers/practice.js').checkGenerators(practice);
  require('./helpers/practice.js').checkQuiz(practice);
});

// ---- extra checks on the numbers of 14.1 to 14.7 (patched conics unless noted) ----
const { Phys } = require('./helpers/chapter.js');
const { MCC_T } = require('./helpers/lab.js');
const bOf = (s) => { const c = s.conic.soiIn; return c.rp * Math.sqrt(1 + 2 * Phys.C.muM / (c.rp * c.vinf ** 2)) / 1e3; };

test('14.1: TLI earlier by 1.19° hits the Moon, 3° earlier is flung out on the other side', () => {
  const a = PRESETS.aim;
  assert.equal(fly({ ...a, ang: a.ang - 1.19 }).outcome, 'impact');
  const far = fly({ ...a, ang: a.ang - 3 });
  assert.equal(far.outcome, 'flung');
  near(km(far.minM.alt), 3660, 5, '3° earlier periselene');
});

test('14.4: aim offset b of the start scenario and the TLI-point sensitivity', () => {
  const a = PRESETS.aim, s = fly(a);
  near(bOf(s), 5560, 2, 'b of the aim scenario');
  near(s.minM.t / 3600, 70.8, 0.1, 'periselene time (h)');
  near(s.conic.soiIn.vinf, 1039, 1, 'v∞');
  const k = (bOf(s) - bOf(fly({ ...a, ang: a.ang - 0.204 }))) / 0.204;
  near(k, 4663, 20, 'simulator db per degree of TLI point');
  near(km(fly({ ...a, ang: a.ang - 0.229 }).minM.alt), 117, 2, 'table: measured first pass');
  near(km(fly({ ...a, ang: a.ang - 0.231 }).minM.alt), 110, 2, 'table: second pass');
});

test('14.5–14.6: MCC sensitivity and the two tables', () => {
  const a = PRESETS.aim, up = bOf(fly({ ...a, mcc: 1 })), dn = bOf(fly({ ...a, mcc: -1 }));
  near(up, 5713, 2, 'b at +1 m/s'); near(dn, 5406, 2, 'b at −1 m/s');
  near((up - dn) / 2, 153.5, 0.5, 'km of b per m/s');
  near((km(fly({ ...a, mcc: 1 }).minM.alt) - km(fly({ ...a, mcc: -1 }).minM.alt)) / 2, 121, 1, 'km of periselene per m/s');
  near(km(fly({ ...a, mcc: -6.78 }).minM.alt), 110, 2, 'table: second pass');
  near(1066 / 7.77, 137, 0.5, 'hand value per m/s');
});

test('lab step 3: Mission Control’s MCC for "TLI half a second late" is below 0.8 m/s and lands in the corridor', () => {
  const l = PRESETS.late;
  const dv = Phys.solveMCC({ dv: l.dv, burnAngle: l.ang, mcc: { t: MCC_T, dv: 0 }, loi: null }, 40000, 1, Phys.simulatePatched);
  assert.ok(Math.abs(dv) < 0.8, `solved MCC ${dv}`);
  assert.ok(inCorridor(fly({ ...l, mcc: dv })));
});

test('14.7: three-body model, text numbers', () => {
  const t = fly({ dv: 3160, ang: -132.18, mcc: 0.03 }, 'three');
  assert.ok(inCorridor(t));
  near(km(t.minM.alt), 290, 3, 'three-body periselene'); near(km(t.retAlt), 34, 2, 'three-body perigee');
  near(km(fly(PRESETS.aim).retAlt), -4600, 30, 'patched conics perigee of the same burns');
  const hi = fly({ dv: 3160, ang: -132.18, mcc: 0.03 }, 'three'), e = fly({ dv: 3160.1, ang: -132.18, mcc: 0.03 }, 'three');
  assert.ok(Math.abs(km(e.retAlt) - km(hi.retAlt)) > 800, '0.1 m/s moves the perigee by about a thousand km');
});

test('timing figure: arithmetic of 14.4 (Δφ, rate of the parking orbit)', () => {
  near(1.0245 / 384.4e3 * 1334 * 180 / Math.PI, 0.2, 0.01, 'Δφ');
  near(0.2 / 0.068, 3.0, 0.1, 'seconds earlier');
  near(1.0245 * 1334, 1367, 1, 'Moon displacement');
});
