/* Measuring an Atmosphere: pure physics for the sounding module (no DOM). Loaded before js/ch/sounding.js; also runs in Node.
   Atmospheres (isothermal exponential or the 1976 US Standard Atmosphere), a 1D vertical sounding-rocket flight with
   drag, noisy telemetry, and least-squares fitting of ln p against altitude. */
(function (root) {
  'use strict';
  const P = {};
  const G0 = 9.80665, RGAS = 8.314462618, RAIR = 287.053;

  /* ---- seeded random numbers, so a hidden atmosphere and its telemetry can be replayed ---- */
  P.rng = (seed) => {
    let s = (seed >>> 0) || 1;
    const u = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s + 0.5) / 4294967296; };
    u.gauss = () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
    return u;
  };

  /* ---- atmospheres ----
     isothermal: p = p0 exp(−h/H), ρ = p/(g0 H)  (since R_s T = g0 H)
     standard:   U.S. Standard Atmosphere 1976, layers of constant lapse rate up to 84.852 km (geopotential), R_s = 287.053 */
  const STD = [ // base geopotential altitude (m), base temperature (K), lapse rate (K/m)
    [0, 288.15, -0.0065], [11000, 216.65, 0], [20000, 216.65, 0.001], [32000, 228.65, 0.0028],
    [47000, 270.65, 0], [51000, 270.65, -0.0028], [71000, 214.65, -0.002], [84852, 186.946, 0],
  ];
  const stdBase = (() => {
    const out = [101325];
    for (let i = 1; i < STD.length; i++) {
      const [hb, Tb, L] = STD[i - 1], dh = STD[i][0] - hb, p = out[i - 1];
      out.push(L === 0 ? p * Math.exp(-G0 * dh / (RAIR * Tb)) : p * Math.pow(Tb / (Tb + L * dh), G0 / (RAIR * L)));
    }
    return out;
  })();
  P.standard = (h) => {   // h geometric altitude (m) → { p, T, rho }
    const z = 6356766 * h / (6356766 + h);   // geopotential altitude
    let i = STD.length - 1;
    while (i > 0 && z < STD[i][0]) i--;
    const [hb, Tb, L] = STD[i], dz = z - hb, T = Tb + L * dz;
    const p = L === 0 ? stdBase[i] * Math.exp(-G0 * dz / (RAIR * Tb)) : stdBase[i] * Math.pow(Tb / T, G0 / (RAIR * L));
    return { p, T, rho: p / (RAIR * T) };
  };
  P.atmos = (atm, h) => {
    if (atm.kind === 'standard') return P.standard(h);
    const p = atm.p0 * Math.exp(-h / atm.H);
    return { p, T: atm.T, rho: p / (atm.g0 * atm.H) };
  };
  // scale height from temperature, molar mass (kg/mol) and gravity
  P.scaleHeight = (T, M, g) => RGAS * T / (M * g);

  /* ---- least squares y = a + b x ---- */
  P.fit = (xs, ys) => {
    const n = xs.length;
    if (n < 2) return null;
    const mx = xs.reduce((s, x) => s + x, 0) / n, my = ys.reduce((s, y) => s + y, 0) / n;
    let sxx = 0, sxy = 0;
    for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) * (xs[i] - mx); sxy += (xs[i] - mx) * (ys[i] - my); }
    if (sxx <= 0) return null;
    const b = sxy / sxx, a = my - b * mx;
    let ss = 0;
    for (let i = 0; i < n; i++) ss += (ys[i] - a - b * xs[i]) ** 2;
    const sigma = n > 2 ? Math.sqrt(ss / (n - 2)) : 0;
    return { a, b, mx, my, sxx, n, sigma, sb: sigma / Math.sqrt(sxx), ss };
  };
  // fit of ln p (Pa) against h (m): H = −1/b, p0 = e^a
  P.fitAtmos = (hs, ps) => {
    const f = P.fit(hs, ps.map(Math.log));
    if (!f || !(f.b < 0)) return f ? { ...f, H: NaN, p0: NaN } : null;
    return { ...f, H: -1 / f.b, p0: Math.exp(f.a), dH: f.sb / (f.b * f.b) };
  };

  /* ---- worlds (gravity, radius, launch site) and hidden-atmosphere generators ---- */
  P.WORLDS = {
    earth: { g0: 9.80665, R: 6371e3, site: 1200, gauge: 130e3,
      gen: (u) => ({ kind: 'iso', p0: 96e3 + 9e3 * u(), H: 7400 + 1200 * u() }) },
    thin: { g0: 3.71, R: 3390e3, site: 2000, gauge: 1.3e3,
      gen: (u) => ({ kind: 'iso', p0: 500 + 450 * u(), H: 9500 + 2800 * u() }) },
    dense: { g0: 8.1, R: 5600e3, site: 500, gauge: 350e3,
      gen: (u) => ({ kind: 'iso', p0: 160e3 + 100e3 * u(), H: 11000 + 3000 * u() }) },
    std: { g0: 9.80665, R: 6371e3, site: 1200, gauge: 130e3,
      gen: () => ({ kind: 'standard', p0: 101325 }) },
  };
  // a hidden atmosphere and vehicle for one range day
  P.makeDay = (world, seed) => {
    const W = P.WORLDS[world], u = P.rng(seed);
    const atm = { ...W.gen(u), g0: W.g0 };
    if (atm.kind === 'iso') atm.T = null;   // unknown composition: only R_s T = g0 H matters
    const m = Math.round(55 + 30 * u()), cd = 0.25 + 0.2 * u();
    return { world, seed, atm, W, m, cd, d: 0.3, A: Math.PI * 0.15 * 0.15, beta: m / (cd * Math.PI * 0.15 * 0.15) };
  };

  /* ---- motors: propellant mass, Isp, burn time at full load ---- */
  P.MOTORS = {
    small: { prop: 25, isp: 230, tb: 3 },
    medium: { prop: 70, isp: 240, tb: 8 },
    large: { prop: 200, isp: 255, tb: 20 },
  };

  /* ---- 1D vertical flight: thrust, gravity μ/r², drag ½ρv²C_D A. Returns a fine trace. ---- */
  P.fly = (day, motorKey, load = 1) => {
    const M = P.MOTORS[motorKey], W = day.W;
    const prop = M.prop * load, tb = M.tb * load, F = M.prop * M.isp * G0 / M.tb;   // constant thrust, shorter burn
    const mdot = F / (M.isp * G0);
    const g = (h) => W.g0 * (W.R / (W.R + h)) ** 2;
    const acc = (t, h, v, m) => {
      const thrust = t < tb ? F : 0;
      const rho = P.atmos(day.atm, h).rho;
      const D = 0.5 * rho * v * Math.abs(v) * day.cd * day.A;
      return (thrust - D) / m - g(h);
    };
    let t = 0, h = W.site, v = 0, m = day.m + prop;
    const dt = 0.02, trace = [{ t, h, v, a: acc(0, h, 0, m), m }];
    let apo = { t: 0, h };
    while (t < 3000) {
      // RK4 on (h, v); mass is linear in time during the burn
      const mAt = (tt) => day.m + Math.max(0, prop - mdot * Math.min(tt, tb));
      const k1h = v, k1v = acc(t, h, v, mAt(t));
      const k2h = v + k1v * dt / 2, k2v = acc(t + dt / 2, h + k1h * dt / 2, k2h, mAt(t + dt / 2));
      const k3h = v + k2v * dt / 2, k3v = acc(t + dt / 2, h + k2h * dt / 2, k3h, mAt(t + dt / 2));
      const k4h = v + k3v * dt, k4v = acc(t + dt, h + k3h * dt, k4h, mAt(t + dt));
      h += dt * (k1h + 2 * k2h + 2 * k3h + k4h) / 6; v += dt * (k1v + 2 * k2v + 2 * k3v + k4v) / 6; t += dt;
      m = mAt(t);
      if (h > apo.h) apo = { t, h };
      if (h <= W.site && t > 1) { h = W.site; trace.push({ t, h, v, a: acc(t, h, v, m), m }); break; }
      if (Math.round(t / dt) % 5 === 0) trace.push({ t, h, v, a: acc(t, h, v, m), m });
    }
    return { trace, tb, F, apo, tEnd: t, g, maxQ: maxQ(trace, day) };
  };
  function maxQ(trace, day) {
    let best = { q: 0, t: 0, h: 0 };
    for (const s of trace) { const q = 0.5 * P.atmos(day.atm, s.h).rho * s.v * s.v; if (q > best.q) best = { q, t: s.t, h: s.h }; }
    return best;
  }
  P.stateAt = (trace, t) => {
    let lo = 0, hi = trace.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (trace[mid].t <= t) lo = mid; else hi = mid - 1; }
    return trace[lo];
  };

  /* ---- telemetry: one sample every dt seconds; pressure with 3% (log-normal) noise, gauge floor 1e-4 of full scale
     (samples above the gauge's range are dropped);
     radar speed (±0.5 m/s) and acceleration (±1% ±0.05 m/s²) ---- */
  P.SIGMA_LNP = 0.03;
  P.telemetry = (day, flight) => {
    const u = P.rng(day.seed * 7919 + Math.round(flight.tEnd * 10));
    const floor = day.W.gauge * 1e-4, tr = flight.trace;
    // the sample interval adapts to the time spent where the gauge can read, for about 40 useful samples
    let inRange = 0;
    for (let i = 1; i < tr.length; i++) if (P.atmos(day.atm, tr[i].h).p >= floor) inRange += tr[i].t - tr[i - 1].t;
    const nice = [1, 2, 5, 10, 15, 20, 30];
    const dt = nice.find((x) => inRange / x <= 40) || 30;
    const out = [];
    let above = 0;
    for (let t = 0; t <= flight.tEnd + 1e-9; t += dt) {
      const s = P.stateAt(tr, t), pt = P.atmos(day.atm, s.h).p;
      const p = pt * Math.exp(P.SIGMA_LNP * u.gauss());
      const v = s.v + 0.5 * u.gauss(), a = s.a * (1 + 0.01 * u.gauss()) + 0.05 * u.gauss();
      if (p < floor) { above++; continue; }
      out.push({ t, h: s.h, v, a, p, coast: t > flight.tb + 0.5 });
    }
    return { samples: out, dt, floor, above };
  };

  // the hidden truth to compare a fit with: the exponential itself, or for the layered Earth the best exponential
  // through the noise-free profile at the sampled altitudes
  P.truth = (day, samples) => {
    if (day.atm.kind === 'iso') return { H: day.atm.H, p0: day.atm.p0, exact: true };
    const ok = samples;
    const f = P.fitAtmos(ok.map((s) => s.h), ok.map((s) => P.standard(s.h).p));
    return { H: f ? f.H : NaN, p0: f ? f.p0 : NaN, exact: false, pSurface: 101325 };
  };
  // ballistic coefficient implied by one coasting sample and a density: β = ρ v² / (2 |a + g|)
  P.betaFrom = (s, rho, g) => rho * s.v * s.v / (2 * Math.abs(s.a + g));

  P.G0 = G0; P.RGAS = RGAS; P.RAIR = RAIR;
  root.Phys_sounding = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
