/* Chapter 2 — The two-body problem, conic sections, Kepler's laws, time of flight. Lab: orbit designer. */
(function () {
  'use strict';
  const { C } = Phys;
  const SIDEREAL_DAY = 86164.0905;   // s, one turn of the Earth against the stars

  /* ---------- figures (inline SVG, themed through CSS variables; Greek labels are HTML so the glossary tooltips work) ---------- */
  const rad = Math.PI / 180;
  const fx = (n) => n.toFixed(1);
  const pct = (x, w) => (100 * x / w).toFixed(2) + '%';
  const lbs = (list, W, H) => list.map(([x, y, t, c]) => `<span class="lb ${c || ''}" style="left:${pct(x, W)};top:${pct(y, H)}">${t}</span>`).join('');
  const poly = (pts, close) => pts.map((q, i) => (i ? 'L' : 'M') + fx(q[0]) + ',' + fx(q[1])).join('') + (close ? 'Z' : '');

  // a cone cut by four planes: circle, ellipse, parabola, hyperbola
  function figConics() {
    const cone = '<path class="f-cone" d="M30,10H110L70,60ZM70,60L30,110H110Z"/><ellipse class="f-cone" cx="70" cy="10" rx="40" ry="5"/><ellipse class="f-cone" cx="70" cy="110" rx="40" ry="5"/>';
    const panel = (cut, curve, name, ecc) => `<div class="conic"><svg viewBox="0 0 140 190" aria-hidden="true">${cone}<path class="f-cut" d="${cut}"/><g class="f-tr">${curve}</g></svg><b>${name}</b><span>${ecc}</span></div>`;
    return `<figure class="fig conics" role="img" aria-label="${T`A double cone cut by four flat planes. A horizontal cut gives a circle, a slightly tilted cut an ellipse, a cut parallel to the cone’s side a parabola, and a steep cut through both halves of the cone a hyperbola.`}">
      <div class="conic-row">
        ${panel('M20,90H120', '<circle cx="70" cy="155" r="22"/>', T`Circle`, 'e = 0')}
        ${panel('M20,99L120,73', '<ellipse cx="70" cy="155" rx="34" ry="19"/>', T`Ellipse`, '0 < e < 1')}
        ${panel('M34,47L86,113', '<path d="M46,128Q70,208 94,128"/>', T`Parabola`, 'e = 1')}
        ${panel('M74,4L84,116', '<path d="M96,128Q76,156 96,184M44,128Q64,156 44,184"/>', T`Hyperbola`, 'e > 1')}
      </div>
      <figcaption>${T`The orange line is the cutting plane seen edge-on. The more you tilt it, the more the curve opens up, from a circle to an ellipse, then to a parabola when the plane is parallel to the cone’s side, then to a hyperbola.`}</figcaption></figure>`;
  }

  // flight-path angle
  function figGamma() {
    const e = 0.35, nu = 75 * rad, rp = 95, p = rp * (1 + e), R = 55, a0 = Math.PI, W = 380, H = 250, c0 = [0, 0];
    c0[0] = 140; c0[1] = 190;   // only the upper half of the orbit is drawn
    const at = (r, v) => [c0[0] + r * Math.cos(a0 - v), c0[1] - r * Math.sin(a0 - v)];
    const rs = p / (1 + e * Math.cos(nu)), g = Math.atan2(e * Math.sin(nu), 1 + e * Math.cos(nu));
    const orb = []; for (let i = 0; i <= 120; i++) { const v = (-30 + 240 * i / 120) * rad; orb.push(at(p / (1 + e * Math.cos(v)), v)); }
    const S = at(rs, nu), phi = a0 - nu, u = [Math.cos(phi), -Math.sin(phi)], t = [Math.sin(phi), Math.cos(phi)];
    const vd = [Math.cos(g) * t[0] + Math.sin(g) * u[0], Math.cos(g) * t[1] + Math.sin(g) * u[1]];
    const add = (q, d, k) => [q[0] + d[0] * k, q[1] + d[1] * k];
    const A = add(S, t, 48), B = add(S, vd, 48), cr = t[0] * vd[1] - t[1] * vd[0];
    const mid = [t[0] + vd[0], t[1] + vd[1]], ml = Math.hypot(mid[0], mid[1]);
    const tip = add(S, vd, 92), h1 = add(S, t, 80), h0 = add(S, t, -60), rm = [(c0[0] + S[0]) / 2, (c0[1] + S[1]) / 2];
    const head = (q, d) => { const n = [-d[1], d[0]]; return poly([add(add(q, d, -9), n, 4), q, add(add(q, d, -9), n, -4)], true); };
    return `<figure class="fig" role="img" aria-label="${T`Flight-path angle: a spacecraft on an elliptical orbit around a planet. The local horizontal is perpendicular to the radius vector. The velocity vector points a little above it, and the angle between the two is the flight-path angle γ.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <circle class="f-earth" cx="${c0[0]}" cy="${c0[1]}" r="${R}"/>
        <path class="f-tr thin" d="${poly(orb)}"/>
        <path class="f-mu" d="M${fx(c0[0])},${fx(c0[1])}L${fx(S[0])},${fx(S[1])}"/>
        <path class="f-mu f-dash" d="M${fx(h0[0])},${fx(h0[1])}L${fx(h1[0])},${fx(h1[1])}"/>
        <path class="f-ac-ln" d="M${fx(S[0])},${fx(S[1])}L${fx(tip[0])},${fx(tip[1])}"/><path class="f-ac-fill" d="${head(tip, vd)}"/>
        <path class="f-ink-ln" d="M${fx(A[0])},${fx(A[1])}A48,48 0 0 ${cr > 0 ? 1 : 0} ${fx(B[0])},${fx(B[1])}"/>
        <circle class="f-ac-fill" cx="${fx(S[0])}" cy="${fx(S[1])}" r="5"/>
      </svg>${lbs([
        [c0[0], c0[1] + 18, T`planet`, 'inv'],
        [rm[0] - 4, rm[1] + 12, 'r', 'm'],
        [h1[0] + 6, h1[1] - 14, T`local horizontal`, 'm l'],
        [tip[0] - 4, tip[1] - 12, T`velocity`, 'acc'],
        [S[0] + (mid[0] / ml) * 66, S[1] + (mid[1] / ml) * 66 - 2, 'γ', 'ink'],
        [S[0] - 10, S[1] - 14, T`spacecraft`, 'ink r'],
        [at(p / (1 - e), Math.PI)[0] + 4, at(p / (1 - e), Math.PI)[1] - 22, T`orbit`, 'tr r'],
      ], W, H)}</div>
      <figcaption>${T`The radius vector \\(r\\) runs from the planet’s centre to the spacecraft. The local horizontal is the line through the spacecraft perpendicular to it. Here the spacecraft is climbing toward apoapsis, so \\(\\gamma\\) is positive.`}</figcaption></figure>`;
  }

  // the six elements: orbit shape in its plane, and the plane against the equator
  function figElements() {
    // (a) in the orbit plane
    const W = 320, H = 232, a = 125, e = 0.5, b = a * Math.sqrt(1 - e * e), cc = [160, 117], F = [cc[0] + a * e, cc[1]];
    const p = a * (1 - e * e), nu = 60 * rad, r = p / (1 + e * Math.cos(nu)), S = [F[0] + r * Math.cos(nu), F[1] - r * Math.sin(nu)];
    const arc = [F[0] + 32, F[1]], arc2 = [F[0] + 32 * Math.cos(nu), F[1] - 32 * Math.sin(nu)];
        const inPlane = `<figure class="fig sub" role="img" aria-label="${T`The shape of an orbit in its own plane: an ellipse with the planet at one focus, the periapsis and apoapsis at the two ends of the long axis, the semi-major axis a, and the true anomaly ν measured at the planet from periapsis to the spacecraft.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <ellipse class="f-tr" cx="${cc[0]}" cy="${cc[1]}" rx="${a}" ry="${fx(b)}"/>
        <path class="f-mu f-dash" d="M${cc[0] - a - 10},${cc[1]}H${cc[0] + a + 12}"/>
        <path class="f-mu" d="M${fx(F[0])},${fx(F[1])}L${fx(S[0])},${fx(S[1])}"/>
        <path class="f-ac-ln" d="M${cc[0]},${cc[1]}H${cc[0] + a}"/>
        <path class="f-ink-ln" d="M${fx(arc[0])},${fx(arc[1])}A32,32 0 0 0 ${fx(arc2[0])},${fx(arc2[1])}"/>
        <circle class="f-earth" cx="${fx(F[0])}" cy="${F[1]}" r="14"/>
        <circle class="f-ink-fill" cx="${cc[0]}" cy="${cc[1]}" r="2.5"/>
        <circle class="f-ink-fill" cx="${cc[0] + a}" cy="${cc[1]}" r="3.5"/><circle class="f-ink-fill" cx="${cc[0] - a}" cy="${cc[1]}" r="3.5"/>
        <circle class="f-ac-fill" cx="${fx(S[0])}" cy="${fx(S[1])}" r="5"/>
      </svg>${lbs([
        [cc[0] + a + 8, cc[1] + 16, T`periapsis`, 'ink r'], [cc[0] - a + 16, cc[1] + 16, T`apoapsis`, 'ink'],
        [cc[0] + 0.3 * a, cc[1] - 12, 'a', 'acc'], [F[0] + 4, F[1] + 30, T`planet (focus)`, 'm'],
        [cc[0], cc[1] + 14, T`centre`, 'm'], [F[0] + 50 * Math.cos(nu / 2), F[1] - 50 * Math.sin(nu / 2), 'ν', 'ink'], [S[0] - 8, S[1] - 10, T`spacecraft`, 'ink r'],
      ], W, H)}</div>
      <figcaption>${T`In the orbit plane: size \\(a\\), shape \\(e\\), and the spacecraft’s place \\(\\nu\\).`}</figcaption></figure>`;

    // (b) plane against the equator, orthographic view from above-front
    const W2 = 340, H2 = 300, O = [170, 150], R = 125, az = 0, el = 30 * rad, Om = 35 * rad, inc = 50 * rad, om = 60 * rad, ee = 0.3, aa = 100, pp = aa * (1 - ee * ee);
    const proj = (q) => { const x1 = q[0] * Math.cos(az) - q[1] * Math.sin(az), y1 = q[0] * Math.sin(az) + q[1] * Math.cos(az); return [O[0] + x1, O[1] - (q[2] * Math.cos(el) + y1 * Math.sin(el))]; };
    const n = [Math.cos(Om), Math.sin(Om), 0], qv = [-Math.sin(Om), Math.cos(Om), 0], m = [Math.cos(inc) * qv[0], Math.cos(inc) * qv[1], Math.sin(inc)];
    const P = [Math.cos(om) * n[0] + Math.sin(om) * m[0], Math.cos(om) * n[1] + Math.sin(om) * m[1], Math.sin(om) * m[2]];
    const Q = [-Math.sin(om) * n[0] + Math.cos(om) * m[0], -Math.sin(om) * n[1] + Math.cos(om) * m[1], Math.cos(om) * m[2]];
    const orb3 = (v) => { const rr = pp / (1 + ee * Math.cos(v)); return [0, 1, 2].map((k) => rr * (Math.cos(v) * P[k] + Math.sin(v) * Q[k])); };
    const up = [], dn = [];
    for (let i = 0; i <= 240; i++) { const q = orb3(2 * Math.PI * i / 240); (q[2] >= 0 ? up : dn).push({ i, pt: proj(q) }); }
    const run = (arr) => { let d = '', last = -9; for (const o of arr) { d += (o.i - last > 1 ? 'M' : 'L') + fx(o.pt[0]) + ',' + fx(o.pt[1]); last = o.i; } return d; };
    const ring = []; for (let i = 0; i <= 90; i++) ring.push(proj([R * Math.cos(2 * Math.PI * i / 90), R * Math.sin(2 * Math.PI * i / 90), 0]));
    const orbFill = []; for (let i = 0; i <= 90; i++) orbFill.push(proj(orb3(2 * Math.PI * i / 90)));
    const sc = (v, k) => v.map((x) => x * k), pl = (u, v) => [u[0] + v[0], u[1] + v[1], u[2] + v[2]];
    const node = orb3(-om), N3 = node, arcPts = (f, from, to, k = 30) => { const o = []; for (let i = 0; i <= k; i++) o.push(proj(f(from + (to - from) * i / k))); return o; };
    const arcOm = arcPts((t) => sc([Math.cos(t), Math.sin(t), 0], 50), 0, Om);
    const arcI = arcPts((t) => pl(N3, sc([qv[0] * Math.cos(t), qv[1] * Math.cos(t), Math.sin(t)], 34)), 0, inc);
    const arcW = arcPts((t) => sc([Math.cos(t) * n[0] + Math.sin(t) * m[0], Math.cos(t) * n[1] + Math.sin(t) * m[1], Math.sin(t) * m[2]], 44), 0, om);
    const nodeS = proj(N3), periS = proj(orb3(0)), nEnd = proj(sc(n, R)), nEnd2 = proj(sc(n, -R)), xEnd = proj([R, 0, 0]), zEnd = proj([0, 0, 112]);
    let botS = [0, 0]; for (const o of orbFill) if (o[1] > botS[1]) botS = o;
    const mid = (arr) => arr[Math.floor(arr.length / 2)];
    const tilt = `<figure class="fig sub" role="img" aria-label="${T`The orbit plane against the equator: the line of nodes where they cross, the ascending node, the inclination i between the planes, the angle Ω from the reference direction to the ascending node along the equator, and the angle ω from the ascending node to periapsis along the orbit.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W2} ${H2}" aria-hidden="true">
        <path class="f-eq" d="${poly(ring, true)}"/>
        <path class="f-pl" d="${poly(orbFill, true)}"/>
        <path class="f-mu f-dash" d="M${fx(nEnd2[0])},${fx(nEnd2[1])}L${fx(nEnd[0])},${fx(nEnd[1])}"/>
        <path class="f-tr thin f-dash" d="${run(dn)}"/><path class="f-tr" d="${run(up)}"/>
        <path class="f-ink-ln" d="M${O[0]},${O[1]}L${fx(xEnd[0])},${fx(xEnd[1])}"/><path class="f-ink-fill" d="${poly([[xEnd[0] - 9, xEnd[1] - 4], xEnd, [xEnd[0] - 8, xEnd[1] + 5]], true)}"/>
        <path class="f-mu" d="M${O[0]},${O[1]}L${fx(zEnd[0])},${fx(zEnd[1])}"/><path class="f-mu-fill" d="${poly([[zEnd[0] - 4, zEnd[1] + 9], zEnd, [zEnd[0] + 4, zEnd[1] + 9]], true)}"/>
        <path class="f-ink-ln" d="${poly(arcOm)}"/><path class="f-ink-ln" d="${poly(arcI)}"/><path class="f-ink-ln" d="${poly(arcW)}"/>
        <circle class="f-earth" cx="${O[0]}" cy="${O[1]}" r="13"/>
        <circle class="f-ac-fill" cx="${fx(nodeS[0])}" cy="${fx(nodeS[1])}" r="4.5"/><circle class="f-ink-fill" cx="${fx(periS[0])}" cy="${fx(periS[1])}" r="3.5"/>
      </svg>${lbs([
        [xEnd[0] + 2, xEnd[1] + 16, T`reference direction`, 'm r'], [zEnd[0], zEnd[1] - 12, T`north`, 'm'],
        [nodeS[0] + 46, nodeS[1] - 27, T`ascending node`, 'acc r'], [nEnd2[0], nEnd2[1] + 14, T`line of nodes`, 'm'],
        [mid(arcOm)[0] + 6, mid(arcOm)[1] + 12, 'Ω', 'ink'], [mid(arcI)[0] - 9, mid(arcI)[1] + 4, 'i', 'ink'], [mid(arcW)[0] - 8, mid(arcW)[1] - 8, 'ω', 'ink'],
        [periS[0] + 8, periS[1] - 6, T`periapsis`, 'ink l'], [botS[0], botS[1] + 12, T`orbit plane`, 'tr'], [W2 - 26, O[1] + 36, T`equator`, 'm'],
      ], W2, H2)}</div>
      <figcaption>${T`The plane against the equator: tilt \\(i\\), swivel \\(\\Omega\\), and where periapsis lies, \\(\\omega\\). The dashed part of the orbit is south of the equator.`}</figcaption></figure>`;
    return `<div class="fig-pair">${inPlane}${tilt}</div>`;
  }

  // optional step-by-step derivation, closed by default
  const deriv = (what, body) => `<details class="deriv"><summary><span class="dv-tag">${T`Show the derivation`}</span><span class="dv-what">${what}</span></summary><div class="dv-body">${body}</div></details>`;

  App.css('orbits', `
    .fig { margin: 1.1rem 0; max-width: 36rem; container-type: inline-size; }
    .fig-box { position: relative; }
    .fig .fig-box > svg, .fig .conic > svg { display: block; width: 100%; height: auto; }
    .fig figcaption { font-size: .85rem; color: var(--muted); margin-top: .4rem; line-height: 1.45; }
    .fig .lb { position: absolute; transform: translate(-50%, -50%); font: 500 clamp(.58rem, 3.1cqw, .78rem)/1.1 var(--f-mono); color: var(--ink); white-space: nowrap; pointer-events: none; text-shadow: 0 0 3px var(--bg), 0 0 3px var(--bg), 0 0 5px var(--bg); }
    .fig .lb.r { transform: translate(-100%, -50%); }
    .fig .lb.l { transform: translate(0, -50%); }
    .fig .lb.m { color: var(--muted); } .fig .lb.acc { color: var(--accent); } .fig .lb.tr { color: var(--trace); } .fig .lb.inv { color: #fff; text-shadow: none; }
    .fig .lb abbr { pointer-events: auto; }
    .f-cone { fill: var(--sunk); stroke: var(--muted); stroke-width: 1; }
    .f-cut { fill: none; stroke: var(--accent); stroke-width: 2; }
    .f-tr { fill: none; stroke: var(--trace); stroke-width: 2; } .f-tr.thin { stroke-width: 1.4; }
    .f-earth { fill: var(--earth); }
    .f-mu { fill: none; stroke: var(--muted); stroke-width: 1.2; } .f-mu-fill { fill: var(--muted); }
    .f-dash { stroke-dasharray: 4 4; }
    .f-ink-ln { fill: none; stroke: var(--ink); stroke-width: 1.4; } .f-ink-fill { fill: var(--ink); stroke: none; }
    .f-ac-ln { fill: none; stroke: var(--accent); stroke-width: 2.4; } .f-ac-fill { fill: var(--accent); stroke: none; }
    .f-eq { fill: var(--earth); fill-opacity: .1; stroke: var(--muted); stroke-width: 1.2; }
    .f-pl { fill: var(--trace); fill-opacity: .1; stroke: none; }
    .conic-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr)); gap: .5rem; }
    .conic { display: flex; flex-direction: column; align-items: center; text-align: center; font: .8rem/1.3 var(--f-mono); }
    .conic svg { max-width: 9rem; }
    .conic span { color: var(--muted); }
    .fig-pair { display: flex; flex-direction: column; gap: .4rem; margin: 1.1rem 0; }
    .fig-pair .fig { flex: 1 1 100%; margin: 0; }
    details.deriv { border: 1px dashed var(--line); border-radius: 8px; background: var(--panel); max-width: 52rem; margin: .6rem 0; }
    details.deriv[open] { border-style: solid; }
    details.deriv > summary { cursor: pointer; list-style: none; display: flex; flex-wrap: wrap; align-items: baseline; gap: .2rem .7rem; padding: .55rem .9rem; }
    details.deriv > summary::-webkit-details-marker { display: none; }
    details.deriv > summary::before { content: "+"; font: 700 1rem/1 var(--f-mono); color: var(--accent); width: .8rem; }
    details.deriv[open] > summary::before { content: "−"; }
    .dv-tag { font: 600 .68rem/1 var(--f-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--bg); background: var(--trace2); padding: .3rem .45rem; border-radius: 3px; }
    .dv-what { font-size: .9rem; color: var(--muted); }
    .dv-body { padding: 0 .9rem .8rem; }
    .dv-body ol { list-style: none; counter-reset: dv; padding: 0; margin: .5rem 0 0; display: flex; flex-direction: column; gap: .8rem; }
    .dv-body li { counter-increment: dv; position: relative; padding-left: 2rem; }
    .dv-body li::before { content: counter(dv); position: absolute; left: 0; top: .1rem; width: 1.4rem; height: 1.4rem; border-radius: 50%; background: var(--sunk); color: var(--muted); font: 600 .75rem/1.4rem var(--f-mono); text-align: center; }
    .dv-body li p, .dv-body > p { margin: 0 0 .2rem; }
    table.data.elements { min-width: 36rem; }
    table.data.elements th, table.data.elements td { white-space: normal; text-align: left; vertical-align: top; }
    table.data.elements td:nth-child(2), table.data.elements th:nth-child(2) { white-space: nowrap; text-align: center; }
    table.data.elements td { font-size: .78rem; }
  `);

  App.chapter({
    id: 'orbits', phase: N`Coast`, title: N`Describing Orbits`, lab: N`Orbit designer`,
    blurb: N`Two conserved quantities, energy and angular momentum, fix every orbit. Kepler’s equation tells you where you are on it.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('orbits')} · Coast`,
          title: T`Describing Orbits`,
          lede: T`The two-body equation has an exact solution: the conic sections. Energy fixes the orbit’s size, angular momentum its shape, and Kepler’s equation gives the position at any time.`,
          refs: [T`Sellers · Understanding Orbits; Describing Orbits`, T`BMW ch. 1 Two-Body Orbital Mechanics`, T`BMW ch. 2 & 4 Elements; Position vs Time`],
        })}
        ${Progress.briefing('orbits', { theory: 'theory', lab: 'od', math: 'refresher', mathLabel: N`Vectors, trigonometry, ellipses and iteration.` })}

        <section class="section" id="theory">
          <h2><span class="idx">2.1</span>${T`Two constants of motion`}</h2>
          <div class="prose">
            <p>${T`A spacecraft that coasts, with its engines off, feels the pull of one planet only. Its motion obeys the <b>two-body equation</b>: the acceleration points to the planet’s centre and gets weaker with the square of the distance.`}</p>
            <div class="eq">\\[ \\ddot{\\vec r} = -\\frac{\\mu}{r^3}\\,\\vec r \\]</div>
            ${Sym.where(['rddot', 'mu', 'vecr', 'r'])}
            <p>${T`Gravity is a <b>conservative central force</b>. <b>Conservative</b> means no energy is lost along the way, to friction or anything else: energy of motion and energy of position trade into each other, and their sum stays constant. <b>Central</b> means the force always points to the planet’s centre, so it never twists the orbit sideways and the angular momentum (the amount of turning around the planet) stays constant too. Two quantities therefore stay fixed along any coasting trajectory, and together they fix the orbit.`}</p>
            <p>${T`<b>Mechanical energy</b> is the sum of two kinds of energy, both measured in joules (J). The <b>kinetic energy</b> \\(\\tfrac12 m v^2\\) is the energy of motion. The <b>potential energy</b> \\(-\\mu m/r\\) is the energy stored in the spacecraft’s position in the planet’s gravity. It is negative because its zero is placed at infinite distance, where gravity no longer holds you. Climbing away from the planet takes energy, so every finite distance sits below zero, and the closer you are, the lower it sits.`}</p>
            <div class="eq">\\[ E = \\tfrac12 m v^2 - \\frac{\\mu m}{r} \\]</div>
            ${Sym.where(['m', 'v', 'mu', 'r'], N`Add the two and you have the mechanical energy. A negative total means the spacecraft is bound to the planet.`)}
            <p>${T`Engineers want a number that does not depend on the spacecraft. Dividing by the mass \\(m\\) gives the energy per kilogram, called the <b>specific</b> energy, in J/kg. The mass cancels: a 5-tonne capsule and a 45-tonne stage at the same distance and speed have the same specific energy, so one number describes the orbit, whatever the vehicle. In this course “specific” always means “per unit of mass”. It comes back in <b>specific impulse</b> (${Progress.code('rockets')}), the thrust impulse per unit weight of propellant, which lets engines of any size be compared.`}</p>
            <div class="eq">\\[ \\varepsilon = \\frac{E}{m} = \\frac{v^2}{2} - \\frac{\\mu}{r} = ${T`\\text{constant}`} \\]</div>
            ${Sym.where(['eps', ['\\tfrac12 v^2', N`kinetic energy per kilogram: the energy of motion`, 'J/kg'], ['-\\mu/r', N`potential energy per kilogram: the energy of position, negative because it is zero at infinite distance`, 'J/kg'], 'v', 'mu', 'r'], N`Like a ball on a slope: going down (smaller r) it gains speed, going up it slows, and the total stays the same.`)}
            <p>${T`Take the dot product of the two-body equation with the velocity \\(\\vec v\\) and you can show that \\(\\varepsilon\\) does not change along the orbit. That is the “conservative” property at work. The derivation is there if you want to follow it; the rest of the module does not depend on it.`}</p>
            ${deriv(T`the specific mechanical energy is constant`, `
              <p>${T`Start from the two-body equation, written with \\(\\dot{\\vec v}\\), the acceleration (the rate of change of the velocity):`}</p>
              <div class="eq">\\[ \\dot{\\vec v} = -\\frac{\\mu}{r^3}\\,\\vec r \\]</div>
              <ol>
                <li><p>${T`Dot both sides with \\(\\vec v\\). The dot product multiplies matching components and adds them.`}</p><div class="eq">\\[ \\vec v\\cdot\\dot{\\vec v} = -\\frac{\\mu}{r^3}\\,\\vec r\\cdot\\vec v \\]</div></li>
                <li><p>${T`Recognise the left side. Since \\(v^2 = \\vec v\\cdot\\vec v\\), the product rule gives \\(\\frac{d}{dt}(v^2) = 2\\,\\vec v\\cdot\\dot{\\vec v}\\), so the left side is the rate of change of \\(v^2/2\\).`}</p><div class="eq">\\[ \\vec v\\cdot\\dot{\\vec v} = \\frac{d}{dt}\\!\\left(\\frac{v^2}{2}\\right) \\]</div></li>
                <li><p>${T`Recognise the right side. In the same way \\(r^2 = \\vec r\\cdot\\vec r\\) gives \\(2r\\dot r = 2\\,\\vec r\\cdot\\vec v\\), so \\(\\vec r\\cdot\\vec v = r\\dot r\\), where \\(\\dot r\\) is how fast the distance changes. The last equality is the rule for the rate of change of \\(1/r\\).`}</p><div class="eq">\\[ -\\frac{\\mu}{r^3}\\,r\\dot r = -\\frac{\\mu\\,\\dot r}{r^2} = \\frac{d}{dt}\\!\\left(\\frac{\\mu}{r}\\right) \\]</div></li>
                <li><p>${T`Equate the two sides and move everything to the left. Both are rates of change, so they combine:`}</p><div class="eq">\\[ \\frac{d}{dt}\\!\\left(\\frac{v^2}{2} - \\frac{\\mu}{r}\\right) = 0 \\]</div></li>
                <li><p>${T`A quantity whose rate of change is zero does not change. That quantity is the specific mechanical energy:`}</p><div class="eq">\\[ \\varepsilon = \\frac{v^2}{2} - \\frac{\\mu}{r} \\]</div></li>
              </ol>`)}
            <p>${T`The second constant is the <b>specific angular momentum</b>, the amount of turning around the planet per kilogram. Cross the two-body equation with \\(\\vec r\\) (the cross product, or vector product) and you can show that it never changes. It is a vector perpendicular to the orbital plane, so the plane never changes either:`}</p>
            <div class="eq">\\[ \\vec h = \\vec r \\times \\vec v, \\qquad h = r\\,v\\cos\\gamma \\]</div>
            ${Sym.where(['vech', 'vecr', 'vecv', 'cross', 'h', 'gamma'])}
            ${deriv(T`the specific angular momentum is constant`, `
              <p>${T`Start from the same equation, \\(\\dot{\\vec v} = -\\mu\\,\\vec r/r^3\\).`}</p>
              <ol>
                <li><p>${T`Cross both sides with \\(\\vec r\\). The cross product of two parallel vectors is zero, and \\(\\vec r\\) is parallel to itself, so the right side vanishes.`}</p><div class="eq">\\[ \\vec r\\times\\dot{\\vec v} = -\\frac{\\mu}{r^3}\\,\\vec r\\times\\vec r = \\vec 0 \\]</div></li>
                <li><p>${T`Recognise the left side. The product rule for the rate of change of \\(\\vec r\\times\\vec v\\) has two terms, and the first one, \\(\\vec v\\times\\vec v\\), is zero.`}</p><div class="eq">\\[ \\frac{d}{dt}(\\vec r\\times\\vec v) = \\vec v\\times\\vec v + \\vec r\\times\\dot{\\vec v} = \\vec r\\times\\dot{\\vec v} \\]</div></li>
                <li><p>${T`Put steps 1 and 2 together: the rate of change of \\(\\vec r\\times\\vec v\\) is zero, so this vector stays the same all along the orbit.`}</p><div class="eq">\\[ \\vec h = \\vec r\\times\\vec v \\]</div></li>
                <li><p>${T`\\(\\vec h\\) is perpendicular to both \\(\\vec r\\) and \\(\\vec v\\). A fixed \\(\\vec h\\) therefore keeps \\(\\vec r\\) and \\(\\vec v\\) in one plane for ever: the orbital plane.`}</p></li>
                <li><p>${T`The length of a cross product is the product of the two lengths and the sine of the angle between them. The angle between \\(\\vec r\\) and \\(\\vec v\\) is 90° − γ, and sin(90° − γ) = cos γ.`}</p><div class="eq">\\[ h = r\\,v\\sin(90^\\circ-\\gamma) = r\\,v\\cos\\gamma \\]</div></li>
              </ol>`)}
            ${Primer.box('vectors', false, 'refresher') + Primer.box('trig')}
            <p>${T`Here \\(\\gamma\\) is the <b>flight-path angle</b>, measured from the local horizontal to the velocity vector. It is zero at <b>periapsis</b> and <b>apoapsis</b>, the lowest and highest points of the orbit, together called the <b>apsides</b>. Around the Earth they are the perigee and apogee; around the Moon the perilune and apolune (Apollo documents say pericynthion and apocynthion, and this course also uses periselene). Flight controllers quote an orbit by its two apsis altitudes: “185 by 185” is a circular orbit 185 km up.`}</p>
          </div>
          ${figGamma()}
        </section>

        <section class="section">
          <h2><span class="idx">2.2</span>${T`The trajectory equation`}</h2>
          <div class="prose">
            <p>${T`Solving the equation of motion once more gives the shape of every possible path, the polar equation of a conic with the central body at one focus:`}</p>
            <div class="eq">\\[ r = \\frac{p}{1 + e\\cos\\nu}, \\qquad p = \\frac{h^2}{\\mu} = a(1-e^2) \\]</div>
            ${Sym.where(['r', 'p', 'e', 'nu', 'h', 'mu', 'a'], N`With ν = 0 (periapsis) you get the smallest r; with ν = 180° (apoapsis) the largest.`)}
            ${deriv(T`the trajectory equation`, `
              <p>${T`Use polar coordinates \\((r,\\nu)\\) in the orbital plane, and the helper \\(u = 1/r\\).`}</p>
              <ol>
                <li><p>${T`Conservation of angular momentum reads \\(h = r^2\\dot\\nu\\): the turning rate times \\(r^2\\). In terms of \\(u\\), the turning rate is \\(\\dot\\nu = h\\,u^2\\).`}</p></li>
                <li><p>${T`Rewrite the rate of change of the distance with the chain rule (a rate in time is a rate in angle times \\(\\dot\\nu\\)), using \\(r = 1/u\\):`}</p><div class="eq">\\[ \\dot r = -\\frac{1}{u^2}\\frac{du}{d\\nu}\\,\\dot\\nu = -h\\,\\frac{du}{d\\nu}, \\qquad \\ddot r = -h^2u^2\\,\\frac{d^2u}{d\\nu^2} \\]</div></li>
                <li><p>${T`In polar coordinates the acceleration along the radius is \\(\\ddot r - r\\dot\\nu^2\\); the second term comes from the turning of the direction. The two-body equation says it equals \\(-\\mu/r^2 = -\\mu u^2\\). Insert steps 1 and 2, noting that \\(r\\dot\\nu^2 = h^2u^3\\):`}</p><div class="eq">\\[ -h^2u^2\\,\\frac{d^2u}{d\\nu^2} - h^2u^3 = -\\mu u^2 \\]</div></li>
                <li><p>${T`Divide by \\(-h^2u^2\\). This is the equation of a mass on a spring, an oscillation around a constant value:`}</p><div class="eq">\\[ \\frac{d^2u}{d\\nu^2} + u = \\frac{\\mu}{h^2} \\]</div></li>
                <li><p>${T`Its solution is that constant plus a cosine. Call the size of the cosine term \\(e\\mu/h^2\\) and measure \\(\\nu\\) from the point where \\(u\\) is largest (periapsis). Going back to \\(r = 1/u\\) gives the trajectory equation, with \\(p = h^2/\\mu\\).`}</p><div class="eq">\\[ u = \\frac{\\mu}{h^2}\\,(1 + e\\cos\\nu) \\]</div></li>
              </ol>`)}
            ${Primer.box('ellipse')}
            <p>${T`The name “conic” comes from the cone. Cut a double cone with a flat plane and the edge of the cut is one of these curves, depending on how the plane is tilted.`}</p>
          </div>
          ${figConics()}
          <div class="prose">
            <p>${T`\\(\\nu\\) is the <b>true anomaly</b>, the angle from periapsis to the spacecraft. The eccentricity \\(e\\) selects the conic, and the energy sign tells you which kind you are on:`}</p>
          </div>
          <div class="scroll-x" style="max-width:52rem"><table class="data elements" style="min-width:40rem">
            <thead><tr><th>${T`Conic`}</th><th>${T`Eccentricity`}</th><th>${T`Energy ε`}</th><th>${T`Semi-major axis`}</th><th>${T`Example`}</th></tr></thead>
            <tbody>
              <tr><td>${T`Circle`}</td><td>e = 0</td><td>< 0</td><td>a = r</td><td>${T`Apollo parking orbit, 185 km: a temporary orbit where the spacecraft waits before its next burn`}</td></tr>
              <tr><td>${T`Ellipse`}</td><td>0 < e < 1</td><td>< 0</td><td>a > 0</td><td>${T`Trans-lunar coast (two-body view)`}</td></tr>
              <tr><td>${T`Parabola`}</td><td>e = 1</td><td>= 0</td><td>a = ∞</td><td>${T`Exactly escape velocity`}</td></tr>
              <tr><td>${T`Hyperbola`}</td><td>e > 1</td><td>> 0</td><td>a < 0</td><td>${T`Path relative to the Moon on arrival`}</td></tr>
            </tbody></table></div>
          <div class="prose">
            <p>${T`Energy depends only on the semi-major axis, \\(\\varepsilon = -\\mu/2a\\). Combine that with the definition of \\(\\varepsilon\\) and you get the most useful equation in astrodynamics, the <b>vis-viva</b> (energy) equation:`}</p>
            ${deriv(T`energy depends only on the semi-major axis`, `
              <p>${T`Look at the two apsides, where \\(r_p\\) and \\(r_a\\) are the distances from the planet’s centre at periapsis and apoapsis. There \\(\\gamma = 0\\), so \\(h = r\\,v\\) at both.`}</p>
              <ol>
                <li><p>${T`The angular momentum is the same at both apsides, so the speeds are linked:`}</p><div class="eq">\\[ r_p v_p = r_a v_a \\quad\\Rightarrow\\quad v_a = v_p\\,\\frac{r_p}{r_a} \\]</div></li>
                <li><p>${T`The energy is also the same at both apsides:`}</p><div class="eq">\\[ \\frac{v_p^2}{2} - \\frac{\\mu}{r_p} = \\frac{v_a^2}{2} - \\frac{\\mu}{r_a} \\]</div></li>
                <li><p>${T`Replace \\(v_a\\) using step 1 and solve for \\(v_p^2\\). The algebra only needs \\(r_a^2 - r_p^2 = (r_a - r_p)(r_a + r_p)\\) and a cancellation of \\(r_a - r_p\\):`}</p><div class="eq">\\[ v_p^2 = \\frac{2\\mu\\,r_a}{r_p\\,(r_a + r_p)} \\]</div></li>
                <li><p>${T`Put this speed into the energy at periapsis and simplify:`}</p><div class="eq">\\[ \\varepsilon = \\frac{\\mu\\,r_a}{r_p(r_a+r_p)} - \\frac{\\mu}{r_p} = \\frac{\\mu\\,(r_a - r_a - r_p)}{r_p(r_a+r_p)} = -\\frac{\\mu}{r_a + r_p} \\]</div></li>
                <li><p>${T`The two apsides are the ends of the long axis of the ellipse, so \\(r_a + r_p = 2a\\):`}</p><div class="eq">\\[ \\varepsilon = -\\frac{\\mu}{2a} \\]</div></li>
              </ol>`)}
            <div class="eq">\\[ v = \\sqrt{\\mu\\left(\\frac{2}{r} - \\frac{1}{a}\\right)} \\]</div>
            ${Sym.where(['v', 'mu', 'r', 'a'], N`Know where you are (r) and which orbit you are on (a), and you know your speed.`)}
            ${deriv(T`the vis-viva equation`, `
              <ol>
                <li><p>${T`Write the same energy in two ways: its definition, and the result above.`}</p><div class="eq">\\[ \\frac{v^2}{2} - \\frac{\\mu}{r} = -\\frac{\\mu}{2a} \\]</div></li>
                <li><p>${T`Move \\(\\mu/r\\) to the right side and multiply by 2:`}</p><div class="eq">\\[ v^2 = \\frac{2\\mu}{r} - \\frac{\\mu}{a} = \\mu\\left(\\frac{2}{r} - \\frac{1}{a}\\right) \\]</div></li>
                <li><p>${T`Take the square root. That is the vis-viva equation.`}</p></li>
              </ol>`)}
            <p>${T`The apsides follow from the geometry: set \\(\\nu = 0\\) and \\(\\nu = 180^\\circ\\) in the trajectory equation to get \\(r_p = a(1-e)\\) and \\(r_a = a(1+e)\\), hence \\(e = (r_a - r_p)/(r_a + r_p)\\).`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">2.3</span>${T`Kepler’s laws, derived`}</h2>
          <div class="prose">
            <p>${T`Kepler found three laws in Tycho Brahe’s observations of Mars (1609–1619). Newton showed that they follow from his own laws:`}</p>
            <ol>
              <li>${T`<b>Orbits are ellipses</b> with the central body at one focus. This is the bound case of the trajectory equation.`}</li>
              <li>${T`<b>Equal areas in equal times.</b> The area swept per unit time is \\(dA/dt = h/2\\), constant because \\(h\\) is conserved. Turn on the sectors in the lab below and watch the spacecraft speed up near periapsis.`}</li>
              <li>${T`<b>Period</b> depends only on the semi-major axis: \\(T = 2\\pi\\sqrt{a^3/\\mu}\\).`}</li>
            </ol>
            ${deriv(T`the second and third laws`, `
              <ol>
                <li><p>${T`In a short time \\(dt\\) the radius vector sweeps a thin triangle with sides \\(\\vec r\\) and \\(\\vec v\\,dt\\). The area of a triangle is half the length of the cross product of its two sides.`}</p><div class="eq">\\[ dA = \\tfrac12\\,\\lvert\\vec r\\times\\vec v\\rvert\\,dt = \\tfrac12\\,h\\,dt \\]</div></li>
                <li><p>${T`So the area per second is \\(dA/dt = h/2\\), and \\(h\\) is constant: equal areas in equal times.`}</p></li>
                <li><p>${T`In one full period the radius vector sweeps the whole ellipse, whose area is \\(\\pi a b\\), with \\(b = a\\sqrt{1-e^2}\\). From \\(p = h^2/\\mu\\) we get \\(h = \\sqrt{\\mu a(1-e^2)}\\). The period is the area divided by the area per second:`}</p><div class="eq">\\[ T = \\frac{\\pi a b}{h/2} = \\frac{2\\pi a^2\\sqrt{1-e^2}}{\\sqrt{\\mu a(1-e^2)}} = 2\\pi\\sqrt{\\frac{a^3}{\\mu}} \\]</div></li>
              </ol>`)}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">2.4</span>${T`Lab: design an orbit from a burnout state`}</h2>
          <div class="prose"><p>${T`A launch vehicle hands its payload over at <b>burnout</b>: an altitude, a speed and a flight-path angle. From those three numbers the energy and angular momentum, and therefore the whole orbit, are fixed. Change them and the orbit redraws; the satellite moves according to Kepler’s equation.`}</p>
            <p>${T`The dot on the Earth is a ground site. The Earth turns once in a sidereal day (23 h 56 min), at the same simulated time as the spacecraft. Load the geostationary preset: the orbit takes exactly one sidereal day, and the spacecraft stays above the dot.`}</p></div>
          <div class="lab" id="od">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Orbit designer`}</h3><span class="spacer"></span>
              <div class="btn-row">
                <button class="btn" data-p="leo">${T`Parking orbit`}</button>
                <button class="btn" data-p="geo">${T`Geostationary`}</button>
                <button class="btn" data-p="gto">GTO</button>
                <button class="btn" data-p="molniya">${T`Molniya-like`}</button>
                <button class="btn" data-p="tli">${T`After TLI`}</button>
                <button class="btn" data-p="hyp">${T`Hyperbolic`}</button>
              </div></div>
            <div class="stage" style="min-height:480px"><canvas id="od-cv" aria-label="${T`Orbit drawing with Earth at the focus`}"></canvas><div class="overlay" id="od-ov"></div><div class="badge" id="od-badge"></div></div>
            <div class="controls">
              ${UI.slider({ id: 'od-h', label: T`Burnout altitude`, min: 100, max: 40000, step: 1, value: 300, unit: 'km' })}
              ${UI.slider({ id: 'od-v', label: T`Burnout speed`, min: 2.5, max: 13, step: 0.0005, value: 9.2, unit: 'km/s' })}
              ${UI.slider({ id: 'od-phi', label: T`Flight-path angle γ`, min: -60, max: 60, step: 0.5, value: 5, unit: '°' })}
              ${UI.slider({ id: 'od-warp', label: T`Time warp`, min: 1, max: 4, step: 0.05, value: 2.8 })}
              <label class="mono note" style="display:flex;gap:.5rem;align-items:center"><input type="checkbox" id="od-areas" checked> ${T`Equal-area sectors (T/12 each)`}</label>
              <dl class="readout" id="od-ro"></dl>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">2.5</span>${T`Where will it be? Kepler’s equation`}</h2>
          <div class="prose">
            <p>${T`Sooner or later every mission must answer the question “where will the spacecraft be at time \\(t\\)?” The angle \\(\\nu\\) does not grow uniformly with time, so Kepler introduced two auxiliary angles. The <b>eccentric anomaly</b> \\(E\\) is measured at the centre of the ellipse, on an auxiliary circle of radius \\(a\\). The <b>mean anomaly</b> \\(M\\) does grow uniformly, at the mean motion \\(n\\):`}</p>
            <div class="eq">\\[ n = \\sqrt{\\frac{\\mu}{a^3}}, \\qquad M = n\\,(t - t_p) = E - e\\sin E \\]</div>
            ${Sym.where(['n', 'a', 'mu', 'Mm', 't', 'tp', 'E', 'e'])}
            <div class="eq">\\[ \\tan\\frac{\\nu}{2} = \\sqrt{\\frac{1+e}{1-e}}\;\\tan\\frac{E}{2} \\]</div>
            ${Sym.where(['nu', 'E', 'e', 'tan'], N`This converts the helper angle E into the real position angle ν.`)}
            ${Primer.box('iteration')}
            <p>${T`Going from position to time is direct. Going from time to position means solving Kepler’s equation for \\(E\\), which has no closed-form solution. Newton’s iteration \\(E_{k+1} = E_k - (E_k - e\\sin E_k - M)/(1 - e\\cos E_k)\\) converges in a few steps; that is what the lab above runs on every frame. A universal-variable form of the equation also covers parabolas and hyperbolas. The Apollo Guidance Computer used that approach (Battin’s formulation) in its conic routines.`}</p>
          </div>
        </section>

        ${Archive.capsule('trench')}

        <section class="section">
          <h2><span class="idx">2.6</span>${T`Orbital elements in three dimensions`}</h2>
          <div class="prose">
            <p>${T`Two angles fix the orbit plane, one more orients the ellipse within it, two numbers give its size and shape, and a last angle places the spacecraft. These are the six <b>classical orbital elements</b>:`}</p>
          </div>
          <div class="scroll-x" style="max-width:52rem"><table class="data elements">
            <thead><tr><th>${T`Element`}</th><th>${T`Symbol`}</th><th>${T`Describes`}</th><th>${T`Apollo 11 parking orbit`}</th></tr></thead>
            <tbody>
              <tr><td>${T`Semi-major axis`}</td><td>a</td><td>${T`size (energy)`}</td><td>≈ 6 563 km</td></tr>
              <tr><td>${T`Eccentricity`}</td><td>e</td><td>${T`shape`}</td><td>${UI.dec('≈ 0.0006')}</td></tr>
              <tr><td>${T`Inclination`}</td><td>i</td><td>${T`tilt of the plane relative to the equator`}</td><td>${UI.dec('32.5°')}</td></tr>
              <tr><td>${T`Right ascension of ascending node`}</td><td>Ω</td><td>${T`swivel of the plane (RAAN)`}</td><td>${T`set by launch time and azimuth`}</td></tr>
              <tr><td>${T`Argument of periapsis`}</td><td>ω</td><td>${T`where periapsis lies in the plane`}</td><td>${T`poorly defined for e ≈ 0`}</td></tr>
              <tr><td>${T`True anomaly`}</td><td>ν</td><td>${T`spacecraft position`}</td><td>${T`changes continuously`}</td></tr>
            </tbody></table></div>
          <div class="prose">
            <p>${T`The drawings show where each element sits. The <b>ascending node</b> is the point where the orbit crosses the equator going north. \\(\\Omega\\) is the angle, measured around the polar axis, from a fixed direction in the stars to the ascending node (the “right ascension” of the node, abbreviated RAAN). \\(\\omega\\), the argument of periapsis, is the angle in the orbit plane from the ascending node to periapsis.`}</p>
            <p>${T`For Apollo 11, \\(\\Omega\\) was set by the launch time, because the Earth turns beneath an orbit plane that stays fixed in space, and by the launch azimuth, the compass heading of the launch.`}</p>
          </div>
          ${figElements()}
          <div class="callout history"><b>${T`Canonical units`}</b>${T`Orbit calculations are often done in canonical units: 1 DU = Earth radius (6 378.145 km), 1 TU = 806.8 s, which makes μ = 1. The numbers stay near unity and the algebra stays clean. This manual stays in SI, and the conversion is direct: 1 DU/TU = 7.905 km/s, the circular speed at Earth’s surface.`}</div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('orbits', { math: 'ellipse', mathLabel: N`Ellipses, trigonometry, iteration.` })}`;

      mountDesigner(page.querySelector('#od'));
      Practice.embed(page.querySelector('#practice-slot'), 'orbits', 3);
    },
  });

  function solveHyperbolic(M, e) {
    let F = Math.asinh(M / e);
    for (let i = 0; i < 50; i++) {
      const d = (e * Math.sinh(F) - F - M) / (e * Math.cosh(F) - 1);
      F -= d; if (Math.abs(d) < 1e-12) break;
    }
    return F;
  }

  function mountDesigner(root) {
    let el = null, tSince = 0, warp = 600, showAreas = true;
    let clk = 0, thE0 = 0;   // simulation clock since the last change (same time step as tSince) and the ground site's starting angle
    const presets = {
      leo: { 'od-h': 185, 'od-v': 7.793, 'od-phi': 0 },
      geo: { 'od-h': 35786, 'od-v': 3.0747, 'od-phi': 0 },
      gto: { 'od-h': 250, 'od-v': 10.15, 'od-phi': 0 },
      molniya: { 'od-h': 600, 'od-v': 10.0, 'od-phi': 0 },
      tli: { 'od-h': 330, 'od-v': 10.84, 'od-phi': 6 },
      hyp: { 'od-h': 300, 'od-v': 12.2, 'od-phi': 0 },
    };
    const view = UI.canvas(root.querySelector('#od-cv'), null);

    const fmts = { 'od-h': (x) => UI.fmt(x, 0), 'od-v': (x) => x.toFixed(3), 'od-phi': (x) => x.toFixed(1), 'od-warp': (x) => '×' + UI.fmt(Math.pow(10, x), 0) };
    const ctl = UI.bindControls(root, fmts, (v, src) => {
      warp = Math.pow(10, v['od-warp']);
      showAreas = v['od-areas'];
      if (src === 'od-warp' || src === 'od-areas') return;
      const r = C.RE + v['od-h'] * 1000;
      el = Phys.elementsFromRV(r, v['od-v'] * 1000, v['od-phi'] * Math.PI / 180, C.muE);
      el.r0 = r;
      clk = 0; thE0 = el.nu;      // the ground site starts right under the spacecraft
      // time since periapsis at burnout
      if (el.e < 1) tSince = Phys.timeSincePeriapsis(el.nu, el.e, el.a, C.muE);
      else {
        const F = 2 * Math.atanh(Math.sqrt((el.e - 1) / (el.e + 1)) * Math.tan(el.nu / 2));
        tSince = (el.e * Math.sinh(F) - F) / Math.sqrt(C.muE / Math.pow(-el.a, 3));
      }
      const b = root.querySelector('#od-badge');
      const kind = el.e < 0.001 ? T`Circle` : el.e < 1 ? T`Ellipse` : el.e < 1.001 ? T`Parabola` : T`Hyperbola`;
      b.textContent = el.rp < C.RE ? T`${kind} · hits Earth` : kind;
      if (src && el.rp - C.RE > 100e3) {          // designed by hand with the sliders
        if (el.e < 0.01) Progress.done('orbits', 'circle');
        if (el.e < 1 && el.ra - C.RE >= 35786e3) Progress.done('orbits', 'high');
      }
      b.className = 'badge ' + (el.rp < C.RE ? 'bad' : el.e >= 1 ? 'warn' : 'good');
    });
    root.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const p = presets[b.dataset.p];
      for (const k in p) ctl.set(k, p[k]);
      ctl.update();
    }));

    // state on the conic at time t since periapsis
    function stateAt(t) {
      const { e, a } = el;
      let nu, E = null;
      if (e < 1) {
        const n = Math.sqrt(C.muE / (a * a * a));
        E = Phys.solveKepler(n * t, e);
        nu = Phys.trueFromEcc(E, e);
      } else {
        const n = Math.sqrt(C.muE / Math.pow(-a, 3));
        const F = solveHyperbolic(n * t, e);
        nu = 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(F / 2));
      }
      const r = el.p / (1 + e * Math.cos(nu));
      const v = Math.sqrt(C.muE * (2 / r - (isFinite(a) ? 1 / a : 0)));
      const phi = Math.atan2(e * Math.sin(nu), 1 + e * Math.cos(nu));
      return { nu, E, r, v, phi };
    }

    view.draw = (ctx, w, h) => {
      if (!el) return;
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, K);
      const { e, p, a } = el;
      const st = stateAt(tSince);
      const hyper = e >= 1;
      // extent: ellipse fits; hyperbola shows ~4 burnout radii
      let xmin, xmax, ymax;
      if (!hyper) { xmin = -el.ra; xmax = el.rp; ymax = a * Math.sqrt(1 - e * e); }
      else { const R = Math.max(el.r0 * 4, el.rp * 6); xmin = -R; xmax = el.rp * 1.2; ymax = R * 0.8; }
      const sx = (w - 60) / (xmax - xmin), sy = (h - 60) / (2 * ymax), s = Math.min(sx, sy, (Math.min(w, h) - 40) / (2 * C.RE * 1.4));
      const cx = w / 2 - ((xmax + xmin) / 2) * s, cy = h / 2;
      const P = (r, nu) => [cx + r * Math.cos(nu) * s, cy - r * Math.sin(nu) * s];
      // equal-area sectors
      if (showAreas && !hyper && el.rp > C.RE) {
        const N = 12;
        for (let k = 0; k < N; k++) {
          const t0 = el.T * k / N, t1 = el.T * (k + 1) / N;
          ctx.beginPath(); ctx.moveTo(cx, cy);
          for (let j = 0; j <= 24; j++) { const st = stateAt(t0 + (t1 - t0) * j / 24); const [x, y] = P(st.r, st.nu); ctx.lineTo(x, y); }
          ctx.closePath();
          ctx.fillStyle = k % 2 ? K.trace : K.accent; ctx.globalAlpha = 0.09; ctx.fill(); ctx.globalAlpha = 1;
        }
      }
      // conic
      ctx.strokeStyle = K.trace; ctx.lineWidth = 2; ctx.beginPath();
      const lim = hyper ? Math.acos(-1 / e) - 0.02 : Math.PI;
      let first = true;
      for (let i = 0; i <= 720; i++) {
        const nu = -lim + 2 * lim * i / 720, r = p / (1 + e * Math.cos(nu));
        if (r * s > 4 * Math.max(w, h)) { first = true; continue; }
        const [x, y] = P(r, nu); first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false;
      }
      ctx.stroke();
      // apse line, centre and empty focus
      ctx.strokeStyle = K.line; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); const [px, py] = P(el.rp, 0); ctx.moveTo(px, py);
      if (!hyper) { const [ax, ay] = P(el.ra, Math.PI); ctx.lineTo(ax, ay); } else ctx.lineTo(cx - (xmax - xmin) * s, cy);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.font = `10px ${K.mono}`; ctx.fillStyle = K.muted; ctx.textAlign = 'center';
      if (!hyper && e > 0.02) {
        const c = a * e, [fx, fy] = P(2 * c, Math.PI), [ccx, ccy] = P(c, Math.PI);
        ctx.strokeStyle = K.muted; ctx.beginPath(); ctx.arc(fx, fy, 3, 0, 7); ctx.stroke();
        ctx.fillText(T`empty focus`, fx, fy - 8);
        ctx.fillRect(ccx - 1.5, ccy - 1.5, 3, 3); ctx.fillText(T`centre`, ccx, ccy + 14);
        const [ax, ay] = P(el.ra, Math.PI); ctx.fillText(T`apogee`, ax, ay - 8);
      }
      ctx.fillText(T`perigee`, px, py - 8);
      UI.drawEarth(ctx, cx, cy, C.RE * s, K);
      // the Earth turns at its real sidereal rate, in the same simulated time as the spacecraft
      const RR = C.RE * s, th = thE0 + 2 * Math.PI * clk / SIDEREAL_DAY;
      ctx.strokeStyle = K.ink; ctx.globalAlpha = 0.25; ctx.lineWidth = 1;
      for (let k = 1; k < 8; k++) { const ak = th + k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(cx + RR * 0.8 * Math.cos(ak), cy - RR * 0.8 * Math.sin(ak)); ctx.lineTo(cx + RR * Math.cos(ak), cy - RR * Math.sin(ak)); ctx.stroke(); }
      ctx.globalAlpha = 1;
      const gx = cx + RR * Math.cos(th), gy = cy - RR * Math.sin(th), ext = Math.max(st.r * s, RR * 1.2);
      ctx.setLineDash([2, 4]); ctx.strokeStyle = K.ink; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + ext * Math.cos(th), cy - ext * Math.sin(th)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = K.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(gx, gy, 4.5, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = K.ink; ctx.textAlign = 'left'; ctx.font = `10px ${K.mono}`;
      ctx.fillText(T`ground site`, cx + (RR + 8) * Math.cos(th) - (Math.cos(th) < 0 ? 58 : 0), cy - (RR + 8) * Math.sin(th) + 3);
      // burnout point
      const [bx, by] = P(el.r0, el.nu);
      ctx.strokeStyle = K.ink; ctx.beginPath(); ctx.arc(bx, by, 4, 0, 7); ctx.stroke();
      ctx.fillStyle = K.muted; ctx.textAlign = 'left'; ctx.fillText(T`burnout`, bx + 7, by + 3);
      // spacecraft
      const [x, y] = P(st.r, st.nu);
      ctx.strokeStyle = K.muted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
      // velocity vector: direction = nu + 90° − phi
      const dir = st.nu + Math.PI / 2 - st.phi, L = 18 + st.v / 400;
      UI.arrow(ctx, x, y, x + L * Math.cos(dir), y - L * Math.sin(dir), K.accent, 2);
      ctx.fillStyle = K.accent; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill();
      // readout
      const km = (m) => UI.fmt(m / 1000, 0);
      root.querySelector('#od-ro').innerHTML = `
        <dt>${T`Energy ε`}</dt><dd>${UI.fmt(el.eps / 1e6, 3)} MJ/kg</dd>
        <dt>${T`Ang. momentum h`}</dt><dd>${UI.fmt(el.h / 1e6, 2)} km²/s</dd>
        <dt>${T`Semi-major axis a`}</dt><dd>${isFinite(a) ? km(a) + ' km' : '∞'}</dd>
        <dt>${T`Eccentricity e`}</dt><dd class="hl">${UI.fmt(e, 4)}</dd>
        <dt>${T`Perigee altitude`}</dt><dd>${km(el.rp - C.RE)} km</dd>
        <dt>${T`Apogee altitude`}</dt><dd>${hyper ? '∞' : km(el.ra - C.RE) + ' km'}</dd>
        <dt>${T`Period T`}</dt><dd>${hyper ? '—' : UI.fmtTime(el.T)}</dd>
        <dt class="sub">${T`Now`}</dt>
        <dt>${T`Time since perigee`}</dt><dd>${UI.fmtTime(tSince)}</dd>
        <dt>${T`Time elapsed`}</dt><dd>${UI.fmtTime(clk)}</dd>
        <dt>${T`True anomaly ν`}</dt><dd>${UI.fmt(((st.nu * 180 / Math.PI) + 360) % 360, 1)}°</dd>
        ${st.E != null ? `<dt>${T`Eccentric anomaly E`}</dt><dd>${UI.fmt(((st.E * 180 / Math.PI) % 360 + 360) % 360, 1)}°</dd>` : ''}
        <dt>${T`Radius r`}</dt><dd>${km(st.r)} km</dd>
        <dt>${T`Speed v (vis-viva)`}</dt><dd class="hl">${UI.fmt(st.v / 1000, 3)} km/s</dd>
        <dt>${T`Flight-path angle γ`}</dt><dd>${UI.fmt(st.phi * 180 / Math.PI, 1)}°</dd>
        <dt>${T`Ahead of ground site`}</dt><dd>${UI.fmt(((st.nu - th) * 180 / Math.PI + 540) % 360 - 180, 1)}°</dd>`;
      root.querySelector('#od-ov').innerHTML = `${T`orange arrow: velocity`}<br>${showAreas && !hyper ? T`each shaded sector takes T/12` : ''}<br>${T`dot on the Earth: ground site`}`;
    };

    let acc = 0;
    UI.loop((dt) => {
      if (!el) return;
      tSince += dt * warp; clk += dt * warp;
      if (el.e < 1) tSince %= el.T;
      else if (stateAt(tSince).r > 8 * el.r0) tSince = -tSince;   // replay the flyby from the inbound leg
      acc += dt;
      if (acc > 1 / 30) { view.redraw(); acc = 0; }
    });
    ctl.update();
  }
})();
