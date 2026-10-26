/* Chapter 2 — The two-body problem, conic sections, Kepler's laws, time of flight. Lab: orbit designer. */
(function () {
  'use strict';
  const { C } = Phys;

  App.chapter({
    id: 'orbits', phase: N`Coast`, title: N`Describing Orbits`, lab: N`Orbit designer`,
    blurb: N`Two conserved quantities, energy and angular momentum, fix every orbit. Kepler’s equation tells you where you are on it.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module TM-2 · Coast`,
          title: T`Describing Orbits`,
          lede: T`The two-body equation has an exact solution: the conic sections. Energy fixes the orbit’s size, angular momentum its shape, and Kepler’s equation gives the position at any time.`,
          refs: [T`Sellers · Understanding Orbits; Describing Orbits`, T`BMW ch. 1 Two-Body Orbital Mechanics`, T`BMW ch. 2 & 4 Elements; Position vs Time`],
        })}
        ${Progress.briefing('orbits', { theory: 'theory', lab: 'od', math: 'refresher', mathLabel: N`Vectors, trigonometry, ellipses and iteration.` })}

        <section class="section" id="theory">
          <h2><span class="idx">2.1</span>${T`Two constants of motion`}</h2>
          <div class="prose">
            <p>${T`Gravity is a conservative central force, so two quantities stay fixed along any coasting trajectory. Dot the two-body equation with \\(\\dot{\\vec r}\\) and you get the <b>specific mechanical energy</b> (energy per kilogram):`}</p>
            <div class="eq">\\[ \\varepsilon = \\frac{v^2}{2} - \\frac{\\mu}{r} = ${T`\\text{constant}`} \\]</div>
            ${Sym.where(['eps', 'v', 'mu', 'r'], N`Like a ball on a slope: going down (smaller r) it gains speed, going up it slows, and the total stays the same.`)}
            <p>${T`Cross it with \\(\\vec r\\) and you get the <b>specific angular momentum</b>, a vector perpendicular to the orbital plane. The plane therefore never changes:`}</p>
            <div class="eq">\\[ \\vec h = \\vec r \\times \\vec v, \\qquad h = r\\,v\\cos\\phi \\]</div>
            ${Sym.where(['vech', 'vecr', 'vecv', 'cross', 'h', 'phi'])}
            ${Primer.box('vectors', false, 'refresher') + Primer.box('trig')}
            <p>${T`Here \\(\\phi\\) is the <b>flight-path angle</b>, measured from the local horizontal to the velocity vector. It is zero at periapsis and apoapsis.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">2.2</span>${T`The trajectory equation`}</h2>
          <div class="prose">
            <p>${T`Integrating the equation of motion once more (BMW §1.5) gives the shape of every possible path, the polar equation of a conic with the central body at one focus:`}</p>
            <div class="eq">\\[ r = \\frac{p}{1 + e\\cos\\nu}, \\qquad p = \\frac{h^2}{\\mu} = a(1-e^2) \\]</div>
            ${Sym.where(['r', 'p', 'e', 'nu', 'h', 'mu', 'a'], N`With ν = 0 (periapsis) you get the smallest r; with ν = 180° (apoapsis) the largest.`)}
            ${Primer.box('ellipse')}
            <p>${T`\\(\\nu\\) is the <b>true anomaly</b>, the angle from periapsis to the spacecraft. The eccentricity \\(e\\) selects the conic, and the energy sign tells you which kind you are on:`}</p>
          </div>
          <div class="scroll-x" style="max-width:52rem"><table class="data">
            <thead><tr><th>${T`Conic`}</th><th>${T`Eccentricity`}</th><th>${T`Energy ε`}</th><th>${T`Semi-major axis`}</th><th>${T`Example`}</th></tr></thead>
            <tbody>
              <tr><td>${T`Circle`}</td><td>e = 0</td><td>< 0</td><td>a = r</td><td>${T`Apollo parking orbit, 185 km`}</td></tr>
              <tr><td>${T`Ellipse`}</td><td>0 < e < 1</td><td>< 0</td><td>a > 0</td><td>${T`Trans-lunar coast (two-body view)`}</td></tr>
              <tr><td>${T`Parabola`}</td><td>e = 1</td><td>= 0</td><td>a = ∞</td><td>${T`Exactly escape velocity`}</td></tr>
              <tr><td>${T`Hyperbola`}</td><td>e > 1</td><td>> 0</td><td>a < 0</td><td>${T`Path relative to the Moon on arrival`}</td></tr>
            </tbody></table></div>
          <div class="prose">
            <p>${T`Energy depends only on the semi-major axis, \\(\\varepsilon = -\\mu/2a\\). Combine that with the definition of \\(\\varepsilon\\) and you get the most useful equation in astrodynamics, the <b>vis-viva</b> (energy) equation:`}</p>
            <div class="eq">\\[ v = \\sqrt{\\mu\\left(\\frac{2}{r} - \\frac{1}{a}\\right)} \\]</div>
            ${Sym.where(['v', 'mu', 'r', 'a'], N`Know where you are (r) and which orbit you are on (a), and you know your speed.`)}
            <p>${T`The apsides follow from the geometry: \\(r_p = a(1-e)\\), \\(r_a = a(1+e)\\), and \\(e = (r_a - r_p)/(r_a + r_p)\\).`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">2.3</span>${T`Kepler’s laws, derived`}</h2>
          <div class="prose">
            <p>${T`Kepler found three laws in Tycho Brahe’s observations of Mars (1609–1619). Newton showed that they follow from his own laws:`}</p>
            <ol>
              <li>${T`<b>Orbits are ellipses</b> with the central body at one focus. This is the bound case of the trajectory equation.`}</li>
              <li>${T`<b>Equal areas in equal times.</b> The area swept per unit time is \\(dA/dt = h/2\\), constant because \\(h\\) is conserved. Turn on the sectors in the lab below and watch the spacecraft speed up near periapsis.`}</li>
              <li>${T`<b>Period</b> depends only on the semi-major axis: \\(T = 2\\pi\\sqrt{a^3/\\mu}\\).`}</li>
            </ol>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">2.4</span>${T`Lab: design an orbit from a burnout state`}</h2>
          <div class="prose"><p>${T`A launch vehicle hands its payload over at <b>burnout</b>: an altitude, a speed and a flight-path angle. From those three numbers the energy and angular momentum, and therefore the whole orbit, are fixed (Sellers works through this in <i>Describing Orbits</i>). Change them and the orbit redraws; the satellite moves according to Kepler’s equation.`}</p></div>
          <div class="lab" id="od">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Orbit designer`}</h3><span class="spacer"></span>
              <div class="btn-row">
                <button class="btn" data-p="leo">${T`Parking orbit`}</button>
                <button class="btn" data-p="gto">GTO</button>
                <button class="btn" data-p="molniya">${T`Molniya-like`}</button>
                <button class="btn" data-p="tli">${T`After TLI`}</button>
                <button class="btn" data-p="hyp">${T`Hyperbolic`}</button>
              </div></div>
            <div class="stage" style="min-height:480px"><canvas id="od-cv" aria-label="${T`Orbit drawing with Earth at the focus`}"></canvas><div class="overlay" id="od-ov"></div><div class="badge" id="od-badge"></div></div>
            <div class="controls">
              ${UI.slider({ id: 'od-h', label: T`Burnout altitude`, min: 100, max: 20000, step: 5, value: 300, unit: 'km' })}
              ${UI.slider({ id: 'od-v', label: T`Burnout speed`, min: 4, max: 13, step: 0.005, value: 9.2, unit: 'km/s' })}
              ${UI.slider({ id: 'od-phi', label: T`Flight-path angle φ`, min: -60, max: 60, step: 0.5, value: 5, unit: '°' })}
              ${UI.slider({ id: 'od-warp', label: T`Time warp`, min: 1, max: 4, step: 0.05, value: 2.8 })}
              <label class="mono note" style="display:flex;gap:.5rem;align-items:center"><input type="checkbox" id="od-areas" checked> ${T`Equal-area sectors (T/12 each)`}</label>
              <dl class="readout" id="od-ro"></dl>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">2.5</span>${T`Where will it be? Kepler’s equation`}</h2>
          <div class="prose">
            <p>${T`Sooner or later every mission must answer the question “where will the spacecraft be at time \\(t\\)?” The angle \\(\\nu\\) does not grow uniformly with time, so Kepler introduced two auxiliary angles. The <b>eccentric anomaly</b> \\(E\\) is measured at the centre of the ellipse, on an auxiliary circle of radius \\(a\\). The <b>mean anomaly</b> \\(M\\) does grow uniformly, at the mean motion \\(n\\):`}</p>
            <div class="eq">\\[ n = \\sqrt{\\frac{\\mu}{a^3}}, \\qquad M = n\\,(t - t_p) = E - e\\sin E \\]</div>
            ${Sym.where(['n', 'a', 'mu', 'Mm', 't', 'tp', 'E', 'e'])}
            <div class="eq">\\[ \\tan\\frac{\\nu}{2} = \\sqrt{\\frac{1+e}{1-e}}\\;\\tan\\frac{E}{2} \\]</div>
            ${Sym.where(['nu', 'E', 'e', 'tan'], N`This converts the helper angle E into the real position angle ν.`)}
            ${Primer.box('iteration')}
            <p>${T`Going from position to time is direct. Going from time to position means solving Kepler’s equation for \\(E\\), which has no closed-form solution. Newton’s iteration \\(E_{k+1} = E_k - (E_k - e\\sin E_k - M)/(1 - e\\cos E_k)\\) converges in a few steps; that is what the lab above runs on every frame. BMW chapter 4 develops the universal-variable form that also covers parabolas and hyperbolas. The Apollo Guidance Computer used that approach (Battin’s formulation) in its conic routines.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">2.6</span>${T`Orbital elements in three dimensions`}</h2>
          <div class="prose">
            <p>${T`Two angles fix the orbit plane, one more orients the ellipse within it, two numbers give its size and shape, and a last angle places the spacecraft. These are the six <b>classical orbital elements</b>:`}</p>
          </div>
          <div class="scroll-x" style="max-width:52rem"><table class="data">
            <thead><tr><th>${T`Element`}</th><th>${T`Symbol`}</th><th>${T`Describes`}</th><th>${T`Apollo 11 parking orbit`}</th></tr></thead>
            <tbody>
              <tr><td>${T`Semi-major axis`}</td><td>a</td><td>${T`size (energy)`}</td><td>≈ 6 563 km</td></tr>
              <tr><td>${T`Eccentricity`}</td><td>e</td><td>${T`shape`}</td><td>${UI.dec('≈ 0.0006')}</td></tr>
              <tr><td>${T`Inclination`}</td><td>i</td><td>${T`tilt of the plane relative to the equator`}</td><td>${UI.dec('32.5°')}</td></tr>
              <tr><td>${T`Right ascension of ascending node`}</td><td>Ω</td><td>${T`swivel of the plane`}</td><td>${T`set by launch time and azimuth`}</td></tr>
              <tr><td>${T`Argument of periapsis`}</td><td>ω</td><td>${T`orientation of the ellipse in its plane`}</td><td>${T`poorly defined for e ≈ 0`}</td></tr>
              <tr><td>${T`True anomaly`}</td><td>ν</td><td>${T`spacecraft position`}</td><td>${T`changes continuously`}</td></tr>
            </tbody></table></div>
          <div class="callout history"><b>${T`Canonical units in BMW`}</b>${T`Bate, Mueller and White work in canonical units: 1 DU = Earth radius (6 378.145 km), 1 TU = 806.8 s, which makes μ = 1. They keep numbers near unity and the algebra clean. This manual stays in SI, but the book’s answers convert directly: 1 DU/TU = 7.905 km/s, the circular speed at Earth’s surface.`}</div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('orbits', { math: 'ellipse', mathLabel: N`Ellipses, trigonometry, iteration.` })}`;

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
      const kind = el.e < 0.001 ? T`Circle` : el.e < 1 ? T`Ellipse` : el.e < 1.001 ? T`Parabola` : T`Hyperbola`;
      b.textContent = el.rp < C.RE ? T`${kind} · hits Earth` : kind;
      if (src && el.rp - C.RE > 100e3) {          // designed by hand with the sliders
        if (el.e < 0.01) Progress.done('orbits', 'circle');
        if (el.e < 1 && el.ra - C.RE >= 35786e3) Progress.done('orbits', 'high');
      }
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
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, K);
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
          ctx.fillStyle = k % 2 ? K.trace : K.accent; ctx.globalAlpha = 0.09; ctx.fill(); ctx.globalAlpha = 1;
        }
      }
      // conic
      ctx.strokeStyle = K.trace; ctx.lineWidth = 2; ctx.beginPath();
      const lim = hyper ? Math.acos(-1 / e) - 0.02 : Math.PI;
      let first = true;
      for (let i = 0; i <= 720; i++) {
        const nu = -lim + 2 * lim * i / 720, r = p / (1 + e * Math.cos(nu));
        if (r * s > 4 * Math.max(w, h)) { first = true; continue; }
        const [x, y] = P(r, nu); first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false;
      }
      ctx.stroke();
      // apse line, centre and empty focus
      ctx.strokeStyle = K.line; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); const [px, py] = P(el.rp, 0); ctx.moveTo(px, py);
      if (!hyper) { const [ax, ay] = P(el.ra, Math.PI); ctx.lineTo(ax, ay); } else ctx.lineTo(cx - (xmax - xmin) * s, cy);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.font = `10px ${K.mono}`; ctx.fillStyle = K.muted; ctx.textAlign = 'center';
      if (!hyper && e > 0.02) {
        const c = a * e, [fx, fy] = P(2 * c, Math.PI), [ccx, ccy] = P(c, Math.PI);
        ctx.strokeStyle = K.muted; ctx.beginPath(); ctx.arc(fx, fy, 3, 0, 7); ctx.stroke();
        ctx.fillText(T`empty focus`, fx, fy - 8);
        ctx.fillRect(ccx - 1.5, ccy - 1.5, 3, 3); ctx.fillText(T`centre`, ccx, ccy + 14);
        const [ax, ay] = P(el.ra, Math.PI); ctx.fillText(T`apogee`, ax, ay - 8);
      }
      ctx.fillText(T`perigee`, px, py - 8);
      UI.drawEarth(ctx, cx, cy, C.RE * s, K);
      // burnout point
      const [bx, by] = P(el.r0, el.nu);
      ctx.strokeStyle = K.ink; ctx.beginPath(); ctx.arc(bx, by, 4, 0, 7); ctx.stroke();
      ctx.fillStyle = K.muted; ctx.textAlign = 'left'; ctx.fillText(T`burnout`, bx + 7, by + 3);
      // spacecraft
      const st = stateAt(tSince);
      const [x, y] = P(st.r, st.nu);
      ctx.strokeStyle = K.muted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
      // velocity vector: direction = nu + 90° − phi
      const dir = st.nu + Math.PI / 2 - st.phi, L = 18 + st.v / 400;
      UI.arrow(ctx, x, y, x + L * Math.cos(dir), y - L * Math.sin(dir), K.accent, 2);
      ctx.fillStyle = K.accent; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill();
      // readout
      const km = (m) => UI.fmt(m / 1000, 0);
      root.querySelector('#od-ro').innerHTML = `
        <dt>${T`Energy ε`}</dt><dd>${UI.fmt(el.eps / 1e6, 3)} MJ/kg</dd>
        <dt>${T`Ang. momentum h`}</dt><dd>${UI.fmt(el.h / 1e6, 2)} km²/s</dd>
        <dt>${T`Semi-major axis a`}</dt><dd>${isFinite(a) ? km(a) + ' km' : '∞'}</dd>
        <dt>${T`Eccentricity e`}</dt><dd class="hl">${UI.fmt(e, 4)}</dd>
        <dt>${T`Perigee altitude`}</dt><dd>${km(el.rp - C.RE)} km</dd>
        <dt>${T`Apogee altitude`}</dt><dd>${hyper ? '∞' : km(el.ra - C.RE) + ' km'}</dd>
        <dt>${T`Period T`}</dt><dd>${hyper ? '—' : UI.fmtTime(el.T)}</dd>
        <dt class="sub">${T`Now`}</dt>
        <dt>${T`Time since perigee`}</dt><dd>${UI.fmtTime(tSince)}</dd>
        <dt>${T`True anomaly ν`}</dt><dd>${UI.fmt(((st.nu * 180 / Math.PI) + 360) % 360, 1)}°</dd>
        ${st.E != null ? `<dt>${T`Eccentric anomaly E`}</dt><dd>${UI.fmt(((st.E * 180 / Math.PI) % 360 + 360) % 360, 1)}°</dd>` : ''}
        <dt>${T`Radius r`}</dt><dd>${km(st.r)} km</dd>
        <dt>${T`Speed v (vis-viva)`}</dt><dd class="hl">${UI.fmt(st.v / 1000, 3)} km/s</dd>
        <dt>${T`Flight-path angle φ`}</dt><dd>${UI.fmt(st.phi * 180 / Math.PI, 1)}°</dd>`;
      root.querySelector('#od-ov').innerHTML = `${T`orange arrow: velocity`}<br>${showAreas && !hyper ? T`each shaded sector takes T/12` : ''}`;
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
