/* Chapter 4 — Getting to orbit: gravity turn, losses, Earth's rotation. Lab: Saturn V ascent simulator. */
(function () {
  'use strict';
  const { C } = Phys;

  /* what a force does to a velocity, depending on the angle between them (inline SVG, .fig styles of js/ch/orbits.js) */
  function figForceAngle() {
    const W = 380, H = 118, y0 = 64, L = 46, F = 40, fx = (n) => n.toFixed(1);
    const pct = (x, w) => (100 * x / w).toFixed(2) + '%';
    const lbs = (list) => list.map(([x, y, t, c]) => `<span class="lb ${c || ''}" style="left:${pct(x, W)};top:${pct(y, H)}">${t}</span>`).join('');
    const arrow = (x1, y1, x2, y2, cls) => {
      const a = Math.atan2(y2 - y1, x2 - x1), h = (k) => `${fx(x2 - 9 * Math.cos(a + k))},${fx(y2 - 9 * Math.sin(a + k))}`;
      return `<path class="${cls}-ln" d="M${fx(x1)},${fx(y1)}L${fx(x2)},${fx(y2)}"/><path class="${cls}-fill" d="M${h(0.4)}L${fx(x2)},${fx(y2)}L${h(-0.4)}Z"/>`;
    };
    // a force along the velocity is drawn just above it, so the two arrows do not hide each other
    const panel = (x0, ang) => { const t = ang * Math.PI / 180, dy = ang === 0 ? -8 : 0;
      return arrow(x0, y0, x0 + L, y0, 'af-v') + arrow(x0, y0 + dy, x0 + F * Math.cos(t), y0 + dy - F * Math.sin(t), 'af-f') + `<circle class="f-ink-fill" cx="${x0}" cy="${y0}" r="3"/>`; };
    const a = 35 * Math.PI / 180, x4 = 286, fx4 = x4 + 58 * Math.cos(a), fy4 = y0 - 58 * Math.sin(a);
    return `<figure class="fig" role="img" aria-label="${T`Four cases of a force acting on a moving body. Along the velocity it speeds the body up; against the velocity it slows it down; at right angles it turns the path without changing the speed; at an angle in between, its part along the velocity changes the speed and its part across the velocity turns the path.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        ${panel(16, 0)}${panel(132, 180)}${panel(206, 90)}
        ${arrow(x4, y0, x4 + 66, y0, 'af-v')}
        <path class="f-mu f-dash" d="M${fx(fx4)},${fx(fy4)}L${fx(fx4)},${y0}"/>
        ${arrow(x4, y0, fx4, y0 + 0.01, 'af-c')}${arrow(x4, y0, x4 + 0.01, fy4, 'af-c')}
        ${arrow(x4, y0, fx4, fy4, 'af-f')}<circle class="f-ink-fill" cx="${x4}" cy="${y0}" r="3"/>
        <path class="f-ink-ln" d="M${x4 + 22},${y0}A22,22 0 0 0 ${fx(x4 + 22 * Math.cos(a))},${fx(y0 - 22 * Math.sin(a))}"/>
      </svg>${lbs([
        [16 + L + 6, y0, 'v', 'tr l'], [16 + F / 2, y0 - 20, 'F', 'acc'], [8, 104, T`speeds up`, 'm l'],
        [132 - F / 2, y0 - 12, 'F', 'acc'], [132 + L + 4, y0, 'v', 'tr l'], [130, 104, T`slows down`, 'm'],
        [206 + 9, y0 - F + 4, 'F', 'acc l'], [206 + L + 4, y0, 'v', 'tr l'], [228, 104, T`turns`, 'm'],
        [fx4 + 6, fy4 - 4, 'F', 'acc l'], [x4 + 70, y0, 'v', 'tr l'], [x4 + 30, y0 - 9, 'α', 'ink'],
        [(x4 + fx4) / 2, y0 + 12, 'F cos α', 'ink'], [x4 - 4, (y0 + fy4) / 2, 'F sin α', 'ink r'], [x4 + 33, 104, T`both`, 'm'],
      ])}</div>
      <figcaption>${T`Only the part of a force along the velocity changes the speed. The part at right angles bends the path.`}</figcaption></figure>`;
  }
  App.css('ascent', `
    .af-v-ln { fill: none; stroke: var(--trace); stroke-width: 2; } .af-v-fill { fill: var(--trace); }
    .af-f-ln { fill: none; stroke: var(--accent); stroke-width: 2.4; } .af-f-fill { fill: var(--accent); }
    .af-c-ln { fill: none; stroke: var(--ink); stroke-width: 1.4; stroke-dasharray: 3 3; } .af-c-fill { fill: var(--ink); }`);

  App.chapter({
    id: 'ascent', phase: N`Ascent`, title: N`Getting to Orbit`, lab: N`Saturn V ascent`,
    blurb: N`Fly the Saturn V into a 185 km parking orbit. Pitch over too early and drag tears you apart; too late and gravity eats your propellant.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('ascent')} · Ascent`,
          title: T`Getting to Orbit`,
          lede: T`Orbit is about speed, not height: 185 km up but 7.8 km/s sideways. The ascent is a compromise between climbing out of the air quickly and turning horizontal early.`,
          refs: [T`Sellers · Getting to Orbit`, T`BMW ch. 6 Ballistic Missile Trajectories`],
        })}
        ${Progress.briefing('ascent', { theory: 'theory', lab: 'as', math: 'refresher', mathLabel: N`Integrals and trigonometry.` })}

        <section class="section" id="theory">
          <h2><span class="idx">4.1</span>${T`The Δv budget to orbit`}</h2>
          <div class="prose">
            <p>${T`Circular speed at the Apollo parking altitude of 185 km is 7.79 km/s, yet launch vehicles must supply about 9.3–9.5 km/s. The difference is <b>losses</b>, minus a gift from Earth’s rotation:`}</p>
            <div class="eq">${T`\\[ \\Delta v_{design} = v_{orbit} + \\underbrace{\\int g\\sin\\gamma\\,dt}_{\\text{gravity loss}} + \\underbrace{\\int \\frac{D}{m}\\,dt}_{\\text{drag loss}} + \\underbrace{\\int \\frac{F}{m}(1-\\cos\\alpha)\\,dt}_{\\text{steering loss}} - v_{rotation} \\]`}</div>
            ${Sym.where([['\\Delta v_{design}', N`total velocity change the rocket must be able to deliver`, 'm/s'], 'vorbit', 'integral', 'g', 'gamma', 'D', 'm', 'Fth', 'alpha', 'vrot'], N`In words: orbital speed + what gravity steals while you climb + what the air steals + what is wasted by not pointing exactly along the path − the free speed from Earth’s spin.`)}
            ${Primer.box('integral', false, 'refresher') + Primer.box('trig')}
            <p>${T`<b>Gravity loss</b> is the thrust spent holding the vehicle up while its path is still steep (\\(\\gamma\\) is the flight-path angle). It is the largest loss, often 1.2–1.8 km/s, and it is why low thrust-to-weight rockets are inefficient. <b>Drag loss</b> is small for a big rocket, around 40 m/s for the Saturn V, but drag sets the <b>maximum dynamic pressure</b> \\(q = \\tfrac12\\rho v^2\\) that the structure must survive. <b>Steering loss</b> comes from thrust that isn’t aligned with the velocity.`}</p>
            <p>${T`Why a misaligned thrust is a loss comes down to vectors. A force pointing the same way as the velocity speeds the vehicle up. Pointing the opposite way, it slows it down. At 90° it changes neither the speed nor the energy: it only turns the path. At any angle in between it does both. Its part along the velocity, \\(F\\cos\\alpha\\), changes the speed; its part across, \\(F\\sin\\alpha\\), turns the path.`}</p>
            ${figForceAngle()}
            <p>${T`So only \\(F\\cos\\alpha\\) builds speed, and the remaining fraction \\(1-\\cos\\alpha\\) of the thrust is the steering loss. That is why it stays small: at 10° off the velocity, \\(\\cos\\alpha = 0.985\\) and only 1.5 % of the thrust is lost to turning. Gravity follows the same rule. Its part along the path, \\(g\\sin\\gamma\\), is the gravity loss, and its part across the path is what bends the trajectory over in the gravity turn of the next section.`}</p>
            <p>${T`<b>Earth’s rotation</b> gives a launch due east a free \\(\\omega_\\oplus R_\\oplus\\cos\\phi\\): 465 m/s at the equator, 408 m/s at Cape Canaveral (28.5° N). Launch west and you pay it back twice.`}</p>
          </div>
        </section>

        ${Archive.capsule('liftoff')}

        <section class="section">
          <h2><span class="idx">4.2</span>${T`The gravity turn`}</h2>
          <div class="prose">
            <p>${T`A rocket starts vertical so it clears the pad and gets out of the thick air. A few seconds later it makes a small <b>pitch kick</b>, a slight tilt away from the vertical, then lets gravity do the turning (the Saturn V flew a pre-computed tilt program that approximates this turn): with thrust aligned to the airflow there is no <b>angle of attack</b> (the angle between the vehicle’s axis and the oncoming air), so no aerodynamic side load. The flight-path angle obeys`}</p>
            <div class="eq">\\[ \\dot\\gamma = -\\left(\\frac{g}{v} - \\frac{v}{r}\\right)\\cos\\gamma \\]</div>
            ${Sym.where(['gammadot', 'g', 'v', 'r', 'gamma'], N`Slow rockets (small v) turn over fast; at orbital speed g/v = v/r and the path stops bending toward the ground.`)}
            <p>${T`The slower the vehicle, the faster gravity bends its path. That is why the size and timing of the kick matter so much. Once above the atmosphere the upper stages switch to closed-loop guidance. Saturn V used the Iterative Guidance Mode, which steers to hit a target altitude, speed and flight-path angle at cutoff. The simulator uses a simplified version of the same idea for the S-II and S-IVB.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">4.3</span>${T`Lab: fly the Saturn V`}</h2>
          <div class="prose"><p>${T`A planar simulation with Apollo-era numbers: five F-1s whose thrust rises as the air thins, the centre engine shut down at T+135 s, J-2 upper stages, an exponential atmosphere and a rotating Earth. You choose when and how hard to pitch over. Small changes to the kick have large effects: real launch vehicles fly a carefully pre-computed <b>pitch program</b>, a table of tilt angles against time, for this reason.`}</p></div>
          <div class="lab" id="as">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Saturn V ascent`}</h3><span class="spacer"></span>
              <div class="btn-row"><button class="btn" data-p="nominal">${T`Nominal`}</button><button class="btn" data-p="lofted">${T`Too late`}</button><button class="btn" data-p="flat">${T`Too hard`}</button><button class="btn" data-p="west">${T`Launch west`}</button><button class="btn primary" id="as-play">${T`▸ Replay`}</button></div></div>
            <div class="stage" style="min-height:400px"><canvas id="as-cv" aria-label="${T`Ascent trajectory over the curved Earth`}"></canvas><div class="overlay" id="as-ov"></div><div class="badge" id="as-badge"></div></div>
            <div class="controls">
              ${UI.slider({ id: 'as-kt', label: T`Pitch kick time`, min: 5, max: 30, step: 0.5, value: 16, unit: 's' })}
              ${UI.slider({ id: 'as-ka', label: T`Pitch kick angle`, min: 0.1, max: 2.5, step: 0.05, value: 0.7, unit: '°' })}
              ${UI.slider({ id: 'as-alt', label: T`Target orbit altitude`, min: 150, max: 400, step: 5, value: 185, unit: 'km' })}
              ${UI.slider({ id: 'as-lat', label: T`Launch latitude`, min: 0, max: 65, step: 0.5, value: 28.5, unit: '°' })}
              <div class="ctl"><label for="as-dir"><span>${T`Launch direction`}</span></label><select id="as-dir"><option value="east">${T`Due east (prograde)`}</option><option value="west">${T`Due west (retrograde)`}</option></select></div>
              <dl class="readout" id="as-ro"></dl>
            </div>
            <div class="lab-foot">
              <div class="mini"><h4>${T`Altitude (km)`}</h4><canvas id="as-c1"></canvas></div>
              <div class="mini"><h4>${T`Inertial speed (km/s)`}</h4><canvas id="as-c2"></canvas></div>
              <div class="mini"><h4>${T`Dynamic pressure (kPa)`}</h4><canvas id="as-c3"></canvas></div>
              <div class="mini"><h4>${T`Acceleration (g)`}</h4><canvas id="as-c4"></canvas></div>
            </div>
          </div>
          <div class="callout history"><b>${T`Apollo 11, for comparison`}</b>${T`Liftoff 13:32:00 UTC. Max Q 35 kPa at T+83 s, 13.5 km. S-IC cutoff at T+161 s, 67 km, 2.76 km/s. S-II cutoff at T+548 s. S-IVB cutoff and orbit insertion at T+699 s, in a 183 × 186 km orbit. Compare with your flight.`}</div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('ascent', { math: 'integral', mathLabel: N`Integrals: adding up tiny pieces.` })}`;

      mountAscent(page.querySelector('#as'));
      Practice.embed(page.querySelector('#practice-slot'), 'ascent', 2);
    },
  });

  // physics.js event labels are plain English: translate them for display only (logic tests keep the English label)
  const EVENTS = [N`Liftoff`, N`Centre engine cutoff`, N`Impact`];
  function eventLabel(l) {
    let m;
    if ((m = /^(.+) burnout$/.exec(l))) return T`${m[1]} burnout`;
    if ((m = /^(.+) ignition$/.exec(l))) return T`${m[1]} ignition`;
    if ((m = /^(.+) cutoff — orbit$/.exec(l))) return T`${m[1]} cutoff — orbit`;
    return EVENTS.includes(l) ? T(l) : l;
  }

  function mountAscent(root) {

    let sim = null, play = 0;
    const presets = {
      nominal: { 'as-kt': 16, 'as-ka': 0.7, 'as-alt': 185, 'as-lat': 28.5, 'as-dir': 'east' },
      lofted: { 'as-kt': 24, 'as-ka': 0.3, 'as-alt': 185, 'as-lat': 28.5, 'as-dir': 'east' },
      flat: { 'as-kt': 10, 'as-ka': 1.5, 'as-alt': 185, 'as-lat': 28.5, 'as-dir': 'east' },
      west: { 'as-kt': 16, 'as-ka': 0.7, 'as-alt': 185, 'as-lat': 28.5, 'as-dir': 'west' },
    };
    // objectives count only after the candidate has changed a control themselves (not a preset)
    let touched = false;
    root.addEventListener('input', () => { touched = true; }, true);
    root.addEventListener('change', (e) => { touched = e.target.id !== '-'; }, true);
    const view = UI.canvas(root.querySelector('#as-cv'), null);
    const minis = ['#as-c1', '#as-c2', '#as-c3', '#as-c4'].map((s) => UI.canvas(root.querySelector(s), null));

    const fmts = { 'as-kt': (x) => x.toFixed(1), 'as-ka': (x) => x.toFixed(2), 'as-alt': (x) => x.toFixed(0), 'as-lat': (x) => x.toFixed(1) };
    const ctl = UI.bindControls(root, fmts, (v) => {
      sim = Phys.simulateAscent({ kickTime: v['as-kt'], kickAngle: v['as-ka'], targetAlt: v['as-alt'] * 1000, latitude: v['as-lat'], east: v['as-dir'] !== 'west' });
      play = UI.reducedMotion() ? sim.t : 0;
      if (touched && (sim.outcome === 'crash' || sim.outcome === 'burnout')) Progress.done('ascent', 'fail');
      if (touched && sim.outcome === 'orbit' && sim.perigee >= 150e3) Progress.done('ascent', 'orbit');
      readout(v);
      minis.forEach((m) => m.redraw());
    });
    root.querySelector('#as-dir').addEventListener('change', () => ctl.update());
    root.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const p = presets[b.dataset.p];
      touched = false;
      for (const k in p) ctl.set(k, p[k]);
      ctl.update();
    }));
    root.querySelector('#as-play').addEventListener('click', () => { play = 0; });

    function readout(v) {
      const s = sim, km = (m) => UI.fmt(m / 1000, 0);
      const target = v['as-alt'];
      const ok = s.outcome === 'orbit' && s.perigee > 120000;
      const b = root.querySelector('#as-badge');
      const msg = { orbit: ok ? T`Orbit achieved` : T`Orbit too low, will decay`, crash: T`Lost: vehicle fell back`, burnout: T`Out of propellant`, timeout: T`Guidance timeout` }[s.outcome];
      b.textContent = msg;
      b.className = 'badge ' + (ok ? (s.maxQ.q > 40000 ? 'warn' : 'good') : 'bad');
      const L = s.losses;
      const s1 = s.trace.find((p) => p.stage === 1);
      root.querySelector('#as-ro').innerHTML = `
        <dt>${T`Orbit (perigee × apogee)`}</dt><dd class="hl">${s.outcome === 'crash' ? '—' : `${km(s.perigee)} × ${km(s.apogee)} km`}</dd>
        <dt>${T`Insertion time`}</dt><dd>T+${UI.fmtTime(s.t)}</dd>
        <dt>${T`S-IVB propellant left`}</dt><dd>${s.stage === 2 ? UI.fmt(s.propLeft / 1000, 1) + ' t' : '—'}</dd>
        <dt>Max Q</dt><dd style="color:${s.maxQ.q > 40000 ? 'var(--bad)' : 'inherit'}">${UI.fmt(s.maxQ.q / 1000, 1)} kPa @ T+${s.maxQ.t.toFixed(0)} s</dd>
        <dt>${T`S-IC cutoff`}</dt><dd>${s1 ? `${km(s1.h)} km, ${UI.fmt(s1.v / 1000, 2)} km/s` : '—'}</dd>
        <dt class="sub">${T`Δv ledger (m/s)`}</dt>
        <dt>${T`Ideal Δv expended`}</dt><dd>${UI.fmt(s.dvIdeal, 0)}</dd>
        <dt>${T`− Gravity loss`}</dt><dd>${UI.fmt(L.gravity, 0)}</dd>
        <dt>${T`− Drag loss`}</dt><dd>${UI.fmt(L.drag, 0)}</dd>
        <dt>${T`− Steering loss`}</dt><dd>${UI.fmt(L.steering, 0)}</dd>
        <dt>${s.rotV >= 0 ? '+' : '−'} ${T`Earth rotation`}</dt><dd>${UI.fmt(Math.abs(s.rotV), 0)}</dd>
        <dt>${T`≈ Final inertial speed`}</dt><dd class="hl">${UI.fmt(s.v, 0)}</dd>`;
      void target;
    }

    // scene: curved Earth seen from the side, trajectory downrange
    view.draw = (ctx, w, h) => {
      if (!sim) return;
      const K = UI.tok();
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
        ctx.fillStyle = K.trace; ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(cx, cy, R + alt * vex * s, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = K.earth; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      // target altitude
      ctx.strokeStyle = K.good; ctx.setLineDash([4, 6]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R + ctl.read()['as-alt'] * 1000 * vex * s, -Math.PI / 2, 0); ctx.stroke(); ctx.setLineDash([]);
      // path coloured by stage
      const cols = [K.accent, K.trace2, K.trace];
      ctx.lineWidth = 2.4;
      for (let i = 1; i < n; i++) {
        ctx.strokeStyle = cols[tr[i].stage];
        const [x0, y0] = PP(tr[i - 1].x, tr[i - 1].h), [x1, y1] = PP(tr[i].x, tr[i].h);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      const cur = tr[n - 1];
      const [vx, vy] = PP(cur.x, cur.h);
      ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(vx, vy, 4, 0, 7); ctx.fill();
      ctx.font = `10px ${K.mono}`; ctx.fillStyle = K.muted; ctx.textAlign = 'left';
      ctx.fillText(T`vertical scale ×${UI.dec(vex.toFixed(1))}`, w - 140, h - 12);
      ctx.fillStyle = K.good; ctx.fillText(T`target orbit`, 30, cy - R - ctl.read()['as-alt'] * 1000 * vex * s - 6);
      const legend = ['S-IC', 'S-II', 'S-IVB'];
      legend.forEach((l, i) => { ctx.fillStyle = cols[i]; ctx.fillRect(w - 150 + i * 48, 14, 10, 3); ctx.fillText(l, w - 136 + i * 48, 18); });
      const ev = sim.events.filter((e) => e.t <= play).pop();
      root.querySelector('#as-ov').innerHTML = `T+${UI.fmtTime(cur.t)}<br>${T`alt ${UI.fmt(cur.h / 1000, 1)} km · v ${UI.fmt(cur.v, 0)} m/s`}<br>${T`pitch ${UI.fmt(cur.beta * 180 / Math.PI, 1)}° · ${UI.fmt(cur.g, 2)} g`}<br>${ev ? eventLabel(ev.label) : ''}`;
    };

    const miniDraw = (k, f, yFmt, extra = {}) => (ctx, w, h) => {
      if (!sim) return;
      const K = UI.tok();
      UI.chart(ctx, w, h, { series: [{ data: sim.trace.map((p) => [p.t, f(p)]), color: k === 2 ? K.warn : K.trace, width: 1.6, fill: true }], xMin: 0, xMax: Math.max(sim.t, 60), yMin: 0, xFmt: (x) => x.toFixed(0), yFmt, cursor: play,
        marks: sim.events.filter((e) => /burnout|ignition/.test(e.label) && !/ignition/.test(e.label)).map((e) => ({ x: e.t, color: K.muted })), ...extra });
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
