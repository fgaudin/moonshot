/* Chapter: When to Burn. Phase angles, wait times and ignition times (TIG on the mission clock).
   Lab: a phasing clock. Physics lives in timing.phys.js (Phys_timing). */
(function () {
  'use strict';
  const Pt = window.Phys_timing;
  const R = String.raw;
  const f = UI.fmt;
  const D = 180 / Math.PI;
  const muE = 3.986004418e14, RE = 6.378137e6, muM = 4.9028e12, RM = 1.7374e6;
  const rnd = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;

  Progress.register('timing', {
    name: N`When to Burn`, topic: 'timing', glyph: 'clock',
    briefing: N`A perfect burn at the wrong moment sends you to the right orbit while your target is on the other side of the planet, {name}. In this module you compute when to start a maneuver so that you arrive where the target will be: the required phase angle, the wait, and the ignition time on the mission clock.`,
    objectives: [
      { id: 'phase', text: N`Type the required phase angle for a Hohmann rendezvous, within 1°` },
      { id: 'tig', text: N`Choose a TIG that brings the chaser to the target within the set miss distance (Earth orbit or lunar orbit)` },
      { id: 'above', text: N`Solve the case where the chaser is above the target (wait direction)` },
      { id: 'long', text: N`Solve the long wait, where the synodic period matters` },
      { id: 'qual', text: N`Qualify: answer 2 timing problems correctly` },
    ],
    debrief: N`You can now say not only how to burn but when, and you know why the lower orbit always catches up, {name}. Next the orbit plane: what changes when the target is not in yours.`,
  });

  /* ---------------- Primer ---------------- */
  Primer.register('wrap', {
    title: N`Angles that wrap around`, used: N`Phase angles, wait times, synodic periods`,
    html: [
      N`<p>An angle repeats every 360°. A spacecraft that is 350° ahead of its target is also 10° behind it. Adding or subtracting whole turns changes nothing about the geometry, so a calculation can end with any number of turns attached.</p>`,
      N`<p>To clean it up, add or subtract 360° until the result is in the range you want. “Modulo 360°” means the remainder after removing whole turns: 400° becomes 40°, and −30° becomes 330°. For a <b>signed</b> phase angle, use the range −180° to +180°: positive means the target is ahead, negative means behind.</p>`,
      R`\[ \varphi \bmod 360^\circ \in [0^\circ, 360^\circ), \qquad -30^\circ \to 330^\circ,\quad 400^\circ \to 40^\circ \]`,
      N`<p>The same idea works for time. If the phase angle repeats every synodic period, a wait of 40 hours in a 14-hour cycle is the same as 12 hours. Waiting for the next time the geometry is right never needs more than one cycle.</p>`,
    ],
  });

  /* ---------------- Practice ---------------- */
  const hms = (min) => UI.fmtTime(min * 60);
  const circ = () => { const h1 = rnd(180, 400, 10), h2 = rnd(500, 1200, 50); return { h1, h2, r1: RE + h1 * 1e3, r2: RE + h2 * 1e3 }; };
  const registerPractice = () => Practice.register('timing', N`Timing`, [
    { title: N`Mean motion`, make() {
      const h = rnd(200, 900, 10), r = RE + h * 1e3, n = Pt.meanMotion(muE, r), ans = n * D * 60;
      return { q: T`A spacecraft is in a circular orbit at <b>${h} km</b> altitude around the Earth (μ = 398 600 km³/s², R = 6 378 km). What is its mean motion in degrees per minute?`, answer: ans, unit: '°/min', tol: 0.01,
        hint: T`n = √(μ/a³), with a = R + h in the same length unit as μ. Convert radians per second to degrees per minute at the end.`,
        sol: R`\[ n = \sqrt{\frac{\mu}{a^3}} = \sqrt{\frac{398600}{${f(r / 1e3, 0)}^3}} = ${f(n * 1e3, 4)}\times10^{-3}\ \mathrm{rad/s} = ${f(ans, 3)}\ ^\circ/\mathrm{min} \]` };
    } },
    { title: N`Hohmann transfer time`, make() {
      const { h1, h2, r1, r2 } = circ(), t = Pt.hohmannTime(muE, r1, r2) / 60, at = (r1 + r2) / 2;
      return { q: T`A spacecraft transfers by a Hohmann ellipse from a circular orbit at <b>${h1} km</b> to a circular orbit at <b>${h2} km</b> altitude (Earth). How long does the half-ellipse take?`, answer: t, unit: 'min', tol: 0.01,
        hint: T`The transfer time is half the period of the transfer ellipse, whose semi-major axis is the mean of the two radii (measured from the centre).`,
        sol: R`\[ a_t = \frac{r_1 + r_2}{2} = ${f(at / 1e3, 1)}\ \mathrm{km},\qquad t_t = \pi\sqrt{\frac{a_t^3}{\mu}} = ${f(t * 60, 0)}\ \mathrm{s} = ${f(t, 2)}\ \mathrm{min} \]` };
    } },
    { title: N`Required phase angle`, make() {
      const { h1, h2, r1, r2 } = circ(), tt = Pt.hohmannTime(muE, r1, r2), n2 = Pt.meanMotion(muE, r2), ph = Pt.requiredPhase(muE, r1, r2) * D;
      return { q: T`A chaser in a circular orbit at <b>${h1} km</b> will transfer to the target’s circular orbit at <b>${h2} km</b> by a Hohmann transfer. By what angle must the target lead the chaser at the moment of the first burn? Give the angle in degrees.`, answer: ph, unit: '°', tol: 0.02,
        hint: T`During the transfer the chaser travels 180°. The target travels n₂·t<sub>t</sub>. The target must start the difference ahead.`,
        sol: R`\[ t_t = ${f(tt, 0)}\ \mathrm{s},\quad n_2 = ${f(n2 * 1e3, 4)}\times10^{-3}\ \mathrm{rad/s},\quad \varphi = 180^\circ - n_2 t_t = 180^\circ - ${f(n2 * tt * D, 2)}^\circ = ${f(ph, 2)}^\circ \]` };
    } },
    { title: N`Wait for the window`, make() {
      const { h1, h2, r1, r2 } = circ(), n1 = Pt.meanMotion(muE, r1), n2 = Pt.meanMotion(muE, r2), req = Pt.requiredPhase(muE, r1, r2) * D;
      const now = Math.round(req + rnd(15, 110)), wait = Pt.waitTime(now / D, req / D, n1, n2) / 60;
      return { q: T`A chaser at <b>${h1} km</b> will do a Hohmann transfer to a target at <b>${h2} km</b> (both circular, same plane, same direction). The target is now <b>${now}°</b> ahead of the chaser. How many minutes until the burn?`, answer: wait, unit: 'min', tol: 0.02,
        hint: T`The lower chaser is faster, so the phase angle shrinks at n₁ − n₂. Find the required angle first, then divide the difference by the closing rate.`,
        sol: R`\[ \varphi_{req} = ${f(req, 2)}^\circ,\quad n_1 - n_2 = ${f((n1 - n2) * D * 60, 4)}\ ^\circ/\mathrm{min},\quad t = \frac{${f(now, 0)}^\circ - ${f(req, 2)}^\circ}{n_1 - n_2} = ${f(wait, 1)}\ \mathrm{min} \]` };
    } },
    { title: N`Required phase at liftoff`, make() {
      const hL = rnd(15, 20), hC = rnd(100, 120, 5), tA = rnd(400, 480, 10), dd = rnd(250, 400, 10);
      const L = Pt.liftoff(muM, RM, hL * 1e3, hC * 1e3, tA, dd * 1e3 / RM), ph = L.phiLift * D, nC = L.nC * D * 60;
      return { q: T`An LM lifts off from the Moon (μ = 4 902.8 km³/s², R = 1 737.4 km). The ascent takes <b>${tA} s</b>, covers <b>${dd} km</b> over the ground and ends in a circular orbit at <b>${hL} km</b>. The LM then flies a Hohmann transfer to the CSM’s circular orbit at <b>${hC} km</b>. Ignore the Moon’s rotation. By what angle must the CSM be ahead of the launch site at liftoff? Give the angle in degrees (negative if it must be behind).`, answer: ph, unit: '°', tol: 0.02,
        hint: T`The LM arrives at θ<sub>asc</sub> + 180° after t<sub>asc</sub> + t<sub>H</sub>. The CSM moves n<sub>C</sub> times that time. It must start the difference behind the arrival point.`,
        sol: R`\[ \theta_{asc} = \frac{${dd}}{1737.4} = ${f(dd / RM * 1e3 * D, 2)}^\circ,\quad t_H = ${f(L.tH, 0)}\ \mathrm{s},\quad n_C = ${f(nC, 4)}\ ^\circ/\mathrm{min} \]\[ \varphi_{lift} = \theta_{asc} + 180^\circ - n_C(t_{asc} + t_H) = ${f(dd / RM * 1e3 * D, 2)}^\circ + 180^\circ - ${f(L.nC * (tA + L.tH) * D, 2)}^\circ = ${f(ph, 2)}^\circ \]` };
    } },
    { title: N`Liftoff time from the overhead pass`, make() {
      const hL = rnd(15, 20), hC = rnd(100, 120, 5), tA = rnd(400, 480, 10), dd = rnd(250, 400, 10), pass = rnd(100, 130) * 3600 + rnd(0, 59) * 60;
      const L = Pt.liftoff(muM, RM, hL * 1e3, hC * 1e3, tA, dd * 1e3 / RM), delay = Pt.liftoffDelay(L.phiLift, 0, L.nC), nC = L.nC * D * 60;
      return { q: T`An LM on the Moon will lift off for a direct ascent: <b>${tA} s</b> of climb over <b>${dd} km</b> of ground to a circular orbit at <b>${hL} km</b>, then a Hohmann transfer to the CSM at <b>${hC} km</b> (ignore the Moon’s rotation). The CSM passes directly overhead at GET <b>${Pt.fmtGET(pass)}</b>. How many minutes after that pass is liftoff? Give the first liftoff time after the pass.`, answer: delay / 60, unit: 'min', tol: 0.01,
        hint: T`Find φ<sub>lift</sub> first, then bring it into 0° to 360° and divide by the CSM’s rate. The result is less than one CSM period.`,
        sol: R`\[ \varphi_{lift} = ${f(L.phiLift * D, 2)}^\circ \to ${f(Pt.wrap(L.phiLift) * D, 2)}^\circ,\qquad t = \frac{${f(Pt.wrap(L.phiLift) * D, 2)}^\circ}{${f(nC, 4)}\ ^\circ/\mathrm{min}} = ${f(delay / 60, 2)}\ \mathrm{min}\ \Rightarrow\ \mathrm{GET} = ${Pt.fmtGET(pass + delay)} \]` };
    } },
    { title: N`Coast after an imperfect insertion`, make() {
      const hL = rnd(15, 20), hC = rnd(100, 120, 5), ex = rnd(10, 60) / 10;
      const nL = Pt.meanMotion(muM, RM + hL * 1e3) * D * 60, nC = Pt.meanMotion(muM, RM + hC * 1e3) * D * 60, tc = ex / (nL - nC);
      return { q: T`An LM has reached a circular lunar orbit at <b>${hL} km</b>. The CSM is in a circular orbit at <b>${hC} km</b>. The LM will fly a Hohmann transfer up to it. Navigation shows that the CSM is <b>${f(ex, 1)}°</b> further ahead than the angle required for the transfer to start now. How many minutes must the LM coast in the low orbit before the Hohmann burn?`, answer: tc, unit: 'min', tol: 0.02,
        hint: T`The LM is in the lower orbit, so it gains on the CSM at the difference of the two rates. Divide the excess angle by that rate.`,
        sol: R`\[ n_L - n_C = ${f(nL, 4)} - ${f(nC, 4)} = ${f(nL - nC, 4)}\ ^\circ/\mathrm{min},\qquad t_c = \frac{${f(ex, 1)}^\circ}{${f(nL - nC, 4)}\ ^\circ/\mathrm{min}} = ${f(tc, 1)}\ \mathrm{min} \]` };
    } },
    { title: N`Synodic period`, make() {
      const h1 = rnd(200, 500, 10), h2 = rnd(600, 1500, 50), n1 = Pt.meanMotion(muE, RE + h1 * 1e3), n2 = Pt.meanMotion(muE, RE + h2 * 1e3), syn = Pt.synodic(n1, n2) / 3600;
      return { q: T`Two spacecraft orbit the Earth in the same plane and direction, in circular orbits at <b>${h1} km</b> and <b>${h2} km</b>. How many hours pass between two successive moments when they are lined up the same way (the synodic period)?`, answer: syn, unit: 'h', tol: 0.02,
        hint: T`The phase angle changes by 360° in one synodic period, at the rate n₁ − n₂.`,
        sol: R`\[ n_1 = ${f(n1 * 1e3, 4)}\times10^{-3},\ n_2 = ${f(n2 * 1e3, 4)}\times10^{-3}\ \mathrm{rad/s},\qquad T_{syn} = \frac{2\pi}{n_1 - n_2} = ${f(syn * 3600, 0)}\ \mathrm{s} = ${f(syn, 2)}\ \mathrm{h} \]` };
    } },
  ], [
    { q: N`A chaser in a lower circular orbit and a target in a higher one start with the target ahead. Why does the chaser catch up?`, opts: [N`The lower orbit has the larger angular rate (shorter period), so the angle between them shrinks`, N`The lower orbit has the lower speed`, N`Gravity is weaker at the target’s altitude, so it slows down`, N`The chaser’s engine pushes it forward`], a: 0, why: N`Circular speed falls with altitude, but the angular rate falls faster: n = √(μ/r³). The lower spacecraft goes round more often and closes the angle.` },
    { q: N`The chaser is in the higher orbit. Where must the target be at the start of a Hohmann transfer down to its orbit?`, opts: [N`Behind the chaser: the phase angle (target minus chaser) is negative`, N`Ahead of the chaser, as for a transfer upward`, N`Exactly opposite the chaser`, N`Anywhere: the transfer time does not depend on it`], a: 0, why: N`In the flight time the target, on the faster lower orbit, covers more than 180°, while the chaser covers exactly 180°. So the target must start behind by the difference.` },
    { q: N`A burn lasts 2 minutes and its burn point, the instant of the impulsive plan, is 04:26:53. What TIG goes on the PAD?`, opts: [N`04:25:53, one minute early, so the burn is centred on the burn point`, N`04:26:53, exactly`, N`04:28:53, after the burn point`, N`04:24:53, one burn time early`], a: 0, why: N`The plan assumes an impulse at the burn point. A burn centred on that moment ignites half a burn time early, and the TIG on a PAD is the ignition time.` },
  ]);
  registerPractice();

  /* ---------------- Lab scenarios ---------------- */
  const S0 = Pt.SCENARIOS;
  const SCEN = {
    leo: { sc: S0.leo, tolKm: 100, label: N`LEO to a higher orbit`, obj: 'tig',
      task: N`The chaser is at 200 km and the target at 700 km, ahead. Compute the phase angle needed, the wait and the TIG.` },
    above: { sc: S0.above, tolKm: 100, label: N`Chaser above the target`, obj: 'above',
      task: N`The chaser is at 900 km, the target at 400 km. It must go down. Decide which way the phase angle moves, then find the TIG.` },
    long: { sc: S0.long, tolKm: 100, label: N`Long wait (synodic period)`, obj: 'long',
      task: N`Two close orbits, 250 km and 400 km, and the target is just short of the right angle. The phase angle changes slowly. Mind the synodic period.` },
    lunar: { sc: S0.lunar, tolKm: 30, label: N`Lunar orbit: LM and CSM`, obj: 'tig',
      task: N`The LM is in an 18 km lunar orbit, the CSM at 111 km. Same method, with the Moon’s μ. The GET is far into the mission.` },
    ascent: { sc: S0.ascent, tolKm: 30, label: N`Lunar liftoff to the CSM`, obj: 'tig',
      task: N`The LM is on the surface, the CSM at 110 km passes overhead at the fix. The ascent takes 7 min and covers 300 km (low orbit at 15 km); then a Hohmann transfer to the CSM. Compute φ and the liftoff time (type it as TIG).`,
    },
  };

  App.chapter({
    id: 'timing', phase: N`Timing`, title: N`When to Burn`, lab: N`Phasing clock`,
    blurb: N`Phase angles, waiting times and ignition times: how to arrive where the target will be.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('timing')} · Timing`,
          title: T`When to Burn`,
          lede: T`The transfer orbit tells you where to go and how hard to push. It does not tell you when. Start too early or too late and you arrive at the right place while the target is somewhere else. This module computes the moment.`,
          refs: [T`Sellers · Understanding Space`, T`BMW · Fundamentals of Astrodynamics`],
        })}
        ${Progress.briefing('timing', { theory: 'theory', lab: 'pc', math: 'refresher', mathLabel: N`Angles that wrap around.` })}

        <section class="section" id="theory">
          <h2><span class="idx">0.1</span>${T`Two clocks of different speed`}</h2>
          <div class="prose">
            <p>${T`In a circular orbit the spacecraft sweeps the same angle every second. That rate is the <b>mean motion</b>. Kepler’s third law gives it from the radius alone:`}</p>
            <div class="eq">\\[ n = \\sqrt{\\frac{\\mu}{a^3}} = \\frac{2\\pi}{T} \\]</div>
            ${Sym.where(['n', 'mu', 'a', 'T'], N`For a circular orbit a is the radius from the centre of the planet (surface radius plus altitude).`)}
            <p>${T`At 200 km the Earth gives 4.068° per minute (period 88.5 min); at 700 km, 3.645° per minute (98.8 min). The higher spacecraft is slower in speed and slower in angle. Two spacecraft at different heights therefore drift apart or together at the difference of their rates. Measure the <b>phase angle</b> φ from the chaser to the target, in the direction of motion: positive when the target is ahead.`}</p>
            <div class="eq">\\[ \\varphi = \\theta_{target} - \\theta_{chaser}, \\qquad \\dot\\varphi = n_{target} - n_{chaser} \\]</div>
            ${Sym.where([['\\varphi', N`phase angle: how far the target is ahead of the chaser, seen from the centre (negative: behind)`, 'rad or °'], ['\\theta', N`angular position of each spacecraft around the planet`, 'rad or °'], ['\\dot\\varphi', N`rate of change of the phase angle`, 'rad/s'], ['n', N`mean motion of each orbit`, 'rad/s']], N`A dot over a letter means “change per second”.`)}
            <p>${T`This is why the <b>lower orbit catches up</b>. If the chaser is below the target, n<sub>chaser</sub> is larger, so φ shrinks: the target ahead is slowly approached. If the chaser is above, φ grows: a target behind slowly falls further behind and a target ahead pulls away, until a full turn comes round.`}</p>
            ${Primer.box('wrap', false, 'refresher')}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.2</span>${T`The phase angle a Hohmann transfer needs`}</h2>
          <div class="prose">
            <p>${T`Module ${Progress.code('maneuvers')} (section ${App.sec('maneuvers', 1)}) gave the transfer ellipse and its time. The chaser fires, flies half the ellipse (180° of angle) and arrives at the other apsis after the transfer time. The target must be exactly there at that moment. During the flight the target moves n<sub>t</sub>·t<sub>t</sub>, so at the burn it must be ahead of the chaser by the rest:`}</p>
            <div class="eq">\\[ t_t = \\pi\\sqrt{\\frac{a_t^3}{\\mu}}, \\qquad a_t = \\frac{r_1 + r_2}{2}, \\qquad \\varphi_{req} = \\pi - n_{target}\\,t_t \\]</div>
            ${Sym.where([['t_t', N`transfer time: half the period of the transfer ellipse`, 's'], 'at', 'r1', 'r2', ['\\varphi_{req}', N`phase angle needed at the burn (target minus chaser, in the direction of motion)`, 'rad'], ['n_{target}', N`mean motion of the target’s orbit (the orbit being flown to)`, 'rad/s']], N`The same formula serves a transfer down: n<sub>target</sub> is then the faster rate of the lower orbit and φ<sub>req</sub> comes out negative.`)}
            <p>${T`Example, from 200 km up to 700 km: t<sub>t</sub> = 46.79 min. The target moves 3.645° per minute × 46.79 min = 170.55°. So φ<sub>req</sub> = 180° − 170.55° = 9.45°. The target is only 9.45° ahead at the burn, about 1 000 km along the orbit.`}</p>
            <p>${T`Going down (chaser above), the same formula gives a negative angle. At 900 km down to 400 km, φ<sub>req</sub> = −10.05°: the target must be a little <i>behind</i>, because it is the faster one and the chaser needs to arrive where it will be.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.3</span>${T`How long to wait`}</h2>
          <div class="prose">
            <p>${T`Measure the phase angle now, φ<sub>now</sub>. It moves at φ̇ = n<sub>target</sub> − n<sub>chaser</sub>, a constant rate, so the time until it equals φ<sub>req</sub> is a division. The result must be positive and less than one cycle; if the geometry has just passed, the next chance comes one full cycle later, the <b>synodic period</b>:`}</p>
            <div class="eq">\\[ t_{wait} = \\frac{\\varphi_{now} - \\varphi_{req}}{n_{chaser} - n_{target}} \\bmod T_{syn}, \\qquad T_{syn} = \\frac{2\\pi}{|n_{chaser} - n_{target}|} \\]</div>
            ${Sym.where([['t_{wait}', N`time from the measurement until the burn`, 's'], ['\\varphi_{now}', N`phase angle at the measurement`, 'rad'], ['T_{syn}', N`synodic period: time between two identical geometries`, 's']], N`Do the subtraction in angle, then add or subtract whole turns (360°) until the angle lies in [0°, 360°) before dividing. Chaser above the target: swap the roles, so the numerator is φ<sub>req</sub> − φ<sub>now</sub>, because φ then grows.`)}
            <p>${T`Example: φ<sub>now</sub> = 42°, φ<sub>req</sub> = 9.45°. The closing rate is 4.068 − 3.645 = 0.4233° per minute, so t<sub>wait</sub> = 32.55° / 0.4233 = 76.9 min. The synodic period of this pair is 14.2 h. Had φ<sub>now</sub> been 8°, the answer is almost a whole synodic period: 360° − 1.45° = 358.55° divided by the rate, 14.1 h. Close orbits give a small rate, so a long wait is normal.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.4</span>${T`TIG on the mission clock`}</h2>
          <div class="prose">
            <p>${T`The crew and Mission Control talk in <b>ground elapsed time</b>, GET: hours, minutes and seconds since liftoff, hours not wrapped into days. The calculation above gives a wait. Add it to the GET at which the phase angle was measured:`}</p>
            <div class="eq">\\[ \\mathrm{TIG} = \\mathrm{GET}_{fix} + t_{wait} \\]</div>
            ${Sym.where([['\\mathrm{TIG}', N`time of ignition, as GET; for an impulsive burn it is also the burn point`, 's'], ['\\mathrm{GET}_{fix}', N`GET at which φ<sub>now</sub> was measured`, 's'], ['t_{wait}', N`wait from the previous section`, 's']])}
            <p>${T`Example: φ = 42° measured at GET 03:10:00 gives TIG = 03:10:00 + 1 h 16 min 53 s = <b>04:26:53</b>. The phase angle itself is measured from tracking or from the onboard navigation of module ${Progress.code('navigation')}. An error of 1° in φ moves the burn by 1°/(closing rate) = 2.4 minutes here. Small closing rates amplify angle errors into time errors.`}</p>
            <p>${T`A real engine does not fire an impulse. As module ${Progress.code('burns')} (section ${App.sec('burns', 5)}) showed, the engine ignites half a burn time before the burn point: TIG = t<sub>burn point</sub> − t<sub>b</sub>/2. A 2-minute burn whose burn point is 04:26:53 has TIG 04:25:53, and that is the time on the PAD.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.5</span>${T`The Moon moves too`}</h2>
          <div class="prose">
            <p>${T`The same idea sets the moment for the burn that leaves Earth for the Moon. The Moon travels about 13.2° per day around the Earth. The translunar trajectory takes days, so the burn must start when the Moon is the right angle ahead, and the departure point in the parking orbit must also match the plane. The transfer time here is not the half-period of a simple Hohmann ellipse, but the logic of “arrive where the target will be” is identical. On Apollo 11 the translunar injection burn (TLI) came during the second revolution of Earth parking orbit, at about GET 2:44.`}</p>
            <p>${T`In lunar orbit the rendezvous is the same problem on a smaller scale. The Lunar Module ascent stage lifts off from the surface, enters a lower orbit than the Command and Service Module, and must come up to it. Liftoff therefore has to be timed with the CSM’s position, and the ascent is possible only when the CSM’s orbit plane passes over the landing site. The lower LM is faster and gains on the CSM, as in section ${App.sec('timing', 1)}. This is a rendezvous <b>launch window</b>: it opens once per orbit, and it is the phase angle that decides it.`}</p>
          </div>
        </section>

        ${Archive.capsule('gemini6')}

        <section class="section">
          <h2><span class="idx">0.6</span>${T`Lifting off to meet the mother ship`}</h2>
          <div class="prose">
            <p>${T`Section ${App.sec('timing', 5)} said that the LM must lift off at the right moment. Here is the calculation, in its simplest form. Everything is two-body and circular, and the landing site lies in the orbit plane of the mother ship, the CSM. The method: climb to a low circular orbit, then fly a Hohmann transfer up to the CSM’s orbit and arrive where the CSM is. Real Apollo flights used a longer coelliptic sequence after liftoff, which tolerates an imperfect insertion; module ${Progress.code('landing')} describes it. The direct method below is the exact version of the idea.`}</p>
            <p>${T`The ascent takes a time t<sub>asc</sub> and carries the LM over a downrange angle θ<sub>asc</sub> of the Moon, measured at its centre. For the Apollo LM, think of about 7 minutes to reach an orbit of about 15 km altitude, and a few hundred kilometres of ground track. These are inputs here, and we use 420 s and 300 km, which is 300 / 1 737.4 = 0.1727 rad = 9.89°. The Moon’s rotation is neglected: its surface turns only 0.55° per hour, so the site hardly moves during the flight (the end of the section shows its one small effect).`}</p>
            <p>${T`After the climb the LM is at angle θ<sub>asc</sub> from the site, in the low orbit. It flies the half ellipse of section ${App.sec('timing', 2)}: another t<sub>H</sub> and 180°. It therefore arrives at the angle θ<sub>asc</sub> + π from the site, after a total time t<sub>asc</sub> + t<sub>H</sub>. The CSM must be at that point then. It moves n<sub>C</sub>·(t<sub>asc</sub> + t<sub>H</sub>) meanwhile, so at liftoff it must be ahead of the site, in the direction of motion, by:`}</p>
            <div class="eq">\\[ \\varphi_{lift} = \\theta_{asc} + \\pi - n_C\\,(t_{asc} + t_H) \\pmod{2\\pi} \\]</div>
            ${Sym.where([['\\varphi_{lift}', N`angle by which the CSM must be ahead of the launch site at liftoff (negative: behind)`, 'rad'], ['\\theta_{asc}', N`downrange angle covered during the ascent`, 'rad'], ['n_C', N`mean motion of the CSM’s orbit, √(μ/r<sub>C</sub>³)`, 'rad/s'], ['t_{asc}', N`ascent time, from liftoff to the low orbit`, 's'], ['t_H', N`Hohmann transfer time from the low orbit to the CSM’s orbit: half the period of the transfer ellipse`, 's']], N`In words: the LM must arrive at θ<sub>asc</sub> + 180° and the CSM covers n<sub>C</sub>·(t<sub>asc</sub> + t<sub>H</sub>) to get there, so it must start that far short of the arrival point. This is the phase-angle formula for the Hohmann transfer with the ascent added to the flight time.`)}
            <p>${T`Example, low orbit at 15 km and CSM at 110 km. The radii are 1 752.4 km and 1 847.4 km, so t<sub>H</sub> = 3 426 s = 57.10 min. The CSM’s rate is 3.031° per minute (period 118.75 min). Then n<sub>C</sub>·(t<sub>asc</sub> + t<sub>H</sub>) = 3.031° × 64.10 min = 194.32°, and φ<sub>lift</sub> = 9.89° + 180° − 194.32° = <b>−4.43°</b>. The CSM must be 4.43° <i>behind</i> the site, which is about 1.5 min of its orbit short of the overhead point.`}</p>
          </div>
          <div class="prose">
            <p>${T`Now the clock. The site is fixed and the CSM goes round once per period, passing straight overhead once per revolution. Let the angle ψ from the site to the CSM be 0 at the pass. It grows at n<sub>C</sub>, so it equals φ<sub>lift</sub> a time after the pass:`}</p>
            <div class="eq">\\[ t_{lift} = \\mathrm{GET}_{pass} + \\frac{\\varphi_{lift} \\bmod 2\\pi}{n_C} \\]</div>
            ${Sym.where([['t_{lift}', N`liftoff time, as GET`, 's'], ['\\mathrm{GET}_{pass}', N`GET at which the CSM passes overhead the site`, 's'], ['\\varphi_{lift} \\bmod 2\\pi', N`φ<sub>lift</sub> brought into the range 0 to 360° (see Angles that wrap around)`, 'rad'], ['n_C', N`mean motion of the CSM’s orbit`, 'rad/s']], N`A negative φ<sub>lift</sub> means liftoff comes shortly before the next overhead pass, not just after the previous one.`)}
            <p>${T`Example: the CSM passes overhead at GET 124:00:00. φ<sub>lift</sub> mod 360° = 355.57°, and 355.57° / 3.031° per minute = 117.29 min = 1 h 57 min 18 s. Liftoff is at GET <b>125:57:18</b>, 1 min 27 s before the next pass at 125:58:45. A check by numerical integration of both orbits gives an arrival miss below a metre. A liftoff 120 s late misses by about 195 km.`}</p>
            <p>${T`If the window is missed, the next one comes one CSM period later, here 118.75 min. The alternative is to coast in the low orbit, as in section ${App.sec('timing', 3)}: the LM is faster than the CSM, so it gains on it, and each minute of coast raises the angle the CSM may be ahead by (n<sub>L</sub> − n<sub>C</sub>), 0.25° here. If at the moment of insertion the CSM is φ<sub>now</sub> ahead of the site and the required angle is φ<sub>lift</sub>, the coast is`}</p>
            <div class="eq">\\[ t_c = \\frac{\\varphi_{now} - \\varphi_{lift}}{n_L - n_C} \\]</div>
            ${Sym.where([['t_c', N`coast time in the low orbit before the Hohmann burn`, 's'], ['\\varphi_{now}', N`angle by which the CSM is ahead of the site at liftoff`, 'rad'], ['\\varphi_{lift}', N`required angle without a coast (this section)`, 'rad'], ['n_L', N`mean motion of the low orbit`, 'rad/s'], ['n_C', N`mean motion of the CSM’s orbit`, 'rad/s']], N`Use it when φ<sub>now</sub> is a little larger than φ<sub>lift</sub>, so that the LM can catch up. A large difference means a long coast: 10° takes 40 min.`)}
            <p>${T`A hand-flown ascent is not exact. Liftoff is a few seconds off, the insertion angle is off by a few degrees, the orbit is a few kilometres too high or low, so the one-shot plan “lift off at t<sub>lift</sub> and arrive exactly” rarely closes by itself. The robust method has two steps. First lift off roughly at the computed time. Then, after insertion, measure the real orbit and the real phase angle (the methods of module ${Progress.code('navigation')}), coast in the low orbit until the phase is right, and fly the Hohmann burn at a TIG recomputed with the formulas of the earlier sections.`}</p>
            <p>${T`The two directions of error are not equal. A 20 km lunar orbit has a period of 110.2 min and a 110 km orbit 118.7 min, so the LM gains about 0.24° per minute on the CSM. If the phase is too large by 1°, the coast costs about 4 minutes, which is cheap. If it is too small, the lower LM pulls further ahead and the geometry returns only after a synodic period, about 25 h, or after a phasing maneuver, which is expensive. The rule: bias the plan. Lift off about one minute <b>later</b> than the exact solution. The CSM moves about 3° per minute, so that is about 3° of margin on the cheap side, at the price of a coast of about 12 minutes. The margin absorbs the pilot’s errors. This need for robustness is why Apollo flew the longer coelliptic sequence of module ${Progress.code('landing')}.`}</p>
            <p>${T`The Moon’s rotation matters in one place: the angle between the site and the CSM grows at n<sub>C</sub> − ω, with ω = 2.66 × 10⁻⁶ rad/s, not at n<sub>C</sub>. Replace n<sub>C</sub> by n<sub>C</sub> − ω in the denominator of t<sub>lift</sub> and the wait grows by 0.3%, 21 s in this example. The angle φ<sub>lift</sub> itself does not change, because the LM starts with the speed of the ground and the formula uses angles seen from the centre.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.7</span>${T`Lab: the phasing clock`}</h2>
          <div class="prose"><p>${T`A chaser and a target orbit counterclockwise, seen from above the pole. The scenario gives the angles at one GET. Compute the required phase angle and the TIG, type both, then press Execute. The lab flies an impulsive Hohmann transfer from your TIG and shows where the chaser arrives and where the target is: the miss. Use the warp controls to watch the geometry. “New fix” gives a new set of angles, so every attempt is your own calculation.`}</p></div>
          <div class="lab tl-lab" id="pc">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Phasing clock`}</h3><span class="spacer"></span>
              <div class="seg" id="pc-rate" role="group" aria-label="${T`Time warp`}"><button data-v="60" aria-pressed="false">×60</button><button data-v="600" aria-pressed="true">×600</button><button data-v="3600" aria-pressed="false">×3600</button><button data-v="36000" aria-pressed="false">×36000</button></div>
            </div>
            <div class="stage"><canvas id="pc-cv" aria-label="${T`Top-down view of two circular orbits around the central body, with the chaser, the target and the phase angle between them`}"></canvas><div class="overlay" id="pc-ov"></div><div class="badge" id="pc-badge"></div></div>
            <div class="tl-side">
              <dl class="readout" id="pc-live"></dl>
              <div id="pc-res"></div>
            </div>
            <div class="tl-transport">
              <div class="btn-row"><button class="btn primary" id="pc-play">${T`▸ Play`}</button><button class="btn" id="pc-restart">${T`⟲ Back to the fix`}</button></div>
              <div class="ctl"><label for="pc-t"><span>${T`Mission time`}</span><output id="pc-t-out"></output></label><input type="range" id="pc-t" min="0" max="1" step="1" value="0"></div>
            </div>
            <div class="tl-groups">
              <div class="tl-group">
                <h4>${T`Scenario`}</h4>
                <div class="ctl"><label for="pc-scen"><span>${T`Scenario`}</span></label><select id="pc-scen">${Object.entries(SCEN).map(([k, s]) => `<option value="${k}">${T(s.label)}</option>`).join('')}</select></div>
                <p class="note" id="pc-task" style="margin:0"></p>
                <button class="btn" id="pc-new">${T`New fix`}</button>
              </div>
              <div class="tl-group">
                <h4>${T`Your plan`}</h4>
                <div class="mc-fields">
                  <label>${T`required phase angle (°)`}<input type="text" inputmode="decimal" id="pc-phi" autocomplete="off"></label>
                  <label>${T`TIG (GET hh:mm:ss)`}<input type="text" inputmode="decimal" id="pc-tig" autocomplete="off" placeholder="hh:mm:ss"></label>
                </div>
                <div class="btn-row"><button class="btn primary" id="pc-exec">${T`Execute`}</button></div>
              </div>
              <div class="tl-group">
                <h4>${T`Reading`}</h4>
                <p class="note" style="margin:0">${T`φ is the target’s angle minus the chaser’s, in the direction of motion. The dashed ring is the chaser’s orbit; the solid one is the target’s. After Execute, the open circle is where the target is at arrival and the cross is where the chaser arrives.`}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('timing', { math: 'wrap', mathLabel: N`Angles that wrap around.` })}`;

      mountLab(page.querySelector('#pc'));
      Practice.embed(page.querySelector('#practice-slot'), 'timing', 3);
    },
  });

  /* ---------------- Lab ---------------- */
  function mountLab(root) {
    const $ = (sel) => root.querySelector(sel);
    const num = (id) => { const s = String($(id).value).replace(/\s|\u202f/g, '').replace('−', '-').replace(',', '.'); if (s === '') return NaN; const v = Number(s); return isFinite(v) ? v : NaN; };
    const view = UI.canvas($('#pc-cv'), null);
    let key = 'leo', take = 0, sc = null, S = null, ex = null, res = null, t = 0, rate = 600, playing = false, auto = false, tEnd = 0;
    const sgn = (x, d) => (x >= 0 ? '+' : '−') + f(Math.abs(x), d);
    const get = (x) => Pt.fmtGET(x);

    // a fresh fix: the same geometry, shifted by an amount that depends on the take
    function load() {
      const base = SCEN[key].sc, req = Pt.requiredPhase(base.mu, base.r1, base.r2) * D;
      let phi0 = base.phi0;
      if (take && key !== 'ascent') phi0 = key === 'long' ? req - 1.5 - 2.3 * (take % 6) : key === 'above' ? -38 + 29 * (take % 5) : base.phi0 + 47 * take;
      sc = { ...base, t0: base.t0 + take * 1130, th1: base.th1 + take * 0.6 };
      sc.th2 = sc.th1 + phi0 / D; sc.phi0 = phi0;
      S = Pt.setup(sc); ex = null; res = null; t = sc.t0; playing = false; auto = false;
      setRange(); ['#pc-phi', '#pc-tig'].forEach((id) => { $(id).value = ''; });
      $('#pc-task').textContent = `${T(SCEN[key].task)} ${T`Fix at GET ${get(sc.t0)}. Miss limit: ${f(SCEN[key].tolKm, 0)} km.`}`;
      renderResult(); sync();
    }
    function setRange() {
      tEnd = ex ? ex.tArr + 0.3 * S.tof : sc.t0 + 1.1 * S.syn;
      const el = $('#pc-t'); el.min = '0'; el.max = String(Math.ceil(tEnd - sc.t0)); el.step = '1';
    }
    function sync() { $('#pc-t').value = String(Math.round(t - sc.t0)); $('#pc-t-out').textContent = get(t); $('#pc-play').textContent = playing ? T`❚❚ Pause` : T`▸ Play`; live(); view.redraw(); }

    const posAt = (tt) => {
      const tgt = Pt.targetAngle(sc, S, tt);
      if (ex) { const c = ex.chaser(tt); return { r: c.r, th: c.th, tgt, phase: c.phase }; }
      return { r: sc.kind === 'ascent' ? sc.R : sc.r1, th: Pt.chaserAngle(sc, S, tt), tgt, phase: sc.kind === 'ascent' ? 'ground' : 'coast' };
    };
    function live() {
      const p = posAt(t), phi = Pt.wrapPi(p.tgt - p.th), a = (x) => f(Pt.wrap(x) * D, 2) + '°';
      const stage = p.phase === 'coast' ? T`coasting` : p.phase === 'ground' ? T`on the surface` : p.phase === 'ascent' ? T`climbing` : p.phase === 'transfer' ? T`transfer ellipse` : T`arrived`;
      $('#pc-live').innerHTML = `<dt>GET</dt><dd class="hl">${get(t)}</dd><dt>${T`Chaser angle`}</dt><dd>${a(p.th)}</dd><dt>${T`Target angle`}</dt><dd>${a(p.tgt)}</dd><dt>${T`Phase angle φ`}</dt><dd class="hl">${sgn(phi * D, 2)}°</dd><dt>${T`Chaser altitude`}</dt><dd>${f((p.r - sc.R) / 1e3, 0)} km</dd><dt>${T`Chaser`}</dt><dd>${stage}</dd>`
        + `<dt class="sub">${T`Fix`}</dt><dt>GET</dt><dd>${get(sc.t0)}</dd><dt>φ ${T`at the fix`}</dt><dd>${sgn(S.phi0 * D, 2)}°</dd><dt>${T`Altitudes`}</dt><dd>${f(sc.h1 / 1e3, 0)} → ${f(sc.h2 / 1e3, 0)} km</dd>`;
      $('#pc-ov').innerHTML = sc.body === 'moon' ? T`lunar orbit` : T`Earth orbit`;
    }

    function execute() {
      const phi = num('#pc-phi'), tigIn = Pt.parseGET($('#pc-tig').value);
      const box = $('#pc-res');
      if (!isFinite(phi) || !isFinite(tigIn)) { box.innerHTML = `<p class="note">${T`Enter the phase angle in degrees and the TIG as hh:mm:ss.`}</p>`; return; }
      if (tigIn < sc.t0 || tigIn > sc.t0 + 6 * S.syn) { box.innerHTML = `<p class="note">${T`TIG must lie after the fix (GET ${get(sc.t0)}) and within a few synodic periods.`}</p>`; return; }
      ex = Pt.fly(sc, tigIn);
      const phiOk = Math.abs(Pt.wrapPi(phi / D - S.phiReq)) * D <= 1;
      const tolKm = SCEN[key].tolKm, distKm = ex.dist / 1e3, missOk = distKm <= tolKm;
      res = { phi, phiOk, distKm, missOk, miss: ex.miss, tig: tigIn };
      if (phiOk) Progress.done('timing', 'phase');
      if (missOk) Progress.done('timing', SCEN[key].obj);
      setRange(); t = sc.t0; playing = true; auto = true; rate = (tEnd - sc.t0) / 14;
      renderResult(); sync();
    }
    function renderResult() {
      const box = $('#pc-res'), b = $('#pc-badge');
      if (!res) { box.innerHTML = ''; b.textContent = T`Plan not yet flown`; b.className = 'badge'; return; }
      const ok = (x) => (x ? '✓' : '✗'), ahead = res.miss > 0;
      box.innerHTML = `<dl class="readout">
        <dt>${T`Your φ<sub>req</sub>`}</dt><dd class="hl">${sgn(res.phi, 2)}° ${ok(res.phiOk)}</dd><dt>${T`  computed`}</dt><dd>${sgn(S.phiReq * D, 2)}°</dd>
        <dt>${T`Your TIG`}</dt><dd class="hl">${get(res.tig)}</dd><dt>${T`  first TIG`}</dt><dd>${get(S.tig)}</dd><dt>${T`  period`}</dt><dd>${f(S.syn / 3600, 2)} h</dd>
        <dt>${T`Transfer time`}</dt><dd>${f(S.tof / 60, 1)} min</dd>
        <dt>${T`Arrival miss`}</dt><dd class="hl">${f(res.distKm, 1)} km ${ok(res.missOk)}</dd><dt>${T`  angle`}</dt><dd>${sgn(res.miss * D, 3)}°</dd></dl>
        <p class="note" style="margin:.4rem 0 0">${res.missOk ? T`The chaser arrives within the limit.` : res.distKm < 3 * SCEN[key].tolKm ? T`Close. ${ahead ? T`The target is ahead at arrival: you started too late.` : T`The target is behind at arrival: you started too early.`}` : T`Far off. Check the direction of the wait, the synodic period and the units.`}</p>`;
      b.textContent = T`Miss ${f(res.distKm, 1)} km`; b.className = 'badge ' + (res.missOk ? 'good' : 'bad');
    }

    view.draw = (ctx, w, h) => {
      if (!S) return;
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h); UI.stars(ctx, w, h, K, 70);
      const cx = w / 2, cy = h / 2, rMax = Math.max(sc.r1, sc.r2), s = Math.min(w, h) * 0.41 / rMax;
      const P = (r, th) => [cx + r * s * Math.cos(th), cy - r * s * Math.sin(th)];
      if (sc.body === 'moon') UI.drawMoon(ctx, cx, cy, sc.R * s, K); else UI.drawEarth(ctx, cx, cy, sc.R * s, K);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = K.muted; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(cx, cy, sc.r1 * s, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = K.trace; ctx.beginPath(); ctx.arc(cx, cy, sc.r2 * s, 0, 7); ctx.stroke();
      const p = posAt(t);
      if (ex) {
        ctx.strokeStyle = K.accent; ctx.lineWidth = 1.6; ctx.beginPath();
        for (let k = 0; k <= 100; k++) { const c = ex.chaser(ex.tigUsed + ex.tof * k / 100), [x, y] = P(c.r, c.th); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        const [gx, gy] = P(sc.r2, ex.thTgtArr);
        ctx.strokeStyle = K.good; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(gx, gy, 7, 0, 7); ctx.stroke();
        const [ax, ay] = P(sc.r2, ex.thArr); ctx.strokeStyle = K.accent; ctx.beginPath(); ctx.moveTo(ax - 6, ay - 6); ctx.lineTo(ax + 6, ay + 6); ctx.moveTo(ax + 6, ay - 6); ctx.lineTo(ax - 6, ay + 6); ctx.stroke();
        const [bx, by] = P(sc.r1, ex.thTig); ctx.fillStyle = K.accent; ctx.beginPath(); ctx.arc(bx, by, 3, 0, 7); ctx.fill();
      }
      // phase angle arc and the two radius lines
      const phi = Pt.wrapPi(p.tgt - p.th), rr = Math.min(sc.r1, sc.r2) * s * 0.55 + 0.1 * Math.min(w, h) / 4;
      const [c1x, c1y] = P(p.r, p.th), [t1x, t1y] = P(sc.r2, p.tgt);
      ctx.lineWidth = 1; ctx.strokeStyle = K.muted; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(...P(rMax * 1.04, p.th)); ctx.moveTo(cx, cy); ctx.lineTo(...P(rMax * 1.04, p.tgt)); ctx.stroke();
      ctx.strokeStyle = K.warn; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, rr, -p.th, -(p.th + phi), phi > 0); ctx.stroke();
      const mid = p.th + phi / 2, [lx, ly] = P(rr / s * 1.28, mid);
      ctx.font = `11px ${K.mono}`; ctx.fillStyle = K.warn; ctx.textAlign = 'center'; ctx.fillText(`φ ${sgn(phi * D, 1)}°`, lx, ly + 4);
      // bodies
      ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(c1x, c1y, 5, 0, 7); ctx.fill();
      ctx.fillStyle = K.good; ctx.beginPath(); ctx.arc(t1x, t1y, 5, 0, 7); ctx.fill();
      ctx.font = `10px ${K.mono}`; ctx.textAlign = 'left'; ctx.fillStyle = K.ink; ctx.fillText(T`chaser`, c1x + 8, c1y - 6); ctx.fillStyle = K.good; ctx.fillText(T`target`, t1x + 8, t1y - 6);
    };

    $('#pc-scen').addEventListener('change', (e) => { key = e.target.value; take = 0; load(); });
    $('#pc-new').addEventListener('click', () => { take += 1; load(); });
    $('#pc-exec').addEventListener('click', execute);
    root.querySelectorAll('#pc-phi, #pc-tig').forEach((el) => el.addEventListener('keydown', (e) => { if (e.key === 'Enter') execute(); }));
    $('#pc-play').addEventListener('click', () => { if (t >= tEnd - 1) t = sc.t0; playing = !playing; auto = false; sync(); });
    $('#pc-restart').addEventListener('click', () => { t = sc.t0; playing = false; sync(); });
    $('#pc-t').addEventListener('input', (e) => { t = sc.t0 + Number(e.target.value); playing = false; sync(); });
    UI.seg(root, '#pc-rate', (v) => { rate = Number(v); auto = false; });
    UI.loop((dt) => {
      if (!playing) return;
      t += dt * rate;
      if (t >= tEnd) { t = tEnd; playing = false; }
      sync();
    });
    load();
  }
})();
