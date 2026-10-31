/* Chapter: Where Are We? Orbit determination from the raw readings a crew has (altitude, speed, vertical speed, time).
   Lab: a telemetry desk. Physics lives in navigation.phys.js (Phys_navigation). */
(function () {
  'use strict';
  const { C } = Phys;
  const Pn = window.Phys_navigation;
  const mu = C.muE, RE = C.RE;
  const R = String.raw;
  const f = UI.fmt;
  const rnd = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const deg = 180 / Math.PI;

  /* ---------- figures (inline SVG themed by the .fig/.f-* styles of js/ch/orbits.js; labels are HTML so the Greek tooltips work) ---------- */
  const fx = (n) => n.toFixed(1);
  const pct = (x, w) => (100 * x / w).toFixed(2) + '%';
  const lbs = (list, W, H) => list.map(([x, y, t, c]) => `<span class="lb ${c || ''}" style="left:${pct(x, W)};top:${pct(y, H)}">${t}</span>`).join('');
  const poly = (pts, close) => pts.map((q, i) => (i ? 'L' : 'M') + fx(q[0]) + ',' + fx(q[1])).join('') + (close ? 'Z' : '');
  const seg = (a, b, cls) => `<path class="${cls}" d="M${fx(a[0])},${fx(a[1])}L${fx(b[0])},${fx(b[1])}"/>`;
  const head = (tip, from, cls) => { const d = [tip[0] - from[0], tip[1] - from[1]], l = Math.hypot(d[0], d[1]), u = [d[0] / l, d[1] / l];
    return `<path class="${cls}" d="${poly([[tip[0] - 9 * u[0] - 4 * u[1], tip[1] - 9 * u[1] + 4 * u[0]], tip, [tip[0] - 9 * u[0] + 4 * u[1], tip[1] - 9 * u[1] - 4 * u[0]]], true)}"/>`; };
  const arc = (c, r, a0, a1, k = 24) => { const o = []; for (let i = 0; i <= k; i++) { const t = a0 + (a1 - a0) * i / k; o.push([c[0] + r * Math.cos(t), c[1] - r * Math.sin(t)]); } return o; };
  const at = (c, r, t) => [c[0] + r * Math.cos(t), c[1] - r * Math.sin(t)];

  App.css('navigation', `
    .f-tr-fill { fill: var(--trace); stroke: none; }
    .f-good-ln { fill: none; stroke: var(--good); stroke-width: 1.8; }
    .f-good-hollow { fill: var(--panel); stroke: var(--good); stroke-width: 2; }
    .fig .lb.good { color: var(--good); }`);

  // 3.2: the velocity split into its vertical part (the climb rate) and its horizontal part
  function figComponents() {
    const W = 340, H = 230, g = 27 / deg, S = [130, 132], L = 150, C0 = [130, 610];
    const tip = [S[0] + L * Math.cos(g), S[1] - L * Math.sin(g)], hTip = [tip[0], S[1]], vTip = [S[0], tip[1]];
    return `<figure class="fig" role="img" aria-label="${T`The velocity of the spacecraft split into two parts: a horizontal part along the local horizontal and a vertical part, the climb rate, along the local vertical. The flight-path angle γ is the angle between the velocity and the local horizontal.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <path class="f-earth" d="${poly([...Array(41)].map((_, i) => { const x = W * i / 40; return [x, C0[1] - Math.sqrt(420 * 420 - (x - C0[0]) ** 2)]; }).concat([[W, H], [0, H]]), true)}"/>
        ${seg([S[0], 12], [S[0], 190], 'f-mu f-dash')}${seg([18, S[1]], [322, S[1]], 'f-mu f-dash')}
        ${seg(vTip, tip, 'f-mu f-dash')}${seg(hTip, tip, 'f-mu f-dash')}
        ${seg(S, [hTip[0] - 2, hTip[1]], 'f-tr')}${head(hTip, S, 'f-tr-fill')}
        ${seg(S, [vTip[0], vTip[1] + 2], 'f-tr')}${head(vTip, S, 'f-tr-fill')}
        ${seg(S, tip, 'f-ac-ln')}${head(tip, S, 'f-ac-fill')}
        <path class="f-ink-ln" d="${poly(arc(S, 46, 0, g))}"/>
        <circle class="f-ink-fill" cx="${S[0]}" cy="${S[1]}" r="4.5"/>
      </svg>${lbs([
        [S[0] + 6, 16, T`local vertical`, 'm l'], [20, S[1] - 10, T`local horizontal`, 'm l'],
        [tip[0] + 8, tip[1] - 2, 'v', 'acc l'], [(S[0] + hTip[0]) / 2 + 10, S[1] + 14, 'v<sub>h</sub> = v cos γ', 'tr'],
        [S[0] - 8, (S[1] + vTip[1]) / 2, 'ḣ = v sin γ', 'tr r'], [S[0] + 56, S[1] - 12, 'γ', 'ink'],
        [S[0] - 8, S[1] + 14, T`spacecraft`, 'ink r'], [S[0] + 8, 182, T`r: to the Earth’s centre`, 'm l'], [60, 218, T`Earth`, 'inv'],
      ], W, H)}</div>
      <figcaption>${T`The climb rate ḣ is the vertical part of the velocity. With the speed v it fixes the flight-path angle γ, and the horizontal part follows.`}</figcaption></figure>`;
  }

  // 3.3: semi-major axis, semi-latus rectum, radius and true anomaly on one ellipse
  function figShape() {
    const W = 370, H = 250, e = 0.5, a = 120, c = a * e, b = a * Math.sqrt(1 - e * e), p = a * (1 - e * e), C0 = [160, 120], F = [C0[0] + c, C0[1]];
    const nu = 135 / deg, r = p / (1 + e * Math.cos(nu)), S = at(F, r, nu), pEnd = [F[0], F[1] + p];
    return `<figure class="fig" role="img" aria-label="${T`An ellipse with the planet at one focus. The semi-major axis a runs from the centre to the end of the long axis. The semi-latus rectum p runs from the planet to the orbit at right angles to the long axis. The radius r and the true anomaly ν locate the spacecraft.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <ellipse class="f-tr" cx="${C0[0]}" cy="${C0[1]}" rx="${a}" ry="${fx(b)}"/>
        ${seg([C0[0] - a - 12, C0[1]], [C0[0] + a + 12, C0[1]], 'f-mu f-dash')}
        ${seg([C0[0] - a, C0[1] - 9], [C0[0], C0[1] - 9], 'f-ac-ln thin')}${seg([C0[0] - a, C0[1] - 14], [C0[0] - a, C0[1] - 4], 'f-ac-ln thin')}${seg([C0[0], C0[1] - 14], [C0[0], C0[1] - 4], 'f-ac-ln thin')}
        ${seg(F, pEnd, 'f-good-ln')}
        ${seg(F, S, 'f-mu')}
        <path class="f-ink-ln" d="${poly(arc(F, 26, 0, nu))}"/>
        <circle class="f-earth" cx="${F[0]}" cy="${F[1]}" r="11"/>
        <circle class="f-ink-fill" cx="${C0[0]}" cy="${C0[1]}" r="2.5"/>
        <circle class="f-ink-fill" cx="${C0[0] + a}" cy="${C0[1]}" r="3.5"/><circle class="f-ink-fill" cx="${C0[0] - a}" cy="${C0[1]}" r="3.5"/>
        <circle class="f-ac-fill" cx="${fx(S[0])}" cy="${fx(S[1])}" r="5"/>
      </svg>${lbs([
        [C0[0] - a / 2, C0[1] - 20, 'a', 'acc'], [F[0] + 9, F[1] + p / 2, 'p', 'good l'], [(F[0] + S[0]) / 2 - 6, (F[1] + S[1]) / 2 + 8, 'r', 'm r'],
        [F[0] + 4, F[1] - 36, 'ν', 'ink'], [S[0] - 8, S[1] - 10, T`spacecraft`, 'ink r'],
        [C0[0] + a + 8, C0[1], T`periapsis`, 'ink l'], [C0[0] - a + 4, C0[1] + 14, T`apoapsis`, 'ink l'],
        [C0[0], C0[1] + 13, T`centre`, 'm'], [F[0] + 8, F[1] + 16, T`planet (focus)`, 'm l'],
      ], W, H)}</div>
      <figcaption>${T`a is half the long axis. p is the distance from the planet to the orbit, measured at right angles to the long axis (at ν = 90°). r and ν place the spacecraft. For a circle, p = a = r.`}</figcaption></figure>`;
  }

  // 3.4: eccentric and mean anomaly, drawn with the auxiliary circle
  function figAnomalies() {
    const W = 352, H = 264, e = 0.6, a = 110, c = a * e, b = a * Math.sqrt(1 - e * e), C0 = [165, 132], F = [C0[0] + c, C0[1]];
    const E = 100 / deg, M = E - e * Math.sin(E), S = [C0[0] + a * Math.cos(E), C0[1] - b * Math.sin(E)], Q = at(C0, a, E), Mp = at(C0, a, M);
    const nu = Math.atan2(b * Math.sin(E), a * Math.cos(E) - c);
    return `<figure class="fig" role="img" aria-label="${T`An ellipse inside its auxiliary circle of radius a. The spacecraft, pushed straight up onto the circle, gives the eccentric anomaly E, measured at the centre. The mean anomaly M, also at the centre, is the position of a point that goes round the circle at a steady rate. The true anomaly ν is measured at the planet.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <circle class="f-mu f-dash" cx="${C0[0]}" cy="${C0[1]}" r="${a}"/>
        <ellipse class="f-tr" cx="${C0[0]}" cy="${C0[1]}" rx="${a}" ry="${fx(b)}"/>
        ${seg([C0[0] - a - 12, C0[1]], [C0[0] + a + 14, C0[1]], 'f-mu f-dash')}
        ${seg(S, Q, 'f-mu f-dash')}${seg(C0, Q, 'f-ink-ln')}${seg(C0, Mp, 'f-good-ln')}${seg(F, S, 'f-ac-ln thin')}
        <path class="f-ink-ln" d="${poly(arc(C0, 30, 0, E))}"/><path class="f-good-ln" d="${poly(arc(C0, 52, 0, M))}"/><path class="f-ac-ln thin" d="${poly(arc(F, 18, 0, nu))}"/>
        <circle class="f-earth" cx="${fx(F[0])}" cy="${F[1]}" r="9"/>
        <circle class="f-ink-fill" cx="${C0[0]}" cy="${C0[1]}" r="2.5"/><circle class="f-ink-fill" cx="${C0[0] + a}" cy="${C0[1]}" r="3.5"/>
        <circle class="f-ink-fill" cx="${fx(Q[0])}" cy="${fx(Q[1])}" r="3"/>
        <circle class="f-good-hollow" cx="${fx(Mp[0])}" cy="${fx(Mp[1])}" r="4.5"/>
        <circle class="f-ac-fill" cx="${fx(S[0])}" cy="${fx(S[1])}" r="5"/>
      </svg>${lbs([
        [...at(C0, 42, E / 2), 'E', 'ink'], [...at(C0, 64, M / 2), 'M', 'good'], [...at(F, 30, nu / 2), 'ν', 'acc'],
        [S[0] - 9, S[1] + 4, T`spacecraft`, 'ink r'], [Q[0] + 8, Q[1] - 9, T`pushed up onto the circle`, 'm l'],
        [Mp[0] + 9, Mp[1] + 2, T`mean position`, 'good l'], [C0[0] - 6, C0[1] + 13, T`centre`, 'm r'], [F[0] - 4, F[1] + 18, T`planet`, 'm r'],
        [C0[0] + a + 8, C0[1], T`periapsis`, 'ink l'], [4, 256, T`circle of radius a`, 'm l'],
      ], W, H)}</div>
      <figcaption>${T`Draw a circle of radius a around the ellipse. Push the spacecraft straight up onto it: the angle at the centre is the eccentric anomaly E. The mean anomaly M is where a point going round the circle at a steady rate, with the same period, would be. M grows evenly with time; E and ν do not.`}</figcaption></figure>`;
  }

  Progress.register('navigation', {
    name: N`Where Are We?`, topic: 'navigation', glyph: 'tracking',
    briefing: N`Nobody hands you the apoapsis, {name}. You get an altitude, a speed, a climb rate and a clock. In this module you turn those four numbers into an orbit, predict where it leads, and learn how far you can trust the answer.`,
    objectives: [
      { id: 'clean', text: N`Find the periapsis and apoapsis of a parking or transfer orbit from exact readings` },
      { id: 'sub', text: N`Show that the suborbital trajectory dips below the surface (periapsis altitude within tolerance)` },
      { id: 'noisy', text: N`Find the apsides from noisy readings, then compare with the truth` },
      { id: 'tapo', text: N`Predict the time to apoapsis within tolerance` },
      { id: 'qual', text: N`Qualify: answer 2 navigation problems correctly` },
    ],
    debrief: N`You can now read an orbit off four instrument numbers, and you know why a speed error hurts more than a climb-rate error, {name}. Next comes the rocket that gets you up there.`,
  });

  /* ---------------- Practice ---------------- */
  // readings of a true orbit, rounded as a practice problem shows them (km, m/s)
  function rounded(altP, altA, nu) {
    const o = Pn.orbit(altP * 1e3, altA * 1e3, nu), r = Pn.readings(o, 0);
    const read = { alt: Math.round(r.alt / 1e3) * 1e3, v: Math.round(r.v), hdot: Math.round(r.hdot) };
    return { read, sol: Pn.fromReadings(read), o };
  }
  const orbitProblem = () => {
    const altP = rnd(200, 400, 10), altA = rnd(1500, 6000, 100), nu = Math.random() < 0.7 ? 0.4 + Math.random() * 2.2 : 3.7 + Math.random() * 2.1;
    return rounded(altP, altA, nu);
  };
  const readTxt = (rd) => T`altitude <b>${f(rd.alt / 1e3, 0)} km</b>, speed <b>${f(rd.v / 1e3, 3)} km/s</b>, vertical speed <b>${(rd.hdot >= 0 ? '+' : '−') + f(Math.abs(rd.hdot) / 1e3, 3)} km/s</b>`;
  const stepsTex = (rd, s) => R`\[ r = ${f(s.r / 1e3, 0)}\ \mathrm{km},\quad \sin\gamma = \frac{\dot h}{v} = ${f(rd.hdot / rd.v, 5)},\quad v\cos\gamma = ${f(s.vh / 1e3, 4)}\ \mathrm{km/s} \]
    \[ \varepsilon = \frac{v^2}{2} - \frac{\mu}{r} = ${f(s.eps / 1e6, 4)}\ \mathrm{MJ/kg},\quad a = -\frac{\mu}{2\varepsilon} = ${f(s.a / 1e3, 1)}\ \mathrm{km},\quad H = r\,v\cos\gamma = ${f(s.H / 1e9, 5)}\times10^{9}\ \mathrm{m^2/s} \]
    \[ p = \frac{H^2}{\mu} = ${f(s.p / 1e3, 1)}\ \mathrm{km},\quad e = \sqrt{\left(\frac{p}{r}-1\right)^2 + \left(\frac{\dot h H}{\mu}\right)^2} = ${f(s.e, 5)} \]`;

  const registerPractice = () => Practice.register('navigation', N`Navigation`, [
    { title: N`Apoapsis from raw readings`, make() {
      const { read, sol } = orbitProblem();
      return { q: T`A spacecraft reads ${readTxt(read)}. What is the altitude of its apoapsis? (Earth: μ = 398 600 km³/s², R = 6 378 km)`, answer: sol.altA / 1e3, unit: 'km', tol: 0.01,
        hint: T`Energy gives a. Angular momentum H = r v cos γ gives p. Then e from p and a, and r<sub>a</sub> = a(1 + e). Carry seven digits: e is a small difference.`,
        sol: stepsTex(read, sol) + R`\[ r_a = \frac{p}{1-e} = ${f(sol.ra / 1e3, 1)}\ \mathrm{km}\ \Rightarrow\ h_a = r_a - R_\oplus = ${f(sol.altA / 1e3, 0)}\ \mathrm{km} \]` };
    } },
    { title: N`Flight-path angle from two readings`, make() {
      const v = rnd(7200, 8600, 10), g = (1 + Math.random() * 14) / deg, hd = Math.round(v * Math.sin(g));
      const gam = Math.asin(hd / v) * deg;
      return { q: T`The crew reads a speed of <b>${f(v / 1e3, 3)} km/s</b> and a vertical speed of <b>+${f(hd / 1e3, 3)} km/s</b>. What is the flight-path angle γ?`, answer: gam, unit: '°', tol: 0.01,
        hint: T`The vertical speed is the part of the velocity along the local vertical: ḣ = v sin γ.`,
        sol: R`\[ \sin\gamma = \frac{\dot h}{v} = \frac{${f(hd / 1e3, 3)}}{${f(v / 1e3, 3)}} = ${f(hd / v, 5)} \Rightarrow \gamma = ${f(gam, 3)}^\circ \]` };
    } },
    { title: N`Periapsis from readings`, make() {
      const { read, sol } = orbitProblem();
      return { q: T`A spacecraft reads ${readTxt(read)}. What is the altitude of its periapsis?`, answer: sol.altP / 1e3, unit: 'km', tol: 0.02,
        hint: T`Same route as for the apoapsis, but finish with r<sub>p</sub> = p/(1 + e). Check that your two apsides average to a.`,
        sol: stepsTex(read, sol) + R`\[ r_p = \frac{p}{1+e} = ${f(sol.rp / 1e3, 1)}\ \mathrm{km}\ \Rightarrow\ h_p = r_p - R_\oplus = ${f(sol.altP / 1e3, 0)}\ \mathrm{km} \]` };
    } },
    { title: N`A speed error near circular`, make() {
      const alt = pick([185, 300, 400, 550]), dv = rnd(0.5, 3, 0.5), r = (RE + alt) * 1e3, n = Math.sqrt(mu * 1e9 / (r * r * r));
      const ans = 4 * dv / n / 1e3;
      return { q: T`A spacecraft is in a nearly circular orbit at <b>${f(alt, 0)} km</b>. Its speed reading is wrong by <b>${f(dv, 1)} m/s</b>. By about how many kilometres does the computed opposite apsis move? Use Δh ≈ 4 Δv / n.`, answer: ans, unit: 'km', tol: 0.05,
        hint: T`n = √(μ/r³) is the mean motion in rad/s. Use metres per second and metres, then convert.`,
        sol: R`\[ n = \sqrt{\frac{\mu}{r^3}} = ${f(n * 1e3, 4)}\times10^{-3}\ \mathrm{rad/s},\quad \Delta h \approx \frac{4\,\Delta v}{n} = \frac{4\times${f(dv, 1)}}{${f(n * 1e3, 4)}\times10^{-3}} = ${f(ans * 1e3, 0)}\ \mathrm{m} = ${f(ans, 2)}\ \mathrm{km} \]` };
    } },
    { title: N`Time to apoapsis`, make() {
      const altP = rnd(200, 500, 10), altA = rnd(3000, 9000, 100), { read, sol } = rounded(altP, altA, 0.5 + Math.random() * 2);
      const tmin = sol.tToApo / 60;
      return { q: T`A spacecraft reads ${readTxt(read)}. How many minutes until it reaches apoapsis?`, answer: tmin, unit: 'min', tol: 0.02,
        hint: T`Find e and the true anomaly ν (ν from e cos ν = p/r − 1 and e sin ν = ḣH/μ), then E, then M = E − e sin E. The time left is (π − M)/n.`,
        sol: stepsTex(read, sol) + R`\[ \nu = ${f(sol.nu * deg, 2)}^\circ,\quad E = ${f(sol.E * deg, 2)}^\circ,\quad M = E - e\sin E = ${f(sol.M, 4)}\ \mathrm{rad},\quad n = ${f(sol.n * 1e3, 4)}\times10^{-3}\ \mathrm{rad/s} \]
          \[ t_{apo} = \frac{\pi - M}{n} = ${f(sol.tToApo, 0)}\ \mathrm{s} = ${f(tmin, 1)}\ \mathrm{min} \]` };
    } },
  ], [
    { q: N`A spacecraft is in a nearly circular orbit. Why do you still need the vertical speed to find the apsides?`, opts: [N`The altitude and speed alone give the energy, but not where the spacecraft is between periapsis and apoapsis; the vertical speed tells you that`, N`The vertical speed gives the orbital period`, N`Without it the speed reading is not accurate`, N`You do not need it: near circular, both apsides equal the altitude`], a: 0, why: N`Energy fixes a, but the same altitude and speed fit an orbit that is at periapsis, at apoapsis, or anywhere between. A few tens of m/s of vertical speed separate apsides that are tens of kilometres apart.` },
    { q: N`In the Apollo program, where did the spacecraft’s state vector mainly come from?`, opts: [N`Ground tracking by the Manned Space Flight Network, uplinked to the onboard computer`, N`Star sightings by the crew with a sextant, every orbit`, N`A GPS receiver in the command module`, N`The Saturn V’s inertial platform, which kept running after TLI`], a: 0, why: N`Ground stations tracked the spacecraft by radar and Doppler, Mission Control computed the state vector, and it was uplinked. The crew’s optical navigation with a sextant was the independent backup.` },
    { q: N`The vertical speed reads negative, with a speed above circular at that altitude. What do you know?`, opts: [N`The spacecraft is past apoapsis and falling towards periapsis`, N`The spacecraft is climbing`, N`The orbit is circular`, N`The spacecraft is about to escape`], a: 0, why: N`Negative ḣ means the true anomaly is between 180° and 360°: the spacecraft is moving from apoapsis towards periapsis. The sign of ḣ tells you which half of the orbit you are in.` },
  ]);
  registerPractice();

  /* ---------------- Lab scenarios ---------------- */
  const SCEN = {
    park: { label: N`Parking orbit (near circular)`, altP: 190, altA: 260, nu0: 2.0, get0: 9000, prec: 'perfect',
      task: N`A parking orbit, nearly circular. The altitude and the speed look like a circle. Find the real apsides: the vertical speed matters here.` },
    transfer: { label: N`Elliptical transfer orbit`, altP: 200, altA: 8000, nu0: 0.9, get0: 11000, prec: 'perfect',
      task: N`A long ellipse on its way out. Find both apsides, then predict the time to apoapsis.` },
    sub: { label: N`Suborbital trajectory`, altP: -1400, altA: 650, nu0: 3.7, get0: 600, prec: 'perfect',
      task: N`The spacecraft is above the atmosphere but moving slowly. Does the orbit clear the Earth? A negative periapsis altitude means it does not.` },
    noisy: { label: N`Noisy instruments`, altP: 250, altA: 3500, nu0: 0.6, get0: 5400, prec: 'poor', seedAdd: 1,
      task: N`The instruments are poor. Compute the orbit from the numbers on the display, then compare with the truth to see what the noise cost you.` },
  };
  const PRECISION_LABEL = { perfect: N`Exact (display rounding only)`, good: N`Good (±100 m, ±0.3 m/s)`, poor: N`Poor (±500 m, ±2 m/s)` };
  const SNAP_STEP = 1500;                                // seconds between successive readings

  function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const roundRead = (x) => ({ alt: Math.round(x.alt / 100) * 100, v: Math.round(x.v * 10) / 10, hdot: Math.round(x.hdot * 10) / 10 });

  App.chapter({
    id: 'navigation', phase: N`Navigation`, title: N`Where Are We?`, lab: N`Telemetry desk`,
    blurb: N`Four instrument numbers in, an orbit out: apsides, period and time to apoapsis, with an honest error bar.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('navigation')} · Navigation`,
          title: T`Where Are We?`,
          lede: T`A spacecraft has no dial that says “apoapsis”. It has an altitude, a speed, a climb rate and a clock. Everything else is computed. This module shows the computation, the prediction that follows from it, and how instrument errors spread into the answer.`,
          refs: [T`Sellers · Understanding Space`, T`BMW · Fundamentals of Astrodynamics`, T`Apollo Operations Handbook`],
        })}
        ${Progress.briefing('navigation', { theory: 'theory', lab: 'nv', math: 'refresher', mathLabel: N`Sine, cosine and arcsine.` })}

        <section class="section" id="theory">
          <h2><span class="idx">3.1</span>${T`What the crew actually reads`}</h2>
          <div class="prose">
            <p>${T`The previous module described orbits by their elements. A spacecraft does not measure elements. The instruments, read on board or sent to the ground by radio as <b>telemetry</b>, give four things:`}</p>
            <ul>
              <li>${T`<b>altitude</b> <i>h</i> above the surface, from radar or from the navigation computer;`}</li>
              <li>${T`<b>speed</b> <i>v</i>, the length of the velocity vector;`}</li>
              <li>${T`<b>vertical speed</b> <i>ḣ</i>, the rate at which the altitude changes (positive when climbing);`}</li>
              <li>${T`<b>mission time</b>, ground elapsed time (GET), read from the clock.`}</li>
            </ul>
            <p>${T`Apoapsis, periapsis and period are not on that list. They are consequences of the first three numbers, and the clock tells you when. This module computes them. To avoid a clash with the altitude <i>h</i>, specific angular momentum is written <i>H</i> here.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">3.2</span>${T`From readings to a state vector`}</h2>
          <div class="prose">
            <p>${T`Everything happens in the plane of the orbit, so two directions are enough: the <b>local vertical</b>, straight up along the line from the Earth’s centre through the spacecraft, and the <b>local horizontal</b>, at right angles to it in the direction of motion. The distance from the Earth’s centre is the altitude plus the Earth’s radius. The velocity splits into a vertical part, which is the climb rate ḣ, and a horizontal part. Together they give the <b>flight-path angle</b> γ, the angle of the velocity above the local horizontal:`}</p>
            ${figComponents()}
            <div class="eq">\\[ \\begin{gathered} r = R_\\oplus + h, \\qquad \\sin\\gamma = \\frac{\\dot h}{v} \\\\ v_h = v\\cos\\gamma = \\sqrt{v^2 - \\dot h^2} \\end{gathered} \\]</div>
            ${Sym.where(['r', 'RE', ['h', N`altitude above the surface (a reading)`, 'm'], 'v', ['\\dot h', N`vertical speed: climb rate, negative when descending (a reading)`, 'm/s'], ['\\gamma', N`flight-path angle: angle of the velocity above the local horizontal`, N`rad or °`], ['v_h', N`horizontal speed: the part of the velocity along the local horizontal`, 'm/s']], N`The three numbers (r, v, γ) are the state of the spacecraft in the plane. Nothing else is needed.`)}
            ${Primer.box('trig', false, 'refresher')}
            <p>${T`An example used below: <b>h = 200 km, v = 7 900 m/s, ḣ = +50 m/s</b>. Then r = 6 578 km, sin γ = 50/7 900 and γ = 0.363°. The horizontal speed is 7 899.84 m/s.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">3.3</span>${T`From the state to the orbit`}</h2>
          <div class="prose">
            <p>${T`Two conserved quantities fix the orbit. The <b>specific energy</b> gives the size, through the semi-major axis. The <b>specific angular momentum</b> gives the shape, through the semi-latus rectum:`}</p>
            <p>${T`A reminder from module ${Progress.code('orbits')}: the <b>semi-major axis</b> a is half the long axis of the ellipse; the <b>semi-latus rectum</b> p is the distance from the planet to the orbit, measured at right angles to the long axis; the <b>true anomaly</b> ν is the angle at the planet from periapsis to the spacecraft.`}</p>
            ${figShape()}
            <div class="eq">\\[ \\begin{gathered} \\varepsilon = \\frac{v^2}{2} - \\frac{\\mu}{r}, \\qquad a = -\\frac{\\mu}{2\\varepsilon} \\\\ H = r\\,v_h = r\\,v\\cos\\gamma, \\qquad p = \\frac{H^2}{\\mu} \\end{gathered} \\]</div>
            ${Sym.where(['eps', 'mu', 'a', ['H', N`specific angular momentum: radius times horizontal speed (written H because h is the altitude)`, 'm²/s'], 'p'], N`Energy depends on r and v only. Angular momentum uses the horizontal part of the speed, which is where ḣ enters.`)}
            <p>${T`Now the eccentricity. At the spacecraft’s position, the orbit equation r = p/(1 + e cos ν) gives e cos ν = p/r − 1. The vertical speed adds the second component, e sin ν = ḣH/μ. Together:`}</p>
            <div class="eq">\\[ \\begin{gathered} e\\cos\\nu = \\frac{p}{r} - 1, \\qquad e\\sin\\nu = \\frac{\\dot h\\,H}{\\mu} \\\\ e = \\sqrt{(e\\cos\\nu)^2 + (e\\sin\\nu)^2} \\\\ \\nu = \\operatorname{atan2}(e\\sin\\nu,\\ e\\cos\\nu) \\end{gathered} \\]</div>
            ${Sym.where(['e', 'nu', ['\\operatorname{atan2}', N`the arctangent that keeps the quadrant: it returns an angle from 0° to 360° using the signs of both arguments`, '']], N`The sign of ḣ is the sign of sin ν. Climbing (ḣ > 0) puts the spacecraft between periapsis and apoapsis (ν from 0° to 180°); descending puts it on the way back (180° to 360°).`)}
            <p>${T`The rest is the familiar list:`}</p>
            <div class="eq">\\[ \\begin{gathered} r_p = \\frac{p}{1+e}, \\qquad r_a = \\frac{p}{1-e} \\\\ h_p = r_p - R_\\oplus, \\qquad h_a = r_a - R_\\oplus \\\\ T = 2\\pi\\sqrt{\\frac{a^3}{\\mu}} \\end{gathered} \\]</div>
            ${Sym.where(['rp', 'ra', ['h_p,\\ h_a', N`periapsis and apoapsis altitudes (above the surface)`, 'm'], 'T'], N`A negative periapsis altitude means the orbit passes below the surface: the trajectory is suborbital and ends in the ground.`)}
            <p>${T`The example gives ε = −29.390 MJ/kg, a = 6 781.3 km, H = 5.1966 × 10¹⁰ m²/s, p = 6 774.9 km, e = 0.03062, ν = 12.3°. So the orbit is <b>195.5 × 610.8 km</b>, with a period of 92.6 minutes. Near circular orbits need care: e is a small difference of large numbers, so keep seven or eight digits.`}</p>
            ${Primer.box('ellipse')}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">3.4</span>${T`Prediction: time to apoapsis`}</h2>
          <div class="prose">
            <p>${T`Knowing the orbit, the next question is when. Convert the true anomaly into the eccentric anomaly, then into the mean anomaly with Kepler’s equation, because the mean anomaly grows at a steady rate:`}</p>
            <div class="eq">\\[ \\begin{gathered} E = 2\\arctan\\!\\left(\\sqrt{\\frac{1-e}{1+e}}\\,\\tan\\frac{\\nu}{2}\\right) \\\\ M = E - e\\sin E, \\qquad n = \\sqrt{\\frac{\\mu}{a^3}} \\\\ t_{apo} = \\frac{\\pi - M}{n} \\end{gathered} \\]</div>
            ${Sym.where(['E', 'Mm', 'n', ['t_{apo}', N`time until the next apoapsis (M = π there)`, 's']], N`Add 2π to the numerator if M is already beyond π: the next apoapsis is then one orbit later. The time to periapsis is (2π − M)/n.`)}
            ${figAnomalies()}
            <p>${T`For the example, M = 0.2018 rad and n = 1.1306 × 10⁻³ rad/s, so apoapsis comes in (π − 0.2018)/n = 2 600 s, 43.3 minutes. Add that to the clock and you have the GET of apoapsis. This is exactly the calculation of a burn time in module ${Progress.code('burns')}: the clock reading plus a predicted interval.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">3.5</span>${T`How wrong can the answer be?`}</h2>
          <div class="prose">
            <p>${T`Every reading has an error. Because the formulas above are smooth, a small error in one reading moves the apsides by an amount proportional to it. The ratio is the <b>sensitivity</b>. Two new signs appear below. The curly <b>∂</b> (read “partial d”) marks a <b>partial derivative</b>: the rate at which the answer changes with one reading while the other readings are held fixed. The Greek letter <b>σ</b> (sigma) is the <b>standard deviation</b> of an instrument, the typical size of its random error: about two readings out of three fall within ±1σ of the truth.`}</p>
            <div class="eq">\\[ \\begin{aligned} \\Delta h_{a,p} \\approx{}& \\frac{\\partial h_{a,p}}{\\partial v}\\,\\Delta v + \\frac{\\partial h_{a,p}}{\\partial \\dot h}\\,\\Delta\\dot h \\\\ &+ \\frac{\\partial h_{a,p}}{\\partial h}\\,\\Delta h \\end{aligned} \\]</div>
            <div class="eq">\\[ \\begin{aligned} \\sigma_{h_a}^2 ={}& \\left(\\frac{\\partial h_a}{\\partial v}\\,\\sigma_v\\right)^2 + \\left(\\frac{\\partial h_a}{\\partial \\dot h}\\,\\sigma_{\\dot h}\\right)^2 \\\\ &+ \\left(\\frac{\\partial h_a}{\\partial h}\\,\\sigma_h\\right)^2 \\end{aligned} \\]</div>
            ${Sym.where([['\\partial h_a/\\partial v', N`sensitivity: metres of apoapsis altitude per m/s of speed error`, 'm per m/s'], ['\\sigma_v,\\ \\sigma_{\\dot h},\\ \\sigma_h', N`1σ precision of each instrument (typical size of its random error)`, N`m/s, m/s, m`]], N`Read the partial derivative as “how much the answer moves per unit of error in that reading”. Independent errors add as the root of the sum of squares, which is the second formula.`)}
            <p>${T`Near a circular orbit at 185 km the numbers are simple and large:`}</p>
            <ul>
              <li>${T`<b>Speed.</b> 1 m/s too fast raises the opposite apsis by about 4 Δv/n, which is 3.37 km. A speed error of 2 m/s shifts the apsis by almost 7 km.`}</li>
              <li>${T`<b>Altitude.</b> 1 m of error in h moves each apsis by about 2 m. Altitude errors rarely matter.`}</li>
              <li>${T`<b>Vertical speed.</b> The apsides move by about r/v = 0.84 km per m/s of ḣ error, one quarter of the speed effect. But near circular, ḣ is the only reading that says where the spacecraft is between periapsis and apoapsis. Ignore it and you take the spacecraft for being at an apsis, which can be tens of kilometres wrong.`}</li>
            </ul>
            <p>${T`For the example (e = 0.03) the speed sensitivity at apoapsis is 3.6 km per m/s and that of ḣ only 0.18 km per m/s. With good instruments (±0.3 m/s) the 1σ error on apoapsis is about 1.1 km; with poor ones (±2 m/s) it is about 7 km. The lab lets you compare your answer with the truth and with this error budget.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">3.6</span>${T`Ground tracking and onboard navigation`}</h2>
          <div class="prose">
            <p>${T`On Apollo the crew did not do this alone. The Manned Space Flight Network tracked the spacecraft by radar and Doppler from ground stations around the world. Mission Control in Houston computed the state vector and <b>uplinked</b> it to the guidance computer. That was the main source of the onboard state.`}</p>
            <p>${T`The command module also carried a sextant and a scanning telescope. The crew could measure angles between stars and landmarks or the horizon, and the computer turned them into a state vector. This was the independent backup, for use when communications were lost, and a check on the ground’s numbers.`}</p>
            <p>${T`Ground tracking is accurate because the stations are large and the computers are big, but it depends on the radio link. Onboard measurements are coarser but always available. The difference between the two is the main reason a crew might disagree with the ground, and what the second half of this course exploits.`}</p>
          </div>
        </section>

        ${Archive.capsule('tracking')}

        <section class="section">
          <h2><span class="idx">3.7</span>${T`Lab: the telemetry desk`}</h2>
          <div class="prose"><p>${T`Pick a scenario. The display shows only raw readings. Compute the periapsis and apoapsis altitudes (and, if you like, the time to apoapsis), type them in and submit. The orbit is drawn after you submit, with the truth beside your answer. The tolerance is shown in the task. Only answers you type yourself count towards the objectives, and “Show the working” disables credit for the current readings.`}</p></div>
          <div class="lab tl-lab" id="nv">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Telemetry desk`}</h3></div>
            <div class="stage"><canvas id="nv-cv" aria-label="${T`Earth with the spacecraft and, after you submit, the true and your computed orbit`}"></canvas><div class="badge" id="nv-badge"></div></div>
            <div class="tl-side">
              <div id="nv-tm"></div>
              <div id="nv-res"></div>
            </div>
            <div class="tl-groups">
              <div class="tl-group">
                <h4>${T`Scenario`}</h4>
                <div class="ctl"><label for="nv-scen"><span>${T`Scenario`}</span></label><select id="nv-scen">${Object.entries(SCEN).map(([k, s]) => `<option value="${k}">${T(s.label)}</option>`).join('')}</select></div>
                <p class="note" id="nv-task" style="margin:0"></p>
                <div class="ctl"><label for="nv-prec"><span>${T`Instrument precision`}</span></label><select id="nv-prec">${Object.entries(PRECISION_LABEL).map(([k, s]) => `<option value="${k}">${T(s)}</option>`).join('')}</select></div>
                <button class="btn" id="nv-new">${T`Take new readings`}</button>
              </div>
              <div class="tl-group">
                <h4>${T`Your answer`}</h4>
                <div class="mc-fields">
                  <label>${T`periapsis altitude (km)`}<input type="text" inputmode="decimal" id="nv-peri" autocomplete="off"></label>
                  <label>${T`apoapsis altitude (km)`}<input type="text" inputmode="decimal" id="nv-apo" autocomplete="off"></label>
                  <label>${T`time to apoapsis (min, optional)`}<input type="text" inputmode="decimal" id="nv-tapo" autocomplete="off"></label>
                </div>
                <div class="btn-row"><button class="btn primary" id="nv-submit">${T`Submit`}</button></div>
              </div>
              <div class="tl-group">
                <h4>${T`Working`}</h4>
                <button class="btn" id="nv-work">${T`Show the working`}</button>
                <dl class="readout" id="nv-steps"></dl>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('navigation', { math: 'trig', mathLabel: N`Sine, cosine and arcsine.` })}`;

      mountDesk(page.querySelector('#nv'));
      Practice.embed(page.querySelector('#practice-slot'), 'navigation', 3);
    },
  });

  function mountDesk(root) {
    const $ = (sel) => root.querySelector(sel);
    const num = (id) => { const s = String($(id).value).replace(/\s|\u202f/g, '').replace('−', '-').replace(',', '.'); if (s === '') return NaN; const v = Number(s); return isFinite(v) ? v : NaN; };
    let scenKey = 'park', prec = 'perfect', take = 0, S = null, peeked = false, answer = null;
    const view = UI.canvas($('#nv-cv'), null);
    const km = (x, d = 1) => f(x / 1e3, d);
    const sgn = (x, d = 1) => (x >= 0 ? '+' : '−') + f(Math.abs(x), d);

    function setup() {
      const sc = SCEN[scenKey], o = Pn.orbit(sc.altP * 1e3, sc.altA * 1e3, sc.nu0), tS = take * SNAP_STEP;
      const rng = seeded(1000 * (Object.keys(SCEN).indexOf(scenKey) + 1) + (take + (sc.seedAdd || 0)) * 7 + 13);
      const exact = Pn.readings(o, tS);
      const disp = roundRead(Pn.noisy(exact, Pn.PRECISION[prec], rng));
      const sol = Pn.fromReadings(disp), truth = Pn.fromReadings(exact);
      S = { sc, o, tS, get: sc.get0 + tS, exact, disp, sol, truth,
        tolKm: Math.max(5, 0.0015 * sol.ra / 1e3), tolT: Math.max(90, 0.02 * sol.tToApo) };
      peeked = false; answer = null;
      ['#nv-peri', '#nv-apo', '#nv-tapo'].forEach((id) => { $(id).value = ''; });
      $('#nv-steps').innerHTML = `<dt></dt><dd class="note" style="text-align:left">${T`The steps appear here. Using them disables objective credit for these readings.`}</dd>`;
      renderTelemetry(); renderResult(); view.redraw();
    }

    function renderTelemetry() {
      const d = S.disp, tm = $('#nv-tm');
      const rows = `<dt>GET</dt><dd class="hl">${UI.fmtTime(S.get)}</dd><dt>${T`Altitude`}</dt><dd>${f(d.alt / 1e3, 1)} km</dd><dt>${T`Speed`}</dt><dd>${f(d.v, 1)} m/s</dd><dt>${T`Vertical speed`}</dt><dd>${sgn(d.hdot)} m/s</dd>`;
      const sig = Pn.PRECISION[prec];
      const note = prec === 'perfect' ? '' : `<p class="note" style="margin:.4rem 0 0">${T`Instrument 1σ: ±${f(sig.alt, 0)} m, ±${f(sig.v, 1)} m/s, ±${f(sig.hdot, 1)} m/s.`}</p>`;
      tm.innerHTML = `<dl class="readout">${rows}</dl>${note}`;
      $('#nv-task').textContent = `${T(S.sc.task)} ${T`Tolerance: ±${f(S.tolKm, 0)} km, ±${f(S.tolT / 60, 1)} min.`}`;
    }

    function check(v, expected, tol) { return isFinite(v) && Math.abs(v - expected) <= tol; }

    function submit() {
      const p = num('#nv-peri'), a = num('#nv-apo'), t = num('#nv-tapo');
      if (!isFinite(p) || !isFinite(a)) { $('#nv-res').innerHTML = `<p class="note">${T`Enter both the periapsis and the apoapsis altitude in kilometres.`}</p>`; return; }
      const okP = check(p, S.sol.altP / 1e3, S.tolKm), okA = check(a, S.sol.altA / 1e3, S.tolKm);
      const hasT = isFinite(t), okT = hasT && check(t, S.sol.tToApo / 60, S.tolT / 60);
      answer = { p, a, t: hasT ? t : null, okP, okA, okT };
      if (!peeked) {
        if (okP && okA && prec === 'perfect' && (scenKey === 'park' || scenKey === 'transfer')) Progress.done('navigation', 'clean');
        if (okP && okA && scenKey === 'sub') Progress.done('navigation', 'sub');
        if (okP && okA && prec !== 'perfect') Progress.done('navigation', 'noisy');
        if (okT) Progress.done('navigation', 'tapo');
      }
      renderResult(); view.redraw();
    }

    function renderResult() {
      const box = $('#nv-res'), b = $('#nv-badge');
      if (!answer) { box.innerHTML = ''; b.textContent = T`Orbit unknown: readings only`; b.className = 'badge'; return; }
      const A = answer, tr = S.truth, sl = S.sol, ok = (x) => (x ? '✓' : '✗');
      const sig = Pn.PRECISION[prec];
      const bud = prec === 'perfect' ? null : Pn.budget(S.disp, sig);
      const row = (label, mine, okk, expected, truth, d = 0) => `<dt>${label}</dt><dd class="hl">${f(mine, d)} ${ok(okk)}</dd><dt>${T`  from the readings`}</dt><dd>${f(expected, d)}</dd><dt>${T`  truth`}</dt><dd>${f(truth, d)}</dd>`;
      let html = `<dl class="readout">
        ${row(T`Periapsis (km)`, A.p, A.okP, sl.altP / 1e3, tr.altP / 1e3)}
        ${row(T`Apoapsis (km)`, A.a, A.okA, sl.altA / 1e3, tr.altA / 1e3)}
        ${A.t != null ? row(T`Time to apo (min)`, A.t, A.okT, sl.tToApo / 60, tr.tToApo / 60, 1) : ''}
        ${bud ? `<dt>${T`Noise budget 1σ`}</dt><dd>±${f(bud.altP / 1e3, 1)} / ±${f(bud.altA / 1e3, 1)} km</dd>` : ''}
      </dl>`;
      const err = Math.max(Math.abs(sl.altA - tr.altA), Math.abs(sl.altP - tr.altP)) / 1e3;
      html += `<p class="note" style="margin:.4rem 0 0">${A.okP && A.okA ? T`Both apsides within tolerance of what the readings give.` : T`Not within tolerance of the readings. Check γ, then ε, then H.`} ${prec !== 'perfect' ? T`The readings themselves are off the truth by up to ${f(err, 1)} km.` : ''} ${tr.altP < 0 ? T`The periapsis is below the surface: this trajectory ends in the ground.` : ''}${peeked ? ' ' + T`No objective credit for this attempt.` : ''}</p>`;
      box.innerHTML = html;
      b.textContent = T`Truth: ${km(tr.altP, 0)} × ${km(tr.altA, 0)} km`;
      b.className = 'badge ' + (tr.altP < 0 ? 'bad' : '');
    }

    function showWorking() {
      peeked = true;
      const s = S.sol, d = S.disp;
      const rows = [
        ['r', `${km(s.r, 1)} km`], ['γ', `${f(s.gamma * deg, 3)}°`], ['v cos γ', `${f(s.vh, 2)} m/s`], ['ε', `${f(s.eps / 1e6, 4)} MJ/kg`], ['a', `${km(s.a, 1)} km`],
        ['H', `${f(s.H / 1e9, 5)}e9 m²/s`], ['p', `${km(s.p, 1)} km`], ['e', f(s.e, 6)], ['ν', `${f(s.nu * deg, 2)}°`], ['r_p / r_a', `${km(s.rp, 1)} / ${km(s.ra, 1)} km`],
        [T`h_p / h_a`, `${km(s.altP, 1)} / ${km(s.altA, 1)} km`], ['T', `${f(s.T / 60, 2)} min`], [T`t to apo`, `${f(s.tToApo / 60, 2)} min`],
      ];
      $('#nv-steps').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
      if (answer) renderResult(); else $('#nv-res').innerHTML = `<p class="note">${T`Working shown: no objective credit for these readings. Take new readings to earn it.`}</p>`;
    }

    view.draw = (ctx, w, h) => {
      if (!S) return;
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, K, 80);
      const cx = w / 2, cy = h / 2, rS = S.sol.r;
      const shown = !!answer;
      let rMax = rS * 1.4;
      if (shown) { rMax = S.truth.ra; if (answer && isFinite(answer.a) && answer.a * 1e3 + RE < 8 * S.truth.ra) rMax = Math.max(rMax, RE + answer.a * 1e3); rMax *= 1.12; }
      const s = Math.min(w, h) / (2 * rMax);
      const rot = Math.PI / 2 - S.truth.nu;                 // puts the spacecraft at the top of the screen
      const P = (r, nu) => [cx + r * s * Math.cos(nu + rot), cy - r * s * Math.sin(nu + rot)];
      const ellipse = (rp, ra, color, dash, width) => {
        const aa = (rp + ra) / 2, e = (ra - rp) / (ra + rp), p = aa * (1 - e * e);
        ctx.lineWidth = width; ctx.setLineDash(dash);
        let prevUnder = null;
        for (let k = 0; k < 240; k++) {
          const n1 = 2 * Math.PI * k / 240, n2 = 2 * Math.PI * (k + 1) / 240, r1 = p / (1 + e * Math.cos(n1)), r2 = p / (1 + e * Math.cos(n2));
          const under = (r1 + r2) / 2 < RE;
          ctx.strokeStyle = under ? K.warn : color; ctx.beginPath(); ctx.moveTo(...P(r1, n1)); ctx.lineTo(...P(r2, n2)); ctx.stroke(); prevUnder = under;
        }
        ctx.setLineDash([]);
      };
      UI.drawEarth(ctx, cx, cy, RE * s, K);
      if (shown) {
        ellipse(S.truth.rp, S.truth.ra, K.trace, [], 2);
        const rpc = RE + answer.p * 1e3, rac = RE + answer.a * 1e3;
        if (rpc > 0 && rac >= rpc) ellipse(rpc, rac, K.accent, [6, 5], 1.6);
        ctx.font = `10px ${K.mono}`; ctx.fillStyle = K.muted; ctx.textAlign = 'left';
        ctx.fillText('Pe', ...P(S.truth.rp, 0).map((v, i) => v + (i ? -6 : 6)));
        ctx.fillText('Ap', ...P(S.truth.ra, Math.PI).map((v, i) => v + (i ? -6 : 6)));
      }
      // spacecraft with its velocity components
      const [sx, sy] = P(S.truth.r, S.truth.nu);
      // the arrows are scaled to stay inside the view; a small climb rate is drawn enlarged (×4, ×10 or ×40) so it can be seen
      const hx = -1;   // local horizontal at the top of the screen points left (counter-clockwise motion)
      const roomUp = S.disp.hdot >= 0 ? sy - 30 : h - sy - 30;
      const k = Math.min(0.012, (sx - 20) / S.sol.vh, roomUp / Math.max(1, Math.abs(S.disp.hdot)));
      const ex = [1, 4, 10, 40].find((m) => Math.abs(S.disp.hdot) * k * m >= 22 || m === 40) || 1;
      const ex2 = Math.abs(S.disp.hdot) * k * ex > roomUp ? 1 : ex;
      const dx = hx * S.sol.vh * k, dy = -S.disp.hdot * k * ex2;
      UI.arrow(ctx, sx, sy, sx + dx, sy, K.muted, 1.5);
      UI.arrow(ctx, sx, sy, sx, sy + dy, K.warn, 2);
      UI.arrow(ctx, sx, sy, sx + dx, sy + dy, K.good, 2.5);
      ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(sx, sy, 4, 0, 7); ctx.fill();
      ctx.font = `10px ${K.mono}`; ctx.textAlign = 'left'; ctx.fillStyle = K.good; ctx.fillText('v', sx + dx - 4, sy + dy + (dy > 0 ? 14 : -8));
      ctx.fillStyle = K.warn; ctx.fillText(ex2 > 1 ? `ḣ ×${ex2}` : 'ḣ', sx + 6, sy + (dy > 0 ? Math.max(14, dy) + 12 : -Math.max(14, -dy) - 4));
      if (!shown) { ctx.fillStyle = K.muted; ctx.textAlign = 'center'; ctx.fillText(T`orbit hidden until you submit`, cx, h - 14); }
    };

    $('#nv-scen').addEventListener('change', (e) => { scenKey = e.target.value; prec = SCEN[scenKey].prec; $('#nv-prec').value = prec; take = 0; setup(); });
    $('#nv-prec').addEventListener('change', (e) => { prec = e.target.value; setup(); });
    $('#nv-new').addEventListener('click', () => { take += 1; setup(); });
    $('#nv-submit').addEventListener('click', submit);
    $('#nv-work').addEventListener('click', showWorking);
    root.querySelectorAll('#nv-peri, #nv-apo, #nv-tapo').forEach((el) => el.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); }));
    $('#nv-scen').value = scenKey; $('#nv-prec').value = prec;
    setup();
  }
})();
