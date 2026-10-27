/* Chapter 8 — Returning from space: entry dynamics, heating, the corridor. Lab: entry corridor explorer. */
(function () {
  'use strict';
  const { C } = Phys;

  App.chapter({
    id: 'entry', phase: N`Entry`, title: N`Coming Home`, lab: N`Entry corridor`,
    blurb: N`Hit the atmosphere at 11 km/s inside a corridor 2° wide. Too shallow and you skip off, too steep and the g-load kills.`,
    render(page) {
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
            <p>${T`Drop lift and gravity (drag dominates) and the equations integrate in closed form (Allen & Eggers, 1953). The peak deceleration then depends only on entry speed and angle, not on the vehicle:`}</p>
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
          <h2><span class="idx">10.5</span>${T`Blackout and splashdown`}</h2>
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
      Practice.embed(page.querySelector('#practice-slot'), 'entry', 3);
    },
  });

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
