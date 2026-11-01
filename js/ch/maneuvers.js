/* Chapter 5 — Orbital manoeuvres: Hohmann, plane change, bi-elliptic, rendezvous. Lab: transfer & rendezvous planner. */
(function () {
  'use strict';
  const { C } = Phys;

  const fx = (n) => n.toFixed(1);
  const pct = (x, w) => (100 * x / w).toFixed(2) + '%';
  const lbsOf = (W, H) => (list) => list.map(([x, y, t, c]) => `<span class="lb ${c || ''}" style="left:${pct(x, W)};top:${pct(y, H)}">${t}</span>`).join('');
  const arrowSvg = (x1, y1, x2, y2, cls) => {
    const a = Math.atan2(y2 - y1, x2 - x1), h = (k) => `${fx(x2 - 9 * Math.cos(a + k))},${fx(y2 - 9 * Math.sin(a + k))}`;
    return `<path class="${cls}-ln" d="M${fx(x1)},${fx(y1)}L${fx(x2)},${fx(y2)}"/><path class="${cls}-fill" d="M${h(0.4)}L${fx(x2)},${fx(y2)}L${h(-0.4)}Z"/>`;
  };

  // Hohmann transfer, animated: a lap on r1, burn 1, the coast to apoapsis, burn 2, then half a lap on r2 (r2 = 2.2 r1, mu = 1)
  function figHohmann() {
    return `<figure class="fig hm" role="img" aria-label="${T`Animation of a Hohmann transfer. A spacecraft on a low circular orbit burns prograde and its orbit becomes an ellipse. It coasts half an orbit, slowing down as it climbs, then burns prograde again at the high point and stays on a larger circular orbit, where it moves slower than on the first one.`}">
      <div class="fig-box"><canvas class="hm-cv"></canvas><p class="hm-step" aria-hidden="true"></p></div>
      <figcaption>${T`Not to scale: the outer orbit is 2.2 times the inner one. The arrow is the velocity, drawn to scale, and its accent part is the Δv of each burn.`}</figcaption></figure>`;
  }
  function mountHohmann(fig) {
    if (!fig) return;
    const r1 = 1, r2 = 2.2, at = (r1 + r2) / 2, e = (r2 - r1) / (r1 + r2), b = at * Math.sqrt(1 - e * e);
    const spd = (r, a) => Math.sqrt(2 / r - 1 / a);
    const v1 = 1, vtp = spd(r1, at), vta = spd(r2, at), v2 = Math.sqrt(1 / r2);
    const k = 0.45, TB = 1.1;                                  // seconds of animation per time unit; burn duration
    const seg = [['c1', 1.5 * Math.PI * k], ['b1', TB], ['tr', Math.PI * at ** 1.5 * k], ['b2', TB], ['c2', Math.PI * r2 ** 1.5 * k], ['end', 0.9]];
    const total = seg.reduce((a, [, d]) => a + d, 0);
    const STEP = { c1: T`1 · Circular orbit r₁.`, b1: T`2 · Burn 1, prograde: the orbit becomes an ellipse.`, tr: T`3 · Coast half an orbit: the craft slows down as it climbs.`, b2: T`4 · Burn 2, prograde, at apoapsis: the orbit becomes the circle r₂.`, c2: T`5 · Circular orbit r₂, slower than on r₁.` };
    STEP.end = STEP.c2;
    const stepEl = fig.querySelector('.hm-step');
    let t = UI.reducedMotion() ? total - seg[5][1] - 0.5 : 0, shown = '', visible = true;
    // state at animation time t: phase, position (x, y in units of r1, y up), unit velocity direction, speed before and after a burn
    const at_ = (t) => {
      let i = 0, t0 = 0; while (i < seg.length - 1 && t >= t0 + seg[i][1]) { t0 += seg[i][1]; i++; }
      const ph = seg[i][0], u = (t - t0) / seg[i][1];
      if (ph === 'c1') { const th = Math.PI / 2 + 1.5 * Math.PI * u; return { ph, x: Math.cos(th), y: Math.sin(th), dx: -Math.sin(th), dy: Math.cos(th), v: v1 }; }
      if (ph === 'b1') return { ph, x: r1, y: 0, dx: 0, dy: 1, v: v1, v2: vtp, u };
      if (ph === 'tr') {
        const E = Phys.solveKepler(Math.PI * u, e), x = at * (Math.cos(E) - e), y = b * Math.sin(E);
        const tx = -at * Math.sin(E), ty = b * Math.cos(E), L = Math.hypot(tx, ty);
        return { ph, x, y, dx: tx / L, dy: ty / L, v: spd(Math.hypot(x, y), at) };
      }
      if (ph === 'b2') return { ph, x: -r2, y: 0, dx: 0, dy: -1, v: vta, v2, u };
      const th = Math.PI + Math.PI * (ph === 'c2' ? u : 1);
      return { ph, x: r2 * Math.cos(th), y: r2 * Math.sin(th), dx: -Math.sin(th), dy: Math.cos(th), v: v2 };
    };
    const order = ['c1', 'b1', 'tr', 'b2', 'c2', 'end'];
    const view = UI.canvas(fig.querySelector('.hm-cv'), (ctx, w, h) => {
      const K = UI.tok(), st = at_(t), n = order.indexOf(st.ph);
      const s = Math.min(w / 2 - 16, h / 2 - 16) / r2, cx = w / 2, cy = h / 2;
      const X = (x) => cx + x * s, Y = (y) => cy - y * s;
      ctx.clearRect(0, 0, w, h);
      // orbits: the current one strong, the others faint
      ctx.lineWidth = n <= 0 ? 2 : 1.2; ctx.strokeStyle = K.muted; ctx.globalAlpha = n <= 0 ? 1 : 0.6;
      ctx.beginPath(); ctx.arc(cx, cy, r1 * s, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      if (n >= 1) {
        ctx.strokeStyle = K.accent; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]); ctx.globalAlpha = n <= 3 ? 0.8 : 0.35;
        ctx.beginPath(); ctx.ellipse(cx - at * e * s, cy, at * s, b * s, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        if (n >= 2) {   // the half already flown
          const E1 = n === 2 ? Phys.solveKepler(Math.PI * Math.min(1, (t - seg[0][1] - seg[1][1]) / seg[2][1]), e) : Math.PI;
          ctx.lineWidth = n <= 3 ? 2 : 1.4; ctx.beginPath();
          for (let j = 0; j <= 60; j++) { const E = E1 * j / 60; const px = X(at * (Math.cos(E) - e)), py = Y(b * Math.sin(E)); j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
          ctx.stroke();
        }
      }
      ctx.strokeStyle = K.trace; ctx.lineWidth = n >= 4 ? 2 : 1.2; ctx.globalAlpha = n >= 4 ? 1 : 0.35; if (n < 4) ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, r2 * s, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      UI.drawEarth(ctx, cx, cy, Math.max(4, 0.32 * r1 * s), K);
      ctx.font = `11px ${K.mono}`; ctx.textAlign = 'left'; ctx.fillStyle = K.muted;
      ctx.fillText('r₁', X(0.72), Y(-0.72) + 4); ctx.fillStyle = K.trace; ctx.fillText('r₂', X(1.6), Y(-1.6) + 4);
      // burn points
      ctx.fillStyle = K.accent;
      if (n >= 1) { ctx.beginPath(); ctx.arc(X(r1), Y(0), 3.5, 0, 7); ctx.fill(); ctx.fillText('Δv₁', X(r1) + 7, Y(0) + 14); }
      if (n >= 3) { ctx.beginPath(); ctx.arc(X(-r2), Y(0), 3.5, 0, 7); ctx.fill(); ctx.textAlign = 'right'; ctx.fillText('Δv₂', X(-r2) - 6, Y(0) - 8); ctx.textAlign = 'left'; }
      // velocity arrow, to scale; during a burn the added part grows in the accent colour
      const L = 0.75 * r1 * s, px = X(st.x), py = Y(st.y), ux = st.dx, uy = -st.dy;
      if (st.v2) {
        const ease = st.u < 0.5 ? 2 * st.u * st.u : 1 - 2 * (1 - st.u) ** 2, vv = st.v + (st.v2 - st.v) * ease;
        UI.arrow(ctx, px, py, px + ux * st.v * L, py + uy * st.v * L, K.trace, 2);
        ctx.strokeStyle = K.accent; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px + ux * st.v * L, py + uy * st.v * L); ctx.lineTo(px + ux * vv * L, py + uy * vv * L); ctx.stroke();
        UI.arrow(ctx, px + ux * st.v * L, py + uy * st.v * L, px + ux * vv * L, py + uy * vv * L, K.accent, 2);
        ctx.globalAlpha = 0.25 + 0.5 * Math.sin(Math.PI * st.u); ctx.fillStyle = K.accent; ctx.beginPath(); ctx.arc(px, py, 10, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      } else UI.arrow(ctx, px, py, px + ux * st.v * L, py + uy * st.v * L, K.trace, 2);
      ctx.fillStyle = K.accent; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 7); ctx.fill();
      ctx.strokeStyle = K.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 7); ctx.stroke();
      if (shown !== st.ph) { shown = st.ph; stepEl.textContent = STEP[st.ph]; }
    });
    if (UI.reducedMotion()) return;
    const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; });
    io.observe(fig); UI.onCleanup(() => io.disconnect());
    UI.loop((dt) => { if (!visible) return; t = (t + dt) % total; view.redraw(); });
  }

  // velocity triangles: a pure plane change (same speed) and one combined with the circularization at apoapsis (GEO numbers)
  function figPlaneTriangle() {
    const W = 390, H = 150, lbs = lbsOf(W, H), D = Math.PI / 180, di = 28.5 * D;
    const ox = 18, oy = 112, L = 118;
    const ax = ox + L, bx = ox + L * Math.cos(di), by = oy - L * Math.sin(di);
    const qx = 196, sc = 50, vi = 1.595, vf = 3.074;
    const cx1 = qx + vi * sc, fx2 = qx + vf * sc * Math.cos(di), fy2 = oy - vf * sc * Math.sin(di), sx = qx + vf * sc;
    const arc = (x, r) => `<path class="f-ink-ln" d="M${x + r},${oy}A${r},${r} 0 0 0 ${fx(x + r * Math.cos(di))},${fx(oy - r * Math.sin(di))}"/>`;
    return `<figure class="fig" role="img" aria-label="${T`Two velocity triangles. Left: a plane change alone keeps the speed, so the old and new velocities have the same length and the Δv closes an isosceles triangle. Right: at the apoapsis of a transfer to geostationary orbit, the slow transfer velocity of 1.6 km/s and the circular velocity of 3.07 km/s differ in length and direction; one burn of 1.84 km/s joins their tips, shorter than circularizing first and turning afterwards.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        ${arrowSvg(ox, oy, ax, oy, 'af-v')}${arrowSvg(ox, oy, bx, by, 'af-v')}${arrowSvg(ax, oy, bx, by, 'af-f')}${arc(ox, 34)}
        <path class="f-mu f-dash" d="M${fx(cx1)},${oy}L${fx(sx)},${oy}L${fx(fx2)},${fx(fy2)}"/>
        ${arrowSvg(qx, oy, cx1, oy, 'af-v')}${arrowSvg(qx, oy, fx2, fy2, 'af-v')}${arrowSvg(cx1, oy, fx2, fy2, 'af-f')}${arc(qx, 30)}
      </svg>${lbs([
        [ox + L / 2, oy + 11, '<i>v</i>', 'tr'], [ox + 48, oy - 38, '<i>v</i>', 'tr'], [ax + 6, oy - 30, 'Δ<i>v</i>', 'acc l'], [ox + 40, oy - 9, 'Δ<i>i</i>', 'ink l'],
        [qx + vi * sc / 2, oy + 11, '<i>v<sub>a</sub></i>', 'tr'], [qx + 64, oy - 50, '<i>v<sub>GEO</sub></i>', 'tr r'], [cx1 + 30, oy - 40, UI.dec('1.84'), 'acc l'], [qx + 36, oy - 8, UI.dec('28.5') + '°', 'ink l'],
        [sx + 4, oy + 11, UI.dec('1.48') + ' + ' + UI.dec('1.51'), 'm r'],
        [ox + L / 2, 140, T`plane change alone`, 'm'], [W - 4, 140, T`combined at apoapsis`, 'm r'],
      ])}</div>
      <figcaption>${T`Left: turning the velocity without changing its length. Right: the burn at the apoapsis of a geostationary transfer. The dashed path circularizes first and turns afterwards, 2.99 km/s in all. The direct burn costs 1.84 km/s.`}</figcaption></figure>`;
  }

  // bi-elliptic: out to a far apoapsis r_b, raise the periapsis to r2 there, fall back and circularize at r2
  function figBiElliptic() {
    const W = 380, H = 240, lbs = lbsOf(W, H), x0 = 232, y0 = 120, r1 = 24, r2 = 70, rb = 200;
    const a1 = (r1 + rb) / 2, b1 = Math.sqrt(r1 * rb), a2 = (r2 + rb) / 2, b2 = Math.sqrt(r2 * rb);
    const dot = (x, n) => `<circle class="f-ac-fill" cx="${x}" cy="${y0}" r="3.5"/>`;
    return `<figure class="fig" role="img" aria-label="${T`Bi-elliptic transfer. A first burn on the inner circle sends the craft on a large ellipse out to a far apoapsis, well beyond the target orbit. There a small second burn raises the periapsis to the target radius. The craft falls back on a second ellipse and a third burn, against the motion, circularizes it on the target orbit.`}">
      <div class="fig-box"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <circle class="f-mu" cx="${x0}" cy="${y0}" r="${r1}"/><circle class="f-tr thin" cx="${x0}" cy="${y0}" r="${r2}"/>
        <path class="f-ac-ln thin" d="M${x0 + r1},${y0}A${fx(a1)},${fx(b1)} 0 0 0 ${x0 - rb},${y0}"/>
        <path class="f-ac-ln thin f-dash" d="M${x0 - rb},${y0}A${fx(a2)},${fx(b2)} 0 0 0 ${x0 + r2},${y0}"/>
        <path class="f-mu f-dash" d="M${x0 - 8},${y0}L${x0 - rb},${y0}"/><circle class="f-earth" cx="${x0}" cy="${y0}" r="8"/>
        ${dot(x0 + r1)}${dot(x0 - rb)}${dot(x0 + r2)}
      </svg>${lbs([
        [x0 + r1 + 3, y0 - 11, '① Δ<i>v</i>₁', 'acc l'], [x0 - rb + 6, y0 - 12, '② Δ<i>v</i>₂', 'acc l'], [x0 + r2 + 6, y0 + 12, '③ Δ<i>v</i>₃', 'acc l'],
        [x0 - 10, y0 - r1 - 8, '<i>r</i>₁', 'm'], [x0 + 30, y0 + r2 + 2, '<i>r</i>₂', 'tr'], [x0 - rb / 2 - 20, y0 - 9, '<i>r<sub>b</sub></i>', 'ink'],
      ])}</div>
      <figcaption>${T`Not to scale. ① Prograde: out to the far apoapsis r_b. ② Prograde, at r_b, where the craft is very slow: the periapsis rises to r₂ for little Δv. ③ Retrograde at r₂: the ellipse becomes the circle r₂.`.split('r_b').join('<i>r<sub>b</sub></i>')}</figcaption></figure>`;
  }
  App.css('maneuvers', `
    .hm-cv { display: block; width: 100%; aspect-ratio: 5 / 4; }
    .hm-step { margin: .3rem 0 0; min-height: 2.6em; font: 500 .8rem/1.3 var(--f-mono); color: var(--ink); }
    .af-v-ln { fill: none; stroke: var(--trace); stroke-width: 2; } .af-v-fill { fill: var(--trace); }
    .af-f-ln { fill: none; stroke: var(--accent); stroke-width: 2.4; } .af-f-fill { fill: var(--accent); }
    #mv-ro .sub i { text-transform: none; }`);

  App.chapter({
    id: 'maneuvers', phase: N`Manoeuvres`, title: N`Orbital Manoeuvres`, lab: N`Transfer & rendezvous planner`,
    blurb: N`Hohmann transfers, plane changes and rendezvous. To catch someone ahead of you, slow down.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('maneuvers')} · Manoeuvres`,
          title: T`Orbital Manoeuvres`,
          lede: T`A rocket burn changes the velocity at one point, and the orbit through that point changes with it. Changing orbits means choosing where to burn.`,
          refs: [T`Sellers · Maneuvering in Space`, T`BMW ch. 3 Basic Orbital Maneuvers`],
        })}
        ${Progress.briefing('maneuvers', { theory: 'theory', lab: 'mv', math: 'refresher', mathLabel: N`Trigonometry and the law of cosines.` })}

        <section class="section" id="theory">
          <h2><span class="idx">5.1</span>${T`The Hohmann transfer`}</h2>
          <div class="prose">
            <p>${T`Walter Hohmann showed in 1925 that the cheapest two-impulse way between coplanar circular orbits is an ellipse tangent to both. Its perigee touches the inner orbit and its apogee the outer one. Both burns are made along the velocity, where they change energy most efficiently:`}</p>
            <div class="eq">\\[ a_t = \\frac{r_1 + r_2}{2} \\]</div>
            ${Sym.where(['at', 'r1', 'r2'])}
            <div class="eq">\\[ \\Delta v_1 = \\sqrt{\\mu\\left(\\frac{2}{r_1}-\\frac{1}{a_t}\\right)} - \\sqrt{\\frac{\\mu}{r_1}}, \\qquad \\Delta v_2 = \\sqrt{\\frac{\\mu}{r_2}} - \\sqrt{\\mu\\left(\\frac{2}{r_2}-\\frac{1}{a_t}\\right)} \\]</div>
            ${Sym.where(['dv1', 'dv2', 'mu', 'r1', 'r2', 'at'], N`Each burn = (speed on the new orbit at that point, from vis-viva) − (speed on the old orbit at that point).`)}
            <div class="eq">\\[ \\mathrm{TOF} = \\pi\\sqrt{\\frac{a_t^3}{\\mu}} \\]</div>
            ${Sym.where(['tof', 'pi', 'at', 'mu'])}
            ${figHohmann()}
            <p>${T`The orbits here are circular, but the method is general: every burn sets the energy (vis-viva) and angular momentum at that point, and the new orbit follows.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.2</span>${T`Plane changes`}</h2>
          <div class="prose">
            <p>${T`To tilt an orbit, the velocity vector must be rotated through the angle \\(\\Delta i\\) at one of the nodes, where the two planes intersect. With constant speed, the velocity triangle is isosceles:`}</p>
            <div class="eq">\\[ \\Delta v_{plane} = 2\\,v\\,\\sin\\frac{\\Delta i}{2} \\]</div>
            ${Sym.where(['dvplane', 'v', 'di'])}
            <p>${T`A 28.5° plane change in low Earth orbit costs 3.8 km/s, nearly half of what it took to get there. Do it where the spacecraft is slowest (at apogee) and combine it with a burn you need anyway; the law of cosines then gives the combined cost:`}</p>
            <div class="eq">\\[ \\Delta v = \\sqrt{v_i^2 + v_f^2 - 2\\,v_i v_f\\cos\\Delta i} \\]</div>
            ${Sym.where(['dv', 'vi', 'vf', 'di'], N`The law of cosines (Al-Kashi in French schools) applied to the triangle of the two velocity vectors.`)}
            ${Primer.box('trig', false, 'refresher')}
            ${figPlaneTriangle()}
            <p>${T`Geostationary missions combine the final circularization with the plane change at apogee for exactly this reason. From a 185 km orbit inclined at 28.5°, the plan is flown in three steps:`}</p>
            <ol>
              <li>${T`<b>Burn 1 in low orbit, prograde, in the old plane.</b> It raises the apogee to 35 786 km: 2.46 km/s. Do not tilt here. At 7.8 km/s, turning the velocity by 28.5° would cost 3.84 km/s on its own.`}</li>
              <li>${T`<b>Coast half an orbit to apogee.</b> The plane can only be changed where the old and new planes cross, at a node. For geostationary orbit the new plane is the equator, so burn 1 is made as the craft crosses the equator. The apogee, half an orbit later, then lies over the equator too.`}</li>
              <li>${T`<b>Burn 2 at apogee does both jobs.</b> It raises the speed from 1.60 to 3.07 km/s and turns it by 28.5° in one burn of 1.84 km/s, instead of 1.48 km/s to circularize plus 1.51 km/s to turn. The engine points 53° out of the orbit plane from prograde, towards the side of the new plane. The total is 4.30 km/s.`}</li>
            </ol>
            <p>${T`A last refinement: moving about 2° of the tilt into burn 1 saves another 24 m/s, because a small turn added to a large burn costs almost nothing (the law of cosines again). Try the three options in the lab. Module ${Progress.code('planes')} returns to plane changes in full: finding the nodes, the prograde and normal components of the burn on the PAD, and the launch azimuth.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.3</span>${T`Lab: plan a transfer`}</h2>
          <div class="lab" id="mv">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Transfer & rendezvous planner`}</h3><span class="spacer"></span>
              <div class="btn-row"><button class="btn" data-p="geo">LEO → GEO</button><button class="btn" data-p="iss">${T`Shuttle → Hubble`}</button><button class="btn" data-p="moon">${T`LEO → Moon distance`}</button><button class="btn" data-p="lor">${T`LM → CSM (Moon)`}</button></div></div>
            <div class="stage" style="min-height:460px"><canvas id="mv-cv" aria-label="${T`Hohmann transfer between two circular orbits with a target spacecraft`}"></canvas><div class="overlay" id="mv-ov"></div></div>
            <div class="controls">
              <div class="ctl"><label for="mv-body"><span>${T`Central body`}</span></label><select id="mv-body"><option value="earth">${T`Earth`}</option><option value="moon">${T`Moon`}</option></select></div>
              ${UI.slider({ id: 'mv-h1', label: T`Initial orbit altitude`, min: 0, max: 1, step: 0.001, value: 0.027 })}
              ${UI.slider({ id: 'mv-h2', label: T`Final orbit altitude`, min: 0, max: 1, step: 0.001, value: 0.694 })}
              ${UI.slider({ id: 'mv-di', label: T`Plane change Δi`, min: 0, max: 60, step: 0.5, value: 28.5, unit: '°' })}
              <div class="ctl"><label for="mv-split"><span>${T`Plane change done…`}</span></label><select id="mv-split"><option value="leo">${T`separately, at r₁`}</option><option value="separate">${T`separately, at r₂`}</option><option value="combined">${T`combined with apogee burn`}</option></select></div>
              <dl class="readout" id="mv-ro"></dl>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.4</span>${T`When Hohmann is not the cheapest`}</h2>
          <div class="prose">
            <p>${T`Above \\(r_2/r_1 \\approx 15.58\\) a <b>bi-elliptic</b> transfer is cheaper than a Hohmann transfer for any far apoapsis \\(r_b > r_2\\). Between 11.94 and 15.58 it is cheaper only if \\(r_b\\) is far enough out. It burns out to a far apoapsis \\(r_b > r_2\\), raises its periapsis there for almost nothing, then falls back and circularizes at \\(r_2\\). The flight takes much longer. The lab shows the bi-elliptic cost, with \\(r_b = 3 r_2\\), whenever the ratio is large enough. In practice the time penalty usually rules it out.`}</p>
            ${figBiElliptic()}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">5.5</span>${T`Rendezvous: lunar orbit rendezvous`}</h2>
          <div class="prose">
            <p>${T`A chaser in a lower orbit moves faster in angle than its target, so it gains on it. To meet with a Hohmann transfer, the chaser must start when the target is ahead by the right angle, the <b>lead angle</b>: during the transfer the target moves on while the chaser travels 180°. The lab shows the lead angle for each transfer; module ${Progress.code('timing')} derives it, as the phase angle, and turns it into an ignition time.`}</p>
            <p>${T`If the geometry is wrong, wait. The relative angle changes at \\(\\omega_{chaser} - \\omega_{tgt}\\) per second, giving a <b>synodic period</b> between opportunities: the time until the same alignment comes round again (module ${Progress.code('timing')}). To catch up with a target ahead in the <i>same</i> orbit, burn <b>retrograde</b> (against the direction of flight; <b>prograde</b> is along it), drop into a lower and faster phasing orbit, and come back up. In orbit you slow down to speed up.`}</p>
            <div class="callout history"><b>${T`Houbolt’s gamble`}</b>${T`In 1961 NASA engineer John Houbolt argued, against fierce opposition, that the CSM should stay in lunar orbit while a light, specialized lander went down and came back up to rendezvous. Lunar orbit rendezvous cut the mass to be landed and relaunched so much that a single Saturn V could do the job. No one had yet performed a rendezvous in space. Gemini 6A and 7 did it in December 1965 and proved it possible. Apollo 11’s ascent stage met Columbia about 3.5 hours after leaving Tranquility Base, using the coelliptic sequence (CSI, CDH, TPI) that Buzz Aldrin had helped develop for his doctoral thesis.`}</div>
          </div>
        </section>

        ${Archive.capsule('gemini')}

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('maneuvers', { math: 'trig', mathLabel: N`Trigonometry and the law of cosines.` })}`;

      mountHohmann(page.querySelector('.hm'));
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
      geo: { body: 'earth', h1: 185e3, h2: 35786e3, di: 28.5, split: 'leo' },
      iss: { body: 'earth', h1: 300e3, h2: 560e3, di: 0, split: 'combined' },
      moon: { body: 'earth', h1: 185e3, h2: 384400e3 - C.RE, di: 0, split: 'combined' },
      lor: { body: 'moon', h1: 18e3, h2: 111e3, di: 0, split: 'combined' },
    };
    // objectives count only after the candidate has changed a control themselves (not a preset)
    let touched = false;
    root.addEventListener('input', () => { touched = true; }, true);
    root.addEventListener('change', (e) => { touched = e.target.id !== '-'; }, true);
    const view = UI.canvas(root.querySelector('#mv-cv'), null);

    const km = (m) => UI.fmt(m / 1000, 0);
    const fmts = { 'mv-h1': (u) => km(altOf(u)) + ' km', 'mv-h2': (u) => km(altOf(u)) + ' km', 'mv-di': (x) => UI.dec(x.toFixed(1)) };
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
      if (touched && body === BODY.earth && altOf(v['mv-h1']) <= 400e3 && Math.abs(altOf(v['mv-h2']) - 35786e3) < 500e3 && v['mv-di'] >= 28 && total < 4400) Progress.done('maneuvers', 'geo');
      if (body === BODY.moon && r2 > r1) Progress.done('maneuvers', 'lor');
      root.querySelector('#mv-ro').innerHTML = `
        <dt>${T`v₁ circular`}</dt><dd>${UI.fmt(v1 / 1000, 3)} km/s</dd>
        <dt>${down ? T`v at transfer apoapsis` : T`v at transfer periapsis`}</dt><dd>${UI.fmt(vtp / 1000, 3)} km/s</dd>
        <dt>Δv₁</dt><dd>${UI.fmt(dv1, 1)} m/s</dd>
        <dt>${down ? T`v at transfer periapsis` : T`v at transfer apoapsis`}</dt><dd>${UI.fmt(vta / 1000, 3)} km/s</dd>
        <dt>${T`v₂ circular`}</dt><dd>${UI.fmt(v2 / 1000, 3)} km/s</dd>
        <dt>Δv₂${di > 0 && split === 'combined' ? T` (incl. plane)` : ''}</dt><dd>${UI.fmt(dv2, 1)} m/s</dd>
        ${dvp ? `<dt>${T`Plane change alone`}</dt><dd>${UI.fmt(dvp, 1)} m/s</dd>` : ''}
        <dt>${T`Total Δv`}</dt><dd class="hl">${UI.fmt(total, 1)} m/s</dd>
        <dt>${T`Time of flight`}</dt><dd>${UI.fmtTime(tof)}</dd>
        <dt class="sub">${T`Rendezvous with a target on orbit 2`}</dt>
        <dt>${T`Lead angle α`}</dt><dd class="hl">${UI.fmt(((lead * 180 / Math.PI) % 360 + 540) % 360 - 180, 1)}°</dd>
        <dt>${T`Synodic period`}</dt><dd>${UI.fmtTime(syn)}</dd>
        ${bi ? `<dt class="sub">${T`Bi-elliptic (<i>r<sub>b</sub></i> = 3 <i>r</i>₂)`}</dt><dt>${T`Total Δv`}</dt><dd style="color:${bi.dv < dv1 + dv2 ? 'var(--good)' : 'inherit'}">${UI.fmt(bi.dv, 1)} m/s</dd><dt>${T`Time of flight`}</dt><dd>${UI.fmtTime(bi.tof)}</dd>` : ''}`;
    });
    root.querySelector('#mv-body').addEventListener('change', () => ctl.update());
    root.querySelector('#mv-split').addEventListener('change', () => ctl.update());
    root.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const p = presets[b.dataset.p];
      touched = false;
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
      const tk = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, tk);
      const { r1, r2, at, e, tof, w1, w2, lead, down } = plan;
      const rmax = Math.max(r1, r2);
      const s = (Math.min(w, h) / 2 - 30) / rmax;
      // centre shifted so the transfer ellipse is centred
      const cx = w / 2 + (down ? -1 : 1) * Math.min(at * e * s * 0.5, Math.max(0, w / 2 - rmax * s - 10)), cy = h / 2;
      const P = (r, a) => [cx + r * Math.cos(a) * s, cy - r * Math.sin(a) * s];
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = tk.muted; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(cx, cy, r1 * s, 0, 7); ctx.stroke();
      ctx.strokeStyle = tk.trace; ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(cx, cy, r2 * s, 0, 7); ctx.stroke();
      // transfer half-ellipse
      ctx.strokeStyle = tk.accent; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const st = onTransfer(tof * i / 200); const [x, y] = P(st.r, st.ang); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
      const bodyR = Math.max(3, body.R * s);
      if (body.name === 'Earth') UI.drawEarth(ctx, cx, cy, bodyR, tk); else UI.drawMoon(ctx, cx, cy, bodyR, tk);
      // timeline: 0..tof transfer, then coast on orbit 2 for half a revolution
      const cycle = tof + Math.PI / w2;
      const tt = t % cycle;
      let chaser;
      if (tt < tof) { const st = onTransfer(tt); chaser = P(st.r, st.ang); }
      else chaser = P(r2, Math.PI + w2 * (tt - tof));
      const target = P(r2, lead + w2 * tt);
      // burn markers
      const [b1x, b1y] = P(r1, 0), [b2x, b2y] = P(r2, Math.PI);
      ctx.font = `10px ${tk.mono}`; ctx.fillStyle = tk.accent; ctx.textAlign = 'left';
      ctx.beginPath(); ctx.arc(b1x, b1y, 5, 0, 7); ctx.fill(); ctx.fillText('Δv₁', b1x + 8, b1y - 6);
      ctx.beginPath(); ctx.arc(b2x, b2y, 5, 0, 7); ctx.fill(); ctx.textAlign = 'right'; ctx.fillText(T`Δv₂ · meet`, b2x - 8, b2y - 6);
      // lead angle wedge at t=0
      ctx.strokeStyle = tk.trace; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(...P(r2, 0)); ctx.moveTo(cx, cy); ctx.lineTo(...P(r2, lead)); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(r1, r2) * s * 0.55, -lead, 0, lead < 0); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = tk.trace; ctx.textAlign = 'left';
      const [lx, ly] = P(Math.min(r1, r2) * 0.62, lead / 2); ctx.fillText('α', lx, ly);
      // craft
      ctx.fillStyle = tk.trace; ctx.beginPath(); ctx.arc(target[0], target[1], 5, 0, 7); ctx.fill();
      ctx.fillStyle = tk.accent; ctx.beginPath(); ctx.arc(chaser[0], chaser[1], 5, 0, 7); ctx.fill();
      ctx.strokeStyle = tk.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(chaser[0], chaser[1], 5, 0, 7); ctx.stroke();
      const lab = body.name === 'Moon' ? ['LM', 'CSM'] : [T`chaser`, T`target`];
      root.querySelector('#mv-ov').innerHTML = `<span style="color:var(--accent)">●</span> ${lab[0]} &nbsp; <span style="color:var(--trace)">●</span> ${lab[1]}<br>t = ${UI.fmtTime(tt)} ${tt < tof ? T`· on transfer` : T`· docked, coasting`}`;
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
