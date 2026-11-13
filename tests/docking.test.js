// TM-7 Docking (js/ch/docking.js): terminal-phase rules, numbers quoted in the text, scenarios, figures, practice.
const test = require('node:test'), assert = require('node:assert/strict');
const { loadChapter, Phys } = require('./helpers/chapter.js');
const { checkGenerators, checkQuiz } = require('./helpers/practice.js');
const D = loadChapter('docking', ['SCEN', 'gateSpeed', 'losRate', 'terminalStart', 'figSteps', 'figCOAS', 'ENV', 'TAU_G', 'V_MIN']);
const near = (x, want, tol, what) => assert.ok(Math.abs(x - want) <= tol, `${what}: ${x}, text says ${want}`);

test('braking gates: table and rule of thumb', () => {
  assert.equal(D.TAU_G, 400); assert.equal(D.V_MIN, 0.05);
  for (const [r, v] of [[2000, 5], [1000, 2.5], [500, 1.25], [250, 0.625], [100, 0.25], [20, 0.05], [5, 0.05]]) near(D.gateSpeed(r), v, 1e-9, `gate at ${r} m`);
});

test('worked example in 7.4 (110 km lunar orbit, 16 800 kg CSM)', () => {
  const mu = 4.9028e12, r = 1737.4e3 + 110e3, n = Math.sqrt(mu / r ** 3), m = 16800, F = 890, isp = 280, g0 = 9.807;
  near(n, 8.82e-4, 5e-7, 'n');
  near(2 * Math.PI / n, 7125, 3, 'period'); near(n * r / 1e3, 1.629, 0.001, 'orbital speed km/s');
  const dv = Math.hypot(2.4, 0.4);
  near(dv, 2.43, 0.005, 'arrival dv'); near(m * dv / F, 46, 0.6, 'burn time'); near(m * dv / (isp * g0), 15, 0.3, 'propellant');
  near(0.4 / 2000 * 180 / Math.PI, 0.0115, 5e-5, 'LOS rate deg/s'); near(0.4 * m / F, 7.5, 0.1, 'sideways burn');
  near(1.15 * m / F, 22, 0.5, 'brake burn');
  near(n * n * 2000, 1.6e-3, 0.05e-3, 'n^2 rho at 2 km'); near(0.03 * Math.PI / 180 * 2000, 1, 0.06, '0.03 deg/s at 2 km');
  near(n * 180 / Math.PI, 0.05, 0.001, 'n in deg/s');
  const t = (2000 - 1000) / 2.4 + 400 + 400 + 600;
  near(t, 1817, 1, 'terminal phase duration'); near(n * t, 1.6, 0.01, 'n t'); near(n * t * 180 / Math.PI, 92, 0.5, 'orbit angle');
  near(400 * Math.log(20) / 60, 20, 0.1, 'whole way at the limit (min)'); near(400 * Math.log(2), 277, 0.5, 'halving time');
  near(m * 5.0 / (isp * g0), 31, 0.5, 'propellant for 5.0 m/s');
  near(F / m, 0.053, 0.0005, 'a = F/m'); near(2000 / 400 ** 2, 0.0125, 1e-9, 'rho/tau^2'); near(2000 / 100 ** 2, 0.2, 1e-9, 'tau 100 s');
  near(1.15 + 0.625 + 0.375, 2.4 - 0.25, 1e-9, 'braking ladder');
});

test('terminalStart: range, closing speed and sideways drift as a pilot measures them', () => {
  for (const [phi, rho, c, s] of [[-82, 1960, 2.2, 0.3], [0, 500, 1, 0], [135, 1000, 0.5, -0.4]]) {
    const st = D.terminalStart(phi, rho, c, s), n = 8.82e-4;
    near(Math.hypot(st.x, st.z), rho, 1e-6, 'range');
    near(-(st.x * st.vx + st.z * st.vz) / rho, c, 1e-9, 'closing speed');
    near(D.losRate(st.x, st.z, st.vx, st.vz, n), s / rho, 1e-12, 'LOS rate against the stars = s/rho');
    near(Math.cos(st.th) * st.x + Math.sin(st.th) * st.z, -rho, 1e-6, 'nose points at the target');
  }
});

test('terminal scenario: coasting passes the LM at about half a kilometre (text of 7.4)', () => {
  const sc = D.SCEN.terminal, n = sc.n;
  const F = (y) => [y[2], y[3], -2 * n * y[3], 3 * n * n * y[1] + 2 * n * y[2]];
  let y = [sc.s.x, sc.s.z, sc.s.vx, sc.s.vz], best = Infinity; const dt = 1;
  for (let t = 0; t < 3000; t += dt) {
    const k1 = F(y), k2 = F(y.map((v, i) => v + dt / 2 * k1[i])), k3 = F(y.map((v, i) => v + dt / 2 * k2[i])), k4 = F(y.map((v, i) => v + dt * k3[i]));
    y = y.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); best = Math.min(best, Math.hypot(y[0], y[1]));
  }
  near(best, 500, 100, 'closest approach if left alone');
  near(Math.hypot(sc.s.x, sc.s.z), 2000, 50, 'starts about 2 km out');
});

test('scenarios are well formed', () => {
  for (const [k, s] of Object.entries(D.SCEN)) {
    for (const v of [s.n, s.m, s.F, s.s.x, s.s.z, s.s.vx, s.s.vz, s.s.th]) assert.ok(Number.isFinite(v), k);
    assert.ok(Math.abs(s.sT) === 1, k);
    assert.ok(Math.hypot(s.s.x, s.s.z) < (s.lost || 450), `${k} starts inside the "lost" radius`);
  }
  near(D.SCEN.lunar.n, Math.sqrt(4.9028e12 / (1847.4e3) ** 3), 1e-6, 'lunar n');
  near(D.SCEN.gemini.n, 1.186e-3, 1e-9, 'gemini n');
  assert.equal(D.ENV.vmin, 0.03); assert.equal(D.ENV.vmax, 0.3); assert.equal(D.ENV.ang, 10);
});

test('figures render without NaN', () => {
  assert.ok(!/NaN|undefined/.test(D.figSteps()));
  assert.ok(!/NaN|undefined/.test(D.figCOAS()));
});

test('Clohessy–Wiltshire: an along-track push raises the orbit and the chaser drifts behind (Gemini 4)', () => {
  // closed form for a chaser starting at the origin with velocity (vx0, 0): x(t) = 4 vx0 sin(nt)/n - 3 vx0 t,  z(t) = 2 vx0 (1 - cos nt)/n
  const n = 1.186e-3, vx0 = 0.5, t = 600;
  const x = 4 * vx0 * Math.sin(n * t) / n - 3 * vx0 * t, z = 2 * vx0 * (1 - Math.cos(n * t)) / n;
  const F = (y) => [y[2], y[3], -2 * n * y[3], 3 * n * n * y[1] + 2 * n * y[2]];
  let y = [0, 0, vx0, 0]; const dt = 0.5;
  for (let s = 0; s < t; s += dt) { const k1 = F(y), k2 = F(y.map((v, i) => v + dt / 2 * k1[i])), k3 = F(y.map((v, i) => v + dt / 2 * k2[i])), k4 = F(y.map((v, i) => v + dt * k3[i])); y = y.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); }
  near(y[0], x, 0.01, 'x'); near(y[1], z, 0.01, 'z');
  assert.ok(z > 0 && x < 4 * vx0 / n * Math.sin(n * t), 'climbs above the target and loses ground');
});

test('practice generators and concept questions are well formed', () => {
  const { practice } = loadChapter('docking', []);
  checkGenerators(practice); checkQuiz(practice);
});
