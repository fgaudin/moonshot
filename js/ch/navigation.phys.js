/* Where Are We?: pure physics for the navigation module (no DOM). Loaded before js/ch/navigation.js; also runs in Node.
   Planar two-body orbit determination from raw readings: altitude h, speed v, vertical speed ḣ.
   SI units (m, s). Angular momentum is written H here, because h is the altitude. */
(function (root) {
  'use strict';
  const Phys = root.Phys || (typeof require !== 'undefined' ? require('../physics.js') : null);
  const { C, solveKepler } = Phys;
  const TAU = 2 * Math.PI;
  const wrap = (x) => ((x % TAU) + TAU) % TAU;
  const P = {};

  /* From readings (alt, v, hdot) to the orbit. Returns every intermediate the theory uses. */
  P.fromReadings = ({ alt, v, hdot }, mu = C.muE, R = C.RE) => {
    const r = R + alt;
    const sg = Math.max(-1, Math.min(1, hdot / v));
    const gamma = Math.asin(sg);                       // flight-path angle
    const vh = v * Math.cos(gamma);                    // horizontal speed
    const eps = v * v / 2 - mu / r;                    // specific energy
    const a = -mu / (2 * eps);                         // semi-major axis (negative if hyperbolic)
    const H = r * vh;                                  // specific angular momentum
    const p = H * H / mu;                              // semi-latus rectum
    const ec = p / r - 1, es = hdot * H / mu;          // e cos ν, e sin ν
    const e = Math.hypot(ec, es);
    const nu = e > 1e-12 ? wrap(Math.atan2(es, ec)) : 0;
    const rp = p / (1 + e), ra = e < 1 ? p / (1 - e) : Infinity;
    const out = { r, gamma, vh, eps, a, H, p, e, nu, rp, ra, altP: rp - R, altA: ra - R, ec, es };
    if (e < 1) {
      out.n = Math.sqrt(mu / (a * a * a));
      out.T = TAU / out.n;
      const E = 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2));
      out.E = wrap(E);
      out.M = wrap(out.E - e * Math.sin(out.E));
      out.tToApo = wrap(Math.PI - out.M) / out.n;      // time until the next apoapsis
      out.tToPeri = wrap(-out.M) / out.n;              // time until the next periapsis
    }
    return out;
  };

  /* A true orbit (periapsis and apoapsis altitudes, true anomaly at t = 0), propagated with Kepler's equation. */
  P.orbit = (altP, altA, nu0, mu = C.muE, R = C.RE) => {
    const rp = R + altP, ra = R + altA, a = (rp + ra) / 2, e = (ra - rp) / (ra + rp), p = a * (1 - e * e);
    const H = Math.sqrt(mu * p), n = Math.sqrt(mu / (a * a * a));
    const E0 = 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu0 / 2), Math.sqrt(1 + e) * Math.cos(nu0 / 2));
    const M0 = E0 - e * Math.sin(E0);
    return { altP, altA, rp, ra, a, e, p, H, n, T: TAU / n, M0, mu, R };
  };
  // state at time t (s) after the start; x, y with periapsis on +x, counter-clockwise motion
  P.stateAt = (o, t) => {
    const M = o.M0 + o.n * t, E = solveKepler(M, o.e);
    const nu = 2 * Math.atan2(Math.sqrt(1 + o.e) * Math.sin(E / 2), Math.sqrt(1 - o.e) * Math.cos(E / 2));
    const r = o.p / (1 + o.e * Math.cos(nu));
    const vr = o.mu / o.H * o.e * Math.sin(nu), vt = o.H / r;
    return { t, nu: wrap(nu), r, alt: r - o.R, v: Math.hypot(vr, vt), hdot: vr, vt, x: r * Math.cos(nu), y: r * Math.sin(nu) };
  };
  // exact readings at time t
  P.readings = (o, t) => { const s = P.stateAt(o, t); return { alt: s.alt, v: s.v, hdot: s.hdot }; };

  /* Instrument precisions (1σ): altitude, speed, vertical speed */
  P.PRECISION = {
    perfect: { alt: 0, v: 0, hdot: 0 },
    good: { alt: 100, v: 0.3, hdot: 0.3 },
    poor: { alt: 500, v: 2, hdot: 2 },
  };
  // standard normal deviate (Box–Muller); rng returns uniform [0, 1)
  P.gauss = (rng = Math.random) => { let u = 0; while (u === 0) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * rng()); };
  P.noisy = (read, sig, rng) => ({ alt: read.alt + sig.alt * P.gauss(rng), v: read.v + sig.v * P.gauss(rng), hdot: read.hdot + sig.hdot * P.gauss(rng) });

  /* Sensitivity of the apsis altitudes to each reading (finite differences), and the 1σ error budget. */
  P.partials = (read, mu = C.muE, R = C.RE) => {
    const base = P.fromReadings(read, mu, R), out = {};
    const steps = { alt: 1, v: 0.01, hdot: 0.01 };
    for (const k of ['alt', 'v', 'hdot']) {
      const up = P.fromReadings({ ...read, [k]: read[k] + steps[k] }, mu, R), dn = P.fromReadings({ ...read, [k]: read[k] - steps[k] }, mu, R);
      out[k] = { altP: (up.altP - dn.altP) / (2 * steps[k]), altA: (up.altA - dn.altA) / (2 * steps[k]) };
    }
    out.base = base;
    return out;
  };
  P.budget = (read, sig, mu = C.muE, R = C.RE) => {
    const d = P.partials(read, mu, R);
    const q = (key) => Math.sqrt(['alt', 'v', 'hdot'].reduce((s, k) => s + Math.pow(d[k][key] * sig[k], 2), 0));
    return { altP: q('altP'), altA: q('altA'), terms: d };
  };
  // rule of thumb for a near-circular orbit: a speed error Δv moves the opposite apsis by 4 Δv / n
  P.ruleOfThumb = (dv, alt, mu = C.muE, R = C.RE) => 4 * dv / Math.sqrt(mu / Math.pow(R + alt, 3));

  root.Phys_navigation = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
