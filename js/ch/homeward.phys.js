/* Planning the Return: pure physics for the homeward module (no DOM). Loaded before js/ch/homeward.js; also runs in Node.
   Planar patched conics for the trans-Earth trajectory:
   - Moon-centred: circular lunar orbit (clockwise seen from the north, the sense a free-return arrival leaves it),
     prograde TEI impulse, hyperbola out to the Moon's sphere of influence;
   - Earth-centred: conic from the sphere exit to the entry interface (122 km), with an optional midcourse correction.
   The Moon circles Earth at v_M = sqrt(μ⊕/D), the value used in the hand calculation. Everything is analytic
   (Kepler's equation for ellipses and hyperbolas), so the result is exact for the model and smooth in the inputs. */
(function (root) {
  'use strict';
  const Phys = root.Phys || (typeof require !== 'undefined' ? require('../physics.js') : null);
  const C = Phys.C;
  const muE = C.muE, muM = C.muM, RE = C.RE, RM = C.RM, D = C.DEM;
  const VM = Math.sqrt(muE / D), W = VM / D;               // Moon's orbital speed (m/s) and rate (rad/s)
  const REI = RE + C.entryInterface;                      // entry interface radius (122 km)
  const R_SOI = Phys.R_SOI;
  const CORRIDOR = { shallow: -5.3, steep: -7.4, target: -6.5 };   // flight-path angle at 122 km, degrees (as module entry)
  const TAU = 2 * Math.PI;
  const wrap = (a) => { a = ((a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a; };

  /* ---------- conics in the plane: signed angular momentum (h > 0 counter-clockwise) ---------- */
  function conic(s, mu) {
    const [x, y, vx, vy] = s, r = Math.hypot(x, y), v2 = vx * vx + vy * vy;
    const h = x * vy - y * vx;
    const ex = (vy * h) / mu - x / r, ey = (-vx * h) / mu - y / r;
    const e = Math.hypot(ex, ey), eps = v2 / 2 - mu / r, a = -mu / (2 * eps), p = h * h / mu;
    const w = e > 1e-10 ? Math.atan2(ey, ex) : Math.atan2(y, x);
    const sg = h >= 0 ? 1 : -1;
    const nu = wrap(sg * (Math.atan2(y, x) - w));            // true anomaly, counted in the direction of motion
    return { mu, h, sg, e, eps, a, p, w, nu, rp: p / (1 + e), ra: e < 1 ? p / (1 - e) : Infinity };
  }
  function stateAt(c, nu) {
    const r = c.p / (1 + c.e * Math.cos(nu)), th = c.w + c.sg * nu;
    const vr = Math.sqrt(c.mu / c.p) * c.e * Math.sin(nu), vt = Math.abs(c.h) / r;
    const ur = [Math.cos(th), Math.sin(th)], ut = [-c.sg * Math.sin(th), c.sg * Math.cos(th)];
    return [r * ur[0], r * ur[1], vr * ur[0] + vt * ut[0], vr * ur[1] + vt * ut[1]];
  }
  // time from periapsis to true anomaly nu (negative before periapsis)
  function tPeri(c, nu) {
    const e = c.e, mu = c.mu;
    if (e < 1) {
      const E = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(nu / 2));
      return (E - e * Math.sin(E)) / Math.sqrt(mu / Math.pow(c.a, 3));
    }
    const F = 2 * Math.atanh(Math.sqrt((e - 1) / (e + 1)) * Math.tan(nu / 2));
    return (e * Math.sinh(F) - F) / Math.sqrt(mu / Math.pow(-c.a, 3));
  }
  // true anomaly at time t from periapsis
  function nuAt(c, t) {
    const e = c.e, mu = c.mu;
    if (e < 1) {
      const n = Math.sqrt(mu / Math.pow(c.a, 3)), T = TAU / n;
      const k = Math.round(t / T), M = n * (t - k * T);       // M in [−π, π]
      const E = Phys.solveKepler(M, e);
      return wrap(2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)));
    }
    const n = Math.sqrt(mu / Math.pow(-c.a, 3)), M = n * t;
    let F = Math.asinh(M / e);
    for (let i = 0; i < 60; i++) { const d = (e * Math.sinh(F) - F - M) / (e * Math.cosh(F) - 1); F -= d; if (Math.abs(d) < 1e-13) break; }
    return 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(F / 2));
  }
  // outbound (nu > 0) or inbound (nu < 0) true anomaly at radius r; null if the conic never reaches r
  function nuAtR(c, r, outbound) {
    const cs = (c.p / r - 1) / c.e;
    if (!(c.e > 0) || cs < -1 || cs > 1) return null;
    const nu = Math.acos(cs);
    return outbound ? nu : -nu;
  }

  const moonPos = (t) => [D * Math.cos(W * t), D * Math.sin(W * t)];
  const moonVel = (t) => [-VM * Math.sin(W * t), VM * Math.cos(W * t)];

  /* ---------- lunar parking orbit ----------
     t = 0: the CSM is over the sub-Earth point. Burn position φ: angle from the far-side midpoint (the point
     opposite Earth), measured against the direction of motion, so φ > 0 means "before the far-side midpoint". */
  function lunarOrbit(alt) {
    const r = RM + alt, vc = Math.sqrt(muM / r), n = vc / r;
    const P = TAU / n, Psyn = TAU / (n + W);                 // sidereal period, and period relative to the Earth line
    const losPhi = Math.asin(Math.min(1, RM / r));           // occultation: |sin φ| r < R☾ on the far side
    return { r, vc, n, P, Psyn, losPhi };
  }
  // angle of the CSM from the far-side midpoint at time t (radians, decreasing: clockwise orbit, Earth line turning anticlockwise)
  const phiAt = (lo, t) => Math.PI - (lo.n + W) * t;
  // TEI time for burn position phi (rad) on revolution rev (1, 2, …)
  const tTEI = (lo, phi, rev = 1) => (Math.PI - phi + TAU * (rev - 1)) / (lo.n + W);
  // Moon-centred state on the parking orbit at time t
  function parkState(lo, t) {
    const a = Math.PI - lo.n * t;                            // inertial angle (from +x), clockwise
    return [lo.r * Math.cos(a), lo.r * Math.sin(a), lo.vc * Math.sin(a), -lo.vc * Math.cos(a)];
  }

  /* ---------- the return: TEI → sphere of influence → (MCC) → entry interface ----------
     opts: alt (m, lunar orbit), dv (m/s, TEI, prograde), phi (deg, burn position), rev (1…), dvErr (m/s, execution
     error added to dv), mcc: { dt (s after TEI), dv (m/s, horizontal: + raises perigee) } */
  function fly(opts) {
    const lo = lunarOrbit(opts.alt ?? 110e3);
    const phi = (opts.phi ?? 50) * Math.PI / 180, rev = opts.rev ?? 1;
    const t0 = tTEI(lo, phi, rev), dv = (opts.dv ?? 0) + (opts.dvErr ?? 0);
    const s0 = parkState(lo, t0);
    const sp = Math.hypot(s0[2], s0[3]), k = (sp + dv) / sp;
    const sM = [s0[0], s0[1], s0[2] * k, s0[3] * k];
    const cM = conic(sM, muM);
    const res = { lo, t0, dv, cM, hyp: cM.e >= 1, vinf: cM.eps > 0 ? Math.sqrt(2 * cM.eps) : 0, legs: [], outcome: null };
    res.thInf = cM.e > 1 ? Math.acos(-1 / cM.e) : null;
    // leaving the sphere of influence
    const nuX = nuAtR(cM, R_SOI, true);
    if (nuX == null) { res.outcome = 'captured'; return res; }
    const tX = t0 + tPeri(cM, nuX) - tPeri(cM, cM.nu);
    res.tSOI = tX;
    res.legM = { c: cM, t0, nu0: cM.nu, nu1: nuX, tp: t0 - tPeri(cM, cM.nu) };
    const sX = stateAt(cM, nuX), m = moonPos(tX), mv = moonVel(tX);
    const sE = [sX[0] + m[0], sX[1] + m[1], sX[2] + mv[0], sX[3] + mv[1]];
    res.exit = { s: sE, vRel: Math.hypot(sX[2], sX[3]), v: Math.hypot(sE[2], sE[3]), r: Math.hypot(sE[0], sE[1]) };
    let cE = conic(sE, muE);
    res.cE0 = cE;
    let legs = [{ c: cE, tStart: tX, nuStart: cE.nu, tp: tX - tPeri(cE, cE.nu) }];
    // midcourse correction, horizontal (perpendicular to the radius, in the sense of motion)
    if (opts.mcc && opts.mcc.dv) {
      const tm = t0 + opts.mcc.dt;
      if (tm > tX) {
        const L = legs[0], nu = nuAt(L.c, tm - L.tp);
        const arr = arrival(L.c, L.tStart, L.nuStart, L.tp);
        if (!arr || tm < arr.t) {
          const s = stateAt(L.c, nu), r = Math.hypot(s[0], s[1]);
          const ut = [-L.c.sg * s[1] / r, L.c.sg * s[0] / r];
          const s2 = [s[0], s[1], s[2] + opts.mcc.dv * ut[0], s[3] + opts.mcc.dv * ut[1]];
          const c2 = conic(s2, muE);
          L.tEnd = tm; L.nuEnd = nu;
          legs.push({ c: c2, tStart: tm, nuStart: c2.nu, tp: tm - tPeri(c2, c2.nu), mcc: true });
          res.mccT = tm; res.mccState = s; res.mccR = r;
        }
      }
    }
    const last = legs[legs.length - 1];
    cE = last.c;
    res.cE = cE;
    res.periAlt = cE.rp - RE;
    const arr = arrival(cE, last.tStart, last.nuStart, last.tp);
    if (arr) {
      last.tEnd = arr.t; last.nuEnd = arr.nu;
      res.tEI = arr.t; res.tof = arr.t - t0;
      res.vEI = Math.sqrt(2 * (cE.eps + muE / REI));
      res.gamma = -Math.acos(Math.min(1, Math.abs(cE.h) / (REI * res.vEI))) * 180 / Math.PI;
      res.outcome = res.gamma > CORRIDOR.shallow ? 'shallow' : res.gamma < CORRIDOR.steep ? 'steep' : 'corridor';
    } else {
      // never reaches 122 km: passes perigee above the atmosphere, or leaves for good
      res.outcome = cE.rp > REI ? (cE.e < 1 ? 'miss' : 'escape') : 'escape';
      const span = cE.e < 1 ? Math.min(cE.ra < 2e9 ? TAU / Math.sqrt(muE / Math.pow(cE.a, 3)) : 12 * 86400, 12 * 86400) : 4 * 86400;
      last.tEnd = last.tStart + span; last.nuEnd = null;
      if (cE.rp > REI) {
        const tPer = last.tp + (last.nuStart > 0 && cE.e < 1 ? TAU / Math.sqrt(muE / Math.pow(cE.a, 3)) : 0);
        if (tPer > last.tStart) res.tPerigee = tPer;
      }
    }
    res.legs = legs;
    return res;
  }
  // first arrival at the entry interface after (tStart, nuStart) on Earth conic c; null if none within 12 days
  function arrival(c, tStart, nuStart, tp) {
    if (c.rp >= REI) return null;
    const nuI = nuAtR(c, REI, false);
    if (nuI == null) return null;
    let t = tp + tPeri(c, nuI);
    if (t < tStart - 1) {
      if (c.e >= 1) return null;
      t += TAU / Math.sqrt(muE / Math.pow(c.a, 3));
    }
    if (t - tStart > 12 * 86400) return null;
    return { t, nu: nuI };
  }

  // Earth-centred position of the spacecraft at time t of a flight (null before TEI)
  function posAt(res, t) {
    if (t <= res.t0 || !res.legM) {
      const s = parkState(res.lo, Math.min(t, res.t0)), m = moonPos(t);
      return { x: s[0] + m[0], y: s[1] + m[1], phase: 'park' };
    }
    if (t <= res.tSOI) {
      const L = res.legM, nu = nuAt(L.c, t - L.tp), s = stateAt(L.c, nu), m = moonPos(t);
      return { x: s[0] + m[0], y: s[1] + m[1], phase: 'M', rel: s };
    }
    for (const L of res.legs) {
      if (t <= (L.tEnd ?? Infinity) || L === res.legs[res.legs.length - 1]) {
        const s = stateAt(L.c, nuAt(L.c, Math.min(t, L.tEnd ?? t) - L.tp));
        return { x: s[0], y: s[1], phase: 'E', s };
      }
    }
    return null;
  }
  // samples of the whole flight for drawing: [{t, x, y}] Earth-centred, denser near the bodies
  function samples(res, n = 500) {
    const out = [];
    if (!res.legM) return out;
    const tEnd = res.tEI ?? res.legs[res.legs.length - 1].tEnd;
    // the hyperbola: sample in true anomaly (fine near the Moon)
    const L = res.legM;
    for (let i = 0; i <= 120; i++) {
      const nu = L.nu0 + (L.nu1 - L.nu0) * i / 120, t = L.tp + tPeri(L.c, nu), s = stateAt(L.c, nu), m = moonPos(t);
      out.push({ t, x: s[0] + m[0], y: s[1] + m[1], phase: 'M' });
    }
    for (const E of res.legs) {
      const t1 = E.tEnd ?? tEnd;
      for (let i = 1; i <= n; i++) {
        // ease the time steps so the fast fall into Earth keeps enough points
        const u = i / n, t = E.tStart + (t1 - E.tStart) * (1 - Math.pow(1 - u, 2.2));
        const s = stateAt(E.c, nuAt(E.c, t - E.tp));
        out.push({ t, x: s[0], y: s[1], phase: E.mcc ? 'E2' : 'E' });
      }
    }
    return out;
  }

  /* ---------- hand calculations (what the candidate does on paper) ---------- */
  // Minimum-energy return: apogee of the return ellipse at the Moon's distance, perigee at rpAlt (vacuum)
  function handMinEnergy(alt = 110e3, rpAlt = 40e3) {
    const rp = RE + rpAlt, a = (D + rp) / 2;
    const va = Math.sqrt(muE * (2 / D - 1 / a));
    const vinf = VM - va;
    const r = RM + alt, vc = Math.sqrt(muM / r), vhyp = Math.sqrt(vinf * vinf + 2 * muM / r);
    const e = 1 + r * vinf * vinf / muM, thInf = Math.acos(-1 / e);
    const tof = Math.PI * Math.sqrt(a * a * a / muE);
    // asymptote opposite the Moon's velocity: −90° from the far-side direction; burn θ∞ earlier along the orbit
    const phi = (thInf - Math.PI / 2) * 180 / Math.PI;
    return { rp, a, va, vM: VM, vinf, r, vc, vhyp, dv: vhyp - vc, e, thInf, phi, tof };
  }
  // Faster return with a given TEI Δv: the geocentric velocity at the Moon gains an inbound radial part.
  // Solves for the angle ψ between v∞ and the backward direction (−v_M) that keeps the perigee at rpAlt.
  function handGivenDv(alt, dv, rpAlt = 40e3) {
    const r = RM + alt, vc = Math.sqrt(muM / r), vhyp = vc + dv;
    const vinf2 = vhyp * vhyp - 2 * muM / r;
    if (!(vinf2 > 0)) return null;
    const vinf = Math.sqrt(vinf2), rp = RE + rpAlt;
    // D²(vM − v∞ c)² = rp²(vM² + v∞² − 2 vM v∞ c − 2μ/D + 2μ/rp): quadratic in c = cos ψ
    const A = D * D * vinf2, B = -2 * D * D * VM * vinf + 2 * rp * rp * VM * vinf;
    const Cc = D * D * VM * VM - rp * rp * (VM * VM + vinf2 - 2 * muE / D + 2 * muE / rp);
    const disc = B * B - 4 * A * Cc;
    if (disc < 0) return null;
    const roots = [(-B - Math.sqrt(disc)) / (2 * A), (-B + Math.sqrt(disc)) / (2 * A)].filter((c) => c >= -1 && c <= 1);
    // keep the prograde return (v_t > 0) with the largest cos ψ
    const cpsi = roots.filter((c) => VM - vinf * c > 0).sort((a, b) => b - a)[0];
    if (cpsi == null) return null;
    const psi = Math.acos(cpsi);
    const vt = VM - vinf * cpsi, vr = -vinf * Math.sin(psi), v = Math.hypot(vt, vr);
    const e = 1 + r * vinf2 / muM, thInf = Math.acos(-1 / e);
    const phi = (thInf - Math.PI / 2 - psi) * 180 / Math.PI;
    // time from the Moon's distance to perigee on the geocentric conic
    const cE = conic([D, 0, vr, vt], muE);
    const nuI = nuAtR(cE, D, false);
    const tof = -tPeri(cE, nuI);
    return { r, vc, vhyp, vinf, psi, vt, vr, v, e, thInf, phi, tof, a: cE.a, dv };
  }
  // entry flight-path angle at 122 km for a vacuum perigee rpAlt and the Moon-distance return energy
  function gammaFromPerigee(rpAlt, apo = D) {
    const rp = RE + rpAlt, a = (apo + rp) / 2, eps = -muE / (2 * a);
    const vp = Math.sqrt(2 * (eps + muE / rp)), h = rp * vp, v = Math.sqrt(2 * (eps + muE / REI));
    return -Math.acos(Math.min(1, h / (REI * v))) * 180 / Math.PI;
  }

  /* ---------- Mission Control solvers (bisection on a smooth model) ---------- */
  // burn positions φ (deg) that give the vacuum perigee target (m altitude) at a given Δv, sorted by flight time (fast first).
  // The perigee is smooth in φ but very steep (about 1 000 km per degree), so scan in 0.25° steps and refine by bisection.
  function solvePhi(opts, target = 40e3, lo = -60, hi = 120) {
    const g = (p) => fly({ ...opts, phi: p, mcc: null, dvErr: 0 }).periAlt - target;
    const roots = [];
    let pp = lo, pv = g(lo);
    for (let p = lo + 0.25; p <= hi + 1e-9; p += 0.25) {
      const v = g(p);
      if (isFinite(v) && isFinite(pv) && Math.sign(v) !== Math.sign(pv) && Math.abs(v - pv) < 2e6) {
        let a = pp, b = p, va = pv;
        for (let k = 0; k < 50; k++) { const m = (a + b) / 2, vm = g(m); if (Math.sign(vm) === Math.sign(va)) { a = m; va = vm; } else b = m; }
        roots.push((a + b) / 2);
      }
      pp = p; pv = v;
    }
    return roots.sort((x, y) => (fly({ ...opts, phi: x }).tof || 1e12) - (fly({ ...opts, phi: y }).tof || 1e12));
  }
  // horizontal MCC Δv at a given time after TEI that brings the entry angle to the target
  function solveMCC(opts, target = CORRIDOR.target, range = 60) {
    const g = (dv) => { const r = fly({ ...opts, mcc: { dt: opts.mcc.dt, dv } }); return r.gamma ?? 0; };
    return scan(g, target, -range, range, 240, 0);
  }
  // scan [lo, hi] for sign changes of g − target inside the atmosphere-hitting band, refine by bisection,
  // return the root closest to `near` (or the smallest |x| if near is undefined)
  function scan(g, target, lo, hi, N, near) {
    let best = null, px = lo, pv = g(lo) - target;
    for (let i = 1; i <= N; i++) {
      const x = lo + (hi - lo) * i / N, v = g(x) - target;
      if (isFinite(v) && isFinite(pv) && Math.sign(v) !== Math.sign(pv) && Math.abs(v - pv) < 6) {
        let a = px, b = x, va = pv;
        for (let k = 0; k < 60; k++) { const m = (a + b) / 2, vm = g(m) - target; if (!isFinite(vm)) break; if (Math.sign(vm) === Math.sign(va)) { a = m; va = vm; } else b = m; }
        const root = (a + b) / 2;
        if (Math.abs(g(root) - target) < 0.05) {
          const ref = near ?? 0;
          if (best == null || Math.abs(root - ref) < Math.abs(best - ref)) best = root;
        }
      }
      px = x; pv = v;
    }
    return best;
  }
  // sensitivity of the vacuum perigee (km per unit of the input) by central differences
  function sensitivity(opts, key, step) {
    const f = (d) => { const o = { ...opts }; if (key === 'mcc') o.mcc = { dt: opts.mcc.dt, dv: (opts.mcc.dv || 0) + d }; else o[key] = opts[key] + d; return fly(o).periAlt / 1000; };
    return (f(step) - f(-step)) / (2 * step);
  }

  const P = { muE, muM, RE, RM, D, VM, W, REI, R_SOI, CORRIDOR, conic, stateAt, tPeri, nuAt, nuAtR, lunarOrbit, phiAt, tTEI, parkState, moonPos, moonVel,
    fly, posAt, samples, handMinEnergy, handGivenDv, gammaFromPerigee, solvePhi, solveMCC, sensitivity };
  root.Phys_homeward = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
