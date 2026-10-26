/* Chapter 1 — Newton's laws and universal gravitation. Lab: Newton's cannon. */
(function () {
  'use strict';
  const { C } = Phys;

  App.chapter({
    id: 'newton', phase: N`Foundations`, title: N`Newton & Gravity`, lab: N`Newton's cannon`,
    blurb: N`Three laws of motion and one law of gravity. With these Newton predicted the orbit 270 years before Sputnik.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module TM-1 · Foundations`,
          title: T`Newton & Gravity`,
          lede: T`Isaac Newton published the physics of spaceflight in 1687. Every trajectory in this manual, Apollo’s included, is his second law applied to his law of gravitation.`,
          refs: [T`Sellers · Understanding Orbits`, T`BMW §1.2–1.3 The n-body and two-body problems`],
        })}
        ${Progress.briefing('newton', { theory: 'theory', lab: 'cannon', math: 'refresher', mathLabel: N`Vectors, derivatives and powers of ten.` })}

        <section class="section" id="theory">
          <h2><span class="idx">1.1</span>${T`The three laws of motion`}</h2>
          <div class="prose">
            <p>${T`<b>First law, inertia.</b> A body keeps its velocity, constant speed in a straight line, unless an external force acts on it. A spacecraft coasting between Earth and Moon needs no engine to keep moving. It needs an engine only to <i>change</i> its motion.`}</p>
            <p>${T`<b>Second law.</b> The rate of change of momentum equals the applied force:`}</p>
            <div class="eq">\\[ \\vec F = \\frac{d}{dt}\\left(m\\vec v\\right) \\quad\\Longrightarrow\\quad \\vec F = m\\,\\vec a \\;\\; ${T`\\text{(constant mass)}`} \\]</div>
            ${Sym.where(['vecF', 'ddt', 'm', 'vecv', 'veca'], N`Read it as: force = mass × acceleration. Push twice as hard and a body speeds up twice as fast.`)}
            ${Primer.box('vectors', false, 'refresher') + Primer.box('derivative')}
            <p>${T`A rocket's mass is <i>not</i> constant; it throws away about 13 tonnes of propellant every second at liftoff. Working this law with changing mass gives the rocket equation (Phase 3).`}</p>
            <p>${T`<b>Third law, action and reaction.</b> When the engine pushes exhaust backward, the exhaust pushes the engine forward with an equal and opposite force. A rocket needs no air to push against, which is why it works in a vacuum.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">1.2</span>${T`Universal gravitation`}</h2>
          <div class="prose">
            <p>${T`Any two masses attract each other along the line joining them, with a force proportional to both masses and inversely proportional to the square of their distance:`}</p>
            <div class="eq">\\[ F_g = \\frac{G\\,M\\,m}{r^2}, \\qquad G = 6.674\\times10^{-11}\\ \\mathrm{N\\,m^2\\,kg^{-2}} \\]</div>
            ${Sym.where(['Fg', 'G', 'M', 'm', 'r'], N`Double the distance and the pull drops to a quarter (inverse square).`)}
            ${Primer.box('powers')}
            <p>${T`Astrodynamicists rarely use \\(G\\) and \\(M\\) separately. The product, the <b>gravitational parameter</b> \\(\\mu = GM\\), is known far more precisely from tracking spacecraft. For Earth, \\(\\mu_\\oplus = 3.986\\,004\\times10^{14}\\ \\mathrm{m^3/s^2}\\). The gravitational acceleration at distance \\(r\\) from the centre is then`}</p>
            <div class="eq">\\[ g(r) = \\frac{\\mu}{r^2} = g_0\\left(\\frac{R_\\oplus}{r}\\right)^2, \\qquad g_0 = 9.806\\,65\\ \\mathrm{m/s^2} \\]</div>
            ${Sym.where(['gr', 'mu', 'r', 'g0', 'RE'])}
            <div class="callout"><b>${T`Weightless, not gravity-free`}</b>${T`At the International Space Station's altitude of 400 km, \\(g\\) is still 8.7 m/s², 89% of its surface value. Astronauts float because they and their station fall together. Orbiting is falling while moving sideways fast enough that the ground curves away beneath you.`}</div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">1.3</span>${T`Newton’s cannon`}</h2>
          <div class="prose">
            <p>${T`In <i>A Treatise of the System of the World</i>, Newton imagined a cannon on a very tall mountain firing horizontally. The faster the shot, the farther it lands, until at one particular speed the ground curves away exactly as fast as the shot falls. That speed is the <b>circular orbital velocity</b>. Gravity supplies exactly the centripetal acceleration of a circle:`}</p>
            <div class="eq">\\[ \\frac{\\mu}{r^2} = \\frac{v^2}{r} \\quad\\Longrightarrow\\quad v_{\\text{circ}} = \\sqrt{\\frac{\\mu}{r}} \\]</div>
            ${Sym.where(['mu', 'r', 'v', 'vcirc'], N`Left side: the pull of gravity per kilogram. Right side: the acceleration needed to move in a circle of radius r at speed v. Set them equal and solve for v.`)}
            <p>${T`Faster still, the path becomes an ellipse. At \\(\\sqrt2\\) times circular speed the shot never returns: it has reached <b>escape velocity</b>, where kinetic energy matches the depth of the gravity well.`}</p>
            <div class="eq">\\[ \\tfrac12 v_{\\text{esc}}^2 - \\frac{\\mu}{r} = 0 \\quad\\Longrightarrow\\quad v_{\\text{esc}} = \\sqrt{\\frac{2\\mu}{r}} \\]</div>
            ${Sym.where(['ke', 'pe', 'vesc'], N`Escape means just enough kinetic energy to climb out of the gravity well, so the total energy is zero.`)}
            <p>${T`Try it below. Find the speed that gives a circle, then the speed that escapes. Notice that every shot fired horizontally passes back through the cannon's position if it misses the Earth.`}</p>
          </div>
          <div class="lab" id="cannon">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Newton’s cannon`}</h3><span class="spacer"></span>
              <div class="btn-row"><button class="btn" data-v="7.85" data-kind="circular">${T`Circular`}</button><button class="btn" data-v="11.1" data-kind="escape">${T`Escape`}</button><button class="btn" id="cn-clear">${T`Clear traces`}</button><button class="btn primary" id="cn-fire">${T`Fire ▸`}</button></div></div>
            <div class="stage" style="min-height:440px"><canvas id="cn-cv" aria-label="${T`Earth with a cannon on a mountain and the trajectory of the shot`}"></canvas><div class="overlay" id="cn-ov"></div><div class="badge" id="cn-badge"></div></div>
            <div class="controls">
              ${UI.slider({ id: 'cn-v', label: T`Muzzle speed`, min: 0, max: 12.5, step: 0.05, value: 7.2, unit: 'km/s' })}
              ${UI.slider({ id: 'cn-h', label: T`Mountain height`, min: 0, max: 3000, step: 10, value: 300, unit: 'km' })}
              ${UI.slider({ id: 'cn-a', label: T`Elevation angle`, min: -20, max: 60, step: 0.5, value: 0, unit: '°' })}
              <dl class="readout" id="cn-ro"></dl>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">1.4</span>${T`From Newton to the two-body equation`}</h2>
          <div class="prose">
            <p>${T`Combine the second law with gravitation for a small body \\(m\\) near a large one \\(M\\). Bate, Mueller and White (§1.3) show that if the bodies are spherically symmetric, no other forces act and \\(m \\ll M\\), the motion of \\(m\\) relative to \\(M\\) obeys`}</p>
            <div class="eq">\\[ \\ddot{\\vec r} + \\frac{\\mu}{r^3}\\,\\vec r = \\vec 0 \\]</div>
            ${Sym.where(['rddot', 'vecr', 'r', 'mu'], N`Read it as: acceleration = μ/r² pointing back toward the planet’s centre. (μ/r³ times the vector r⃗, whose length is r, gives a length of μ/r².)`)}
            <p>${T`This is the <b>two-body equation of motion</b>, the starting point of Phase 2. A sphere's gravity acts as if all its mass sat at the centre; Newton proved this shell theorem and needed calculus, which he invented, to do it. Real missions add perturbations: Earth's oblateness (\\(J_2\\)), the Sun and Moon, drag, solar pressure. Two-body motion still describes the trajectory to better than a percent most of the time.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('newton', { math: 'vectors', mathLabel: N`Vectors, derivatives, powers of ten.` })}`;

      mountCannon(page.querySelector('#cannon'));
      Practice.embed(page.querySelector('#practice-slot'), 'newton', 3);
    },
  });

  function mountCannon(root) {
    const traces = [];
    let shot = null;          // {pts:[[x,y]], i}
    let preview = [];
    let info = null;
    const view = UI.canvas(root.querySelector('#cn-cv'), null);

    // Analytic conic from the launch state: polar angle of launch = 90° (top of Earth), moving toward +x (clockwise on screen).
    function compute(v) {
      const r0 = C.RE + v['cn-h'] * 1000, spd = v['cn-v'] * 1000, phi = v['cn-a'] * Math.PI / 180;
      const el = Phys.elementsFromRV(r0, Math.max(spd, 1e-3), phi, C.muE);
      // numerical integration gives the timed path for animation (RK4, 2D Cartesian)
      let y = [0, r0, spd * Math.cos(phi), spd * Math.sin(phi)];
      const f = (t, s) => { const r3 = Math.pow(s[0] * s[0] + s[1] * s[1], 1.5); return [s[2], s[3], -C.muE * s[0] / r3, -C.muE * s[1] / r3]; };
      const pts = [[y[0], y[1], 0]];
      let t = 0, ang = 0, prevA = Math.atan2(y[0], y[1]), outcome = 'orbit', impactT = null;
      const tMax = el.e < 1 ? Math.min(el.T * 1.001, 3 * 86400) : 2 * 86400;
      while (t < tMax) {
        const r = Math.hypot(y[0], y[1]);
        const dt = Math.max(1, 0.01 * Math.pow(r, 1.5) / Math.sqrt(C.muE));
        y = Phys.rk4(f, t, y, dt); t += dt;
        const a = Math.atan2(y[0], y[1]);
        let da = a - prevA; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
        ang += da; prevA = a;
        pts.push([y[0], y[1], t]);
        if (Math.hypot(y[0], y[1]) < C.RE) { outcome = 'impact'; impactT = t; break; }
        if (Math.hypot(y[0], y[1]) > 60 * C.RE) { outcome = 'escape'; break; }
        if (Math.abs(ang) >= 2 * Math.PI) break;
      }
      if (outcome === 'orbit' && el.e >= 1) outcome = 'escape';
      if (outcome === 'orbit' && el.rp < C.RE) outcome = 'impact';
      return { el, pts, outcome, impactT, range: Math.abs(ang) * C.RE, r0, spd, vc: Math.sqrt(C.muE / r0), ve: Math.sqrt(2 * C.muE / r0) };
    }

    const fmts = { 'cn-v': (x) => x.toFixed(2), 'cn-h': (x) => x.toFixed(0), 'cn-a': (x) => x.toFixed(1) };
    const ctl = UI.bindControls(root, fmts, (v) => { info = compute(v); preview = info.pts; renderInfo(); view.redraw(); });

    function renderInfo() {
      const { el, outcome, r0, spd, vc, ve } = info;
      const type = outcome === 'impact' ? T`Suborbital` : el.e >= 1 ? (Math.abs(el.e - 1) < 0.005 ? T`Parabolic` : T`Hyperbolic`)
        : el.e < 0.005 ? T`Circular orbit` : T`Elliptical orbit`;
      const b = root.querySelector('#cn-badge');
      b.textContent = type;
      b.className = 'badge ' + (outcome === 'impact' ? 'bad' : el.e >= 1 ? 'warn' : 'good');
      const km = (m) => UI.fmt(m / 1000, 0);
      root.querySelector('#cn-ro').innerHTML = `
        <dt>${T`Speed v`}</dt><dd class="hl">${UI.fmt(spd / 1000, 3)} km/s</dd>
        <dt>${T`Circular v<sub>c</sub> = √(μ/r)`}</dt><dd>${UI.fmt(vc / 1000, 3)} km/s</dd>
        <dt>${T`Escape v<sub>esc</sub> = √(2μ/r)`}</dt><dd>${UI.fmt(ve / 1000, 3)} km/s</dd>
        <dt>${T`g at muzzle`}</dt><dd>${UI.fmt(C.muE / (r0 * r0), 2)} m/s²</dd>
        <dt class="sub">${T`Resulting path`}</dt>
        <dt>${T`Energy ε = v²/2 − μ/r`}</dt><dd>${UI.fmt(el.eps / 1e6, 2)} MJ/kg</dd>
        <dt>${T`Eccentricity e`}</dt><dd>${UI.fmt(el.e, 4)}</dd>
        <dt>${T`Perigee altitude`}</dt><dd>${el.rp < C.RE ? T`below surface` : km(el.rp - C.RE) + ' km'}</dd>
        <dt>${T`Apogee altitude`}</dt><dd>${el.e >= 1 ? '∞' : km(el.ra - C.RE) + ' km'}</dd>
        <dt>${outcome === 'impact' ? T`Ground range` : T`Period`}</dt><dd>${outcome === 'impact' ? km(info.range) + ' km' : el.e < 1 ? UI.fmtTime(el.T) : '—'}</dd>`;
    }

    view.draw = (ctx, w, h) => {
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, K);
      const s = Math.min(w, h * 1.15) / (2 * C.RE * 2.2);
      const cx = w / 2, cy = h / 2 + C.RE * s * 0.5;
      const P = (x, y) => [cx + x * s, cy - y * s];
      // altitude rings
      ctx.strokeStyle = K.grid; ctx.lineWidth = 1;
      for (const a of [1000e3, 5000e3, 10000e3]) { ctx.beginPath(); ctx.arc(cx, cy, (C.RE + a) * s, 0, 7); ctx.stroke(); }
      UI.drawEarth(ctx, cx, cy, C.RE * s, K);
      const drawPath = (pts, color, width, n = pts.length, dash) => {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.beginPath();
        for (let i = 0; i < n; i++) { const [x, y] = P(pts[i][0], pts[i][1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); ctx.setLineDash([]);
      };
      traces.forEach((tr, i) => { ctx.globalAlpha = 0.25 + 0.5 * (i + 1) / traces.length; drawPath(tr, K.trace, 1.4); });
      ctx.globalAlpha = 1;
      if (!shot) drawPath(preview, K.accent, 1.5, preview.length, [5, 5]);
      // mountain
      const hm = (info ? info.r0 : C.RE);
      const [mx, my] = P(0, hm), [bx1, by1] = P(-C.RE * 0.09, C.RE * 0.996), [bx2, by2] = P(C.RE * 0.09, C.RE * 0.996);
      ctx.fillStyle = K.moon; ctx.beginPath(); ctx.moveTo(bx1, by1); ctx.lineTo(mx, my); ctx.lineTo(bx2, by2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = K.ink; ctx.fillRect(mx - 6, my - 4, 12, 5);
      if (shot) {
        drawPath(shot.pts, K.accent, 2, shot.i + 1);
        const p = shot.pts[shot.i], [x, y] = P(p[0], p[1]);
        ctx.fillStyle = K.accent; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
      }
      const ov = root.querySelector('#cn-ov');
      ov.innerHTML = shot ? `t = ${UI.fmtTime(shot.pts[shot.i][2])}<br>${T`time warp ×600`}` : T`dashed: predicted path<br>rings: 1 000, 5 000, 10 000 km altitude`;
    };

    const fire = () => {
      shot = { pts: info.pts, i: 0, clock: 0 };
      if (info.outcome === 'orbit') Progress.done('newton', 'orbit');
      if (info.outcome === 'escape') Progress.done('newton', 'escape');
    };
    root.querySelector('#cn-fire').addEventListener('click', fire);
    root.querySelector('#cn-clear').addEventListener('click', () => { traces.length = 0; view.redraw(); });
    root.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => {
      const h = ctl.read()['cn-h'] * 1000, r = C.RE + h;
      const vv = b.dataset.kind === 'circular' ? Math.sqrt(C.muE / r) : Math.sqrt(2 * C.muE / r) * 1.0005;
      ctl.set('cn-v', (vv / 1000).toFixed(2)); ctl.set('cn-a', 0); ctl.update();
    }));
    UI.loop((dt) => {
      if (!shot) return;
      shot.clock += dt * 600;
      while (shot.i < shot.pts.length - 1 && shot.pts[shot.i + 1][2] <= shot.clock) shot.i++;
      if (shot.i >= shot.pts.length - 1) {
        traces.push(shot.pts); if (traces.length > 7) traces.shift();
        shot = null;
      }
      view.redraw();
    });
    ctl.update();
  }
})();
