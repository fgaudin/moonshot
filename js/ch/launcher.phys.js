/* Your Own Launcher: pure physics for the launcher module (no DOM). Loaded before js/ch/launcher.js; also runs in Node.
   Planar ascent over a round, NON-rotating Earth, exponential atmosphere (Phys.density, Phys.pressure),
   engines whose thrust and Isp depend on the ambient pressure, and a pitch program written as a table.
   Units: SI (m, s, kg, N, Pa). Angles in the pitch table: degrees from the local vertical. */
(function (root) {
  'use strict';
  const Phys = root.Phys || (typeof require !== 'undefined' ? require('../physics.js') : null);
  const { C, rk4, density, pressure, elementsFromRV } = Phys;
  const mu = C.muE, RE = C.RE, g0 = C.g0, p0 = C.p0;
  const D2R = Math.PI / 180;
  const P = {};

  /* ---------- engines ---------- */
  // Isp is linear in the ambient pressure because thrust is (fixed mass flow): Isp(p) = Isp_vac − (Isp_vac − Isp_SL) p/p0
  P.ispAt = (ispSL, ispVac, p) => ispVac - (ispVac - ispSL) * p / p0;
  P.mdot = (st) => st.fVac / (st.ispVac * g0);
  P.fSL = (st) => st.fVac * st.ispSL / st.ispVac;
  P.exitArea = (st) => (st.fVac - P.fSL(st)) / p0;            // A_e = (F_vac − F_SL)/p0
  P.thrustAt = (st, p) => st.fVac - P.exitArea(st) * p;       // F = ṁ c_vac − p_a A_e
  P.burnTime = (st) => st.prop / P.mdot(st);

  // stage-by-stage design numbers (what the candidate can compute by hand before flying)
  P.summary = (veh) => {
    let m = veh.payload;
    for (const s of veh.stages) m += s.prop + s.dry;
    const out = { m0: m, stages: [] };
    veh.stages.forEach((s, i) => {
      const m0 = m, mf = m - s.prop;
      const fIgn = i === 0 ? P.fSL(s) : s.fVac;
      out.stages.push({
        m0, mf, tb: P.burnTime(s), mdot: P.mdot(s),
        twr0: fIgn / (m0 * g0), twrF: s.fVac / (mf * g0),
        dvVac: s.ispVac * g0 * Math.log(m0 / mf),
        dvSL: s.ispSL * g0 * Math.log(m0 / mf),
      });
      m = mf - s.dry;
    });
    out.dvVac = out.stages.reduce((a, s) => a + s.dvVac, 0);
    out.twr0 = out.stages[0].twr0;
    return out;
  };

  /* ---------- pitch table: linear interpolation, held constant beyond the first and last rows ---------- */
  P.pitchAt = (rows, t) => {
    if (!rows.length) return null;
    if (t <= rows[0].t) return rows[0].pitch;
    for (let i = 1; i < rows.length; i++) {
      if (t <= rows[i].t) {
        const a = rows[i - 1], b = rows[i];
        return b.t === a.t ? b.pitch : a.pitch + (b.pitch - a.pitch) * (t - a.t) / (b.t - a.t);
      }
    }
    return rows[rows.length - 1].pitch;
  };
  P.sortRows = (rows) => rows.filter((r) => isFinite(r.t) && isFinite(r.pitch)).slice().sort((a, b) => a.t - b.t);

  /* ---------- the flight ----------
     veh: { payload, diameter, cd, stages: [{ name, prop, dry, fVac, ispSL, ispVac }] }
     prog: { kickTime (s), kickAngle (deg from vertical), rows: [{ t (s, mission time), pitch (deg from vertical) }], targetAlt (m) }
     Stage 1: vertical rise, pitch kick (ramped over 4 s), then a gravity turn (thrust along the velocity, zero angle of attack).
     Upper stage: the pitch table. Cutoff when the orbit's energy reaches that of a circular orbit at targetAlt
     (the semi-major axis is then fixed; the pitch program decides the shape). */
  P.simulate = (veh, prog, opts = {}) => {
    const rows = P.sortRows(prog.rows || []);
    const kickT = prog.kickTime, kickA = prog.kickAngle * D2R, aT = RE + prog.targetAlt;
    const epsT = -mu / (2 * aT);
    const area = Math.PI * veh.diameter * veh.diameter / 4, cd = veh.cd ?? 0.5;
    const n = veh.stages.length;
    const dtMax = opts.dt || 0.5;
    let stage = 0;
    let mass = veh.payload;
    for (const s of veh.stages) mass += s.prop + s.dry;
    const m0 = mass;
    let mEmpty = mass - veh.stages[0].prop;           // mass at which the current stage is dry
    // state: x, y, vx, vy, m, ideal Δv, gravity loss, drag loss, steering loss
    let y = [0, RE, 0, 0, mass, 0, 0, 0, 0];
    let t = 0;
    const trace = [], events = [{ t: 0, label: 'liftoff' }];
    let maxQ = { q: 0, t: 0, h: 0, v: 0 }, maxG = { g: 0, t: 0 };
    let outcome = null, cutoff = null;

    const geom = (s) => {
      const r = Math.hypot(s[0], s[1]), ur = [s[0] / r, s[1] / r], uh = [ur[1], -ur[0]];
      const v = Math.hypot(s[2], s[3]);
      const vr = s[2] * ur[0] + s[3] * ur[1], vh = s[2] * uh[0] + s[3] * uh[1];
      const path = v > 1e-6 ? Math.atan2(vh, vr) : 0;  // velocity angle from the vertical (rad)
      return { r, ur, uh, v, vr, vh, path, h: r - RE };
    };
    // commanded thrust direction, as an angle from the local vertical (rad)
    const pitchCmd = (tt, G) => {
      if (stage > 0 && rows.length) return P.pitchAt(rows, tt) * D2R;
      if (tt < kickT) return 0;
      const ramp = kickA * Math.min(1, (tt - kickT) / 4);
      return Math.max(ramp, G.path);                   // kick, then follow the velocity (gravity turn)
    };
    const deriv = (st) => (tt, s) => {
      const G = geom(s);
      const p = pressure(G.h), F = P.thrustAt(st, p), m = s[4];
      const th = pitchCmd(tt, G);
      const u = [Math.cos(th) * G.ur[0] + Math.sin(th) * G.uh[0], Math.cos(th) * G.ur[1] + Math.sin(th) * G.uh[1]];
      const aT_ = F / m;
      const rho = density(G.h), D = 0.5 * rho * G.v * G.v * cd * area / m;
      const vx = G.v > 1e-6 ? s[2] / G.v : G.ur[0], vy = G.v > 1e-6 ? s[3] / G.v : G.ur[1];
      const gl = mu / (G.r * G.r);
      const cosA = u[0] * vx + u[1] * vy;
      const sinGam = vx * G.ur[0] + vy * G.ur[1];       // flight-path angle above the horizontal
      return [s[2], s[3],
        aT_ * u[0] - D * vx - gl * G.ur[0], aT_ * u[1] - D * vy - gl * G.ur[1],
        -P.mdot(st), aT_, gl * sinGam, D, aT_ * (1 - cosA)];
    };
    const sample = (st) => {
      const G = geom(y), p = pressure(G.h), F = P.thrustAt(st, p), m = y[4];
      const rho = density(G.h), q = 0.5 * rho * G.v * G.v;
      const D = q * cd * area;
      const th = pitchCmd(t, G);
      const u = [Math.cos(th) * G.ur[0] + Math.sin(th) * G.uh[0], Math.cos(th) * G.ur[1] + Math.sin(th) * G.uh[1]];
      const vx = G.v > 1e-6 ? y[2] / G.v : 0, vy = G.v > 1e-6 ? y[3] / G.v : 0;
      const acc = Math.hypot(F * u[0] - D * vx, F * u[1] - D * vy) / m / g0;   // sensed acceleration, in g
      return { t, h: G.h, x: RE * Math.atan2(y[0], y[1]), v: G.v, q, g: acc, pitch: th / D2R, path: G.path / D2R,
        stage, m, F, isp: P.ispAt(st.ispSL, st.ispVac, p), p };
    };
    const energy = (s) => { const r = Math.hypot(s[0], s[1]); return (s[2] * s[2] + s[3] * s[3]) / 2 - mu / r; };

    // the vehicle is held down until thrust exceeds weight
    if (P.fSL(veh.stages[0]) <= m0 * g0) outcome = 'pad';

    while (!outcome) {
      const st = veh.stages[stage];
      const sm = sample(st);
      if (!trace.length || t - trace[trace.length - 1].t >= 1 - 1e-9) trace.push(sm);
      if (sm.q > maxQ.q) maxQ = { q: sm.q, t, h: sm.h, v: sm.v };
      if (sm.g > maxG.g) maxG = { g: sm.g, t };
      // step: never past burnout
      let dt = Math.min(dtMax, (y[4] - mEmpty) / P.mdot(st));
      const f = deriv(st);
      let yn = rk4(f, t, y, dt);
      // energy cutoff on the last stage: shrink the step to land on it
      if (stage === n - 1 && energy(yn) >= epsT) {
        let lo = 0, hi = dt;
        for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; if (energy(rk4(f, t, y, mid)) >= epsT) hi = mid; else lo = mid; }
        dt = hi; yn = rk4(f, t, y, dt);
        y = yn; t += dt;
        cutoff = 'energy'; outcome = 'cutoff';
        events.push({ t, label: 'cutoff', stage });
        break;
      }
      y = yn; t += dt;
      if (Math.hypot(y[0], y[1]) < RE - 1 && t > 2) { outcome = 'crash'; events.push({ t, label: 'impact' }); break; }
      if (y[4] - mEmpty <= 1e-6) {
        events.push({ t, label: 'burnout', stage });
        if (stage === n - 1) { cutoff = 'depletion'; outcome = 'cutoff'; break; }
        y[4] = mEmpty - st.dry;                        // drop the empty stage
        stage++;
        mEmpty = y[4] - veh.stages[stage].prop;
        events.push({ t, label: 'ignition', stage });
      }
      if (t > 3000) { outcome = 'timeout'; break; }
    }

    const G = geom(y);
    const st = veh.stages[stage];
    const last = sample(st);
    last.g = 0; last.F = 0;
    trace.push(last);
    const el = elementsFromRV(G.r, G.v, Math.atan2(G.vr, G.vh), mu);
    let result = outcome;
    if (outcome === 'cutoff') {
      if (el.rp - RE >= 120e3) result = 'orbit';
      else if (el.rp > RE) result = 'decay';
      else result = 'suborbital';
    }
    // coast after cutoff (vacuum, for the picture): until impact, or one revolution / 3 000 km downrange more
    const coast = [];
    if (outcome === 'cutoff') {
      let s = y.slice(0, 4), tc = 0;
      const x0 = last.x;
      const fc = (tt, z) => { const r = Math.hypot(z[0], z[1]), k = mu / (r * r * r); return [z[2], z[3], -k * z[0], -k * z[1]]; };
      for (let i = 0; i < 4000; i++) {
        const r = Math.hypot(s[0], s[1]), x = RE * Math.atan2(s[0], s[1]);
        coast.push({ t: t + tc, h: r - RE, x: x < x0 - 1 ? x + 2 * Math.PI * RE : x });
        if (r < RE || coast[coast.length - 1].x - x0 > 3.0e6) break;
        s = rk4(fc, tc, s, 5); tc += 5;
      }
    }
    const used = veh.stages.slice(0, stage).reduce((a, s) => a + s.prop, 0) + (st.prop - (y[4] - mEmpty));
    return {
      outcome: result, cutoff, t, trace, events, coast, el,
      perigee: el.rp - RE, apogee: el.ra - RE, v: G.v, h: G.h, gamma: Math.atan2(G.vr, G.vh) / D2R,
      stage, propLeft: Math.max(0, y[4] - mEmpty), propUsed: used,
      dvIdeal: y[5], losses: { gravity: y[6], drag: y[7], steering: y[8] },
      maxQ, maxG, m0,
    };
  };

  /* ---------- a reference pitch table: the linear tangent law, sampled in a few rows ----------
     tan(elevation) falls linearly with time from tan(e0) at upper-stage ignition to tan(e1) at the end of the burn.
     A coarse search over e0 and e1 maximises the periapsis. Used for "Mission Control's table" and in tests. */
  P.linearTangentRows = (tStart, tEnd, e0, e1, nRows = 5) => {
    const out = [];
    for (let k = 0; k < nRows; k++) {
      const t = tStart + (tEnd - tStart) * k / (nRows - 1);
      const tanE = Math.tan(e0 * D2R) + (Math.tan(e1 * D2R) - Math.tan(e0 * D2R)) * k / (nRows - 1);
      out.push({ t: Math.round(t), pitch: Math.round(10 * (90 - Math.atan(tanE) / D2R)) / 10 });
    }
    return out;
  };
  P.solve = (veh, prog) => {
    const sum = P.summary(veh);
    const ts = sum.stages.slice(0, -1).reduce((a, s) => a + s.tb, 0);
    const tEnd = ts + sum.stages[sum.stages.length - 1].tb;
    let best = null;
    const tryIt = (e0, e1, tE) => {
      const rows = P.linearTangentRows(Math.round(ts), tE, e0, e1);
      const r = P.simulate(veh, { ...prog, rows }, { dt: 1 });
      const score = r.outcome === 'crash' || r.outcome === 'pad' ? -1e9 : r.perigee - (r.outcome === 'orbit' ? 0 : 1e6) + (r.outcome === 'orbit' ? r.propLeft * 0.01 : 0);
      if (!best || score > best.score) best = { score, rows, e0, e1, tE, res: r };
    };
    for (let e0 = 0; e0 <= 60; e0 += 5) for (let e1 = -30; e1 <= 20; e1 += 5) tryIt(e0, e1, Math.round(tEnd));
    const b0 = best;
    for (let e0 = b0.e0 - 4; e0 <= b0.e0 + 4; e0 += 1) for (let e1 = b0.e1 - 4; e1 <= b0.e1 + 4; e1 += 1) tryIt(e0, e1, b0.tE);
    return best;
  };

  root.Phys_launcher = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
