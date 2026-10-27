/* Chapter: Your Own Launcher. Thrust against ambient pressure, staging, losses and a hand-written pitch program.
   Lab: a pitch program designer. Physics lives in launcher.phys.js (Phys_launcher). */
(function () {
  'use strict';
  const { C } = Phys;
  const Pl = window.Phys_launcher;
  const mu = C.muE, RE = C.RE, g0 = C.g0;
  const R = String.raw;
  const f = UI.fmt;
  const rnd = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const HP = 7500, HD = 7200;                          // pressure and density scale heights of the app's atmosphere, m
  const Q_LIMIT = 25e3;                                // max q limit of the objective, Pa
  const TARGET_ALT = 200e3;

  Progress.register('launcher', {
    name: N`Your Own Launcher`, topic: 'launcher', glyph: 'ascent',
    briefing: N`Mission Control does not fly a rocket the way you flew the Saturn V, {name}. It designs the pitch program on the ground, runs it in a simulation, reads the result and adjusts the table. In this module you become the flight dynamics officer of a new vehicle. You will see why an engine pushes harder in vacuum, why the first stage is built for thrust and the upper stage for efficiency, where 9.4 km/s go on the way to orbit, and how a short table of numbers steers a rocket into a circle.`,
    objectives: [
      { id: 'twr', text: N`Design a custom vehicle with liftoff TWR above 1.2, at least 9.5 km/s of vacuum Δv and a payload of at least 1.5 % of liftoff mass` },
      { id: 'orbit', text: N`Edit the pitch program yourself until the vehicle reaches an orbit with periapsis above 150 km` },
      { id: 'maxq', text: N`Reach that orbit with a maximum dynamic pressure below 25 kPa` },
      { id: 'own', text: N`Reach orbit (periapsis above 150 km) with a custom vehicle that you changed yourself` },
      { id: 'qual', text: N`Qualify: answer 2 launcher problems correctly` },
    ],
    debrief: N`You can now read a thrust curve, size the stages of a launcher and tune a pitch table until the periapsis clears the atmosphere, {name}. Next, the manoeuvres that start once you are in orbit.`,
  });

  /* ---------------- Primer: interpolation in a table ---------------- */
  Primer.register('interp', {
    title: N`Interpolation in a table`,
    used: N`pitch programs, Isp between sea level and vacuum`,
    html: [
      N`<p>A table gives a quantity at a few points. Between two rows you need a value the table does not list. The simplest rule joins the two neighbouring rows with a straight line. This is <b>linear interpolation</b>.</p>`,
      N`<p>Take two rows \\((x_1, y_1)\\) and \\((x_2, y_2)\\) and a value \\(x\\) between them. The fraction of the way from the first row to the second is \\((x - x_1)/(x_2 - x_1)\\), and \\(y\\) is the same fraction of the way from \\(y_1\\) to \\(y_2\\):</p>`,
      R`\[ y = y_1 + (y_2 - y_1)\,\frac{x - x_1}{x_2 - x_1} \]`,
      N`<p>Example: a pitch table says 60° at 100 s and 80° at 200 s. At 130 s the fraction is 0.3, so the pitch is 60 + 20 × 0.3 = 66°. Outside the table a program usually holds the first or last value.</p>`,
      N`<p class="try">Try it: move the time and watch the point slide along the straight segment.</p>`,
    ],
    widget(el) {
      const id = 'ip' + Math.floor(Math.random() * 1e6);
      el.innerHTML = `<div class="pw"><div class="pw-stage"><canvas></canvas></div><div class="pw-side"><div class="ctl"><label for="${id}"><span>${T`Time`}</span><output id="${id}-o"></output></label><input type="range" id="${id}" min="0" max="300" step="1" value="130"></div><dl class="readout pw-ro"></dl></div></div>`;
      const cv = el.querySelector('canvas'), inp = el.querySelector('input'), out = el.querySelector('output'), ro = el.querySelector('.pw-ro');
      const tab = [[0, 90], [100, 60], [200, 80], [300, 90]];
      const val = (t) => Pl.pitchAt(tab.map(([a, b]) => ({ t: a, pitch: b })), t);
      const v = UI.canvas(cv, (ctx, w, h) => {
        const K = UI.tok(), t = +inp.value;
        const pts = []; for (let x = 0; x <= 300; x += 5) pts.push([x, val(x)]);
        const { X, Y } = UI.chart(ctx, w, h, { series: [{ data: pts, color: K.trace, end: false }], xMin: 0, xMax: 300, yMin: 50, yMax: 100, xLabel: 's', yLabel: '°', cursor: t });
        ctx.fillStyle = K.muted; tab.forEach(([a, b]) => { ctx.beginPath(); ctx.arc(X(a), Y(b), 4, 0, 7); ctx.fill(); });
        ctx.fillStyle = K.accent; ctx.beginPath(); ctx.arc(X(t), Y(val(t)), 5, 0, 7); ctx.fill();
      });
      const upd = () => {
        const t = +inp.value; let i = 1; while (i < tab.length - 1 && t > tab[i][0]) i++;
        const [x1, y1] = tab[i - 1], [x2, y2] = tab[i], fr = (t - x1) / (x2 - x1);
        out.textContent = t + ' s';
        ro.innerHTML = `<dt>${T`rows used`}</dt><dd>${x1} s, ${x2} s</dd><dt>${T`fraction`}</dt><dd>${f(fr, 2)}</dd><dt>${T`value`}</dt><dd class="hl">${f(y1 + (y2 - y1) * fr, 1)}°</dd>`;
        v.redraw();
      };
      inp.addEventListener('input', upd); upd();
    },
  });

  /* ---------------- Practice ---------------- */
  const sl = (F, a, b) => F * a / b;                   // sea-level thrust from vacuum thrust and the two Isp
  const registerPractice = () => Practice.register('launcher', N`Your own launcher`, [
    { title: N`Thrust at altitude`, make() {
      const Fv = rnd(2, 8, 0.5), a = rnd(255, 290, 5), b = a + rnd(25, 60, 5), h = rnd(4, 30, 2);
      const F0 = sl(Fv, a, b), pr = Math.exp(-h * 1000 / HP), F = Fv - (Fv - F0) * pr;
      return { q: T`An engine group has a vacuum thrust of <b>${f(Fv, 1)} MN</b>, a sea-level Isp of <b>${a} s</b> and a vacuum Isp of <b>${b} s</b>. Take the pressure as p = p₀ e<sup>−h/7.5 km</sup>. What is its thrust at <b>${h} km</b>? (Mass flow is constant.)`, answer: F, unit: 'MN', tol: 0.01,
        hint: T`Sea-level thrust is F<sub>vac</sub> × Isp<sub>SL</sub>/Isp<sub>vac</sub>. Thrust is linear in the ambient pressure, so F = F<sub>vac</sub> − (F<sub>vac</sub> − F<sub>SL</sub>) p/p₀.`,
        sol: R`\[ F_{SL} = ${f(Fv, 1)}\cdot\frac{${a}}{${b}} = ${f(F0, 3)}\ \mathrm{MN},\quad \frac{p}{p_0} = e^{-${h}/7.5} = ${f(pr, 4)} \]
          \[ F = F_{vac} - (F_{vac} - F_{SL})\frac{p}{p_0} = ${f(Fv, 1)} - ${f(Fv - F0, 3)}\times${f(pr, 4)} = ${f(F, 3)}\ \mathrm{MN} \]` };
    } },
    { title: N`Isp between sea level and vacuum`, make() {
      const a = rnd(250, 300, 5), b = a + rnd(20, 60, 5), p = rnd(10, 90, 5);
      const I = b - (b - a) * p / 101.325;
      return { q: T`An engine has Isp <b>${a} s</b> at sea level and <b>${b} s</b> in vacuum. What is its Isp where the ambient pressure is <b>${p} kPa</b>? (Sea level is 101.325 kPa.)`, answer: I, unit: 's', tol: 0.005,
        hint: T`Isp is linear in the ambient pressure: it falls from the vacuum value by the full difference at sea level.`,
        sol: R`\[ I_{sp} = I_{vac} - (I_{vac} - I_{SL})\frac{p}{p_0} = ${b} - ${b - a}\times\frac{${p}}{101.325} = ${f(I, 1)}\ \mathrm{s} \]` };
    } },
    { title: N`Liftoff thrust-to-weight ratio`, make() {
      const m = rnd(200, 3000, 50), F = Math.round(rnd(110, 150, 5) / 100 * m * g0 / 1000 / 0.5) * 0.5 / 1;
      const twr = F * 1e6 / (m * 1000 * g0);
      return { q: T`A launcher has a liftoff mass of <b>${f(m, 0)} t</b> and a sea-level thrust of <b>${f(F, 1)} MN</b>. What is its thrust-to-weight ratio at liftoff? (g₀ = 9.80665 m/s²)`, answer: twr, unit: '', tol: 0.005,
        hint: T`Weight is m g₀. Convert tonnes to kilograms and meganewtons to newtons.`,
        sol: R`\[ \mathrm{TWR} = \frac{F}{m g_0} = \frac{${f(F, 1)}\times10^{6}}{${f(m * 1000, 0)}\times 9.80665} = ${f(twr, 3)} \]` };
    } },
    { title: N`Acceleration at first-stage burnout`, make() {
      const m0 = rnd(200, 800, 10), prop = Math.round(m0 * rnd(60, 74) / 100), Fv = Math.round(m0 * g0 * rnd(14, 17) / 10 / 1000 * 2) / 2;
      const mf = m0 - prop, twr = Fv * 1e6 / (mf * 1000 * g0);
      return { q: T`A first stage has a liftoff mass of <b>${m0} t</b>, burns <b>${prop} t</b> of propellant and has a vacuum thrust of <b>${f(Fv, 1)} MN</b> (assume the thrust is constant near burnout). What acceleration, in g<sub>0</sub>, does the vehicle feel just before burnout? Ignore drag and gravity losses.`, answer: twr, unit: 'g', tol: 0.01,
        hint: T`At burnout the mass is m₀ minus the propellant. Divide the thrust by that weight.`,
        sol: R`\[ m_f = ${m0} - ${prop} = ${mf}\ \mathrm{t},\quad a = \frac{F}{m_f g_0} = \frac{${f(Fv, 1)}\times10^{6}}{${f(mf * 1000, 0)}\times9.80665} = ${f(twr, 2)}\ g_0 \]` };
    } },
    { title: N`Delta-v of a two-stage launcher`, make() {
      const pay = rnd(2, 8), p1 = rnd(150, 300, 10), d1 = Math.round(p1 * 0.07), p2 = rnd(30, 80, 5), d2 = Math.round(p2 * 0.1);
      const i1 = rnd(290, 320, 2), i2 = rnd(400, 450, 2);
      const m01 = pay + d2 + p2 + d1 + p1, mf1 = m01 - p1, m02 = pay + d2 + p2, mf2 = m02 - p2;
      const dv1 = i1 * g0 * Math.log(m01 / mf1), dv2 = i2 * g0 * Math.log(m02 / mf2), dv = dv1 + dv2;
      return { q: T`A launcher carries a <b>${pay} t</b> payload. Stage 1: <b>${p1} t</b> of propellant, <b>${d1} t</b> dry, vacuum Isp <b>${i1} s</b>. Stage 2: <b>${p2} t</b> of propellant, <b>${d2} t</b> dry, vacuum Isp <b>${i2} s</b>. What is the total Δv in vacuum?`, answer: dv, unit: 'm/s', tol: 0.01,
        hint: T`Do the rocket equation twice. Stage 1 carries everything above it. Stage 2 starts with the payload plus its own dry mass and propellant.`,
        sol: R`\[ \Delta v_1 = ${i1}\cdot9.80665\cdot\ln\frac{${m01}}{${mf1}} = ${f(dv1, 0)}\ \mathrm{m/s},\qquad \Delta v_2 = ${i2}\cdot9.80665\cdot\ln\frac{${m02}}{${mf2}} = ${f(dv2, 0)}\ \mathrm{m/s} \]
          \[ \Delta v = ${f(dv, 0)}\ \mathrm{m/s} \]` };
    } },
    { title: N`Dynamic pressure on the way up`, make() {
      const h = rnd(6, 20), v = rnd(200, 650, 10);
      const rho = 1.225 * Math.exp(-h * 1000 / HD), q = 0.5 * rho * v * v / 1000;
      return { q: T`At an altitude of <b>${h} km</b> a launcher flies at <b>${v} m/s</b> relative to the air. Take ρ = 1.225 e<sup>−h/7.2 km</sup> kg/m³. What is the dynamic pressure q = ½ρv²?`, answer: q, unit: 'kPa', tol: 0.01,
        hint: T`Compute the air density at that altitude first, then q = ½ρv² in pascals, then convert to kilopascals.`,
        sol: R`\[ \rho = 1.225\,e^{-${h}/7.2} = ${f(rho, 4)}\ \mathrm{kg/m^3},\quad q = \tfrac12\rho v^2 = 0.5\times${f(rho, 4)}\times${v}^2 = ${f(q * 1000, 0)}\ \mathrm{Pa} = ${f(q, 1)}\ \mathrm{kPa} \]` };
    } },
  ], [
    { q: N`The first stage of a launcher is designed for sea level, the upper stage for vacuum. Why does the upper stage use a much larger nozzle exit area for its engine size?`, opts: [N`In vacuum there is no ambient pressure to over-expand the exhaust, so a large exit area extracts more thrust and Isp from the same propellant`, N`A large exit area makes the engine lighter`, N`The upper stage must produce more thrust than the first stage`, N`The bell shields the payload from the exhaust`], a: 0, why: N`At sea level a very large bell over-expands the flow: the exit pressure falls below the air pressure and the flow can separate from the wall. In vacuum there is no such limit, so the longest bell wins.` },
    { q: N`Why does the Isp of an engine change linearly with the ambient pressure, although the pressure itself falls exponentially with altitude?`, opts: [N`The mass flow is fixed, and the only altitude-dependent term of the thrust is −p<sub>a</sub>A<sub>e</sub>, which is linear in p<sub>a</sub>`, N`The exhaust speed changes linearly with altitude`, N`The engine throttles itself in proportion to altitude`, N`Pressure is linear in altitude below 10 km`], a: 0, why: N`F = ṁv<sub>e</sub> + (p<sub>e</sub> − p<sub>a</sub>)A<sub>e</sub> with fixed ṁ, v<sub>e</sub>, p<sub>e</sub> and A<sub>e</sub>. Only p<sub>a</sub> varies, so F and Isp = F/(ṁg₀) are linear in p<sub>a</sub>. Plotted against altitude the curve is exponential.` },
    { q: N`At cutoff your simulated upper stage has the energy of a 200 km circular orbit but is still climbing, with a periapsis below the surface. What do you change in the pitch table?`, opts: [N`Pitch over faster, towards the horizontal, so that more of the thrust goes into horizontal speed`, N`Pitch less, to climb higher`, N`Delay the pitch kick of the first stage by one minute, which changes nothing for the upper stage`, N`Add propellant, since the orbit is too low`], a: 0, why: N`With the energy fixed, a positive flight-path angle at cutoff means the vehicle is on its way up to an apoapsis, and the periapsis is on the other side, too low. Raising the pitch angle in the late rows turns thrust towards the horizontal, which brings the flight-path angle down towards zero.` },
  ]);
  registerPractice();

  /* ---------------- Lab presets ---------------- */
  const PRESETS = {
    sat: { label: N`Saturn-like, scaled down`, payload: 5000, diameter: 5.5, cd: 0.5, kt: 10, ka: 1.4,
      stages: [{ name: 'S1', prop: 205000, dry: 15000, fVac: 4.25e6, ispSL: 263, ispVac: 304 }, { name: 'S2', prop: 55000, dry: 6000, fVac: 0.64e6, ispSL: 200, ispVac: 421 }],
      rows: [[144, 70], [320, 76], [480, 82]],
      task: N`About a tenth of the Saturn V by mass, with its F-1 and J-2 style Isp values. The draft table is wrong: it leaves the vehicle too vertical at cutoff.` },
    small: { label: N`Small two-stage launcher`, payload: 250, diameter: 1.2, cd: 0.5, kt: 10, ka: 1.4,
      stages: [{ name: 'S1', prop: 9500, dry: 1000, fVac: 190e3, ispSL: 285, ispVac: 311 }, { name: 'S2', prop: 2300, dry: 200, fVac: 25e3, ispSL: 260, ispVac: 343 }],
      rows: [[152, 70], [300, 76], [460, 82]],
      task: N`A 13-tonne rocket. Little propellant to spare: the table has to be good.` },
  };
  const FIELDS = [ // [slider id suffix, stage index, key, scale, label, unit]
    ['1p', 0, 'prop', 1e3, N`Propellant`, 't'], ['1d', 0, 'dry', 1e3, N`Dry mass`, 't'], ['1f', 0, 'fVac', 1e6, N`Vacuum thrust`, 'MN'], ['1s', 0, 'ispSL', 1, N`Isp, sea level`, 's'], ['1v', 0, 'ispVac', 1, N`Isp, vacuum`, 's'],
    ['2p', 1, 'prop', 1e3, N`Propellant`, 't'], ['2d', 1, 'dry', 1e3, N`Dry mass`, 't'], ['2f', 1, 'fVac', 1e6, N`Vacuum thrust`, 'MN'], ['2s', 1, 'ispSL', 1, N`Isp, sea level`, 's'], ['2v', 1, 'ispVac', 1, N`Isp, vacuum`, 's'],
  ];
  const niceStep = (x) => { const t = x / 150; let s = 0.001; for (const c of [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10]) if (c <= t) s = c; return s; };
  const OUTCOME = {
    pad: [N`Stays on the pad`, 'bad'], crash: [N`Impact`, 'bad'], suborbital: [N`Suborbital`, 'bad'], decay: [N`Periapsis too low`, 'warn'], timeout: [N`No cutoff`, 'bad'],
  };

  App.chapter({
    id: 'launcher', phase: N`Launch vehicle`, title: N`Your Own Launcher`, lab: N`Pitch program designer`,
    blurb: N`Thrust against ambient pressure, staging and a hand-tuned pitch table: design a launch to orbit.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('launcher')} · Launch vehicle`,
          title: T`Your Own Launcher`,
          lede: T`The Saturn V flew a pitch program that engineers had computed, simulated and adjusted for months. This module gives you the same job for a new vehicle: understand what the engines really deliver, split the work between the stages, and write the table that steers the rocket to orbit.`,
          refs: [T`Sellers · Understanding Space`, T`Sutton & Biblarz · Rocket Propulsion Elements`, T`BMW · Fundamentals of Astrodynamics`],
        })}
        ${Progress.briefing('launcher', { theory: 'theory', lab: 'ln', math: 'refresher', mathLabel: N`Interpolation in a table.` })}

        <section class="section" id="theory">
          <h2><span class="idx">7.1</span>${T`Thrust depends on the air around the engine`}</h2>
          <div class="prose">
            <p>${T`Module ${Progress.code('rockets')} gave the thrust equation. Here is what it means for a rocket that climbs out of the atmosphere:`}</p>
            <div class="eq">\\[ F = \\dot m\\,v_e + (p_e - p_a)\\,A_e \\]</div>
            ${Sym.where(['Fth', 'mdot', 've', 'pexit', 'pa', 'Ae'], N`The first term is the momentum of the exhaust. The second is the pressure force on the nozzle exit.`)}
            <p>${T`Only <i>p<sub>a</sub></i> changes during the flight. At sea level it is 101 325 Pa. In vacuum it is zero, and the pressure term adds to the thrust. So an engine pushes harder as it climbs. For the F-1 of the Saturn V first stage, about 6.77 MN at sea level and about 7.77 MN in vacuum, the gain is 15 %.`}</p>
            <p>${T`The nozzle is a trade-off. Its <b>expansion ratio</b> is the exit area divided by the throat area. A larger ratio lets the gas expand further, so the exit pressure <i>p<sub>e</sub></i> falls and more of the heat becomes exhaust speed. If <i>p<sub>e</sub></i> is below the air pressure the nozzle is <b>over-expanded</b>: the air pushes the flow in, the pressure term is negative and the flow can separate from the wall. If <i>p<sub>e</sub></i> is above the air pressure the nozzle is <b>under-expanded</b>: the gas leaves with pressure it could still have turned into speed. A first-stage engine is a compromise for the whole climb. A vacuum engine such as the J-2, with a vacuum Isp of about 421 s and a thrust of about 1 MN, can have a very large bell because it never meets dense air.`}</p>
          </div>
        </section>

        ${Archive.capsule('j2')}

        <section class="section">
          <h2><span class="idx">7.2</span>${T`Isp from sea level to vacuum`}</h2>
          <div class="prose">
            <p>${T`Specific impulse is the thrust divided by the weight flow, <i>I<sub>sp</sub></i> = <i>F</i>/(ṁ g₀). The mass flow ṁ of a given engine is fixed, so the thrust and the specific impulse follow the same law. Write the vacuum thrust as <i>F<sub>vac</sub></i>. Then the thrust at ambient pressure <i>p</i> is <i>F<sub>vac</sub></i> − <i>p A<sub>e</sub></i>, and dividing by ṁ g₀ gives:`}</p>
            <div class="eq">\\[ F(p) = F_{vac} - p\\,A_e,\\qquad I_{sp}(p) = I_{vac} - \\left(I_{vac} - I_{SL}\\right)\\frac{p}{p_0},\\qquad A_e = \\frac{F_{vac} - F_{SL}}{p_0} \\]</div>
            ${Sym.where([['F_{vac},\\ F_{SL}', N`thrust in vacuum and at sea level`, 'N'], ['I_{vac},\\ I_{SL}', N`specific impulse in vacuum and at sea level`, 's'], ['p', N`ambient pressure at the current altitude`, 'Pa'], ['p_0', N`sea-level pressure, 101 325`, 'Pa'], 'Ae'], N`Isp is linear in the pressure because the pressure term is the only one that changes. It is not linear in altitude.`)}
            ${Primer.box('interp', false, 'refresher')}
            <p>${T`Linear in pressure is not linear in altitude, because pressure falls exponentially. This course uses <i>p</i> = <i>p</i><sub>0</sub> e<sup>−h/7.5 km</sup>, and an air density that falls with a scale height of 7.2 km. You will measure such a scale height from sounding-rocket data in module ${Progress.code('sounding')}. For the F-1 above, at 10 km the pressure is 26 % of sea level, the thrust is 7.77 − 1.05 × 0.26 = 7.49 MN and the Isp is 304 − 41 × 0.26 = 293 s. Most of the gain comes in the first 20 km, which a rocket crosses in about a minute.`}</p>
            <div class="eq">\\[ p(h) = p_0\\,e^{-h/H_p},\\qquad H_p = 7.5\\ \\mathrm{km} \\]</div>
            ${Sym.where([['h', N`altitude above the surface`, 'm'], ['H_p', N`pressure scale height used here`, 'm'], 'p_0'], N`Every 7.5 km the pressure falls by a factor e (2.718). At 30 km it is 1.8 % of sea level.`)}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">7.3</span>${T`Thrust-to-weight: at liftoff and later`}</h2>
          <div class="prose">
            <p>${T`The thrust-to-weight ratio at liftoff must exceed 1, or the vehicle stays on the pad. Launchers fly with about 1.2 to 1.5. Lower wastes little thrust but climbs slowly, and the gravity losses grow. Higher needs bigger engines and a stronger structure. While the engines burn, the mass falls and the thrust rises, so the TWR grows quickly:`}</p>
            <div class="eq">\\[ \\mathrm{TWR}_0 = \\frac{F_{SL}}{m_0 g_0},\\qquad \\mathrm{TWR}(t) = \\frac{F(t)}{\\left(m_0 - \\dot m\\,t\\right) g_0} \\]</div>
            ${Sym.where(['twr', 'm0', 'g0', 'mdot', ['F_{SL}', N`sea-level thrust of the first stage (all engines)`, 'N']], N`The acceleration along the thrust is (TWR − 1) g₀ if you fly straight up. At the end of the burn the same engines push a much lighter vehicle.`)}
            <p>${T`Our scaled Saturn-like preset starts at TWR 1.31 and reaches 5.3 just before its first stage is empty. The real Saturn V shut down its centre engine early in the S-IC burn to hold the acceleration below about 4 g (module ${Progress.code('ascent')}). That limit is the crew’s and the structure’s, not the engines’.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">7.4</span>${T`Two stages, two jobs`}</h2>
          <div class="prose">
            <p>${T`The rocket equation of module ${Progress.code('rockets')} adds up stage by stage. The two stages face different problems:`}</p>
            <ul>
              <li>${T`The <b>first stage</b> fights gravity and the air. It needs a high TWR, so it is sized for <b>thrust</b>. Dense propellant, a compact tank and a robust engine matter more than the last seconds of Isp.`}</li>
              <li>${T`The <b>upper stage</b> works at high altitude and high speed. Gravity matters less, because it is moving mostly sideways. It can have a TWR below 1 at ignition. It is sized for <b>Isp</b>, with a large vacuum bell and a light tank.`}</li>
            </ul>
            <p>${T`Look at the scaled Saturn-like preset in the lab: its second stage has a TWR of 0.99 at ignition and 5.9 at the end. A launcher with only the upper stage’s engines could never leave the pad.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">7.5</span>${T`Where the Δv goes`}</h2>
          <div class="prose">
            <p>${T`Circular orbital speed at 200 km is 7.79 km/s. A launcher must supply more than that, because gravity and the air take part of the thrust. The vehicle’s ideal Δv, the integral of its thrust acceleration, is:`}</p>
            <div class="eq">\\[ \\Delta v_{ideal} = v_{orbit} + \\Delta v_{grav} + \\Delta v_{drag} + \\Delta v_{steer} - \\Delta v_{rot} \\]</div>
            ${Sym.where([['\\Delta v_{ideal}', N`total thrust acceleration summed over the burn: the Δv the stages deliver`, 'm/s'], 'vorbit', ['\\Delta v_{rot}', N`speed given by the Earth’s rotation (up to 0.46 km/s at the equator)`, 'm/s']], N`The loss terms are defined below.`)}
            <div class="eq">\\[ \\Delta v_{grav} = \\int g\\,\\sin\\gamma\\,dt,\\qquad \\Delta v_{drag} = \\int \\frac{D}{m}\\,dt,\\qquad \\Delta v_{steer} = \\int a_T\\,(1 - \\cos\\alpha)\\,dt \\]</div>
            ${Sym.where(['g', 'gamma', 'D', 'm', ['a_T', N`thrust acceleration F/m`, 'm/s²'], 'alpha'], N`Read each integral as “add up, second by second”. Gravity takes g sin γ every second, the share of weight that works against the climb. Drag takes D/m. Steering takes the part of the thrust that does not point along the velocity.`)}
            <p>${T`Typical totals are 1.2 to 1.8 km/s of gravity loss, 0.05 to 0.3 km/s of drag, and 0.05 to 0.2 km/s of steering. A launcher therefore needs 9.3 to 9.5 km/s of ideal Δv, less the Earth’s rotation. The lab uses a <b>non-rotating</b> Earth and a planar flight, so you need the whole 9.4 km/s or so and a launch site makes no difference. A slow pitch-over has high gravity loss. A fast pitch-over has high drag loss and a heavy aerodynamic load. Module ${Progress.code('ascent')} showed the same trade-off with the Saturn V.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">7.6</span>${T`The pitch program`}</h2>
          <div class="prose">
            <p>${T`A launcher does not choose its angle in flight. It follows a program written on the ground as a table of pitch angles against time. The pitch is measured from the vertical, 0° straight up and 90° horizontal. The usual phases are:`}</p>
            <ol>
              <li>${T`<b>Vertical rise</b>, a few seconds, to clear the pad and gain speed.`}</li>
              <li>${T`<b>Pitch kick</b>, a small tilt of one or two degrees over a few seconds. It starts the turn.`}</li>
              <li>${T`<b>Gravity turn</b>. Thrust points along the velocity, so the angle of attack is zero and the air loads are low. Gravity bends the path towards the horizontal without steering effort (module ${Progress.code('ascent')}).`}</li>
              <li>${T`<b>Upper-stage pitch table</b>. In near vacuum the guidance can steer freely. The pitch rises towards 90° as the stage builds horizontal speed. The table gives the angle at a few times, and the program interpolates linearly between rows.`}</li>
            </ol>
            <p>${T`A good first guess for the upper-stage table is the <b>linear tangent law</b>: the tangent of the elevation angle above the horizon changes linearly with time. It is the exact optimal steering for a constant-acceleration burn over flat ground with no gravity variation. A real table is close to it and then adjusted.`}</p>
            <div class="eq">\\[ \\tan\\chi(t) = \\tan\\chi_0 + k\\,t \\]</div>
            ${Sym.where([['\\chi', N`elevation of the thrust above the local horizon, 90° minus the pitch`, N`rad or °`], ['\\chi_0', N`elevation at the start of the table`, N`rad or °`], ['k', N`constant rate of change of the tangent (a search finds it)`, '1/s'], 't'], N`Two numbers, χ₀ and k, define the whole table. The rows of the lab table are samples of such a curve.`)}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">7.7</span>${T`How Mission Control iterates a table`}</h2>
          <div class="prose">
            <p>${T`Nobody writes a perfect table at the first try. The method is a loop, the same guess, check and correct as in any iteration.`}</p>
            ${Primer.box('iteration', false)}
            <ol>
              <li>${T`Pick the vehicle and a first table. Run the simulation.`}</li>
              <li>${T`Read the result at cutoff: the periapsis, and above all the flight-path angle. With the energy of the target orbit, a positive angle means the vehicle is still climbing and its periapsis is too low.`}</li>
              <li>${T`<b>Climbing at cutoff</b>: pitch over more in the late rows. <b>Falling at cutoff</b>: pitch less. <b>Propellant out before the energy is reached</b>: the vehicle lacks Δv, so add propellant or cut the losses.`}</li>
              <li>${T`Check the loads: maximum dynamic pressure and acceleration. If the dynamic pressure is too high, change the kick, which changes the whole first-stage path. Return to step 1.`}</li>
            </ol>
            <p>${T`Remember that table times are mission times. If you change the first stage, it burns out at a different time and the upper-stage rows must move with it.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">7.8</span>${T`Lab: pitch program designer`}</h2>
          <div class="prose"><p>${T`Choose a preset or edit the stage sliders to make your own vehicle. Then edit the kick and the pitch table. The simulation is planar, over a round, <b>non-rotating</b> Earth, with the exponential atmosphere of this module. Stage 1 follows a vertical rise, the kick and a gravity turn. Stage 2 follows your table. Stage 2 cuts off when it has the energy of a circular orbit at 200 km: your table decides the shape of the orbit. The preset tables are drafts that do <b>not</b> reach orbit. Only flights after your own edits count for the objectives.`}</p></div>
          <div class="lab tl-lab" id="ln">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Pitch program designer`}</h3><span class="spacer"></span>
              <div class="ctl" style="margin:0"><select id="ln-pre" aria-label="${T`Vehicle preset`}">${Object.entries(PRESETS).map(([k, p]) => `<option value="${k}">${T(p.label)}</option>`).join('')}<option value="custom">${T`Custom vehicle`}</option></select></div>
            </div>
            <div class="stage"><canvas id="ln-cv" aria-label="${T`Ascent trajectory over the curved Earth, with the coast after cutoff`}"></canvas><div class="overlay" id="ln-ov"></div><div class="badge" id="ln-badge"></div></div>
            <div class="tl-side">
              <dl class="readout" id="ln-live"></dl>
              <dl class="readout" id="ln-res"></dl>
            </div>
            <div class="tl-transport">
              <div class="btn-row"><button class="btn primary" id="ln-play">${T`▸ Play`}</button><button class="btn" id="ln-restart">${T`⟲ Restart`}</button></div>
              ${UI.slider({ id: 'ln-t', label: T`Mission time`, min: 0, max: 1, step: 0.0005, value: 1 })}
            </div>
            <div class="lab-foot">
              <div class="mini"><h4>${T`Altitude (km)`}</h4><canvas id="ln-c1" aria-label="${T`Altitude against time`}"></canvas></div>
              <div class="mini"><h4>${T`Speed (km/s)`}</h4><canvas id="ln-c2" aria-label="${T`Speed against time`}"></canvas></div>
              <div class="mini"><h4>${T`Dynamic pressure (kPa)`}</h4><canvas id="ln-c3" aria-label="${T`Dynamic pressure against time`}"></canvas></div>
              <div class="mini"><h4>${T`Acceleration (g)`}</h4><canvas id="ln-c4" aria-label="${T`Acceleration against time`}"></canvas></div>
              <div class="mini"><h4>${T`Pitch and path angle (° from vertical)`}</h4><canvas id="ln-c5" aria-label="${T`Commanded pitch and flight-path angle against time`}"></canvas></div>
            </div>
            <div class="tl-groups">
              <div class="tl-group">
                <h4>${T`Stage 1 and payload`}</h4>
                <p class="note" id="ln-task" style="margin:0"></p>
                ${UI.slider({ id: 'ln-pay', label: T`Payload`, min: 0, max: 1, step: 0.01, value: 0.5, unit: 't' })}
                ${FIELDS.slice(0, 5).map(([k, , , , lab, u]) => UI.slider({ id: 'ln-' + k, label: T(lab), min: 0, max: 1, step: 0.01, value: 0.5, unit: u })).join('')}
              </div>
              <div class="tl-group">
                <h4>${T`Stage 2`}</h4>
                ${FIELDS.slice(5).map(([k, , , , lab, u]) => UI.slider({ id: 'ln-' + k, label: T(lab), min: 0, max: 1, step: 0.01, value: 0.5, unit: u })).join('')}
                <dl class="readout" id="ln-des"></dl>
              </div>
              <div class="tl-group">
                <h4>${T`Pitch program`}</h4>
                ${UI.slider({ id: 'ln-kt', label: T`Pitch kick time`, min: 4, max: 30, step: 0.5, value: 10, unit: 's' })}
                ${UI.slider({ id: 'ln-ka', label: T`Pitch kick angle`, min: 0.2, max: 3, step: 0.05, value: 1.4, unit: '°' })}
                <p class="note" style="margin:0">${T`Stage 2 pitch table: time in mission seconds, angle in degrees from the vertical. Linear between rows, constant beyond them.`}</p>
                <div class="mc-fields" id="ln-rows"></div>
                <div class="btn-row"><button class="btn" id="ln-add">${T`Add row`}</button><button class="btn" id="ln-reset">${T`Reset table`}</button></div>
                <p class="note" id="ln-hint" style="margin:0"></p>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('launcher', { math: 'interp', mathLabel: N`Interpolation in a table.` })}`;

      mountLab(page.querySelector('#ln'));
      Practice.embed(page.querySelector('#practice-slot'), 'launcher', 3);
    },
  });

  /* ---------------- The lab ---------------- */
  function mountLab(root) {
    const $ = (sel) => root.querySelector(sel);
    const num = (s) => { s = String(s).replace(/\s|\u202f/g, '').replace('−', '-').replace(',', '.'); if (s === '') return NaN; const v = Number(s); return isFinite(v) ? v : NaN; };
    const fmts = { 'ln-pay': (v) => f(v, 2), 'ln-kt': (v) => f(v, 1), 'ln-ka': (v) => f(v, 2) };
    FIELDS.forEach(([k, , key]) => { fmts['ln-' + k] = key.startsWith('isp') ? (v) => f(v, 0) : (v) => f(v, 2); });
    let rows = [], touchedV = false, touchedP = false, res = null, sum = null, tcur = 0, playing = false, base = 'sat';

    const sliderEl = (id) => $('#' + id);
    function loadPreset(key) {
      const p = PRESETS[key]; base = key;
      const setR = (id, v, lo, hi, step) => { const el = sliderEl(id); el.min = lo; el.max = hi; el.step = step; el.value = v; };
      setR('ln-pay', p.payload / 1e3, p.payload / 1e3 * 0.2, p.payload / 1e3 * 3, niceStep(p.payload / 1e3));
      for (const [k, si, key2, sc] of FIELDS) {
        const v = p.stages[si][key2] / sc;
        if (key2.startsWith('isp')) setR('ln-' + k, v, 150, 480, 1); else setR('ln-' + k, v, v * 0.4, v * 2.2, niceStep(v));
      }
      setR('ln-kt', p.kt, 4, 30, 0.5); setR('ln-ka', p.ka, 0.2, 3, 0.05);
      rows = p.rows.map(([t, pitch]) => ({ t, pitch }));
      touchedV = false; touchedP = false;
      $('#ln-task').textContent = T(p.task);
      renderRows(); ctl.update();
    }

    function vehicle(v) {
      const p = PRESETS[base];
      const st = [0, 1].map((i) => ({ name: 'S' + (i + 1), prop: v[`ln-${i + 1}p`] * 1e3, dry: v[`ln-${i + 1}d`] * 1e3, fVac: v[`ln-${i + 1}f`] * 1e6, ispSL: v[`ln-${i + 1}s`], ispVac: v[`ln-${i + 1}v`] }));
      return { payload: v['ln-pay'] * 1e3, diameter: p.diameter, cd: p.cd, stages: st };
    }

    function renderRows() {
      const box = $('#ln-rows');
      box.innerHTML = `<span class="note" style="margin:0">${T`time (s)`}</span><span class="note" style="margin:0">${T`pitch (°)`}</span>` + rows.map((r, i) => `<div style="display:flex;gap:.3rem"><input type="text" inputmode="decimal" data-i="${i}" data-k="t" value="${UI.dec(String(r.t))}" aria-label="${T`row time`} ${i + 1}" autocomplete="off"></div><div style="display:flex;gap:.3rem"><input type="text" inputmode="decimal" data-i="${i}" data-k="pitch" value="${UI.dec(String(r.pitch))}" aria-label="${T`row pitch`} ${i + 1}" autocomplete="off"><button class="btn" data-del="${i}" aria-label="${T`Remove row`} ${i + 1}" ${rows.length <= 1 ? 'disabled' : ''}>×</button></div>`).join('');
    }

    function evaluate(v) {
      const veh = vehicle(v);
      sum = Pl.summary(veh);
      const prog = { kickTime: v['ln-kt'], kickAngle: v['ln-ka'], rows: rows.filter((r) => isFinite(r.t) && isFinite(r.pitch)), targetAlt: TARGET_ALT };
      res = Pl.simulate(veh, prog, { dt: 0.5 });
      tcur = res.t; sliderEl('ln-t').value = 1;
      renderAll(veh);
      objectives(veh);
    }

    function objectives(veh) {
      const m0 = sum.m0;
      if (touchedV && sum.twr0 > 1.2 && sum.dvVac >= 9500 && veh.payload / m0 >= 0.015) Progress.done('launcher', 'twr');
      const orb = res.outcome === 'orbit' && res.perigee > 150e3;
      if (orb && touchedP) { Progress.done('launcher', 'orbit'); if (res.maxQ.q < Q_LIMIT) Progress.done('launcher', 'maxq'); }
      if (orb && touchedP && touchedV) Progress.done('launcher', 'own');
    }

    function sampleAt(t) {
      const tr = res.trace; let lo = 0, hi = tr.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (tr[mid].t < t) lo = mid + 1; else hi = mid; }
      return tr[lo];
    }
    const sgn = (x, d = 1) => (x >= 0 ? '+' : '−') + f(Math.abs(x), d);

    function renderAll(veh) {
      const o = res.outcome, b = $('#ln-badge');
      if (o === 'orbit') { b.textContent = T`Orbit ${f(res.perigee / 1e3, 0)} × ${f(res.apogee / 1e3, 0)} km`; b.className = 'badge ' + (res.perigee > 150e3 ? 'good' : 'warn'); }
      else { b.textContent = T(OUTCOME[o][0]) + (o === 'suborbital' || o === 'decay' ? ` (${f(res.perigee / 1e3, 0)} × ${f(res.apogee / 1e3, 0)} km)` : ''); b.className = 'badge ' + OUTCOME[o][1]; }
      let hint = '';
      if (o === 'pad') hint = T`The liftoff thrust is below the weight. Add thrust or remove mass.`;
      else if (o === 'crash') hint = T`The vehicle hit the ground: it pitched over too early or too far. Reduce the kick, or delay it.`;
      else if (res.cutoff === 'depletion' && o !== 'orbit') hint = T`The propellant ran out before the vehicle had the energy of the 200 km orbit. Cut the losses or add Δv.`;
      else if (o === 'suborbital' || o === 'decay' || (o === 'orbit' && res.perigee <= 150e3)) hint = res.gamma > 0.05 ? T`At cutoff the vehicle is still climbing (γ = ${sgn(res.gamma, 1)}°). Pitch over more in the late rows.` : T`At cutoff the vehicle is already descending (γ = ${sgn(res.gamma, 1)}°). Pitch over less.`;
      else hint = T`In orbit. Compare the losses and the maximum dynamic pressure with the limit of ${f(Q_LIMIT / 1e3, 0)} kPa.`;
      $('#ln-hint').textContent = hint;
      $('#ln-ov').textContent = T`Round, non-rotating Earth · altitude ×${f(viewEx, 0)}`;
      const s1 = res.events.find((e) => e.label === 'burnout' && e.stage === 0);
      const sb = s1 && sampleAt(s1.t);
      $('#ln-des').innerHTML = `<dt>${T`Liftoff TWR`}</dt><dd class="hl">${f(sum.twr0, 2)}</dd><dt>${T`Liftoff mass`}</dt><dd>${f(sum.m0 / 1e3, 1)} t</dd><dt>${T`Payload fraction`}</dt><dd>${f(100 * veh.payload / sum.m0, 2)} %</dd><dt>${T`Vacuum Δv`}</dt><dd>${f(sum.dvVac, 0)} m/s</dd><dt>${T`Stage 1 burns`}</dt><dd>${f(sum.stages[0].tb, 0)} s</dd>`;
      const L = res.losses;
      $('#ln-res').innerHTML = `<dt class="sub" style="grid-column:1/-1">${T`Flight result`}</dt>
        <dt>${T`Stage 1 burnout`}</dt><dd>${sb ? `${f(sb.t, 0)} s · ${f(sb.h / 1e3, 0)} km · ${f(sb.v, 0)} m/s` : '—'}</dd>
        <dt>${T`Max q`}</dt><dd class="${res.maxQ.q < Q_LIMIT ? '' : 'hl'}">${f(res.maxQ.q / 1e3, 1)} kPa · ${f(res.maxQ.t, 0)} s</dd>
        <dt>${T`Max acceleration`}</dt><dd>${f(res.maxG.g, 2)} g</dd>
        <dt>${T`Cutoff`}</dt><dd>${f(res.t, 0)} s · ${f(res.h / 1e3, 0)} km · ${f(res.v, 0)} m/s</dd>
        <dt>${T`Flight-path angle`}</dt><dd>${sgn(res.gamma, 2)}°</dd>
        <dt>${T`Periapsis × apoapsis`}</dt><dd class="hl">${f(res.perigee / 1e3, 0)} × ${f(res.apogee / 1e3, 0)} km</dd>
        <dt>${T`Propellant left`}</dt><dd>${f(res.propLeft / 1e3, 2)} t</dd>
        <dt class="sub" style="grid-column:1/-1">${T`Δv budget`}</dt>
        <dt>${T`Ideal Δv used`}</dt><dd>${f(res.dvIdeal, 0)} m/s</dd>
        <dt>${T`Gravity loss`}</dt><dd>${f(L.gravity, 0)} m/s</dd>
        <dt>${T`Drag loss`}</dt><dd>${f(L.drag, 0)} m/s</dd>
        <dt>${T`Steering loss`}</dt><dd>${f(L.steering, 0)} m/s</dd>`;
      renderLive(); redrawAll();
    }

    function renderLive() {
      if (!res) return;
      const s = sampleAt(tcur);
      $('#ln-live').innerHTML = `<dt class="sub" style="grid-column:1/-1">${T`At mission time`}</dt><dt>T+</dt><dd class="hl">${f(s.t, 0)} s · ${T`stage`} ${s.stage + 1}</dd>
        <dt>${T`Altitude`}</dt><dd>${f(s.h / 1e3, 1)} km</dd><dt>${T`Speed`}</dt><dd>${f(s.v, 0)} m/s</dd><dt>${T`Thrust`}</dt><dd>${f(s.F / 1e6, 2)} MN · Isp ${f(s.isp, 0)} s</dd>
        <dt>${T`Pitch command`}</dt><dd>${f(s.pitch, 1)}°</dd><dt>q</dt><dd>${f(s.q / 1e3, 1)} kPa</dd><dt>${T`Acceleration`}</dt><dd>${f(s.g, 2)} g</dd>`;
    }

    /* ---- drawing ---- */
    let viewEx = 1;
    const view = UI.canvas($('#ln-cv'), null);
    view.draw = (ctx, w, h) => {
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, K, 60);
      if (!res) return;
      const tr = res.trace, co = res.coast;
      const pts = tr.map((p) => [p.x, p.h]).concat(co.map((p) => [p.x, p.h]));
      const xmin = 0, xmax = Math.max(...pts.map((p) => p[0]), 400e3), hmax = Math.max(...pts.map((p) => p[1]), 100e3);
      const mx = 26, s = (w - 2 * mx) / (xmax - xmin), phiMax = (xmax - xmin) / RE, phiMid = (xmax + xmin) / 2 / RE;
      const rE = RE * s;
      const baseY = h - 14 - rE * (1 - Math.cos(phiMax / 2));
      viewEx = Math.max(1, Math.min(14, (baseY - 28) / (hmax * s)));
      const cx = w / 2 - mx + mx, cy = baseY + rE;
      const P = (x, hh) => { const phi = x / RE - phiMid; return [cx + rE * Math.sin(phi), cy - rE * Math.cos(phi) - hh * s * viewEx]; };
      UI.drawEarth(ctx, cx, cy, rE, K);
      // 100 km line
      ctx.strokeStyle = K.line; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(cx, cy - 100e3 * s * viewEx, rE, -Math.PI / 2 - phiMax / 2 - 0.05, -Math.PI / 2 + phiMax / 2 + 0.05); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = K.muted; ctx.font = `10px ${K.mono}`; ctx.textAlign = 'left'; ctx.fillText(T`100 km`, 8, P(0, 100e3)[1] - 3);
      const path = (arr, k) => { ctx.beginPath(); arr.forEach((p, i) => { const q = P(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); };
      if (co.length) { ctx.strokeStyle = K.trace2; ctx.lineWidth = 1.6; ctx.setLineDash([5, 5]); path(co.map((p) => [p.x, p.h])); ctx.stroke(); ctx.setLineDash([]); }
      ctx.strokeStyle = K.muted; ctx.lineWidth = 2; path(tr.map((p) => [p.x, p.h])); ctx.stroke();
      ctx.strokeStyle = K.trace; ctx.lineWidth = 2.6; path(tr.filter((p) => p.t <= tcur).map((p) => [p.x, p.h])); ctx.stroke();
      for (const e of res.events) {
        if (e.label !== 'burnout' && e.label !== 'cutoff') continue;
        const sp = sampleAt(e.t), q = P(sp.x, sp.h);
        ctx.fillStyle = K.warn; ctx.beginPath(); ctx.arc(q[0], q[1], 3.5, 0, 7); ctx.fill();
        ctx.fillStyle = K.muted; ctx.textAlign = 'left'; ctx.fillText(e.label === 'cutoff' ? T`cutoff` : T`S1 out`, q[0] + 6, q[1] + 12);
      }
      const sp = sampleAt(tcur), q = P(sp.x, sp.h);
      ctx.fillStyle = K.accent; ctx.beginPath(); ctx.arc(q[0], q[1], 5, 0, 7); ctx.fill();
    };
    function mini(id, get, opts = {}) {
      const el = $('#' + id);
      const c = UI.canvas(el, (ctx, w, h) => {
        if (!res) return;
        const K = UI.tok();
        const series = get(K);
        const marks = res.events.filter((e) => e.label === 'burnout' && e.stage === 0).map((e) => ({ x: e.t, color: K.muted }));
        UI.chart(ctx, w, h, { series, xMin: 0, xMax: res.t, marks, cursor: tcur, hlines: opts.hlines ? opts.hlines(K) : [], yMin: opts.yMin, yMax: opts.yMax, xFmt: (v) => v });
      });
      return c;
    }
    const tr = () => res.trace;
    const charts = [
      mini('ln-c1', (K) => [{ data: tr().map((p) => [p.t, p.h / 1e3]), color: K.trace, end: false }]),
      mini('ln-c2', (K) => [{ data: tr().map((p) => [p.t, p.v / 1e3]), color: K.trace2, end: false }]),
      mini('ln-c3', (K) => [{ data: tr().map((p) => [p.t, p.q / 1e3]), color: K.accent, end: false }], { hlines: (K) => [{ y: Q_LIMIT / 1e3, label: T`limit`, color: K.warn }] }),
      mini('ln-c4', (K) => [{ data: tr().map((p) => [p.t, p.g]), color: K.good, end: false }]),
      mini('ln-c5', (K) => [{ data: tr().map((p) => [p.t, p.pitch]), color: K.accent, end: false }, { data: tr().map((p) => [p.t, p.path]), color: K.muted, end: false, dash: [4, 3] }], { yMin: 0, yMax: 100 }),
    ];
    const redrawAll = () => { view.redraw(); charts.forEach((c) => c.redraw()); };

    /* ---- controls ---- */
    const ctl = UI.bindControls(root, fmts, (v, src) => {
      if (src === 'ln-pre') { if (v['ln-pre'] !== 'custom') loadPreset(v['ln-pre']); return; }
      if (src && src.startsWith('ln-') && src !== 'ln-t') {
        if (src === 'ln-kt' || src === 'ln-ka') touchedP = true;
        else { touchedV = true; $('#ln-pre').value = 'custom'; }
      }
      if (src === 'ln-t') { tcur = v['ln-t'] * res.t; renderLive(); redrawAll(); return; }
      evaluate(v);
    });
    $('#ln-rows').addEventListener('input', (e) => {
      const el = e.target; if (!el.dataset.k) return;
      const x = num(el.value); rows[+el.dataset.i][el.dataset.k] = x; touchedP = true;
      if (isFinite(x)) { const v = ctl.read(); evaluate(v); }
    });
    $('#ln-rows').addEventListener('change', (e) => {
      if (!e.target.dataset.k) return;
      rows = Pl.sortRows(rows); renderRows();
    });
    $('#ln-rows').addEventListener('click', (e) => {
      const d = e.target.closest('[data-del]'); if (!d || rows.length <= 1) return;
      rows.splice(+d.dataset.del, 1); touchedP = true; renderRows(); evaluate(ctl.read());
    });
    $('#ln-add').addEventListener('click', () => {
      const last = rows[rows.length - 1] || { t: 100, pitch: 80 };
      rows.push({ t: Math.round(last.t + 60), pitch: Math.min(100, last.pitch + 3) }); touchedP = true; renderRows(); evaluate(ctl.read());
    });
    $('#ln-reset').addEventListener('click', () => { rows = PRESETS[base].rows.map(([t, pitch]) => ({ t, pitch })); touchedP = false; renderRows(); evaluate(ctl.read()); });
    const playBtn = $('#ln-play');
    playBtn.addEventListener('click', () => { if (!playing && tcur >= res.t - 0.01) tcur = 0; playing = !playing; playBtn.textContent = playing ? T`❚❚ Pause` : T`▸ Play`; });
    $('#ln-restart').addEventListener('click', () => { tcur = 0; playing = true; playBtn.textContent = T`❚❚ Pause`; });
    UI.loop((dt) => {
      if (!playing || !res) return;
      tcur = Math.min(res.t, tcur + dt * 20);
      if (tcur >= res.t) { playing = false; playBtn.textContent = T`▸ Play`; }
      sliderEl('ln-t').value = tcur / res.t; const o = $('#ln-t-out'); if (o) o.textContent = f(tcur, 0) + ' s';
      renderLive(); redrawAll();
    });
    fmts['ln-t'] = () => f(tcur, 0);
    loadPreset('sat');
  }
})();
