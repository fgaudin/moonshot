/* Moonshot physics core — SI units internally (m, s, kg).
   Pure functions only, so the same file runs in the browser and in Node for testing. */
(function (root) {
  'use strict';

  const C = {
    G: 6.6743e-11,
    g0: 9.80665,                 // standard gravity, m/s²
    muE: 3.986004418e14,         // Earth GM, m³/s²
    RE: 6.378137e6,              // Earth equatorial radius, m
    omegaE: 7.2921159e-5,        // Earth sidereal rotation rate, rad/s
    muM: 4.9048695e12,           // Moon GM, m³/s²
    RM: 1.7374e6,                // Moon mean radius, m
    DEM: 3.844e8,                // mean Earth–Moon distance, m
    muS: 1.32712440018e20,       // Sun GM
    AU: 1.495978707e11,
    rho0: 1.225,                 // sea-level air density, kg/m³
    H: 7200,                     // density scale height, m
    p0: 101325,                  // sea-level pressure, Pa
    entryInterface: 121920,      // 400 000 ft, m
  };

  /* ---------- Two-body orbit relations (2-D, planar) ---------- */

  // From radius r, speed v and flight-path angle phi (rad, above local horizontal).
  function elementsFromRV(r, v, phi, mu) {
    const eps = v * v / 2 - mu / r;                  // specific mechanical energy
    const h = r * v * Math.cos(phi);                 // specific angular momentum
    const p = h * h / mu;                            // semi-latus rectum
    const e = Math.sqrt(Math.max(0, 1 + 2 * eps * h * h / (mu * mu)));
    const a = Math.abs(eps) < 1e-9 ? Infinity : -mu / (2 * eps);
    const rp = p / (1 + e);
    const ra = e < 1 ? p / (1 - e) : Infinity;
    // true anomaly at the given point
    let nu = 0;
    if (e > 1e-9) {
      const cosNu = Math.max(-1, Math.min(1, (p / r - 1) / e));
      nu = Math.acos(cosNu);
      if (phi < 0) nu = -nu;                         // descending toward periapsis
    }
    const T = e < 1 ? 2 * Math.PI * Math.sqrt(a * a * a / mu) : Infinity;
    return { eps, h, p, e, a, rp, ra, nu, T };
  }

  // Solve Kepler's equation M = E − e sin E (elliptic) with Newton iteration.
  function solveKepler(M, e) {
    M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    let E = e < 0.8 ? M : Math.PI;
    for (let i = 0; i < 50; i++) {
      const f = E - e * Math.sin(E) - M;
      const d = f / (1 - e * Math.cos(E));
      E -= d;
      if (Math.abs(d) < 1e-12) break;
    }
    return E;
  }
  function trueFromEcc(E, e) {
    return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  }
  function eccFromTrue(nu, e) {
    return 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2));
  }
  // Time since periapsis for true anomaly nu on an ellipse (BMW §4.2).
  function timeSincePeriapsis(nu, e, a, mu) {
    let E = eccFromTrue(nu, e);
    if (E < 0) E += 2 * Math.PI;
    const n = Math.sqrt(mu / (a * a * a));
    return (E - e * Math.sin(E)) / n;
  }

  /* ---------- Rocket equation ---------- */
  const rocket = {
    dv: (isp, m0, mf) => isp * C.g0 * Math.log(m0 / mf),
    massRatio: (dv, isp) => Math.exp(dv / (isp * C.g0)),
    // stages: [{prop, dry, isp}] bottom first, payload on top
    staging(stages, payload) {
      const out = [];
      let above = payload;
      for (let i = stages.length - 1; i >= 0; i--) above += stages[i].prop + stages[i].dry;
      let m = above;
      for (const s of stages) {
        const m0 = m, mf = m - s.prop;
        out.push({ m0, mf, dv: rocket.dv(s.isp, m0, mf) });
        m = mf - s.dry;
      }
      return out;
    },
  };

  /* ---------- Generic RK4 step ---------- */
  function rk4(f, t, y, dt) {
    const n = y.length;
    const k1 = f(t, y);
    const y2 = new Array(n), y3 = new Array(n), y4 = new Array(n);
    for (let i = 0; i < n; i++) y2[i] = y[i] + dt / 2 * k1[i];
    const k2 = f(t + dt / 2, y2);
    for (let i = 0; i < n; i++) y3[i] = y[i] + dt / 2 * k2[i];
    const k3 = f(t + dt / 2, y3);
    for (let i = 0; i < n; i++) y4[i] = y[i] + dt * k3[i];
    const k4 = f(t + dt, y4);
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = y[i] + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    return out;
  }

  /* ---------- Saturn V ascent (planar, polar coordinates, inertial) ---------- */
  const SATURN_V = {
    payload: 45000,                       // CSM + LM + SLA, kg (approx.)
    diameter: 10.1, cd: 0.5,
    stages: [
      { name: 'S-IC', prop: 2150000, dry: 131000, fVac: 38.7e6, fSL: 34.0e6, ispVac: 304 },
      { name: 'S-II', prop: 444000, dry: 40000, fVac: 5.165e6, fSL: 5.165e6, ispVac: 421 },
      { name: 'S-IVB', prop: 107000, dry: 13500, fVac: 1.033e6, fSL: 1.033e6, ispVac: 421 },
    ],
  };

  function density(h) { return h > 200000 ? 0 : C.rho0 * Math.exp(-Math.max(0, h) / C.H); }
  function pressure(h) { return C.p0 * Math.exp(-Math.max(0, h) / 7500); }

  /* opts: kickTime (s), kickAngle (deg), targetAlt (m), latitude (deg), east (bool) */
  function simulateAscent(opts) {
    const veh = opts.vehicle || SATURN_V;
    const kickT = opts.kickTime ?? 12, kickA = (opts.kickAngle ?? 2.2) * Math.PI / 180;
    const hT = opts.targetAlt ?? 185000;
    const lat = (opts.latitude ?? 28.5) * Math.PI / 180;
    const dir = opts.east === false ? -1 : 1;
    const area = Math.PI * veh.diameter * veh.diameter / 4;
    const rotV = C.omegaE * C.RE * Math.cos(lat);      // eastward surface speed

    // state: r, theta, vr, vt (vt inertial, + = launch direction)
    let y = [C.RE, 0, 0, rotV];            // Earth always turns toward +theta (east)
    let stage = 0;
    let mass = veh.payload;
    for (const s of veh.stages) mass += s.prop + s.dry;
    let propLeft = veh.stages[0].prop;
    let t = 0;
    const dt = 0.5;
    const trace = [];
    const events = [{ t: 0, label: 'Liftoff' }];
    let cecoLogged = false;
    let lossG = 0, lossD = 0, lossS = 0, dvIdeal = 0, maxQ = { q: 0, t: 0, h: 0 }, maxG = 0;
    let result = null;
    const airRel = (s) => [s[2], s[3] - C.omegaE * s[0] * Math.cos(lat)];

    // burn time needed to gain dv from the current stage onward (rocket equation, stage by stage)
    function timeToGo(dv) {
      let tt = 0, m = mass;
      for (let i = stage; i < veh.stages.length && dv > 0; i++) {
        const st = veh.stages[i];
        const ve = st.ispVac * C.g0, md = st.fVac / ve;
        const prop = i === stage ? propLeft : st.prop;
        const dvMax = ve * Math.log(m / (m - prop));
        const use = Math.min(dv, dvMax);
        tt += m / md * (1 - Math.exp(-use / ve));
        dv -= use;
        m -= prop + st.dry;
      }
      return tt;
    }

    function pitch(s, h, accT) {
      const [vr, vtr] = airRel(s);
      const gammaRel = Math.atan2(vr, vtr * dir);
      if (stage === 0) {
        if (t < kickT) return Math.PI / 2;
        if (t < kickT + 8) return Math.PI / 2 - kickA;
        return Math.min(Math.PI / 2 - kickA, gammaRel);    // gravity turn
      }
      // Upper stages: terminal guidance toward a circular orbit at hT. Radial acceleration varies
      // linearly to null vertical speed exactly at hT when the horizontal speed reaches circular speed.
      const r = s[0], vr2 = s[2], vt = Math.abs(s[3]);
      const vc = Math.sqrt(C.muE / (C.RE + hT));
      const T = Math.max(20, timeToGo(Math.max(0, vc - vt)));
      const aRdes = 6 * (hT - h) / (T * T) - 4 * vr2 / T;
      const need = aRdes + C.muE / (r * r) - vt * vt / r;
      const sb = Math.max(-0.5, Math.min(0.9, need / accT));
      return Math.asin(sb);
    }

    while (t < 1500) {
      const st = veh.stages[stage];
      const h = y[0] - C.RE;
      const p = pressure(h);
      // the S-IC centre F-1 shut down early (CECO, T+135 s) to keep acceleration near 4 g
      const ceco = stage === 0 && t >= 135 ? 0.8 : 1;
      const thrust = ceco * (st.fSL === st.fVac ? st.fVac : st.fVac - (st.fVac - st.fSL) * (p / C.p0));
      const mdot = ceco * st.fVac / (st.ispVac * C.g0);
      const accT = thrust / mass;
      const beta = pitch(y, h, accT);
      const [vr, vtr] = airRel(y);
      const vrel = Math.hypot(vr, vtr);
      const rho = density(h);
      const q = 0.5 * rho * vrel * vrel;
      const drag = q * veh.cd * area;
      const f = (tt, s) => {
        const hh = s[0] - C.RE;
        const [ur, ut] = airRel(s);
        const ur2 = Math.hypot(ur, ut) || 1;
        const D = 0.5 * density(hh) * ur2 * ur2 * veh.cd * area / mass;
        const ar = accT * Math.sin(beta) - D * ur / ur2;
        const at = dir * accT * Math.cos(beta) - D * ut / ur2;
        return [s[2], s[3] / s[0], s[3] * s[3] / s[0] - C.muE / (s[0] * s[0]) + ar, -s[2] * s[3] / s[0] + at];
      };
      // loss bookkeeping (Sellers, "Getting to Orbit": gravity, drag, steering losses)
      const vin = Math.hypot(y[2], y[3]);
      const gammaIn = Math.atan2(y[2], Math.abs(y[3]));
      const gloc = C.muE / (y[0] * y[0]);
      lossG += gloc * Math.sin(gammaIn) * dt;
      lossD += drag / mass * dt;
      lossS += accT * (1 - Math.cos(beta - gammaIn)) * dt;
      dvIdeal += accT * dt;
      if (q > maxQ.q) maxQ = { q, t, h };
      const gl = Math.hypot(accT * Math.cos(beta) - drag / mass * (vtr / (vrel || 1)), accT * Math.sin(beta) - drag / mass * (vr / (vrel || 1))) / C.g0;
      if (gl > maxG) maxG = gl;

      if (trace.length === 0 || t - trace[trace.length - 1].t >= 2) {
        trace.push({ t, h, x: y[1] * C.RE, v: vin, vrel, q, g: gl, gamma: gammaIn, beta, stage, m: mass });
      }

      y = rk4(f, t, y, dt);
      t += dt;
      mass -= mdot * dt;
      propLeft -= mdot * dt;

      const hn = y[0] - C.RE;
      if (stage === 0 && t >= 135 && !cecoLogged) { events.push({ t, label: 'Centre engine cutoff' }); cecoLogged = true; }
      if (hn < -1 && t > 5) { result = { outcome: 'crash' }; events.push({ t, label: 'Impact' }); break; }

      // cutoff when the orbit's energy matches a circular orbit at the target (upper stage only)
      if (stage === veh.stages.length - 1) {
        const v2 = y[2] * y[2] + y[3] * y[3];
        const eps = v2 / 2 - C.muE / y[0];
        if (eps >= -C.muE / (2 * (C.RE + hT))) { events.push({ t, label: st.name + ' cutoff — orbit' }); result = { outcome: 'orbit' }; break; }
      }
      if (propLeft <= 0) {
        mass -= propLeft * 0; // already consumed
        events.push({ t, label: st.name + ' burnout' });
        if (stage === veh.stages.length - 1) { result = { outcome: 'burnout' }; break; }
        mass -= st.dry;
        stage++;
        propLeft = veh.stages[stage].prop;
        events.push({ t, label: veh.stages[stage].name + ' ignition' });
      }
    }
    if (!result) result = { outcome: 'timeout' };
    const r = y[0], v = Math.hypot(y[2], y[3]);
    const phi = Math.atan2(y[2], Math.abs(y[3]));
    const el = elementsFromRV(r, v, phi, C.muE);
    trace.push({ t, h: r - C.RE, x: y[1] * C.RE, v, q: 0, g: 0, gamma: phi, beta: 0, stage, m: mass });
    return {
      ...result, t, trace, events, el,
      perigee: el.rp - C.RE, apogee: el.ra - C.RE,
      v, h: r - C.RE, propLeft: Math.max(0, propLeft), stage,
      losses: { gravity: lossG, drag: lossD, steering: lossS }, dvIdeal, rotV: dir * rotV, maxQ, maxG,
    };
  }

  /* ---------- Earth–Moon circular restricted three-body problem (planar, inertial, barycentric) ---------- */
  const EM = (function () {
    const mu = C.muE + C.muM;
    const w = Math.sqrt(mu / Math.pow(C.DEM, 3));
    const dE = C.DEM * C.muM / mu, dM = C.DEM * C.muE / mu;
    return {
      w, dE, dM,
      earth: (t) => [-dE * Math.cos(w * t), -dE * Math.sin(w * t)],
      moon: (t) => [dM * Math.cos(w * t), dM * Math.sin(w * t)],
      moonVel: (t) => [-dM * w * Math.sin(w * t), dM * w * Math.cos(w * t)],
      earthVel: (t) => [dE * w * Math.sin(w * t), -dE * w * Math.cos(w * t)],
    };
  })();

  /* opts: parkAlt (m), dv (m/s), burnAngle (deg, position of TLI burn measured from the Earth→Moon line at t=0),
           loi: { dv } optional retro burn at first periselene, tMax (s) */
  function simulateTLI(opts) {
    const parkAlt = opts.parkAlt ?? 185000;
    const r0 = C.RE + parkAlt;
    const phi = (opts.burnAngle ?? 0) * Math.PI / 180;
    const vc = Math.sqrt(C.muE / r0);
    const v0 = vc + opts.dv;
    const E0 = EM.earth(0), VE0 = EM.earthVel(0);
    let y = [E0[0] + r0 * Math.cos(phi), E0[1] + r0 * Math.sin(phi), VE0[0] - v0 * Math.sin(phi), VE0[1] + v0 * Math.cos(phi)];
    const tMax = opts.tMax ?? 10 * 86400;
    const f = (t, s) => {
      const e = EM.earth(t), m = EM.moon(t);
      const dxE = s[0] - e[0], dyE = s[1] - e[1], dxM = s[0] - m[0], dyM = s[1] - m[1];
      const rE3 = Math.pow(dxE * dxE + dyE * dyE, 1.5), rM3 = Math.pow(dxM * dxM + dyM * dyM, 1.5);
      return [s[2], s[3], -C.muE * dxE / rE3 - C.muM * dxM / rM3, -C.muE * dyE / rE3 - C.muM * dyM / rM3];
    };
    const pts = [];
    let t = 0;
    let minM = { r: Infinity, t: 0 }, outcome = 'coast', loiDone = false, loiT = null, mccDone = !opts.mcc || !opts.mcc.dv;
    let prevRM = Infinity, leftEarth = false, perigee = null, rEprev = r0;
    let sinceRecord = Infinity, minRet = Infinity;
    while (t < tMax) {
      const e = EM.earth(t), m = EM.moon(t);
      const rE = Math.hypot(y[0] - e[0], y[1] - e[1]);
      const rM = Math.hypot(y[0] - m[0], y[1] - m[1]);
      if (rM < 3e7 || rE < 3e7 || sinceRecord >= 600 || pts.length === 0) {
        pts.push({ t, x: y[0], y: y[1], ex: e[0], ey: e[1], mx: m[0], my: m[1], rE, rM });
        sinceRecord = 0;
      }
      if (rM < minM.r) minM = { r: rM, t };
      // midcourse correction: prograde (+) or retrograde (−) relative to Earth
      if (!mccDone && t >= opts.mcc.t) {
        const ve = EM.earthVel(t);
        const vx = y[2] - ve[0], vy = y[3] - ve[1], sp = Math.hypot(vx, vy);
        y[2] += opts.mcc.dv * vx / sp; y[3] += opts.mcc.dv * vy / sp;
        mccDone = true;
        pts.push({ t, x: y[0], y: y[1], ex: e[0], ey: e[1], mx: m[0], my: m[1], rE, rM, burn: 'MCC' });
      }
      if (rE > 5e7) leftEarth = true;
      if (leftEarth && rE < minRet) minRet = rE;
      if (rM < C.RM) { outcome = 'impact'; break; }
      // LOI: retro burn at first periselene inside the Moon's sphere of influence
      if (opts.loi && !loiDone && rM > prevRM && prevRM < 6.6e7) {
        const vm = EM.moonVel(t);
        const rvx = y[2] - vm[0], rvy = y[3] - vm[1];
        const sp = Math.hypot(rvx, rvy);
        const k = Math.max(0, sp - opts.loi.dv) / sp;
        y[2] = vm[0] + rvx * k; y[3] = vm[1] + rvy * k;
        loiDone = true; loiT = t;
        pts.push({ t, x: y[0], y: y[1], ex: e[0], ey: e[1], mx: m[0], my: m[1], rE, rM, burn: 'LOI' });
      }
      prevRM = rM;
      if (loiDone && t > loiT + 2 * 86400) break;
      if (leftEarth && rE < C.RE + C.entryInterface) {
        outcome = 'entry';
        // estimate vacuum perigee from two-body Earth elements here
        const ve = EM.earthVel(t);
        const vx = y[2] - ve[0], vy = y[3] - ve[1];
        const rx = y[0] - e[0], ry = y[1] - e[1];
        const v = Math.hypot(vx, vy);
        const fpa = Math.asin((rx * vx + ry * vy) / (rE * v));
        const el = elementsFromRV(rE, v, fpa, C.muE);
        perigee = { alt: el.rp - C.RE, t, v, fpa };
        pts.push({ t, x: y[0], y: y[1], ex: e[0], ey: e[1], mx: m[0], my: m[1], rE, rM });
        break;
      }
      if (rE < C.RE) { outcome = 'impactE'; break; }
      rEprev = rE;
      const dt = Math.max(2, Math.min(900, 0.012 * Math.min(Math.pow(rE, 1.5) / Math.sqrt(C.muE), Math.pow(rM, 1.5) / Math.sqrt(C.muM))));
      y = rk4(f, t, y, dt);
      t += dt;
      sinceRecord += dt;
    }
    const last = pts[pts.length - 1];
    if (!last || last.t !== t) {
      const e = EM.earth(t), m = EM.moon(t);
      pts.push({ t, x: y[0], y: y[1], ex: e[0], ey: e[1], mx: m[0], my: m[1], rE: Math.hypot(y[0] - e[0], y[1] - e[1]), rM: Math.hypot(y[0] - m[0], y[1] - m[1]) });
    }
    if (outcome === 'coast') {
      const lp = pts[pts.length - 1];
      if (loiDone && lp.rM < 6.6e7) outcome = 'lunarOrbit';
      else if (lp.rE > 1.5e9) outcome = 'escape';
      else if (lp.rE > 5e8) outcome = 'flung';
    }
    const retAlt = perigee ? perigee.alt : minRet - C.RE;
    return { pts, outcome, minM: { alt: minM.r - C.RM, t: minM.t }, perigee, retAlt, loiT, t, v0, vc };
  }

  // Find the MCC Δv (m/s, along-track) that gives a return vacuum perigee of targetAlt (Mission Control's job).
  function solveMCC(opts, targetAlt = 40000, range = 15) {
    const f = (dv) => {
      const r = simulateTLI({ ...opts, loi: null, mcc: { t: opts.mcc.t, dv }, tMax: 12 * 86400 });
      return r.outcome === 'impact' ? NaN : r.retAlt - targetAlt;
    };
    let best = null;
    const N = 60;
    let prev = { dv: -range, v: f(-range) };
    for (let i = 1; i <= N; i++) {
      const dv = -range + 2 * range * i / N, v = f(dv);
      if (isFinite(v) && isFinite(prev.v) && Math.sign(v) !== Math.sign(prev.v) && Math.abs(v - prev.v) < 2e8) {
        let lo = prev.dv, hi = dv, vlo = prev.v;
        for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2, vm = f(m); if (!isFinite(vm)) break; if (Math.sign(vm) === Math.sign(vlo)) { lo = m; vlo = vm; } else hi = m; }
        const cand = (lo + hi) / 2;
        if (Math.abs(f(cand)) < 15000 && (!best || Math.abs(cand) < Math.abs(best))) best = cand;
      }
      prev = { dv, v };
    }
    return best;
  }

  /* ---------- Atmospheric entry (planar, non-rotating spherical Earth) ---------- */
  /* opts: v0 (m/s), gamma0 (deg, negative), mass, cd, area, ld (L/D), bank (deg), noseRadius (m) */
  function simulateEntry(opts) {
    const m = opts.mass ?? 5500, cd = opts.cd ?? 1.3, A = opts.area ?? 12.0, ld = opts.ld ?? 0.3;
    const bank = (opts.bank ?? 50) * Math.PI / 180, rn = opts.noseRadius ?? 4.7;
    let y = [C.entryInterface, opts.v0 ?? 11000, (opts.gamma0 ?? -6.5) * Math.PI / 180, 0];
    const f = (t, s) => {
      const [h, v, g] = s;
      const r = C.RE + h;
      const rho = density(h);
      const D = 0.5 * rho * v * v * cd * A / m;
      const L = D * ld;
      const gr = C.muE / (r * r);
      return [v * Math.sin(g), -D - gr * Math.sin(g), (L * Math.cos(bank) - (gr - v * v / r) * Math.cos(g)) / v, v * Math.cos(g) * C.RE / r];
    };
    const trace = [];
    let t = 0, maxG = 0, maxQ = 0, heatLoad = 0, maxQdot = 0, outcome = 'landed', minH = Infinity, dipped = false;
    const dt = 0.25;
    while (t < 3000) {
      const [h, v, g] = y;
      const rho = density(h);
      const D = 0.5 * rho * v * v * cd * A / m;
      const gl = D * Math.sqrt(1 + ld * ld) / C.g0;
      const qdot = 1.7415e-4 * Math.sqrt(rho / rn) * v * v * v;   // Sutton–Graves, W/m²
      if (gl > maxG) maxG = gl;
      if (qdot > maxQdot) maxQdot = qdot;
      heatLoad += qdot * dt;
      if (h < minH) minH = h;
      if (h < 90000) dipped = true;
      if (trace.length === 0 || t - trace[trace.length - 1].t >= 1) trace.push({ t, h, v, gamma: g, g: gl, qdot, s: y[3] });
      if (h <= 7300) { outcome = 'landed'; break; }                // drogue chutes ~7.3 km
      if (h > C.entryInterface + 1000 && g > 0) { outcome = 'skip'; break; }
      y = rk4(f, t, y, dt);
      t += dt;
    }
    trace.push({ t, h: y[0], v: y[1], gamma: y[2], g: 0, qdot: 0, s: y[3] });
    return { trace, maxG, maxQdot, heatLoad, outcome, t, range: y[3], minH, vEnd: y[1] };
  }

  const Phys = { C, elementsFromRV, solveKepler, trueFromEcc, eccFromTrue, timeSincePeriapsis, rocket, rk4, SATURN_V, simulateAscent, EM, simulateTLI, solveMCC, simulateEntry, density, pressure };
  root.Phys = Phys;
  if (typeof module !== 'undefined' && module.exports) module.exports = Phys;
})(typeof window !== 'undefined' ? window : globalThis);
