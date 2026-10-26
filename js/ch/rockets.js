/* Chapter 3 — Rocket propulsion: thrust, specific impulse, the rocket equation, staging. */
(function () {
  'use strict';
  const { C } = Phys;
  const G0 = C.g0;

  const PROPELLANTS = [
    { n: N`Solid (APCP)`, isp: 265, ex: 'Shuttle SRB' },
    { n: 'RP-1 / LOX', isp: 304, ex: 'F-1 (vac), S-IC' },
    { n: 'N₂O₄ / Aerozine-50', isp: 314, ex: N`Apollo SPS, LM engines` },
    { n: 'LH₂ / LOX', isp: 421, ex: 'J-2, S-II & S-IVB' },
    { n: N`Nuclear thermal`, isp: 850, ex: N`NERVA (tested 1960s)` },
  ];

  // thrust in N: sea-level thrust for a first stage that lifts off from Earth, vacuum thrust otherwise.
  // g: the gravity the first stage must beat (Earth, or the Moon for the LM).
  const PRESETS = {
    saturn: { payload: 45000, g: 9.80665, stages: [
      { name: 'S-IC', prop: 2150000, dry: 131000, isp: 285, thrust: 34.02e6 },
      { name: 'S-II', prop: 444000, dry: 40000, isp: 421, thrust: 5.165e6 },
      { name: 'S-IVB', prop: 107000, dry: 13500, isp: 421, thrust: 1.033e6 }] },
    single: { payload: 45000, g: 9.80665, stages: [
      { name: N`One big stage`, prop: 2701000, dry: 184500, isp: 304, thrust: 34.02e6 }] },
    kerosene: { payload: 45000, g: 9.80665, stages: [
      { name: 'S-IC', prop: 2150000, dry: 131000, isp: 285, thrust: 34.02e6 },
      { name: 'S-II (RP-1)', prop: 444000, dry: 40000, isp: 304, thrust: 5.165e6 },
      { name: 'S-IVB (RP-1)', prop: 107000, dry: 13500, isp: 304, thrust: 1.033e6 }] },
    lm: { payload: 0, g: 1.624, stages: [
      { name: N`LM descent`, prop: 8200, dry: 2030, isp: 311, thrust: 45040 },
      { name: N`LM ascent`, prop: 2350, dry: 2450, isp: 311, thrust: 15600 }] },
  };

  App.chapter({
    id: 'rockets', phase: N`Ignition`, title: N`Rocket Science`, lab: N`Staging builder`,
    blurb: N`Thrust, specific impulse and Tsiolkovsky’s logarithm. Why the Saturn V had three stages and was 85% propellant.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module TM-3 · Ignition`,
          title: T`Rocket Science`,
          lede: T`A rocket is a machine for throwing mass backward very fast. How fast decides how much velocity it can buy, and the logarithm in the rocket equation decides how dearly.`,
          refs: [T`Sellers · Rockets and Launch Vehicles`, T`Sutton & Biblarz, Rocket Propulsion Elements (for depth)`],
        })}
        ${Progress.briefing('rockets', { theory: 'theory', lab: 'st', math: 'refresher', mathLabel: N`Rates of change and logarithms.` })}

        <section class="section" id="theory">
          <h2><span class="idx">3.1</span>${T`The thrust equation`}</h2>
          <div class="prose">
            <p>${T`Apply Newton’s second and third laws to a control volume around the engine. The force on the rocket is the momentum flux of the exhaust, plus a pressure term at the nozzle exit:`}</p>
            <div class="eq">\\[ F = \\dot m\\, v_e + (p_e - p_a)\\,A_e \\]</div>
            ${Sym.where(['Fth', 'mdot', 've', 'pexit', 'pa', 'Ae'], N`First term: momentum thrown backwards each second. Second term: extra push (or pull) from the pressure difference at the nozzle exit.`)}
            ${Primer.box('derivative', false, 'refresher')}
            <p>${T`\\(\\dot m\\) is the propellant mass flow, \\(v_e\\) the exhaust velocity, \\(p_e\\) and \\(A_e\\) the pressure and area at the nozzle exit, and \\(p_a\\) the ambient pressure. As the vehicle climbs, \\(p_a\\) falls and thrust rises. An F-1 gave 6.77 MN at sea level and 7.77 MN in vacuum. Engineers fold both terms into one <b>effective exhaust velocity</b> \\(c = F/\\dot m\\).`}</p>
          </div>
          <div class="lab" id="nz" style="grid-template-columns:minmax(0,1fr) 19rem">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`F-1 engine at altitude`}</h3></div>
            <div class="stage" style="min-height:280px;background:var(--panel)"><canvas id="nz-cv" aria-label="${T`F-1 thrust versus altitude`}"></canvas></div>
            <div class="controls">
              ${UI.slider({ id: 'nz-h', label: T`Altitude`, min: 0, max: 80, step: 0.5, value: 0, unit: 'km' })}
              <dl class="readout" id="nz-ro"></dl>
              <p class="note" style="margin:0">${T`ṁ = 2 578 kg/s, v<sub>e</sub> = 2 850 m/s, p<sub>e</sub> = 44 kPa, A<sub>e</sub> = 9.87 m² (values chosen to match the published thrusts).`}</p>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">3.2</span>${T`Specific impulse`}</h2>
          <div class="prose">
            <p>${T`The figure of merit for a propellant and engine is the <b>specific impulse</b>: the impulse delivered per unit <i>weight</i> of propellant consumed. It comes out in seconds:`}</p>
            <div class="eq">\\[ I_{sp} = \\frac{F}{\\dot m\\, g_0} = \\frac{c}{g_0} \\]</div>
            ${Sym.where(['isp', 'Fth', 'mdot', 'g0', 'c'])}
            <p>${T`Read it as the number of seconds one kilogram of propellant can produce one kilogram-force of thrust. Higher is better. Chemical rockets top out near 450 s, because the energy is in the chemical bonds and light exhaust molecules (H₂O, H₂) carry it away fastest.`}</p>
          </div>
          <div class="scroll-x" style="max-width:44rem"><table class="data"><thead><tr><th>${T`Propellant`}</th><th>I<sub>sp</sub> (s)</th><th>c (m/s)</th><th>${T`Flown on`}</th></tr></thead><tbody>
            ${PROPELLANTS.map((p) => `<tr><td>${T(p.n)}</td><td>${p.isp}</td><td>${UI.fmt(p.isp * G0, 0)}</td><td>${T(p.ex)}</td></tr>`).join('')}
          </tbody></table></div>
        </section>

        <section class="section">
          <h2><span class="idx">3.3</span>${T`The rocket equation`}</h2>
          <div class="prose">
            <p>${T`In time \\(dt\\) a rocket of mass \\(m\\) ejects \\(-dm\\) of propellant at speed \\(c\\) relative to itself. Conservation of momentum, with no external forces, gives \\(m\\,dv = -c\\,dm\\). Integrate from the initial mass \\(m_0\\) to the final mass \\(m_f\\):`}</p>
            <div class="eq">\\[ \\Delta v = c\\,\\ln\\frac{m_0}{m_f} = I_{sp}\\,g_0\\,\\ln\\frac{m_0}{m_f} \\]</div>
            ${Sym.where(['dv', 'c', 'ln', 'm0', 'mf', 'isp', 'g0'], N`Example: I<sub>sp</sub> = 421 s and a mass ratio of 3 gives 421 × 9.81 × ln 3 = 4 537 m/s.`)}
            ${Primer.box('log')}
            <p>${T`Konstantin Tsiolkovsky published this in 1903. It holds two hard truths. Δv grows only <i>logarithmically</i> with the mass ratio \\(MR = m_0/m_f\\). And the required mass ratio grows <i>exponentially</i> with Δv: \\(MR = e^{\\Delta v / c}\\). Reaching low orbit (about 9.3 km/s including losses) with kerosene engines needs a mass ratio near 23. In practice no single tank and engine can be that light.`}</p>
          </div>
          <div class="lab" id="re">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`The tyranny of the logarithm`}</h3></div>
            <div class="stage" style="min-height:340px;background:var(--panel)"><canvas id="re-cv" aria-label="${T`Delta-v versus mass ratio for several propellants`}"></canvas></div>
            <div class="controls">
              ${UI.slider({ id: 're-mr', label: T`Mass ratio m₀/m_f`, min: 1, max: 25, step: 0.1, value: 6, unit: '' })}
              ${UI.slider({ id: 're-dv', label: T`or: Δv needed`, min: 0.5, max: 15, step: 0.1, value: 9.3, unit: 'km/s' })}
              <dl class="readout" id="re-ro"></dl>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">3.4</span>${T`Thrust-to-weight ratio`}</h2>
          <div class="prose">
            <p>${T`The rocket equation says how much Δv the propellant can buy. It says nothing about <i>how fast</i> the propellant is burned, and that matters as soon as gravity is pulling. The <b>thrust-to-weight ratio</b> compares the engines’ push with the vehicle’s weight:`}</p>
            <div class="eq">\\[ \\mathrm{TWR} = \\frac{F}{m\\,g} \\qquad\\Longrightarrow\\qquad a_{\\text{vertical}} = (\\mathrm{TWR} - 1)\\,g \\]</div>
            ${Sym.where(['twr', 'Fth', 'm', ['g', N`gravity where the rocket is: 9.81 m/s² on Earth, 1.62 m/s² for a lander on the Moon`, 'm/s²'], 'avert'], N`Standing on the pad, weight pulls down with m·g; only the thrust beyond that accelerates the rocket upward.`)}
            <p>${T`<b>Below 1, nothing happens.</b> The engines roar, the propellant drains, the rocket sits on the pad. Above 1, it rises, slowly at first. The Saturn V lifted off with 34.0 MN of thrust for 2 938 t, a TWR of just 1.18. It accelerated at 0.18 g and took about 12 seconds to clear its own tower.`}</p>
            <p>${T`<b>TWR climbs during the burn</b>, because the thrust stays the same (it even grows as the air thins) while the mass drops. The S-IC ended its burn near 4 g. NASA shut down its centre engine early to cap the load on the crew.`}</p>
            <p>${T`<b>Why not lift off at 1.05?</b> Every second spent climbing costs Δv to gravity, about \\(g\\) per second when going straight up. The burn time follows directly from TWR and I<sub>sp</sub>:`}</p>
            <div class="eq">\\[ t_b = \\frac{m_{prop}\\,I_{sp}\\,g_0}{F} = \\frac{I_{sp}}{\\mathrm{TWR}_0}\\left(1 - \\frac{m_f}{m_0}\\right) \\]</div>
            ${Sym.where(['tb', ['m_{prop}', N`propellant mass of the stage`, 'kg'], 'isp', 'g0', 'Fth', ['\\mathrm{TWR}_0', N`thrust-to-weight ratio at ignition, measured against g₀`, '—'], 'm0', 'mf'], N`The second form needs no masses or thrust: only I<sub>sp</sub>, the starting TWR and the fraction of the stage that is propellant.`)}
            <p>${T`A first stage with I<sub>sp</sub> 285 s that burns 73% of its mass lasts \\(285 \\times 0.73 / 1.18 \\approx 176\\) s at TWR 1.18, but 274 s at TWR 0.76 (if it could lift off at all), or 104 s at TWR 2. Halve the burn time and you roughly halve the gravity loss.`}</p>
            <p>${T`<b>Why not lift off at 3?</b> Thrust is not free. Engines are heavy (each F-1 weighed 8.4 t), the structure must carry their push, and a fast climb through thick air brings high drag and dynamic pressure. Crews also have g-limits. Real launchers lift off between about 1.2 and 1.6.`}</p>
            <p>${T`<b>Upper stages can run below 1.</b> When the S-II lit, at about 67 km, the vehicle was already above most of the air, moving at about 2.4 km/s and still climbing at nearly 1 km/s. It no longer needed to beat gravity head-on: it only had to build horizontal speed before its upward momentum ran out, with the guidance tilting the thrust slightly upward. As speed approaches orbital speed, the Earth curves away beneath the vehicle and gravity is cancelled more and more, until in orbit it is cancelled completely. So the S-II lit at TWR ≈ 0.8 and the S-IVB at ≈ 0.64. A high TWR in vacuum would work too, with no drag to fight, but it would mean carrying heavier engines all the way to orbit. Upper stages trade TWR for mass: one J-2 engine on the S-IVB, five F-1s on the S-IC.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">3.5</span>${T`Staging`}</h2>
          <div class="prose">
            <p>${T`The way out is to stop carrying empty tanks. A <b>staged</b> rocket drops each stage’s structure when its propellant is gone, and the rocket equation restarts with a smaller mass. The total is the sum of the stages’ contributions, each computed with everything above it as payload:`}</p>
            <div class="eq">\\[ \\Delta v_{total} = \\sum_{k} I_{sp,k}\\,g_0\\,\\ln\\frac{m_{0,k}}{m_{f,k}} \\]</div>
            ${Sym.where(['sumk', 'ispk', 'g0', 'm0k', 'mfk'])}
            <p>${T`Below is the Saturn V as flown on Apollo 11, using approximate masses and an average I<sub>sp</sub> of 285 s for the S-IC across its climb out of the atmosphere. Edit any cell. Load the single-stage version (same propellant, same structure, one stage) and it cannot reach orbit. Make an upper stage much bigger and Δv goes up on paper, but the first stage can no longer lift the stack: watch its TWR.`}</p>
            <p class="note">${T`The first stage’s thrust is its sea-level thrust; upper stages use vacuum thrust. Ideal Δv ignores losses: the 9.3 km/s “to orbit” line already includes typical gravity and drag losses for a liftoff TWR near 1.2.`}</p>
          </div>
          <div class="lab" id="st" style="grid-template-columns:minmax(0,1fr)">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Staging builder`}</h3><span class="spacer"></span>
              <div class="btn-row"><button class="btn" data-p="saturn">${T`Saturn V`}</button><button class="btn" data-p="single">${T`Single stage`}</button><button class="btn" data-p="kerosene">${T`All-kerosene`}</button><button class="btn" data-p="lm">${T`Lunar Module`}</button><button class="btn" id="st-add">${T`+ Stage`}</button></div></div>
            <div class="scroll-x" style="padding:.5rem 1rem"><table class="data st-tab" id="st-tab"></table></div>
            <p class="twr-checks" id="st-checks" aria-live="polite"></p>
            <div class="stage" style="min-height:220px;background:var(--panel);border-top:1px solid var(--line)"><canvas id="st-cv" aria-label="${T`Delta-v bar per stage against mission requirements`}"></canvas></div>
          </div>
          <div class="callout history"><b>${T`Why 85% propellant`}</b>${T`The Saturn V weighed 2 938 tonnes at liftoff. About 2 700 t of that was propellant, and only 45 t, the Apollo spacecraft, was sent towards the Moon. The upper stages burned liquid hydrogen. Its 421 s I<sub>sp</sub> mattered most there, because every kilogram of upper stage has to be accelerated by all the stages below it.`}</div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('rockets', { math: 'log', mathLabel: N`Exponentials and logarithms.` })}`;

      mountNozzle(page.querySelector('#nz'));
      mountRE(page.querySelector('#re'));
      mountStaging(page.querySelector('#st'));
      Practice.embed(page.querySelector('#practice-slot'), 'rockets', 3);
    },
  });

  function mountNozzle(root) {
    const mdot = 2578, ve = 2850, pe = 44000, Ae = 9.87;
    const thrust = (hkm) => mdot * ve + (pe - Phys.pressure(hkm * 1000)) * Ae;
    let hNow = 0;
    const view = UI.canvas(root.querySelector('#nz-cv'), (ctx, w, h) => {
      const K = UI.tok();
      const data = []; for (let x = 0; x <= 80; x += 1) data.push([x, thrust(x) / 1e6]);
      UI.chart(ctx, w, h, { series: [{ data, color: K.accent, width: 2.2, fill: true, end: false }], xMin: 0, xMax: 80, yMin: 6, yMax: 8, xLabel: T`altitude (km)`, yLabel: T`thrust (MN)`, cursor: hNow,
        hlines: [{ y: mdot * ve / 1e6, label: T`ṁ·vₑ (momentum thrust)`, color: K.trace }] });
    });
    UI.bindControls(root, { 'nz-h': (x) => x.toFixed(1) }, (v) => {
      hNow = v['nz-h'];
      const pa = Phys.pressure(hNow * 1000), F = thrust(hNow);
      root.querySelector('#nz-ro').innerHTML = `
        <dt>${T`Ambient p<sub>a</sub>`}</dt><dd>${UI.fmt(pa / 1000, 2)} kPa</dd>
        <dt>${T`Momentum ṁ·vₑ`}</dt><dd>${UI.fmt(mdot * ve / 1e6, 3)} MN</dd>
        <dt>${T`Pressure (pₑ−pₐ)Aₑ`}</dt><dd>${UI.fmt((pe - pa) * Ae / 1e6, 3)} MN</dd>
        <dt>${T`Thrust F`}</dt><dd class="hl">${UI.fmt(F / 1e6, 3)} MN</dd>
        <dt>I<sub>sp</sub> = F/(ṁg₀)</dt><dd>${UI.fmt(F / (mdot * G0), 1)} s</dd>
        <dt>${T`Nozzle`}</dt><dd>${pa > pe ? T`overexpanded` : T`underexpanded`}</dd>`;
      view.redraw();
    }).update();
  }

  function mountRE(root) {
    let mr = 6, dvNeed = 9.3;
    const colors = (K) => [K.muted, K.accent, K.trace2, K.trace, K.good];
    const view = UI.canvas(root.querySelector('#re-cv'), (ctx, w, h) => {
      const K = UI.tok(), cs = colors(K);
      const series = PROPELLANTS.map((p, i) => {
        const d = []; for (let x = 1; x <= 25; x += 0.25) d.push([x, p.isp * G0 * Math.log(x) / 1000]);
        return { data: d, color: cs[i], width: 1.8, end: false };
      });
      const { X, Y } = UI.chart(ctx, w, h, { series, xMin: 1, xMax: 25, yMin: 0, yMax: 15, xLabel: T`mass ratio m₀ / m_f`, yLabel: 'Δv (km/s)', cursor: mr,
        hlines: [{ y: dvNeed, label: T`Δv needed`, color: K.ink }] });
      ctx.font = `10px ${K.mono}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      // label each curve where it leaves the plot (right edge or top), pushed apart vertically
      const labels = PROPELLANTS.map((p, i) => {
        const c = p.isp * G0 / 1000, xTop = Math.exp(15 / c);
        return xTop < 25 ? { i, x: X(xTop) - 6, y: Y(14.4), txt: `${T(p.n)} · ${p.isp} s` } : { i, x: X(25) - 4, y: Y(c * Math.log(25)) - 8, txt: `${T(p.n)} · ${p.isp} s` };
      }).sort((a, b) => a.y - b.y);
      for (let k = 1; k < labels.length; k++) if (Math.abs(labels[k].x - labels[k - 1].x) < 150 && labels[k].y - labels[k - 1].y < 12) labels[k].y = labels[k - 1].y + 12;
      for (const l of labels) { ctx.fillStyle = cs[l.i]; ctx.fillText(l.txt, l.x, l.y); }
      PROPELLANTS.forEach((p, i) => {
        const xm = Math.exp(dvNeed * 1000 / (p.isp * G0));
        if (xm <= 25) { ctx.fillStyle = cs[i]; ctx.beginPath(); ctx.arc(X(xm), Y(dvNeed), 3.5, 0, 7); ctx.fill(); }
      });
    });
    UI.bindControls(root, { 're-mr': (x) => x.toFixed(1), 're-dv': (x) => x.toFixed(1) }, (v) => {
      mr = v['re-mr']; dvNeed = v['re-dv'];
      root.querySelector('#re-ro').innerHTML = `<dt class="sub" style="border:0;margin:0;padding:0">${T`Δv at MR = ${UI.dec(mr.toFixed(1))}`}</dt>` +
        PROPELLANTS.map((p) => `<dt>${T(p.n)}</dt><dd>${UI.fmt(p.isp * G0 * Math.log(mr) / 1000, 2)} km/s</dd>`).join('') +
        `<dt class="sub">${T`Mass ratio for ${UI.dec(dvNeed.toFixed(1))} km/s`}</dt>` +
        PROPELLANTS.map((p) => { const m = Math.exp(dvNeed * 1000 / (p.isp * G0)); return `<dt>${T(p.n)}</dt><dd>${UI.fmt(m, 1)} <span style="color:var(--muted)">${T`(${UI.fmt(100 * (1 - 1 / m), 1)}% prop.)`}</span></dd>`; }).join('');
      view.redraw();
    }).update();
  }

  // display name of a stage: preset names are marked with N, added stages carry their number
  const stageName = (s) => (s.num ? T`Stage ${s.num}` : T(s.name));

  function mountStaging(root) {

    let cfg = JSON.parse(JSON.stringify(PRESETS.saturn));
    const tab = root.querySelector('#st-tab'), checksEl = root.querySelector('#st-checks');
    let results = [], checks = [], grounded = false;
    const NEEDS = [{ v: 9.3, l: N`Low Earth orbit ≈ 9.3 km/s` }, { v: 12.48, l: N`+ TLI = 12.5 km/s` }];

    // per-stage TWR at ignition and burnout, burn time and a verdict
    function compute() {
      results = Phys.rocket.staging(cfg.stages, cfg.payload);
      const onEarth = cfg.g > 5;
      checks = cfg.stages.map((s, i) => {
        const r = results[i];
        const t0 = s.thrust / (r.m0 * cfg.g), t1 = s.thrust / (r.mf * cfg.g);
        const burn = s.prop * s.isp * C.g0 / s.thrust;
        let level = 'good', msg = i === 0 ? T`lifts off` : T`fine above the air`;
        if (i === 0) {
          if (t0 < 1) { level = 'bad'; msg = T`cannot lift off`; }
          else if (t0 < 1.15) { level = 'warn'; msg = T`sluggish: big gravity loss`; }
          else if (t0 > 2.2 && onEarth) { level = 'warn'; msg = T`high drag and Max Q`; }
        } else if (t0 < 0.4) { level = 'warn'; msg = T`very low: long burn, gravity loss`; }
        if (level !== 'bad' && t1 * (cfg.g / C.g0) > 4.5 && onEarth) { level = 'warn'; msg = T`ends at ${UI.fmt(t1, 1)} g: crew limit`; }
        return { t0, t1, burn, level, msg };
      });
      grounded = checks.length > 0 && checks[0].t0 < 1;
    }

    function renderTable() {
      compute();
      const total = results.reduce((s, r) => s + r.dv, 0);
      if (!grounded && checks[0].t0 >= 1.1 && total >= 12480 && cfg.payload >= 50000) Progress.done('rockets', 'heavy');
      if (grounded && cfg.g > 5) Progress.done('rockets', 'grounded');
      const liftoff = results[0] ? results[0].m0 : cfg.payload;
      const where = cfg.g > 5 ? T`Earth` : T`Moon`;
      const chip = (c) => `<span class="chip twr-${c.level}">${c.msg}</span>`;
      tab.innerHTML = `<thead><tr><th>${T`Stage`}</th><th>${T`Propellant (t)`}</th><th>${T`Structure (t)`}</th><th>I<sub>sp</sub> (s)</th><th>${T`Thrust (kN)`}</th><th>${T`TWR start → end`}</th><th>${T`Burn (s)`}</th><th>m₀ (t)</th><th>${T`MR`}</th><th>Δv (m/s)</th><th></th></tr></thead><tbody>
        ${cfg.stages.map((s, i) => `<tr><td>${stageName(s)}</td>
          <td><input type="number" step="1" data-i="${i}" data-k="prop" value="${+(s.prop / 1000).toFixed(1)}" aria-label="${T`${stageName(s)} propellant`}"></td>
          <td><input type="number" step="0.1" data-i="${i}" data-k="dry" value="${+(s.dry / 1000).toFixed(2)}" aria-label="${T`${stageName(s)} structure`}"></td>
          <td><input type="number" step="1" data-i="${i}" data-k="isp" value="${s.isp}" aria-label="${T`${stageName(s)} Isp`}"></td>
          <td><input type="number" step="10" data-i="${i}" data-k="thrust" value="${+(s.thrust / 1000).toFixed(1)}" aria-label="${T`${stageName(s)} thrust`}"></td>
          <td class="twr-cell"><b class="twr-${checks[i].level}">${UI.fmt(checks[i].t0, 2)}</b> → ${UI.fmt(checks[i].t1, 2)}</td>
          <td>${UI.fmt(checks[i].burn, 0)}</td>
          <td>${UI.fmt(results[i].m0 / 1000, 1)}</td><td>${UI.fmt(results[i].m0 / results[i].mf, 2)}</td><td><b>${UI.fmt(results[i].dv, 0)}</b></td>
          <td>${cfg.stages.length > 1 ? `<button class="btn" data-del="${i}" aria-label="${T`Remove ${stageName(s)}`}" style="padding:.3rem .5rem">✕</button>` : ''}</td></tr>`).join('')}
        <tr><td>${T`Payload`}</td><td colspan="4"><input type="number" step="0.1" data-k="payload" value="${+(cfg.payload / 1000).toFixed(2)}" aria-label="${T`Payload mass`}"> t</td><td colspan="4">${T`Liftoff ${UI.fmt(liftoff / 1000, 1)} t · payload ${UI.fmt(100 * cfg.payload / liftoff, 2)}%`}</td><td><b style="color:${grounded ? 'var(--bad)' : 'var(--accent)'}">${UI.fmt(total, 0)}</b></td><td></td></tr></tbody>`;
      checksEl.innerHTML = `<span class="mono note">${T`Thrust-to-weight (${where} gravity):`}</span> ` + cfg.stages.map((s, i) => `<span class="twr-check">${stageName(s)} ${chip(checks[i])}</span>`).join('') +
        (grounded ? ` <b class="twr-bad">${T`Grounded: stage 1 cannot lift the stack.`}</b>` : '');
      view.redraw();
    }
    tab.addEventListener('change', (e) => {
      const t = e.target; if (!t.dataset.k) return;
      const val = parseFloat(t.value); if (!isFinite(val) || val < 0) return;
      if (t.dataset.k === 'payload') cfg.payload = val * 1000;
      else if (t.dataset.k === 'isp') cfg.stages[+t.dataset.i].isp = Math.max(1, val);
      else if (t.dataset.k === 'thrust') cfg.stages[+t.dataset.i].thrust = Math.max(1, val * 1000);
      else cfg.stages[+t.dataset.i][t.dataset.k] = val * 1000;
      renderTable();
    });
    tab.addEventListener('click', (e) => {
      const d = e.target.dataset.del; if (d == null) return;
      cfg.stages.splice(+d, 1); renderTable();
    });
    root.querySelector('#st-add').addEventListener('click', () => {
      if (cfg.stages.length >= 5) return;
      cfg.stages.push({ name: 'Stage ' + (cfg.stages.length + 1), num: cfg.stages.length + 1, prop: 20000, dry: 2500, isp: 421, thrust: 1.033e6 }); renderTable();
    });
    root.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      cfg = JSON.parse(JSON.stringify(PRESETS[b.dataset.p])); renderTable();
      if (b.dataset.p === 'single') Progress.done('rockets', 'single');
    }));

    const view = UI.canvas(root.querySelector('#st-cv'), (ctx, w, h) => {
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h);
      const pad = { l: 16, r: 16, t: 46, b: 28 };
      const total = results.reduce((s, r) => s + r.dv, 0) / 1000;
      const maxV = Math.max(14, total * 1.05);
      const X = (v) => pad.l + v / maxV * (w - pad.l - pad.r);
      const y0 = pad.t, bh = h - pad.t - pad.b;
      let acc = 0;
      const cols = [K.accent, K.trace, K.trace2, K.good, K.warn];
      ctx.font = `11px ${K.mono}`; ctx.textBaseline = 'middle';
      ctx.globalAlpha = grounded ? 0.25 : 1;
      results.forEach((r, i) => {
        const a = X(acc), b = X(acc + r.dv / 1000);
        ctx.fillStyle = cols[i % cols.length]; ctx.globalAlpha = grounded ? 0.2 : 0.85; ctx.fillRect(a, y0, Math.max(1, b - a - 2), bh);
        ctx.globalAlpha = grounded ? 0.5 : 1;
        ctx.fillStyle = K.bg; ctx.textAlign = 'center';
        if (b - a > 70) ctx.fillText(`${stageName(cfg.stages[i])} ${UI.fmt(r.dv / 1000, 2)}`, (a + b) / 2, y0 + bh / 2);
        acc += r.dv / 1000;
      });
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left'; ctx.fillStyle = K.ink;
      const ok = (n) => !grounded && n.v <= total;
      if (cfg.g > 5) for (const [k, n] of NEEDS.entries()) {
        const x = X(n.v);
        ctx.strokeStyle = ok(n) ? K.good : K.bad; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(x, y0 - 30 + k * 12); ctx.lineTo(x, y0 + bh + 6); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = ok(n) ? K.good : K.bad; ctx.textAlign = n.v > maxV * 0.7 ? 'right' : 'left';
        ctx.fillText((ok(n) ? '✓ ' : '✗ ') + T(n.l), x + (ctx.textAlign === 'right' ? -5 : 5), y0 - 24 + k * 12);
      }
      if (grounded) {
        ctx.font = `600 14px ${K.mono}`; ctx.fillStyle = K.bad; ctx.textAlign = 'center';
        ctx.fillText(T`GROUNDED · stage 1 TWR ${UI.fmt(checks[0].t0, 2)} < 1: the rocket never leaves the pad`, w / 2, y0 + bh / 2);
      }
      ctx.font = `11px ${K.mono}`; ctx.fillStyle = K.muted; ctx.textAlign = 'left';
      ctx.fillText(T`total ideal Δv ${UI.fmt(total, 2)} km/s` + (cfg.g > 5 ? '' : T` · lunar module: TWR measured against lunar gravity`), pad.l, h - 12);
    });
    renderTable();
  }
})();
