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
        return { q: T`A capsule in a circular equatorial orbit at <b>${h} km</b> makes its deorbit burn <b>${dt} s late</b>. By how many kilometres along the equator does splashdown move, relative to the landing site? (The Earth turns at 7.292 × 10⁻⁵ rad/s. R⊕ = 6 378 km, μ = 3.986 × 10¹⁴ m³/s².)`, answer: k * dt, unit: 'km', tol: 0.02,
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
            <p>${T`Over a spherical, non-rotating Earth with an atmosphere of density \\(\\rho(h) = \\rho_0 e^{-h/H}\\), a capsule of mass \\(m\\), drag coefficient \\(C_D\\), reference area \\(A\\) and lift-to-drag ratio \\(L/D\\) obeys:`}</p>
            <div class="eq">\\[ \\dot v = -\\frac{\\rho v^2}{2\\beta} - g\\sin\\gamma, \\qquad v\\dot\\gamma = \\frac{\\rho v^2}{2\\beta}\\frac{L}{D}\\cos\\sigma - \\left(g - \\frac{v^2}{r}\\right)\\cos\\gamma, \\qquad \\dot h = v\\sin\\gamma \\]</div>
            ${Sym.where(['vdot', 'rho', 'v', 'beta', 'g', 'gammaE', 'gammadot', 'LD', 'sigma', 'r', 'hdot'], N`First equation: drag and gravity change the speed. Second: lift and gravity bend the path. Third: the descent rate.`)}
            ${Primer.box('derivative', false, 'refresher')}
            <p>${T`Here \\(\\beta = m/(C_D A)\\) is the <b>ballistic coefficient</b>, \\(\\gamma\\) the flight-path angle (negative going down) and \\(\\sigma\\) the bank angle. Bank angle is the only control Apollo had: it rolled the lift vector up, down or sideways.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">10.2</span>${T`The ballistic case: Allen and Eggers`}</h2>
          <div class="prose">
            <p>${T`Drop lift and gravity (drag dominates) and the equations integrate in closed form (Allen & Eggers: studied in 1953, published by NACA in 1958). The peak deceleration then depends only on entry speed and angle, not on the vehicle:`}</p>
            <div class="eq">\\[ a_{max} = \\frac{v_E^2\\,\\sin|\\gamma_E|}{2\\,e\\,H}, \\qquad \\rho^* = \\frac{\\beta\\,\\sin|\\gamma_E|}{H} \\]</div>
            ${Sym.where(['amax', 'vE', 'gE', 'euler', 'H', 'rhostar', 'beta'])}
            ${Primer.box('log')}
            <p>${T`The formula assumes a straight path. At lunar-return speed the real path curves away from the Earth (\\(v^2/r > g\\)), so at shallow angles it overestimates. For 11 km/s at −6.5° it predicts 36 g, while the lab’s full simulation of a ballistic capsule gives about 16 g. That is still lethal, which is why Apollo needed lift. Heavier, more streamlined vehicles (high \\(\\beta\\)) reach their peak deeper, at higher density \\(\\rho^*\\). That makes them faster and hotter at the end, which is why warheads are slim and capsules are blunt.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">10.3</span>${T`Heating and the blunt body`}</h2>
          <div class="prose">
            <p>${T`Convective heating at the stagnation point follows the Sutton–Graves relation:`}</p>
            <div class="eq">${T`\\[ \\dot q = k\\sqrt{\\frac{\\rho}{r_n}}\\;v^3, \\qquad k = 1.74\\times10^{-4}\\ \\text{(SI, Earth air)} \\]`}</div>
            ${Sym.where(['qdot', 'k', 'rho', 'rn', 'v'], N`v³: twice as fast means eight times the heating.`)}
            <p>${T`The large nose radius \\(r_n\\) of a blunt body reduces it. More important, as H. Julian Allen realised in 1951, a blunt shape pushes a strong, detached shock wave ahead of it. Most of the energy then heats the air, which carries it away, instead of the vehicle. Apollo's heat shield was AVCOAT, a phenolic-epoxy resin in a fibreglass honeycomb. It <b>ablated</b>: charring and eroding, it carried heat away as it went, with up to 2 700 °C on its face. At lunar return speeds radiative heating from the hot shock layer adds about another third.`}</p>
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
          <div class="controls" id="er" style="border:1px solid var(--line);border-radius:8px;margin:1rem 0">
            <h4 style="margin:0">${T`Deorbit calculator`}</h4>
            ${UI.slider({ id: 'er-h', label: T`Orbit altitude`, min: 160, max: 600, step: 10, value: 200, unit: 'km' })}
            ${UI.slider({ id: 'er-dv', label: T`Deorbit Δv (retrograde)`, min: 50, max: 300, step: 1, value: 120, unit: 'm/s' })}
            ${UI.slider({ id: 'er-ang', label: T`Atmospheric range angle θ_atm`, min: 5, max: 45, step: 0.01, value: +W.atmDeg.toFixed(2), unit: '°' })}
            ${UI.slider({ id: 'er-t', label: T`Time from entry interface to splashdown`, min: 5, max: 30, step: 0.01, value: +(W.atmT / 60).toFixed(2), unit: 'min' })}
            <div class="btn-row"><button class="btn" id="er-cal">${T`Calibrate: fly the Command Module`}</button><button class="btn" id="er-ex">${T`Worked example`}</button></div>
            <dl class="readout" id="er-ro"></dl>
          </div>
          <p class="note">${T`Calibrate flies the lab's simulation (Command Module, L/D 0.3, bank 45°) at the entry speed and angle of the current burn, and fills in the last two sliders, adding ${f(ER.T_CHUTE / 60, 0)} minutes of parachute descent. The burn is treated as instantaneous and the Earth as a sphere.`}</p>
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
    const ro = root.querySelector('#er-ro');
    const fmts = { 'er-h': (x) => x.toFixed(0), 'er-dv': (x) => x.toFixed(0), 'er-ang': (x) => x.toFixed(2), 'er-t': (x) => x.toFixed(2) };
    const ctl = UI.bindControls(root, fmts, (v) => {
      const g = ER.deorbit(v['er-h'] * 1e3, v['er-dv']);
      if (!g.ok) { ro.innerHTML = `<dt>${T`Result`}</dt><dd class="hl">${T`The perigee stays above the entry interface: no entry. Burn more.`}</dd>`; return; }
      const L = ER.lead(g, v['er-ang'], v['er-t'] * 60);
      const km = (deg) => deg / ER.DEG * ER.RE / 1000;
      ro.innerHTML = `
        <dt>${T`Vacuum perigee altitude`}</dt><dd>${fm(g.hp / 1000, 1)} km</dd>
        <dt>${T`Entry angle γ`}</dt><dd>${fm(g.gammaDeg, 2)}°</dd>
        <dt>${T`Angle burn to interface`}</dt><dd>${fm(g.angDeg, 2)}°</dd>
        <dt>${T`Time burn to interface`}</dt><dd>${UI.fmtTime(g.t)}</dd>
        <dt>${T`Total angle flown`}</dt><dd>${fm(L.total, 2)}°</dd>
        <dt>${T`Earth rotation during descent`}</dt><dd>${fm(L.rot, 2)}°</dd>
        <dt>${T`Fire when the site is ahead by`}</dt><dd class="hl">${fm(L.lead, 2)}° (${fm(km(L.lead), 0)} km)</dd>
        <dt>${T`Landing shift per second late`}</dt><dd>${fm(ER.lateKmPerS(v['er-h'] * 1e3), 1)} km</dd>`;
    });
    root.querySelector('#er-cal').addEventListener('click', () => {
      const v = ctl.read(), g = ER.deorbit(v['er-h'] * 1e3, v['er-dv']);
      if (!g.ok) return;
      const cm = flyCM(g);
      if (cm.s.outcome !== 'landed') return;
      ctl.set('er-ang', cm.atmDeg.toFixed(2)); ctl.set('er-t', (cm.atmT / 60).toFixed(2)); ctl.update();
    });
    root.querySelector('#er-ex').addEventListener('click', () => {
      ctl.set('er-h', 200); ctl.set('er-dv', 120); ctl.update();
      root.querySelector('#er-cal').click();
    });
    ctl.update();
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
