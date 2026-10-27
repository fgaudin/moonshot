/* When to Burn: pure physics for the timing module (no DOM). Loaded before js/ch/timing.js; also runs in Node.
   Two circular coplanar orbits around one body, both moving counterclockwise. Angles in radians, times in s,
   distances in m. Phase angle φ = θ_target − θ_chaser, measured in the direction of motion. */
(function (root) {
  'use strict';
  const TWO_PI = 2 * Math.PI;
  const P = {};

  // [0, 2π) and (−π, π]
  P.wrap = (x) => ((x % TWO_PI) + TWO_PI) % TWO_PI;
  P.wrapPi = (x) => { const y = P.wrap(x); return y > Math.PI ? y - TWO_PI : y; };

  // mean motion of a circular orbit (or any orbit of semi-major axis a)
  P.meanMotion = (mu, a) => Math.sqrt(mu / (a * a * a));
  // Hohmann transfer time between circular radii r1 and r2: half the transfer ellipse's period
  P.hohmannTime = (mu, r1, r2) => { const at = (r1 + r2) / 2; return Math.PI * Math.sqrt(at * at * at / mu); };
  // phase angle the target must have when the chaser fires: the chaser travels π, the target n2·TOF
  P.requiredPhase = (mu, r1, r2) => P.wrapPi(Math.PI - P.meanMotion(mu, r2) * P.hohmannTime(mu, r1, r2));
  P.synodic = (n1, n2) => TWO_PI / Math.abs(n1 - n2);
  // time from now until the phase angle equals phiReq. φ changes at (n2 − n1): it falls when the chaser is lower
  // (faster), rises when it is higher. The result lies in [0, T_syn).
  P.waitTime = (phiNow, phiReq, n1, n2) => {
    const d = n1 > n2 ? phiNow - phiReq : phiReq - phiNow;
    return P.wrap(d) / Math.abs(n1 - n2);
  };

  // A scenario: { mu, r1 (chaser), r2 (target), t0 (GET of the fix, s), th1, th2 (angles at t0, rad) }
  P.setup = (sc) => {
    const n1 = P.meanMotion(sc.mu, sc.r1), n2 = P.meanMotion(sc.mu, sc.r2);
    const tof = P.hohmannTime(sc.mu, sc.r1, sc.r2), phiReq = P.requiredPhase(sc.mu, sc.r1, sc.r2);
    const phi0 = P.wrapPi(sc.th2 - sc.th1);
    const wait = P.waitTime(phi0, phiReq, n1, n2);
    return { n1, n2, tof, phiReq, phi0, wait, tig: sc.t0 + wait, syn: P.synodic(n1, n2) };
  };
  P.chaserAngle = (sc, s, t) => sc.th1 + s.n1 * (t - sc.t0);
  P.targetAngle = (sc, s, t) => sc.th2 + s.n2 * (t - sc.t0);

  // Kepler's equation M = E − e sin E by Newton's method
  P.kepler = (M, e) => {
    let E = e < 0.8 ? M : Math.PI;
    for (let k = 0; k < 30; k++) { const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-13) break; }
    return E;
  };

  // The flight: chaser coasts on r1, fires an impulsive Hohmann at tig, arrives at r2 after tof and circularizes.
  // Returns the arrival geometry and a position function.
  P.fly = (sc, tig) => {
    const s = P.setup(sc);
    const r1 = sc.r1, r2 = sc.r2, up = r2 > r1;
    const at = (r1 + r2) / 2, e = Math.abs(r2 - r1) / (r1 + r2), nt = P.meanMotion(sc.mu, at);
    const thTig = P.chaserAngle(sc, s, tig), tArr = tig + s.tof;
    const thArr = thTig + Math.PI;
    const thTgtArr = P.targetAngle(sc, s, tArr);
    const miss = P.wrapPi(thTgtArr - thArr);         // > 0: target ahead of the chaser on arrival
    const dist = 2 * r2 * Math.abs(Math.sin(miss / 2));
    const chaser = (t) => {
      if (t <= tig) { const th = P.chaserAngle(sc, s, t); return { r: r1, th, phase: 'coast' }; }
      if (t >= tArr) return { r: r2, th: thArr + s.n2 * (t - tArr), phase: 'arrived' };
      // on the transfer ellipse: from periapsis (raising) or from apoapsis (lowering)
      const M = nt * (t - tig) + (up ? 0 : Math.PI);
      const E = P.kepler(M, e);
      const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
      const r = at * (1 - e * Math.cos(E));
      return { r, th: thTig + nu - (up ? 0 : Math.PI), phase: 'transfer' };
    };
    return { ...s, tigUsed: tig, tArr, thTig, thArr, thTgtArr, miss, dist, chaser, at, e };
  };

  // GET strings: "hh:mm:ss" (seconds may have decimals, with a point or a comma) or "hh:mm"; hours may exceed 24
  // ("123:45:06"). Returns seconds, or NaN if the text is not a time.
  P.parseGET = (str) => {
    const s = String(str || '').trim().replace(/\s| /g, '').replace(',', '.');
    if (!/^\d+(:\d{1,2}){1,2}(\.\d+)?$/.test(s)) return NaN;
    const parts = s.split(':').map(Number);
    if (parts.slice(1).some((x) => x >= 60)) return NaN;
    return parts.reduce((acc, x) => acc * 60 + x, 0) * (parts.length === 2 ? 60 : 1);
  };
  // seconds → "hh:mm:ss" (hours not wrapped into days, as in Apollo flight plans)
  P.fmtGET = (t) => {
    if (!isFinite(t)) return '—';
    const neg = t < 0; t = Math.round(Math.abs(t));
    const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), sec = t % 60;
    const p = (n) => String(n).padStart(2, '0');
    return `${neg ? '−' : ''}${p(h)}:${p(m)}:${p(sec)}`;
  };

  // Lab scenarios (numbers only; texts live in the chapter). Altitudes in m, GET of the fix in s, angles in degrees.
  const muE = 3.986004418e14, RE = 6.378137e6, muM = 4.9048695e12, RM = 1.7374e6, DEM = 3.844e8;
  const deg = Math.PI / 180;
  const mk = (body, h1, h2, t0, th1, phi0) => {
    const mu = body === 'moon' ? muM : muE, R = body === 'moon' ? RM : RE;
    return { body, mu, R, h1, h2, r1: R + h1, r2: R + h2, t0, th1: th1 * deg, th2: (th1 + phi0) * deg, phi0 };
  };
  P.SCENARIOS = {
    leo: mk('earth', 200e3, 700e3, 3 * 3600 + 10 * 60, 20, 42),
    above: mk('earth', 900e3, 400e3, 5 * 3600 + 25 * 60, 70, -38),
    long: mk('earth', 250e3, 400e3, 7 * 3600 + 40 * 60, 300, 1.5),
    lunar: mk('moon', 18e3, 111e3, 125 * 3600 + 20 * 60, 150, 31),
    tli: mk('earth', 185e3, DEM - RE, 1 * 3600 + 30 * 60, 10, -110),
  };

  root.Phys_timing = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
