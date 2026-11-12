/* Chapter: Planning the Return. Trans-Earth injection from lunar orbit, patched conics in reverse.
   Lab: trans-Earth planner. Physics lives in homeward.phys.js (Phys_homeward). */
(function () {
  'use strict';
  const { C } = Phys;
  const Ph = window.Phys_homeward;
  const muE = C.muE, muM = C.muM, RE = C.RE, RM = C.RM, D = C.DEM;
  const R = String.raw;
  const f = UI.fmt;
  const rnd = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;
  const deg = 180 / Math.PI;

  /* ---------- figure 17.3: where the trans-Earth burn goes (Moon-centred, computed from the hand values) ---------- */
  const fx = (n) => n.toFixed(1), pct = (x, w) => (100 * x / w).toFixed(2) + '%';
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1]], vadd = (a, b) => [a[0] + b[0], a[1] + b[1]], vmul = (a, k) => [a[0] * k, a[1] * k];
  const vunit = (a) => vmul(a, 1 / Math.hypot(...a)), pol = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  function frame(W, H, ox, oy) {
    const S = (q) => [ox + q[0], oy - q[1]];
    const path = (list) => list.map((q, k) => `${k ? 'L' : 'M'}${fx(S(q)[0])},${fx(S(q)[1])}`).join('');
    const head = (q, dir, cls) => { const a = S(q), t = vunit([dir[0], -dir[1]]), n = [-t[1], t[0]];
      return `<path class="${cls}" d="M${fx(a[0] + 9 * t[0])},${fx(a[1] + 9 * t[1])}L${fx(a[0] + 4.5 * n[0])},${fx(a[1] + 4.5 * n[1])}L${fx(a[0] - 4.5 * n[0])},${fx(a[1] - 4.5 * n[1])}Z"/>`; };
    const arrow = (a, b, cls, fill) => { const c = vsub(b, vmul(vunit(vsub(b, a)), 9)); return `<path class="${cls}" d="${path([a, c])}"/>${head(c, vsub(b, a), fill)}`; };
    const arc = (c, r, a0, a1, cls, n = 40) => `<path class="${cls}" d="${path([...Array(n + 1).keys()].map((k) => vadd(c, pol(r, a0 + (a1 - a0) * k / n))))}"/>`;
    const lbs = (list) => list.map(([q, t, c]) => { const [x, y] = S(q); return `<span class="lb ${c || ''}" style="left:${pct(x, W)};top:${pct(y, H)}">${t}</span>`; }).join('');
    const dot = (q, cls, r = 3) => `<circle class="${cls}" cx="${fx(S(q)[0])}" cy="${fx(S(q)[1])}" r="${r}"/>`;
    return { S, path, head, arrow, arc, lbs, dot };
  }
  App.css('homeward-fig', `
    .f-moon { fill: var(--moon); fill-opacity: .35; stroke: var(--muted); stroke-width: 1; }
    .f-shadow { fill: var(--muted); opacity: .12; }
    .hw-exec:empty { display: none; } .hw-exec { margin: .6rem 0; padding: .5rem .7rem; border: 1px solid var(--line); border-radius: 6px; font-size: .85rem; }
    .hw-exec.flash { animation: hw-flash .8s ease-out; } @keyframes hw-flash { from { background: color-mix(in srgb, var(--accent) 22%, transparent); } }
    .hw-exec ul { margin: .3rem 0 0; padding: 0; list-style: none; } .hw-exec li { margin: .15rem 0; }`);
  // Earth to the left, the Moon moving up the page; the orbit is clockwise, so at the far-side midpoint (right) the
  // spacecraft moves down, against v☾. Burn φ before that point; the hyperbola's asymptote is θ∞ further on.
  function figBurn(h) {
    const W = 540, H = 400, ox = 250, oy = 130, RMN = 44, RO = 60;
    const F = frame(W, H, ox, oy), e = h.e, thI = h.thInf, phi = h.phi / deg;
    const p = RO * (1 + e), rMax = 262;
    const nuMax = Math.acos((p / rMax - 1) / e);
    const hyp = [...Array(81).keys()].map((k) => { const nu = nuMax * k / 80; return pol(p / (1 + e * Math.cos(nu)), phi - nu); });
    const end = hyp[hyp.length - 1], burn = pol(RO, phi), far = [RO, 0];
    const tang = (a) => [Math.sin(a), -Math.cos(a)];                     // clockwise direction of motion at angle a
    const dirInf = phi - thI;                                            // asymptote direction (≈ −90°: down the page)
    const circ = (r, cls) => `<circle class="${cls}" cx="${ox}" cy="${oy}" r="${r}"/>`;
    return `<figure class="fig" role="img" aria-label="${T`The Moon seen from above, with the Earth off to the left and the Moon moving up the page. The spacecraft circles the Moon clockwise. The trans-Earth burn is made on the far side, about 52° before the point opposite the Earth. From there the departure hyperbola swings around the far side and leaves downwards, against the Moon’s motion. The angle from the burn point to the asymptote direction is θ∞, about 142°.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <rect class="f-shadow" x="${ox}" y="${oy - RMN}" width="${W - ox}" height="${2 * RMN}"/>
        <path class="f-mu-thin f-dash" d="${F.path([[-190, 0], [W - ox, 0]])}"/>
        ${F.arrow([-150, 0], [-225, 0], 'f-mu', 'f-mu-fill')}
        ${F.arrow([-150, -120], [-150, -50], 'f-mu', 'f-mu-fill')}
        ${circ(RO, 'f-mu-thin')}${circ(RMN, 'f-moon')}
        ${F.head(pol(RO, 155 * Math.PI / 180), tang(155 * Math.PI / 180), 'f-mu-fill')}
        <path class="f-mu-thin f-dash" d="${F.path([[0, 0], pol(250, dirInf)])}"/>
        ${F.arc([0, 0], 24, phi, dirInf, 'f-mu-thin')}
        ${F.arc([0, 0], 104, 0, phi, 'f-ac-ln')}
        <path class="f-tr" d="${F.path(hyp)}"/>
        ${F.arrow(end, vadd(end, vmul(vunit(vsub(end, hyp[hyp.length - 4])), 40)), 'f-tr', 'f-tr-fill')}
        ${F.arrow(burn, vadd(burn, vmul(tang(phi), 36)), 'f-ac-ln', 'f-ac-fill')}
        ${F.arrow(far, [RO, -34], 'f-mu', 'f-mu-fill')}<path class="f-mu-thin" d="${F.path([[RO - 9, 0], [RO - 9, -9], [RO, -9]])}"/>${F.dot(far, 'f-mu-fill')}${F.dot(burn, 'f-ac-fill', 4)}
      </svg>${F.lbs([
        [[-226, -14], T`to the Earth`, 'm l wrap narrow'],
        [[-142, -62], '<i>v</i><sub>☾</sub>', 'm l'],
        [[-142, -84], T`Moon’s motion`, 'm l wrap narrow'],
        [[0, 0], T`Moon`, 'm'],
        [[-66, 36], T`lunar orbit (clockwise)`, 'm r wrap narrow'],
        [vadd(burn, [-14, 26]), T`TEI burn`, 'acc r'],
        [vadd(burn, [34, -14]), 'Δ<i>v</i>', 'acc l'],
        [pol(114, phi / 2), '<i>φ</i>', 'acc l'],
        [[66, -12], T`far-side midpoint`, 'm l wrap narrow'],
        [[W - ox - 8, 28], T`behind the Moon: no radio contact`, 'm r wrap narrow'],
        [pol(34, (phi + dirInf) / 2 - 0.35), '<i>θ</i><sub>∞</sub>', 'm'],
        [[-8, -150], T`asymptote direction`, 'm r'],
        [vadd(end, [-12, -34]), T`<i>v</i><sub>∞</sub>, against the Moon’s motion`, 'tr r wrap'],
        [pol(150, -0.55), T`departure hyperbola`, 'tr l wrap narrow'],
      ])}</div>
      <figcaption>${T`Where the burn goes, for the minimum-energy return (e = ${f(e, 3)}). Not to scale: the orbit and the hyperbola are drawn larger than the Moon. The burn comes φ ≈ ${f(h.phi, 0)}° before the far-side midpoint, so the asymptote, θ∞ ≈ ${f(thI * deg, 0)}° further on, points against the Moon’s motion.`}</figcaption></figure>`;
  }

  Progress.register('homeward', {
    name: N`Planning the Return`, topic: 'homeward', glyph: 'homeward',
    briefing: N`The landing is done, {name}, and the hardest burn of the flight is still ahead. There is no second chance at trans-Earth injection: the engine fires once, behind the Moon, out of radio contact. In this module you work the patched conics backwards, from the Earth entry corridor to the burn in lunar orbit. You choose the speed, the place and the revolution, and you learn how little room for error the corridor leaves.`,
    objectives: [
      { id: 'dv', text: N`Nominal return: execute a trans-Earth injection with the Δv from your own hand calculation (within 3 m/s)` },
      { id: 'corr', text: N`Aim a return burn yourself, without Mission Control’s solver, so the entry angle falls inside the corridor` },
      { id: 'rev', text: N`Pick the lunar revolution that puts splashdown inside the requested window, in the corridor` },
      { id: 'mcc', text: N`Fix a dispersed burn with a midcourse correction of 4 m/s or less so the entry angle is back in the corridor` },
      { id: 'qual', text: N`Qualify: answer 2 trans-Earth problems correctly` },
    ],
    debrief: N`You can now turn an entry corridor into a burn in lunar orbit, and you know why the burn is so exact and why the way home needs a correction, {name}. Next comes the other end of the trip: the entry itself.`,
  });

  /* ---------------- Practice ---------------- */
  const hand = (alt, rpAlt) => Ph.handMinEnergy(alt * 1e3, rpAlt * 1e3);
  const registerPractice = () => Practice.register('homeward', N`Trans-Earth return`, [
    { title: N`The Moon’s orbital speed`, make() {
      const d = rnd(356, 406, 2) * 1e3, v = Math.sqrt(muE / (d * 1e3));
      return { q: T`The Moon circles the Earth on a nearly circular orbit at <b>${f(d, 0)} km</b> from the Earth’s centre. What is its orbital speed? (Earth: μ = 398 600 km³/s²)`, answer: v, unit: 'm/s', tol: 0.01,
        hint: T`Circular speed: v = √(μ/r). Use metres: μ = 3.986 × 10¹⁴ m³/s².`,
        sol: R`\[ v_\mathrm{Moon} = \sqrt{\frac{\mu_\oplus}{D}} = \sqrt{\frac{3.986\times10^{14}}{${f(d * 1e3 / 1e6, 1)}\times10^{6}}} = ${f(v, 1)}\ \mathrm{m/s} \]` };
    } },
    { title: N`Apogee speed of the return ellipse`, make() {
      const hp = rnd(30, 60, 5), h = hand(110, hp);
      return { q: T`A spacecraft returns on an Earth ellipse with its apogee at the Moon’s distance (384 400 km from the Earth’s centre) and a vacuum perigee at an altitude of <b>${f(hp, 0)} km</b> (R⊕ = 6 378 km). What is its speed at apogee?`, answer: h.va, unit: 'm/s', tol: 0.01,
        hint: T`Semi-major axis a = (r<sub>a</sub> + r<sub>p</sub>)/2, then vis-viva: v² = μ(2/r − 1/a). Or use angular momentum: v<sub>a</sub> = v<sub>p</sub> r<sub>p</sub>/r<sub>a</sub>.`,
        sol: R`\[ r_p = ${f((RE + hp * 1e3) / 1e3, 0)}\ \mathrm{km},\quad a = \frac{r_a + r_p}{2} = ${f(h.a / 1e3, 0)}\ \mathrm{km} \]
          \[ v_a = \sqrt{\mu_\oplus\left(\frac{2}{r_a} - \frac{1}{a}\right)} = ${f(h.va, 1)}\ \mathrm{m/s} \]` };
    } },
    { title: N`Excess speed at the Moon`, make() {
      const hp = rnd(30, 60, 5), h = hand(110, hp);
      return { q: T`The return ellipse has its apogee at the Moon’s distance and a vacuum perigee at <b>${f(hp, 0)} km</b> altitude. The Moon moves at ${f(h.vM, 1)} m/s. At the Moon, the spacecraft must move at the ellipse’s apogee speed, in the same direction. What is its hyperbolic excess speed v<sub>∞</sub> relative to the Moon?`, answer: h.vinf, unit: 'm/s', tol: 0.01,
        hint: T`Apogee speed first (vis-viva). The excess speed is the vector difference of the two velocities; they are parallel, so it is a plain subtraction. The Moon is faster: you leave the Moon backwards.`,
        sol: R`\[ v_a = ${f(h.va, 1)}\ \mathrm{m/s},\qquad v_\infty = v_\mathrm{Moon} - v_a = ${f(h.vM, 1)} - ${f(h.va, 1)} = ${f(h.vinf, 1)}\ \mathrm{m/s} \]` };
    } },
    { title: N`Trans-Earth injection Δv`, make() {
      const alt = rnd(80, 150, 10), vinf = rnd(780, 1300, 10), r = RM + alt * 1e3, vc = Math.sqrt(muM / r), vh = Math.sqrt(vinf * vinf + 2 * muM / r);
      return { q: T`A spacecraft circles the Moon at <b>${f(alt, 0)} km</b> altitude (R☾ = 1 737 km, μ☾ = 4 903 km³/s²). To come home it needs a hyperbolic excess speed of <b>${f(vinf, 0)} m/s</b>. What Δv must the trans-Earth injection burn give?`, answer: vh - vc, unit: 'm/s', tol: 0.01,
        hint: T`Speed at the burn on the hyperbola: v² = v<sub>∞</sub>² + 2μ/r. Subtract the circular speed √(μ/r).`,
        sol: R`\[ r = ${f(r / 1e3, 0)}\ \mathrm{km},\quad v_c = \sqrt{\frac{\mu_☾}{r}} = ${f(vc, 1)}\ \mathrm{m/s},\quad v_{hyp} = \sqrt{v_\infty^2 + \frac{2\mu_☾}{r}} = ${f(vh, 1)}\ \mathrm{m/s} \]
          \[ \Delta v = v_{hyp} - v_c = ${f(vh - vc, 1)}\ \mathrm{m/s} \]` };
    } },
    { title: N`Return time on the ellipse`, make() {
      const hp = rnd(30, 60, 5), h = hand(110, hp), th = h.tof / 3600;
      return { q: T`A spacecraft returns on an Earth ellipse with its apogee at the Moon’s distance (384 400 km from the Earth’s centre) and a vacuum perigee at <b>${f(hp, 0)} km</b> altitude. How many hours does it take from apogee to perigee? (Half the period.)`, answer: th, unit: 'h', tol: 0.01,
        hint: T`Half the period: T/2 = π √(a³/μ), with a = (r<sub>a</sub> + r<sub>p</sub>)/2. Convert seconds to hours at the end.`,
        sol: R`\[ a = ${f(h.a / 1e3, 0)}\ \mathrm{km},\quad \frac{T}{2} = \pi\sqrt{\frac{a^3}{\mu_\oplus}} = ${f(h.tof, 0)}\ \mathrm{s} = ${f(th, 1)}\ \mathrm{h} \]` };
    } },
  ], [
    { q: N`Why is the trans-Earth injection burn done on the far side of the Moon?`, opts: [N`The Moon’s gravity is weaker on the far side, so the burn costs less`, N`Leaving backwards, against the Moon’s motion, puts the burn on that side`, N`The engine is safer to fire away from the Earth’s radio interference`, N`The Earth’s gravity pulls hardest there and helps lift the spacecraft out`], a: 1, why: N`The Moon moves around the Earth. To fall towards the Earth, the spacecraft must be slower than the Moon in the Earth frame, so it must leave against the Moon’s motion. Seen from the Moon, that is the direction of the far side. The occultation by the Moon is a consequence, not the reason.` },
    { q: N`The entry corridor is about 2° wide. A trans-Earth burn error of 1 m/s moves the perigee altitude by about 150 km. What does that tell you?`, opts: [N`The burn must be repeated until the perigee error is exactly zero`, N`One burn cannot be accurate enough: midcourse corrections fix the perigee later`, N`The corridor only matters at entry, so the error can safely be ignored until then`, N`The error is harmless, because the atmosphere absorbs any perigee mistake`], a: 1, why: N`The corridor is about 55 km tall in perigee altitude. A burn error of a metre per second is several times that. Tracking measures the real trajectory after the burn, and small midcourse burns, a few metres per second, correct the rest.` },
    { q: N`A spacecraft is in lunar orbit and misses the planned burn by one revolution (about 2 hours). With the same burn, what changes?`, opts: [N`The entry angle changes by 30°, out of the corridor`, N`Splashdown is 2 hours later and about 30° further west`, N`The trip takes 2 hours longer, but splashdown is at the same place`, N`Nothing: the Moon moves too little in 2 hours to matter`], a: 1, why: N`The geometry of the burn relative to the Moon and the Earth is the same, so the trajectory is the same. Only the clock moves. The Earth turns 15° per hour, so splashdown shifts by about 30° of longitude per lunar revolution.` },
  ]);
  registerPractice();

  /* ---------------- Lab scenarios ---------------- */
  const PHI_NOM = Ph.solvePhi({ alt: 110e3, dv: 1000 })[0];
  const SCEN = {
    nominal: { label: N`Nominal return, 60 km orbit`, alt: 60e3, dv: 1000, phi: 0, rev: 1, err: 0, mcc: false,
      task: N`Minimum-energy return from a 60 km orbit, lower than the example in the text: the apogee of the return ellipse is at the Moon’s distance and the vacuum perigee is 40 km. Work out the Δv by hand (the working panel shows the method, but then the Δv objective is not credited), type it in, then find the burn position that brings the entry angle into the corridor.` },
    fast: { label: N`Faster return (costlier)`, alt: 110e3, dv: 1000, phi: 0, rev: 1, err: 0, mcc: false,
      task: N`Mission rules: splashdown within 52 hours of the burn. A faster return costs more Δv. Find a Δv that meets the rule, then the burn position that keeps the entry in the corridor.` },
    landing: { label: N`Choose the revolution`, alt: 110e3, dv: 1000, phi: 0, rev: 1, err: 0, mcc: false, target: 69.5 * 3600, window: 3600,
      task: N`Recovery ships will be on station for splashdown at 69.5 hours after the marker (the moment the spacecraft crosses the Earth-facing point of its orbit), plus or minus 1 hour. The burn Δv is fixed at 1000 m/s. Find the burn position, then the revolution that meets the window.` },
    disp: { label: N`Dispersed burn: correct it`, alt: 110e3, dv: 1000, phi: +PHI_NOM.toFixed(3), rev: 1, err: -0.7, mcc: true,
      task: N`The planned burn is loaded. The engine cuts off 0.7 m/s early (Mission Control will tell you after tracking). Execute, read the perigee, then enter a midcourse correction at a time you choose, of 4 m/s or less, to bring the entry angle back into the corridor.` },
  };
  const hrs = (s) => f(s / 3600, 1);

  App.chapter({
    id: 'homeward', phase: N`Trans-Earth`, title: N`Planning the Return`, lab: N`Trans-Earth planner`,
    blurb: N`One burn behind the Moon, a corridor 2° wide at the other end. Work backwards from the entry to the engine.`,
    render(page) {
      const h = Ph.handMinEnergy(110e3, 40e3);
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('homeward')} · Trans-Earth`,
          title: T`Planning the Return`,
          lede: T`Going to the Moon was the easy direction: the target was big. Coming back, the target is a slot of about 55 km in perigee altitude, 384 000 km away. This module works the patched conics backwards: from the entry corridor, to the Earth ellipse, to the Moon’s sphere of influence, to a single burn in lunar orbit.`,
          refs: [T`Sellers · Understanding Space`, T`BMW · Fundamentals of Astrodynamics`, T`Apollo Operations Handbook`],
        })}
        ${Progress.briefing('homeward', { theory: 'theory', lab: 'hw', math: 'refresher', mathLabel: N`Subtracting velocity vectors.` })}

        <section class="section" id="theory">
          <h2><span class="idx">0.1</span>${T`Start at the end: the return ellipse`}</h2>
          <div class="prose">
            <p>${T`Planning the way out went forwards: from the parking orbit to the Moon. For the return, start at the Earth. The entry module (${Progress.code('entry')}) fixes what the spacecraft must do on arrival: reach the <b>entry interface</b>, the conventional top of the atmosphere at 122 km, with a flight-path angle of about −6.5°, inside a corridor from −5.3° to −7.4°. Because the speed there is nearly fixed by the energy, that angle is set by the <b>perigee</b> the spacecraft would have in vacuum. A vacuum perigee between about 12 and 65 km altitude is inside the corridor. The middle, 40 km, gives −6.4°.`}</p>
            <p>${T`Now choose the shape of the Earth orbit. The spacecraft starts at the Moon’s distance. The cheapest return is an ellipse with its <b>apogee at the Moon’s distance</b> and its perigee at 40 km altitude. It is a transfer ellipse, like the Hohmann transfer of module ${Progress.code('maneuvers')}, run downwards.`}</p>
            <div class="eq">\\[ a = \\frac{D + r_p}{2}, \\qquad v_a = \\sqrt{\\mu_\\oplus\\left(\\frac{2}{D} - \\frac{1}{a}\\right)}, \\qquad t_\\mathrm{flight} = \\pi\\sqrt{\\frac{a^3}{\\mu_\\oplus}} \\]</div>
            ${Sym.where(['a', 'Dem', ['r_p', N`perigee radius: Earth’s radius plus the vacuum perigee altitude (6 378 + 40 = 6 418 km)`, 'm'], ['v_a', N`speed of the spacecraft at the Moon’s distance, at apogee`, 'm/s'], 'muE', ['t_{flight}', N`time from apogee to perigee: half the period`, 's']], N`Half the period, because the spacecraft flies only from apogee to perigee.`)}
            <p>${T`The numbers: a = ${f(h.a / 1e3, 0)} km, v<sub>a</sub> = ${f(h.va, 1)} m/s, and a flight time of ${f(h.tof / 3600, 1)} hours, five days. The spacecraft is slow at apogee because it is high up, and it has to be: the Earth’s gravity is the only thing that brings it down.`}</p>
            ${Primer.box('ellipse')}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.2</span>${T`From the Earth’s view to the Moon’s view`}</h2>
          <div class="prose">
            <p>${T`The spacecraft must have ${f(h.va, 1)} m/s relative to the Earth at the Moon’s distance. But the Moon itself moves at v<sub>M</sub> = √(μ⊕/D) = ${f(h.vM, 1)} m/s (the real mean is 1.02 km/s). Subtract the two velocity vectors to get the velocity relative to the Moon. They are parallel, so it is a plain subtraction:`}</p>
            <div class="eq">\\[ v_\\infty = v_M - v_a = ${f(h.vM, 1)} - ${f(h.va, 1)} = ${f(h.vinf, 1)}\\ \\mathrm{m/s} \\]</div>
            ${Sym.where(['vinf', ['v_M', N`orbital speed of the Moon around the Earth, √(μ⊕/D)`, 'm/s'], ['v_a', N`speed the spacecraft needs relative to the Earth`, 'm/s']], [N`The Moon is faster than the spacecraft needs to be, so v∞ points backwards: the spacecraft leaves the Moon against the Moon’s own motion. This is the patched-conic idea of module {$0}, in reverse: there the spacecraft arrived with a v∞, here it departs with one.`, Progress.code('moon')])}
            ${Primer.box('vectors', false, 'refresher')}
            <p>${T`This is the key to the whole module. To fall towards the Earth, the spacecraft must be slower than the Moon in the Earth frame. So it must leave the Moon in the direction opposite to the Moon’s motion.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.3</span>${T`The burn: Δv and the ejection angle`}</h2>
          <div class="prose">
            <p>${T`The spacecraft sits in a circular lunar orbit of radius r (110 km altitude: r = ${f((RM + 110e3) / 1e3, 0)} km). It must leave the Moon’s gravity with a speed v<sub>∞</sub> to spare. Energy conservation on the departure hyperbola gives the speed needed at the burn, and the burn is the difference with the circular speed:`}</p>
            <div class="eq">\\[ v_{hyp} = \\sqrt{v_\\infty^2 + \\frac{2\\mu_☾}{r}}, \\qquad \\Delta v = v_{hyp} - v_c, \\qquad v_c = \\sqrt{\\frac{\\mu_☾}{r}} \\]</div>
            ${Sym.where(['vinf', 'muM', ['r', N`radius of the lunar orbit: Moon’s radius plus altitude`, 'm'], ['v_{hyp}', N`speed on the departure hyperbola at the burn point`, 'm/s'], ['v_c', N`circular speed of the lunar orbit at radius r`, 'm/s'], 'dv'], N`The same energy argument as for the escape speed: 2μ/r is the square of the escape speed. A hyperbolic excess speed adds to it.`)}
            <p>${T`The numbers: v<sub>c</sub> = ${f(h.vc, 1)} m/s, v<sub>hyp</sub> = ${f(h.vhyp, 1)} m/s, and <b>Δv = ${f(h.dv, 0)} m/s</b>. The real flights used about 1 km/s because they came home in about 2.5 days instead of five: a faster return needs more speed at the Moon and so a bigger burn. The lab lets you trade the two.`}</p>
            <p>${T`The burn is a prograde push at one point of the orbit, and the hyperbola then bends away. Where must the burn be? The departure hyperbola leaves along an asymptote. Its angle from the burn point (periselene) is the true anomaly at infinity, where r → ∞ in the orbit equation:`}</p>
            <div class="eq">\\[ e = 1 + \\frac{r\\,v_\\infty^2}{\\mu_☾}, \\qquad \\cos\\theta_\\infty = -\\frac{1}{e}, \\qquad \\phi \\approx \\theta_\\infty - 90^\\circ \\]</div>
            ${Sym.where(['e', ['\\theta_\\infty', N`angle between the burn point and the asymptote direction, seen from the Moon’s centre`, N`rad or °`], ['\\phi', N`burn position: how far before the far-side midpoint (the point opposite the Earth) the burn takes place, along the orbit`, N`°`]], N`In a circular orbit the velocity is always at right angles to the radius. At the far-side midpoint the spacecraft therefore moves against the Moon’s motion, a quarter turn further round the orbit than the point itself (the small arrow in the figure). That is the direction the asymptote must point. The asymptote lies θ∞ further round than the burn point, so the burn comes θ∞ − 90° before the far-side midpoint.`)}
            <p>${T`For the example e = ${f(h.e, 3)}, θ∞ = ${f(h.thInf * deg, 1)}° and φ ≈ ${f(h.phi, 1)}°. The burn takes place on the <b>far side</b> of the Moon. This was true on every Apollo flight: the spacecraft was behind the Moon, out of radio contact, when the engine fired, and the first sign that it had worked was the signal returning on the other side. The first crew to live it was Apollo 8, on Christmas Day 1968.`}</p>
            ${figBurn(h)}
            <p>${T`The hand calculation has limits. It assumes the spacecraft leaves from the Moon’s centre and ignores that it needs about 13 to 18 hours to get out of the Moon’s sphere of influence, during which the Moon moves by about 8° to 10° around the Earth. For a fast return (Δv about 1 000 m/s) the hand position is within a few degrees of the simulated one. For the slow, minimum-energy return the difference is about 30°, and the simulated flight is shorter than five days, because the spacecraft is already well inside the Moon’s distance when it leaves the sphere. Use the hand numbers to get close, then let the simulation finish the job.`}</p>
          </div>
        </section>

        ${Archive.capsule('receding')}

        <section class="section">
          <h2><span class="idx">0.4</span>${T`Which revolution? Time and longitude`}</h2>
          <div class="prose">
            <p>${T`A spacecraft in a 110 km lunar orbit goes round in ${f(Ph.lunarOrbit(110e3).P / 60, 1)} minutes. Seen from the Earth, the Moon turns slowly, so the far-side midpoint comes round again after ${f(Ph.lunarOrbit(110e3).Psyn / 60, 1)} minutes. The burn position φ comes round once per such revolution. Every revolution is a new launch window, about 2 hours later.`}</p>
            <p>${T`If the burn is made one revolution later, the geometry between the spacecraft, the Moon and the Earth is repeated. The trajectory is the same, and only the clock moves: the flight takes just as long and arrives at the same place in space, 2 hours later. The Earth turns 15° per hour, so each revolution shifts the splashdown by about 30° of longitude. Mission Control chooses the revolution to put splashdown where the recovery ships are and in daylight.`}</p>
            <div class="eq">\\[ t_\\mathrm{splash} = t_\\mathrm{TEI} + t_\\mathrm{flight}, \\qquad t_\\mathrm{TEI} = \\frac{180^\\circ - \\phi + 360^\\circ(k-1)}{360^\\circ}\\,P_\\mathrm{syn} \\]</div>
            ${Sym.where([['k', N`revolution number: 1, 2, 3… counted from the marker (the Earth-facing point of the orbit)`, ''], ['P_{syn}', N`time between two far-side midpoints: the lunar orbit period as seen from the Earth line`, 's'], ['t_{TEI}', N`time of the burn after the marker`, 's']], N`One more revolution adds exactly P_syn to the time of the burn, and nothing else changes.`)}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.5</span>${T`The corridor and how steep the sensitivities are`}</h2>
          <div class="prose">
            <p>${T`The corridor is about 55 km in perigee altitude: a flight-path angle of −5.3° at its shallow edge (perigee about 65 km), −7.4° at its steep edge (perigee about 12 km). Shallower and the spacecraft skims the atmosphere and skips back out to space. Steeper and the deceleration is too high. Each kilometre of perigee changes the entry angle by about 0.04°.`}</p>
            <p>${T`Now see how the burn controls the perigee. In the lab model, 1 m/s of error in the burn Δv moves the perigee by about 150 km. One degree of burn position, which is about 20 seconds of timing, moves it by about 1 270 km. The corridor is 55 km: the burn must be right to a fraction of a metre per second and a second or so. No engine and no clock is that good. The way home therefore includes <b>midcourse corrections</b>, the subject of the Apollo navigation in module ${Progress.code('moon')} on the way out as well: tracking measures where the spacecraft really goes, and a burn of a few metres per second, long after the main burn, moves the perigee back into the slot.`}</p>
            <p>${T`The earlier the correction, the less speed it needs, because a small change has more time to grow. In the lab, a correction 24 hours after the burn gives about 50 km of perigee per m/s; 48 hours after, about 25 km per m/s.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.6</span>${T`Free return and Apollo 13`}</h2>
          <div class="prose">
            <p>${T`Module ${Progress.code('freereturn')} (section ${App.sec('freereturn', 2)}) told how Apollo 13’s crew got back onto a free return after the oxygen tank failure. For return planning the second burn is the one to study: about two hours after passing the Moon, the lunar module’s descent engine sped the return up, a trans-Earth burn made with the wrong engine. The spacecraft splashed down on 17 April 1970, in the corridor, after a few small midcourse corrections.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.7</span>${T`Lab: the trans-Earth planner`}</h2>
          <div class="prose"><p>${T`Pick a scenario. Choose the Δv of the burn, its position φ in lunar orbit, and the revolution. The plan runs through the patched-conic simulation as you type: the Earth–Moon view shows the whole trajectory, the lunar view shows the burn, and the entry view zooms on the arrival at the Earth, against the corridor. The results show the vacuum perigee, the entry angle, the flight time and the verdict. Where a scenario allows a midcourse correction, enter its time and Δv. Objectives are checked when you press <b>Execute</b>. “Solve φ” hands the burn position to Mission Control, and the corridor objective is then not credited.`}</p></div>
          <div class="lab tl-lab" id="hw">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Trans-Earth planner`}</h3><span class="spacer"></span>
              <div class="seg" id="hw-view" role="group" aria-label="${T`View`}"><button data-v="em" aria-pressed="true">${T`Earth–Moon`}</button><button data-v="moon" aria-pressed="false">${T`Lunar orbit`}</button><button data-v="entry" aria-pressed="false">${T`Entry`}</button></div>
            </div>
            <div class="stage"><canvas id="hw-cv" aria-label="${T`Trans-Earth trajectory: the lunar orbit with the burn point, and the path from the Moon to the Earth`}"></canvas><div class="overlay" id="hw-ov"></div><div class="badge" id="hw-badge"></div></div>
            <div class="tl-side">
              <dl class="readout" id="hw-res"></dl>
              <p class="note" id="hw-note" style="margin:0"></p>
            </div>
            <div class="tl-groups">
              <div class="tl-group">
                <h4>${T`Scenario`}</h4>
                <div class="ctl"><label for="hw-scen"><span>${T`Scenario`}</span></label><select id="hw-scen">${Object.entries(SCEN).map(([k, s]) => `<option value="${k}">${T(s.label)}</option>`).join('')}</select></div>
                <p class="note" id="hw-task" style="margin:0"></p>
              </div>
              <div class="tl-group">
                <h4>${T`Trans-Earth injection`}</h4>
                <div class="mc-fields">
                  <label><span>${T`burn Δv (m/s)`}</span><input type="text" inputmode="decimal" id="hw-dv" autocomplete="off"></label>
                  <label><span>${T`burn position φ (°)`}</span><input type="text" inputmode="decimal" id="hw-phi" autocomplete="off"></label>
                  <label><span>${T`revolution k`}</span><input type="text" inputmode="numeric" id="hw-rev" autocomplete="off"></label>
                </div>
                <div class="btn-row"><button class="btn primary" id="hw-go">${T`Execute`}</button><button class="btn" id="hw-solve">${T`Solve φ`}</button><button class="btn" id="hw-work">${T`Show the working`}</button></div>
                <div class="hw-exec" id="hw-exec" aria-live="polite"></div>
                <dl class="readout" id="hw-steps"></dl>
              </div>
              <div class="tl-group">
                <h4>${T`Midcourse correction`}</h4>
                <div class="mc-fields">
                  <label><span>${T`time after burn (h)`}</span><input type="text" inputmode="decimal" id="hw-mt" autocomplete="off"></label>
                  <label><span>${T`correction Δv (m/s)`}</span><input type="text" inputmode="decimal" id="hw-mdv" autocomplete="off"></label>
                </div>
                <p class="note" id="hw-mnote" style="margin:0"></p>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('homeward', { math: 'vectors', mathLabel: N`Subtracting velocity vectors.` })}`;

      mountPlanner(page.querySelector('#hw'));
      Practice.embed(page.querySelector('#practice-slot'), 'homeward', 3);
    },
  });

  function mountPlanner(root) {
    const $ = (sel) => root.querySelector(sel);
    const num = (id) => { const s = String($(id).value).replace(/\s|\u202f/g, '').replace('−', '-').replace(',', '.'); if (s === '') return NaN; const v = Number(s); return isFinite(v) ? v : NaN; };
    const set = (id, v) => { $(id).value = UI.dec(String(v)); };
    const view = UI.canvas($('#hw-cv'), null);
    let scenKey = 'nominal', sc = SCEN.nominal, res = null, mode = 'em', peeked = false, assisted = false, bad = false;

    function load() {
      sc = SCEN[scenKey];
      set('#hw-dv', sc.dv); set('#hw-phi', sc.phi); set('#hw-rev', sc.rev); set('#hw-mt', 24); set('#hw-mdv', 0);
      ['#hw-mt', '#hw-mdv'].forEach((id) => { $(id).disabled = !sc.mcc; });
      peeked = false; assisted = false;
      $('#hw-task').textContent = T(sc.task);
      $('#hw-steps').innerHTML = `<dt></dt><dd class="note" style="text-align:left">${T`The working appears here. Using it disables the Δv objective for this scenario.`}</dd>`;
      $('#hw-mnote').textContent = sc.mcc ? T`Positive Δv is sideways, in the direction of motion around the Earth: it raises the perigee. Only possible after the spacecraft has left the Moon’s sphere of influence.` : T`This scenario has no midcourse correction.`;
      run(false);
    }

    function inputs() {
      const dv = num('#hw-dv'), phi = num('#hw-phi'), rev = Math.round(num('#hw-rev'));
      const mt = sc.mcc ? num('#hw-mt') : NaN, mdv = sc.mcc ? num('#hw-mdv') : 0;
      return { dv, phi, rev, mt, mdv };
    }

    function run(execute) {
      const q = inputs();
      bad = !(isFinite(q.dv) && isFinite(q.phi) && q.rev >= 1 && q.rev <= 20);
      if (bad) { res = null; render(q); view.redraw(); return; }
      const opts = { alt: sc.alt, dv: q.dv, phi: q.phi, rev: q.rev, dvErr: sc.err };
      if (sc.mcc && isFinite(q.mt) && isFinite(q.mdv) && q.mdv !== 0) opts.mcc = { dt: q.mt * 3600, dv: q.mdv };
      res = Ph.fly(opts);
      res.opts = opts;
      render(q);
      view.redraw();
      if (execute) report(q, credit(q)); else $('#hw-exec').textContent = '';
    }

    // after Execute: what was flown, the result, and for each objective of this scenario whether it counted
    function report(q, checks) {
      const el = $('#hw-exec'), v = VERDICT[res.outcome];
      const head = T`Burn executed: Δv ${f(q.dv, 1)} m/s at φ = ${f(q.phi, 2)}°, revolution ${q.rev}. Result: ${T(v[0])}.`;
      el.innerHTML = `<b>${head}</b><ul>${checks.map(([ok, t]) => `<li><span class="verdict ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</span> ${t}</li>`).join('')}</ul>`;
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    }

    // award the objectives this run meets; return [met, explanation] per objective that applies to the scenario
    function credit(q) {
      const r = res, ref = Ph.handMinEnergy(sc.alt, 40e3), inCorr = r.outcome === 'corridor', out = [];
      const check = (id, ok, yes, no) => { if (ok) Progress.done('homeward', id); out.push([ok, ok ? yes : no]); };
      if (scenKey === 'nominal') check('dv', !peeked && Math.abs(q.dv - ref.dv) <= 3, T`Δv objective: your Δv matches the minimum-energy burn.`,
        peeked ? T`Δv objective: not counted, the working was shown for this scenario.` : T`Δv objective: your Δv is not within 3 m/s of the minimum-energy burn. Check the hand calculation.`);
      if (scenKey !== 'disp') check('corr', !assisted && !r.mccT && inCorr, T`Corridor objective: you placed the burn yourself and the entry is in the corridor.`,
        assisted ? T`Corridor objective: not counted, φ came from Solve φ.` : T`Corridor objective: the entry is not in the corridor yet.`);
      if (scenKey === 'landing') check('rev', inCorr && r.tEI != null && Math.abs(r.tEI - sc.target) <= sc.window, T`Revolution objective: splashdown is inside the window, in the corridor.`,
        !inCorr ? T`Revolution objective: get the entry into the corridor first.` : T`Revolution objective: splashdown is outside the window. Try another revolution.`);
      if (scenKey === 'disp') check('mcc', !!r.mccT && Math.abs(q.mdv) <= 4 && inCorr, T`Correction objective: the midcourse correction brought the entry back into the corridor.`,
        !r.mccT ? T`Correction objective: no midcourse correction was executed.` : Math.abs(q.mdv) > 4 ? T`Correction objective: the correction is larger than 4 m/s.` : T`Correction objective: the entry is not in the corridor yet.`);
      return out;
    }

    const VERDICT = {
      corridor: [N`In the corridor`, 'good'], shallow: [N`Skip out: too shallow`, 'warn'], steep: [N`Too steep`, 'bad'],
      miss: [N`Perigee above the atmosphere: no entry`, 'warn'], escape: [N`Does not return`, 'bad'], captured: [N`Stays in lunar orbit: Δv too low`, 'bad'],
    };

    function render(q) {
      const dl = $('#hw-res'), b = $('#hw-badge');
      if (!res) { dl.innerHTML = ''; b.textContent = T`Enter numbers`; b.className = 'badge'; $('#hw-note').textContent = T`Enter the Δv, the burn position and the revolution as numbers (revolution 1 to 20).`; $('#hw-ov').textContent = ''; return; }
      const r = res, v = VERDICT[r.outcome], sensDv = Ph.sensitivity({ ...r.opts, dvErr: 0, mcc: undefined }, 'dv', 0.1), sensPhi = Ph.sensitivity({ ...r.opts, dvErr: 0, mcc: undefined }, 'phi', 0.005);
      const far = Math.abs(((q.phi + 180 + 360 * 100) % 360) - 180) < r.lo.losPhi * deg;
      const rows = [
        [T`Burn at`, UI.fmtTime(r.t0)], [T`Earth contact at the burn`, far ? T`lost (far side)` : T`in contact`],
        [T`Moon departure speed v∞`, r.hyp ? `${f(r.vinf, 0)} m/s` : '—'],
        [T`Vacuum perigee altitude`, r.periAlt != null ? `${f(r.periAlt / 1e3, 0)} km` : '—'],
        [T`Entry angle`, r.gamma != null ? `${f(r.gamma, 2)}°` : '—'], [T`Entry speed`, r.vEI ? `${f(r.vEI / 1e3, 2)} km/s` : '—'],
        [T`Flight time`, r.tof != null ? `${hrs(r.tof)} h` : '—'], [T`Splashdown after marker`, r.tEI != null ? `${hrs(r.tEI)} h` : '—'],
      ];
      dl.innerHTML = rows.map(([k, x], i) => `<dt>${k}</dt><dd${i === 3 || i === 4 ? ' class="hl"' : ''}>${x}</dd>`).join('') +
        `<dt class="sub" style="grid-column:1/-1">${T`Sensitivity of the perigee`}</dt><dt>${T`per m/s of burn Δv`}</dt><dd>${f(sensDv, 0)} km</dd><dt>${T`per 0.01° of position`}</dt><dd>${f(sensPhi * 0.01, 1)} km</dd>`;
      b.textContent = T(v[0]); b.className = 'badge ' + v[1];
      const notes = [];
      if (sc.target != null && r.tEI != null) { const d = (r.tEI - sc.target) / 3600; notes.push(T`Requested splashdown: ${hrs(sc.target)} h ± ${hrs(sc.window)} h. Yours is ${f(Math.abs(d), 1)} h ${d >= 0 ? T`late` : T`early`}.`); }
      if (scenKey === 'fast' && r.tof != null) notes.push(r.tof <= 52 * 3600 ? T`Mission rule met: ${hrs(r.tof)} h is within 52 h.` : T`Mission rule: 52 h. This return takes ${hrs(r.tof)} h.`);
      if (r.outcome === 'shallow' || r.outcome === 'miss') notes.push(T`Perigee too high: raise the burn Δv slightly, or shift φ, or correct on the way.`);
      if (r.outcome === 'steep') notes.push(T`Perigee too low: the entry is too steep.`);
      if (q.mt != null && isFinite(q.mt) && sc.mcc && q.mdv && !r.mccT) notes.push(T`The correction is not executed: it must come after the spacecraft leaves the Moon’s sphere of influence (about ${hrs(r.tSOI - r.t0)} h after the burn) and before entry.`);
      if (r.mccT) notes.push(T`Correction executed ${hrs(r.mccT - r.t0)} h after the burn.`);
      if (sc.mcc && !q.mdv && r.outcome !== 'corridor' && res.mccT == null) {
        const s = Ph.sensitivity({ ...r.opts, mcc: { dt: Math.max(q.mt, 0) * 3600 || 86400, dv: 0 } }, 'mcc', 0.1);
        notes.push(T`Tracking: perigee ${f(r.periAlt / 1e3, 0)} km against 40 km wanted. A correction at ${f(q.mt, 0)} h moves the perigee by about ${f(s, 0)} km per m/s.`);
      }
      $('#hw-note').textContent = notes.join(' ');
      $('#hw-ov').textContent = `${T`Moon’s speed`} ${f(Ph.VM, 0)} m/s`;
    }

    function showWorking() {
      peeked = true;
      const h = Ph.handMinEnergy(sc.alt, 40e3), q = inputs(), g = isFinite(q.dv) ? Ph.handGivenDv(sc.alt, q.dv) : null;
      const rows = [
        [T`return ellipse a`, `${f(h.a / 1e3, 0)} km`], [T`apogee speed v_a`, `${f(h.va, 1)} m/s`], [T`Moon’s speed v_M`, `${f(h.vM, 1)} m/s`], [T`excess speed v∞`, `${f(h.vinf, 1)} m/s`],
        [T`circular speed v_c`, `${f(h.vc, 1)} m/s`], [T`speed on hyperbola`, `${f(h.vhyp, 1)} m/s`], ['Δv', `${f(h.dv, 1)} m/s`], ['e', f(h.e, 3)], ['θ∞', `${f(h.thInf * deg, 1)}°`], [T`φ ≈ θ∞ − 90°`, `${f(h.phi, 1)}°`], [T`flight time`, `${f(h.tof / 3600, 1)} h`],
      ];
      if (g) rows.push([T`hand φ at your Δv`, `${f(g.phi, 1)}°`], [T`hand flight time at your Δv`, `${f(g.tof / 3600, 1)} h`]);
      $('#hw-steps').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    }

    function solve() {
      const q = inputs();
      if (!isFinite(q.dv)) return;
      const roots = Ph.solvePhi({ alt: sc.alt, dv: q.dv });
      if (!roots.length) { $('#hw-note').textContent = T`No burn position gives a perigee of 40 km with this Δv.`; return; }
      set('#hw-phi', roots[0].toFixed(3)); assisted = true; run(false);
    }

    // ---- drawing ----
    view.draw = (ctx, w, h) => {
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, K, 80);
      if (!res) return;
      if (mode === 'em') drawEM(ctx, w, h, K); else if (mode === 'moon') drawMoon(ctx, w, h, K); else drawEntry(ctx, w, h, K);
    };
    function drawEM(ctx, w, h, K) {
      const r = res, cx = w * 0.42, cy = h / 2, s = Math.min(w * 0.58, h / 2 - 14) / (Ph.D * 1.02);
      const P = (x, y) => [cx + x * s, cy - y * s];
      ctx.strokeStyle = K.line; ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.arc(cx, cy, Ph.D * s, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      UI.drawEarth(ctx, cx, cy, Math.max(4, Ph.RE * s * 4), K);
      ctx.font = `10px ${K.mono}`; ctx.textAlign = 'left'; ctx.fillStyle = K.muted;
      ctx.fillText(T`Earth`, cx + 8, cy + 16);
      const m0 = Ph.moonPos(r.t0), m1 = r.tEI != null ? Ph.moonPos(r.tEI) : null;
      const mp = P(...m0);
      UI.drawMoon(ctx, mp[0], mp[1], Math.max(3.5, Ph.RM * s * 4), K);
      ctx.fillStyle = K.muted; ctx.fillText(T`Moon at burn`, mp[0] + 8, mp[1] - 8);
      if (m1) { const q = P(...m1); ctx.strokeStyle = K.muted; ctx.beginPath(); ctx.arc(q[0], q[1], 4, 0, 7); ctx.stroke(); ctx.fillStyle = K.muted; ctx.fillText(T`Moon at entry`, q[0] + 8, q[1] + 12); }
      const pts = Ph.samples(r, 400);
      if (pts.length) {
        ctx.lineWidth = 2;
        let prev = null;
        for (const p of pts) {
          const c = P(p.x, p.y);
          if (prev) { ctx.strokeStyle = p.phase === 'M' ? K.accent : p.phase === 'E2' ? K.trace2 : K.trace; ctx.beginPath(); ctx.moveTo(...prev); ctx.lineTo(...c); ctx.stroke(); }
          prev = c;
        }
      }
      if (r.mccState) { const c = P(r.mccState[0], r.mccState[1]); ctx.fillStyle = K.warn; ctx.beginPath(); ctx.arc(c[0], c[1], 4, 0, 7); ctx.fill(); ctx.fillText('MCC', c[0] + 6, c[1] - 6); }
      ctx.fillStyle = K.muted; ctx.textAlign = 'center';
      ctx.fillText(T`Earth and Moon not to scale; the path is drawn to scale`, w / 2, h - 10);
    }
    function drawMoon(ctx, w, h, K) {
      const r = res, lo = r.lo, cx = w / 2, cy = h / 2, s = Math.min(w, h) / 2 / (5 * RM) * 1.0;
      const rot = -Ph.W * r.t0, cs = Math.cos(rot), sn = Math.sin(rot);
      const P = (x, y) => [cx + (x * cs - y * sn) * s, cy - (x * sn + y * cs) * s];
      UI.drawMoon(ctx, cx, cy, RM * s, K);
      // Earth direction and far-side midpoint
      ctx.strokeStyle = K.line; ctx.setLineDash([3, 5]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - RM * s * 4.8, cy); ctx.lineTo(cx + RM * s * 4.8, cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = `10px ${K.mono}`; ctx.fillStyle = K.muted; ctx.textAlign = 'left'; ctx.fillText(T`far side`, cx + RM * s * 3.4, cy - 6); ctx.textAlign = 'right'; ctx.fillText(T`towards Earth`, cx - RM * s * 3.4 + 40, cy - 6);
      // orbit; the part out of contact with the Earth is drawn thicker
      ctx.lineWidth = 1.4; ctx.strokeStyle = K.trace;
      ctx.beginPath(); ctx.arc(cx, cy, lo.r * s, 0, 7); ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = K.muted; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(cx, cy, lo.r * s, -lo.losPhi, lo.losPhi); ctx.stroke(); ctx.globalAlpha = 1;
      // burn point: angle φ before far-side midpoint (orbit runs clockwise on this plane, so before = counter-clockwise from +x)
      const ph = (res.opts.phi) / deg, bx = cx + lo.r * s * Math.cos(ph), by = cy - lo.r * s * Math.sin(ph);
      ctx.fillStyle = K.warn; ctx.beginPath(); ctx.arc(bx, by, 5, 0, 7); ctx.fill();
      ctx.textAlign = 'left'; ctx.fillText(`TEI ϕ = ${f(res.opts.phi, 2)}°`, bx + 8, by - 8);
      // hyperbola
      if (r.legM) {
        const L = r.legM; ctx.strokeStyle = K.accent; ctx.lineWidth = 2; ctx.beginPath();
        let first = true;
        for (let i = 0; i <= 160; i++) {
          const nu = L.nu0 + (L.nu1 - L.nu0) * i / 160, st = Ph.stateAt(L.c, nu), c = P(st[0], st[1]);
          if (Math.hypot(c[0] - cx, c[1] - cy) > Math.hypot(w, h)) break;
          if (first) { ctx.moveTo(...c); first = false; } else ctx.lineTo(...c);
        }
        ctx.stroke();
        // Moon’s velocity direction (screen up on the far side) and the asymptote hint
        UI.arrow(ctx, cx + RM * s * 3, cy + 6, cx + RM * s * 3, cy + 6 + 46, K.muted, 1.4);
        ctx.fillStyle = K.muted; ctx.textAlign = 'left'; const lt = T`against the Moon’s motion`; ctx.fillText(lt, Math.min(cx + RM * s * 3 + 8, w - ctx.measureText(lt).width - 6), cy + 46);
      }
      ctx.fillStyle = K.muted; ctx.textAlign = 'center'; ctx.fillText(T`Thick arc: out of contact with the Earth`, w / 2, h - 10);
    }

    // zoom on the arrival: altitude against distance along the ground, every path lined up where it crosses 122 km.
    // The corridor is the fan between the steepest and the shallowest allowed path.
    function drawEntry(ctx, w, h, K) {
      const r = res, X0 = -2200e3, X1 = 2300e3, A0 = -25e3, A1 = 330e3, pad = 22;
      const P = (x, a) => [w * (x - X0) / (X1 - X0), h - pad - (h - pad - 26) * (a - A0) / (A1 - A0)];
      const line = (pts, to) => { ctx.beginPath(); let on = false; for (const [x, a] of pts) { if (a < 0 || a > A1 * 1.05) { on = false; continue; } const q = P(x, a); if (on) ctx.lineTo(...q); else { ctx.moveTo(...q); on = true; } } ctx.stroke(); };
      const cut = (pts, before) => pts.filter(([x]) => (before ? x <= 0 : x >= 0));
      const steep = Ph.entryProfile(Ph.returnConic(Ph.perigeeForGamma(Ph.CORRIDOR.steep)), X0, X1), shallow = Ph.entryProfile(Ph.returnConic(Ph.perigeeForGamma(Ph.CORRIDOR.shallow)), X0, X1);
      const ei = P(0, Ph.REI - RE), g0 = P(0, 0);
      // atmosphere, ground
      const gr = ctx.createLinearGradient(0, ei[1], 0, g0[1]); gr.addColorStop(0, 'transparent'); gr.addColorStop(1, K.trace);
      ctx.globalAlpha = 0.22; ctx.fillStyle = gr; ctx.fillRect(0, ei[1], w, g0[1] - ei[1]); ctx.globalAlpha = 1;
      ctx.fillStyle = K.earth; ctx.fillRect(0, g0[1], w, h - g0[1]);
      ctx.strokeStyle = K.muted; ctx.lineWidth = 1; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(0, ei[1]); ctx.lineTo(w, ei[1]); ctx.stroke(); ctx.setLineDash([]);
      // corridor: filled up to the entry interface, its two edges continued in vacuum
      ctx.fillStyle = K.good; ctx.globalAlpha = 0.2; ctx.beginPath();
      cut(steep, true).forEach(([x, a], i) => { const q = P(x, a); if (i) ctx.lineTo(...q); else ctx.moveTo(...q); });
      cut(shallow, true).reverse().forEach(([x, a]) => ctx.lineTo(...P(x, a)));
      ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = K.good; ctx.lineWidth = 1; line(cut(steep, true)); line(cut(shallow, true));
      ctx.setLineDash([3, 4]); line(cut(steep, false)); line(cut(shallow, false)); ctx.setLineDash([]);
      // the flown path: solid down to 122 km, dashed after (the path it would follow without air)
      ctx.font = `10px ${K.mono}`;
      if (r.cE) {
        const xPeri = 1500e3;   // where the mid-corridor path has its perigee
        const pts = Ph.entryProfile(r.cE, X0, X1, xPeri), col = r.outcome === 'corridor' ? K.trace : r.outcome === 'steep' ? K.bad : K.warn;
        ctx.strokeStyle = col; ctx.lineWidth = 2.2;
        if (r.gamma != null) { line(cut(pts, true)); ctx.setLineDash([5, 5]); line(cut(pts, false)); ctx.setLineDash([]);
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ei[0], ei[1], 4, 0, 7); ctx.fill();
          ctx.textAlign = 'left'; ctx.fillText(`γ = ${f(r.gamma, 2)}°`, ei[0] + 8, ei[1] - 8);
        } else line(pts);
        const low = pts.reduce((b, q) => (q[1] < b[1] ? q : b));
        if (low[1] > 0 && low[1] < A1 && low[0] > X0 && low[0] < X1) { const q = P(...low); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText(T`vacuum perigee ${f(low[1] / 1e3, 0)} km`, q[0], q[1] - 8); }
      }
      ctx.fillStyle = K.muted; ctx.textAlign = 'left';
      ctx.fillText(T`entry interface, 122 km`, 8, ei[1] - 6);
      ctx.fillText(T`atmosphere`, 8, (ei[1] + g0[1]) / 2 + 4);
      ctx.textAlign = 'right';
      ctx.fillText(T`too shallow: skips out`, w - 8, P(X1, shallow[shallow.length - 1][1])[1] - 8 < 14 ? 14 : ei[1] - 6);
      ctx.fillText(T`too steep`, w - 8, g0[1] - 8);
      ctx.fillStyle = K.good; ctx.textAlign = 'left';
      const cl = P(...shallow.reduce((b, q) => (Math.abs(q[1] - 215e3) < Math.abs(b[1] - 215e3) && q[0] < 0 ? q : b), [X0, 1e9]));
      ctx.fillText(T`corridor: ${f(Ph.CORRIDOR.shallow, 1)}° to ${f(Ph.CORRIDOR.steep, 1)}°`, cl[0] + 12, cl[1]);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.fillText(T`Altitude stretched; dashed: the path without air`, w / 2, h - 7);
    }

    // ---- wiring ----
    $('#hw-scen').addEventListener('change', (e) => { scenKey = e.target.value; load(); });
    $('#hw-go').addEventListener('click', () => run(true));
    $('#hw-solve').addEventListener('click', solve);
    $('#hw-work').addEventListener('click', showWorking);
    root.querySelectorAll('#hw-dv, #hw-phi, #hw-rev, #hw-mt, #hw-mdv').forEach((el) => {
      el.addEventListener('input', () => { if (el.id === 'hw-phi') assisted = false; run(false); });
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(true); });
    });
    UI.seg(root, '#hw-view', (v) => { mode = v; $('#hw-ov').hidden = v === 'entry'; view.redraw(); });
    $('#hw-scen').value = scenKey;
    load();
  }
})();
