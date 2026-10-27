/* Planning a Powered Descent: pure physics for the descent module (no DOM). Loaded before js/ch/descent.js; also runs in Node.
   Planar Moon, point-mass gravity, lander as a point with a throttleable engine.
   Planning model: descent orbit insertion (DOI) half an orbit before powered descent initiation (PDI) at periapsis;
   braking at a fixed throttle until the horizontal speed is zero, steered so the altitude glides from the periapsis
   down to high gate; then a vertical approach to touchdown. */
(function (root) {
  'use strict';
  const C = {
    mu: 4.9048695e12,      // Moon GM, m³/s²
    R: 1.7374e6,           // Moon mean radius, m
    g0: 9.80665,
    F: 45040,              // LM descent engine (DPS), full thrust, N
    isp: 311,              // s
  };
  C.hMin = 5000;         // lowest safe periapsis in this lab (terrain clearance), m
  C.gM = C.mu / (C.R * C.R); // 1.625 m/s²
  C.c = C.isp * C.g0;        // effective exhaust velocity, 3 050 m/s

  const P = { C };

  /* ---------- hand-calculation relations (the planner's toolkit) ---------- */
  P.vis = (r, a) => Math.sqrt(C.mu * (2 / r - 1 / a));
  P.vcirc = (h) => Math.sqrt(C.mu / (C.R + h));
  // DOI: from a circular orbit at altitude hc, retrograde burn that puts periapsis at hp (opposite side)
  P.doi = (hc, hp) => {
    const ra = C.R + hc, rp = C.R + hp, a = (ra + rp) / 2;
    const vc = Math.sqrt(C.mu / ra), va = P.vis(ra, a), vp = P.vis(rp, a);
    const T = 2 * Math.PI * Math.sqrt(a * a * a / C.mu);
    return { vc, va, vp, dv: vc - va, a, coast: T / 2 };
  };
  // periapsis altitude reached with a given DOI Δv (retrograde) from a circular orbit at hc
  P.periFromDv = (hc, dv) => {
    const ra = C.R + hc, va = Math.sqrt(C.mu / ra) - dv;
    if (!(va > 0)) return -C.R;
    const a = 1 / (2 / ra - va * va / C.mu);           // vis-viva solved for a
    return 2 * a - ra - C.R;
  };
  P.massAfter = (m0, dv) => m0 * Math.exp(-dv / C.c);
  P.propFor = (m0, dv) => m0 * (1 - Math.exp(-dv / C.c));
  // braking estimates for stopping a horizontal speed v at constant thrust F (no gravity, flat ground)
  P.brakeEstimate = (v, m0, F) => {
    const mf = P.massAfter(m0, v), mp = m0 - mf, mdot = F / C.c, tb = mp / mdot;
    const aAvg = F / ((m0 + mf) / 2);
    return {
      mf, mp, tb, mdot, aAvg,
      a0: F / m0,
      xConst: v * v / (2 * aAvg),                 // constant-acceleration estimate with the mean mass
      tConst: v / aAvg,
      xRocket: tb * (m0 * v / mp - C.c),          // exact for constant thrust and falling mass
    };
  };
  // altitude at which a vertical fall at speed v must start braking with thrust acceleration a (gravity g)
  P.brakeAlt = (v, a, g = C.gM) => v * v / (2 * (a - g));
  // hover time: thrust = weight, ṁ = m g / (Isp g0); linear (short) and exact (log) forms
  P.hoverTime = (mRes, m, g = C.gM) => mRes * C.c / (m * g);
  P.hoverTimeLog = (mRes, m, g = C.gM) => C.c / g * Math.log(m / (m - mRes));

  /* ---------- the flown descent ----------
     opts: { hc (circular orbit altitude), doiDv, m0 (mass before DOI), prop (descent propellant before DOI, usable),
             throttle (braking, 0–1), pdiRange (planned surface range from PDI to site, m), delay (ignition late, s),
             hHG (high gate altitude, m) }
     returns { ok, outcome, hp, vp, trace: [{t, x, h, vx, vh, m, prop, phase}], pdi, hg, td, miss, margin, … } */
  P.simulate = (o) => {
    const hc = o.hc ?? 110e3, hHG = o.hHG ?? 2000, thr = o.throttle ?? 1, delay = o.delay || 0;
    const res = { trace: [], outcome: 'landed' };
    // DOI burn (impulsive, from the DPS)
    const mDoi = o.m0 * (1 - Math.exp(-Math.abs(o.doiDv) / C.c));
    let m = o.m0 - mDoi, prop = o.prop - mDoi;
    res.doiProp = mDoi;
    const hp = P.periFromDv(hc, o.doiDv);
    res.hp = hp;
    // below about 5 km the coast would graze the highest terrain near the ground track
    if (hp < C.hMin) { res.outcome = 'terrain'; res.vp = hp > -C.R ? P.vis(C.R + Math.max(hp, 0), (2 * C.R + hc + Math.max(hp, 0)) / 2) : NaN; return res; }
    const ra = C.R + hc, rp = C.R + hp, a = (ra + rp) / 2;
    res.vp = P.vis(rp, a);
    res.coast = Math.PI * Math.sqrt(a * a * a / C.mu);
    // polar state at periapsis: r, theta (downrange angle from the site, negative uprange), vr, vt
    let r = rp, th = -o.pdiRange / C.R, vr = 0, vt = res.vp, t = 0;
    const dt = 0.25;
    const push = (phase, thrust) => res.trace.push({ t, x: th * C.R, h: r - C.R, vx: vt, vh: vr, m, prop, phase, thrust });
    push('coast', 0);
    // a late ignition: coast on the ellipse for `delay` seconds
    const step = (ar, at, h) => {
      // semi-implicit Euler on the polar equations (deterministic, small step)
      const g = C.mu / (r * r);
      vr += (vt * vt / r - g + ar) * h;
      vt += (-vr * vt / r + at) * h;
      r += vr * h; th += vt / r * h; t += h;
    };
    while (t < delay - 1e-9) { const h = Math.min(dt, delay - t); step(0, 0, h); }
    if (delay > 0) push('coast', 0);
    res.pdi = { t, x: th * C.R, h: r - C.R, v: vt, m };
    const vp0 = vt, h0 = r - C.R, dH = h0 - hHG;
    // braking: fixed throttle; the vertical channel tracks a smooth glide from the PDI altitude to high gate
    const mdotFull = C.F / C.c;
    let gl = 0;                                     // gravity loss accumulator: ∫ (thrust spent on the vertical) dt
    while (vt > 0) {
      if (prop <= 0) { res.outcome = 'dry'; break; }
      const F = C.F * thr, aT = F / m;
      const s = Math.max(0, Math.min(1, 1 - (vt / vp0) * (vt / vp0)));     // fraction of the braking done (≈ distance)
      const href = hHG + dH * (1 - 3 * s * s + 2 * s * s * s);
      // rate of the reference: dh/ds · ds/dt with ds/dt = −2 vt v̇ / vp0² ≈ 2 vt aT / vp0²
      const dhds = dH * (-6 * s + 6 * s * s), dsdt = 2 * vt * aT / (vp0 * vp0);
      const hdref = dhds * dsdt;
      const g = C.mu / (r * r);
      let av = g - vt * vt / r + 0.004 * (href - (r - C.R)) + 0.12 * (hdref - vr);
      av = Math.max(-0.95 * aT, Math.min(0.95 * aT, av));
      const ah = Math.sqrt(aT * aT - av * av);
      const h = Math.min(dt, vt / Math.max(ah, 1e-6) * 1.0001);
      step(av, -ah, h);
      if (vt < 0) vt = 0;
      m -= mdotFull * thr * h; prop -= mdotFull * thr * h;
      gl += Math.abs(av) * h;
      if (r - C.R <= 0) { res.outcome = 'crash'; push('brake', thr); break; }
      if (res.trace.length < 1e5 && Math.round(t / dt) % 4 === 0) push('brake', thr);
    }
    push('brake', thr);
    res.hg = { t, x: th * C.R, h: r - C.R, m, prop, dt: t - res.pdi.t, dx: th * C.R - res.pdi.x };
    res.gravityLossBrake = gl;
    if (res.outcome === 'landed') {
      // approach: vertical descent, commanded sink rate 1 + h/50 m/s, throttle 10–100 %
      vt = 0;
      while (r - C.R > 0) {
        if (prop <= 0) { res.outcome = 'dry'; break; }
        const hh = r - C.R, g = C.mu / (r * r);
        const cmd = -(1 + hh / 50);
        const aNeed = g + 0.8 * (cmd - vr);
        const thrA = Math.max(0.1, Math.min(1, aNeed * m / C.F));
        const aT = C.F * thrA / m;
        step(aT, 0, dt);
        m -= mdotFull * thrA * dt; prop -= mdotFull * thrA * dt;
        if (Math.round(t / dt) % 4 === 0) push('approach', thrA);
        if (t > res.pdi.t + 3600) { res.outcome = 'dry'; break; }
      }
      push('approach', 0);
    }
    const last = res.trace[res.trace.length - 1];
    res.td = { t, x: th * C.R, vh: vr, m, prop: Math.max(0, prop) };
    res.miss = res.td.x;                               // + long (past the site), − short
    res.margin = Math.max(0, prop) * C.c / (m * C.gM); // hover seconds left
    res.dvTotal = C.c * Math.log((o.m0 - mDoi) / m);
    res.approachTime = t - res.hg.t;
    res.end = last;
    return res;
  };

  root.Phys_descent = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
