/* Home: the mission at a glance. */
(function () {
  'use strict';
  // Apollo 11 major manoeuvres, approximate values from the Apollo 11 Mission Report (MSC-00171).
  const BURNS = [
    { t: 0, end: 0.195, name: 'Launch to Earth parking orbit', dv: 9300, who: 'Saturn V', ch: 'ascent', note: '7.8 km/s orbital speed + ~1.5 km/s gravity & drag losses' },
    { t: 2.73, end: 2.83, name: 'Trans-lunar injection (TLI)', dv: 3182, who: 'S-IVB', ch: 'moon' },
    { t: 26.7, end: 26.7, name: 'Midcourse correction 2', dv: 6.4, who: 'CSM SPS', ch: 'moon' },
    { t: 75.8, end: 75.9, name: 'Lunar orbit insertion 1', dv: 889, who: 'CSM SPS', ch: 'moon' },
    { t: 80.2, end: 80.2, name: 'Lunar orbit insertion 2', dv: 48, who: 'CSM SPS', ch: 'maneuvers' },
    { t: 101.6, end: 101.6, name: 'Descent orbit insertion', dv: 23, who: 'LM DPS', ch: 'maneuvers' },
    { t: 102.55, end: 102.75, name: 'Powered descent to landing', dv: 2050, who: 'LM DPS', ch: 'landing' },
    { t: 124.37, end: 124.49, name: 'Lunar ascent', dv: 1850, who: 'LM APS', ch: 'landing' },
    { t: 135.4, end: 135.45, name: 'Trans-Earth injection (TEI)', dv: 1001, who: 'CSM SPS', ch: 'moon' },
    { t: 195.05, end: 195.3, name: 'Entry, from 11.03 km/s to 0 by drag', dv: 0, who: 'Heat shield', ch: 'entry' },
  ];

  App.chapter({
    id: 'home', phase: 'Pre-launch', title: 'The Mission',
    render(page) {
      const cards = ['newton', 'orbits', 'rockets', 'ascent', 'maneuvers', 'moon', 'landing', 'entry', 'practice']
        .map((id) => App.chapters[id]).filter(Boolean)
        .map((c) => `<a class="card" href="#${c.id}"><span class="phase">${c.phase}</span><h3>${c.title}</h3><p>${c.blurb || ''}</p>${c.lab ? `<span class="lablink">Lab · ${c.lab} →</span>` : ''}</a>`).join('');
      page.innerHTML = `
        <section class="hero">
          <div style="display:flex;flex-direction:column;gap:1.2rem;min-width:0">
            <span class="eyebrow">Apollo · 1961–1972 · astrodynamics &amp; rocket science</span>
            <h1>How we went<br>to the <em>Moon</em></h1>
            <p class="lede">The theory, the equations and the numbers behind the Apollo missions, from Newton's laws to the heat shield. Each chapter has a working simulator and exercises that check your arithmetic.</p>
            <div class="btn-row"><a class="btn primary" href="#newton">Begin at Newton →</a><a class="btn" href="#moon">Fly the free return</a><a class="btn" href="#practice">Practice problems</a></div>
          </div>
          <figure style="margin:0;display:flex;flex-direction:column;gap:.5rem;align-items:center;min-width:0">
            <div class="stage-hero"><canvas id="hero-cv" aria-label="Animated free-return trajectory from the Earth around the Moon and back, in the rotating Earth–Moon frame"></canvas></div>
            <figcaption class="note mono" id="hero-cap" style="font-size:.72rem;text-align:center">Free-return trajectory, integrated live: TLI Δv 3 160 m/s. Earth–Moon rotating frame, to scale.</figcaption>
          </figure>
        </section>

        <div class="stats">
          <div><b class="num">2 938<small>t</small></b><span>Saturn V mass at liftoff</span></div>
          <div><b class="num">7.79<small>km/s</small></b><span>circular speed in the 185 km parking orbit</span></div>
          <div><b class="num">3.18<small>km/s</small></b><span>trans-lunar injection burn, Apollo 11</span></div>
          <div><b class="num">384 400<small>km</small></b><span>mean Earth–Moon distance</span></div>
          <div><b class="num">11.03<small>km/s</small></b><span>speed at entry interface, 122 km</span></div>
        </div>

        <section class="section">
          <h2><span class="idx">Δv</span>The mission, burn by burn</h2>
          <div class="prose"><p>Every phase of the flight is paid for in velocity change, Δv. The staircase below adds up the major Apollo 11 manoeuvres against ground elapsed time. Reaching orbit costs more than everything that follows. That is why the Saturn V was 85% propellant by mass. Click a step to open the chapter that explains it.</p></div>
          <div class="lab" style="grid-template-columns:minmax(0,1fr)">
            <div class="stage" style="height:300px;min-height:0;background:var(--panel)"><canvas id="stair-cv"></canvas></div>
            <div class="scroll-x"><table class="data" id="burns"><thead><tr><th>Manoeuvre</th><th>GET (h)</th><th>Engine</th><th>Δv (m/s)</th><th>Σ Δv (km/s)</th></tr></thead><tbody></tbody></table></div>
          </div>
          <p class="note">Approximate values from the Apollo 11 Mission Report. GET is ground elapsed time from liftoff, 16 July 1969, 13:32 UTC.</p>
        </section>

        <section class="section">
          <h2><span class="idx">→</span>Flight plan</h2>
          <div class="prose"><p>The chapters follow the mission in order, and each builds on the one before. The theory follows the two books on your shelf: Sellers' <i>Understanding Space</i> for the physical intuition, and Bate, Mueller &amp; White's <i>Fundamentals of Astrodynamics</i> (BMW) for the mathematics.</p></div>
          <div class="cards">${cards}</div>
        </section>`;

      // --- staircase chart
      let cum = 0;
      const rows = BURNS.map((b) => { cum += b.dv; return { ...b, cum }; });
      const tb = page.querySelector('#burns tbody');
      tb.innerHTML = rows.map((b) => `<tr style="cursor:pointer" data-ch="${b.ch}"><td>${b.name}</td><td>${b.t.toFixed(1)}</td><td>${b.who}</td><td>${b.dv ? UI.fmt(b.dv, 0) : '—'}</td><td>${(b.cum / 1000).toFixed(2)}</td></tr>`).join('');
      tb.addEventListener('click', (e) => { const tr = e.target.closest('tr'); if (tr) App.go(tr.dataset.ch); });
      const stair = [[0, 0]];
      let c2 = 0;
      for (const b of BURNS) { stair.push([b.t, c2 / 1000]); c2 += b.dv; stair.push([b.end + 0.0001, c2 / 1000]); }
      stair.push([196, c2 / 1000]);
      const cv = UI.canvas(page.querySelector('#stair-cv'), (ctx, w, h) => {
        const T = UI.tok();
        const { X, Y } = UI.chart(ctx, w, h, {
          series: [{ data: stair, color: T.accent, width: 2.2, fill: true }],
          xMin: 0, xMax: 196, yMin: 0, yMax: 19, xLabel: 'ground elapsed time (h)', yLabel: 'cumulative Δv (km/s)',
        });
        ctx.font = `11px ${T.mono}`; ctx.fillStyle = T.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        let cc = 0;
        for (const b of BURNS) {
          cc += b.dv;
          if (b.dv < 500 && b.dv !== 0) continue;
          const lbl = b.name.replace(/ \(.*\)/, '').replace('Powered descent to landing', 'Landing').replace('Launch to Earth parking orbit', 'Launch').replace('Lunar orbit insertion 1', 'LOI').replace('Trans-lunar injection', 'TLI').replace('Trans-Earth injection', 'TEI').replace(/Entry.*/, 'Entry');
          const right = b.ch === 'landing' && lbl !== 'Landing';
          ctx.textAlign = right ? 'right' : 'left';
          ctx.fillText(lbl, right ? X(b.t) - 4 : Math.min(w - 60, X(b.t) + 4), Y(cc / 1000) - 4);
        }
      });

      // --- hero animation: free-return trajectory in the rotating frame
      const sim = Phys.simulateTLI({ dv: 3160, burnAngle: -132.1784 });
      const w0 = Phys.EM.w;
      const rot = sim.pts.map((p) => {
        const th = w0 * p.t, dx = p.x - p.ex, dy = p.y - p.ey;
        return { t: p.t, x: dx * Math.cos(th) + dy * Math.sin(th), y: -dx * Math.sin(th) + dy * Math.cos(th) };
      });
      let prog = UI.reducedMotion() ? 1 : 0;
      const hero = UI.canvas(page.querySelector('#hero-cv'), null);
      const draw = (ctx, w, h) => {
        const T = UI.tok();
        ctx.clearRect(0, 0, w, h);
        UI.stars(ctx, w, h, T, 90);
        const s = (w * 0.72) / Phys.C.DEM, cx = w * 0.16, cy = h * 0.5;
        const P = (x, y) => [cx + x * s, cy - y * s];
        // Moon orbit arc
        ctx.strokeStyle = T.line; ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, Phys.C.DEM * s, -0.5, 0.5); ctx.stroke(); ctx.setLineDash([]);
        const n = Math.max(2, Math.floor(rot.length * prog));
        ctx.strokeStyle = T.accent; ctx.lineWidth = 1.8; ctx.beginPath();
        for (let i = 0; i < n; i++) { const [x, y] = P(rot[i].x, rot[i].y); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        UI.drawEarth(ctx, cx, cy, Math.max(3, Phys.C.RE * s), T);
        const [mx, my] = P(Phys.C.DEM, 0);
        UI.drawMoon(ctx, mx, my, Math.max(2, Phys.C.RM * s), T);
        const last = rot[n - 1], [sx, sy] = P(last.x, last.y);
        ctx.fillStyle = T.ink; ctx.beginPath(); ctx.arc(sx, sy, 3, 0, 7); ctx.fill();
        ctx.font = `10px ${T.mono}`; ctx.fillStyle = T.muted; ctx.textAlign = 'center';
        ctx.fillText('EARTH', cx, cy + 16); ctx.fillText('MOON', mx, my + 14);
        ctx.textAlign = 'left'; ctx.fillStyle = T.ink;
        ctx.fillText('GET ' + UI.fmtTime(last.t), w * 0.32, h * 0.86);
      };
      hero.draw = draw; hero.redraw();
      if (!UI.reducedMotion()) {
        let hold = 0;
        UI.loop((dt) => {
          if (prog >= 1) { hold += dt; if (hold > 2.5) { prog = 0; hold = 0; } }
          else prog = Math.min(1, prog + dt / 7);
          hero.redraw();
        });
      }
      void cv;
    },
  });
})();
