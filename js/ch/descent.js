/* Chapter: Planning a Powered Descent. DOI, PDI, braking distance, propellant, hover margin, site targeting.
   Lab: descent planner (side profile). Physics lives in descent.phys.js (Phys_descent). */
(function () {
  'use strict';
  const Pd = window.Phys_descent;
  const { C } = Pd;
  const R = String.raw;
  const f = UI.fmt;
  const rnd = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const G = 1.62;                       // m/s², the value quoted in problems
  const MU_K = 4902.8, R_K = 1737.4;    // km³/s², km

  Progress.register('descent', {
    name: N`Planning a Powered Descent`, topic: 'descent', glyph: 'descent',
    briefing: N`You will not fly this descent yet, {name}. You will plan it. Where does the engine start, how hard does it push, how much propellant is left to hover, and how far from the site will you land if you ignite five seconds late? Every number can be computed by hand before the simulation checks you.`,
    objectives: [
      { id: 'doi', text: N`Set a descent orbit insertion Δv within 2 m/s of the value that puts periapsis at 15 km` },
      { id: 'site', text: N`Land within 2 km of the site in the Apollo 11-like scenario` },
      { id: 'late', text: N`Land within 2 km of the site when the ignition will be 8 s late` },
      { id: 'reserve', text: N`Land within 2 km of the site with the heavy lander and keep at least 60 s of hover margin` },
      { id: 'qual', text: N`Qualify: answer 2 descent-planning problems correctly` },
    ],
    debrief: N`You can now plan where a descent starts, how long it lasts and what it leaves in the tanks, {name}. Next comes the real thing: the piloted final landing.`,
  });

  /* ---------------- Primer ---------------- */
  Primer.register('constaccel', {
    title: N`Constant acceleration`,
    used: N`Braking distance and braking time`,
    html: [
      N`<p>When the speed changes by the same amount every second, the acceleration \\(a\\) is constant. Starting at speed \\(v\\) and stopping takes the time \\(t = v/a\\). The average speed during the stop is \\(v/2\\), so the distance is \\(\\tfrac{v}{2}\\cdot\\tfrac{v}{a}\\):</p>`,
      R`\[ t = \frac{v}{a}, \qquad d = \frac{v^2}{2a}, \qquad v^2 = 2\,a\,d \]`,
      N`<p>Example: from 100 m/s with \\(a = 4\\) m/s², you stop in 25 s over 1 250 m. Doubling the speed quadruples the distance, because the stop lasts twice as long at twice the average speed.</p>`,
    ],
  });

  /* ---------------- Practice ---------------- */
  const registerPractice = () => Practice.register('descent', N`Descent planning`, [
    { title: N`Descent orbit insertion Δv`, make() {
      const hc = pick([100, 110, 120]), hp = pick([12, 15, 18]);
      const ra = R_K + hc, rp = R_K + hp, a = (ra + rp) / 2, vc = Math.sqrt(MU_K / ra), va = Math.sqrt(MU_K * (2 / ra - 1 / a));
      const dv = (vc - va) * 1000;
      return { q: T`A lander is in a circular lunar orbit at <b>${hc} km</b>. A retrograde burn must lower its periapsis to <b>${hp} km</b>. What Δv does it need? (μ☾ = 4 902.8 km³/s², R☾ = 1 737.4 km; carry six digits, the answer is a small difference.)`, answer: dv, unit: 'm/s', tol: 0.03,
        hint: T`The burn happens at the apoapsis of the new ellipse, so the new speed there is the vis-viva speed with a = (r<sub>a</sub> + r<sub>p</sub>)/2. Subtract it from the circular speed.`,
        sol: R`\[ r_a = ${f(ra, 1)}\ \mathrm{km},\ r_p = ${f(rp, 1)}\ \mathrm{km},\ a = ${f(a, 1)}\ \mathrm{km} \]
          \[ v_c = \sqrt{\mu/r_a} = ${f(vc * 1000, 2)}\ \mathrm{m/s},\quad v_a = \sqrt{\mu\left(\tfrac{2}{r_a} - \tfrac{1}{a}\right)} = ${f(va * 1000, 2)}\ \mathrm{m/s} \]
          \[ \Delta v = v_c - v_a = ${f(dv, 1)}\ \mathrm{m/s} \]` };
    } },
    { title: N`Braking distance`, make() {
      const v = rnd(1500, 1800, 10), a = rnd(28, 40) / 10, d = v * v / (2 * a) / 1000;
      return { q: T`A lander moves horizontally at <b>${v} m/s</b> and brakes with a constant deceleration of <b>${f(a, 1)} m/s²</b>. How far does it travel before it stops? Ignore gravity.`, answer: d, unit: 'km', tol: 0.01,
        hint: T`Use d = v²/(2a). Keep metres and seconds, then convert to kilometres.`,
        sol: R`\[ d = \frac{v^2}{2a} = \frac{${v}^2}{2\times${f(a, 1)}} = ${f(d * 1000, 0)}\ \mathrm{m} = ${f(d, 1)}\ \mathrm{km} \]` };
    } },
    { title: N`Braking time`, make() {
      const v = rnd(1500, 1800, 10), a = rnd(28, 40) / 10, t = v / a;
      return { q: T`The same lander, at <b>${v} m/s</b> with a constant deceleration of <b>${f(a, 1)} m/s²</b>. How long does the braking take?`, answer: t, unit: 's', tol: 0.01,
        hint: T`Speed divided by deceleration.`,
        sol: R`\[ t = \frac{v}{a} = \frac{${v}}{${f(a, 1)}} = ${f(t, 0)}\ \mathrm{s} = ${f(t / 60, 1)}\ \mathrm{min} \]` };
    } },
    { title: N`Braking altitude for a vertical stop`, make() {
      const v = rnd(60, 140, 10), a = rnd(35, 55) / 10, h = v * v / (2 * (a - G));
      return { q: T`A lander falls straight down at <b>${v} m/s</b>. Its engine gives <b>${f(a, 1)} m/s²</b> of upward acceleration, and lunar gravity is ${f(G, 2)} m/s². At what altitude must it ignite to stop exactly at the surface?`, answer: h, unit: 'm', tol: 0.01,
        hint: T`The engine fights gravity: the net deceleration is a − g.`,
        sol: R`\[ h = \frac{v^2}{2(a-g)} = \frac{${v}^2}{2\times(${f(a, 1)} - ${f(G, 2)})} = ${f(h, 0)}\ \mathrm{m} \]` };
    } },
    { title: N`Propellant for a Δv`, make() {
      const m0 = rnd(9000, 15000, 100), dv = rnd(1000, 2000, 50), c = 311 * 9.80665, p = m0 * (1 - Math.exp(-dv / c));
      return { q: T`A lander of <b>${f(m0, 0)} kg</b> must change its velocity by <b>${f(dv, 0)} m/s</b> (I<sub>sp</sub> = 311 s, g₀ = 9.80665 m/s²). How much propellant does it burn?`, answer: p, unit: 'kg', tol: 0.01,
        hint: T`The rocket equation: m<sub>f</sub> = m<sub>0</sub> e<sup>−Δv/c</sup>, with c = I<sub>sp</sub> g₀. The propellant is m<sub>0</sub> − m<sub>f</sub>.`,
        sol: R`\[ c = ${f(c, 0)}\ \mathrm{m/s},\quad m_f = m_0 e^{-\Delta v/c} = ${f(m0 - p, 0)}\ \mathrm{kg},\quad m_{prop} = m_0 - m_f = ${f(p, 0)}\ \mathrm{kg} \]` };
    } },
    { title: N`Hover time from the reserve`, make() {
      const m = rnd(6500, 9000, 100), res = rnd(100, 300, 10), c = 311 * 9.80665, t = res * c / (m * G);
      return { q: T`The LM hovers with a mass of <b>${f(m, 0)} kg</b> and <b>${res} kg</b> of propellant left (I<sub>sp</sub> = 311 s, g☾ = 1.62 m/s²). How many seconds can it hover? Use the linear formula.`, answer: t, unit: 's', tol: 0.015,
        hint: T`Hovering needs thrust equal to the weight, m g☾. The flow rate is thrust divided by c = I<sub>sp</sub> g₀. Divide the propellant by the flow rate.`,
        sol: R`\[ \dot m = \frac{m g_\leftmoon}{c},\quad t = \frac{m_{res}}{\dot m} = \frac{m_{res}\,c}{m\,g_\leftmoon} = \frac{${res}\times${f(c, 0)}}{${f(m, 0)}\times${f(G, 2)}} = ${f(t, 0)}\ \mathrm{s} \]` };
    } },
    { title: N`Downrange error from a late ignition`, make() {
      const v = rnd(1620, 1700, 5), dt = rnd(3, 12), e = v * dt / 1000;
      return { q: T`The lander moves at <b>${v} m/s</b> at the planned ignition point. The engine starts <b>${dt} s</b> late. By about how many kilometres does the landing point move downrange?`, answer: e, unit: 'km', tol: 0.03,
        hint: T`During the delay the lander coasts at its orbital speed, and the rest of the plan shifts with it: error ≈ v Δt.`,
        sol: R`\[ \Delta x \approx v\,\Delta t = ${v}\times${dt} = ${f(v * dt, 0)}\ \mathrm{m} = ${f(e, 1)}\ \mathrm{km} \]` };
    } },
  ], [
    { q: N`Why is the descent orbit insertion burn made retrograde, half an orbit before the powered descent starts?`, opts: [N`It lowers the periapsis; half an orbit later the lander is at that low point, already low and fast, so the long braking burn starts there`, N`It makes the orbit circular at 15 km`, N`It saves the propellant of the braking burn by slowing the lander to zero`, N`It lines the orbit up with the Earth`], a: 0, why: N`The burn is small (about 20 m/s) and it is made at the opposite side of the orbit. The lander then coasts to periapsis, 15 km above the surface, at about 1.7 km/s. From there the engine takes out the horizontal speed.` },
    { q: N`A lander brakes at a lower throttle than planned, with enough propellant to land. What changes most?`, opts: [N`The braking lasts longer, covers more ground and loses more propellant to gravity, so the hover margin shrinks`, N`Nothing: the braking distance depends only on the speed`, N`The landing point moves uprange`, N`The touchdown speed rises`], a: 0, why: N`With less deceleration, d = v²/(2a) grows and the time v/a grows. Gravity pulls for longer, so more thrust is spent holding the lander up and less slowing it. The propellant for the same Δv is higher, and the hover margin is smaller.` },
    { q: N`What does the hover margin tell the crew?`, opts: [N`How long the engine could keep the lander at constant height, which is the time left to choose a spot before a land-or-abort decision`, N`How much propellant the descent engine burned`, N`The time to the next orbit`, N`The thrust available at touchdown`], a: 0, why: N`Hovering needs thrust equal to weight, so the propellant left divided by the hover flow rate is a time. Mission Control counted such a time down aloud during the Apollo 11 landing.` },
  ]);
  registerPractice();

  /* ---------------- Scenarios ---------------- */
  const BASE = { hc: 110e3, hpAim: 15e3 };
  const SCEN = {
    nominal: { label: N`Apollo 11-like nominal descent`, m0: 15030, prop: 8200, delay: 0, fixedRange: null, obj: 'site',
      task: N`A 110 km circular orbit, a 15 km periapsis, full descent engine. Plan the DOI, then place the ignition point so that the braking ends over the site.` },
    heavy: { label: N`Heavier lander (less margin)`, m0: 15800, prop: 8200, delay: 0, fixedRange: null, obj: 'reserve',
      task: N`800 kg more mass, the same propellant. Land on the site and keep 60 s of hover margin. Find which control buys propellant.` },
    late: { label: N`Late ignition to fix`, m0: 15030, prop: 8200, delay: 8, fixedRange: null, obj: 'late',
      task: N`Mission Control tells you that the engine will ignite 8 s after the planned point. Move the plan so that the lander still arrives at the site.` },
    fixed: { label: N`Fixed ignition point, 520 km out`, m0: 15030, prop: 8200, delay: 0, fixedRange: 520, obj: null,
      task: N`The ignition point is fixed at 520 km before the site. Choose the throttle that makes the braking distance 520 km. Compute it first, then fine-tune: click the slider and use the arrow keys for 0.1 % steps.` },
  };
  const DEFAULTS = { doi: 15, range: 350, thr: 100, hg: 2 };

  App.chapter({
    id: 'descent', phase: N`Descent planning`, title: N`Planning a Powered Descent`, lab: N`Descent planner`,
    blurb: N`Braking point, hover margin and site targeting: plan the descent before you fly it.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('descent')} · Descent planning`,
          title: T`Planning a Powered Descent`,
          lede: T`A lander coming down on the Moon has no air to slow it and no second chance. The engine must remove about 1.7 km/s of orbital speed, and it must do it over a chosen spot. The plan comes first: a small burn to lower the orbit, an ignition point, a braking throttle and a margin of propellant. Every part of it is arithmetic you can do on paper.`,
          refs: [T`Sellers · Understanding Space`, T`BMW · Fundamentals of Astrodynamics`, T`Apollo 11 Mission Report (NASA)`],
        })}
        ${Progress.briefing('descent', { theory: 'theory', lab: 'ds', math: 'refresher', mathLabel: N`Constant acceleration.` })}

        <section class="section" id="theory">
          <h2><span class="idx">0.1</span>${T`Lowering the orbit: DOI`}</h2>
          <div class="prose">
            <p>${T`The lander cannot brake from a 110 km circular orbit: the braking burn would start high above the terrain. The plan is to drop the periapsis first. A short <b>descent orbit insertion</b> (DOI) burn, retrograde, on the side of the Moon opposite the site, turns the circle into an ellipse whose low point is about 15 km above the surface. Apollo used a periapsis of about that height. The burn is made at the apoapsis of the new ellipse, so vis-viva gives the new speed there:`}</p>
            <div class="eq">\\[ \\Delta v_{DOI} = v_c - v_a,\\qquad v_c = \\sqrt{\\frac{\\mu}{r_a}},\\qquad v_a = \\sqrt{\\mu\\left(\\frac{2}{r_a} - \\frac{1}{a}\\right)},\\qquad a = \\frac{r_a + r_p}{2} \\]</div>
            ${Sym.where(['mu', ['r_a', N`radius of the circular orbit (R☾ + 110 km) = apoapsis of the new ellipse`, 'm'], ['r_p', N`radius of the new periapsis (R☾ + 15 km)`, 'm'], 'a', ['v_c,\\ v_a', N`circular speed, and speed at the apoapsis of the ellipse`, 'm/s']], N`The lunar values are μ = 4.9049 × 10¹² m³/s² and R☾ = 1 737.4 km.`)}
            <p>${T`For 110 km and 15 km: r<sub>a</sub> = 1 847.4 km, r<sub>p</sub> = 1 752.4 km, v<sub>c</sub> = 1 629.4 m/s, v<sub>a</sub> = 1 607.8 m/s. So Δv = <b>21.6 m/s</b>. It is a small difference of two large speeds, so carry six digits. A mistake of 1 m/s moves the periapsis by about 4 km.`}</p>
            <p>${T`The lander coasts half an orbit, about 57 minutes, to periapsis. There its speed is 1 695 m/s (the vis-viva speed at r<sub>p</sub>), nearly horizontal, at 15 km altitude. That is the place and time of <b>powered descent initiation</b> (PDI).`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.2</span>${T`Braking: the constant-deceleration model`}</h2>
          <div class="prose">
            <p>${T`From PDI the engine pushes against the motion. To a first approximation the deceleration is constant, so the distance and the time follow from the refresher below:`}</p>
            <div class="eq">\\[ a = \\frac{F}{m},\\qquad t_{brake} = \\frac{v}{a},\\qquad d_{brake} = \\frac{v^2}{2a} \\]</div>
            ${Sym.where(['Fth', 'm', ['a', N`deceleration`, 'm/s²'], 'v', ['t_{brake}', N`braking time`, 's'], ['d_{brake}', N`ground distance covered while braking`, 'm']], N`The mass falls as propellant burns, so a grows during the burn. Use the mean mass for a first estimate.`)}
            ${Primer.box('constaccel', false, 'refresher')}
            <p>${T`The descent engine of the LM gave about 45 kN at full thrust, and was throttleable. With a mass of about 15 000 kg, a = 45 040/15 000 = 3.0 m/s² at ignition, rising to about 3.7 m/s² by the end. With a mean mass near 12 500 kg, a ≈ 3.5 m/s²: the lander needs about 1 695/3.5 ≈ 480 s and about 1 695²/(2 × 3.5) ≈ 410 km. The ignition point is therefore roughly <b>400 to 450 km before the site</b>. The simulation says 412 km for the nominal case. Your estimate will be a few percent off, and the next sections explain the difference. The whole powered descent lasts about 12 minutes once the final approach is added.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.3</span>${T`The last stop: braking altitude`}</h2>
          <div class="prose">
            <p>${T`Close to the ground the lander moves slowly and mostly down. Gravity now acts directly against the stop. If the thrust gives an upward acceleration a, the net deceleration is a − g, and the same distance formula gives the altitude at which to start:`}</p>
            <div class="eq">\\[ h_{brake} = \\frac{v^2}{2\\,(a - g_\\leftmoon)} \\]</div>
            ${Sym.where([['h_{brake}', N`altitude at which the vertical braking must start`, 'm'], 'v', ['a', N`upward acceleration from the engine`, 'm/s²'], 'gM'], N`If a is not larger than g☾, the lander cannot stop: it needs thrust above its own lunar weight.`)}
            <p>${T`With v = 100 m/s and a = 4.0 m/s² the net deceleration is 2.38 m/s², so h = 100²/(2 × 2.38) = 2.1 km. On Earth the same engine could not even hover. This is why a lander on the Moon can be so light.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.4</span>${T`Propellant and the cost of gravity`}</h2>
          <div class="prose">
            <p>${T`The rocket equation turns any Δv into propellant. With I<sub>sp</sub> of about 311 s, c = I<sub>sp</sub> g₀ ≈ 3 050 m/s:`}</p>
            <div class="eq">\\[ m_{prop} = m_0\\left(1 - e^{-\\Delta v/c}\\right) \\]</div>
            ${Sym.where([['m_0', N`mass at ignition`, 'kg'], 'dv', 'c'], N`A descent of about 2 km/s with a 15 000 kg lander burns around 7 000 kg: a bit under half of the mass.`)}
            ${Primer.box('log')}
            <p>${T`The speed to remove is only 1.7 km/s, yet the real descent needs about 2 km/s or more. The difference is the <b>gravity loss</b>. While the lander is still above the ground, part of the thrust must hold it up instead of slowing it down. The longer the burn lasts, the more gravity takes. In the lab you can see it: at full throttle the whole descent costs about 2.1 km/s of Δv, at 65% about 2.2 km/s, at 50% about 2.3 km/s. A gentler brake is easier on the crew and harder on the tanks. Real descents also pay for the final approach and for the hover and manoeuvring at the end, so plan a margin.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.5</span>${T`The hover margin`}</h2>
          <div class="prose">
            <p>${T`The propellant that remains at the end of the plan is the reserve. A good way to express it is as time: how long could the lander hover? To hover, the thrust equals the weight, F = m g☾. The flow rate is F/c, so:`}</p>
            <div class="eq">\\[ \\dot m = \\frac{m\\,g_\\leftmoon}{c},\\qquad t_{hover} = \\frac{m_{res}}{\\dot m} = \\frac{m_{res}\\,I_{sp}\\,g_0}{m\\,g_\\leftmoon} \\]</div>
            ${Sym.where([['m_{res}', N`propellant left`, 'kg'], ['m', N`mass of the lander now`, 'kg'], 'isp', ['g_0', N`standard gravity, 9.80665`, 'm/s²'], 'gM'], N`This linear form is slightly pessimistic, because the lander gets lighter while it hovers. The error is a few percent for a reserve of 300 kg.`)}
            <p>${T`Example: 200 kg of propellant, a lander of 7 500 kg. Then t = 200 × 3 050/(7 500 × 1.625) = 50 s. On Apollo 11 Mission Control counted the remaining hover time down aloud, with calls at “60 seconds” and “30 seconds”, so that the crew knew how long they had to choose a spot before a land-or-abort decision. This module uses 60 s as the threshold.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">0.6</span>${T`Hitting the site`}</h2>
          <div class="prose">
            <p>${T`A plan that lands 5 km away is a plan that fails. Three errors matter.`}</p>
            <ul>
              <li>${T`<b>Timing (downrange).</b> The lander moves at 1.7 km/s when the engine should ignite. If ignition is Δt late, everything shifts downrange by about v Δt: <b>1.7 km per second of delay</b>. Five seconds is 8.5 km. The cure is to plan the ignition point earlier by the same amount, or to correct during the descent.`}</li>
              <li>${T`<b>Orbit plane (crossrange).</b> The Moon turns under the orbit, about 4.6 m/s at the equator, so in one hour of coasting the site moves about 16 km sideways. The plane is chosen so that the site passes under it at the right moment. Any plane error cannot be fixed by the descent engine at a sensible cost, so it must be small.`}</li>
              <li>${T`<b>Braking performance.</b> Mass, thrust and gravity losses decide the braking distance. A 5% error on a = 3.5 m/s² is 20 km.`}</li>
            </ul>
            <p>${T`The result of all three is a <b>landing ellipse</b>, long in the direction of flight, narrow across. Apollo 11 landed several kilometres beyond the planned point, a miss that the crew had to correct by looking out of the window, which is what the next module ${Progress.code('landing')} is about. Apollo 12 showed what a precise plan can do: it landed in the Ocean of Storms close enough to the Surveyor 3 probe for the crew to walk to it, a few hundred metres away.`}</p>
          </div>
        </section>

        ${Archive.capsule('surveyor')}

        <section class="section">
          <h2><span class="idx">0.7</span>${T`Lab: the descent planner`}</h2>
          <div class="prose"><p>${T`Pick a scenario. Set the DOI Δv, the ignition point (the distance before the site where the engine starts), the braking throttle and the altitude of the high gate, where the final approach begins. The simulation flies the plan: thrust opposite to the velocity, with the steering holding a smooth descent from periapsis to the high gate. It shows where you land, how fast, and how many seconds of hover are left. The plot shows altitude against ground distance with the height exaggerated. First compute d = v²/(2a) by hand and use it as your first guess, then refine. Only your own changes count towards the objectives.`}</p></div>
          <div class="lab tl-lab" id="ds">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Descent planner`}</h3><span class="spacer"></span></div>
            <div class="stage"><canvas id="ds-cv" aria-label="${T`Side view of the descent: altitude against ground distance, with the landing site and the flown path`}"></canvas><div class="overlay" id="ds-ov"><span style="color:var(--muted)">${T`coast`}</span> · <span style="color:var(--accent)">${T`braking`}</span> · <span style="color:var(--good, green)">${T`approach`}</span></div><div class="badge" id="ds-badge"></div></div>
            <div class="tl-side">
              <dl class="readout" id="ds-res"></dl>
              <p class="note" id="ds-live" style="margin:.5rem 0 0"></p>
              <p class="note" id="ds-obj" style="margin:.5rem 0 0"></p>
            </div>
            <div class="tl-transport">
              <div class="btn-row"><button class="btn primary" id="ds-play">${T`▸ Play`}</button><button class="btn" id="ds-restart">${T`⟲ Restart`}</button></div>
              ${UI.slider({ id: 'ds-t', label: T`Time since PDI`, min: 0, max: 1, step: 0.0005, value: 1 })}
            </div>
            <div class="tl-groups">
              <div class="tl-group">
                <h4>${T`Scenario`}</h4>
                <div class="ctl"><label for="ds-scen"><span>${T`Scenario`}</span></label><select id="ds-scen">${Object.entries(SCEN).map(([k, s]) => `<option value="${k}">${T(s.label)}</option>`).join('')}</select></div>
                <p class="note" id="ds-task" style="margin:0"></p>
              </div>
              <div class="tl-group">
                <h4>${T`Plan`}</h4>
                ${UI.slider({ id: 'ds-doi', label: T`DOI Δv`, min: 5, max: 35, step: 0.1, value: DEFAULTS.doi, unit: 'm/s' })}
                ${UI.slider({ id: 'ds-range', label: T`Ignition point before the site`, min: 300, max: 650, step: 0.5, value: DEFAULTS.range, unit: 'km' })}
                ${UI.slider({ id: 'ds-thr', label: T`Braking throttle`, min: 50, max: 100, step: 0.1, value: DEFAULTS.thr, unit: '%' })}
                ${UI.slider({ id: 'ds-hg', label: T`High gate altitude`, min: 1, max: 3, step: 0.1, value: DEFAULTS.hg, unit: 'km' })}
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('descent', { math: 'constaccel', mathLabel: N`Constant acceleration.` })}`;

      mountLab(page.querySelector('#ds'));
      Practice.embed(page.querySelector('#practice-slot'), 'descent', 3);
    },
  });

  function mountLab(root) {
    const $ = (s) => root.querySelector(s);
    const view = UI.canvas($('#ds-cv'), null);
    let scenKey = 'nominal', touched = false, res = null, o = null, tNow = 1, playing = false;
    const km = (x, d = 1) => f(x / 1e3, d);
    const sgn = (x, d = 1) => (x >= 0 ? '+' : '−') + f(Math.abs(x), d);
    const tEnd = () => (res && res.trace.length ? res.trace[res.trace.length - 1].t : 1);

    function setControl(id, v) { const el = $('#' + id); el.value = v; }

    const ctl = UI.bindControls(root, {
      'ds-doi': (v) => f(v, 1), 'ds-range': (v) => f(v, 1), 'ds-thr': (v) => f(v, 1), 'ds-hg': (v) => f(v, 1),
    }, (v, src) => {
      if (src && src !== 'ds-scen' && src !== 'ds-t') touched = true;
      if (src === 'ds-t') { tNow = v['ds-t']; playing = false; $('#ds-play').textContent = T`▸ Play`; redrawAll(); return; }
      const sc = SCEN[scenKey];
      o = { hc: BASE.hc, doiDv: v['ds-doi'], m0: sc.m0, prop: sc.prop, throttle: v['ds-thr'] / 100, pdiRange: (sc.fixedRange ?? v['ds-range']) * 1e3, delay: sc.delay, hHG: v['ds-hg'] * 1e3 };
      res = Pd.simulate(o);
      tNow = 1; $('#ds-t').value = 1;
      renderResult(); checkObjectives(); redrawAll();
    });

    function loadScenario(k) {
      scenKey = k; touched = false;
      const sc = SCEN[k];
      setControl('ds-doi', DEFAULTS.doi); setControl('ds-range', sc.fixedRange ?? DEFAULTS.range);
      setControl('ds-thr', DEFAULTS.thr); setControl('ds-hg', DEFAULTS.hg);
      $('#ds-range').disabled = sc.fixedRange != null;
      $('#ds-task').textContent = T(sc.task);
      ctl.update('ds-scen');
    }

    function miss() { return res.td ? res.td.x : NaN; }
    function renderResult() {
      const r = res, badge = $('#ds-badge'), d = $('#ds-res');
      if (r.outcome === 'terrain') {
        d.innerHTML = `<dt>${T`Periapsis`}</dt><dd class="hl">${km(r.hp, 1)} km</dd><dt>${T`Result`}</dt><dd>${T`the coast grazes the terrain`}</dd>`;
        badge.textContent = T`Periapsis too low: raise it above 5 km`; badge.className = 'badge bad';
        return;
      }
      const e = Pd.brakeEstimate(r.vp, o.m0 - r.doiProp, C.F * o.throttle);
      const m = miss(), landed = r.outcome === 'landed';
      d.innerHTML = `
        <dt>${T`DOI propellant`}</dt><dd>${f(r.doiProp, 0)} kg</dd>
        <dt>${T`Periapsis`}</dt><dd>${km(r.hp, 1)} km</dd>
        <dt>${T`Speed at PDI`}</dt><dd>${f(r.vp, 0)} m/s</dd>
        <dt>${T`Hand estimate v²/2a`}</dt><dd>${f(e.xConst / 1e3, 0)} km · ${f(e.tConst, 0)} s</dd>
        <dt>${T`Flown braking`}</dt><dd>${r.hg ? f(r.hg.dx / 1e3, 0) + ' km · ' + f(r.hg.dt, 0) + ' s' : '—'}</dd>
        <dt>${T`Landing vs site`}</dt><dd class="hl">${landed || r.outcome === 'crash' ? sgn(m / 1e3, 1) + ' km' : '—'}</dd>
        <dt>${T`Touchdown speed`}</dt><dd>${r.td ? f(Math.abs(r.td.vh), 1) + ' m/s' : '—'}</dd>
        <dt>${T`Propellant left`}</dt><dd>${r.td ? f(r.td.prop, 0) + ' kg' : '—'}</dd>
        <dt>${T`Hover margin`}</dt><dd class="hl">${landed ? f(r.margin, 0) + ' s' : '—'}</dd>
        <dt>${T`Descent Δv`}</dt><dd>${f(r.dvTotal, 0)} m/s</dd>`;
      if (r.outcome === 'dry') { badge.textContent = T`Out of propellant before touchdown`; badge.className = 'badge bad'; }
      else if (r.outcome === 'crash') { badge.textContent = T`Crashed during braking`; badge.className = 'badge bad'; }
      else {
        const ok = Math.abs(m) <= 2000;
        badge.textContent = ok ? T`On the site: ${sgn(m / 1e3, 1)} km, ${f(r.margin, 0)} s of hover` : (Math.abs(m) / 1e3 < 100 ? T`${sgn(m / 1e3, 1)} km from the site` : T`Far from the site`);
        badge.className = 'badge ' + (ok ? 'good' : '');
      }
    }

    const doiTarget = Pd.doi(BASE.hc, BASE.hpAim).dv;
    function checkObjectives() {
      const lines = [];
      const sc = SCEN[scenKey];
      const okDoi = Math.abs(o.doiDv - doiTarget) <= 2;
      const landed = res.outcome === 'landed', near = landed && Math.abs(miss()) <= 2000;
      lines.push((okDoi ? '✓ ' : '· ') + T`DOI Δv within 2 m/s of the target`);
      if (sc.obj) lines.push((near && okDoi ? '✓ ' : '· ') + T`within 2 km of the site` + (sc.obj === 'reserve' ? ', ' + T`hover margin ≥ 60 s` + (landed ? ` (${f(res.margin, 0)} s)` : '') : ''));
      $('#ds-obj').textContent = lines.join('   ');
      if (!touched) return;
      if (okDoi) Progress.done('descent', 'doi');
      if (!okDoi || !near) return;
      if (sc.obj === 'site') Progress.done('descent', 'site');
      if (sc.obj === 'late') Progress.done('descent', 'late');
      if (sc.obj === 'reserve' && res.margin >= 60) Progress.done('descent', 'reserve');
    }

    /* ---- drawing ---- */
    function stateAt(t) {
      const tr = res.trace; if (!tr.length) return null;
      let i = 0; while (i < tr.length - 1 && tr[i + 1].t <= t) i++;
      const a = tr[i], b = tr[Math.min(i + 1, tr.length - 1)], u = b.t > a.t ? Math.min(1, (t - a.t) / (b.t - a.t)) : 0;
      const L = (k) => a[k] + (b[k] - a[k]) * u;
      return { t, x: L('x'), h: L('h'), vx: L('vx'), vh: L('vh'), m: L('m'), prop: L('prop'), phase: a.phase };
    }
    view.draw = (ctx, w, h) => {
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, K, 50);
      if (!res) return;
      const x0 = -(o.pdiRange / 1e3) - 15, x1 = Math.max(30, res.td ? res.td.x / 1e3 + 20 : 30);
      const hMax = Math.max(res.hp / 1e3, 12) * 1.25, padL = 44, padR = 16, padT = 16, padB = 46;
      const X = (km) => padL + (km - x0) / (x1 - x0) * (w - padL - padR);
      const Y = (hk) => h - padB - hk / hMax * (h - padT - padB);
      // surface
      ctx.fillStyle = K.moon || K.grid; ctx.globalAlpha = 0.35; ctx.fillRect(padL, Y(0), w - padL - padR, h - Y(0)); ctx.globalAlpha = 1;
      ctx.strokeStyle = K.muted; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(padL, Y(0)); ctx.lineTo(w - padR, Y(0)); ctx.stroke();
      ctx.font = `10px ${K.mono}`; ctx.fillStyle = K.muted; ctx.textAlign = 'right';
      const hStep = hMax > 30 ? 10 : 5;
      for (let a = 0; a <= hMax; a += hStep) { ctx.fillText(a + ' km', padL - 4, Y(a) + 3); if (a) { ctx.strokeStyle = K.grid; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(padL, Y(a)); ctx.lineTo(w - padR, Y(a)); ctx.stroke(); } }
      ctx.textAlign = 'center';
      const xStep = (x1 - x0) > 500 ? 100 : 50;
      for (let a = Math.ceil(x0 / xStep) * xStep; a <= x1; a += xStep) ctx.fillText(a, X(a), Y(0) + 14);
      ctx.fillText(T`ground distance from the site (km, height exaggerated)`, (padL + w - padR) / 2, h - 8);
      // site
      ctx.strokeStyle = K.good; ctx.fillStyle = K.good; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(0), Y(0) - 26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(0), Y(0) - 26); ctx.lineTo(X(0) + 12, Y(0) - 21); ctx.lineTo(X(0), Y(0) - 16); ctx.fill();
      ctx.textAlign = 'left'; ctx.fillText(T`site`, X(0) + 4, Y(0) + 24 > h - 14 ? Y(0) - 30 : Y(0) + 24);
      // ±2 km window
      ctx.fillStyle = K.good; ctx.globalAlpha = 0.25; ctx.fillRect(X(-2), Y(0) - 5, X(2) - X(-2), 5); ctx.globalAlpha = 1;
      if (res.outcome === 'terrain') { ctx.fillStyle = K.warn; ctx.textAlign = 'center'; ctx.fillText(T`The coast orbit is too low: it would meet the terrain.`, w / 2, h / 2); return; }
      // path by phase
      const colors = { coast: K.muted, brake: K.accent, approach: K.good };
      const tr = res.trace;
      ctx.lineWidth = 2.2;
      for (let i = 1; i < tr.length; i++) {
        if (tr[i].t > tNow * tEnd() + 1e-9) break;
        ctx.strokeStyle = colors[tr[i].phase] || K.accent; ctx.beginPath(); ctx.moveTo(X(tr[i - 1].x / 1e3), Y(tr[i - 1].h / 1e3)); ctx.lineTo(X(tr[i].x / 1e3), Y(tr[i].h / 1e3)); ctx.stroke();
      }
      // markers
      ctx.fillStyle = K.ink; ctx.textAlign = 'left';
      if (res.pdi) { ctx.beginPath(); ctx.arc(X(res.pdi.x / 1e3), Y(res.pdi.h / 1e3), 3.5, 0, 7); ctx.fill(); ctx.fillText('PDI', X(res.pdi.x / 1e3) + 6, Y(res.pdi.h / 1e3) - 6); }
      if (res.hg) { ctx.beginPath(); ctx.arc(X(res.hg.x / 1e3), Y(res.hg.h / 1e3), 3, 0, 7); ctx.fill(); ctx.textAlign = 'right'; ctx.fillText(T`high gate`, X(res.hg.x / 1e3) + 4, Y(res.hg.h / 1e3) - 8); ctx.textAlign = 'left'; }
      const s = stateAt(tNow * tEnd());
      if (s) { ctx.fillStyle = K.warn; ctx.beginPath(); ctx.arc(X(s.x / 1e3), Y(s.h / 1e3), 5, 0, 7); ctx.fill(); }
      $('#ds-live').textContent = s ? T`t = ${f(s.t, 0)} s · h = ${f(Math.max(0, s.h), 0)} m · v = ${f(s.vx, 0)} m/s · ${f(s.vh, 1)} m/s vertical · propellant ${f(s.prop, 0)} kg` : '';
    };
    function redrawAll() { view.redraw(); }

    $('#ds-scen').addEventListener('change', (e) => loadScenario(e.target.value));
    $('#ds-play').addEventListener('click', () => { if (tNow >= 1) tNow = 0; playing = !playing; $('#ds-play').textContent = playing ? T`❚❚ Pause` : T`▸ Play`; });
    $('#ds-restart').addEventListener('click', () => { tNow = 0; $('#ds-t').value = 0; playing = true; $('#ds-play').textContent = T`❚❚ Pause`; });
    UI.loop((dt) => {
      if (!playing || !res) return;
      tNow = Math.min(1, tNow + dt * 20 / Math.max(1, tEnd()));
      $('#ds-t').value = tNow; if (tNow >= 1) { playing = false; $('#ds-play').textContent = T`▸ Play`; }
      redrawAll();
    });
    // the scenario select is also a control for bindControls (src 'ds-scen')
    $('#ds-scen').value = scenKey;
    loadScenario(scenKey);
  }
})();
