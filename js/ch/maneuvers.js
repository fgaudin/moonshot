/* Chapter 5 — Orbital manoeuvres: Hohmann, plane change, bi-elliptic, rendezvous. Lab: transfer & rendezvous planner. */
(function () {
  'use strict';
  const { C } = Phys;

  App.chapter({
    id: 'maneuvers', phase: 'Manoeuvres', title: 'Orbital Manoeuvres', lab: 'Transfer & rendezvous planner',
    blurb: 'Hohmann transfers, plane changes and rendezvous. To catch someone ahead of you, slow down.',
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: 'Phase 5 · Manoeuvres',
          title: 'Orbital Manoeuvres',
          lede: 'A rocket burn changes the velocity at one point, and the orbit through that point changes with it. Changing orbits means choosing where to burn.',
          refs: ['Sellers · Maneuvering in Space', 'BMW ch. 3 Basic Orbital Maneuvers'],
        })}

        <section class="section">
          <h2><span class="idx">5.1</span>The Hohmann transfer</h2>
          <div class="prose">
            <p>Walter Hohmann showed in 1925 that the cheapest two-impulse way between coplanar circular orbits is an ellipse tangent to both. Its perigee touches the inner orbit and its apogee the outer one. Both burns are made along the velocity, where they change energy most efficiently:</p>
            <div class="eq">\\[ a_t = \\frac{r_1 + r_2}{2} \\]</div>
            ${Sym.where(['at', 'r1', 'r2'])}
            <div class="eq">\\[ \\Delta v_1 = \\sqrt{\\mu\\left(\\frac{2}{r_1}-\\frac{1}{a_t}\\right)} - \\sqrt{\\frac{\\mu}{r_1}}, \\qquad \\Delta v_2 = \\sqrt{\\frac{\\mu}{r_2}} - \\sqrt{\\mu\\left(\\frac{2}{r_2}-\\frac{1}{a_t}\\right)} \\]</div>
            ${Sym.where(['dv1', 'dv2', 'mu', 'r1', 'r2', 'at'], 'Each burn = (speed on the new orbit at that point, from vis-viva) − (speed on the old orbit at that point).')}
            <div class="eq">\\[ \\mathrm{TOF} = \\pi\\sqrt{\\frac{a_t^3}{\\mu}} \\]</div>
            ${Sym.where(['tof', 'pi', 'at', 'mu'])}
            <p>The orbits here are circular, but the method is general: every burn sets the energy (vis-viva) and angular momentum at that point, and the new orbit follows.</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.2</span>Plane changes</h2>
          <div class="prose">
            <p>To tilt an orbit, the velocity vector must be rotated through the angle \\(\\Delta i\\) at one of the nodes, where the two planes intersect. With constant speed, the velocity triangle is isosceles:</p>
            <div class="eq">\\[ \\Delta v_{plane} = 2\\,v\\,\\sin\\frac{\\Delta i}{2} \\]</div>
            ${Sym.where(['dvplane', 'v', 'di'])}
            <p>A 28.5° plane change in low Earth orbit costs 3.8 km/s, nearly half of what it took to get there. Do it where the spacecraft is slowest (at apogee) and combine it with a burn you need anyway; the law of cosines then gives the combined cost:</p>
            <div class="eq">\\[ \\Delta v = \\sqrt{v_i^2 + v_f^2 - 2\\,v_i v_f\\cos\\Delta i} \\]</div>
            ${Sym.where(['dv', 'vi', 'vf', 'di'], 'The law of cosines (Al-Kashi in French schools) applied to the triangle of the two velocity vectors.')}
            <p>Geostationary missions combine the final circularization with the plane change at apogee for exactly this reason. Try it in the lab.</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.3</span>Lab: plan a transfer</h2>
          <div class="lab" id="mv">
            <div class="lab-head"><span class="tag">Lab</span><h3>Transfer &amp; rendezvous planner</h3><span class="spacer"></span>
              <div class="btn-row"><button class="btn" data-p="geo">LEO → GEO</button><button class="btn" data-p="iss">Shuttle → Hubble</button><button class="btn" data-p="moon">LEO → Moon distance</button><button class="btn" data-p="lor">LM → CSM (Moon)</button></div></div>
            <div class="stage" style="min-height:460px"><canvas id="mv-cv" aria-label="Hohmann transfer between two circular orbits with a target spacecraft"></canvas><div class="overlay" id="mv-ov"></div></div>
            <div class="controls">
              <div class="ctl"><label for="mv-body"><span>Central body</span></label><select id="mv-body"><option value="earth">Earth</option><option value="moon">Moon</option></select></div>
              ${UI.slider({ id: 'mv-h1', label: 'Initial orbit altitude', min: 0, max: 1, step: 0.001, value: 0.027 })}
              ${UI.slider({ id: 'mv-h2', label: 'Final orbit altitude', min: 0, max: 1, step: 0.001, value: 0.694 })}
              ${UI.slider({ id: 'mv-di', label: 'Plane change Δi', min: 0, max: 60, step: 0.5, value: 28.5, unit: '°' })}
              <div class="ctl"><label for="mv-split"><span>Plane change done…</span></label><select id="mv-split"><option value="combined">combined with apogee burn</option><option value="separate">separately, at r₂</option><option value="leo">separately, at r₁</option></select></div>
              <dl class="readout" id="mv-ro"></dl>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.4</span>When Hohmann is not the cheapest</h2>
          <div class="prose">
            <p>For \\(r_2/r_1 > 11.94\\) a <b>bi-elliptic</b> transfer is cheaper. It burns out to a far apoapsis \\(r_b > r_2\\), raises its periapsis there for almost nothing, then falls back and circularizes at \\(r_2\\). The flight takes much longer. The lab shows the bi-elliptic cost, with \\(r_b = 3 r_2\\), whenever the ratio is large enough. In practice the time penalty usually rules it out.</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.5</span>Rendezvous: lunar orbit rendezvous</h2>
          <div class="prose">
            <p>A chaser in a lower orbit moves faster in angle than its target, so it gains on it. To meet with a Hohmann transfer, the chaser must start when the target is ahead by the <b>lead angle</b>. The target then travels \\(\\omega_{tgt}\\,\\mathrm{TOF}\\) while the chaser travels 180°:</p>
            <div class="eq">\\[ \\alpha_{lead} = \\pi - \\omega_{tgt}\\,\\mathrm{TOF}, \\qquad \\omega_{tgt} = \\sqrt{\\mu / r_2^3} \\]</div>
            ${Sym.where(['alead', 'pi', 'wtgt', 'tof', 'r2', 'mu'])}
            <p>If the geometry is wrong, wait. The relative angle changes at \\(\\omega_{chaser} - \\omega_{tgt}\\) per second, giving a <b>synodic period</b> between opportunities. To catch up with a target ahead in the <i>same</i> orbit, burn retrograde, drop into a lower and faster phasing orbit, and come back up. In orbit you slow down to speed up.</p>
            <div class="callout history"><b>Houbolt’s gamble</b>In 1961 NASA engineer John Houbolt argued, against fierce opposition, that the CSM should stay in lunar orbit while a light, specialized lander went down and came back up to rendezvous. Lunar orbit rendezvous cut the mass to be landed and relaunched so much that a single Saturn V could do the job. No one had yet performed a rendezvous in space. Gemini 6A and 7 did it in December 1965 and proved it possible. Apollo 11’s ascent stage met Columbia about 3.5 hours after leaving Tranquility Base, using the coelliptic sequence (CSI, CDH, TPI) that Buzz Aldrin had helped develop for his doctoral thesis.</div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>Check yourself</h2>
          <div id="practice-slot"></div>
        </section>
        ${App.next('maneuvers')}`;

      mountPlanner(page.querySelector('#mv'));
      Practice.embed(page.querySelector('#practice-slot'), 'maneuvers', 3);
    },
  });

  function mountPlanner(root) {
    const BODY = {
      earth: { mu: C.muE, R: C.RE, lo: 150e3, hi: 400000e3, name: 'Earth' },
      moon: { mu: C.muM, R: C.RM, lo: 10e3, hi: 60000e3, name: 'Moon' },
    };
    let body = BODY.earth, plan = null, t = 0;
    const altOf = (u) => body.lo * Math.pow(body.hi / body.lo, u);
    const uOf = (alt) => Math.log(alt / body.lo) / Math.log(body.hi / body.lo);
    const presets = {
      geo: { body: 'earth', h1: 185e3, h2: 35786e3, di: 28.5, split: 'combined' },
      iss: { body: 'earth', h1: 300e3, h2: 560e3, di: 0, split: 'combined' },
      moon: { body: 'earth', h1: 185e3, h2: 384400e3 - C.RE, di: 0, split: 'combined' },
      lor: { body: 'moon', h1: 18e3, h2: 111e3, di: 0, split: 'combined' },
    };
    const view = UI.canvas(root.querySelector('#mv-cv'), null);

    const km = (m) => UI.fmt(m / 1000, 0);
    const fmts = { 'mv-h1': (u) => km(altOf(u)) + ' km', 'mv-h2': (u) => km(altOf(u)) + ' km', 'mv-di': (x) => x.toFixed(1) };
    const ctl = UI.bindControls(root, fmts, (v) => {
      body = BODY[v['mv-body']];
      const mu = body.mu;
      let r1 = body.R + altOf(v['mv-h1']), r2 = body.R + altOf(v['mv-h2']);
      const down = r2 < r1;
      const at = (r1 + r2) / 2;
      const v1 = Math.sqrt(mu / r1), v2 = Math.sqrt(mu / r2);
      const vtp = Math.sqrt(mu * (2 / r1 - 1 / at)), vta = Math.sqrt(mu * (2 / r2 - 1 / at));
      const di = v['mv-di'] * Math.PI / 180;
      let dv1 = Math.abs(vtp - v1), dv2 = Math.abs(v2 - vta), dvp = 0;
      const split = v['mv-split'];
      if (di > 0) {
        if (split === 'combined') dv2 = Math.sqrt(vta * vta + v2 * v2 - 2 * vta * v2 * Math.cos(di));
        else if (split === 'separate') dvp = 2 * v2 * Math.sin(di / 2);
        else dvp = 2 * v1 * Math.sin(di / 2);
      }
      const tof = Math.PI * Math.sqrt(at * at * at / mu);
      const w2 = Math.sqrt(mu / (r2 * r2 * r2)), w1 = Math.sqrt(mu / (r1 * r1 * r1));
      const lead = Math.PI - w2 * tof;
      const syn = 2 * Math.PI / Math.abs(w1 - w2);
      // bi-elliptic with rb = 3 r2
      let bi = null;
      const ratio = Math.max(r1, r2) / Math.min(r1, r2);
      if (!down && ratio > 11.94) {
        const rb = 3 * r2, a1 = (r1 + rb) / 2, a2 = (r2 + rb) / 2;
        const b1 = Math.sqrt(mu * (2 / r1 - 1 / a1)) - v1;
        const b2 = Math.sqrt(mu * (2 / rb - 1 / a2)) - Math.sqrt(mu * (2 / rb - 1 / a1));
        const b3 = Math.sqrt(mu * (2 / r2 - 1 / a2)) - v2;
        bi = { dv: b1 + b2 + Math.abs(b3), tof: Math.PI * (Math.sqrt(a1 ** 3 / mu) + Math.sqrt(a2 ** 3 / mu)) };
      }
      plan = { r1, r2, at, e: Math.abs(r2 - r1) / (r1 + r2), v1, v2, vtp, vta, dv1, dv2, dvp, tof, w1, w2, lead, syn, down, bi, di };
      t = 0;
      const total = dv1 + dv2 + dvp;
      root.querySelector('#mv-ro').innerHTML = `
        <dt>v₁ circular</dt><dd>${UI.fmt(v1 / 1000, 3)} km/s</dd>
        <dt>v at transfer ${down ? 'apoapsis' : 'periapsis'}</dt><dd>${UI.fmt(vtp / 1000, 3)} km/s</dd>
        <dt>Δv₁</dt><dd>${UI.fmt(dv1, 1)} m/s</dd>
        <dt>v at transfer ${down ? 'periapsis' : 'apoapsis'}</dt><dd>${UI.fmt(vta / 1000, 3)} km/s</dd>
        <dt>v₂ circular</dt><dd>${UI.fmt(v2 / 1000, 3)} km/s</dd>
        <dt>Δv₂${di > 0 && split === 'combined' ? ' (incl. plane)' : ''}</dt><dd>${UI.fmt(dv2, 1)} m/s</dd>
        ${dvp ? `<dt>Plane change alone</dt><dd>${UI.fmt(dvp, 1)} m/s</dd>` : ''}
        <dt>Total Δv</dt><dd class="hl">${UI.fmt(total, 1)} m/s</dd>
        <dt>Time of flight</dt><dd>${UI.fmtTime(tof)}</dd>
        <dt class="sub">Rendezvous with a target on orbit 2</dt>
        <dt>Lead angle α</dt><dd class="hl">${UI.fmt(((lead * 180 / Math.PI) % 360 + 540) % 360 - 180, 1)}°</dd>
        <dt>Synodic period</dt><dd>${UI.fmtTime(syn)}</dd>
        ${bi ? `<dt class="sub">Bi-elliptic (r_b = 3 r₂)</dt><dd></dd><dt>Total Δv</dt><dd style="color:${bi.dv < dv1 + dv2 ? 'var(--good)' : 'inherit'}">${UI.fmt(bi.dv, 1)} m/s</dd><dt>Time of flight</dt><dd>${UI.fmtTime(bi.tof)}</dd>` : ''}`;
    });
    root.querySelector('#mv-body').addEventListener('change', () => ctl.update());
    root.querySelector('#mv-split').addEventListener('change', () => ctl.update());
    root.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const p = presets[b.dataset.p];
      root.querySelector('#mv-body').value = p.body; body = BODY[p.body];
      ctl.set('mv-h1', uOf(p.h1)); ctl.set('mv-h2', uOf(p.h2)); ctl.set('mv-di', p.di);
      root.querySelector('#mv-split').value = p.split;
      ctl.update();
    }));

    // position on transfer at time tt after burn 1
    function onTransfer(tt) {
      const { r1, r2, at, e, down } = plan;
      const n = Math.sqrt(body.mu / (at * at * at));
      // an upward transfer starts at periapsis, a downward one at apoapsis (M = π)
      const E = Phys.solveKepler(n * tt + (down ? Math.PI : 0), e);
      const nu = Phys.trueFromEcc(E, e);
      const r = at * (1 - e * Math.cos(E));
      void r1; void r2;
      return { r, ang: down ? nu - Math.PI : nu };
    }

    view.draw = (ctx, w, h) => {
      if (!plan) return;
      const T = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, T);
      const { r1, r2, at, e, tof, w1, w2, lead, down } = plan;
      const rmax = Math.max(r1, r2);
      const s = (Math.min(w, h) / 2 - 30) / rmax;
      // centre shifted so the transfer ellipse is centred
      const cx = w / 2 + (down ? -1 : 1) * at * e * s * 0.5, cy = h / 2;
      const P = (r, a) => [cx + r * Math.cos(a) * s, cy - r * Math.sin(a) * s];
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = T.muted; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(cx, cy, r1 * s, 0, 7); ctx.stroke();
      ctx.strokeStyle = T.trace; ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(cx, cy, r2 * s, 0, 7); ctx.stroke();
      // transfer half-ellipse
      ctx.strokeStyle = T.accent; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const st = onTransfer(tof * i / 200); const [x, y] = P(st.r, st.ang); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
      const bodyR = Math.max(3, body.R * s);
      if (body.name === 'Earth') UI.drawEarth(ctx, cx, cy, bodyR, T); else UI.drawMoon(ctx, cx, cy, bodyR, T);
      // timeline: 0..tof transfer, then coast on orbit 2 for half a revolution
      const cycle = tof + Math.PI / w2;
      const tt = t % cycle;
      let chaser;
      if (tt < tof) { const st = onTransfer(tt); chaser = P(st.r, st.ang); }
      else chaser = P(r2, Math.PI + w2 * (tt - tof));
      const target = P(r2, lead + w2 * tt);
      // burn markers
      const [b1x, b1y] = P(r1, 0), [b2x, b2y] = P(r2, Math.PI);
      ctx.font = `10px ${T.mono}`; ctx.fillStyle = T.accent; ctx.textAlign = 'left';
      ctx.beginPath(); ctx.arc(b1x, b1y, 5, 0, 7); ctx.fill(); ctx.fillText('Δv₁', b1x + 8, b1y - 6);
      ctx.beginPath(); ctx.arc(b2x, b2y, 5, 0, 7); ctx.fill(); ctx.textAlign = 'right'; ctx.fillText('Δv₂ · meet', b2x - 8, b2y - 6);
      // lead angle wedge at t=0
      ctx.strokeStyle = T.trace; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(...P(r2, 0)); ctx.moveTo(cx, cy); ctx.lineTo(...P(r2, lead)); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(r1, r2) * s * 0.55, -lead, 0, lead < 0); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = T.trace; ctx.textAlign = 'left';
      const [lx, ly] = P(Math.min(r1, r2) * 0.62, lead / 2); ctx.fillText('α', lx, ly);
      // craft
      ctx.fillStyle = T.trace; ctx.beginPath(); ctx.arc(target[0], target[1], 5, 0, 7); ctx.fill();
      ctx.fillStyle = T.accent; ctx.beginPath(); ctx.arc(chaser[0], chaser[1], 5, 0, 7); ctx.fill();
      ctx.strokeStyle = T.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(chaser[0], chaser[1], 5, 0, 7); ctx.stroke();
      const lab = body.name === 'Moon' ? ['LM', 'CSM'] : ['chaser', 'target'];
      root.querySelector('#mv-ov').innerHTML = `<span style="color:var(--accent)">●</span> ${lab[0]} &nbsp; <span style="color:var(--trace)">●</span> ${lab[1]}<br>t = ${UI.fmtTime(tt)} ${tt < tof ? '· on transfer' : '· docked, coasting'}`;
      void w1;
    };

    UI.loop((dt) => {
      if (!plan) return;
      const cycle = plan.tof + Math.PI / plan.w2;
      t += dt * cycle / 9;
      view.redraw();
    });
    ctl.update();
  }
})();
