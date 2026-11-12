/* Chapter 8 — Returning from space: entry dynamics, heating, the corridor. Lab: entry corridor explorer. */
(function () {
  'use strict';
  const { C } = Phys;

  /*PURE-START: landing-point helpers (planar, equatorial, eastward circular orbit; no DOM)*/
  const ER = (() => {
    const mu = C.muE, RE = C.RE, rEI = RE + C.entryInterface, wE = C.omegaE, DEG = 180 / Math.PI;
    const T_CHUTE = 300;   // s from the drogues (7.3 km) to splashdown: an estimate, added to the simulated time
    // speed just after a retrograde burn at radius r0 that gives entry flight-path angle gammaDeg (negative) at the interface
    function speedForGamma(h0, gammaDeg) {
      const r0 = RE + h0, cg = Math.cos(gammaDeg / DEG);
      return Math.sqrt(2 * mu * (1 / rEI - 1 / r0) / (Math.pow(r0 / (rEI * cg), 2) - 1));
    }
    const dvForGamma = (h0, gammaDeg) => Math.sqrt(mu / (RE + h0)) - speedForGamma(h0, gammaDeg);
    // geometry and timing from the burn (apogee of the new ellipse) to the entry interface, in vacuum
    function deorbit(h0, dv) {
      const r0 = RE + h0, vc = Math.sqrt(mu / r0), va = vc - dv;
      const a = 1 / (2 / r0 - va * va / mu), e = r0 / a - 1, p = a * (1 - e * e), rp = a * (1 - e);
      const ok = e > 0 && rp < rEI;
      const nu = ok ? Math.acos(Math.max(-1, Math.min(1, (p / rEI - 1) / e))) : NaN;     // 0..180°, on the way down
      const E = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(nu / 2)), M = E - e * Math.sin(E), n = Math.sqrt(mu / (a * a * a));
      const vEI = Math.sqrt(mu * (2 / rEI - 1 / a)), gam = -Math.acos(Math.min(1, Math.sqrt(mu * p) / (rEI * vEI)));
      return { r0, vc, va, a, e, p, rp, hp: rp - RE, ok, nuDeg: nu * DEG, EDeg: E * DEG, MDeg: M * DEG, angDeg: 180 - nu * DEG, t: (Math.PI - M) / n, vEI, gammaDeg: gam * DEG, P: 2 * Math.PI / n };
    }
    // lead angle: how far ahead of the spacecraft the landing site must be when the burn starts
    function lead(g, atmDeg, atmT) {
      const total = g.angDeg + atmDeg, time = g.t + atmT, rot = wE * time * DEG;
      return { total, time, rot, lead: total - rot };
    }
    const lateKmPerS = (h0) => (Math.sqrt(mu / Math.pow(RE + h0, 3)) - wE) * RE / 1000;   // ground km per second of late burn
    return { speedForGamma, dvForGamma, deorbit, lead, lateKmPerS, T_CHUTE, wE, RE, rEI, DEG };
  })();
  /*PURE-END*/

  // Command Module flown from the entry interface: angle (deg) and time (s) down to the drogues, plus a parachute estimate
  function flyCM(g) {
    const s = Phys.simulateEntry({ v0: g.vEI, gamma0: g.gammaDeg, bank: 45, ld: 0.3 });
    return { s, atmDeg: s.range / ER.RE * ER.DEG, atmT: s.t + ER.T_CHUTE };
  }
  // a whole descent from the deorbit burn to splashdown: samples { t (s), ang (deg flown from the burn), alt (m) }
  function flight(h0, dv) {
    const g = ER.deorbit(h0, dv);
    if (!g.ok) return { g, ok: false, outcome: 'noentry' };
    const cm = flyCM(g), nuEI = g.nuDeg / ER.DEG, n = 2 * Math.PI / g.P, samples = [];
    for (let i = 0; i <= 60; i++) {
      const nu = Math.PI - (Math.PI - nuEI) * i / 60, E = 2 * Math.atan(Math.sqrt((1 - g.e) / (1 + g.e)) * Math.tan(nu / 2)), M = E - g.e * Math.sin(E);
      samples.push({ t: i ? (Math.PI - M) / n : 0, ang: 180 - nu * ER.DEG, alt: g.p / (1 + g.e * Math.cos(nu)) - ER.RE });
    }
    for (const q of cm.s.trace) samples.push({ t: g.t + q.t, ang: g.angDeg + q.s / ER.RE * ER.DEG, alt: q.h });
    const landed = cm.s.outcome === 'landed', last = samples[samples.length - 1];
    if (landed) samples.push({ t: last.t + ER.T_CHUTE, ang: last.ang, alt: 0 });
    return { g, cm, ok: true, landed, outcome: landed ? 'landed' : cm.s.outcome, samples, total: g.angDeg + cm.atmDeg, time: g.t + cm.atmT, maxG: cm.s.maxG };
  }
  // how far beyond the ship the capsule comes down (km along the equator; negative = short), for a burn made when the ship is leadDeg ahead
  const missKm = (fl, leadDeg) => (fl.total - leadDeg - ER.wE * fl.time * ER.DEG) / ER.DEG * ER.RE / 1000;
  const AIM = { tol: 50, gMin: -2.5, gMax: -1.5, scen: { low: { h: 250e3, label: N`From a 250 km orbit` }, mid: { h: 300e3, label: N`From a 300 km orbit` }, station: { h: 400e3, label: N`From a 400 km orbit (space station)` } } };

  function workedExample() {
    const h0 = 200e3, dv = 120, g = ER.deorbit(h0, dv), cm = flyCM(g), L = ER.lead(g, cm.atmDeg, cm.atmT);
    const lo = ER.deorbit(h0, dv - 1), hi = ER.deorbit(h0, dv + 1), cl = flyCM(lo), ch = flyCM(hi), Ll = ER.lead(lo, cl.atmDeg, cl.atmT), Lh = ER.lead(hi, ch.atmDeg, ch.atmT);
    const km = (deg) => deg / ER.DEG * ER.RE / 1000;
    const sens = { hpPerMs: (hi.hp - lo.hp) / 2, gPerMs: (hi.gammaDeg - lo.gammaDeg) / 2, vacKm: km((hi.angDeg - lo.angDeg) / 2), atmKm: km((ch.atmDeg - cl.atmDeg) / 2), totKm: km((Lh.lead - Ll.lead) / 2),
      atmPerDeg: (ch.atmDeg - cl.atmDeg) / (hi.gammaDeg - lo.gammaDeg) };
    return { h0, dv, g, s: cm.s, atmDeg: cm.atmDeg, atmT: cm.atmT, L, late: ER.lateKmPerS(h0), sens };
  }

  Practice.register('entry', N`Re-entry`, [
    { title: N`Angle from the deorbit burn to the entry interface`, make() {
      let h, dv, g;
      do { h = [185, 200, 250, 300, 400][rndI(0, 4)]; dv = rndI(80, 150, 5); g = ER.deorbit(h * 1e3, dv); } while (!g.ok);
      return { q: T`A capsule circles the Earth at <b>${h} km</b> altitude. A retrograde deorbit burn of <b>${dv} m/s</b> is made. In vacuum, through what angle around the Earth does it travel from the burn to the entry interface at 122 km? (μ = 3.986 × 10¹⁴ m³/s², R⊕ = 6 378 km)`, answer: g.angDeg, unit: '°', tol: 0.02,
        hint: T`Vis-viva for the new ellipse (the burn point is its apogee), then the orbit equation for ν at r_EI. The angle flown is 180° − ν, not ν.`,
        sol: R`\[ r_0 = ${fm(g.r0 / 1e3, 0)}\ \mathrm{km},\quad v_a = \sqrt{\mu/r_0} - \Delta v = ${fm(g.va, 1)}\ \mathrm{m/s} \]
          \[ a = \left(\frac{2}{r_0}-\frac{v_a^2}{\mu}\right)^{-1} = ${fm(g.a / 1e3, 1)}\ \mathrm{km},\quad e = \frac{r_0}{a}-1 = ${fm(g.e, 4)},\quad p = a(1-e^2) = ${fm(g.p / 1e3, 1)}\ \mathrm{km} \]
          \[ \cos\nu_{EI} = \frac{1}{e}\left(\frac{p}{r_{EI}}-1\right),\ r_{EI} = ${fm(ER.rEI / 1e3, 0)}\ \mathrm{km}\ \Rightarrow\ \nu_{EI} = ${fm(g.nuDeg, 2)}^\circ \]
          \[ \theta_{vac} = 180^\circ - \nu_{EI} = ${fm(g.angDeg, 2)}^\circ \]` };
    } },
    { title: N`Lead angle and late-burn shift`, make() {
      if (Math.random() < 0.5) {
        const h = [185, 200, 250, 300, 400][rndI(0, 4)], dt = rndI(3, 25), r0 = (C.RE + h * 1e3) / 1e3;
        const n = Math.sqrt(C.muE / Math.pow(r0 * 1e3, 3)), k = ER.lateKmPerS(h * 1e3);
        return { q: T`A capsule in a circular equatorial orbit at <b>${h} km</b> altitude makes its deorbit burn <b>${dt} s late</b>. By how many kilometres along the equator does splashdown move, relative to the landing site? (The Earth turns at 7.292 × 10⁻⁵ rad/s. R⊕ = 6 378 km, μ = 3.986 × 10¹⁴ m³/s².)`, answer: k * dt, unit: 'km', tol: 0.02,
          hint: T`A late burn shifts the whole path along the orbit at the orbital angular rate n. The site moves too, at the Earth's rate.`,
          sol: R`\[ n = \sqrt{\mu/r_0^3} = ${fm(n * 1e3, 4)}\times10^{-3}\ \mathrm{rad/s},\qquad (n - \omega_\oplus)R_\oplus = ${fm(k, 2)}\ \mathrm{km/s} \]
            \[ \Delta s = ${fm(k, 2)}\times${dt} = ${fm(k * dt, 1)}\ \mathrm{km} \]` };
      }
      const th = rndI(480, 600) / 10, tv = rndI(110, 140) / 10, ta = rndI(250, 350) / 10, tt = rndI(140, 180) / 10, wdeg = ER.wE * ER.DEG * 3600;
      const lead = th + ta - wdeg * (tv + tt) / 60;
      return { q: T`A deorbit burn gives a vacuum arc of <b>${dec(th)}°</b> to the entry interface in <b>${dec(tv)} min</b>. The calibrated atmospheric range of the capsule is <b>${dec(ta)}°</b>, and it takes <b>${dec(tt)} min</b> from the interface to splashdown (parachutes included). The Earth turns 15.04° per hour. At the burn, how many degrees ahead of the capsule must the landing site be?`, answer: lead, unit: '°', tol: 0.01,
        hint: T`Add the two arcs, then subtract the rotation of the Earth during the whole flight.`,
        sol: R`\[ \theta_{vac}+\theta_{atm} = ${dec(th)}+${dec(ta)} = ${fm(th + ta, 1)}^\circ \]
          \[ \omega_\oplus t = 15.04^\circ/\mathrm{h}\times\frac{${dec(tv)}+${dec(tt)}}{60}\ \mathrm{h} = ${fm(wdeg * (tv + tt) / 60, 2)}^\circ \]
          \[ \theta_{lead} = ${fm(th + ta, 1)}^\circ - ${fm(wdeg * (tv + tt) / 60, 2)}^\circ = ${fm(lead, 2)}^\circ \]` };
    } },
  ]);

  const fm = UI.fmt, dec = UI.dec, R = String.raw;
  const rndI = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;

  /* ---------- figures 18.1 to 18.3 (static SVG, tools/FIGURES.md) ---------- */
  const fx = (n) => n.toFixed(1), pct = (x, w) => (100 * x / w).toFixed(2) + '%', D2 = Math.PI / 180;
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1]], vadd = (a, b) => [a[0] + b[0], a[1] + b[1]], vmul = (a, k) => [a[0] * k, a[1] * k];
  const vunit = (a) => vmul(a, 1 / Math.hypot(...a));
  function frame(W, H, ox, oy) {
    const S = (q) => [ox + q[0], oy - q[1]];
    const path = (list) => list.map((q, k) => `${k ? 'L' : 'M'}${fx(S(q)[0])},${fx(S(q)[1])}`).join('');
    const head = (q, dir, cls) => { const a = S(q), t = vunit([dir[0], -dir[1]]), n = [-t[1], t[0]];
      return `<path class="${cls}" d="M${fx(a[0] + 9 * t[0])},${fx(a[1] + 9 * t[1])}L${fx(a[0] + 4.5 * n[0])},${fx(a[1] + 4.5 * n[1])}L${fx(a[0] - 4.5 * n[0])},${fx(a[1] - 4.5 * n[1])}Z"/>`; };
    const arrow = (a, b, cls, fill) => { const c = vsub(b, vmul(vunit(vsub(b, a)), 9)); return `<path class="${cls}" d="${path([a, c])}"/>${head(c, vsub(b, a), fill)}`; };
    const arc = (c, r, a0, a1, cls, n = 30) => `<path class="${cls}" d="${path([...Array(n + 1).keys()].map((k) => vadd(c, [r * Math.cos(a0 + (a1 - a0) * k / n), r * Math.sin(a0 + (a1 - a0) * k / n)])))}"/>`;
    const lbs = (list) => list.map(([q, t, c]) => { const [x, y] = S(q); return `<span class="lb ${c || ''}" style="left:${pct(x, W)};top:${pct(y, H)}">${t}</span>`; }).join('');
    const dot = (q, cls, r = 3) => `<circle class="${cls}" cx="${fx(S(q)[0])}" cy="${fx(S(q)[1])}" r="${r}"/>`;
    return { S, path, head, arrow, arc, lbs, dot, W, H };
  }
  App.css('entry-fig', `
    .f-cap { fill: var(--panel); stroke: var(--ink); stroke-width: 1.4; stroke-linejoin: round; } .f-shield { fill: none; stroke: var(--accent); stroke-width: 3; stroke-linecap: round; }
    .fig .lb.vert { transform: translate(-50%, -50%) rotate(-90deg); } .f-tr-thin { fill: none; stroke: var(--trace); stroke-width: 1; }
    .f-hot { fill: var(--accent); opacity: .22; } .f-axis { fill: none; stroke: var(--muted); stroke-width: 1; } .f-grid { fill: none; stroke: var(--line); stroke-width: 1; }
    .er-lab .stage { min-height: 400px; } .er-lab .lab-head .badge { font: 600 .74rem/1 var(--f-mono); letter-spacing: .06em; text-transform: uppercase; padding: .45rem .6rem; border-radius: 4px; background: var(--panel); border: 1px solid var(--line); } .er-nudge { display: flex; gap: .2rem; margin-top: .25rem; } .er-nudge .btn { flex: 1; min-width: 0; padding: .2rem 0; font: .68rem/1 var(--f-mono); }
    .er-rep:empty { display: none; } .er-rep { padding: .5rem .7rem; border: 1px solid var(--line); border-radius: 6px; font-size: .85rem; } .er-rep ul { margin: .3rem 0 0; padding: 0; list-style: none; } .er-rep li { margin: .15rem 0; }
    .er-rep.flash { animation: er-flash .8s ease-out; } @keyframes er-flash { from { background: color-mix(in srgb, var(--accent) 22%, transparent); } }
    .en-eq3 { display: grid; gap: 1.6rem; margin: 1rem 0; } .en-eq3 > div > h4 { margin: 0 0 .3rem; font: 600 .74rem/1.2 var(--f-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--accent); }`);
  const figure = (F, aria, svg, labels, caption) => `<figure class="fig" role="img" aria-label="${aria}"><div class="fig-box"><svg viewBox="0 0 ${F.W} ${F.H}" aria-hidden="true">${svg}</svg>${F.lbs(labels)}</div><figcaption>${caption}</figcaption></figure>`;

  // the descending path of 18.1, drawn much steeper than a real entry: direction of flight T_, "up" across the path N_
  const GAM = -24 * D2, T_ = [Math.cos(GAM), Math.sin(GAM)], N_ = [-Math.sin(GAM), Math.cos(GAM)];
  // capsule at c, heat shield first: body coordinates (x along the flight direction)
  function capsule(F, c, k = 1) {
    const B = (x, y) => vadd(c, vadd(vmul(T_, x * k), vmul(N_, y * k)));
    return `<path class="f-cap" d="${F.path([B(9, -15), B(12, -8), B(13, 0), B(12, 8), B(9, 15), B(-18, 5), B(-18, -5)])}Z"/><path class="f-shield" d="${F.path([B(9, -15), B(12, -8), B(13, 0), B(12, 8), B(9, 15)])}"/>`;
  }
  const scene = (F, a = -150, b = 150) => `<path class="f-mu-thin f-dash" d="${F.path([[-150, 0], [170, 0]])}"/><path class="f-tr-thin" d="${F.path([vmul(T_, a), vmul(T_, b)])}"/>${F.arc([0, 0], 62, 0, GAM, 'f-mu-thin')}`;

  // 18.1, first equation: what changes the speed
  function figSpeed() {
    const F = frame(460, 172, 200, 78), gs = 70 * Math.sin(-GAM);
    return figure(F, T`A capsule descending along a path tilted below the horizontal by the flight-path angle γ. Drag points backwards along the path. Gravity points straight down; its part along the path points forwards.`,
      `${scene(F)}
       ${F.arrow(vmul(T_, 44), vmul(T_, 140), 'f-tr', 'f-tr-fill')}
       ${F.arrow(vmul(T_, -20), vmul(T_, -112), 'f-ac-ln', 'f-ac-fill')}
       ${F.arrow([0, 0], [0, -70], 'f-mu', 'f-mu-fill')}<path class="f-mu-thin f-dash" d="${F.path([[0, -70], vmul(T_, gs)])}"/>
       ${F.arrow([0, 0], vmul(T_, gs + 9), 'f-mu', 'f-mu-fill')}
       ${capsule(F, [0, 0])}`,
      [[vadd(vmul(T_, 140), [6, 12]), '<i>v</i>', 'tr l'], [vadd(vmul(T_, -112), [-4, 14]), T`drag`, 'acc r'], [[-8, -66], '<i>g</i>', 'm r'],
        [[26, 10], '<i>g</i> sin <i>γ</i>', 'm l'], [[72, -13], '<i>γ</i>', 'm'], [[172, 10], T`horizontal`, 'm r']],
      T`Drag slows the capsule. The part of gravity along the path, g sin γ, speeds it up. Not to scale: a real entry is much shallower (about 6°) and drag is far larger than gravity.`);
  }
  // 18.1, second equation: what bends the path
  function figBend() {
    const F = frame(520, 196, 170, 112), s45 = 45 * D2, I = [228, 4], L = 62;
    return figure(F, T`The same capsule with the forces across its path. Lift pushes it up, away from the Earth. Gravity pulls it down. A third arrow, v²/r, points up: the ground curving away under a fast capsule. An inset seen from behind shows the lift tilted sideways by the bank angle σ; only its upward part, L cos σ, bends the path.`,
      `${scene(F, -130, 120)}
       ${F.arrow(vmul(T_, 40), vmul(T_, 110), 'f-tr', 'f-tr-fill')}
       ${F.arrow([0, 0], vmul(N_, 78), 'f-ac-ln', 'f-ac-fill')}
       ${F.arrow([0, 0], [0, -60], 'f-mu', 'f-mu-fill')}
       ${F.arrow([-34, 8], [-34, 70], 'f-mu', 'f-mu-fill')}
       ${capsule(F, [0, 0])}
       <circle class="f-cap" cx="${fx(F.S(I)[0])}" cy="${fx(F.S(I)[1])}" r="26"/>
       <path class="f-mu-thin f-dash" d="${F.path([vadd(I, [0, -34]), vadd(I, [0, 84])])}"/>
       ${F.arrow(I, vadd(I, [L * Math.sin(s45), L * Math.cos(s45)]), 'f-ac-ln', 'f-ac-fill')}
       <path class="f-mu-thin f-dash" d="${F.path([vadd(I, [L * Math.sin(s45), L * Math.cos(s45)]), vadd(I, [0, L * Math.cos(s45)])])}"/>
       ${F.arrow(vadd(I, [-7, 0]), vadd(I, [-7, L * Math.cos(s45)]), 'f-ac-ln', 'f-ac-fill')}
       ${F.arc(I, 40, Math.PI / 2, Math.PI / 2 - s45, 'f-mu-thin')}`,
      [[vadd(vmul(T_, 110), [6, 12]), '<i>v</i>', 'tr l'], [vadd(vmul(N_, 78), [8, 6]), T`lift`, 'acc l'], [[8, -58], '<i>g</i>', 'm l'], [[-40, 62], '<i>v</i>²/<i>r</i>', 'm r'],
        [[72, -13], '<i>γ</i>', 'm'], [vadd(I, [0, -48]), T`seen from behind`, 'm'], [vadd(I, [L * Math.sin(s45) + 6, L * Math.cos(s45) + 2]), T`lift`, 'acc l'],
        [vadd(I, [-14, L * Math.cos(s45) - 4]), '<i>L</i> cos <i>σ</i>', 'acc r'], [vadd(I, [14, 50]), '<i>σ</i>', 'm']],
      T`Across the path, lift pushes up and gravity pulls down. The term v²/r acts like a push upwards: the faster the capsule, the more the round Earth curves away beneath it. Rolling the capsule by the bank angle σ tilts the lift sideways; only L cos σ is left to bend the path up or down.`);
  }
  // 18.1, third equation: the descent rate
  function figSink() {
    const F = frame(460, 140, 96, 34), L = 230, tip = vmul(T_, L);
    return figure(F, T`The velocity drawn as the long side of a right triangle. Its horizontal side is the speed along the ground, v cos γ. Its vertical side is the descent rate, v sin γ.`,
      `<path class="f-mu-thin f-dash" d="${F.path([[0, 0], [tip[0], 0]])}"/>${F.arc([0, 0], 62, 0, GAM, 'f-mu-thin')}
       ${F.arrow([0, 0], tip, 'f-tr', 'f-tr-fill')}
       ${F.arrow([tip[0], 0], tip, 'f-ac-ln', 'f-ac-fill')}
       ${capsule(F, [0, 0], 0.8)}`,
      [[vadd(vmul(T_, L * 0.55), [-10, -16]), '<i>v</i>', 'tr r'], [[tip[0] * 0.6, 12], T`along the ground: <i>v</i> cos <i>γ</i>`, 'm'], [[tip[0] + 8, tip[1] / 2], T`descent rate: <i>v</i> sin <i>γ</i>`, 'acc l wrap'], [[76, -14], '<i>γ</i>', 'm']],
      T`The steeper the path, the larger the share of the speed that goes into losing altitude. Apollo, at 11 km/s and −6.5°, came down at ${fm(11 * Math.sin(6.5 * D2), 1)} km/s.`);
  }

  // Allen–Eggers ballistic entry (straight path, no gravity, no lift): speed and deceleration at altitude h
  const AE = {
    vE: 11000, gammaDeg: -6.5, capsule: 350, slim: 5000,                 // kg/m²: the lab's Command Module is 5 500 / (1.3 × 12) = 353
    at(beta, h, vE = AE.vE, gammaDeg = AE.gammaDeg) {
      const sg = Math.sin(Math.abs(gammaDeg) * D2), rho = C.rho0 * Math.exp(-h / C.H), v = vE * Math.exp(-rho * C.H / (2 * beta * sg));
      return { v, a: rho * v * v / (2 * beta) };
    },
    peak(beta, vE = AE.vE, gammaDeg = AE.gammaDeg) {
      const sg = Math.sin(Math.abs(gammaDeg) * D2), rho = beta * sg / C.H;
      return { h: C.H * Math.log(C.rho0 / rho), a: vE * vE * sg / (2 * Math.E * C.H), v: vE / Math.sqrt(Math.E), rho };
    },
  };
  // 18.2: same peak deceleration, at a different altitude
  function figPeak() {
    const W = 560, H = 270, x0 = 54, x1 = 270, x2 = 322, x3 = 538, yT = 30, yB = 226, hMax = 80e3, gMax = 40, vMax = 11;
    const Y = (h) => yB - (yB - yT) * h / hMax, XA = (g) => x0 + (x1 - x0) * g / gMax, XV = (v) => x3 - (x3 - x2) * v / vMax;   // speed axis runs from fast (left) to slow (right): the capsule moves along it in time
    const hs = [...Array(161).keys()].map((k) => hMax * (1 - k / 160));
    const curve = (beta, X, key, k) => hs.map((h, i) => `${i ? 'L' : 'M'}${fx(X(AE.at(beta, h)[key] * k))},${fx(Y(h))}`).join('');
    const pc = AE.peak(AE.capsule), ps = AE.peak(AE.slim), g0 = C.g0, lb = (x, y, t, c) => [[x, y], t, c];
    const ticks = (X, vals) => vals.map((v) => `<path class="f-axis" d="M${fx(X(v))},${yB}v4"/>`).join('');
    const svg = `${[0, 20, 40, 60, 80].map((k) => `<path class="f-grid" d="M${x0},${fx(Y(k * 1e3))}H${x1}M${x2},${fx(Y(k * 1e3))}H${x3}"/>`).join('')}
      <path class="f-axis" d="M${x0},${yT}V${yB}H${x1}M${x2},${yT}V${yB}H${x3}"/>${ticks(XA, [0, 10, 20, 30, 40])}${ticks(XV, [0, 5, 10])}
      <path class="f-mu-thin f-dash" d="M${fx(XA(pc.a / g0))},${yT}V${yB}"/>
      <path class="f-ac-ln" d="${curve(AE.capsule, XA, 'a', 1 / g0)}"/><path class="f-tr" d="${curve(AE.slim, XA, 'a', 1 / g0)}"/>
      <path class="f-ac-ln" d="${curve(AE.capsule, XV, 'v', 1e-3)}"/><path class="f-tr" d="${curve(AE.slim, XV, 'v', 1e-3)}"/>
      <circle class="f-ac-fill" cx="${fx(XA(pc.a / g0))}" cy="${fx(Y(pc.h))}" r="4"/><circle class="f-tr-fill" cx="${fx(XA(ps.a / g0))}" cy="${fx(Y(ps.h))}" r="4"/>
      <circle class="f-ac-fill" cx="${fx(XV(pc.v / 1e3))}" cy="${fx(Y(pc.h))}" r="4"/><circle class="f-tr-fill" cx="${fx(XV(ps.v / 1e3))}" cy="${fx(Y(ps.h))}" r="4"/>`;
    const F = { W, H, lbs: (list) => list.map(([[x, y], t, c]) => `<span class="lb ${c || ''}" style="left:${pct(x, W)};top:${pct(y, H)}">${t}</span>`).join('') };
    return figure(F, T`Two plots against altitude, for a blunt capsule and a slim, heavy body entering at the same speed and angle. Left: the deceleration. Both curves reach the same peak, 36 g, the capsule at 39 km and the slim body at 20 km. Right: the speed. The capsule has lost most of its speed by 30 km, while the slim body is still close to its entry speed there.`, svg,
      [lb((x0 + x1) / 2, 12, T`deceleration (g)`, 'm'), lb((x2 + x3) / 2, 12, T`speed (km/s)`, 'm'), lb(14, (yT + yB) / 2, T`altitude (km)`, 'm vert'),
        ...[0, 20, 40, 60, 80].map((k) => lb(x0 - 6, Y(k * 1e3), String(k), 'm r')), ...[0, 10, 20, 30, 40].map((v) => lb(XA(v), yB + 14, String(v), 'm')), ...[0, 5, 10].map((v) => lb(XV(v), yB + 14, String(v), 'm')),
        lb(XA(pc.a / g0) + 8, Y(pc.h), `${fm(pc.h / 1e3, 0)} km`, 'acc l'), lb(XA(ps.a / g0) + 8, Y(ps.h), `${fm(ps.h / 1e3, 0)} km`, 'tr l'),
        lb(XA(pc.a / g0) - 6, Y(72e3), T`same peak: ${fm(pc.a / g0, 0)} g`, 'm r wrap narrow'),
        lb(XV(3.6), Y(52e3), T`blunt capsule`, 'acc'), lb(XV(8), Y(9e3), T`slim, heavy body`, 'tr wrap narrow')],
      T`Allen and Eggers’ solution for an entry at 11 km/s and −6.5°: a blunt capsule (β = ${fm(AE.capsule, 0)} kg/m², orange) and a slim, heavy body (β = ${fm(AE.slim, 0)} kg/m², blue). The dots mark the peak deceleration. It has the same size for both, but the slim body reaches it ${fm((pc.h - ps.h) / 1e3, 0)} km lower, in air ${fm(ps.rho / pc.rho, 0)} times denser.`);
  }

  // 18.3: slender nose (attached shock, hot air on the skin) against blunt body (detached shock, heat carried away)
  function figShock() {
    const F = frame(560, 230, 0, 115), tipS = [62, 0], xs = 372;
    const cone = [tipS, [192, 24], [192, -24]], sh = (k) => [[214, 46 * k], tipS], hotS = (k) => [tipS, [192, 24 * k], [192, 33 * k]];
    const ys = [...Array(31).keys()].map((k) => (k / 15 - 1) * 45);
    const shield = ys.map((y) => [xs + 60 - Math.sqrt(3600 - y * y), y]);                        // heat shield, facing the flow
    const bowAt = (y) => [xs - 22 + y * y / 90, y], bow = [...Array(41).keys()].map((k) => bowAt((k / 20 - 1) * 96));
    const hotB = [...ys.map(bowAt), ...shield.slice().reverse()];
    const flow = (y, a, b) => F.arrow([a, y], [b, y], 'f-mu-thin', 'f-mu-fill');
    const around = (k) => `<path class="f-ac-ln" d="${F.path([[xs - 8, 52 * k], [xs + 14, 68 * k], [xs + 46, 78 * k]])}"/>${F.head([xs + 46, 78 * k], [40, 9 * k], 'f-ac-fill')}`;
    return figure(F, T`Two bodies in a fast airflow coming from the left. Left: a slender, pointed nose. Its shock wave is attached to the tip and lies close to the surface, so the hot air touches the skin. Right: a blunt capsule. Its shock wave stands off ahead of the heat shield, and most of the hot air flows around the body and away.`,
      `${[-70, -35, 0, 35, 70].map((y) => flow(y, 8, 40)).join('')}${[-70, -35, 0, 35, 70].map((y) => flow(y, 268, 300)).join('')}
       <path class="f-hot" d="${F.path(hotS(1))}Z"/><path class="f-hot" d="${F.path(hotS(-1))}Z"/>
       <path class="f-ac-ln" d="${F.path(sh(1))}"/><path class="f-ac-ln" d="${F.path(sh(-1))}"/>
       <path class="f-cap" d="${F.path(cone)}Z"/>
       <path class="f-hot" d="${F.path(hotB)}Z"/>
       <path class="f-ac-ln" d="${F.path(bow)}"/>
       <path class="f-cap" d="${F.path([...shield, [xs + 78, 13], [xs + 78, -13]])}Z"/><path class="f-shield" d="${F.path(shield)}"/>
       ${around(1)}${around(-1)}`,
      [[[6, 98], T`airflow`, 'm l'], [[130, -100], T`slender nose`, 'm'], [[150, 72], T`shock on the surface`, 'acc wrap'], [[150, -64], T`the hot air touches the skin`, 'acc wrap'],
        [[xs + 40, -100], T`blunt body`, 'm'], [[xs - 6, 98], T`shock stands off`, 'acc r wrap narrow'], [[xs + 116, 52], T`most of the heat leaves with the air`, 'acc wrap narrow']],
      T`Not to scale. A pointed nose keeps its shock wave on the surface, and the air heated by the shock touches the skin. A blunt body pushes the shock ahead of it: the air is heated out in front, and most of that heat flows around the vehicle and away.`);
  }

  App.chapter({
    id: 'entry', phase: N`Entry`, title: N`Coming Home`, lab: N`Entry corridor`,
    blurb: N`Hit the atmosphere at 11 km/s inside a corridor 2° wide. Too shallow and you skip off, too steep and the g-load kills.`,
    render(page) {
      const f = fm;
      const W = workedExample();
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('entry')} · Entry & splashdown`,
          title: T`Coming Home`,
          lede: T`The Command Module arrived at 11 km/s carrying 60 megajoules per kilogram, fourteen times the energy of the same mass of TNT. The atmosphere had to absorb all of it in about ten minutes.`,
          refs: [T`Sellers · Returning from Space: Re-entry`, T`Allen & Eggers, NACA Report 1381 (1958)`],
        })}
        ${Progress.briefing('entry', { theory: 'theory', lab: 'en', math: 'refresher', mathLabel: N`Derivatives and exponentials.` })}

        <section class="section" id="theory">
          <h2><span class="idx">10.1</span>${T`Equations of entry`}</h2>
          <div class="prose">
            <p>${T`Three equations describe a capsule flying through the atmosphere, over a spherical, non-rotating Earth. Each answers one question: how fast the speed changes, how fast the path bends, and how fast the altitude drops. The air thins out with altitude as \\(\\rho(h) = \\rho_0 e^{-h/H}\\). The capsule has a mass \\(m\\), a drag coefficient \\(C_D\\), a reference area \\(A\\) and a lift-to-drag ratio \\(L/D\\).`}</p>
            <div class="en-eq3">
              <div><h4>${T`1 · Speed`}</h4>
                <div class="eq">\\[ \\dot v = -\\frac{\\rho v^2}{2\\beta} - g\\sin\\gamma \\]</div>
                ${Sym.where(['vdot', 'rho', 'v', 'beta', 'g', 'gammaE'], N`Drag, the first term, always slows the capsule. Gravity speeds it up on the way down: γ is negative there, so −g sin γ is positive.`)}
                <p>${T`Here \\(\\beta = m/(C_D A)\\) is the <b>ballistic coefficient</b>: mass per unit of area that catches the air. A heavy, slim body has a high β and is hard to slow down. A light, blunt one has a low β.`}</p>
                ${figSpeed()}</div>
              <div><h4>${T`2 · Direction`}</h4>
                <div class="eq">\\[ v\\dot\\gamma = \\frac{\\rho v^2}{2\\beta}\\frac{L}{D}\\cos\\sigma - \\left(g - \\frac{v^2}{r}\\right)\\cos\\gamma \\]</div>
                ${Sym.where(['gammadot', 'LD', 'sigma', 'r'], N`The first term is lift: drag times L/D, and only its upward part, cos σ. The second is gravity across the path, reduced by v²/r.`)}
                <p>${T`The bank angle \\(\\sigma\\) is the only control Apollo had: it rolled the lift vector up, down or sideways.`}</p>
                ${figBend()}</div>
              <div><h4>${T`3 · Altitude`}</h4>
                <div class="eq">\\[ \\dot h = v\\sin\\gamma \\]</div>
                ${Sym.where(['hdot'], N`The vertical part of the velocity.`)}
                ${figSink()}</div>
            </div>
            ${Primer.box('derivative', false, 'refresher')}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">10.2</span>${T`The ballistic case: Allen and Eggers`}</h2>
          <div class="prose">
            <p>${T`Drop lift and gravity (drag dominates) and the equations integrate in closed form (Allen & Eggers: studied in 1953, published by NACA in 1958). The result is surprising. The peak deceleration depends only on the entry speed and angle. The ballistic coefficient β, which describes the vehicle, is not in it:`}</p>
            <div class="eq">\\[ a_{max} = \\frac{v_E^2\\,\\sin|\\gamma_E|}{2\\,e\\,H}, \\qquad \\rho^* = \\frac{\\beta\\,\\sin|\\gamma_E|}{H} \\]</div>
            ${Sym.where(['amax', 'vE', 'gE', 'euler', 'H', 'rhostar', 'beta'])}
            ${Primer.box('log')}
            <p>${T`A blunt capsule does brake sooner than a slim body, but not harder. What β changes is <b>where</b> the braking happens, and the second formula says so: the air density at the peak, \\(\\rho^*\\), is proportional to β. A blunt, light capsule (low β) is stopped by thin air, high up. A slim, heavy body (high β) cuts through that thin air almost without slowing and loses its speed lower down, in air that is denser by the same factor as its β is larger. The two effects cancel, and the peak is the same.`}</p>
            ${figPeak()}
            <p>${T`The difference is in the speed the body still has when it reaches the dense air. At 30 km the capsule of the figure is down to ${fm(AE.at(AE.capsule, 30e3).v / 1e3, 0)} km/s, while the slim body still flies at almost ${fm(AE.at(AE.slim, 30e3).v / 1e3, 0)} km/s. Heating grows with the cube of the speed and with the density (section ${App.sec('entry', 3)}), so the slim body gets far hotter, and it is still fast near the ground. A warhead is built for exactly that: to arrive fast. A capsule needs the opposite: to lose its speed high up, in thin air. This is why warheads are slim and capsules are blunt.`}</p>
            <p>${T`The formula assumes a straight path. At lunar-return speed the real path curves away from the Earth (\\(v^2/r > g\\)), so at shallow angles it overestimates. For 11 km/s at −6.5° it predicts 36 g, while the lab’s full simulation of a ballistic capsule gives about 16 g. That is still lethal, which is why Apollo needed lift.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">10.3</span>${T`Heating and the blunt body`}</h2>
          <div class="prose">
            <p>${T`Convective heating at the stagnation point follows the Sutton–Graves relation:`}</p>
            <div class="eq">${T`\\[ \\dot q = k\\sqrt{\\frac{\\rho}{r_n}}\\;v^3, \\qquad k = 1.74\\times10^{-4}\\ \\text{(SI, Earth air)} \\]`}</div>
            ${Sym.where(['qdot', 'k', 'rho', 'rn', 'v'], N`v³: twice as fast means eight times the heating.`)}
            <p>${T`The large nose radius \\(r_n\\) of a blunt body reduces it. More important, as H. Julian Allen realised in 1951, a blunt shape pushes a strong, detached shock wave ahead of it. Most of the energy then heats the air, which carries it away, instead of the vehicle. Apollo's heat shield was AVCOAT, a phenolic-epoxy resin in a fibreglass honeycomb. It <b>ablated</b>: charring and eroding, it carried heat away as it went, with up to 2 700 °C on its face. At lunar return speeds radiative heating from the hot shock layer adds about another third.`}</p>
            ${figShock()}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">10.4</span>${T`Lift and the entry corridor`}</h2>
          <div class="prose">
            <p>${T`The CM's centre of mass was offset from its axis, so it flew tilted at an angle of attack of about 20°, which gave \\(L/D \\approx 0.3\\). With lift up, the capsule pulls out higher and decelerates gently. With lift down, it digs in. There are two boundaries:`}</p>
            <ul>
              <li>${T`<b>Overshoot</b>: too shallow. Even with full lift down the capsule cannot shed enough speed and climbs back out (“skips”) on a long uncontrolled arc.`}</li>
              <li>${T`<b>Undershoot</b>: too steep. Even with full lift up, deceleration exceeds the limit (Apollo design: 10 g) and heating becomes extreme.`}</li>
            </ul>
            <p>${T`For Apollo, the corridor was about −5.3° to −7.4° at entry interface (122 km). Midcourse corrections on the way home aimed for the middle; Apollo 11 entered at −6.48° and landed 24 km from USS <i>Hornet</i>.`}</p>
          </div>
          <div class="prose">
            <p>${T`The buttons at the top of the lab load five entries to compare:`}</p>
            <ul>
              <li>${T`<b>Apollo 11</b>: 11.03 km/s at −6.5°, with the capsule’s lift (L/D 0.3) banked 45°, so partly up. About 8 g.`}</li>
              <li>${T`<b>Too shallow</b>: −5.0°, with the lift rolled sideways. The capsule skips back out.`}</li>
              <li>${T`<b>Too steep</b>: −8.5°. Even with all the lift up, about 19 g.`}</li>
              <li>${T`<b>Ballistic</b>: the Apollo 11 entry with the lift removed (L/D = 0). A <b>ballistic entry</b> is one without lift: only drag and gravity act, as on a cannonball, and nothing holds the capsule up or steers it. It dives into dense air sooner and brakes about twice as hard, about 16 g. Compare it with Apollo 11 to see what lift buys.`}</li>
              <li>${T`<b>From LEO (Gemini)</b>: a return from low Earth orbit, slower (7.8 km/s) and much shallower (−1.5°). About 3 g.`}</li>
            </ul>
          </div>
          <div class="lab" id="en">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Entry corridor`}</h3><span class="spacer"></span>
              <div class="btn-row"><button class="btn" data-p="apollo">Apollo 11</button><button class="btn" data-p="shallow">${T`Too shallow`}</button><button class="btn" data-p="steep">${T`Too steep`}</button><button class="btn" data-p="ballistic">${T`Ballistic`}</button><button class="btn" data-p="leo">${T`From LEO (Gemini)`}</button></div></div>
            <div class="stage" style="min-height:360px;background:var(--panel)"><canvas id="en-cv" aria-label="${T`Altitude versus downrange distance during entry`}"></canvas><div class="badge" id="en-badge"></div></div>
            <div class="controls">
              ${UI.slider({ id: 'en-v', label: T`Entry speed at 122 km`, min: 7.0, max: 12.0, step: 0.01, value: 11.03, unit: 'km/s' })}
              ${UI.slider({ id: 'en-g', label: T`Flight-path angle γ`, min: -10, max: -3, step: 0.05, value: -6.5, unit: '°' })}
              ${UI.slider({ id: 'en-b', label: T`Bank angle σ (0 = lift up)`, min: 0, max: 180, step: 5, value: 45, unit: '°' })}
              ${UI.slider({ id: 'en-ld', label: T`Lift-to-drag ratio L/D`, min: 0, max: 0.5, step: 0.01, value: 0.3 })}
              <dl class="readout" id="en-ro"></dl>
            </div>
            <div class="lab-foot">
              <div class="mini"><h4>${T`Deceleration (g)`}</h4><canvas id="en-c1"></canvas></div>
              <div class="mini"><h4>${T`Speed (km/s)`}</h4><canvas id="en-c2"></canvas></div>
              <div class="mini"><h4>${T`Stagnation heat flux (MW/m²)`}</h4><canvas id="en-c3"></canvas></div>
              <div class="mini"><h4>${T`Corridor map: flight-path angle × bank`}</h4><canvas id="en-map" style="cursor:crosshair" aria-label="${T`Map of entry outcomes over flight-path angle and bank angle. Click to choose.`}"></canvas></div>
            </div>
          </div>
          <p class="note">${T`Corridor map: each cell is a full simulation at the current speed and L/D. <span style="color:var(--good)">■</span> safe (≤ 10 g, captured) · <span style="color:var(--trace)">■</span> skip-out · <span style="color:var(--bad)">■</span> over 10 g. Click the map to fly that case. Command Module: 5 500 kg, C<sub>D</sub> 1.3, 3.9 m diameter, so β ≈ 355 kg/m². Constant bank angle. The real Apollo guidance varied the bank to hold about 4–6.5 g and steer toward the recovery ship, so its peak was lower than this simple model gives.`}</p>
        </section>

        ${Archive.capsule('hornet')}

        <section class="section">
          <h2><span class="idx">10.5</span>${T`Landing near a chosen point`}</h2>
          <div class="prose">
            <p>${T`A capsule cannot steer onto a runway, but a crew and Mission Control can aim it at a patch of ocean some tens of kilometres across. Two things decide where it lands: when the deorbit burn starts and how big it is. This section turns both into a rule for a pocket calculator. The setting is the simplest one: a circular orbit over the equator, flown eastward, so everything happens in one plane and the landing site slides east under the capsule as the Earth turns. A site at another latitude, or an inclined orbit, adds a cross-range offset and a factor cos(latitude) on the Earth's motion. Those are left out here.`}</p>
            <h3>${T`1. The deorbit burn and the entry angle`}</h3>
            <p>${T`Fire retrograde in a circular orbit of radius \\(r_0\\). The burn point becomes the <b>apogee</b> of a new ellipse whose perigee lies deep inside the atmosphere. (In vacuum the perigee would even lie under the ground: the air stops the capsule long before.) What matters is the angle at which the new ellipse crosses the entry interface at 122 km. It sets the g-load and the heating, and it must be inside the corridor of section ${App.sec('entry', 4)}. Vis-viva gives the ellipse, then energy and angular momentum give the entry angle:`}</p>
            <div class="eq">\\[ v_a = \\sqrt{\\frac{\\mu}{r_0}} - \\Delta v, \\qquad a = \\left(\\frac{2}{r_0} - \\frac{v_a^2}{\\mu}\\right)^{-1}, \\qquad e = \\frac{r_0}{a} - 1, \\qquad r_p = 2a - r_0 \\]</div>
            ${Sym.where(['mu', ['r_0', N`radius of the circular orbit: Earth radius plus altitude`, 'm'], ['v_a', N`speed just after the burn: the speed at the apogee of the new ellipse`, 'm/s'], 'dv', 'a', 'e', 'rp'], N`The apogee radius is r₀, so r₀ = a(1 + e), which gives e. A negative perigee altitude is normal: the ellipse is only a way to reach the interface.`)}
            <div class="eq">\\[ v_{EI}^2 = v_a^2 + 2\\mu\\left(\\frac{1}{r_{EI}} - \\frac{1}{r_0}\\right), \\qquad \\cos\\gamma_{EI} = \\frac{r_0\\,v_a}{r_{EI}\\,v_{EI}} \\]</div>
            ${Sym.where([['r_{EI}', N`radius of the entry interface: Earth radius plus 122 km`, 'm'], ['v_{EI}', N`speed at the entry interface`, 'm/s'], ['\\gamma_{EI}', N`entry angle: how far below the local horizontal the path points`, N`°`], ['v_a,\\ r_0', N`speed after the burn and radius of the burn point, as above`, '']], N`First equation: energy is conserved. Second: angular momentum is conserved, r·v·cos γ has the same value at the burn (where the path is horizontal) and at the interface.`)}
            <p>${T`Example: a ${f(W.h0 / 1e3, 0)} km orbit has \\(v_c = ${f(W.g.vc, 1)}\\) m/s. A burn of ${f(W.dv, 0)} m/s leaves \\(v_a = ${f(W.g.va, 1)}\\) m/s, so \\(a = ${f(W.g.a / 1e3, 1)}\\) km, \\(e = ${f(W.g.e, 4)}\\), \\(r_p = ${f(W.g.rp / 1e3, 1)}\\) km (an altitude of ${f(W.g.hp / 1e3, 1)} km). At the interface \\(v_{EI} = ${f(W.g.vEI, 1)}\\) m/s and \\(\\gamma_{EI} = ${f(W.g.gammaDeg, 2)}^\\circ\\).`}</p>
            <h3>${T`2. The angle and the time to the interface, in vacuum`}</h3>
            <p>${T`Where is the interface on the ellipse? The orbit equation gives the true anomaly \\(\\nu_{EI}\\) there. A calculator returns it between 0° and 180°, measured from perigee. The capsule reaches the interface <i>before</i> the perigee, so the angle it flies from the burn (at 180°) is the difference, not \\(\\nu_{EI}\\) itself. Kepler's equation, from module ${Progress.code('orbits')}, gives the time:`}</p>
            <div class="eq">\\[ \\cos\\nu_{EI} = \\frac{1}{e}\\left(\\frac{p}{r_{EI}} - 1\\right), \\quad p = a(1 - e^2), \\qquad \\theta_{vac} = 180^\\circ - \\nu_{EI} \\]</div>
            <div class="eq">\\[ \\tan\\frac{E}{2} = \\sqrt{\\frac{1-e}{1+e}}\\,\\tan\\frac{\\nu_{EI}}{2}, \\qquad M = E - e\\sin E, \\qquad t_{vac} = \\frac{\\pi - M}{n}, \\quad n = \\sqrt{\\frac{\\mu}{a^3}} \\]</div>
            ${Sym.where(['nu', ['p', N`semi-latus rectum of the ellipse: its width measured at the focus`, 'm'], ['\\theta_{vac}', N`angle flown around the Earth from the burn to the interface`, N`°`], 'E', ['M', N`mean anomaly: the fraction of the period elapsed since perigee, as an angle`, 'rad'], 'n', ['t_{vac}', N`time from the burn to the interface`, 's']], N`M is the angle that grows steadily with time; at perigee it is 0 and at apogee π. The time still to run before the perigee is M/n, so the time since the apogee is half a period minus that. Use radians for E and M in the second equation.`)}
            <p>${T`Example: \\(\\nu_{EI} = ${f(W.g.nuDeg, 2)}^\\circ\\), so \\(\\theta_{vac} = ${f(W.g.angDeg, 2)}^\\circ\\). Then \\(E = ${f(W.g.EDeg, 2)}^\\circ\\), \\(M = ${f(W.g.MDeg, 2)}^\\circ\\), \\(n = ${f(2 * Math.PI / W.g.P * 1000, 4)}\\times10^{-3}\\) rad/s and \\(t_{vac} = ${f(W.g.t, 0)}\\) s, or ${UI.fmtTime(W.g.t)}. About ${f(W.g.angDeg / 360 * 100, 0)}% of an orbit.`}</p>
            <h3>${T`3. The range in the atmosphere: calibrate once`}</h3>
            <p>${T`From the interface to splashdown the capsule keeps travelling. How far depends on the entry angle, the speed and the vehicle (ballistic coefficient and lift), and there is no short formula for it. Use the practical method instead. <b>Calibrate it once per vehicle</b>: fly the vehicle (or the best simulation of it) at the planned entry angle, note the angle \\(\\theta_{atm}\\) swept between the interface and splashdown and the time \\(t_{atm}\\) it took, then reuse them. They change slowly: here by about ${f(W.sens.atmPerDeg, 0)}° of range for each degree of entry angle, so a calibration made near the planned angle is good to a fraction of a degree.`}</p>
            <p>${T`Example, with the lab's Command Module (5 500 kg, L/D 0.3, bank 45°) at ${f(W.g.vEI / 1000, 2)} km/s and ${f(W.g.gammaDeg, 2)}°: the lab reads a downrange distance of ${f(W.s.range / 1000, 0)} km, which is \\(\\theta_{atm} = ${f(W.atmDeg, 2)}^\\circ\\) of Earth arc, and ${UI.fmtTime(W.s.t)} to the drogues, with a peak of ${f(W.s.maxG, 1)} g. The lab stops at the drogues (7.3 km). Add about ${f(ER.T_CHUTE / 60, 0)} minutes under the parachutes, an estimate that this section assumes. Then \\(t_{atm} = ${f(W.atmT, 0)}\\) s. The roll steers this number: with lift up (bank 0°) the same entry flies 35.9°, with lift sideways (90°) only 24.0° but at 9 g. That is how the crew trims the last hundreds of kilometres in flight.`}</p>
            <h3>${T`4. The Earth turns: the lead angle`}</h3>
            <p>${T`During the whole descent the landing site moves east by \\(\\omega_\\oplus t\\): about 15° per hour, or 0.25° per minute. The capsule must fly the angle \\(\\theta_{vac} + \\theta_{atm}\\) to reach the place where the site will be, so at the burn the site must already be ahead of the capsule by:`}</p>
            <div class="eq">\\[ \\theta_{lead} = \\theta_{vac} + \\theta_{atm} - \\omega_\\oplus\\,\\left(t_{vac} + t_{atm}\\right) \\]</div>
            ${Sym.where([['\\theta_{lead}', N`how far ahead of the capsule, measured along the equator, the landing site must be when the burn starts`, N`°`], ['\\theta_{vac},\\ \\theta_{atm}', N`angle flown in vacuum and in the atmosphere (with the parachute phase)`, N`°`], ['\\omega_\\oplus', N`rotation rate of the Earth: 7.292 × 10⁻⁵ rad/s, 15.04° per hour`, 'rad/s'], ['t_{vac},\\ t_{atm}', N`time from the burn to the interface, and from the interface to splashdown`, 's']], N`Read it as: the capsule flies θ_vac + θ_atm of arc, and the Earth hands back ω·t of it by moving the site towards the capsule's landing point.`)}
            <p>${T`<b>The rule: fire when the landing site is ${f(W.L.lead, 1)}° ahead.</b> Worked out: the capsule flies ${f(W.g.angDeg, 2)}° + ${f(W.atmDeg, 2)}° = ${f(W.L.total, 2)}° in ${f(W.L.time, 0)} s (${f(W.L.time / 60, 1)} min). In that time the Earth turns ${f(W.L.rot, 2)}°. The lead angle is ${f(W.L.total, 2)}° − ${f(W.L.rot, 2)}° = ${f(W.L.lead, 2)}°, which is ${f(W.L.lead / ER.DEG * ER.RE / 1000, 0)} km along the equator. The site comes into that position once every ${f(2 * Math.PI / (Math.sqrt(C.muE / Math.pow(W.g.r0, 3)) - ER.wE) / 60, 0)} minutes (an orbit, plus the Earth's turn), so there is a window on every revolution. Choosing which one is how Mission Control gets daylight and good weather.`}</p>
            <p>${T`<b>Check against the full motion.</b> Integrating step by step from the burn, with gravity, drag and lift, down to the drogues, the capsule flies 82.75°. The hand method (vacuum arc plus the calibrated atmospheric arc) gives 82.76°, a difference under 0.01°, or 1 km. The vacuum arc alone, integrated without drag, is 51.74° against 51.73° by formula.`}</p>
            <h3>${T`5. How sensitive is it?`}</h3>
            <p>${T`<b>Late burn.</b> A burn made one second late starts one second further along the orbit, and the whole path shifts with it. The capsule moves over the ground at \\(n R_\\oplus\\) = ${f(W.late + ER.wE * ER.RE / 1000, 2)} km/s (a little less than the 7.78 km/s orbital speed, because the ground is below the orbit), and the site moves ${f(ER.wE * ER.RE / 1000, 2)} km/s the same way. The landing is therefore ${f(W.late, 1)} km further along for each second of delay. Five seconds is 35 km.`}</p>
            <p>${T`<b>Error in Δv.</b> Each 1 m/s too much speed taken off lowers the perigee by ${f(-W.sens.hpPerMs / 1000, 1)} km and steepens the entry by ${f(-W.sens.gPerMs, 4)}°. The capsule lands shorter by ${f(-W.sens.vacKm, 0)} km in the vacuum arc and ${f(-W.sens.atmKm, 0)} km in the atmosphere, and the shorter flight lets the Earth turn a little less. Net result: the landing moves by about <b>${f(-W.sens.totKm, 0)} km per m/s</b>. To land within tens of kilometres, the Δv must be right to about 1 m/s and the burn time to a few seconds. Real burns have a finite length and attitude errors: that is why the roll in the atmosphere and the recovery ships' margin matter.`}</p>
            <h3>${T`6. Coming back from the Moon`}</h3>
            <p>${T`From lunar distance there is no burn near the Earth to time. The capsule arrives at the interface at a moment, and the Earth turns 15° per hour under it. The landing longitude is therefore set by the <b>arrival time</b>: chosen by the revolution of the trans-Earth burn (module ${Progress.code('homeward')}, section ${App.sec('homeward', 4)}, one revolution is about 30° of longitude) and trimmed by the last midcourse correction, which can move the arrival by minutes. One minute of arrival time moves the landing by ${f(ER.wE * 60 * ER.RE / 1000, 0)} km along the equator. The range from the interface to splashdown is handled as above, calibrated for the capsule and the entry angle.`}</p>
          </div>
          <div class="prose">
            <h3>${T`Lab: splash down next to the ship`}</h3>
            <p>${T`Now do it. A recovery ship waits on the equator, and you are in a circular orbit above it. Choose the deorbit Δv, then how far ahead of you the ship must be when you fire, and press <b>Fire</b>. The capsule comes down while the Earth carries the ship eastward, and the strip under the picture shows where you splash down relative to the ship.`}</p>
            <ul>
              <li>${T`Mission rules: splash down within ${AIM.tol} km of the ship, with an entry angle between ${f(AIM.gMax, 1)}° and ${f(AIM.gMin, 1)}°. Step 1 of this section gives the Δv for an entry angle.`}</li>
              <li>${T`<b>Test flight</b> flies the capsule through the atmosphere at your Δv and reports the range angle and the time: the calibration of step 3. You may use it freely.`}</li>
              <li>${T`The angle and the time in vacuum (step 2) and the lead angle (step 4) are yours to work out. <b>Show the working</b> prints them, but the objective is then not credited for this orbit. You can also find the lead angle by trial: each degree is ${f(Math.PI / 180 * ER.RE / 1000, 0)} km on the ground.`}</li>
            </ul>
          </div>
          <div class="lab tl-lab er-lab" id="er">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Deorbit and splashdown`}</h3><span class="spacer"></span><div class="badge" id="er-badge"></div></div>
            <div class="stage"><canvas id="er-cv" aria-label="${T`The Earth’s equator seen side-on, with the orbit, the capsule’s descent from the deorbit burn to splashdown, and the recovery ship carried east by the Earth’s rotation. A strip underneath shows the splashdown point relative to the ship.`}"></canvas></div>
            <div class="tl-side">
              <dl class="readout" id="er-ro"></dl>
            </div>
            <div class="tl-groups">
              <div class="tl-group">
                <h4>${T`Orbit`}</h4>
                <div class="ctl"><label for="er-scen"><span>${T`Starting orbit`}</span></label><select id="er-scen">${Object.entries(AIM.scen).map(([k, sc]) => `<option value="${k}">${T(sc.label)}</option>`).join('')}</select></div>
                <p class="note" style="margin:0">${T`Circular, over the equator, flown eastward. The capsule is the Command Module of the entry lab: 5 500 kg, L/D 0.3, banked 45°.`}</p>
              </div>
              <div class="tl-group">
                <h4>${T`Deorbit burn`}</h4>
                <div class="mc-fields">
                  <div><label><span>${T`deorbit Δv (m/s)`}</span><input type="text" inputmode="decimal" id="er-dv" autocomplete="off"></label>
                    <div class="er-nudge" data-for="er-dv" role="group" aria-label="${T`Change the deorbit Δv by a small step`}">${[-10, -1, 1, 10].map((d) => `<button class="btn" data-d="${d}">${d > 0 ? '+' : '−'}${Math.abs(d)}</button>`).join('')}</div></div>
                  <div><label><span>${T`ship ahead by (°)`}</span><input type="text" inputmode="decimal" id="er-lead" autocomplete="off"></label>
                    <div class="er-nudge" data-for="er-lead" role="group" aria-label="${T`Change the lead angle by a small step`}">${[-1, -0.1, 0.1, 1].map((d) => `<button class="btn" data-d="${d}">${d > 0 ? '+' : '−'}${UI.dec(String(Math.abs(d)))}</button>`).join('')}</div></div>
                </div>
                <div class="btn-row"><button class="btn primary" id="er-go">${T`Fire`}</button><button class="btn" id="er-cal">${T`Test flight`}</button><button class="btn" id="er-work">${T`Show the working`}</button></div>
                <div class="er-rep" id="er-rep" aria-live="polite"></div>
              </div>
              <div class="tl-group">
                <h4>${T`Numbers for the hand method`}</h4>
                <dl class="readout" id="er-steps"></dl>
              </div>
            </div>
          </div>
          <p class="note">${T`The burn is treated as instantaneous and the Earth as a sphere. The simulation stops at the drogue parachutes (7.3 km); ${f(ER.T_CHUTE / 60, 0)} minutes of parachute descent are added, straight down. The picture stretches altitudes so that the orbit can be told from the ground.`}</p>
        </section>

        <section class="section">
          <h2><span class="idx">10.6</span>${T`Blackout and splashdown`}</h2>
          <div class="prose">
            <p>${T`Air in the shock layer ionizes into a plasma that blocks radio for several minutes. Apollo's blackout lasted about 3 to 4 minutes. At 7.3 km two drogue parachutes opened to stabilize the capsule; at 3 km three 25 m main parachutes slowed it to about 9 m/s for splashdown. Apollo 11 hit the Pacific at 16:50 UTC on 24 July 1969, 195 hours 18 minutes after liftoff.`}</p>
          </div>
        </section>

        ${Archive.capsule('celebration')}

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('entry', { math: 'derivative', mathLabel: N`Derivatives and exponentials.` })}`;

      mountEntry(page.querySelector('#en'));
      mountAim(page.querySelector('#er'));
      Practice.embed(page.querySelector('#practice-slot'), 'entry', 3);
    },
  });


  function mountAim(root) {
    const $ = (sel) => root.querySelector(sel);
    const num = (id) => { const t = String($(id).value).replace(/\s|\u202f/g, '').replace('−', '-').replace(',', '.'); if (t === '') return NaN; const v = Number(t); return isFinite(v) ? v : NaN; };
    const set = (id, v) => { $(id).value = UI.dec(String(v)); };
    const km = (deg) => deg / ER.DEG * ER.RE / 1000, STRETCH = 4, ANIM = 6000;
    let scen = 'low', fl = null, lead = NaN, dv = NaN, tSim = null, done = false, raf = 0, peeked = false;
    const view = UI.canvas($('#er-cv'), null);
    UI.onCleanup(() => cancelAnimationFrame(raf));

    // position on the flown path at time t (linear between samples)
    function at(t) {
      const S = fl.samples; let i = 1;
      while (i < S.length - 1 && S[i].t < t) i++;
      const a = S[i - 1], b = S[i], k = b.t > a.t ? Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))) : 1;
      return { ang: a.ang + (b.ang - a.ang) * k, alt: a.alt + (b.alt - a.alt) * k, i };
    }

    function plan() {                                      // inputs changed: back to the plan, nothing flown
      cancelAnimationFrame(raf); tSim = null; done = false;
      dv = num('#er-dv'); lead = num('#er-lead');
      fl = isFinite(dv) && dv > 0 ? flight(AIM.scen[scen].h, dv) : null;
      $('#er-rep').textContent = '';
      render(); view.redraw();
    }
    function render() {
      const b = $('#er-badge'), ro = $('#er-ro'), row = (k, v, hl) => `<dt>${k}</dt><dd${hl ? ' class="hl"' : ''}>${v}</dd>`;
      const ok = fl && fl.ok && isFinite(lead);
      const m = ok && done && fl.landed ? missKm(fl, lead) : null;
      b.className = 'badge' + (m == null ? '' : Math.abs(m) <= AIM.tol ? ' good' : ' warn');
      b.textContent = !fl || !isFinite(lead) ? T`Enter numbers` : !fl.ok ? T`No entry` : !done ? (tSim == null ? T`Ready to fire` : T`Descending`) : !fl.landed ? T`Skipped out` : Math.abs(m) <= AIM.tol ? T`On target` : m > 0 ? T`Long` : T`Short`;
      ro.innerHTML = row(T`Orbit altitude`, `${fm(AIM.scen[scen].h / 1000, 0)} km`) + row(T`Ship ahead at the burn`, isFinite(lead) ? `${fm(lead, 2)}° · ${fm(km(lead), 0)} km` : '—')
        + `<dt class="sub" style="grid-column:1/-1">${T`After the flight`}</dt>`
        + row(T`Entry angle`, done && fl.ok ? `${fm(fl.g.gammaDeg, 2)}°` : '—') + row(T`Peak deceleration`, done && fl.ok ? `${fm(fl.maxG, 1)} g` : '—')
        + row(T`Angle flown`, done && fl.ok && fl.landed ? `${fm(fl.total, 2)}°` : '—') + row(T`Flight time`, done && fl.ok && fl.landed ? UI.fmtTime(fl.time) : '—')
        + row(T`Earth turned`, done && fl.ok && fl.landed ? `${fm(ER.wE * fl.time * ER.DEG, 2)}°` : '—')
        + row(T`Splashdown`, m == null ? '—' : Math.abs(m) < 0.5 ? T`at the ship` : m > 0 ? T`${fm(m, 0)} km beyond the ship` : T`${fm(-m, 0)} km short of the ship`, 1);
    }

    function fire() {
      plan();
      if (!fl || !isFinite(lead)) return;
      if (!fl.ok) { done = true; finish(); return; }
      const t0 = performance.now(), T1 = fl.samples[fl.samples.length - 1].t;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / ANIM); tSim = T1 * k; view.redraw(); render();
        if (k < 1) raf = requestAnimationFrame(step); else { done = true; finish(); }
      };
      tSim = 0; raf = requestAnimationFrame(step);
    }
    function finish() {
      render(); view.redraw();
      const el = $('#er-rep'), checks = [], gOK = fl.ok && fl.g.gammaDeg <= AIM.gMax && fl.g.gammaDeg >= AIM.gMin, m = fl.ok && fl.landed ? missKm(fl, lead) : null;
      let head;
      if (!fl.ok) head = T`Burn of ${fm(dv, 0)} m/s: the perigee stays above the atmosphere. The capsule does not come down. Burn more.`;
      else if (!fl.landed) head = T`Burn of ${fm(dv, 0)} m/s: the capsule skips back out of the atmosphere.`;
      else head = T`Burn of ${fm(dv, 0)} m/s with the ship ${fm(lead, 2)}° ahead. Splashdown ${Math.abs(m) < 0.5 ? T`at the ship` : m > 0 ? T`${fm(m, 0)} km beyond the ship` : T`${fm(-m, 0)} km short of the ship`}.`;
      if (fl.ok) checks.push([gOK, gOK ? T`Entry angle ${fm(fl.g.gammaDeg, 2)}°: inside the planned ${fm(AIM.gMax, 1)}° to ${fm(AIM.gMin, 1)}°.` : fl.g.gammaDeg > AIM.gMax ? T`Entry angle ${fm(fl.g.gammaDeg, 2)}°: too shallow. Burn more.` : T`Entry angle ${fm(fl.g.gammaDeg, 2)}°: too steep. Burn less.`]);
      if (m != null) checks.push([Math.abs(m) <= AIM.tol, Math.abs(m) <= AIM.tol ? T`Within ${AIM.tol} km of the ship.` : m > 0 ? T`Too far: you fired too late. Fire when the ship is further ahead.` : T`Too short: you fired too early. Fire when the ship is less far ahead.`]);
      const all = m != null && gOK && Math.abs(m) <= AIM.tol;
      if (all && !peeked) Progress.done('entry', 'site');
      if (all) checks.push([!peeked, peeked ? T`Objective not counted: the working was shown for this orbit.` : T`Objective met: your own burn and lead angle.`]);
      el.innerHTML = `<b>${head}</b><ul>${checks.map(([ok, t]) => `<li><span class="verdict ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span> ${t}</li>`).join('')}</ul>`;
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    }

    function steps(full) {
      const dl = $('#er-steps'), row = (k, v) => `<dt>${k}</dt><dd>${v}</dd>`;
      if (!fl || !fl.ok || !fl.landed) { dl.innerHTML = `<dt></dt><dd class="note" style="text-align:left">${!fl ? T`Enter a Δv first.` : !fl.ok ? T`This burn does not bring the capsule down.` : T`This entry skips out.`}</dd>`; return; }
      const g = fl.g, cm = fl.cm;
      let h = row(T`Entry speed`, `${fm(g.vEI, 0)} m/s`) + row(T`Entry angle`, `${fm(g.gammaDeg, 2)}°`) + row(T`Range angle θ_atm`, `${fm(cm.atmDeg, 2)}°`) + row(T`Time interface to splashdown`, `${fm(cm.atmT, 0)} s`) + row(T`Peak deceleration`, `${fm(fl.maxG, 1)} g`);
      if (full) {
        const L = ER.lead(g, cm.atmDeg, cm.atmT);
        h = row(T`Speed after the burn v_a`, `${fm(g.va, 1)} m/s`) + row('a', `${fm(g.a / 1000, 1)} km`) + row('e', fm(g.e, 4)) + row('ν_EI', `${fm(g.nuDeg, 2)}°`) + row(T`Angle burn to interface`, `${fm(g.angDeg, 2)}°`) + row(T`Time burn to interface`, `${fm(g.t, 0)} s`)
          + h + row(T`Total angle flown`, `${fm(L.total, 2)}°`) + row(T`Earth rotation during descent`, `${fm(L.rot, 2)}°`) + row(T`Fire when the ship is ahead by`, `${fm(L.lead, 2)}°`);
      }
      dl.innerHTML = h;
    }
    const stepsHint = () => { $('#er-steps').innerHTML = `<dt></dt><dd class="note" style="text-align:left">${T`Test flight puts the calibration here. Show the working adds the rest, and the objective is then not credited for this orbit.`}</dd>`; };

    // ---- drawing: the equator side-on, east to the right; the Earth's centre is below the picture ----
    view.draw = (ctx, w, h) => {
      const K = UI.tok(), strip = 62, top = 14, hA = h - strip - top;
      ctx.clearRect(0, 0, w, h); UI.stars(ctx, w, h, K, 60); ctx.font = `10px ${K.mono}`;
      const rot = fl && fl.ok && fl.landed ? ER.wE * fl.time * ER.DEG : 0, L = isFinite(lead) ? lead : 0;
      const a0 = -7, a1 = Math.max(fl && fl.ok && fl.landed ? fl.total : 60, L + rot, 40) + 9, half = (a1 - a0) / 2 / ER.DEG, mid = (a0 + a1) / 2;
      const hO = AIM.scen[scen].h, up = (alt) => 1 + STRETCH * alt / ER.RE;                    // stretched radius, in Earth radii
      const R = Math.min((w - 30) / (2 * Math.sin(Math.min(half, Math.PI / 2)) * up(hO)), (hA - 34) / (up(hO) - Math.cos(Math.min(half, Math.PI * 0.8))));
      const cx = w / 2, cy = top + 26 + R * up(hO);
      const P = (ang, alt) => { const a = (ang - mid) / ER.DEG; return [cx + R * up(alt) * Math.sin(a), cy - R * up(alt) * Math.cos(a)]; };
      const arc = (alt, b0, b1) => { ctx.beginPath(); for (let i = 0; i <= 80; i++) { const q = P(b0 + (b1 - b0) * i / 80, alt); if (i) ctx.lineTo(...q); else ctx.moveTo(...q); } };
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h - strip); ctx.clip();
      // Earth, entry interface, orbit
      ctx.fillStyle = K.earth; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ctx.strokeStyle = K.muted; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); arc(C.entryInterface, a0 - 40, a1 + 40); ctx.stroke();
      ctx.strokeStyle = K.trace; ctx.setLineDash([5, 5]); arc(hO, a0 - 40, a1 + 40); ctx.stroke(); ctx.setLineDash([]);
      const t = tSim == null ? 0 : tSim, shipNow = L + ER.wE * t * ER.DEG;
      // the ship: where it was at the burn, the arc the Earth carried it through, where it is now
      if (isFinite(lead)) {
        if (t > 0) { ctx.strokeStyle = K.good; ctx.lineWidth = 4; ctx.globalAlpha = 0.6; arc(0, L, shipNow); ctx.stroke(); ctx.globalAlpha = 1;
          const q0 = P(L, 0); ctx.strokeStyle = K.good; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q0[0], q0[1], 4, 0, 7); ctx.stroke(); }
        const q = P(shipNow, 0), qu = P(shipNow, 30e3);
        ctx.fillStyle = K.good; ctx.beginPath(); ctx.arc(q[0], q[1], 5, 0, 7); ctx.fill();
        ctx.textAlign = 'center'; ctx.fillText(T`ship`, qu[0], qu[1] - 4);
      }
      // the capsule and its path
      if (fl && fl.ok) {
        const S = fl.samples, cur = tSim == null ? { ang: 0, alt: hO, i: 0 } : at(t);
        if (tSim != null) {
          ctx.strokeStyle = K.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...P(0, hO));
          for (let i = 0; i < cur.i; i++) ctx.lineTo(...P(S[i].ang, S[i].alt));
          ctx.lineTo(...P(cur.ang, cur.alt)); ctx.stroke();
        }
        const b = P(0, hO), c = P(cur.ang, cur.alt);
        ctx.fillStyle = K.muted; ctx.textAlign = 'left'; ctx.fillText(T`deorbit burn`, b[0] + 8, b[1] - 8);
        ctx.strokeStyle = K.warn; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b[0], b[1], 5, 0, 7); ctx.stroke();
        ctx.fillStyle = K.accent; ctx.beginPath(); ctx.arc(c[0], c[1], 5, 0, 7); ctx.fill();
        if (tSim == null && isFinite(lead)) {                // the lead angle, before firing
          ctx.strokeStyle = K.warn; ctx.lineWidth = 1.2; arc(hO + 45e3, 0, L); ctx.stroke();
          const m = P(L / 2, hO + 45e3); ctx.fillStyle = K.warn; ctx.textAlign = 'center'; ctx.fillText(`${fm(L, 2)}°`, m[0], m[1] - 6);
        }
      }
      ctx.fillStyle = K.muted; ctx.textAlign = 'right'; ctx.fillText(T`east →  (the Earth turns this way)`, w - 8, 12);
      ctx.textAlign = 'left'; const lo = P(a0 + 2, hO); ctx.fillStyle = K.trace; ctx.fillText(T`orbit`, Math.max(6, lo[0] - 4), lo[1] + 14);
      ctx.restore();
      // strip: splashdown relative to the ship
      const y0 = h - strip, yc = y0 + 34, span = 320, X = (d) => w / 2 + (w / 2 - 24) * d / span;
      ctx.fillStyle = K.panel; ctx.fillRect(0, y0, w, strip); ctx.strokeStyle = K.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y0 + 0.5); ctx.lineTo(w, y0 + 0.5); ctx.stroke();
      ctx.fillStyle = K.good; ctx.globalAlpha = 0.25; ctx.fillRect(X(-AIM.tol), yc - 9, X(AIM.tol) - X(-AIM.tol), 18); ctx.globalAlpha = 1;
      ctx.strokeStyle = K.muted; ctx.beginPath(); ctx.moveTo(X(-span), yc); ctx.lineTo(X(span), yc); ctx.stroke();
      ctx.fillStyle = K.muted; ctx.textAlign = 'center';
      for (const d of [-300, -200, -100, 100, 200, 300]) { ctx.beginPath(); ctx.moveTo(X(d), yc - 4); ctx.lineTo(X(d), yc + 4); ctx.stroke(); ctx.fillText(`${d > 0 ? '+' : '−'}${Math.abs(d)}`, X(d), yc + 18); }
      ctx.fillStyle = K.good; ctx.beginPath(); ctx.arc(X(0), yc, 5, 0, 7); ctx.fill(); ctx.fillText(T`ship`, X(0), yc + 18);
      ctx.fillStyle = K.muted; ctx.textAlign = 'left'; ctx.fillText(T`Splashdown relative to the ship (km)`, 8, y0 + 13);
      if (done && fl && fl.ok && fl.landed && isFinite(lead)) {
        const m = missKm(fl, lead), inside = Math.abs(m) <= span, x = X(Math.max(-span, Math.min(span, m)));
        ctx.fillStyle = K.accent;
        if (inside) { ctx.beginPath(); ctx.moveTo(x, yc - 3); ctx.lineTo(x - 6, yc - 15); ctx.lineTo(x + 6, yc - 15); ctx.closePath(); ctx.fill(); }
        else { UI.arrow(ctx, x - Math.sign(m) * 26, yc - 12, x, yc - 12, K.accent, 2); ctx.textAlign = m > 0 ? 'right' : 'left'; ctx.fillText(`${fm(Math.abs(m), 0)} km`, x - Math.sign(m) * 32, yc - 9); }
      }
    };

    // ---- wiring ----
    $('#er-scen').addEventListener('change', (e) => { scen = e.target.value; peeked = false; stepsHint(); plan(); });
    root.querySelectorAll('#er-dv, #er-lead').forEach((el) => { el.addEventListener('input', plan); el.addEventListener('keydown', (e) => { if (e.key === 'Enter') fire(); }); });
    root.querySelectorAll('.er-nudge button').forEach((bt) => bt.addEventListener('click', () => {
      const id = '#' + bt.parentNode.dataset.for, v = num(id);
      if (isFinite(v)) { set(id, +(v + +bt.dataset.d).toFixed(2)); plan(); }
    }));
    $('#er-go').addEventListener('click', fire);
    $('#er-cal').addEventListener('click', () => { plan(); steps(peeked); });
    $('#er-work').addEventListener('click', () => { plan(); peeked = true; steps(true); });
    set('#er-dv', 100); set('#er-lead', 90); stepsHint(); plan();
  }

  function mountEntry(root) {
    let sim = null, opts = null, map = null, mapKey = '';
    const G_LIM = 10;
    const presets = {
      apollo: { 'en-v': 11.03, 'en-g': -6.5, 'en-b': 45, 'en-ld': 0.3 },
      shallow: { 'en-v': 11.03, 'en-g': -5.0, 'en-b': 90, 'en-ld': 0.3 },
      steep: { 'en-v': 11.03, 'en-g': -8.5, 'en-b': 0, 'en-ld': 0.3 },
      ballistic: { 'en-v': 11.03, 'en-g': -6.5, 'en-b': 0, 'en-ld': 0 },
      leo: { 'en-v': 7.8, 'en-g': -1.5, 'en-b': 0, 'en-ld': 0.18 },
    };
    // objectives count only after the candidate has changed a control themselves (not a preset)
    let touched = false;
    root.addEventListener('input', () => { touched = true; }, true);
    root.addEventListener('change', (e) => { touched = e.target.id !== '-'; }, true);
    const view = UI.canvas(root.querySelector('#en-cv'), null);
    const minis = ['#en-c1', '#en-c2', '#en-c3'].map((s) => UI.canvas(root.querySelector(s), null));
    const mapCv = UI.canvas(root.querySelector('#en-map'), null);
    const GMIN = -10, GMAX = -3, NG = 29, NB = 13;
    const classify = (r) => (r.outcome === 'skip' ? 'skip' : r.maxG > G_LIM ? 'hard' : 'ok');

    const fmts = { 'en-v': (x) => x.toFixed(2), 'en-g': (x) => x.toFixed(2), 'en-b': (x) => x.toFixed(0), 'en-ld': (x) => x.toFixed(2) };
    const ctl = UI.bindControls(root, fmts, (v) => {
      opts = { v0: v['en-v'] * 1000, gamma0: v['en-g'], bank: v['en-b'], ld: v['en-ld'] };
      sim = Phys.simulateEntry(opts);
      if (touched && classify(sim) === 'skip') Progress.done('entry', 'skip');
      if (touched && classify(sim) === 'ok' && sim.maxG < 8 && opts.v0 >= 10500) Progress.done('entry', 'safe');
      const key = `${v['en-v']}|${v['en-ld']}`;
      if (key !== mapKey) { map = buildMap(opts); mapKey = key; }
      readout();
      view.redraw(); minis.forEach((m) => m.redraw()); mapCv.redraw();
    });
    root.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => { const p = presets[b.dataset.p]; touched = false; for (const k in p) ctl.set(k, p[k]); ctl.update(); }));

    function buildMap(o) {
      const cells = [];
      for (let i = 0; i < NG; i++) for (let j = 0; j < NB; j++) {
        const g = GMIN + (GMAX - GMIN) * i / (NG - 1), b = 180 * j / (NB - 1);
        cells.push({ g, b, c: classify(Phys.simulateEntry({ ...o, gamma0: g, bank: b })) });
      }
      return cells;
    }

    function readout() {
      const s = sim, c = classify(s);
      const b = root.querySelector('#en-badge');
      b.textContent = c === 'skip' ? T`Skip-out: back to space` : c === 'hard' ? T`Too steep: ${UI.fmt(s.maxG, 1)} g` : T`Captured: in the corridor`;
      b.className = 'badge ' + (c === 'ok' ? 'good' : c === 'skip' ? 'warn' : 'bad');
      const beta = 5500 / (1.3 * 12.0);
      const ke = 0.5 * opts.v0 * opts.v0;
      const aeg = opts.v0 * opts.v0 * Math.sin(-opts.gamma0 * Math.PI / 180) / (2 * Math.E * C.H) / C.g0;
      root.querySelector('#en-ro').innerHTML = `
        <dt>${T`Peak deceleration`}</dt><dd class="hl">${UI.fmt(s.maxG, 1)} g</dd>
        <dt>${T`Allen–Eggers (straight line)`}</dt><dd>${UI.fmt(aeg, 1)} g</dd>
        <dt>${T`Peak heat flux`}</dt><dd>${UI.fmt(s.maxQdot / 1e6, 2)} MW/m²</dd>
        <dt>${T`Total heat load`}</dt><dd>${UI.fmt(s.heatLoad / 1e6, 0)} MJ/m²</dd>
        <dt>${T`Downrange`}</dt><dd>${UI.fmt(s.range / 1000, 0)} km</dd>
        <dt>${T`Time to drogues`}</dt><dd>${s.outcome === 'landed' ? UI.fmtTime(s.t) : '—'}</dd>
        <dt class="sub">${T`Vehicle`}</dt>
        <dt>${T`Ballistic coeff. β`}</dt><dd>${UI.fmt(beta, 0)} kg/m²</dd>
        <dt>${T`Kinetic energy`}</dt><dd>${UI.fmt(ke / 1e6, 1)} MJ/kg</dd>`;
    }

    view.draw = (ctx, w, h) => {
      if (!sim) return;
      const K = UI.tok();
      const data = sim.trace.map((p) => [p.s / 1000, p.h / 1000]);
      const maxS = Math.max(500, ...data.map((d) => d[0]));
      const { X, Y } = UI.chart(ctx, w, h, { series: [{ data, color: K.accent, width: 2.4 }], xMin: 0, xMax: maxS * 1.03, yMin: 0, yMax: 140, xLabel: T`downrange (km)`, yLabel: T`altitude (km)`, xFmt: (x) => x.toFixed(0), yFmt: (y) => y.toFixed(0),
        hlines: [{ y: 121.92, label: T`entry interface 122 km`, color: K.muted }, { y: 7.3, label: T`drogues 7.3 km`, color: K.good }] });
      // colour the path by g-load
      ctx.lineWidth = 3.5;
      for (let i = 1; i < sim.trace.length; i++) {
        const p = sim.trace[i], q = sim.trace[i - 1];
        if (p.g < 3) continue;
        ctx.strokeStyle = p.g > G_LIM ? K.bad : p.g > 6 ? K.warn : K.trace;
        ctx.beginPath(); ctx.moveTo(X(q.s / 1000), Y(q.h / 1000)); ctx.lineTo(X(p.s / 1000), Y(p.h / 1000)); ctx.stroke();
      }
      // peak-g marker
      const pk = sim.trace.reduce((a, b) => (b.g > a.g ? b : a));
      ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(X(pk.s / 1000), Y(pk.h / 1000), 4, 0, 7); ctx.fill();
      ctx.font = `11px ${K.mono}`; ctx.textAlign = 'left'; ctx.fillText(T`peak ${UI.fmt(pk.g, 1)} g at ${UI.fmt(pk.h / 1000, 0)} km`, X(pk.s / 1000) + 8, Y(pk.h / 1000) - 8);
      ctx.fillStyle = K.muted; ctx.fillText(T`path coloured above 3 g: blue < 6 g < amber < 10 g < red`, 52, 18);
    };

    const series = (f) => sim.trace.map((p) => [p.t, f(p)]);
    minis[0].draw = (ctx, w, h) => { if (!sim) return; const K = UI.tok(); UI.chart(ctx, w, h, { series: [{ data: series((p) => p.g), color: K.bad, fill: true }], xMin: 0, yMin: 0, xFmt: (x) => x.toFixed(0), xLabel: 't (s)', hlines: [{ y: G_LIM, color: K.bad, label: '10 g' }] }); };
    minis[1].draw = (ctx, w, h) => { if (!sim) return; const K = UI.tok(); UI.chart(ctx, w, h, { series: [{ data: series((p) => p.v / 1000), color: K.trace, fill: true }], xMin: 0, yMin: 0, xFmt: (x) => x.toFixed(0), xLabel: 't (s)' }); };
    minis[2].draw = (ctx, w, h) => { if (!sim) return; const K = UI.tok(); UI.chart(ctx, w, h, { series: [{ data: series((p) => p.qdot / 1e6), color: K.warn, fill: true }], xMin: 0, yMin: 0, xFmt: (x) => x.toFixed(0), xLabel: 't (s)' }); };

    let mapGeom = null;
    mapCv.draw = (ctx, w, h) => {
      if (!map) return;
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h);
      const pad = { l: 34, r: 6, t: 6, b: 24 };
      const cw = (w - pad.l - pad.r) / NG, ch = (h - pad.t - pad.b) / NB;
      mapGeom = { pad, cw, ch, w, h };
      for (let k = 0; k < map.length; k++) {
        const i = Math.floor(k / NB), j = k % NB, c = map[k].c;
        ctx.fillStyle = c === 'ok' ? K.good : c === 'skip' ? K.trace : K.bad;
        ctx.globalAlpha = 0.75;
        ctx.fillRect(pad.l + i * cw, pad.t + j * ch, cw - 1, ch - 1);
      }
      ctx.globalAlpha = 1;
      ctx.font = `10px ${K.mono}`; ctx.fillStyle = K.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (const g of [-10, -8, -6, -4]) ctx.fillText(g + '°', pad.l + (g - GMIN) / (GMAX - GMIN) * (w - pad.l - pad.r), h - pad.b + 5);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (const b of [0, 90, 180]) ctx.fillText(b + '°', pad.l - 4, pad.t + b / 180 * (h - pad.t - pad.b));
      // current point
      const x = pad.l + (opts.gamma0 - GMIN) / (GMAX - GMIN) * (w - pad.l - pad.r), y = pad.t + opts.bank / 180 * (h - pad.t - pad.b);
      ctx.strokeStyle = K.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.stroke();
      ctx.fillStyle = K.bg; ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill();
    };
    root.querySelector('#en-map').addEventListener('click', (e) => {
      if (!mapGeom) return;
      const r = e.currentTarget.getBoundingClientRect(), { pad, w, h } = mapGeom;
      const g = GMIN + (e.clientX - r.left - pad.l) / (w - pad.l - pad.r) * (GMAX - GMIN);
      const b = (e.clientY - r.top - pad.t) / (h - pad.t - pad.b) * 180;
      touched = true;
      ctl.set('en-g', Math.max(GMIN, Math.min(GMAX, g)).toFixed(2)); ctl.set('en-b', Math.round(Math.max(0, Math.min(180, b)) / 5) * 5);
      ctl.update();
    });
    ctl.update();
  }
})();
