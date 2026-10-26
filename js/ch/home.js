/* Home: the mission at a glance. */
(function () {
  'use strict';
  // Apollo 11 major manoeuvres, approximate values from the Apollo 11 Mission Report (MSC-00171).
  // name/short/who are marked with N and translated at display time; short is the canvas label
  const BURNS = [
    { t: 0, end: 0.195, name: N`Launch to Earth parking orbit`, short: N`Launch`, dv: 9300, who: N`Saturn V`, ch: 'ascent', note: N`7.8 km/s orbital speed + ~1.5 km/s gravity & drag losses` },
    { t: 2.73, end: 2.83, name: N`Trans-lunar injection (TLI)`, short: N`TLI`, dv: 3182, who: N`S-IVB`, ch: 'moon' },
    { t: 3.3, end: 3.4, name: N`Transposition, docking and LM extraction`, dv: 0, who: N`CSM RCS`, ch: 'docking' },
    { t: 26.7, end: 26.7, name: N`Midcourse correction 2`, dv: 6.4, who: N`CSM SPS`, ch: 'moon' },
    { t: 75.8, end: 75.9, name: N`Lunar orbit insertion 1`, short: N`LOI`, dv: 889, who: N`CSM SPS`, ch: 'moon' },
    { t: 80.2, end: 80.2, name: N`Lunar orbit insertion 2`, dv: 48, who: N`CSM SPS`, ch: 'maneuvers' },
    { t: 101.6, end: 101.6, name: N`Descent orbit insertion`, dv: 23, who: N`LM DPS`, ch: 'maneuvers' },
    { t: 102.55, end: 102.75, name: N`Powered descent to landing`, short: N`Landing`, dv: 2050, who: N`LM DPS`, ch: 'landing' },
    { t: 124.37, end: 124.49, name: N`Lunar ascent`, dv: 1850, who: N`LM APS`, ch: 'landing', right: true },
    { t: 128.05, end: 128.05, name: N`Docking with Eagle in lunar orbit`, dv: 0, who: N`CSM RCS`, ch: 'docking' },
    { t: 135.4, end: 135.45, name: N`Trans-Earth injection (TEI)`, short: N`TEI`, dv: 1001, who: N`CSM SPS`, ch: 'moon' },
    { t: 195.05, end: 195.3, name: N`Entry, from 11.03 km/s to 0 by drag`, short: N`Entry`, dv: 0, who: N`Heat shield`, ch: 'entry' },
  ];

  App.chapter({
    id: 'home', phase: N`Pre-launch`, title: N`The Mission`,
    render(page) {
      const P = Progress, mods = P.ORDER;
      const tot = P.totals(), next = P.nextModule();
      const nextMod = next && P.MODULES[next];
      const patches = mods.map((id) => {
        const m = P.MODULES[id], c = App.chapters[id], n = P.count(id), all = m.objectives.length;
        return `<a class="patch-card ${P.complete(id) ? 'earned' : ''}" href="#${id}">
          <span data-patch-of="${id}" data-size="88">${P.patchSVG(id, P.complete(id), 88)}</span>
          <span class="pc-text"><span class="phase">${m.code} · ${T(c.phase)}</span><b>${T(m.name)}</b><span class="pc-sub">${T(c.title)} · ${T`lab: ${T(c.lab)}`}</span>
          <span class="meter" aria-label="${T`${n} of ${all} objectives`}"><i style="width:${100 * n / all}%"></i></span><span class="pc-sub">${T`${n}/${all} objectives`}</span></span></a>`;
      }).join('');
      const certified = tot.patches === mods.length;
      page.innerHTML = `
        <section class="hero">
          <div style="display:flex;flex-direction:column;gap:1.2rem;min-width:0">
            <span class="eyebrow">${T`Moonshot Academy · Astronaut Candidate Program`}</span>
            <h1>${T`How we went<br>to the <em>Moon</em>`}</h1>
            <p class="lede">${T`You have been selected. Between you and the launch pad stand nine training modules: the same physics Apollo’s crews and flight controllers had to master, from Newton’s laws to the heat shield. Each module has a briefing, a simulator to fly and objectives to meet. Earn all nine mission patches and you are <b>go for launch</b>.`}</p>
            <form class="enrol" id="enrol" autocomplete="off">
              <label for="callsign">${T`Your callsign`}</label>
              <input type="text" id="callsign" maxlength="24" placeholder="${T`e.g. Eagle, or your name`}" value="${P.callsign() === T('Candidate') ? '' : P.callsign().replace(/"/g, '&quot;')}">
              <button class="btn" type="submit">${T`Save`}</button>
              <span class="note" id="enrol-msg" aria-live="polite"></span>
            </form>
            <div class="btn-row">
              <a class="btn primary" href="#${next || 'practice'}">${next ? (tot.d ? T`Continue: ${nextMod.code} ${T(nextMod.name)} →` : T`Report for training: ${nextMod.code} →`) : T`Keep your skills sharp →`}</a>
              <a class="btn" href="#toolkit">${T`Ground school (math refreshers)`}</a>
              <a class="btn" href="#practice">${T`Simulator room`}</a>
            </div>
          </div>
          <figure style="margin:0;display:flex;flex-direction:column;gap:.5rem;align-items:center;min-width:0">
            <div class="stage-hero"><canvas id="hero-cv" aria-label="${T`Animated free-return trajectory from the Earth around the Moon and back, in the rotating Earth–Moon frame`}"></canvas></div>
            <figcaption class="note mono" id="hero-cap" style="font-size:.72rem;text-align:center">${T`Your flight plan: a free-return trajectory, integrated live. Earth–Moon rotating frame, to scale.`}</figcaption>
          </figure>
        </section>

        <section class="section" id="record">
          <h2><span class="idx">★</span>${T`Flight record: ${P.callsign()}`}</h2>
          <div class="record-sum">
            <span class="meter big" aria-label="${T`${tot.d} of ${tot.n} objectives`}"><i style="width:${100 * tot.d / tot.n}%"></i></span>
            <span class="mono note">${T`${tot.d} of ${tot.n} objectives · ${tot.patches} of ${mods.length} patches`}</span>
          </div>
          ${certified ? `<div class="certificate">
            <span class="eyebrow">${T`Moonshot Academy · Certificate of training`}</span>
            <b class="cert-name">${P.callsign()}</b>
            <p>${T`has completed all nine training modules of the Astronaut Candidate Program, from Newton’s cannon to atmospheric entry, and is hereby declared`}</p>
            <b class="cert-go">${T`GO FOR LAUNCH`}</b>
            <span class="mono note">${T`Vega, Chief Flight Instructor`} · ${new Date().toLocaleDateString(I18N.locale(), { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>` : ''}
          <div class="patch-grid">${patches}</div>
          <p class="note">${T`The modules follow the mission in order. The theory follows Sellers’ <i>Understanding Space</i> for physical intuition and Bate, Mueller &amp; White’s <i>Fundamentals of Astrodynamics</i> (BMW) for the mathematics. Objectives are checked by the simulators themselves; your record is kept in this browser.`}</p>
        </section>

        <div class="stats">
          <div><b class="num">2 938<small>t</small></b><span>${T`Saturn V mass at liftoff`}</span></div>
          <div><b class="num">${UI.dec('7.79')}<small>km/s</small></b><span>${T`circular speed in the 185 km parking orbit`}</span></div>
          <div><b class="num">${UI.dec('3.18')}<small>km/s</small></b><span>${T`trans-lunar injection burn, Apollo 11`}</span></div>
          <div><b class="num">384 400<small>km</small></b><span>${T`mean Earth–Moon distance`}</span></div>
          <div><b class="num">${UI.dec('11.03')}<small>km/s</small></b><span>${T`speed at entry interface, 122 km`}</span></div>
        </div>

        <section class="section">
          <h2><span class="idx">Δv</span>${T`The mission you are training for`}</h2>
          <div class="prose"><p>${T`Every phase of the flight is paid for in velocity change, Δv. The staircase adds up the major Apollo 11 manoeuvres against ground elapsed time. Reaching orbit costs more than everything that follows, which is why the Saturn V was 85% propellant by mass. Click a step to open the module that trains you for it.`}</p></div>
          <div class="lab" style="grid-template-columns:minmax(0,1fr)">
            <div class="stage" style="height:300px;min-height:0;background:var(--panel)"><canvas id="stair-cv"></canvas></div>
            <div class="scroll-x"><table class="data" id="burns"><thead><tr><th>${T`Manoeuvre`}</th><th>GET (h)</th><th>${T`Engine`}</th><th>Δv (m/s)</th><th>Σ Δv (km/s)</th></tr></thead><tbody></tbody></table></div>
          </div>
          <p class="note">${T`Approximate values from the Apollo 11 Mission Report. GET is ground elapsed time from liftoff, 16 July 1969, 13:32 UTC.`}</p>
        </section>

        <section class="section">
          <h2><span class="idx">↺</span>${T`Start over`}</h2>
          <div class="btn-row"><button class="btn" id="reset-prog">${T`Reset my training record`}</button><span class="note" id="reset-msg"></span></div>
        </section>`;

      page.querySelector('#enrol').addEventListener('submit', (e) => {
        e.preventDefault();
        P.setCallsign(page.querySelector('#callsign').value);
        page.querySelector('#enrol-msg').textContent = T`Welcome aboard, ${P.callsign()}.`;
        page.querySelector('#record h2').innerHTML = `<span class="idx">★</span>${T`Flight record: ${P.callsign()}`}`;
      });
      let armed = false;
      page.querySelector('#reset-prog').addEventListener('click', (e) => {
        if (!armed) { armed = true; e.target.textContent = T`Click again to erase all objectives and patches`; return; }
        P.reset(); App.go('home'); location.reload();
      });

      // --- staircase chart
      let cum = 0;
      const rows = BURNS.map((b) => { cum += b.dv; return { ...b, cum }; });
      const tb = page.querySelector('#burns tbody');
      tb.innerHTML = rows.map((b) => `<tr style="cursor:pointer" data-ch="${b.ch}"><td>${T(b.name)}</td><td>${UI.dec(b.t.toFixed(1))}</td><td>${T(b.who)}</td><td>${b.dv ? UI.fmt(b.dv, 0) : '—'}</td><td>${UI.dec((b.cum / 1000).toFixed(2))}</td></tr>`).join('');
      tb.addEventListener('click', (e) => { const tr = e.target.closest('tr'); if (tr) App.go(tr.dataset.ch); });
      const stair = [[0, 0]];
      let c2 = 0;
      for (const b of BURNS) { stair.push([b.t, c2 / 1000]); c2 += b.dv; stair.push([b.end + 0.0001, c2 / 1000]); }
      stair.push([196, c2 / 1000]);
      const cv = UI.canvas(page.querySelector('#stair-cv'), (ctx, w, h) => {
        const K = UI.tok();
        const { X, Y } = UI.chart(ctx, w, h, {
          series: [{ data: stair, color: K.accent, width: 2.2, fill: true }],
          xMin: 0, xMax: 196, yMin: 0, yMax: 19, xLabel: T`ground elapsed time (h)`, yLabel: T`cumulative Δv (km/s)`,
        });
        ctx.font = `11px ${K.mono}`; ctx.fillStyle = K.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        let cc = 0;
        for (const b of BURNS) {
          cc += b.dv;
          if (b.dv < 500 && b.dv !== 0) continue;
          const lbl = T(b.short || b.name), right = !!b.right;
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
        const K = UI.tok();
        ctx.clearRect(0, 0, w, h);
        UI.stars(ctx, w, h, K, 90);
        const s = (w * 0.72) / Phys.C.DEM, cx = w * 0.16, cy = h * 0.5;
        const P = (x, y) => [cx + x * s, cy - y * s];
        // Moon orbit arc
        ctx.strokeStyle = K.line; ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, Phys.C.DEM * s, -0.5, 0.5); ctx.stroke(); ctx.setLineDash([]);
        const n = Math.max(2, Math.floor(rot.length * prog));
        ctx.strokeStyle = K.accent; ctx.lineWidth = 1.8; ctx.beginPath();
        for (let i = 0; i < n; i++) { const [x, y] = P(rot[i].x, rot[i].y); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        UI.drawEarth(ctx, cx, cy, Math.max(3, Phys.C.RE * s), K);
        const [mx, my] = P(Phys.C.DEM, 0);
        UI.drawMoon(ctx, mx, my, Math.max(2, Phys.C.RM * s), K);
        const last = rot[n - 1], [sx, sy] = P(last.x, last.y);
        ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(sx, sy, 3, 0, 7); ctx.fill();
        ctx.font = `10px ${K.mono}`; ctx.fillStyle = K.muted; ctx.textAlign = 'center';
        ctx.fillText(T`EARTH`, cx, cy + 16); ctx.fillText(T`MOON`, mx, my + 14);
        ctx.textAlign = 'left'; ctx.fillStyle = K.ink;
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
