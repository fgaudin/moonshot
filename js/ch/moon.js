/* Chapter 6 — Lunar trajectories: patched conics, sphere of influence, TLI, free return, LOI.
   Lab: Earth–Moon restricted three-body simulator. */
(function () {
  'use strict';
  const { C, EM } = Phys;

  const PRESETS = {
    free: { dv: 3160, ang: -132.18, mcc: 0.04, loi: false, label: 'Free return (Apollo 8/13 style)' },
    raw: { dv: 3160, ang: -132.18, mcc: 0, loi: false, label: 'Free return, no midcourse correction' },
    loi: { dv: 3160, ang: -132.18, mcc: 0.04, loi: true, loiDv: 890, label: 'Capture into lunar orbit' },
    impact: { dv: 3160, ang: -133.3, mcc: 0, loi: false, label: 'Lunar impact' },
    sling: { dv: 3170, ang: -135.5, mcc: 0, loi: false, label: 'Slingshot' },
    miss: { dv: 3100, ang: -130, mcc: 0, loi: false, label: 'Missed the Moon' },
  };

  App.chapter({
    id: 'moon', phase: 'TLI → LOI', title: 'Going to the Moon', lab: 'Free-return simulator',
    blurb: 'Patched conics, the sphere of influence and the free-return figure eight. Find the trajectory that saved Apollo 13.',
    render(page) {
      const soi = C.DEM * Math.pow(C.muM / C.muE, 0.4) / 1000;
      page.innerHTML = `
        ${App.header({
          eyebrow: 'Training module TM-7 · Trans-lunar injection to lunar orbit',
          title: 'Going to the Moon',
          lede: 'Three bodies, no closed-form solution, and a target moving at 1 km/s. Apollo’s planners stitched two-body conics together to design the trajectory, then refined it by numerical integration. This module does both.',
          refs: ['Sellers · Interplanetary Travel', 'BMW ch. 7 Lunar Trajectories', 'BMW ch. 8 Interplanetary Trajectories'],
        })}
        ${Progress.briefing('moon', { theory: 'theory', lab: 'tl', math: 'refresher', mathLabel: 'Powers and roots.' })}

        <section class="section" id="theory">
          <h2><span class="idx">7.1</span>The sphere of influence and patched conics</h2>
          <div class="prose">
            <p>Near the Moon, its gravity dominates the spacecraft’s motion relative to it; farther out, Earth’s does. Laplace defined the boundary as the <b>sphere of influence</b>:</p>
            <div class="eq">\\[ r_{SOI} = D\\left(\\frac{m_☾}{m_\\oplus}\\right)^{2/5} = 384\\,400\\ \\mathrm{km}\\times(0.0123)^{0.4} \\approx ${UI.fmt(soi, 0)}\\ \\mathrm{km} \\]</div>
            ${Sym.where(['rsoi', 'Dem', 'mM', 'mE'])}
            ${Primer.box('powers', false, 'refresher')}
            <p>The <b>patched-conic</b> method (BMW §7.4) treats the flight as two two-body problems. Outbound it is an Earth-centred ellipse. At the sphere boundary, subtract the Moon’s velocity (≈ 1.02 km/s) to get the spacecraft’s velocity relative to the Moon. Inside the sphere the path is a Moon-centred hyperbola. Its periselene is set by where the outbound ellipse crosses the boundary, which makes the method very sensitive, but it gives Δv and flight times to within a few percent.</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">7.2</span>Trans-lunar injection</h2>
          <div class="prose">
            <p>From the 185 km parking orbit, the S-IVB re-ignited over the Pacific about 2 h 44 min after launch and burned for 5 min 47 s. The first estimate is a Hohmann-like ellipse with apogee at the Moon’s distance:</p>
            <div class="eq">\\[ v_p = \\sqrt{\\mu_\\oplus\\left(\\frac{2}{r_p} - \\frac{2}{r_p + r_a}\\right)} = 10.93\\ \\mathrm{km/s}, \\qquad \\Delta v_{TLI} = v_p - \\sqrt{\\frac{\\mu_\\oplus}{r_p}} = 10.93 - 7.79 = 3.14\\ \\mathrm{km/s} \\]</div>
            ${Sym.where(['vp', 'muE', 'rpT', 'raT', 'dvtli'])}
            <p>A minimum-energy ellipse would take five days to reach apogee. Burning slightly more, about 3.15–3.18 km/s, shortens the trip to three days at little cost. The <b>phase angle</b> also matters: the burn must happen at the point of the parking orbit that puts apogee where the Moon <i>will be</i> on arrival, about 3 × 13.2° = 40° ahead of where it is at the burn.</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">7.3</span>Lab: fly to the Moon</h2>
          <div class="prose"><p>This simulator does not use patched conics. It integrates the planar <b>circular restricted three-body problem</b> numerically: the spacecraft feels Earth and Moon at the same time, and the two bodies circle their common barycentre. Set the TLI burn and its position in the parking orbit. The preset free return was found by searching this simulator for a trajectory passing 290 km behind the Moon and returning to a 40 km vacuum perigee, inside the entry corridor.</p>
          <p>The free return is extremely sensitive. A TLI error of <b>0.1 m/s</b>, out of 3 160, moves the return perigee by about a thousand kilometres. No engine is that precise, so Apollo flew <b>midcourse corrections</b> (MCC). The ground tracked the spacecraft by radio Doppler, computed the correction on Mission Control's IBM 360s, and read the burn to the crew. Pick the “no midcourse correction” scenario, then press <i>Mission Control: solve MCC</i>.</p></div>
          <div class="lab" id="tl">
            <div class="lab-head"><span class="tag">Lab</span><h3>Earth–Moon trajectory</h3><span class="spacer"></span>
              <div class="seg" id="tl-view" role="group" aria-label="Reference frame"><button data-v="inertial" aria-pressed="false">Inertial</button><button data-v="rotating" aria-pressed="true">Rotating</button><button data-v="moon" aria-pressed="false">Moon close-up</button></div>
            </div>
            <div class="stage" style="min-height:500px"><canvas id="tl-cv" aria-label="Spacecraft trajectory between Earth and Moon"></canvas><div class="overlay" id="tl-ov"></div><div class="badge" id="tl-badge"></div></div>
            <div class="controls">
              <div class="ctl"><label for="tl-preset"><span>Scenario</span></label><select id="tl-preset">${Object.entries(PRESETS).map(([k, p]) => `<option value="${k}">${p.label}</option>`).join('')}</select></div>
              ${UI.slider({ id: 'tl-dv', label: 'TLI Δv', min: 3000, max: 3250, step: 1, value: 3160, unit: 'm/s' })}
              ${UI.slider({ id: 'tl-ang', label: 'TLI burn position (from Earth–Moon line)', min: -150, max: -110, step: 0.01, value: -132.18, unit: '°' })}
              ${UI.slider({ id: 'tl-mcc', label: 'MCC at GET 26:42 (along-track)', min: -15, max: 15, step: 0.01, value: 0.04, unit: 'm/s' })}
              <button class="btn" id="tl-solve">Mission Control: solve MCC for 40 km entry</button>
              <label class="mono note" style="display:flex;gap:.5rem;align-items:center"><input type="checkbox" id="tl-loi"> Fire LOI at periselene (retrograde)</label>
              ${UI.slider({ id: 'tl-loidv', label: 'LOI Δv', min: 300, max: 1400, step: 10, value: 890, unit: 'm/s' })}
              <div class="btn-row"><button class="btn primary" id="tl-play">▸ Play</button><button class="btn" id="tl-restart">⟲ Restart</button></div>
              ${UI.slider({ id: 'tl-t', label: 'Mission time', min: 0, max: 1, step: 0.0005, value: 0 })}
              <dl class="readout" id="tl-ro"></dl>
            </div>
            <div class="lab-foot">
              <div class="mini"><h4>Distance from Earth (10³ km)</h4><canvas id="tl-c1"></canvas></div>
              <div class="mini"><h4>Speed relative to Earth (km/s)</h4><canvas id="tl-c2"></canvas></div>
            </div>
          </div>
          <p class="note">Planar model with the Moon on a circular orbit. Real Apollo trajectories were three-dimensional, with the Moon's 5° orbital inclination and its eccentric orbit, the Sun's pull and Earth's oblateness all included. The physics and the sensitivity are the same.</p>
        </section>

        <section class="section">
          <h2><span class="idx">7.4</span>The free return</h2>
          <div class="prose">
            <p>Pass behind the Moon on the right side and its gravity bends the trajectory back toward Earth, with no engine needed. In the rotating frame the path traces the famous <b>figure eight</b>. Apollo 8, 10 and 11 flew free-return trajectories, so that a dead main engine would still mean coming home.</p>
            <p>Apollo 12 onward used <b>hybrid</b> trajectories to reach landing sites the free return could not. They left the free return with a midcourse burn of the Service Propulsion System. On Apollo 13 an oxygen tank exploded 56 hours out, crippling the Service Module and making its engine too risky to use. The crew fired the Lunar Module’s descent engine for 35 seconds to get <i>back</i> on a free return, then burned again after passing the Moon (PC+2) to speed up the return. The Moon did the rest.</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">7.5</span>Lunar orbit insertion</h2>
          <div class="prose">
            <p>Relative to the Moon, an arriving spacecraft is on a hyperbola with excess speed \\(v_\\infty \\approx 0.8\\)–\\(1\\) km/s. To be captured it must burn retrograde at periselene, behind the Moon and out of radio contact with Earth:</p>
            <div class="eq">\\[ v_{p} = \\sqrt{v_\\infty^2 + \\frac{2\\mu_☾}{r_p}}, \\qquad \\Delta v_{LOI} = v_p - v_{\\text{target orbit}} \\]</div>
            ${Sym.where(['vp', 'vinf', 'muM', 'rpM', 'dvloi'])}
            <p>Apollo 11’s LOI-1 burned the SPS for 5 min 57 s (889 m/s) into a 111 × 313 km orbit. LOI-2 circularized it two orbits later. Because the burn happened behind the Moon, mission control learned whether it had worked only when the spacecraft reappeared on schedule, or did not.</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>Check yourself</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('moon', { math: 'powers', mathLabel: 'Powers, roots and scientific notation.' })}`;

      mountTLI(page.querySelector('#tl'));
      Practice.embed(page.querySelector('#practice-slot'), 'moon', 3);
    },
  });

  function mountTLI(root) {
    let sim = null, frame = 'rotating', idx = 0, playing = !UI.reducedMotion(), cum = [];
    // objectives count only after the candidate has changed a control themselves (not a preset)
    let touched = false;
    root.addEventListener('input', () => { touched = true; }, true);
    root.addEventListener('change', (e) => { touched = e.target.id !== 'tl-preset'; }, true);
    const inCorridor = (s) => s.outcome === 'entry' && s.retAlt >= 20e3 && s.retAlt <= 65e3 && s.minM.alt < 20000e3;
    const view = UI.canvas(root.querySelector('#tl-cv'), null);
    const minis = ['#tl-c1', '#tl-c2'].map((s) => UI.canvas(root.querySelector(s), null));

    // transform a sample into the chosen frame; returns [x, y] in metres, origin Earth (or Moon for close-up)
    function tf(p, which = 'sc') {
      const px = which === 'sc' ? p.x : which === 'moon' ? p.mx : p.ex;
      const py = which === 'sc' ? p.y : which === 'moon' ? p.my : p.ey;
      if (frame === 'inertial') return [px - p.ex, py - p.ey];
      const th = EM.w * p.t;
      const ox = frame === 'moon' ? p.mx : p.ex, oy = frame === 'moon' ? p.my : p.ey;
      const dx = px - ox, dy = py - oy;
      return [dx * Math.cos(th) + dy * Math.sin(th), -dx * Math.sin(th) + dy * Math.cos(th)];
    }

    const MCC_T = 26.7 * 3600;
    const simOpts = (v) => ({ dv: v['tl-dv'], burnAngle: v['tl-ang'], mcc: { t: MCC_T, dv: v['tl-mcc'] }, loi: v['tl-loi'] ? { dv: v['tl-loidv'] } : null });
    const fmts = { 'tl-dv': (x) => UI.fmt(x, 0), 'tl-ang': (x) => x.toFixed(2), 'tl-loidv': (x) => UI.fmt(x, 0), 'tl-mcc': (x) => (x > 0 ? '+' : '') + x.toFixed(2), 'tl-t': () => (sim ? 'GET ' + UI.fmtTime(sim.pts[idx].t) : '') };
    const ctl = UI.bindControls(root, fmts, (v, src) => {
      if (src === 'tl-t') { idx = Math.round(v['tl-t'] * (sim.pts.length - 1)); playing = false; setPlayLabel(); draw(); return; }
      const wasBad = sim && !inCorridor(sim);
      sim = Phys.simulateTLI(simOpts(v));
      if (touched && inCorridor(sim)) Progress.done('moon', 'free');
      if (src === 'tl-mcc' && wasBad && inCorridor(sim)) Progress.done('moon', 'rescue');
      if (touched && sim.outcome === 'lunarOrbit') Progress.done('moon', 'loi');
      // velocity relative to Earth by finite differences of samples (for the speed chart)
      cum = sim.pts.map((p, i) => {
        const q = sim.pts[Math.min(i + 1, sim.pts.length - 1)], o = sim.pts[Math.max(0, i - 1)];
        const dt = q.t - o.t || 1;
        return Math.hypot((q.x - q.ex) - (o.x - o.ex), (q.y - q.ey) - (o.y - o.ey)) / dt;
      });
      idx = playing ? 0 : sim.pts.length - 1;
      summarize();
      minis.forEach((m) => m.redraw());
      draw();
    });
    root.querySelector('#tl-loi').addEventListener('change', () => ctl.update());
    root.querySelector('#tl-preset').addEventListener('change', (e) => {
      const p = PRESETS[e.target.value];
      ctl.set('tl-dv', p.dv); ctl.set('tl-ang', p.ang); ctl.set('tl-mcc', p.mcc);
      root.querySelector('#tl-loi').checked = p.loi; if (p.loiDv) ctl.set('tl-loidv', p.loiDv);
      playing = true; setPlayLabel();
      ctl.update();
    });
    root.querySelector('#tl-solve').addEventListener('click', (e) => {
      const btn = e.currentTarget, v = ctl.read();
      btn.textContent = 'Computing…';
      setTimeout(() => {
        const dv = Phys.solveMCC({ ...simOpts(v), mcc: { t: MCC_T, dv: 0 } });
        const wasBad = !inCorridor(sim);
        if (dv == null) { btn.textContent = 'No fix within ±15 m/s: adjust TLI'; return; }
        btn.textContent = `RTCC solution: ${dv >= 0 ? '+' : ''}${dv.toFixed(2)} m/s. Solve again`;
        ctl.set('tl-mcc', dv.toFixed(2)); idx = 0; playing = true; setPlayLabel(); touched = true; ctl.update();
        if (wasBad && inCorridor(sim)) Progress.done('moon', 'rescue');
      }, 30);
    });
    UI.seg(root, '#tl-view', (v) => { frame = v; draw(); });
    const playBtn = root.querySelector('#tl-play');
    const setPlayLabel = () => { playBtn.textContent = playing ? '❚❚ Pause' : '▸ Play'; };
    playBtn.addEventListener('click', () => { if (idx >= sim.pts.length - 1) idx = 0; playing = !playing; setPlayLabel(); });
    root.querySelector('#tl-restart').addEventListener('click', () => { idx = 0; playing = true; setPlayLabel(); });
    setPlayLabel();

    function summarize() {
      const s = sim, b = root.querySelector('#tl-badge');
      const ret = s.retAlt / 1000;
      let verdict, cls;
      if (s.outcome === 'impact') { verdict = 'Lunar impact'; cls = 'bad'; }
      else if (s.outcome === 'lunarOrbit') { verdict = 'Captured in lunar orbit'; cls = 'good'; }
      else if (s.outcome === 'entry') {
        const nearMoon = s.minM.alt < 20000e3;
        if (ret >= 20 && ret <= 65) { verdict = nearMoon ? 'Free return: in the entry corridor' : 'Returns to the corridor, but missed the Moon'; cls = nearMoon ? 'good' : 'warn'; }
        else if (ret < 20) { verdict = 'Returns too steep for entry'; cls = 'bad'; }
        else { verdict = 'Returns too shallow: skip-out'; cls = 'warn'; }
      } else if (s.outcome === 'escape' || s.outcome === 'flung') { verdict = 'Slingshot: flung into deep space'; cls = 'warn'; }
      else if (isFinite(ret) && ret > 122) { verdict = 'Returns, but misses the atmosphere'; cls = 'warn'; }
      else { verdict = 'Still coasting after 10 days'; cls = 'warn'; }
      b.textContent = verdict; b.className = 'badge ' + cls;
      const lines = [
        ['Speed after TLI', `${UI.fmt(s.v0 / 1000, 3)} km/s`],
        ['Closest lunar approach', s.minM.alt < 0 ? 'impact' : `${UI.fmt(s.minM.alt / 1000, 0)} km alt.`],
        ['… at GET', UI.fmtTime(s.minM.t)],
      ];
      if (Math.abs(ctl.read()['tl-mcc']) > 0) lines.push(['MCC burn', `${ctl.read()['tl-mcc'].toFixed(2)} m/s`]);
      if (s.loiT) lines.push(['LOI fired at GET', UI.fmtTime(s.loiT)]);
      if (s.outcome === 'entry') { lines.push(['Return perigee (vacuum)', `${UI.fmt(ret, 0)} km alt.`]); lines.push(['Entry interface at GET', UI.fmtTime(s.perigee.t)]); lines.push(['Entry speed', `${UI.fmt(s.perigee.v / 1000, 2)} km/s`]); }
      root.querySelector('#tl-ro').dataset.summary = lines.map(([a, c]) => `<dt>${a}</dt><dd>${c}</dd>`).join('');
    }

    function draw() { view.redraw(); updateRO(); }

    function updateRO() {
      if (!sim) return;
      const p = sim.pts[idx];
      root.querySelector('#tl-ro').innerHTML = `
        <dt>GET</dt><dd class="hl">${UI.fmtTime(p.t)}</dd>
        <dt>Distance from Earth</dt><dd>${UI.fmt(p.rE / 1000, 0)} km</dd>
        <dt>Distance from Moon</dt><dd>${UI.fmt(p.rM / 1000, 0)} km</dd>
        <dt>Speed rel. Earth</dt><dd>${UI.fmt(cum[idx] / 1000, 3)} km/s</dd>
        <dt>Inside Moon's SOI</dt><dd>${p.rM < 66.1e6 ? 'yes' : 'no'}</dd>
        <dt class="sub">Outcome</dt>${root.querySelector('#tl-ro').dataset.summary || ''}`;
      const o = root.querySelector('#tl-t');
      o.value = idx / Math.max(1, sim.pts.length - 1);
      root.querySelector('#tl-t-out').textContent = 'GET ' + UI.fmtTime(p.t);
    }

    view.draw = (ctx, w, h) => {
      if (!sim) return;
      const T = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, T);
      const pts = sim.pts, cur = pts[idx];
      let s, cx, cy;
      if (frame === 'moon') { const span = 2.4e7; s = Math.min(w, h) / span; cx = w / 2; cy = h / 2; }
      else {
        // fit the Earth–Moon system and the trajectory
        let maxR = C.DEM * 1.12;
        for (const p of pts) { const [x, y] = tf(p); maxR = Math.max(maxR, Math.min(Math.hypot(x, y), 1.2e9)); }
        s = Math.min((w - 40) / (maxR * 1.25), (h - 40) / (maxR * 1.25));
        cx = frame === 'rotating' ? w / 2 - C.DEM * s * 0.45 : w / 2; cy = h / 2;
        if (frame === 'rotating' && maxR < C.DEM * 1.5) s = Math.min((w - 60) / (C.DEM * 1.45), (h - 40) / (C.DEM * 0.9));
      }
      const P = ([x, y]) => [cx + x * s, cy - y * s];
      // Moon orbit / SOI
      ctx.strokeStyle = T.line; ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
      if (frame === 'inertial') { ctx.beginPath(); ctx.arc(cx, cy, C.DEM * s, 0, 7); ctx.stroke(); }
      const [mx, my] = P(frame === 'moon' ? [0, 0] : tf(cur, 'moon'));
      ctx.beginPath(); ctx.arc(mx, my, 66.1e6 * s, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = T.muted; ctx.font = `10px ${T.mono}`; ctx.textAlign = 'center';
      if (66.1e6 * s < Math.min(w, h)) ctx.fillText('Moon SOI', mx, my - 66.1e6 * s - 5);
      // trajectory: full path faint, flown part bright
      const path = (from, to, color, width, alpha) => {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha; ctx.beginPath();
        for (let i = from; i <= to; i++) { const [x, y] = P(tf(pts[i])); i === from ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke(); ctx.globalAlpha = 1;
      };
      path(0, pts.length - 1, T.accent, 1, 0.3);
      path(0, idx, T.accent, 2, 1);
      // bodies
      if (frame !== 'moon') { const [ex, ey] = P(tf(cur, 'earth')); UI.drawEarth(ctx, ex, ey, Math.max(4, C.RE * s), T); ctx.fillStyle = T.muted; ctx.fillText('EARTH', ex, ey + Math.max(4, C.RE * s) + 13); }
      UI.drawMoon(ctx, mx, my, Math.max(3, C.RM * s), T);
      ctx.fillStyle = T.muted; ctx.fillText('MOON', mx, my + Math.max(3, C.RM * s) + 13);
      if (frame === 'moon') {
        // Earth direction arrow
        const [ex, ey] = tf(cur, 'earth'); const a = Math.atan2(ey, ex);
        UI.arrow(ctx, cx + Math.cos(a) * 60, cy - Math.sin(a) * 60, cx + Math.cos(a) * 100, cy - Math.sin(a) * 100, T.earth, 1.5);
        ctx.fillStyle = T.earth; ctx.fillText('to Earth', cx + Math.cos(a) * 118, cy - Math.sin(a) * 118);
      }
      // burn markers
      for (const p of pts.filter((q) => q.burn)) {
        const [lx, ly] = P(tf(p)); ctx.strokeStyle = T.good; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(lx, ly, 6, 0, 7); ctx.stroke();
        ctx.fillStyle = T.good; ctx.textAlign = 'left'; ctx.fillText(p.burn, lx + 9, ly - 6);
      }
      // spacecraft
      const [sx, sy] = P(tf(cur));
      ctx.fillStyle = T.ink; ctx.beginPath(); ctx.arc(sx, sy, 4, 0, 7); ctx.fill();
      ctx.strokeStyle = T.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, 7, 0, 7); ctx.stroke();
      root.querySelector('#tl-ov').innerHTML = `${frame === 'rotating' ? 'rotating frame: Earth–Moon line fixed' : frame === 'inertial' ? 'inertial frame, Earth-centred' : 'rotating frame, Moon-centred, 24 000 km wide'}<br>dashed circle: Moon's sphere of influence`;
    };

    const miniDraw = (k) => (ctx, w, h) => {
      if (!sim) return;
      const T = UI.tok();
      const data = sim.pts.map((p, i) => [p.t / 3600, k === 0 ? p.rE / 1e6 : cum[i] / 1000]);
      UI.chart(ctx, w, h, { series: [{ data, color: k === 0 ? T.trace : T.accent, width: 1.6, fill: k === 0 }], xMin: 0, xFmt: (x) => x.toFixed(0), xLabel: 'GET (h)', yFmt: (y) => y.toFixed(0), cursor: sim.pts[idx].t / 3600,
        yMax: k === 1 ? 11.5 : undefined,
        marks: [{ x: sim.minM.t / 3600, color: T.moon, label: 'periselene' }] });
    };
    minis[0].draw = miniDraw(0); minis[1].draw = miniDraw(1);

    let acc = 0;
    UI.loop((dt) => {
      if (!sim || !playing) return;
      // index-based playback: samples are denser near Earth and Moon, so the action slows down there
      idx = Math.min(sim.pts.length - 1, idx + Math.max(1, Math.round(dt * 60 * (sim.pts.length > 6000 ? 6 : 1))));
      if (idx >= sim.pts.length - 1) { playing = false; setPlayLabel(); }
      draw();
      acc += dt; if (acc > 0.3) { minis.forEach((m) => m.redraw()); acc = 0; }
    });
    ctl.update();
  }
})();
