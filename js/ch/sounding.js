/* Chapter: Measuring an Atmosphere. Sounding rockets, hydrostatic equilibrium, the scale height, least-squares fitting of ln p against h.
   Lab: a sounding range. Physics lives in sounding.phys.js (Phys_sounding). */
(function () {
  'use strict';
  const Ps = window.Phys_sounding;
  const R = String.raw;
  const f = UI.fmt;
  const rnd = (a, b, step = 1) => a + Math.round(Math.random() * ((b - a) / step)) * step;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const fp = (p) => f(p, p >= 1000 ? 0 : p >= 100 ? 1 : p >= 10 ? 2 : 3);

  /* ---------- figure and derivation helper (the .fig and details.deriv styles come from js/ch/orbits.js) ---------- */
  const deriv = (what, body) => `<details class="deriv"><summary><span class="dv-tag">${T`Show the derivation`}</span><span class="dv-what">${what}</span></summary><div class="dv-body">${body}</div></details>`;
  const lbs = (list, W, H) => list.map(([x, y, t, c]) => `<span class="lb ${c || ''}" style="left:${(100 * x / W).toFixed(2)}%;top:${(100 * y / H).toFixed(2)}%">${t}</span>`).join('');
  // the same atmosphere twice: pressure against altitude (a curve), then ln p against altitude (a straight line)
  function figAtmos() {
    const W = 320, H = 190, x0 = 50, yb = 156, yt = 22, xr = 305, Hp = 80, top = 134;
    const axes = `<path class="f-mu" d="M${x0},${yt - 8}V${yb}H${xr}"/>`;
    const curve = []; for (let i = 0; i <= 60; i++) { const x = 245 * i / 60; curve.push([x0 + x, yb - top * Math.exp(-x / Hp)]); }
    const pts = curve.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('');
    const ye = yb - top / Math.E;
    const a = `<figure class="fig sub" role="img" aria-label="${T`Pressure against altitude is a curve that falls by the same fraction at every step up. After one scale height H the pressure is the surface pressure divided by e.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${axes}
        <path class="f-mu f-dash" d="M${x0},${ye.toFixed(1)}H${x0 + Hp}V${yb}"/>
        <path class="f-tr" d="${pts}"/>
        <circle class="f-ac-fill" cx="${x0}" cy="${yb - top}" r="3.5"/><circle class="f-ac-fill" cx="${x0 + Hp}" cy="${ye.toFixed(1)}" r="3.5"/>
      </svg>${lbs([[x0 - 6, yb - top, 'p₀', 'ink r'], [x0 - 6, ye, 'p₀/e', 'm r'], [x0 + Hp, yb + 12, 'H', 'acc'], [x0, yt - 18, 'p', 'm'], [xr - 4, yb + 12, 'h', 'm']], W, H)}</div>
      <figcaption>${T`Pressure \\(p\\) against altitude \\(h\\): after every climb of \\(H\\) the pressure is divided by \\(e\\) (a loss of 63 %).`}</figcaption></figure>`;
    const k = 30 / Hp, yl = (x) => 46 + k * x;   // 30 px of ln p per scale height
    const dots = [[22, .06], [56, -.07], [98, .05], [140, -.04], [186, .08], [232, -.06]].map(([x, d]) => `<circle class="f-ink-fill" cx="${x0 + x}" cy="${(yl(x) + d * 30).toFixed(1)}" r="2.6"/>`).join('');
    const tx = 70, tri = `M${x0 + tx},${yl(tx).toFixed(1)}H${x0 + tx + Hp}V${yl(tx + Hp).toFixed(1)}`;
    const b = `<figure class="fig sub" role="img" aria-label="${T`The natural logarithm of the pressure against altitude is a straight line. Its slope is minus one over the scale height: over a climb of H the line drops by exactly 1. Measured points scatter around it.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${axes}
        <path class="f-tr" d="M${x0},${yl(0).toFixed(1)}L${x0 + 245},${yl(245).toFixed(1)}"/>
        <path class="f-ac-ln thin" d="${tri}"/>${dots}
        <circle class="f-ac-fill" cx="${x0}" cy="${yl(0).toFixed(1)}" r="3.5"/>
      </svg>${lbs([[x0 - 6, yl(0), 'ln p₀', 'ink r'], [x0 + tx + Hp / 2, yl(tx) - 11, 'H', 'acc'], [x0 + tx + Hp + 6, (yl(tx) + yl(tx + Hp)) / 2, '1', 'acc l'], [x0, yt - 18, 'ln p', 'm'], [xr - 4, yb + 12, 'h', 'm']], W, H)}</div>
      <figcaption>${T`The same atmosphere as \\(\\ln p\\) against \\(h\\): a straight line of slope \\(-1/H\\), the triangle showing a drop of 1 over a climb of \\(H\\). The dots are noisy gauge readings; the fit draws the line through them.`}</figcaption></figure>`;
    return `<div class="fig-pair">${a}${b}</div>`;
  }

  Progress.register('sounding', {
    name: N`Measuring an Atmosphere`, topic: 'sounding', glyph: 'sounding',
    briefing: N`Every ascent and every entry in this course leans on one thing you have not measured yet: the air, {name}. On a new world nobody hands you a table. You send up sounding rockets, read a pressure gauge on the way, and fit a model to the numbers. In this module you do exactly that on four unknown atmospheres, and you find out how much a good fit depends on how high you fly.`,
    objectives: [
      { id: 'reach', text: N`Launch a rocket yourself that climbs above two scale heights` },
      { id: 'hfit', text: N`Estimate the scale height H within 5 % of the truth` },
      { id: 'p0fit', text: N`Estimate the surface pressure p₀ within 6 % of the truth` },
      { id: 'beta', text: N`Find the ballistic coefficient β from the coast deceleration, within 20 %` },
      { id: 'qual', text: N`Qualify: answer 2 atmosphere problems correctly` },
    ],
    debrief: N`You can now turn a column of noisy pressure readings into a model of the air, and you know why a rocket that barely leaves the pad teaches you so little, {name}. Next the ascent itself: the air you just measured decides how hard the rocket is pushed on the way up.`,
  });

  /* ---------------- Practice ---------------- */
  const GASES = [
    { name: N`Earth-like air`, M: 28.96, g: 9.81, T: () => rnd(220, 300, 5) },
    { name: N`a thin carbon dioxide atmosphere`, M: 43.4, g: 3.71, T: () => rnd(190, 230, 5) },
    { name: N`a cold nitrogen atmosphere`, M: 28.0, g: 1.35, T: () => rnd(90, 100, 2) },
  ];
  const registerPractice = () => Practice.register('sounding', N`Measuring an atmosphere`, [
    { title: N`Scale height from temperature and gas`, make() {
      const G = pick(GASES), Tk = G.T(), H = Ps.scaleHeight(Tk, G.M / 1000, G.g) / 1000;
      return { q: T`The air is ${T(G.name)}: molar mass <b>${f(G.M, 2)} g/mol</b>, temperature <b>${f(Tk, 0)} K</b>, gravity <b>${f(G.g, 2)} m/s²</b>. What is its scale height? (R = 8.314 J/(mol·K))`, answer: H, unit: 'km', tol: 0.01,
        hint: T`H = RT/(Mg). Convert the molar mass to kg/mol first.`,
        sol: R`\[ H = \frac{RT}{Mg} = \frac{8.314\times ${f(Tk, 0)}}{${f(G.M / 1000, 5)}\times ${f(G.g, 2)}} = ${f(H * 1000, 0)}\ \mathrm{m} = ${f(H, 2)}\ \mathrm{km} \]` };
    } },
    { title: N`Pressure at altitude`, make() {
      const p0 = rnd(90, 101, 1), H = rnd(70, 85, 1) / 10, h = rnd(4, 30, 1), p = p0 * Math.exp(-h / H);
      return { q: T`An atmosphere has a surface pressure of <b>${f(p0, 0)} kPa</b> and a scale height of <b>${f(H, 1)} km</b>. Assuming an exponential atmosphere, what is the pressure at <b>${f(h, 0)} km</b>?`, answer: p, unit: 'kPa', tol: 0.01,
        hint: T`p = p₀ e<sup>−h/H</sup>. Work out h/H first.`,
        sol: R`\[ p = p_0\,e^{-h/H} = ${f(p0, 0)}\cdot e^{-${f(h, 0)}/${f(H, 1)}} = ${f(p0, 0)}\times ${f(Math.exp(-h / H), 5)} = ${f(p, 2)}\ \mathrm{kPa} \]` };
    } },
    { title: N`Scale height from two readings`, make() {
      const H = rnd(60, 130, 1) / 10, p1 = rnd(40, 90, 1), h1 = rnd(2, 6, 1), h2 = h1 + rnd(8, 20, 1), p2 = Math.round(p1 * Math.exp(-(h2 - h1) / H) * 100) / 100;
      const Hc = (h2 - h1) / Math.log(p1 / p2);
      return { q: T`A sounding rocket reads <b>${f(p1, 2)} kPa</b> at <b>${f(h1, 0)} km</b> and <b>${f(p2, 2)} kPa</b> at <b>${f(h2, 0)} km</b>. What scale height does this pair of readings give?`, answer: Hc, unit: 'km', tol: 0.01,
        hint: T`Take the logarithm of the ratio: ln(p₁/p₂) = (h₂ − h₁)/H.`,
        sol: R`\[ \ln\frac{p_1}{p_2} = \ln\frac{${f(p1, 2)}}{${f(p2, 2)}} = ${f(Math.log(p1 / p2), 4)}, \qquad H = \frac{h_2-h_1}{\ln(p_1/p_2)} = \frac{${f(h2 - h1, 0)}}{${f(Math.log(p1 / p2), 4)}} = ${f(Hc, 2)}\ \mathrm{km} \]` };
    } },
    { title: N`Least-squares slope from three points`, make() {
      const hs = [0, rnd(4, 8, 1), rnd(16, 24, 1)], H = rnd(70, 90, 1) / 10, y0 = 11.5 + rnd(-3, 3, 1) / 10;
      const ys = hs.map((h) => Math.round((y0 - h / H + (Math.random() - 0.5) * 0.12) * 100) / 100);
      const fit = Ps.fit(hs, ys), Hc = -1 / fit.b;
      return { q: T`Three readings of ln p (p in pascals) at altitudes <b>${hs.map((h) => f(h, 0)).join(', ')} km</b> are <b>${ys.map((y) => f(y, 2)).join(', ')}</b>. Fit a straight line by least squares. What scale height does the slope give?`, answer: Hc, unit: 'km', tol: 0.02,
        hint: T`Slope b = Σ(h − h̄)(y − ȳ) / Σ(h − h̄)², then H = −1/b.`,
        sol: R`\[ \bar h = ${f(fit.mx, 3)},\quad \bar y = ${f(fit.my, 4)},\quad S_{xx} = \sum (h-\bar h)^2 = ${f(fit.sxx, 3)},\quad b = \frac{\sum (h-\bar h)(y-\bar y)}{S_{xx}} = ${f(fit.b, 5)}\ \mathrm{km^{-1}} \]
          \[ H = -\frac{1}{b} = ${f(Hc, 2)}\ \mathrm{km} \]` };
    } },
    { title: N`Air density from the coast deceleration`, make() {
      const beta = rnd(1500, 3500, 100), g = 9.81, v = rnd(250, 600, 10), rho0 = rnd(30, 120, 1) / 100;
      const a = Math.round(-(g + rho0 * v * v / (2 * beta)) * 10) / 10, rho = 2 * beta * (-a - g) / (v * v);
      return { q: T`A rocket coasts upward above Earth at <b>${f(v, 0)} m/s</b>. Its ballistic coefficient is <b>${f(beta, 0)} kg/m²</b>. The tracking radar measures an acceleration of <b>${f(a, 1)} m/s²</b> (negative: slowing down). Take g = 9.81 m/s². What is the air density?`, answer: rho, unit: 'kg/m³', tol: 0.03,
        hint: T`Drag deceleration = |a| − g = ρv²/(2β). Solve for ρ.`,
        sol: R`\[ \frac{D}{m} = |a| - g = ${f(-a, 1)} - ${f(g, 2)} = ${f(-a - g, 2)}\ \mathrm{m/s^2},\qquad \rho = \frac{2\beta\,(|a|-g)}{v^2} = \frac{2\times ${f(beta, 0)}\times ${f(-a - g, 2)}}{${f(v, 0)}^2} = ${f(rho, 3)}\ \mathrm{kg/m^3} \]` };
    } },
  ], [
    { q: N`Why do we fit a straight line to ln p against h, rather than fit p against h directly?`, opts: [N`The model p = p₀e^(−h/H) becomes a straight line in ln p, and a gauge error is a percentage of the reading, which makes the scatter in ln p even`, N`Because ln p is easier to print in a table`, N`Because pressure is negative at high altitude`, N`Because a straight line always passes through every point`], a: 0, why: N`Taking the logarithm turns the exponential into ln p = ln p₀ − h/H: slope −1/H, intercept ln p₀. Gauge errors are proportional to the reading, so every point has about the same error in ln p. Fitting p directly would let the few large low-altitude values dominate.` },
    { q: N`A sounding rocket reaches only half a scale height. What is the main problem for the fit?`, opts: [N`The pressure barely changes over that range, so noise hides the slope and H is poorly known`, N`The pressure is too low to read`, N`The atmosphere is no longer exponential`, N`Nothing: a short flight is as good as a long one`], a: 0, why: N`The uncertainty of the slope is σ/√Sxx, and Sxx grows with the square of the altitude spread. Over half a scale height the pressure drops only about 40 %, a few times the noise. A flight over several scale heights spans a factor of a hundred or more.` },
    { q: N`Dynamic pressure q = ½ρv² peaks at max-q during an ascent, then falls although the rocket keeps accelerating. Why?`, opts: [N`The density falls faster than the speed squared grows`, N`The engine throttles back`, N`Drag stops acting above 11 km`, N`The speed starts to decrease`], a: 0, why: N`Low in the atmosphere the speed is small and the density large. As the rocket climbs, v² grows slowly, while ρ shrinks by a factor e every scale height. The product rises, peaks, then drops: that peak is max-q.` },
  ]);
  registerPractice();

  /* ---------------- Lab scenarios ---------------- */
  const SCEN = {
    earth: { label: N`Earth-like atmosphere`, task: N`A planet with air like ours, but the numbers are yours to find.` },
    thin: { label: N`Thin, cold world`, task: N`Low gravity, thin air, a large scale height. The gauge needs a sensitive range.` },
    dense: { label: N`Dense, hot world`, task: N`Heavy air under hot gas: a high surface pressure and a very large scale height.` },
    std: { label: N`Earth, real layers`, task: N`The 1976 U.S. Standard Atmosphere. No single exponential is exact here: the best fit depends on the altitudes you sample.` },
  };
  const SCEN_KEYS = Object.keys(SCEN);
  const MOTOR_LABEL = { small: N`Small motor (25 kg, 3 s burn)`, medium: N`Medium motor (70 kg, 8 s burn)`, large: N`Large motor (200 kg, 20 s burn)` };

  App.chapter({
    id: 'sounding', phase: N`Sounding`, title: N`Measuring an Atmosphere`, lab: N`Sounding range`,
    blurb: N`Noisy pressure readings in, a model of the air out: scale height, surface pressure and the drag it causes.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('sounding')} · Sounding`,
          title: T`Measuring an Atmosphere`,
          lede: T`Before a rocket can be sized for its ascent, or a capsule for its entry, someone has to know how the air thins with height. On a new world nobody knows. This module shows how a handful of sounding rockets (small research rockets that fly straight up and come back down), one pressure gauge and a straight-line fit give the answer.`,
          refs: [T`Sellers · Understanding Space`, T`U.S. Standard Atmosphere, 1976 (NOAA, NASA, USAF)`],
        })}
        ${Progress.briefing('sounding', { theory: 'theory', lab: 'sd', math: 'refresher', mathLabel: N`What dp/dh means.` })}

        <section class="section" id="theory">
          <h2><span class="idx">5.1</span>${T`What a pressure gauge tells you`}</h2>
          <div class="prose">
            <p>${T`Air has weight. The pressure at any height is the weight of the air above, spread over one square metre. Climb a little and some of that air is below you: the pressure drops by the weight of the slice you passed. A slice of thickness dh holds a mass ρ dh per square metre, so its weight is ρ g dh:`}</p>
            <div class="eq">\\[ \\frac{dp}{dh} = -\\rho\\,g \\]</div>
            ${Sym.where([['p', N`air pressure at altitude h`, 'Pa'], ['h', N`altitude above a reference level (datum)`, 'm'], 'rho', 'g', ['dp/dh', N`the rate at which pressure changes per metre of climb`, 'Pa/m']], N`This is hydrostatic equilibrium: each layer of air is held up by the pressure difference across it. In words: every metre you climb removes ρg pascals. The minus sign says that pressure falls with height.`)}
            ${Primer.box('derivative', false, 'refresher')}
            <p>${T`A check. At sea level the pressure is 101 325 Pa. Divide by g = 9.81 m/s² and you get 10 330 kg: about ten tonnes of air sit above every square metre of ground.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.2</span>${T`The exponential atmosphere`}</h2>
          <div class="prose">
            <p>${T`The equation has two unknowns, p and ρ. The ideal gas law links them: ρ = pM/(RT), with M the molar mass of the gas (kilograms per mole) and T the absolute temperature (kelvin). Put it in and the density disappears:`}</p>
            <div class="eq">\\[ \\frac{dp}{dh} = -\\frac{Mg}{RT}\\,p \\]</div>
            ${Sym.where([['M', N`molar mass of the air (Earth 0.02896 kg/mol)`, 'kg/mol'], ['R', N`universal gas constant 8.314`, 'J/(mol·K)'], ['T', N`temperature of the air (assumed constant for now)`, 'K']], N`In words: the pressure loses the same fraction of itself for every metre climbed.`)}
            <p>${T`A quantity that loses a fixed fraction per step follows an exponential. If T is constant, the solution is:`}</p>
            <div class="eq">\\[ p(h) = p_0\\,e^{-h/H}, \\qquad H = \\frac{RT}{Mg} \\]</div>
            ${Sym.where([['p_0', N`pressure at the datum, h = 0 (the “surface pressure”)`, 'Pa'], ['H', N`scale height: the pressure drops by a factor e = 2.718 (a loss of 63 %) every H of climb`, 'm']], N`Climb 7 H and the pressure has dropped by a factor of about 1 100.`)}
            ${deriv(T`the exponential atmosphere and the density formula`, `
              <p>${T`Start from the hydrostatic equation \\(dp/dh = -\\rho g\\) of section ${App.sec('sounding', 1)} and the ideal gas law.`}</p>
              <ol>
                <li><p>${T`For \\(n\\) moles of gas in a volume \\(V\\) the ideal gas law is \\(pV = nRT\\). Their mass is \\(m = nM\\), so the density \\(\\rho = m/V\\) is:`}</p><div class="eq">\\[ \\rho = \\frac{pM}{RT} \\]</div></li>
                <li><p>${T`Put this \\(\\rho\\) into \\(dp/dh = -\\rho g\\), divide both sides by \\(p\\), and call \\(k = Mg/(RT)\\), a constant when \\(T\\) is constant:`}</p><div class="eq">\\[ \\frac{1}{p}\\,\\frac{dp}{dh} = -k \\]</div></li>
                <li><p>${T`The left side is the rate of change of \\(\\ln p\\) (the chain rule: the rate of change of \\(\\ln p\\) is \\(1/p\\) times that of \\(p\\)). So \\(\\ln p\\) changes by the same amount at every metre of climb: it is a straight line, starting from \\(\\ln p_0\\) at \\(h = 0\\).`}</p><div class="eq">\\[ \\ln p = \\ln p_0 - k\\,h \\]</div></li>
                <li><p>${T`Take the exponential of both sides (\\(e^{\\ln p} = p\\)). Writing \\(H = 1/k = RT/(Mg)\\) gives the exponential atmosphere:`}</p><div class="eq">\\[ p = p_0\\,e^{-h/H} \\]</div></li>
                <li><p>${T`The density follows from step 1. Since \\(RT/M = gH\\), \\(\\rho = pM/(RT) = p/(gH)\\): the density falls with height exactly like the pressure.`}</p></li>
              </ol>`)}
            ${figAtmos()}
            <p>${T`The scale height is the one number that says how fast an atmosphere thins. Warm air is puffed up and has a large H, heavy gas and strong gravity make H small. The density follows the same law, since ρ = p/(gH).`}</p>
            <p>${T`For Earth at the surface (T = 288 K, M = 0.02896 kg/mol) the formula gives H = 8.43 km. Yet entry calculations (${Progress.code('entry')}) use about 7.2 km, and the whole range is often quoted as 7 to 8.5 km. The reason is the temperature. It is not constant: the air cools with height, down to 217 K at 11 km, where H is only 6.3 km. An exponential fitted to the first 50 km therefore lands between the two, around 7 km. The warm surface value 8.4 km describes only the lowest few kilometres on a warm day.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.3</span>${T`Real layers, and why the exponential still works`}</h2>
          <div class="prose">
            <p>${T`The real atmosphere is built from layers. In the troposphere (to 11 km) the temperature falls by 6.5 K per kilometre. Above it comes a layer of constant temperature, then a layer that warms, and so on. Inside a layer of constant temperature the exponential is exact. Where the temperature changes, H changes slowly with height, and over any limited range the curve of ln p against h is nearly straight.`}</p>
            <p>${T`The 1976 U.S. Standard Atmosphere gives 101 325 Pa at sea level, 22 632 Pa at 11 km, 5 475 Pa at 20 km, and 79.8 Pa at 50 km. A single exponential cannot match all four, but a line fitted over the range you care about is good to a few percent. That is why the ascent (${Progress.code('ascent')}) and entry (${Progress.code('entry')}) modules use one scale height: a working model, with its range of validity in mind. The lab has a scenario with the real layers so you can see the line bend.`}</p>
            <p>${T`The method does not care which planet it is. Pressure, altitude and gravity are all you need. The gas, its molar mass and its temperature are folded into the fitted H.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.4</span>${T`Fitting a line to noisy data`}</h2>
          <div class="prose">
            <p>${T`A gauge on a rocket gives pairs (h<sub>i</sub>, p<sub>i</sub>), each with an error of a few percent. Take the logarithm and the model is a line, y = a + b·h, with y = ln p:`}</p>
            <div class="eq">\\[ \\ln p = \\ln p_0 - \\frac{h}{H} \\quad\\Longrightarrow\\quad b = -\\frac{1}{H}, \\qquad a = \\ln p_0 \\]</div>
            ${Sym.where([['a', N`intercept of the line: ln p₀`, '—'], ['b', N`slope of the line: −1/H`, '1/m']], N`Pressure noise is a percentage of the reading, so ln p has the same error at every altitude. That is a second reason for the logarithm.`)}
            <p>${T`The <b>least-squares</b> line is the one for which the sum of the squared vertical distances (the residuals) is smallest. With n points, mean altitude h̄ and mean y̅, the slope and intercept are:`}</p>
            <div class="eq">\\[ b = \\frac{\\sum (h_i-\\bar h)(y_i-\\bar y)}{\\sum (h_i-\\bar h)^2}, \\qquad a = \\bar y - b\\,\\bar h, \\qquad H = -\\frac{1}{b}, \\quad p_0 = e^{a} \\]</div>
            ${Sym.where([['h_i,\\ y_i', N`altitude and ln p of sample i`, 'm, —'], ['\\bar h,\\ \\bar y', N`averages of the altitudes and of the ln p values`, 'm, —']], N`The line always passes through the centre of the data (h̄, ȳ). The slope is how y changes with h, averaged over all the points.`)}
            ${deriv(T`the least-squares slope and intercept`, `
              <p>${T`The line \\(y = a + b\\,h\\) misses point \\(i\\) by the residual \\(r_i = y_i - a - b\\,h_i\\). We look for the \\(a\\) and \\(b\\) that make \\(S = \\sum r_i^2\\) smallest. At the smallest value, \\(S\\) stops changing when you nudge \\(a\\) alone, and when you nudge \\(b\\) alone.`}</p>
              <ol>
                <li><p>${T`Nudging \\(a\\): each squared residual changes at the rate \\(-2r_i\\), so the condition is that the residuals add up to zero:`}</p><div class="eq">\\[ \\sum (y_i - a - b\\,h_i) = 0 \\]</div></li>
                <li><p>${T`Divide by \\(n\\): the average of the line equals the average of the data, so the line passes through the centre of the data:`}</p><div class="eq">\\[ a = \\bar y - b\\,\\bar h \\]</div></li>
                <li><p>${T`Nudging \\(b\\): each squared residual changes at the rate \\(-2h_i r_i\\), so:`}</p><div class="eq">\\[ \\sum h_i\\,(y_i - a - b\\,h_i) = 0 \\]</div></li>
                <li><p>${T`Replace \\(a\\) using step 2. The residuals add up to zero, so you may also subtract \\(\\bar h\\) times their sum from each \\(h_i\\). The condition becomes:`}</p><div class="eq">\\[ \\sum (h_i-\\bar h)\\,\\bigl[(y_i-\\bar y) - b\\,(h_i-\\bar h)\\bigr] = 0 \\]</div></li>
                <li><p>${T`Solve for \\(b\\). That is the slope formula above.`}</p><div class="eq">\\[ b = \\frac{\\sum (h_i-\\bar h)(y_i-\\bar y)}{\\sum (h_i-\\bar h)^2} \\]</div></li>
              </ol>`)}
            <p>${T`Example: three readings at 0, 10 and 20 km with ln p = 11.5, 10.2 and 9.1. Then h̄ = 10 km, ȳ = 10.267, Σ(h − h̄)² = 200 km², Σ(h − h̄)(y − ȳ) = −24.0 km. So b = −0.120 per km, H = 8.33 km, a = 11.467 and p₀ = 95 480 Pa. The residuals are +0.033, −0.067 and +0.033.`}</p>
            <p>${T`The residuals also give the quality of the fit. Their spread σ = √(Σ r² / (n − 2)) is the typical size of one residual, and the slope is uncertain by σ/√Sxx where Sxx = Σ(h − h̄)². In the example σ = 0.082, so b is uncertain by 0.0058 per km, and H by about 0.4 km (5 %). Two lessons follow:`}</p>
            <ul>
              <li>${T`<b>More points</b> raise Sxx in proportion to n and cut the error as 1/√n.`}</li>
              <li>${T`<b>A wider altitude range</b> raises Sxx with the <i>square</i> of the spread. Doubling the altitude range halves the error on H. The intercept is also better: p₀ is an extrapolation to h = 0, and the further the data lie from it, the less certain it is.`}</li>
            </ul>
            ${Primer.box('log')}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.5</span>${T`Density, dynamic pressure and max-q`}</h2>
          <div class="prose">
            <p>${T`What a vehicle feels is not the static pressure but the air flowing past it. The density comes from the fit, ρ = p/(gH), and the force from the <b>dynamic pressure</b>, the pressure the moving air would exert if the vehicle brought it to rest (in pascals):`}</p>
            <div class="eq">\\[ q = \\tfrac12\\,\\rho\\,v^2, \\qquad D = q\\,C_D A \\]</div>
            ${Sym.where([['q', N`dynamic pressure`, 'Pa'], 'rho', ['v', N`speed relative to the air`, 'm/s'], ['D', N`drag force`, 'N'], ['C_D', N`drag coefficient (a shape factor, about 0.3 for a slender rocket)`, '—'], ['A', N`cross-section area facing the flow`, 'm²']])}
            <p>${T`Low in the air the speed is small, high up the density is tiny. The product q peaks somewhere in between. This is <b>max-q</b>, where the structure takes its greatest aerodynamic load. Saturn V passed max-q roughly 80 seconds after liftoff, at about 13 km. The ascent module (${Progress.code('ascent')}) uses the density profile you measure here to find where the rocket should throttle and when the load peaks. The lab reports max-q for every flight.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.6</span>${T`Drag as a second instrument`}</h2>
          <div class="prose">
            <p>${T`After <b>burnout</b>, when the motor stops, the rocket coasts. Only gravity and drag act. Newton’s second law gives, for a body going up at speed v, with the <b>ballistic coefficient</b> β the mass per unit of drag area (heavy and slim: high β, so drag slows it little):`}</p>
            <div class="eq">\\[ a = -g - \\frac{\\rho v^2}{2\\beta}, \\qquad \\beta = \\frac{m}{C_D A} \\quad\\Longrightarrow\\quad |a| - g = \\frac{\\rho v^2}{2\\beta} \\]</div>
            ${Sym.where([['a', N`acceleration along the flight path from tracking (negative: slowing down)`, 'm/s²'], 'beta'], N`The deceleration beyond gravity is drag. If you know the ballistic coefficient β you can read the density, ρ = 2β(|a| − g)/v². If you know ρ from your fit, the same reading gives β. On the way down the drag pushes up, so the term changes sign.`)}
            ${deriv(T`the drag deceleration`, `
              <ol>
                <li><p>${T`Going up, both gravity and drag pull the rocket back, so Newton’s second law (mass times acceleration equals the total force) reads:`}</p><div class="eq">\\[ m\\,a = -m\\,g - D \\]</div></li>
                <li><p>${T`Insert the drag force from section ${App.sec('sounding', 5)}, \\(D = \\tfrac12\\rho v^2 C_D A\\), and divide by \\(m\\):`}</p><div class="eq">\\[ a = -g - \\frac{\\rho v^2}{2}\\,\\frac{C_D A}{m} \\]</div></li>
                <li><p>${T`Since \\(\\beta = m/(C_D A)\\), the last factor is \\(1/\\beta\\). The acceleration is negative, so \\(|a| = -a\\); moving \\(g\\) to the left gives the form above:`}</p><div class="eq">\\[ |a| - g = \\frac{\\rho v^2}{2\\beta} \\]</div></li>
              </ol>`)}
            <p>${T`Example: β = 2 500 kg/m², v = 300 m/s and a measured |a| of 26.0 m/s² with g = 9.8 m/s². Then ρ = 2 × 2 500 × 16.2 / 90 000 = 0.90 kg/m³. That is the density the pressure gauge says it should be, which makes the two instruments a cross-check.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.7</span>${T`A short history`}</h2>
          <div class="prose">
            <p>${T`After the Second World War the United States flew captured V-2 rockets from White Sands, New Mexico, with instruments in place of warheads. They carried pressure gauges and other sensors above the reach of any balloon, and gave the first direct measurements of the upper atmosphere. The Aerobee, first flown in 1947, was built for the job: a small, cheap rocket made to fly research payloads again and again. Sounding rockets of this kind went on measuring pressure, temperature and radiation for decades.`}</p>
          </div>
        </section>

        ${Archive.capsule('v2')}

        <section class="section">
          <h2><span class="idx">5.8</span>${T`Lab: the sounding range`}</h2>
          <div class="prose"><p>${T`The atmosphere is hidden. Pick a motor and a propellant load, launch, and read the telemetry: time, altitude, pressure (±3 %), speed and acceleration. Estimate H and p₀ from the scatter of ln p against h, and type them in. After you submit, the lab shows the least-squares fit of the same data and the true atmosphere. Optionally, find β from a sample taken during the coast. Compare a small and a large rocket: the same noise gives a very different fit.`}</p></div>
          <div class="lab tl-lab" id="sd">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Sounding range`}</h3><span class="spacer"></span></div>
            <div class="stage"><canvas id="sd-cv" aria-label="${T`Scatter of the natural logarithm of the measured pressure against altitude, with the fitted lines after you submit`}"></canvas><div class="overlay" id="sd-ov"></div><div class="badge" id="sd-badge"></div></div>
            <div class="tl-side">
              <div id="sd-sum"></div>
              <div class="mini"><h4>${T`Altitude against time`}</h4><canvas id="sd-ht" aria-label="${T`Altitude of the rocket against time, with the pressure samples`}"></canvas></div>
              <div id="sd-res"></div>
            </div>
            <div class="tl-groups">
              <div class="tl-group">
                <h4>${T`Range`}</h4>
                <div class="ctl"><label for="sd-scen"><span>${T`Atmosphere`}</span></label><select id="sd-scen">${SCEN_KEYS.map((k) => `<option value="${k}">${T(SCEN[k].label)}</option>`).join('')}</select></div>
                <p class="note" id="sd-task" style="margin:0"></p>
                <div class="ctl"><label for="sd-motor"><span>${T`Motor`}</span></label><select id="sd-motor">${Object.keys(MOTOR_LABEL).map((k) => `<option value="${k}">${T(MOTOR_LABEL[k])}</option>`).join('')}</select></div>
                ${UI.slider({ id: 'sd-load', label: T`Propellant load`, min: 30, max: 100, step: 5, value: 100, unit: ' %' })}
                <div class="btn-row"><button class="btn primary" id="sd-go">${T`Launch`}</button><button class="btn" id="sd-new">${T`New range day`}</button></div>
              </div>
              <div class="tl-group">
                <h4>${T`Telemetry`}</h4>
                <div id="sd-tab" style="max-height:15rem;overflow:auto"></div>
              </div>
              <div class="tl-group">
                <h4>${T`Your estimates`}</h4>
                <div class="mc-fields">
                  <label>${T`scale height H (km)`}<input type="text" inputmode="decimal" id="sd-H" autocomplete="off"></label>
                  <label>${T`surface pressure p₀ (Pa)`}<input type="text" inputmode="decimal" id="sd-p0" autocomplete="off"></label>
                  <label>${T`ballistic coefficient β (kg/m², optional)`}<input type="text" inputmode="decimal" id="sd-beta" autocomplete="off"></label>
                </div>
                <div class="btn-row"><button class="btn primary" id="sd-submit">${T`Submit`}</button></div>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('sounding', { math: 'log', mathLabel: N`Logarithms and the number e.` })}`;

      mountRange(page.querySelector('#sd'));
      Practice.embed(page.querySelector('#practice-slot'), 'sounding', 3);
    },
  });

  function mountRange(root) {
    const $ = (sel) => root.querySelector(sel);
    const num = (id) => { const s = String($(id).value).replace(/\s|\u202f/g, '').replace('−', '-').replace(',', '.'); if (s === '') return NaN; const v = Number(s); return isFinite(v) ? v : NaN; };
    let scenKey = 'earth', take = 0, D = null, FL = null, TM = null, FIT = null, TR = null, ans = null, touched = false, pending = false;
    const view = UI.canvas($('#sd-cv'), null);
    const mini = UI.canvas($('#sd-ht'), null);
    const hNom = () => D.atm.H || 7500;

    function newDay() {
      D = Ps.makeDay(scenKey, 100 * (SCEN_KEYS.indexOf(scenKey) + 1) + 7 * take + 3);
      $('#sd-task').textContent = T(SCEN[scenKey].task) + ' ' + T`Surface gravity ${f(D.W.g0, 2)} m/s², radius ${f(D.W.R / 1e3, 0)} km, launch site at ${f(D.W.site / 1e3, 1)} km altitude (the datum h = 0 is below it).`;
      touched = false; fly();
    }

    function fly() {
      FL = Ps.fly(D, $('#sd-motor').value, +$('#sd-load').value / 100);
      TM = Ps.telemetry(D, FL);
      const s = TM.samples;
      FIT = s.length >= 3 ? Ps.fitAtmos(s.map((x) => x.h), s.map((x) => x.p)) : null;
      TR = Ps.truth(D, s);
      ans = null; pending = false;
      ['#sd-H', '#sd-p0', '#sd-beta'].forEach((id) => { $(id).disabled = false; $(id).value = ''; });
      $('#sd-submit').disabled = false;
      $('#sd-res').innerHTML = '';
      renderAll();
      if (touched && FL.apo.h - D.W.site >= 2 * hNom()) Progress.done('sounding', 'reach');
    }

    function renderAll() {
      const s = TM.samples, hs = s.map((x) => x.h);
      const span = s.length ? (Math.max(...hs) - Math.min(...hs)) / hNom() : 0;
      $('#sd-sum').innerHTML = `<dl class="readout">
        <dt>${T`Apogee`}</dt><dd class="hl">${f(FL.apo.h / 1e3, 1)} km</dd>
        <dt>${T`Above the launch site`}</dt><dd>${f((FL.apo.h - D.W.site) / 1e3, 1)} km</dd>
        <dt>${T`Burnout`}</dt><dd>${f(FL.tb, 1)} s</dd>
        <dt>${T`Samples read`}</dt><dd>${s.length} · ${T`every ${f(TM.dt, 0)} s`}</dd>
        <dt>${T`Altitude span of the data`}</dt><dd>${ans ? T`${f(span, 1)} scale heights` : '?'}</dd>
        <dt>${T`Max-q`}</dt><dd>${f(FL.maxQ.q / 1e3, 1)} kPa · ${T`at ${f(FL.maxQ.h / 1e3, 1)} km`}</dd></dl>
        <p class="note" style="margin:.4rem 0 0">${T`The gauge reads down to ${fp(TM.floor)} Pa; higher samples are lost${TM.above ? T` (${TM.above} lost)` : ''}.`}</p>`;
      $('#sd-tab').innerHTML = `<table class="data" style="font-size:.7rem"><thead><tr><th>t (s)</th><th>h (km)</th><th>p (Pa)</th><th>ln p</th><th>v (m/s)</th><th>a (m/s²)</th></tr></thead><tbody>${s.map((x) =>
        `<tr${x.coast ? '' : ' style="opacity:.6"'}><td>${f(x.t, 0)}</td><td>${f(x.h / 1e3, 2)}</td><td>${fp(x.p)}</td><td>${f(Math.log(x.p), 3)}</td><td>${f(x.v, 1)}</td><td>${f(x.a, 2)}</td></tr>`).join('')}</tbody></table>
        <p class="note" style="margin:.3rem 0 0">${T`Dimmed rows: powered flight. The other rows are coasting.`}</p>`;
      $('#sd-badge').textContent = pending ? T`Settings changed: press Launch` : ans ? T`Truth: H = ${f(TR.H / 1e3, 2)} km · p₀ = ${fp(TR.p0)} Pa` : T`Atmosphere hidden until you submit`;
      $('#sd-badge').className = 'badge';
      $('#sd-ov').innerHTML = '';
      view.redraw(); mini.redraw();
    }

    function submit() {
      if (ans || !FIT || !(FIT.H > 0)) return;
      const H = num('#sd-H'), p0 = num('#sd-p0'), b = num('#sd-beta');
      if (!isFinite(H) || !isFinite(p0) || H <= 0 || p0 <= 0) { $('#sd-res').innerHTML = `<p class="note">${T`Enter H in kilometres and p₀ in pascals.`}</p>`; return; }
      const okH = Math.abs(H * 1e3 / TR.H - 1) <= 0.05, okP = Math.abs(p0 / TR.p0 - 1) <= 0.06;
      const hasB = isFinite(b) && b > 0, okB = hasB && Math.abs(b / D.beta - 1) <= 0.2;
      ans = { H, p0, b: hasB ? b : null, okH, okP, okB };
      ['#sd-H', '#sd-p0', '#sd-beta'].forEach((id) => { $(id).disabled = true; });
      $('#sd-submit').disabled = true;
      if (touched) {
        if (okH) Progress.done('sounding', 'hfit');
        if (okP) Progress.done('sounding', 'p0fit');
        if (okB) Progress.done('sounding', 'beta');
      }
      renderResult(); renderAll();
    }

    function renderResult() {
      const A = ans, ok = (x) => (x ? '✓' : '✗');
      const s = TM.samples, span = (Math.max(...s.map((x) => x.h)) - Math.min(...s.map((x) => x.h))) / hNom();
      const row = (label, mine, okk, lsq, truth, d) => `<dt>${label}</dt><dd class="hl">${f(mine, d)} ${ok(okk)}</dd><dt>${T`  least squares`}</dt><dd>${lsq}</dd><dt>${T`  truth`}</dt><dd>${truth}</dd>`;
      const dH = FIT.dH / 1e3;
      let html = `<dl class="readout">
        ${row(T`H (km)`, A.H, A.okH, `${f(FIT.H / 1e3, 2)} ± ${f(dH, 2)}`, f(TR.H / 1e3, 2), 2)}
        ${row(T`p₀ (Pa)`, A.p0, A.okP, fp(FIT.p0), fp(TR.p0), 0)}
        ${A.b != null ? row(T`β (kg/m²)`, A.b, A.okB, '', f(D.beta, 0), 0) : `<dt>β</dt><dd>${f(D.beta, 0)} kg/m²</dd>`}
        <dt>${T`Residual scatter σ`}</dt><dd>${f(FIT.sigma * 100, 1)} %</dd></dl>`;
      html += `<p class="note" style="margin:.4rem 0 0">${T`Your data span ${f(span, 1)} scale heights, so the fit fixes H to about ±${f(100 * dH / (FIT.H / 1e3), 1)} %. ${span < 2 ? T`That is a short flight: fly higher for a tighter slope.` : T`A taller flight spreads the points further and tightens it.`}`}${TR.exact ? '' : ' ' + T`In the layered atmosphere the “truth” is the best exponential through the exact profile at your altitudes.`}</p>`;
      $('#sd-res').innerHTML = html;
    }

    view.draw = (ctx, w, h) => {
      if (!TM) return;
      const K = UI.tok(), s = TM.samples;
      if (!s.length) { ctx.clearRect(0, 0, w, h); ctx.fillStyle = K.muted; ctx.font = `12px ${K.mono}`; ctx.textAlign = 'center'; ctx.fillText(T`No readings: the gauge never saw pressure in its range.`, w / 2, h / 2); return; }
      const xmax = Math.max(...s.map((x) => x.h)) / 1e3 * 1.05;
      const y = s.map((x) => Math.log(x.p));
      const yv = [...y];
      const series = [];
      const line = (a, b, color, dash, width) => series.push({ data: [[0, a], [xmax, a - b * xmax * 1e3]], color, dash, width, end: false });
      if (ans) {
        yv.push(FIT.a, TR.p0 > 0 ? Math.log(TR.p0) : FIT.a);
        series.push({ data: Array.from({ length: 41 }, (_, i) => { const hm = xmax * 1e3 * i / 40; return [hm / 1e3, Math.log(Ps.atmos(D.atm, hm).p)]; }), color: K.trace, width: 2, end: false });
        line(FIT.a, -FIT.b, K.good, [6, 4], 1.8);
        line(Math.log(ans.p0), 1 / (ans.H * 1e3), K.accent, [2, 3], 1.8);
      }
      const y0 = Math.floor(Math.min(...yv) - 0.5), y1 = Math.ceil(Math.max(...yv) + 0.3);
      const co = UI.chart(ctx, w, h, { series: series.length ? series : [{ data: [[0, y0], [xmax, y0]], color: 'transparent', end: false }], xMin: 0, xMax: xmax, yMin: y0, yMax: y1, xLabel: T`h (km)`, yLabel: T`ln p (p in Pa)`, xFmt: (v) => +v.toFixed(2), yFmt: (v) => +v.toFixed(2) });
      ctx.fillStyle = K.ink;
      s.forEach((x, i) => { ctx.beginPath(); ctx.arc(co.X(x.h / 1e3), co.Y(y[i]), 3, 0, 7); ctx.fill(); });
      if (ans) {
        ctx.font = `10px ${K.mono}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        [[K.trace, T`truth`], [K.good, T`least squares`], [K.accent, T`your estimate`]].forEach(([c, l], i) => { ctx.fillStyle = c; ctx.fillText('— ' + l, w - 130, h - 80 + 13 * i); });
      }
    };

    mini.draw = (ctx, w, h) => {
      if (!FL) return;
      const K = UI.tok(), tr = FL.trace;
      const co = UI.chart(ctx, w, h, { series: [{ data: tr.filter((_, i) => i % 3 === 0).map((x) => [x.t, x.h / 1e3]), color: K.trace, end: false }], xMin: 0, yMin: 0, xFmt: (v) => +v.toFixed(0), yFmt: (v) => +v.toFixed(0), xLabel: 's', yLabel: 'km' });
      ctx.fillStyle = K.accent;
      TM.samples.forEach((x) => { ctx.beginPath(); ctx.arc(co.X(x.t), co.Y(x.h / 1e3), 2.2, 0, 7); ctx.fill(); });
    };

    $('#sd-scen').addEventListener('change', (e) => { scenKey = e.target.value; take = 0; newDay(); });
    $('#sd-new').addEventListener('click', () => { take += 1; newDay(); });
    $('#sd-go').addEventListener('click', () => { touched = true; fly(); });
    ['#sd-motor', '#sd-load'].forEach((id) => $(id).addEventListener('input', () => { pending = true; $('#sd-badge').textContent = T`Settings changed: press Launch`; }));
    UI.bindControls(root, { 'sd-load': (v) => f(v, 0) }, () => {});
    $('#sd-submit').addEventListener('click', submit);
    root.querySelectorAll('#sd-H, #sd-p0, #sd-beta').forEach((el) => el.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); }));
    $('#sd-motor').value = 'medium';
    newDay();
  }
})();
