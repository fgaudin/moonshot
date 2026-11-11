// TM-14 Free Return (js/ch/freereturn.js): lab scenarios, numbers quoted in the text, the timing figure.
const test = require('node:test'), assert = require('node:assert/strict');
const { loadChapter } = require('./helpers/chapter.js');
const { fly, inCorridor, km } = require('./helpers/lab.js');
const { PRESETS, svgTwin, B0, BMIN } = loadChapter('freereturn', ['PRESETS', 'svgTwin', 'B0', 'BMIN']);
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x.toFixed(2)}, text says ${want}`);

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
