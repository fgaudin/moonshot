/* Plane Changes: pure physics for the planes module (no DOM). Loaded before js/ch/planes.js; also runs in Node.
   Frame: Earth-centred inertial, z towards the north pole, x towards the vernal equinox. SI units, angles in radians. */
(function (root) {
  'use strict';
  const P = {};
  const mu = 3.986004418e14, RE = 6.378137e6, wE = 7.2921159e-5;
  const D2R = Math.PI / 180, TAU = 2 * Math.PI;
  P.C = { mu, RE, wE, D2R };

  // ---- small 3D vector kit ----
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => Math.hypot(a[0], a[1], a[2]);
  const unit = (a) => mul(a, 1 / norm(a));
  P.vec = { add, sub, mul, dot, cross, norm, unit };
  const wrap = (x) => ((x % TAU) + TAU) % TAU;

  // ---- formulas of the theory ----
  P.circV = (r) => Math.sqrt(mu / r);
  P.visViva = (r, a) => Math.sqrt(mu * (2 / r - 1 / a));
  P.planeDv = (v, di) => 2 * v * Math.sin(Math.abs(di) / 2);
  P.combinedDv = (v1, v2, di) => Math.sqrt(v1 * v1 + v2 * v2 - 2 * v1 * v2 * Math.cos(di));
  // PAD components (maneuver frame of the orbit before the burn) to turn the velocity by di and end at speed v2.
  // sign +1 = normal (towards h), −1 = antinormal. With v2 = v1 it is the pure plane change.
  P.pad = (v1, v2, di, sign) => ({ pro: v2 * Math.cos(di) - v1, nor: sign * v2 * Math.sin(Math.abs(di)), rad: 0 });
  // which way to burn at a node: to change the inclination by di (new − old), at the ascending node push along
  // the sign of di (normal raises i), at the descending node the opposite
  P.nodeSign = (di, node) => (node === 'an' ? 1 : -1) * Math.sign(di || 1);

  // launch azimuth (from north, clockwise) in the inertial frame, northeast solution
  P.azInertial = (lat, inc) => { const s = Math.cos(inc) / Math.cos(lat); return Math.abs(s) > 1 ? NaN : Math.asin(s); };
  P.incFromAz = (lat, az) => Math.acos(Math.max(-1, Math.min(1, Math.cos(lat) * Math.sin(az))));
  P.vEq = wE * RE;                                   // equatorial ground speed, 465 m/s
  // azimuth relative to the rotating ground, for an inertial azimuth az and an orbital speed v
  P.azRelative = (lat, az, v) => Math.atan2(v * Math.sin(az) - P.vEq * Math.cos(lat), v * Math.cos(az));
  // inverse: the inertial azimuth reached when flying the ground azimuth azR and ending at inertial speed v
  P.azFromRelative = (lat, azR, v) => {
    const w = P.vEq * Math.cos(lat), s = Math.sin(azR);
    const vr = -w * s + Math.sqrt(w * w * s * s - w * w + v * v);
    return Math.atan2(vr * s + w, vr * Math.cos(azR));
  };

  // ---- orbital elements <-> state vectors ----
  P.rv = (el) => {
    const { a, e, i, O, w, nu } = el;
    const p = a * (1 - e * e), r = p / (1 + e * Math.cos(nu));
    const xp = [r * Math.cos(nu), r * Math.sin(nu), 0], vp = [-Math.sqrt(mu / p) * Math.sin(nu), Math.sqrt(mu / p) * (e + Math.cos(nu)), 0];
    const rot = (q) => {
      const cO = Math.cos(O), sO = Math.sin(O), cw = Math.cos(w), sw = Math.sin(w), ci = Math.cos(i), si = Math.sin(i);
      return [
        (cO * cw - sO * sw * ci) * q[0] + (-cO * sw - sO * cw * ci) * q[1],
        (sO * cw + cO * sw * ci) * q[0] + (-sO * sw + cO * cw * ci) * q[1],
        (sw * si) * q[0] + (cw * si) * q[1],
      ];
    };
    return { r: rot(xp), v: rot(vp) };
  };
  // classical elements; for circular orbits w = 0 and nu = u; for equatorial ones O = 0 and u is the true longitude
  P.elements = (r, v) => {
    const h = cross(r, v), hn = norm(h), rn = norm(r), vn = norm(v);
    const i = Math.acos(Math.max(-1, Math.min(1, h[2] / hn)));
    const nv = [-h[1], h[0], 0], nn = Math.hypot(nv[0], nv[1]);
    const ev = sub(mul(r, vn * vn / mu - 1 / rn), mul(v, dot(r, v) / mu)), e = norm(ev);
    const eps = vn * vn / 2 - mu / rn, a = -mu / (2 * eps);
    const equatorial = nn < 1e-9 * hn;
    const O = equatorial ? 0 : wrap(Math.atan2(nv[1], nv[0]));
    const nodeDir = equatorial ? [1, 0, 0] : [nv[0] / nn, nv[1] / nn, 0];
    const inPlane = (x) => { const y = cross(unit(h), nodeDir); return wrap(Math.atan2(dot(x, y), dot(x, nodeDir))); };
    const u = inPlane(r);
    const circular = e < 1e-7;
    const w = circular ? 0 : inPlane(ev);
    const nu = circular ? u : wrap(u - w);
    return { a, e, i, O, w, nu, u, h: hn, hv: h, rp: a * (1 - e), ra: a * (1 + e), equatorial, T: TAU * Math.sqrt(Math.abs(a) ** 3 / mu) };
  };

  // ---- Kepler propagation (ellipses only) ----
  const eccFromTrue = (nu, e) => 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(nu / 2));
  const meanFromTrue = (nu, e) => { const E = eccFromTrue(nu, e); return wrap(E - e * Math.sin(E)); };
  const trueFromMean = (M, e) => {
    let E = e < 0.8 ? M : Math.PI;
    for (let k = 0; k < 50; k++) { const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-13) break; }
    return wrap(2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)));
  };
  P.propagate = (s, dt) => {
    const el = P.elements(s.r, s.v), n = Math.sqrt(mu / el.a ** 3);
    const nu = trueFromMean(meanFromTrue(el.nu, el.e) + n * dt, el.e);
    return P.rv({ ...el, nu });
  };
  // time from the current state until the true anomaly advances by dnu (0 < dnu ≤ 2π)
  P.timeToAdvance = (s, dnu) => {
    const el = P.elements(s.r, s.v), n = Math.sqrt(mu / el.a ** 3);
    const M0 = meanFromTrue(el.nu, el.e), M1 = meanFromTrue(el.nu + dnu, el.e);
    let dM = wrap(M1 - M0);
    if (dM < 1e-9) dM += TAU;
    return dM / n;
  };
  // time until the next ascending node ('an'), descending node ('dn'), apoapsis ('apo') or periapsis ('peri');
  // null if the event is undefined (node of an equatorial orbit, apsis of a circular one)
  P.timeTo = (s, what) => {
    const el = P.elements(s.r, s.v);
    if ((what === 'an' || what === 'dn') && el.equatorial) return null;
    if ((what === 'apo' || what === 'peri') && el.e < 1e-4) return null;
    const target = what === 'an' ? 0 : what === 'dn' ? Math.PI : what === 'peri' ? el.w : el.w + Math.PI;  // in u
    let du = wrap(target - el.u);
    if (du < 1e-9) du = TAU;
    return P.timeToAdvance(s, du);
  };

  // time until the argument of latitude (angle from the ascending node, in the orbit plane) reaches u
  P.timeToU = (s, u) => {
    const el = P.elements(s.r, s.v);
    if (el.equatorial) return null;
    let du = wrap(u - el.u);
    if (du < 1e-9) du = TAU;
    return P.timeToAdvance(s, du);
  };

  // ---- the maneuver frame: prograde along v, normal along h, radial completes it (outwards) ----
  P.frame = (r, v) => { const p = unit(v), n = unit(cross(r, v)); return { p, n, rad: cross(p, n) }; };
  P.applyBurn = (s, b) => {
    const f = P.frame(s.r, s.v);
    const dv = add(add(mul(f.p, b.pro), mul(f.n, b.nor)), mul(f.rad, b.rad));
    return { r: s.r.slice(), v: add(s.v, dv), dv: norm(dv) };
  };
  // angle between two orbit planes (between their angular momentum vectors)
  P.planeAngle = (h1, h2) => Math.acos(Math.max(-1, Math.min(1, dot(unit(h1), unit(h2)))));
  P.normalOf = (i, O) => [Math.sin(O) * Math.sin(i), -Math.cos(O) * Math.sin(i), Math.cos(i)];

  // fly a list of impulsive burns from state s0. Each burn: { when: 'in'|'an'|'dn'|'apo'|'peri', minutes, pro, nor, rad }.
  // Returns legs (state at the start of each coast, start time) and per-burn results.
  P.execute = (s0, burns) => {
    let s = { r: s0.r.slice(), v: s0.v.slice() }, t = 0;
    const legs = [{ t0: 0, s }], out = [];
    for (const b of burns) {
      const dt = b.when === 'in' ? Math.max(0, (b.minutes || 0) * 60) : b.when === 'u' ? P.timeToU(s, b.u) : P.timeTo(s, b.when);
      if (dt == null) { out.push({ ...b, error: b.when === 'an' || b.when === 'dn' || b.when === 'u' ? 'equatorial' : 'circular' }); break; }
      const sb = P.propagate(s, dt);
      t += dt;
      const before = P.elements(sb.r, sb.v), vb = norm(sb.v);
      const sa = P.applyBurn(sb, b);
      s = { r: sa.r, v: sa.v };
      const after = P.elements(s.r, s.v);
      out.push({ ...b, tig: t, dv: sa.dv, before, after, vBefore: vb, vAfter: norm(s.v), r: sb.r });
      legs.push({ t0: t, s });
    }
    return { legs, burns: out, final: P.elements(s.r, s.v), finalState: s, dvTotal: out.reduce((x, b) => x + (b.dv || 0), 0) };
  };
  // state at time t along the flown legs
  P.stateAt = (res, t) => {
    let leg = res.legs[0];
    for (const l of res.legs) if (l.t0 <= t) leg = l;
    const el = P.elements(leg.s.r, leg.s.v);
    if (!(el.e < 1)) return leg.s;
    return P.propagate(leg.s, t - leg.t0);
  };

  // ---- launch: site at latitude lat and inertial longitude lon, ground azimuth azR, inertial speed v at insertion
  // (insertion taken directly above the site: the plane is fixed by the site and the azimuth) ----
  P.launch = (lat, lon, azR, v, alt) => {
    const az = P.azFromRelative(lat, azR, v), r = RE + alt;
    const up = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
    const east = [-Math.sin(lon), Math.cos(lon), 0], north = cross(up, east);
    const vv = add(mul(north, v * Math.cos(az)), mul(east, v * Math.sin(az)));
    const el = P.elements(mul(up, r), vv);
    return { az, el, r: mul(up, r), v: vv };
  };
  // the two inertial longitudes (relative to the node Ω) where a plane of inclination inc crosses latitude lat:
  // northbound (u in the first quadrant) and southbound
  P.crossings = (lat, inc) => {
    const s = Math.sin(lat) / Math.sin(inc);
    if (Math.abs(s) > 1) return null;
    const u1 = Math.asin(s), u2 = Math.PI - u1;
    const lon = (u) => Math.atan2(Math.cos(inc) * Math.sin(u), Math.cos(u));
    return { north: { u: u1, dl: wrap(lon(u1)) }, south: { u: u2, dl: wrap(lon(u2)) } };
  };

  root.Phys_planes = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
