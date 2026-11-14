const test = require('node:test');
const assert = require('node:assert');
const { loadChapter, Phys } = require('./helpers/chapter.js');
const { figForceAngle, eventLabel } = loadChapter('ascent', ['figForceAngle', 'eventLabel']);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b}`);
const C = Phys.C;
const run = (kt, ka, alt, lat, east) => Phys.simulateAscent({ kickTime: kt, kickAngle: ka, targetAlt: alt * 1e3, latitude: lat, east });

test('4.1 numbers quoted in the text', () => {
  near(Math.sqrt(C.muE / (C.RE + 185e3)) / 1e3, 7.79, 0.005);          // circular speed at 185 km
  near(465.1 * Math.cos(28.5 * Math.PI / 180), 408, 1);                // rotation gift at the Cape
  near(7.2921159e-5 * C.RE, 465.1, 0.1);                               // at the equator
  near(1 - Math.cos(10 * Math.PI / 180), 0.015, 0.0005);               // 10 degrees off: 1.5 % lost
});

test('4.3 lab presets: nominal and west reach orbit, "too hard" is lost, results are finite', () => {
  const nominal = run(16, 0.7, 185, 28.5, true), west = run(16, 0.7, 185, 28.5, false);
  const flat = run(10, 1.5, 185, 28.5, true), lofted = run(24, 0.3, 185, 28.5, true);
  assert.equal(nominal.outcome, 'orbit');
  assert.ok(nominal.perigee > 150e3);
  assert.equal(flat.outcome, 'crash');
  assert.equal(west.outcome, 'orbit');
  assert.ok(lofted.outcome === 'orbit');
  // rotation: +408 m/s east, −408 m/s west, so the west launch costs more propellant
  near(nominal.rotV, 408.7, 1); near(west.rotV, -408.7, 1);
  assert.ok(west.propLeft < nominal.propLeft);
  // drag loss of the Saturn V is small (text: around 40 m/s) and max-q is below the 40 kPa warning
  assert.ok(nominal.losses.drag > 10 && nominal.losses.drag < 80, 'drag loss ' + nominal.losses.drag);
  assert.ok(nominal.maxQ.q < 40000);
  // gravity loss is largest when the turn is late
  assert.ok(lofted.losses.gravity > nominal.losses.gravity);
  // 4.1: gravity loss 1.2–1.8 km/s; a gravity turn keeps the steering loss small (it is booked against the
  // air-relative path: against the inertial one, Earth's spin made the vertical rise look like 800 m/s of steering)
  assert.ok(nominal.losses.gravity > 1200 && nominal.losses.gravity < 1800, 'gravity loss ' + nominal.losses.gravity);
  assert.ok(nominal.losses.steering < 200, 'steering loss ' + nominal.losses.steering);
  assert.ok(lofted.losses.steering > 3 * nominal.losses.steering, 'a late turn pays steering to bend the path over');
  // ledger: ideal − losses + rotation ≈ final inertial speed (the lab writes ≈; spin at altitude and frame terms)
  for (const s of [nominal, west, lofted]) { const L = s.losses; near(s.dvIdeal - L.gravity - L.drag - L.steering + s.rotV, s.v, 40, 'ledger'); }
  for (const s of [nominal, west, flat, lofted]) for (const k of ['t', 'v', 'perigee', 'apogee', 'dvIdeal']) assert.ok(Number.isFinite(s[k]), k);
});

test('slider extremes give finite results and a known outcome', () => {
  for (const [kt, ka, alt, lat] of [[5, 0.1, 150, 0], [30, 2.5, 400, 65], [5, 2.5, 150, 65], [30, 0.1, 400, 0]]) {
    for (const east of [true, false]) {
      const s = run(kt, ka, alt, lat, east);
      assert.ok(['orbit', 'crash', 'burnout', 'timeout'].includes(s.outcome), s.outcome);
      assert.ok(s.trace.every((p) => Number.isFinite(p.h) && Number.isFinite(p.v) && Number.isFinite(p.q)));
    }
  }
});

test('force-angle figure and event labels', () => {
  const svg = figForceAngle();
  assert.ok(!/NaN|undefined/.test(svg));
  assert.equal(eventLabel('S-II burnout'), 'S-II burnout');
  assert.equal(eventLabel('Liftoff'), 'Liftoff');
});

test('4.3 lab text: what the presets and the comparison callout say', () => {
  const nominal = run(16, 0.7, 185, 28.5, true), lofted = run(24, 0.3, 185, 28.5, true);
  // "Late and gentle" reaches orbit but costs about 1 km/s more in gravity + steering loss and about 60 t of propellant
  near((lofted.losses.gravity + lofted.losses.steering) - (nominal.losses.gravity + nominal.losses.steering), 2270, 400, 'extra loss');
  near((nominal.propLeft - lofted.propLeft) / 1e3, 60, 5, 'extra propellant');
  // the callout: nominal 185 x 195 km in about ten minutes, Max Q about 22 kPa
  near(nominal.perigee / 1e3, 185, 2); near(nominal.apogee / 1e3, 195, 3);
  near(nominal.t, 600, 30); near(nominal.maxQ.q / 1e3, 22, 1.5);
  const s1 = nominal.trace.find((p) => p.stage === 1);
  assert.ok(s1.h > 67e3 && s1.t > 161, 'S-IC cutoff later and higher than Apollo 11');
  // west costs 2 x 408 m/s more than east
  near(2 * 408, 816, 0);
});
