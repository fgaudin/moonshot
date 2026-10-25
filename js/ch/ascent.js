/* Chapter 4 — Getting to orbit: gravity turn, losses, Earth's rotation. Lab: Saturn V ascent simulator. */
(function () {
  'use strict';
  const { C } = Phys;

  App.chapter({
    id: 'ascent', phase: 'Ascent', title: 'Getting to Orbit', lab: 'Saturn V ascent',
    blurb: 'Fly the Saturn V into a 185 km parking orbit. Pitch over too early and drag tears you apart; too late and gravity eats your propellant.',
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: 'Phase 4 · Ascent',
          title: 'Getting to Orbit',
          lede: 'Orbit is about speed, not height: 185 km up but 7.8 km/s sideways. The ascent is a compromise between climbing out of the air quickly and turning horizontal early.',
          refs: ['Sellers · Getting to Orbit', 'BMW ch. 6 Ballistic Missile Trajectories'],
        })}

        <section class="section">
          <h2><span class="idx">4.1</span>The Δv budget to orbit</h2>
          <div class="prose">
            <p>Circular speed at the Apollo parking altitude of 185 km is 7.79 km/s, yet launch vehicles must supply about 9.3–9.5 km/s. The difference is <b>losses</b>, minus a gift from Earth’s rotation:</p>
            <div class="eq">\\[ \\Delta v_{design} = v_{orbit} + \\underbrace{\\int g\\sin\\gamma\\,dt}_{\\text{gravity loss}} + \\underbrace{\\int \\frac{D}{m}\\,dt}_{\\text{drag loss}} + \\underbrace{\\int \\frac{F}{m}(1-\\cos\\alpha)\\,dt}_{\\text{steering loss}} - v_{rotation} \\]</div>
            ${Sym.where([['\\Delta v_{design}', 'total velocity change the rocket must be able to deliver', 'm/s'], 'vorbit', 'integral', 'g', 'gamma', 'D', 'm', 'Fth', 'alpha', 'vrot'], 'In words: orbital speed + what gravity steals while you climb + what the air steals + what is wasted by not pointing exactly along the path − the free speed from Earth’s spin.')}
            <p><b>Gravity loss</b> is the thrust spent holding the vehicle up while its path is still steep (\\(\\gamma\\) is the flight-path angle). It is the largest loss, often 1–1.5 km/s, and it is why low thrust-to-weight rockets are inefficient. <b>Drag loss</b> is small for a big rocket, around 40 m/s for the Saturn V, but drag sets the <b>maximum dynamic pressure</b> \\(q = \\tfrac12\\rho v^2\\) that the structure must survive. <b>Steering loss</b> comes from thrust that isn’t aligned with the velocity.</p>
            <p><b>Earth’s rotation</b> gives a launch due east a free \\(\\omega_\\oplus R_\\oplus\\cos\\phi\\): 465 m/s at the equator, 408 m/s at Cape Canaveral (28.5° N). Launch west and you pay it back twice.</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">4.2</span>The gravity turn</h2>
          <div class="prose">
            <p>A rocket starts vertical so it clears the pad and gets out of the thick air. A few seconds later it makes a small <b>pitch kick</b>, then lets gravity do the turning: with thrust aligned to the airflow there is no angle of attack, so no aerodynamic side load. The flight-path angle obeys</p>
            <div class="eq">\\[ \\dot\\gamma = -\\left(\\frac{g}{v} - \\frac{v}{r}\\right)\\cos\\gamma \\]</div>
            ${Sym.where(['gammadot', 'g', 'v', 'r', 'gamma'], 'Slow rockets (small v) turn over fast; at orbital speed g/v = v/r and the path stops bending toward the ground.')}
            <p>The slower the vehicle, the faster gravity bends its path. That is why the size and timing of the kick matter so much. Once above the atmosphere the upper stages switch to closed-loop guidance. Saturn V used the Iterative Guidance Mode, which steers to hit a target altitude, speed and flight-path angle at cutoff. The simulator uses a simplified version of the same idea for the S-II and S-IVB.</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">4.3</span>Lab: fly the Saturn V</h2>
          <div class="prose"><p>A planar simulation with Apollo-era numbers: five F-1s whose thrust rises as the air thins, the centre engine shut down at T+135 s, J-2 upper stages, an exponential atmosphere and a rotating Earth. You choose when and how hard to pitch over. Small changes to the kick have large effects: real launch vehicles fly a carefully pre-computed pitch program for this reason.</p></div>
          <div class="lab" id="as">
            <div class="lab-head"><span class="tag">Lab</span><h3>Saturn V ascent</h3><span class="spacer"></span>
              <div class="btn-row"><button class="btn" data-p="nominal">Nominal</button><button class="btn" data-p="lofted">Too late</button><button class="btn" data-p="flat">Too hard</button><button class="btn" data-p="west">Launch west</button><button class="btn primary" id="as-play">▸ Replay</button></div></div>
            <div class="stage" style="min-height:400px"><canvas id="as-cv" aria-label="Ascent trajectory over the curved Earth"></canvas><div class="overlay" id="as-ov"></div><div class="badge" id="as-badge"></div></div>
            <div class="controls">
              ${UI.slider({ id: 'as-kt', label: 'Pitch kick time', min: 5, max: 30, step: 0.5, value: 16, unit: 's' })}
              ${UI.slider({ id: 'as-ka', label: 'Pitch kick angle', min: 0.1, max: 2.5, step: 0.05, value: 0.7, unit: '°' })}
              ${UI.slider({ id: 'as-alt', label: 'Target orbit altitude', min: 150, max: 400, step: 5, value: 185, unit: 'km' })}
              ${UI.slider({ id: 'as-lat', label: 'Launch latitude', min: 0, max: 65, step: 0.5, value: 28.5, unit: '°' })}
              <div class="ctl"><label for="as-dir"><span>Launch direction</span></label><select id="as-dir"><option value="east">Due east (prograde)</option><option value="west">Due west (retrograde)</option></select></div>
              <dl class="readout" id="as-ro"></dl>
            </div>
            <div class="lab-foot">
              <div class="mini"><h4>Altitude (km)</h4><canvas id="as-c1"></canvas></div>
              <div class="mini"><h4>Inertial speed (km/s)</h4><canvas id="as-c2"></canvas></div>
              <div class="mini"><h4>Dynamic pressure (kPa)</h4><canvas id="as-c3"></canvas></div>
              <div class="mini"><h4>Acceleration (g)</h4><canvas id="as-c4"></canvas></div>
            </div>
          </div>
          <div class="callout history"><b>Apollo 11, for comparison</b>Liftoff 13:32:00 UTC. Max Q 35 kPa at T+83 s, 13.5 km. S-IC cutoff at T+161 s, 67 km, 2.76 km/s. S-II cutoff at T+548 s. S-IVB cutoff and orbit insertion at T+699 s, in a 183 × 186 km orbit. Compare with your flight.</div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>Check yourself</h2>
          <div id="practice-slot"></div>
        </section>
        ${App.next('ascent')}`;

      mountAscent(page.querySelector('#as'));
      Practice.embed(page.querySelector('#practice-slot'), 'ascent', 2);
    },
  });

  function mountAscent(root) {
    let sim = null, play = 0;
    const presets = {
      nominal: { 'as-kt': 16, 'as-ka': 0.7, 'as-alt': 185, 'as-lat': 28.5, 'as-dir': 'east' },
      lofted: { 'as-kt': 24, 'as-ka': 0.3, 'as-alt': 185, 'as-lat': 28.5, 'as-dir': 'east' },
      flat: { 'as-kt': 10, 'as-ka': 1.5, 'as-alt': 185, 'as-lat': 28.5, 'as-dir': 'east' },
      west: { 'as-kt': 16, 'as-ka': 0.7, 'as-alt': 185, 'as-lat': 28.5, 'as-dir': 'west' },
    };
    const view = UI.canvas(root.querySelector('#as-cv'), null);
    const minis = ['#as-c1', '#as-c2', '#as-c3', '#as-c4'].map((s) => UI.canvas(root.querySelector(s), null));

    const fmts = { 'as-kt': (x) => x.toFixed(1), 'as-ka': (x) => x.toFixed(2), 'as-alt': (x) => x.toFixed(0), 'as-lat': (x) => x.toFixed(1) };
    const ctl = UI.bindControls(root, fmts, (v) => {
      sim = Phys.simulateAscent({ kickTime: v['as-kt'], kickAngle: v['as-ka'], targetAlt: v['as-alt'] * 1000, latitude: v['as-lat'], east: v['as-dir'] !== 'west' });
      play = UI.reducedMotion() ? sim.t : 0;
      readout(v);
      minis.forEach((m) => m.redraw());
    });
    root.querySelector('#as-dir').addEventListener('change', () => ctl.update());
    root.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const p = presets[b.dataset.p];
      for (const k in p) ctl.set(k, p[k]);
      ctl.update();
    }));
    root.querySelector('#as-play').addEventListener('click', () => { play = 0; });

    function readout(v) {
      const s = sim, km = (m) => UI.fmt(m / 1000, 0);
      const target = v['as-alt'];
      const ok = s.outcome === 'orbit' && s.perigee > 120000;
      const b = root.querySelector('#as-badge');
      const msg = { orbit: ok ? 'Orbit achieved' : 'Orbit too low, will decay', crash: 'Lost: vehicle fell back', burnout: 'Out of propellant', timeout: 'Guidance timeout' }[s.outcome];
      b.textContent = msg;
      b.className = 'badge ' + (ok ? (s.maxQ.q > 40000 ? 'warn' : 'good') : 'bad');
      const L = s.losses;
      const s1 = s.trace.find((p) => p.stage === 1);
      root.querySelector('#as-ro').innerHTML = `
        <dt>Orbit (perigee × apogee)</dt><dd class="hl">${s.outcome === 'crash' ? '—' : `${km(s.perigee)} × ${km(s.apogee)} km`}</dd>
        <dt>Insertion time</dt><dd>T+${UI.fmtTime(s.t)}</dd>
        <dt>S-IVB propellant left</dt><dd>${s.stage === 2 ? UI.fmt(s.propLeft / 1000, 1) + ' t' : '—'}</dd>
        <dt>Max Q</dt><dd style="color:${s.maxQ.q > 40000 ? 'var(--bad)' : 'inherit'}">${UI.fmt(s.maxQ.q / 1000, 1)} kPa @ T+${s.maxQ.t.toFixed(0)} s</dd>
        <dt>S-IC cutoff</dt><dd>${s1 ? `${km(s1.h)} km, ${UI.fmt(s1.v / 1000, 2)} km/s` : '—'}</dd>
        <dt class="sub">Δv ledger (m/s)</dt>
        <dt>Ideal Δv expended</dt><dd>${UI.fmt(s.dvIdeal, 0)}</dd>
        <dt>− Gravity loss</dt><dd>${UI.fmt(L.gravity, 0)}</dd>
        <dt>− Drag loss</dt><dd>${UI.fmt(L.drag, 0)}</dd>
        <dt>− Steering loss</dt><dd>${UI.fmt(L.steering, 0)}</dd>
        <dt>${s.rotV >= 0 ? '+' : '−'} Earth rotation</dt><dd>${UI.fmt(Math.abs(s.rotV), 0)}</dd>
        <dt>= Final inertial speed</dt><dd class="hl">${UI.fmt(s.v, 0)}</dd>`;
      void target;
    }

    // scene: curved Earth seen from the side, trajectory downrange
    view.draw = (ctx, w, h) => {
      if (!sim) return;
      const T = UI.tok();
      ctx.clearRect(0, 0, w, h);
      const tr = sim.trace;
      const idx = tr.findIndex((p) => p.t > play);
      const n = idx < 0 ? tr.length : Math.max(1, idx);
      const maxX = Math.max(400e3, ...tr.map((p) => Math.abs(p.x)));
      const s = (w - 40) / (maxX * 1.08);
      const R = C.RE * s, ox = 20, groundY = h - 40;
      const cx = ox, cy = groundY + R;
      const P = (x, hh) => { const th = Math.abs(x) / C.RE; return [cx + (C.RE + hh) * s * Math.sin(th), cy - (C.RE + hh) * s * Math.cos(th)]; };
      // vertical exaggeration so altitude is readable
      const vex = Math.min(8, Math.max(1, (h - 90) / (Math.max(...tr.map((p) => p.h)) * s * 1.1)));
      const PP = (x, hh) => P(x, hh * vex);
      // atmosphere bands
      for (const [alt, a] of [[10e3, 0.12], [30e3, 0.07], [80e3, 0.035]]) {
        ctx.fillStyle = T.trace; ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(cx, cy, R + alt * vex * s, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = T.earth; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      // target altitude
      ctx.strokeStyle = T.good; ctx.setLineDash([4, 6]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R + ctl.read()['as-alt'] * 1000 * vex * s, -Math.PI / 2, 0); ctx.stroke(); ctx.setLineDash([]);
      // path coloured by stage
      const cols = [T.accent, T.trace2, T.trace];
      ctx.lineWidth = 2.4;
      for (let i = 1; i < n; i++) {
        ctx.strokeStyle = cols[tr[i].stage];
        const [x0, y0] = PP(tr[i - 1].x, tr[i - 1].h), [x1, y1] = PP(tr[i].x, tr[i].h);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      const cur = tr[n - 1];
      const [vx, vy] = PP(cur.x, cur.h);
      ctx.fillStyle = T.ink; ctx.beginPath(); ctx.arc(vx, vy, 4, 0, 7); ctx.fill();
      ctx.font = `10px ${T.mono}`; ctx.fillStyle = T.muted; ctx.textAlign = 'left';
      ctx.fillText(`vertical scale ×${vex.toFixed(1)}`, w - 140, h - 12);
      ctx.fillStyle = T.good; ctx.fillText('target orbit', 30, cy - R - ctl.read()['as-alt'] * 1000 * vex * s - 6);
      const legend = ['S-IC', 'S-II', 'S-IVB'];
      legend.forEach((l, i) => { ctx.fillStyle = cols[i]; ctx.fillRect(w - 150 + i * 48, 14, 10, 3); ctx.fillText(l, w - 136 + i * 48, 18); });
      const ev = sim.events.filter((e) => e.t <= play).pop();
      root.querySelector('#as-ov').innerHTML = `T+${UI.fmtTime(cur.t)}<br>alt ${UI.fmt(cur.h / 1000, 1)} km · v ${UI.fmt(cur.v, 0)} m/s<br>pitch ${UI.fmt(cur.beta * 180 / Math.PI, 1)}° · ${UI.fmt(cur.g, 2)} g<br>${ev ? ev.label : ''}`;
    };

    const miniDraw = (k, f, yFmt, extra = {}) => (ctx, w, h) => {
      if (!sim) return;
      const T = UI.tok();
      UI.chart(ctx, w, h, { series: [{ data: sim.trace.map((p) => [p.t, f(p)]), color: k === 2 ? T.warn : T.trace, width: 1.6, fill: true }], xMin: 0, xMax: Math.max(sim.t, 60), yMin: 0, xFmt: (x) => x.toFixed(0), yFmt, cursor: play,
        marks: sim.events.filter((e) => /burnout|ignition/.test(e.label) && !/ignition/.test(e.label)).map((e) => ({ x: e.t, color: T.muted })), ...extra });
    };
    minis[0].draw = miniDraw(0, (p) => p.h / 1000, (y) => y.toFixed(0));
    minis[1].draw = miniDraw(1, (p) => p.v / 1000, (y) => y.toFixed(0));
    minis[2].draw = miniDraw(2, (p) => p.q / 1000, (y) => y.toFixed(0));
    minis[3].draw = miniDraw(3, (p) => p.g, (y) => y.toFixed(1));

    let acc = 0;
    UI.loop((dt) => {
      if (!sim) return;
      if (play < sim.t) { play = Math.min(sim.t, play + dt * 45); acc += dt; if (acc > 0.25) { minis.forEach((m) => m.redraw()); acc = 0; } }
      else if (acc !== -1) { minis.forEach((m) => m.redraw()); acc = -1; }
      view.redraw();
    });
    ctl.update();
  }
})();
