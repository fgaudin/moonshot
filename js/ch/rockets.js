/* Chapter 3 — Rocket propulsion: thrust, specific impulse, the rocket equation, staging. */
(function () {
  'use strict';
  const { C } = Phys;
  const G0 = C.g0;

  const PROPELLANTS = [
    { n: 'Solid (APCP)', isp: 265, ex: 'Shuttle SRB' },
    { n: 'RP-1 / LOX', isp: 304, ex: 'F-1 (vac), S-IC' },
    { n: 'N₂O₄ / Aerozine-50', isp: 314, ex: 'Apollo SPS, LM engines' },
    { n: 'LH₂ / LOX', isp: 421, ex: 'J-2, S-II & S-IVB' },
    { n: 'Nuclear thermal', isp: 850, ex: 'NERVA (tested 1960s)' },
  ];

  const PRESETS = {
    saturn: { payload: 45000, stages: [
      { name: 'S-IC', prop: 2150000, dry: 131000, isp: 285 },
      { name: 'S-II', prop: 444000, dry: 40000, isp: 421 },
      { name: 'S-IVB', prop: 107000, dry: 13500, isp: 421 }] },
    single: { payload: 45000, stages: [
      { name: 'One big stage', prop: 2701000, dry: 184500, isp: 304 }] },
    kerosene: { payload: 45000, stages: [
      { name: 'S-IC', prop: 2150000, dry: 131000, isp: 285 },
      { name: 'S-II (RP-1)', prop: 444000, dry: 40000, isp: 304 },
      { name: 'S-IVB (RP-1)', prop: 107000, dry: 13500, isp: 304 }] },
    lm: { payload: 0, stages: [
      { name: 'LM descent', prop: 8200, dry: 2030, isp: 311 },
      { name: 'LM ascent', prop: 2350, dry: 2450, isp: 311 }] },
  };

  App.chapter({
    id: 'rockets', phase: 'Ignition', title: 'Rocket Science', lab: 'Staging builder',
    blurb: 'Thrust, specific impulse and Tsiolkovsky’s logarithm. Why the Saturn V had three stages and was 85% propellant.',
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: 'Phase 3 · Ignition',
          title: 'Rocket Science',
          lede: 'A rocket is a machine for throwing mass backward very fast. How fast decides how much velocity it can buy, and the logarithm in the rocket equation decides how dearly.',
          refs: ['Sellers · Rockets and Launch Vehicles', 'Sutton & Biblarz, Rocket Propulsion Elements (for depth)'],
        })}

        <section class="section">
          <h2><span class="idx">3.1</span>The thrust equation</h2>
          <div class="prose">
            <p>Apply Newton’s second and third laws to a control volume around the engine. The force on the rocket is the momentum flux of the exhaust, plus a pressure term at the nozzle exit:</p>
            <div class="eq">\\[ F = \\dot m\\, v_e + (p_e - p_a)\\,A_e \\]</div>
            <p>\\(\\dot m\\) is the propellant mass flow, \\(v_e\\) the exhaust velocity, \\(p_e\\) and \\(A_e\\) the pressure and area at the nozzle exit, and \\(p_a\\) the ambient pressure. As the vehicle climbs, \\(p_a\\) falls and thrust rises. An F-1 gave 6.77 MN at sea level and 7.77 MN in vacuum. Engineers fold both terms into one <b>effective exhaust velocity</b> \\(c = F/\\dot m\\).</p>
          </div>
          <div class="lab" id="nz" style="grid-template-columns:minmax(0,1fr) 19rem">
            <div class="lab-head"><span class="tag">Lab</span><h3>F-1 engine at altitude</h3></div>
            <div class="stage" style="min-height:280px;background:var(--panel)"><canvas id="nz-cv" aria-label="F-1 thrust versus altitude"></canvas></div>
            <div class="controls">
              ${UI.slider({ id: 'nz-h', label: 'Altitude', min: 0, max: 80, step: 0.5, value: 0, unit: 'km' })}
              <dl class="readout" id="nz-ro"></dl>
              <p class="note" style="margin:0">ṁ = 2 578 kg/s, v<sub>e</sub> = 2 850 m/s, p<sub>e</sub> = 44 kPa, A<sub>e</sub> = 9.87 m² (values chosen to match the published thrusts).</p>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">3.2</span>Specific impulse</h2>
          <div class="prose">
            <p>The figure of merit for a propellant and engine is the <b>specific impulse</b>: the impulse delivered per unit <i>weight</i> of propellant consumed. It comes out in seconds:</p>
            <div class="eq">\\[ I_{sp} = \\frac{F}{\\dot m\\, g_0} = \\frac{c}{g_0} \\]</div>
            <p>Read it as the number of seconds one kilogram of propellant can produce one kilogram-force of thrust. Higher is better. Chemical rockets top out near 450 s, because the energy is in the chemical bonds and light exhaust molecules (H₂O, H₂) carry it away fastest.</p>
          </div>
          <div class="scroll-x" style="max-width:44rem"><table class="data"><thead><tr><th>Propellant</th><th>I<sub>sp</sub> (s)</th><th>c (m/s)</th><th>Flown on</th></tr></thead><tbody>
            ${PROPELLANTS.map((p) => `<tr><td>${p.n}</td><td>${p.isp}</td><td>${UI.fmt(p.isp * G0, 0)}</td><td>${p.ex}</td></tr>`).join('')}
          </tbody></table></div>
        </section>

        <section class="section">
          <h2><span class="idx">3.3</span>The rocket equation</h2>
          <div class="prose">
            <p>In time \\(dt\\) a rocket of mass \\(m\\) ejects \\(-dm\\) of propellant at speed \\(c\\) relative to itself. Conservation of momentum, with no external forces, gives \\(m\\,dv = -c\\,dm\\). Integrate from the initial mass \\(m_0\\) to the final mass \\(m_f\\):</p>
            <div class="eq">\\[ \\Delta v = c\\,\\ln\\frac{m_0}{m_f} = I_{sp}\\,g_0\\,\\ln\\frac{m_0}{m_f} \\]</div>
            <p>Konstantin Tsiolkovsky published this in 1903. It holds two hard truths. Δv grows only <i>logarithmically</i> with the mass ratio \\(MR = m_0/m_f\\). And the required mass ratio grows <i>exponentially</i> with Δv: \\(MR = e^{\\Delta v / c}\\). Reaching low orbit (about 9.3 km/s including losses) with kerosene engines needs a mass ratio near 23. In practice no single tank and engine can be that light.</p>
          </div>
          <div class="lab" id="re">
            <div class="lab-head"><span class="tag">Lab</span><h3>The tyranny of the logarithm</h3></div>
            <div class="stage" style="min-height:340px;background:var(--panel)"><canvas id="re-cv" aria-label="Delta-v versus mass ratio for several propellants"></canvas></div>
            <div class="controls">
              ${UI.slider({ id: 're-mr', label: 'Mass ratio m₀/m_f', min: 1, max: 25, step: 0.1, value: 6, unit: '' })}
              ${UI.slider({ id: 're-dv', label: 'or: Δv needed', min: 0.5, max: 15, step: 0.1, value: 9.3, unit: 'km/s' })}
              <dl class="readout" id="re-ro"></dl>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">3.4</span>Staging</h2>
          <div class="prose">
            <p>The way out is to stop carrying empty tanks. A <b>staged</b> rocket drops each stage’s structure when its propellant is gone, and the rocket equation restarts with a smaller mass. The total is the sum of the stages’ contributions, each computed with everything above it as payload:</p>
            <div class="eq">\\[ \\Delta v_{total} = \\sum_{k} I_{sp,k}\\,g_0\\,\\ln\\frac{m_{0,k}}{m_{f,k}} \\]</div>
            <p>Below is the Saturn V as flown on Apollo 11, using approximate masses and an average I<sub>sp</sub> of 285 s for the S-IC across its climb out of the atmosphere. Edit any cell. Then load the single-stage version: same propellant, same structure, one stage. It cannot reach orbit.</p>
          </div>
          <div class="lab" id="st" style="grid-template-columns:minmax(0,1fr)">
            <div class="lab-head"><span class="tag">Lab</span><h3>Staging builder</h3><span class="spacer"></span>
              <div class="btn-row"><button class="btn" data-p="saturn">Saturn V</button><button class="btn" data-p="single">Single stage</button><button class="btn" data-p="kerosene">All-kerosene</button><button class="btn" data-p="lm">Lunar Module</button><button class="btn" id="st-add">+ Stage</button></div></div>
            <div class="scroll-x" style="padding:.5rem 1rem"><table class="data" id="st-tab"></table></div>
            <div class="stage" style="min-height:220px;background:var(--panel);border-top:1px solid var(--line)"><canvas id="st-cv" aria-label="Delta-v bar per stage against mission requirements"></canvas></div>
          </div>
          <div class="callout history"><b>Why 85% propellant</b>The Saturn V weighed 2 938 tonnes at liftoff. About 2 700 t of that was propellant, and only 45 t, the Apollo spacecraft, was sent towards the Moon. The upper stages burned liquid hydrogen. Its 421 s I<sub>sp</sub> mattered most there, because every kilogram of upper stage has to be accelerated by all the stages below it.</div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>Check yourself</h2>
          <div id="practice-slot"></div>
        </section>
        ${App.next('rockets')}`;

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
      const T = UI.tok();
      const data = []; for (let x = 0; x <= 80; x += 1) data.push([x, thrust(x) / 1e6]);
      UI.chart(ctx, w, h, { series: [{ data, color: T.accent, width: 2.2, fill: true, end: false }], xMin: 0, xMax: 80, yMin: 6, yMax: 8, xLabel: 'altitude (km)', yLabel: 'thrust (MN)', cursor: hNow,
        hlines: [{ y: mdot * ve / 1e6, label: 'ṁ·vₑ (momentum thrust)', color: T.trace }] });
    });
    UI.bindControls(root, { 'nz-h': (x) => x.toFixed(1) }, (v) => {
      hNow = v['nz-h'];
      const pa = Phys.pressure(hNow * 1000), F = thrust(hNow);
      root.querySelector('#nz-ro').innerHTML = `
        <dt>Ambient p<sub>a</sub></dt><dd>${UI.fmt(pa / 1000, 2)} kPa</dd>
        <dt>Momentum ṁ·vₑ</dt><dd>${UI.fmt(mdot * ve / 1e6, 3)} MN</dd>
        <dt>Pressure (pₑ−pₐ)Aₑ</dt><dd>${UI.fmt((pe - pa) * Ae / 1e6, 3)} MN</dd>
        <dt>Thrust F</dt><dd class="hl">${UI.fmt(F / 1e6, 3)} MN</dd>
        <dt>I<sub>sp</sub> = F/(ṁg₀)</dt><dd>${UI.fmt(F / (mdot * G0), 1)} s</dd>
        <dt>Nozzle</dt><dd>${pa > pe ? 'overexpanded' : 'underexpanded'}</dd>`;
      view.redraw();
    }).update();
  }

  function mountRE(root) {
    let mr = 6, dvNeed = 9.3;
    const colors = (T) => [T.muted, T.accent, T.trace2, T.trace, T.good];
    const view = UI.canvas(root.querySelector('#re-cv'), (ctx, w, h) => {
      const T = UI.tok(), cs = colors(T);
      const series = PROPELLANTS.map((p, i) => {
        const d = []; for (let x = 1; x <= 25; x += 0.25) d.push([x, p.isp * G0 * Math.log(x) / 1000]);
        return { data: d, color: cs[i], width: 1.8, end: false };
      });
      const { X, Y } = UI.chart(ctx, w, h, { series, xMin: 1, xMax: 25, yMin: 0, yMax: 15, xLabel: 'mass ratio m₀ / m_f', yLabel: 'Δv (km/s)', cursor: mr,
        hlines: [{ y: dvNeed, label: 'Δv needed', color: T.ink }] });
      ctx.font = `10px ${T.mono}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      // label each curve where it leaves the plot (right edge or top), pushed apart vertically
      const labels = PROPELLANTS.map((p, i) => {
        const c = p.isp * G0 / 1000, xTop = Math.exp(15 / c);
        return xTop < 25 ? { i, x: X(xTop) - 6, y: Y(14.4), txt: `${p.n} · ${p.isp} s` } : { i, x: X(25) - 4, y: Y(c * Math.log(25)) - 8, txt: `${p.n} · ${p.isp} s` };
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
      root.querySelector('#re-ro').innerHTML = `<dt class="sub" style="border:0;margin:0;padding:0">Δv at MR = ${mr.toFixed(1)}</dt>` +
        PROPELLANTS.map((p) => `<dt>${p.n}</dt><dd>${UI.fmt(p.isp * G0 * Math.log(mr) / 1000, 2)} km/s</dd>`).join('') +
        `<dt class="sub">Mass ratio for ${dvNeed.toFixed(1)} km/s</dt>` +
        PROPELLANTS.map((p) => { const m = Math.exp(dvNeed * 1000 / (p.isp * G0)); return `<dt>${p.n}</dt><dd>${UI.fmt(m, 1)} <span style="color:var(--muted)">(${UI.fmt(100 * (1 - 1 / m), 1)}% prop.)</span></dd>`; }).join('');
      view.redraw();
    }).update();
  }

  function mountStaging(root) {
    let cfg = JSON.parse(JSON.stringify(PRESETS.saturn));
    const tab = root.querySelector('#st-tab');
    let results = [];
    const compute = () => { results = Phys.rocket.staging(cfg.stages, cfg.payload); };
    const NEEDS = [{ v: 9.3, l: 'Low Earth orbit ≈ 9.3 km/s' }, { v: 12.48, l: '+ TLI = 12.5 km/s' }];

    function renderTable() {
      compute();
      const total = results.reduce((s, r) => s + r.dv, 0);
      const liftoff = results[0] ? results[0].m0 : cfg.payload;
      tab.innerHTML = `<thead><tr><th>Stage</th><th>Propellant (t)</th><th>Structure (t)</th><th>I<sub>sp</sub> (s)</th><th>m₀ (t)</th><th>m_f (t)</th><th>MR</th><th>Δv (m/s)</th><th></th></tr></thead><tbody>
        ${cfg.stages.map((s, i) => `<tr><td>${s.name}</td>
          <td><input type="number" step="1" data-i="${i}" data-k="prop" value="${+(s.prop / 1000).toFixed(1)}" aria-label="${s.name} propellant"></td>
          <td><input type="number" step="0.1" data-i="${i}" data-k="dry" value="${+(s.dry / 1000).toFixed(2)}" aria-label="${s.name} structure"></td>
          <td><input type="number" step="1" data-i="${i}" data-k="isp" value="${s.isp}" aria-label="${s.name} Isp"></td>
          <td>${UI.fmt(results[i].m0 / 1000, 1)}</td><td>${UI.fmt(results[i].mf / 1000, 1)}</td><td>${UI.fmt(results[i].m0 / results[i].mf, 2)}</td><td><b>${UI.fmt(results[i].dv, 0)}</b></td>
          <td>${cfg.stages.length > 1 ? `<button class="btn" data-del="${i}" aria-label="Remove ${s.name}" style="padding:.3rem .5rem">✕</button>` : ''}</td></tr>`).join('')}
        <tr><td>Payload</td><td colspan="3"><input type="number" step="0.1" data-k="payload" value="${+(cfg.payload / 1000).toFixed(2)}" aria-label="Payload mass"> t</td><td colspan="3">Liftoff mass ${UI.fmt(liftoff / 1000, 1)} t · payload fraction ${UI.fmt(100 * cfg.payload / liftoff, 2)}%</td><td><b style="color:var(--accent)">${UI.fmt(total, 0)}</b></td><td></td></tr></tbody>`;
      view.redraw();
    }
    tab.addEventListener('change', (e) => {
      const t = e.target; if (!t.dataset.k) return;
      const val = parseFloat(t.value); if (!isFinite(val) || val < 0) return;
      if (t.dataset.k === 'payload') cfg.payload = val * 1000;
      else if (t.dataset.k === 'isp') cfg.stages[+t.dataset.i].isp = Math.max(1, val);
      else cfg.stages[+t.dataset.i][t.dataset.k] = val * 1000;
      renderTable();
    });
    tab.addEventListener('click', (e) => {
      const d = e.target.dataset.del; if (d == null) return;
      cfg.stages.splice(+d, 1); renderTable();
    });
    root.querySelector('#st-add').addEventListener('click', () => {
      if (cfg.stages.length >= 5) return;
      cfg.stages.push({ name: 'Stage ' + (cfg.stages.length + 1), prop: 20000, dry: 2500, isp: 421 }); renderTable();
    });
    root.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => { cfg = JSON.parse(JSON.stringify(PRESETS[b.dataset.p])); renderTable(); }));

    const view = UI.canvas(root.querySelector('#st-cv'), (ctx, w, h) => {
      const T = UI.tok();
      ctx.clearRect(0, 0, w, h);
      const pad = { l: 16, r: 16, t: 46, b: 28 };
      const total = results.reduce((s, r) => s + r.dv, 0) / 1000;
      const maxV = Math.max(14, total * 1.05);
      const X = (v) => pad.l + v / maxV * (w - pad.l - pad.r);
      const y0 = pad.t, bh = h - pad.t - pad.b;
      let acc = 0;
      const cols = [T.accent, T.trace, T.trace2, T.good, T.warn];
      ctx.font = `11px ${T.mono}`; ctx.textBaseline = 'middle';
      results.forEach((r, i) => {
        const a = X(acc), b = X(acc + r.dv / 1000);
        ctx.fillStyle = cols[i % cols.length]; ctx.globalAlpha = 0.85; ctx.fillRect(a, y0, Math.max(1, b - a - 2), bh); ctx.globalAlpha = 1;
        ctx.fillStyle = T.bg; ctx.textAlign = 'center';
        if (b - a > 70) ctx.fillText(`${cfg.stages[i].name} ${UI.fmt(r.dv / 1000, 2)}`, (a + b) / 2, y0 + bh / 2);
        acc += r.dv / 1000;
      });
      ctx.textAlign = 'left'; ctx.fillStyle = T.ink;
      for (const [k, n] of NEEDS.entries()) {
        const x = X(n.v);
        ctx.strokeStyle = n.v <= total ? T.good : T.bad; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(x, y0 - 30 + k * 12); ctx.lineTo(x, y0 + bh + 6); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = n.v <= total ? T.good : T.bad; ctx.textAlign = n.v > maxV * 0.7 ? 'right' : 'left';
        ctx.fillText((n.v <= total ? '✓ ' : '✗ ') + n.l, x + (ctx.textAlign === 'right' ? -5 : 5), y0 - 24 + k * 12);
      }
      ctx.fillStyle = T.muted; ctx.textAlign = 'left';
      ctx.fillText(`total ideal Δv ${UI.fmt(total, 2)} km/s`, pad.l, h - 12);
    });
    renderTable();
  }
})();
