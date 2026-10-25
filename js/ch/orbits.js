/* Chapter 2 — The two-body problem, conic sections, Kepler's laws, time of flight. Lab: orbit designer. */
(function () {
  'use strict';
  const { C } = Phys;

  App.chapter({
    id: 'orbits', phase: 'Coast', title: 'Describing Orbits', lab: 'Orbit designer',
    blurb: 'Two conserved quantities, energy and angular momentum, fix every orbit. Kepler’s equation tells you where you are on it.',
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: 'Phase 2 · Coast',
          title: 'Describing Orbits',
          lede: 'The two-body equation has an exact solution: the conic sections. Energy fixes the orbit’s size, angular momentum its shape, and Kepler’s equation gives the position at any time.',
          refs: ['Sellers · Understanding Orbits; Describing Orbits', 'BMW ch. 1 Two-Body Orbital Mechanics', 'BMW ch. 2 & 4 Elements; Position vs Time'],
        })}

        <section class="section">
          <h2><span class="idx">2.1</span>Two constants of motion</h2>
          <div class="prose">
            <p>Gravity is a conservative central force, so two quantities stay fixed along any coasting trajectory. Dot the two-body equation with \\(\\dot{\\vec r}\\) and you get the <b>specific mechanical energy</b> (energy per kilogram):</p>
            <div class="eq">\\[ \\varepsilon = \\frac{v^2}{2} - \\frac{\\mu}{r} = \\text{constant} \\]</div>
            <p>Cross it with \\(\\vec r\\) and you get the <b>specific angular momentum</b>, a vector perpendicular to the orbital plane. The plane therefore never changes:</p>
            <div class="eq">\\[ \\vec h = \\vec r \\times \\vec v, \\qquad h = r\\,v\\cos\\phi \\]</div>
            <p>Here \\(\\phi\\) is the <b>flight-path angle</b>, measured from the local horizontal to the velocity vector. It is zero at periapsis and apoapsis.</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">2.2</span>The trajectory equation</h2>
          <div class="prose">
            <p>Integrating the equation of motion once more (BMW §1.5) gives the shape of every possible path, the polar equation of a conic with the central body at one focus:</p>
            <div class="eq">\\[ r = \\frac{p}{1 + e\\cos\\nu}, \\qquad p = \\frac{h^2}{\\mu} = a(1-e^2) \\]</div>
            <p>\\(\\nu\\) is the <b>true anomaly</b>, the angle from periapsis to the spacecraft. The eccentricity \\(e\\) selects the conic, and the energy sign tells you which kind you are on:</p>
          </div>
          <div class="scroll-x" style="max-width:52rem"><table class="data">
            <thead><tr><th>Conic</th><th>Eccentricity</th><th>Energy ε</th><th>Semi-major axis</th><th>Example</th></tr></thead>
            <tbody>
              <tr><td>Circle</td><td>e = 0</td><td>< 0</td><td>a = r</td><td>Apollo parking orbit, 185 km</td></tr>
              <tr><td>Ellipse</td><td>0 < e < 1</td><td>< 0</td><td>a > 0</td><td>Trans-lunar coast (two-body view)</td></tr>
              <tr><td>Parabola</td><td>e = 1</td><td>= 0</td><td>a = ∞</td><td>Exactly escape velocity</td></tr>
              <tr><td>Hyperbola</td><td>e > 1</td><td>> 0</td><td>a < 0</td><td>Path relative to the Moon on arrival</td></tr>
            </tbody></table></div>
          <div class="prose">
            <p>Energy depends only on the semi-major axis, \\(\\varepsilon = -\\mu/2a\\). Combine that with the definition of \\(\\varepsilon\\) and you get the most useful equation in astrodynamics, the <b>vis-viva</b> (energy) equation:</p>
            <div class="eq">\\[ v = \\sqrt{\\mu\\left(\\frac{2}{r} - \\frac{1}{a}\\right)} \\]</div>
            <p>The apsides follow from the geometry: \\(r_p = a(1-e)\\), \\(r_a = a(1+e)\\), and \\(e = (r_a - r_p)/(r_a + r_p)\\).</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">2.3</span>Kepler’s laws, derived</h2>
          <div class="prose">
            <p>Kepler found three laws in Tycho Brahe’s observations of Mars (1609–1619). Newton showed that they follow from his own laws:</p>
            <ol>
              <li><b>Orbits are ellipses</b> with the central body at one focus. This is the bound case of the trajectory equation.</li>
              <li><b>Equal areas in equal times.</b> The area swept per unit time is \\(dA/dt = h/2\\), constant because \\(h\\) is conserved. Turn on the sectors in the lab below and watch the spacecraft speed up near periapsis.</li>
              <li><b>Period</b> depends only on the semi-major axis: \\(T = 2\\pi\\sqrt{a^3/\\mu}\\).</li>
            </ol>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">2.4</span>Lab: design an orbit from a burnout state</h2>
          <div class="prose"><p>A launch vehicle hands its payload over at <b>burnout</b>: an altitude, a speed and a flight-path angle. From those three numbers the energy and angular momentum, and therefore the whole orbit, are fixed (Sellers works through this in <i>Describing Orbits</i>). Change them and the orbit redraws; the satellite moves according to Kepler’s equation.</p></div>
          <div class="lab" id="od">
            <div class="lab-head"><span class="tag">Lab</span><h3>Orbit designer</h3><span class="spacer"></span>
              <div class="btn-row">
                <button class="btn" data-p="leo">Parking orbit</button>
                <button class="btn" data-p="gto">GTO</button>
                <button class="btn" data-p="molniya">Molniya-like</button>
                <button class="btn" data-p="tli">After TLI</button>
                <button class="btn" data-p="hyp">Hyperbolic</button>
              </div></div>
            <div class="stage" style="min-height:480px"><canvas id="od-cv" aria-label="Orbit drawing with Earth at the focus"></canvas><div class="overlay" id="od-ov"></div><div class="badge" id="od-badge"></div></div>
            <div class="controls">
              ${UI.slider({ id: 'od-h', label: 'Burnout altitude', min: 100, max: 20000, step: 5, value: 300, unit: 'km' })}
              ${UI.slider({ id: 'od-v', label: 'Burnout speed', min: 4, max: 13, step: 0.005, value: 9.2, unit: 'km/s' })}
              ${UI.slider({ id: 'od-phi', label: 'Flight-path angle φ', min: -60, max: 60, step: 0.5, value: 5, unit: '°' })}
              ${UI.slider({ id: 'od-warp', label: 'Time warp', min: 1, max: 4, step: 0.05, value: 2.8 })}
              <label class="mono note" style="display:flex;gap:.5rem;align-items:center"><input type="checkbox" id="od-areas" checked> Equal-area sectors (T/12 each)</label>
              <dl class="readout" id="od-ro"></dl>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">2.5</span>Where will it be? Kepler’s equation</h2>
          <div class="prose">
            <p>Sooner or later every mission must answer the question “where will the spacecraft be at time \\(t\\)?” The angle \\(\\nu\\) does not grow uniformly with time, so Kepler introduced two auxiliary angles. The <b>eccentric anomaly</b> \\(E\\) is measured at the centre of the ellipse, on an auxiliary circle of radius \\(a\\). The <b>mean anomaly</b> \\(M\\) does grow uniformly, at the mean motion \\(n\\):</p>
            <div class="eq">\\[ n = \\sqrt{\\frac{\\mu}{a^3}}, \\qquad M = n\\,(t - t_p) = E - e\\sin E \\]</div>
            <div class="eq">\\[ \\tan\\frac{\\nu}{2} = \\sqrt{\\frac{1+e}{1-e}}\\;\\tan\\frac{E}{2} \\]</div>
            <p>Going from position to time is direct. Going from time to position means solving Kepler’s equation for \\(E\\), which has no closed-form solution. Newton’s iteration \\(E_{k+1} = E_k - (E_k - e\\sin E_k - M)/(1 - e\\cos E_k)\\) converges in a few steps; that is what the lab above runs on every frame. BMW chapter 4 develops the universal-variable form that also covers parabolas and hyperbolas. The Apollo Guidance Computer used that approach (Battin’s formulation) in its conic routines.</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">2.6</span>Orbital elements in three dimensions</h2>
          <div class="prose">
            <p>Two angles fix the orbit plane, one more orients the ellipse within it, two numbers give its size and shape, and a last angle places the spacecraft. These are the six <b>classical orbital elements</b>:</p>
          </div>
          <div class="scroll-x" style="max-width:52rem"><table class="data">
            <thead><tr><th>Element</th><th>Symbol</th><th>Describes</th><th>Apollo 11 parking orbit</th></tr></thead>
            <tbody>
              <tr><td>Semi-major axis</td><td>a</td><td>size (energy)</td><td>≈ 6 563 km</td></tr>
              <tr><td>Eccentricity</td><td>e</td><td>shape</td><td>≈ 0.0006</td></tr>
              <tr><td>Inclination</td><td>i</td><td>tilt of the plane relative to the equator</td><td>32.5°</td></tr>
              <tr><td>Right ascension of ascending node</td><td>Ω</td><td>swivel of the plane</td><td>set by launch time and azimuth</td></tr>
              <tr><td>Argument of periapsis</td><td>ω</td><td>orientation of the ellipse in its plane</td><td>poorly defined for e ≈ 0</td></tr>
              <tr><td>True anomaly</td><td>ν</td><td>spacecraft position</td><td>changes continuously</td></tr>
            </tbody></table></div>
          <div class="callout history"><b>Canonical units in BMW</b>Bate, Mueller and White work in canonical units: 1 DU = Earth radius (6 378.145 km), 1 TU = 806.8 s, which makes μ = 1. They keep numbers near unity and the algebra clean. This manual stays in SI, but the book’s answers convert directly: 1 DU/TU = 7.905 km/s, the circular speed at Earth’s surface.</div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>Check yourself</h2>
          <div id="practice-slot"></div>
        </section>
        ${App.next('orbits')}`;

      mountDesigner(page.querySelector('#od'));
      Practice.embed(page.querySelector('#practice-slot'), 'orbits', 3);
    },
  });

  function solveHyperbolic(M, e) {
    let F = Math.asinh(M / e);
    for (let i = 0; i < 50; i++) {
      const d = (e * Math.sinh(F) - F - M) / (e * Math.cosh(F) - 1);
      F -= d; if (Math.abs(d) < 1e-12) break;
    }
    return F;
  }

  function mountDesigner(root) {
    let el = null, tSince = 0, warp = 600, showAreas = true;
    const presets = {
      leo: { 'od-h': 185, 'od-v': 7.793, 'od-phi': 0 },
      gto: { 'od-h': 250, 'od-v': 10.15, 'od-phi': 0 },
      molniya: { 'od-h': 600, 'od-v': 10.0, 'od-phi': 0 },
      tli: { 'od-h': 330, 'od-v': 10.84, 'od-phi': 6 },
      hyp: { 'od-h': 300, 'od-v': 12.2, 'od-phi': 0 },
    };
    const view = UI.canvas(root.querySelector('#od-cv'), null);

    const fmts = { 'od-h': (x) => UI.fmt(x, 0), 'od-v': (x) => x.toFixed(3), 'od-phi': (x) => x.toFixed(1), 'od-warp': (x) => '×' + UI.fmt(Math.pow(10, x), 0) };
    const ctl = UI.bindControls(root, fmts, (v, src) => {
      warp = Math.pow(10, v['od-warp']);
      showAreas = v['od-areas'];
      if (src === 'od-warp' || src === 'od-areas') return;
      const r = C.RE + v['od-h'] * 1000;
      el = Phys.elementsFromRV(r, v['od-v'] * 1000, v['od-phi'] * Math.PI / 180, C.muE);
      el.r0 = r;
      // time since periapsis at burnout
      if (el.e < 1) tSince = Phys.timeSincePeriapsis(el.nu, el.e, el.a, C.muE);
      else {
        const F = 2 * Math.atanh(Math.sqrt((el.e - 1) / (el.e + 1)) * Math.tan(el.nu / 2));
        tSince = (el.e * Math.sinh(F) - F) / Math.sqrt(C.muE / Math.pow(-el.a, 3));
      }
      const b = root.querySelector('#od-badge');
      const kind = el.e < 0.001 ? 'Circle' : el.e < 1 ? 'Ellipse' : el.e < 1.001 ? 'Parabola' : 'Hyperbola';
      b.textContent = el.rp < C.RE ? kind + ' · hits Earth' : kind;
      b.className = 'badge ' + (el.rp < C.RE ? 'bad' : el.e >= 1 ? 'warn' : 'good');
    });
    root.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const p = presets[b.dataset.p];
      for (const k in p) ctl.set(k, p[k]);
      ctl.update();
    }));

    // state on the conic at time t since periapsis
    function stateAt(t) {
      const { e, a } = el;
      let nu, E = null;
      if (e < 1) {
        const n = Math.sqrt(C.muE / (a * a * a));
        E = Phys.solveKepler(n * t, e);
        nu = Phys.trueFromEcc(E, e);
      } else {
        const n = Math.sqrt(C.muE / Math.pow(-a, 3));
        const F = solveHyperbolic(n * t, e);
        nu = 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(F / 2));
      }
      const r = el.p / (1 + e * Math.cos(nu));
      const v = Math.sqrt(C.muE * (2 / r - (isFinite(a) ? 1 / a : 0)));
      const phi = Math.atan2(e * Math.sin(nu), 1 + e * Math.cos(nu));
      return { nu, E, r, v, phi };
    }

    view.draw = (ctx, w, h) => {
      if (!el) return;
      const T = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, T);
      const { e, p, a } = el;
      const hyper = e >= 1;
      // extent: ellipse fits; hyperbola shows ~4 burnout radii
      let xmin, xmax, ymax;
      if (!hyper) { xmin = -el.ra; xmax = el.rp; ymax = a * Math.sqrt(1 - e * e); }
      else { const R = Math.max(el.r0 * 4, el.rp * 6); xmin = -R; xmax = el.rp * 1.2; ymax = R * 0.8; }
      const sx = (w - 60) / (xmax - xmin), sy = (h - 60) / (2 * ymax), s = Math.min(sx, sy, (Math.min(w, h) - 40) / (2 * C.RE * 1.4));
      const cx = w / 2 - ((xmax + xmin) / 2) * s, cy = h / 2;
      const P = (r, nu) => [cx + r * Math.cos(nu) * s, cy - r * Math.sin(nu) * s];
      // equal-area sectors
      if (showAreas && !hyper && el.rp > C.RE) {
        const N = 12;
        for (let k = 0; k < N; k++) {
          const t0 = el.T * k / N, t1 = el.T * (k + 1) / N;
          ctx.beginPath(); ctx.moveTo(cx, cy);
          for (let j = 0; j <= 24; j++) { const st = stateAt(t0 + (t1 - t0) * j / 24); const [x, y] = P(st.r, st.nu); ctx.lineTo(x, y); }
          ctx.closePath();
          ctx.fillStyle = k % 2 ? T.trace : T.accent; ctx.globalAlpha = 0.09; ctx.fill(); ctx.globalAlpha = 1;
        }
      }
      // conic
      ctx.strokeStyle = T.trace; ctx.lineWidth = 2; ctx.beginPath();
      const lim = hyper ? Math.acos(-1 / e) - 0.02 : Math.PI;
      let first = true;
      for (let i = 0; i <= 720; i++) {
        const nu = -lim + 2 * lim * i / 720, r = p / (1 + e * Math.cos(nu));
        if (r * s > 4 * Math.max(w, h)) { first = true; continue; }
        const [x, y] = P(r, nu); first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false;
      }
      ctx.stroke();
      // apse line, centre and empty focus
      ctx.strokeStyle = T.line; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); const [px, py] = P(el.rp, 0); ctx.moveTo(px, py);
      if (!hyper) { const [ax, ay] = P(el.ra, Math.PI); ctx.lineTo(ax, ay); } else ctx.lineTo(cx - (xmax - xmin) * s, cy);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.font = `10px ${T.mono}`; ctx.fillStyle = T.muted; ctx.textAlign = 'center';
      if (!hyper && e > 0.02) {
        const c = a * e, [fx, fy] = P(2 * c, Math.PI), [ccx, ccy] = P(c, Math.PI);
        ctx.strokeStyle = T.muted; ctx.beginPath(); ctx.arc(fx, fy, 3, 0, 7); ctx.stroke();
        ctx.fillText('empty focus', fx, fy - 8);
        ctx.fillRect(ccx - 1.5, ccy - 1.5, 3, 3); ctx.fillText('centre', ccx, ccy + 14);
        const [ax, ay] = P(el.ra, Math.PI); ctx.fillText('apogee', ax, ay - 8);
      }
      ctx.fillText('perigee', px, py - 8);
      UI.drawEarth(ctx, cx, cy, C.RE * s, T);
      // burnout point
      const [bx, by] = P(el.r0, el.nu);
      ctx.strokeStyle = T.ink; ctx.beginPath(); ctx.arc(bx, by, 4, 0, 7); ctx.stroke();
      ctx.fillStyle = T.muted; ctx.textAlign = 'left'; ctx.fillText('burnout', bx + 7, by + 3);
      // spacecraft
      const st = stateAt(tSince);
      const [x, y] = P(st.r, st.nu);
      ctx.strokeStyle = T.muted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
      // velocity vector: direction = nu + 90° − phi
      const dir = st.nu + Math.PI / 2 - st.phi, L = 18 + st.v / 400;
      UI.arrow(ctx, x, y, x + L * Math.cos(dir), y - L * Math.sin(dir), T.accent, 2);
      ctx.fillStyle = T.accent; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill();
      // readout
      const km = (m) => UI.fmt(m / 1000, 0);
      root.querySelector('#od-ro').innerHTML = `
        <dt>Energy ε</dt><dd>${UI.fmt(el.eps / 1e6, 3)} MJ/kg</dd>
        <dt>Ang. momentum h</dt><dd>${UI.fmt(el.h / 1e6, 2)} km²/s</dd>
        <dt>Semi-major axis a</dt><dd>${isFinite(a) ? km(a) + ' km' : '∞'}</dd>
        <dt>Eccentricity e</dt><dd class="hl">${UI.fmt(e, 4)}</dd>
        <dt>Perigee altitude</dt><dd>${km(el.rp - C.RE)} km</dd>
        <dt>Apogee altitude</dt><dd>${hyper ? '∞' : km(el.ra - C.RE) + ' km'}</dd>
        <dt>Period T</dt><dd>${hyper ? '—' : UI.fmtTime(el.T)}</dd>
        <dt class="sub">Now</dt>
        <dt>Time since perigee</dt><dd>${UI.fmtTime(tSince)}</dd>
        <dt>True anomaly ν</dt><dd>${UI.fmt(((st.nu * 180 / Math.PI) + 360) % 360, 1)}°</dd>
        ${st.E != null ? `<dt>Eccentric anomaly E</dt><dd>${UI.fmt(((st.E * 180 / Math.PI) % 360 + 360) % 360, 1)}°</dd>` : ''}
        <dt>Radius r</dt><dd>${km(st.r)} km</dd>
        <dt>Speed v (vis-viva)</dt><dd class="hl">${UI.fmt(st.v / 1000, 3)} km/s</dd>
        <dt>Flight-path angle φ</dt><dd>${UI.fmt(st.phi * 180 / Math.PI, 1)}°</dd>`;
      root.querySelector('#od-ov').innerHTML = `orange arrow: velocity<br>${showAreas && !hyper ? 'each shaded sector takes T/12' : ''}`;
    };

    let acc = 0;
    UI.loop((dt) => {
      if (!el) return;
      tSince += dt * warp;
      if (el.e < 1) tSince %= el.T;
      else if (stateAt(tSince).r > 8 * el.r0) tSince = -tSince;   // replay the flyby from the inbound leg
      acc += dt;
      if (acc > 1 / 30) { view.redraw(); acc = 0; }
    });
    ctl.update();
  }
})();
