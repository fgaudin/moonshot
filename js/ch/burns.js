/* Chapter — Planning a burn: the maneuver frame, Δv components, burn time, finite burns, the PAD.
   Lab: a maneuver computer in Earth orbit (planar): enter the burns, the computer flies them as finite burns. */
(function () {
  'use strict';
  const { C, Orbit2D } = Phys;
  const mu = C.muE, RE = C.RE;

  const VEHICLES = {
    csm: { name: N`Apollo CSM (SPS engine, 91 kN)`, m0: 28800, F: 91200, isp: 314 },
    low: { name: N`Small upper stage (8 kN)`, m0: 10000, F: 8000, isp: 450 },
  };
  const circ = (alt) => [RE + alt, 0, 0, Math.sqrt(mu / (RE + alt))];
  const atPeri = (pAlt, aAlt) => { const rp = RE + pAlt, ra = RE + aAlt, a = (rp + ra) / 2; return [rp, 0, 0, Math.sqrt(mu * (2 / rp - 1 / a))]; };
  const vis = (r, a) => Math.sqrt(mu * (2 / r - 1 / a));

  // Each scenario: start orbit, vehicle, task, and Mission Control's impulsive solution (to check your work)
  const SCEN = {
    circ: { label: N`Circularize at apoapsis`, vehicle: 'csm', s0: () => atPeri(200e3, 1000e3),
      task: N`You are in a 200 × 1 000 km orbit, at perigee. Circularize at 1 000 km: one prograde burn at the next apoapsis.`,
      solution: () => { const rp = RE + 200e3, ra = RE + 1000e3; return [{ when: 'apo', pro: Math.sqrt(mu / ra) - vis(ra, (rp + ra) / 2), rad: 0 }]; } },
    hohmann: { label: N`Hohmann transfer to 2 000 km`, vehicle: 'csm', s0: () => circ(300e3),
      task: N`From a circular 300 km orbit, reach a circular 2 000 km orbit with two burns: the first in 5 minutes, the second at the apoapsis of the transfer orbit.`,
      solution: () => { const r1 = RE + 300e3, r2 = RE + 2000e3, at = (r1 + r2) / 2; return [{ when: 'in', minutes: 5, pro: vis(r1, at) - Math.sqrt(mu / r1), rad: 0 }, { when: 'apo', pro: Math.sqrt(mu / r2) - vis(r2, at), rad: 0 }]; } },
    radial: { label: N`Radial burn`, vehicle: 'csm', s0: () => atPeri(300e3, 1500e3),
      task: N`You are in a 300 × 1 500 km orbit. Burn purely radial (no prograde component) and watch what happens to the periapsis, the apoapsis and the orientation of the orbit.`,
      solution: () => [{ when: 'in', minutes: 20, pro: 0, rad: 150 }] },
    long: { label: N`Long burn with a small stage`, vehicle: 'low', s0: () => circ(300e3),
      task: N`With a small 8 kN stage, raise the apoapsis of a circular 300 km orbit to 5 000 km in a single burn. The impulsive Δv will not be enough: find out by how much, and correct it.`,
      solution: () => { const r1 = RE + 300e3, r2 = RE + 5000e3; return [{ when: 'in', minutes: 40, pro: vis(r1, (r1 + r2) / 2) - Math.sqrt(mu / r1), rad: 0 }]; } },
    free: { label: N`Free practice`, vehicle: 'csm', s0: () => circ(300e3),
      task: N`A circular 300 km orbit. Try anything.`, solution: () => [] },
  };

  App.chapter({
    id: 'burns', phase: N`Mission Control`, title: N`Planning a Burn`, lab: N`Maneuver computer`,
    blurb: N`Turn “we need that orbit” into three numbers and a time, then fly the burn for real.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module ${Progress.code('burns')} · Mission Control`,
          title: T`Planning a Burn`,
          lede: T`Mission Control computes, the crew executes. Between them travels a short list of numbers: when to ignite, how much velocity to add in which direction, and how long the engine will run. This module teaches you to produce that list and to fly it.`,
          refs: [T`Sellers · Maneuvering in Space`, T`BMW ch. 3 Basic Orbital Maneuvers`, T`Apollo Operations Handbook, maneuver PADs`],
        })}
        ${Progress.briefing('burns', { theory: 'theory', lab: 'mc', math: 'refresher', mathLabel: N`Vectors (dot products) and logarithms.` })}

        <section class="section" id="theory">
          <h2><span class="idx">6.1</span>${T`What Mission Control sends up`}</h2>
          <div class="prose">
            <p>${T`In module ${Progress.code('maneuvers')} a burn was an instant kick of so many metres per second. To actually fly one, the crew needs more. On Apollo, the capsule communicator read each burn to the crew as a <b>PAD</b>, a standard form they copied by hand. A maneuver PAD contained:`}</p>
            <ul>
              <li>${T`<b>TIG</b>, the time of ignition, in ground elapsed time;`}</li>
              <li>${T`<b>the Δv</b>, as three components in a frame attached to the spacecraft’s orbit;`}</li>
              <li>${T`<b>the attitude</b> to hold, the <b>burn time</b>, and the engine to use;`}</li>
              <li>${T`<b>the expected result</b>, such as the apoapsis and periapsis after the burn, so the crew could check it.`}</li>
            </ul>
            <p>${T`The crew entered the numbers into the guidance computer, which pointed the spacecraft, fired the engine and cut it off. Whatever the computer, the information is the same: when, how much, which way, and how long.`}</p>
          </div>
        </section>

        ${Archive.capsule('apollo13mcc')}

        <section class="section">
          <h2><span class="idx">6.2</span>${T`The maneuver frame`}</h2>
          <div class="prose">
            <p>${T`A Δv is a vector. Mission Control describes it with three components along axes attached to the orbit at the moment of the burn:`}</p>
            <ul>
              <li>${T`<b>Prograde</b>: along the velocity. Positive adds speed and raises the opposite side of the orbit; negative (retrograde) lowers it.`}</li>
              <li>${T`<b>Normal</b>: perpendicular to the orbit plane. It tilts the plane; a separate module covers plane changes.`}</li>
              <li>${T`<b>Radial</b>: in the plane, perpendicular to the velocity. It rotates the orbit around the spacecraft’s position: one apsis rises, the other falls.`}</li>
            </ul>
            <div class="eq">\\[ \\Delta\\vec v = \\Delta v_P\\,\\hat p + \\Delta v_N\\,\\hat n + \\Delta v_R\\,\\hat r, \\qquad |\\Delta\\vec v| = \\sqrt{\\Delta v_P^2 + \\Delta v_N^2 + \\Delta v_R^2}, \\qquad \\alpha = \\operatorname{atan2}(\\Delta v_R,\\ \\Delta v_P) \\]</div>
            ${Sym.where([['\\Delta v_P,\\ \\Delta v_N,\\ \\Delta v_R', N`prograde, normal and radial components of the burn`, 'm/s'], ['\\hat p,\\ \\hat n,\\ \\hat r', N`unit vectors of the maneuver frame (length 1, pure directions)`, '—'], ['\\alpha', N`attitude in the orbit plane: how far the thrust points away from prograde, towards radial`, N`rad or °`]], N`The burn magnitude is Pythagoras in three dimensions. The attitude is the angle of the in-plane components; atan2, the two-argument arctangent of calculators and spreadsheets, keeps the quadrant: 0° is prograde, 180° retrograde, +90° radial out, −90° radial in.`)}
            <p>${T`<b>Which “radial”?</b> There are two common conventions for the in-plane axis. Apollo used a <b>local vertical</b> frame (LVLH): straight up from the planet, and horizontal. Many planning tools and simulators use a <b>velocity</b> frame: prograde along the velocity, radial perpendicular to it. The two agree only where the flight-path angle γ is zero, at periapsis and apoapsis. Anywhere else, convert:`}</p>
            <div class="eq">\\[ \\Delta v_P = \\Delta v_H\\cos\\gamma + \\Delta v_V\\sin\\gamma, \\qquad \\Delta v_R = -\\Delta v_H\\sin\\gamma + \\Delta v_V\\cos\\gamma \\]</div>
            ${Sym.where([['\\Delta v_H,\\ \\Delta v_V', N`horizontal and vertical (local vertical) components of the same burn`, 'm/s'], 'gamma'], N`A Mission Control that computes in one frame and enters into the other gets a slightly wrong burn. Agree on the frame before you agree on the numbers. This course uses the <b>velocity</b> frame in every lab and on every PAD.`)}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">6.3</span>${T`From the orbit you want to three numbers`}</h2>
          <div class="prose">
            <p>${T`Mission Control works backwards. Decide the velocity you need just after the burn, subtract the velocity you will have just before it, and project the difference onto the axes of the frame:`}</p>
            <div class="eq">\\[ \\Delta\\vec v = \\vec v_{after} - \\vec v_{before}, \\qquad \\Delta v_P = \\Delta\\vec v\\cdot\\hat p, \\qquad \\Delta v_R = \\Delta\\vec v\\cdot\\hat r, \\qquad \\Delta v_N = \\Delta\\vec v\\cdot\\hat n \\]</div>
            ${Sym.where([['\\vec v_{after},\\ \\vec v_{before}', N`velocity vectors just after and just before the burn, at the same point`, 'm/s'], ['\\cdot', N`dot product: the length of one vector along the direction of the other`, '']])}
            ${Primer.box('vectors', false, 'refresher')}
            <p>${T`Three classic cases, all with the formulas you already know:`}</p>
            <ul>
              <li>${T`<b>Circularize or Hohmann:</b> at an apsis the velocity is horizontal, so the burn is pure prograde: Δv<sub>P</sub> = v<sub>new</sub> − v<sub>old</sub>, each from vis-viva.`}</li>
              <li>${T`<b>Move the apsides:</b> a radial burn leaves the energy almost unchanged but turns the velocity, which shifts periapsis and apoapsis around the orbit.`}</li>
              <li>${T`<b>Change the plane by Δi:</b> the velocity must turn out of the plane without changing length, which gives Δv<sub>N</sub> = v sin Δi and Δv<sub>P</sub> = −v (1 − cos Δi). Module ${Progress.code('planes')} derives these and shows where to burn.`}</li>
            </ul>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">6.4</span>${T`How long to burn`}</h2>
          <div class="prose">
            <p>${T`The engine’s thrust is constant but the spacecraft gets lighter as it burns, so the acceleration grows. The burn time follows from the rocket equation, not from Δv divided by the initial acceleration:`}</p>
            <div class="eq">\\[ t_b = \\frac{m_0\\,I_{sp}\\,g_0}{F}\\left(1 - e^{-\\Delta v/(I_{sp}\\,g_0)}\\right), \\qquad m_{prop} = m_0\\left(1 - e^{-\\Delta v/(I_{sp}\\,g_0)}\\right) \\]</div>
            ${Sym.where(['tb', ['m_0', N`mass at ignition`, 'kg'], 'isp', 'g0', 'Fth', 'dv', ['m_{prop}', N`propellant used by the burn`, 'kg']], N`For a 214 m/s burn of the Apollo CSM (28.8 t, 91 kN, 314 s), t_b = 65 s and 1 900 kg of propellant.`)}
            ${Primer.box('log')}
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">6.5</span>${T`Finite burns`}</h2>
          <div class="prose">
            <p>${T`The plan assumes an instant kick at one moment, the <b>burn point</b>. A real burn lasts seconds or minutes, during which the spacecraft keeps moving along its orbit while the engine holds a fixed direction in space. Two consequences:`}</p>
            <ul>
              <li>${T`<b>Centre the burn on the burn point.</b> Ignite half a burn time early, so the burn is spread evenly around it: TIG = t<sub>burn point</sub> − t<sub>b</sub>/2. Mission Control makes this shift before reading the PAD up, so the TIG on a PAD is always the moment the engine lights. Igniting at the burn point puts all of the burn after it.`}</li>
              <li>${T`<b>Finite-burn losses.</b> As the spacecraft moves, the fixed thrust direction drifts away from the ideal one, so part of the Δv is wasted. The loss grows with the burn time compared with the orbital period. Under a few percent of the period it is negligible; for long burns, Mission Control adds Δv or plans the burn in pieces.`}</li>
            </ul>
            <p>${T`In the lab, a small 8 kN stage tries to raise its apoapsis from 300 km to 5 000 km with the impulsive Δv of 947 m/s, an 18-minute burn. Ignited at the burn point it reaches only about 3 760 km; centred on it, about 4 610 km. Getting to 5 000 km takes more Δv than the plan says.`}</p>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">6.6</span>${T`Lab: the maneuver computer`}</h2>
          <div class="prose"><p>${T`Choose a scenario, compute the burn as Mission Control, then enter it in the maneuver computer: when to burn and the prograde and radial components (this lab is planar, so there is no normal component). The computer works out the attitude, the burn time and the predicted orbit, writes the PAD, and flies the burn as a real finite burn: attitude held fixed in space, cut off when the planned Δv has been delivered. The dashed orbit is the plan; the solid line is what actually happens.`}</p></div>
          <div class="lab tl-lab" id="mc">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Maneuver computer`}</h3><span class="spacer"></span>
              <div class="seg" id="mc-warp" role="group" aria-label="${T`Time warp`}"><button data-v="100" aria-pressed="false">×100</button><button data-v="300" aria-pressed="true">×300</button><button data-v="1000" aria-pressed="false">×1000</button></div>
            </div>
            <div class="stage"><canvas id="mc-cv" aria-label="${T`Orbit around the Earth with the planned and the flown trajectory`}"></canvas><div class="overlay" id="mc-ov"></div><div class="badge" id="mc-badge"></div></div>
            <div class="tl-side">
              <dl class="readout" id="mc-live"></dl>
              <div class="pad" id="mc-pad"></div>
            </div>
            <div class="tl-transport">
              <div class="btn-row"><button class="btn primary" id="mc-play">${T`▸ Play`}</button><button class="btn" id="mc-restart">${T`⟲ Restart`}</button></div>
              ${UI.slider({ id: 'mc-t', label: T`Mission time`, min: 0, max: 1, step: 0.0005, value: 0 })}
            </div>
            <div class="tl-groups">
              <div class="tl-group">
                <h4>${T`Scenario`}</h4>
                <div class="ctl"><label for="mc-scen"><span>${T`Scenario`}</span></label><select id="mc-scen">${Object.entries(SCEN).map(([k, s]) => `<option value="${k}">${T(s.label)}</option>`).join('')}</select></div>
                <p class="note" id="mc-task" style="margin:0"></p>
                <div class="ctl"><label for="mc-veh"><span>${T`Vehicle`}</span></label><select id="mc-veh">${Object.entries(VEHICLES).map(([k, v]) => `<option value="${k}">${T(v.name)}</option>`).join('')}</select></div>
                <label class="mono note" style="display:flex;gap:.5rem;align-items:center"><input type="checkbox" id="mc-centre" checked> ${T`Centre each burn on its burn point (TIG = burn point − t<sub>b</sub>/2)`}</label>
                <button class="btn" id="mc-solve">${T`Show Mission Control’s impulsive solution`}</button>
              </div>
              ${[0, 1].map((i) => `
              <div class="tl-group mc-burn" data-i="${i}">
                <h4>${T`Burn ${i + 1}`}</h4>
                <div class="ctl"><label for="mc-when${i}"><span>${T`Burn point`}</span></label><select id="mc-when${i}">
                  ${i ? `<option value="off">${T`no second burn`}</option>` : ''}
                  <option value="in">${T`in … minutes`}</option><option value="apo">${T`at next apoapsis`}</option><option value="peri">${T`at next periapsis`}</option></select></div>
                <div class="mc-fields">
                  <label>${T`minutes`}<input type="text" inputmode="decimal" id="mc-min${i}" value="${i ? 0 : 5}"></label>
                  <label>${T`prograde (m/s)`}<input type="text" inputmode="decimal" id="mc-pro${i}" value="0"></label>
                  <label>${T`radial (m/s)`}<input type="text" inputmode="decimal" id="mc-rad${i}" value="0"></label>
                  <label>${T`normal (m/s)`}<input type="text" id="mc-nor${i}" value="—" disabled title="${T`Plane changes: separate module`}"></label>
                </div>
              </div>`).join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('burns', { math: 'vectors', mathLabel: N`Vectors and dot products.` })}`;

      mountComputer(page.querySelector('#mc'));
      Practice.embed(page.querySelector('#practice-slot'), 'burns', 3);
    },
  });

  function mountComputer(root) {
    let scenKey = 'circ', res = null, tNow = 0, playing = !UI.reducedMotion(), warp = 300, touched = false;
    const $ = (sel) => root.querySelector(sel);
    const num = (id) => { const v = parseFloat(String($(id).value).replace(/\s|\u202f/g, '').replace(',', '.')); return isFinite(v) ? v : 0; };
    const view = UI.canvas($('#mc-cv'), null);
    const deg = (r) => r * 180 / Math.PI;
    const kmAlt = (r) => UI.fmt((r - RE) / 1000, 0);

    function readBurns() {
      const out = [];
      for (const i of [0, 1]) {
        const when = $(`#mc-when${i}`).value;
        if (when === 'off') continue;
        out.push({ when, minutes: num(`#mc-min${i}`), pro: num(`#mc-pro${i}`), rad: num(`#mc-rad${i}`) });
      }
      return out;
    }
    function setBurns(list) {
      for (const i of [0, 1]) {
        const b = list[i];
        $(`#mc-when${i}`).value = b ? b.when : (i ? 'off' : 'in');
        $(`#mc-min${i}`).value = UI.dec(b && b.minutes != null ? String(b.minutes) : String(i ? 0 : 5));
        $(`#mc-pro${i}`).value = UI.dec(b ? b.pro.toFixed(1) : '0');
        $(`#mc-rad${i}`).value = UI.dec(b ? b.rad.toFixed(1) : '0');
      }
      syncFields();
    }
    const syncFields = () => { for (const i of [0, 1]) { const w = $(`#mc-when${i}`).value; $(`#mc-min${i}`).disabled = w !== 'in'; for (const k of ['pro', 'rad']) $(`#mc-${k}${i}`).disabled = w === 'off'; } };

    function run() {
      const sc = SCEN[scenKey], veh = VEHICLES[$('#mc-veh').value];
      res = Phys.executeBurns({ s0: sc.s0(), mu, m0: veh.m0, F: veh.F, isp: veh.isp, burns: readBurns(), centred: $('#mc-centre').checked });
      res.start = Orbit2D.elems(sc.s0(), mu);
      tNow = playing ? 0 : res.t;
      checkObjectives(veh);
      renderPad(veh); draw();
    }

    function checkObjectives(veh) {
      if (!touched) return;
      const f = res.final, rp = (f.rp - RE) / 1000, ra = (f.ra - RE) / 1000;
      if (scenKey === 'circ' && f.e < 0.003 && Math.abs(rp - 1000) < 30 && Math.abs(ra - 1000) < 30) Progress.done('burns', 'circ');
      if (scenKey === 'hohmann' && f.e < 0.003 && Math.abs(rp - 2000) < 30 && Math.abs(ra - 2000) < 30) Progress.done('burns', 'hohmann');
      if (res.burns.some((b) => b.dv >= 50 && Math.abs(Math.sin(b.attitude)) >= 0.9)) Progress.done('burns', 'radial');
      if (scenKey === 'long' && veh === VEHICLES.low && Math.abs(ra - 5000) <= 100) Progress.done('burns', 'long');
    }

    // the PAD card: what Mission Control would read up for each burn
    function renderPad(veh) {
      const rows = res.burns.map((b) => `
        <div class="pad-burn">
          <b>${T`PAD · burn ${b.i + 1}`}</b>
          <dl>
            <dt>TIG</dt><dd>GET ${UI.fmtTime(b.tStart)}</dd>
            <dt>${T`Burn point`}</dt><dd>GET ${UI.fmtTime(b.tig)}</dd>
            <dt>Δv P / R</dt><dd>${UI.fmt(b.dv * Math.cos(b.attitude), 1)} / ${UI.fmt(b.dv * Math.sin(b.attitude), 1)} m/s</dd>
            <dt>|Δv|</dt><dd>${UI.fmt(b.dv, 1)} m/s</dd>
            <dt>${T`Attitude α`}</dt><dd>${UI.fmt(deg(b.attitude), 1)}°</dd>
            <dt>${T`Burn time`}</dt><dd>${UI.fmt(b.tb, 1)} s</dd>
            <dt>${T`Propellant`}</dt><dd>${UI.fmt(b.prop, 0)} kg</dd>
            <dt>${T`Planned orbit`}</dt><dd>${kmAlt(b.planned.rp)} × ${kmAlt(b.planned.ra)} km</dd>
            <dt>${T`Flown orbit`}</dt><dd class="hl">${kmAlt(b.actual.rp)} × ${kmAlt(b.actual.ra)} km</dd>
          </dl>
        </div>`).join('');
      $('#mc-pad').innerHTML = rows || `<p class="note" style="margin:0">${T`No burn entered yet. Compute the Δv and type it in.`}</p>`;
      const f = res.final;
      const b = $('#mc-badge');
      b.textContent = T`Final orbit ${kmAlt(f.rp)} × ${kmAlt(f.ra)} km`;
      b.className = 'badge ' + (f.rp - RE < 120e3 ? 'bad' : '');
      $('#mc-task').textContent = T(SCEN[scenKey].task);
    }

    function stateAt(t) {
      const tr = res.trace;
      let lo = 0, hi = tr.length - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (tr[mid].t <= t) lo = mid; else hi = mid - 1; }
      return { i: lo, p: tr[lo] };
    }

    view.draw = (ctx, w, h) => {
      if (!res) return;
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h);
      UI.stars(ctx, w, h, K, 80);
      // fit the largest orbit involved
      let rMax = res.start.ra;
      for (const b of res.burns) rMax = Math.max(rMax, b.planned.ra, b.actual.ra);
      rMax = Math.min(Math.max(rMax, RE * 1.3), RE * 6);
      const s = Math.min(w, h) / (2.2 * rMax), cx = w / 2, cy = h / 2;
      const P = (x, y) => [cx + x * s, cy - y * s];
      const orbit = (el, color, dash, width) => {
        if (!(el.e < 1)) return;
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath();
        for (let k = 0; k <= 240; k++) { const nu = 2 * Math.PI * k / 240, r = el.p / (1 + el.e * Math.cos(nu)); const [x, y] = P(r * Math.cos(el.w + nu), r * Math.sin(el.w + nu)); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); ctx.setLineDash([]);
      };
      orbit(res.start, K.muted, [2, 4], 1);
      res.burns.forEach((b, i) => orbit(b.planned, i ? K.trace2 : K.accent, [6, 5], 1.4));
      UI.drawEarth(ctx, cx, cy, RE * s, K);
      // flown path up to now, burns highlighted
      const { i: idx, p: cur } = stateAt(tNow);
      ctx.lineWidth = 2;
      for (let k = 1; k <= idx; k++) {
        const a = res.trace[k - 1], c = res.trace[k];
        ctx.strokeStyle = c.burn >= 0 ? K.warn : K.trace; ctx.lineWidth = c.burn >= 0 ? 4 : 2;
        ctx.beginPath(); ctx.moveTo(...P(a.x, a.y)); ctx.lineTo(...P(c.x, c.y)); ctx.stroke();
      }
      // burn-point markers
      ctx.font = `10px ${K.mono}`; ctx.textAlign = 'left';
      res.burns.forEach((b) => { const [x, y] = P(b.sPlan[0], b.sPlan[1]); ctx.strokeStyle = K.good; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.stroke(); ctx.fillStyle = K.good; ctx.fillText(`${T`burn point`} ${b.i + 1}`, x + 9, y - 6); });
      // spacecraft and thrust direction
      const [sx, sy] = P(cur.x, cur.y);
      ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(sx, sy, 4, 0, 7); ctx.fill();
      const burning = res.burns.find((b) => tNow >= b.tStart && tNow <= b.tEnd);
      if (burning) UI.arrow(ctx, sx, sy, sx + burning.u[0] * 40, sy - burning.u[1] * 40, K.warn, 2.5);
      $('#mc-ov').innerHTML = `${T`dashed: planned orbits · thick: engine burning`}<br>${playing ? T`playback ×${warp}` : ''}`;
    };

    function updateLive() {
      if (!res) return;
      const { p } = stateAt(tNow);
      const r = Math.hypot(p.x, p.y);
      const next = res.burns.find((b) => tNow < b.tEnd);
      let status = T`all burns complete`;
      if (next && tNow < next.tStart) status = T`burn ${next.i + 1} ignition in ${UI.fmtTime(next.tStart - tNow)}`;
      else if (next) status = T`burn ${next.i + 1} in progress`;
      $('#mc-live').innerHTML = `
        <dt>GET</dt><dd class="hl">${UI.fmtTime(tNow)}</dd>
        <dt>${T`Altitude`}</dt><dd>${UI.fmt((r - RE) / 1000, 0)} km</dd>
        <dt>${T`Mass`}</dt><dd>${UI.fmt(p.m, 0)} kg</dd>
        <dt>${T`Status`}</dt><dd>${status}</dd>`;
      $('#mc-t').value = tNow / res.t;
      $('#mc-t-out').textContent = 'GET ' + UI.fmtTime(tNow);
    }
    function draw() { view.redraw(); updateLive(); }

    // controls
    const playBtn = $('#mc-play');
    const setPlay = () => { playBtn.textContent = playing ? T`❚❚ Pause` : T`▸ Play`; };
    playBtn.addEventListener('click', () => { if (tNow >= res.t) tNow = 0; playing = !playing; setPlay(); });
    $('#mc-restart').addEventListener('click', () => { tNow = 0; playing = true; setPlay(); });
    $('#mc-t').addEventListener('input', (e) => { tNow = +e.target.value * res.t; playing = false; setPlay(); draw(); });
    UI.seg(root, '#mc-warp', (v) => { warp = +v; });
    $('#mc-scen').addEventListener('change', (e) => {
      scenKey = e.target.value; touched = false;
      $('#mc-veh').value = SCEN[scenKey].vehicle;
      setBurns(scenKey === 'radial' ? [{ when: 'in', minutes: 20, pro: 0, rad: 0 }] : scenKey === 'hohmann' ? [{ when: 'in', minutes: 5, pro: 0, rad: 0 }, { when: 'apo', pro: 0, rad: 0 }] : scenKey === 'circ' ? [{ when: 'apo', pro: 0, rad: 0 }] : [{ when: 'in', minutes: scenKey === 'long' ? 40 : 5, pro: 0, rad: 0 }]);
      playing = true; setPlay(); run();
    });
    $('#mc-solve').addEventListener('click', () => { setBurns(SCEN[scenKey].solution()); touched = false; playing = true; setPlay(); run(); });
    root.querySelectorAll('.mc-burn select, .mc-burn input, #mc-veh, #mc-centre').forEach((el) => el.addEventListener('change', () => { touched = true; syncFields(); playing = true; setPlay(); run(); }));

    UI.loop((dt) => {
      if (!res || !playing) return;
      const burning = res.burns.some((b) => tNow >= b.tStart - 30 && tNow <= b.tEnd);
      tNow = Math.min(res.t, tNow + dt * (burning ? Math.min(warp, 30) : warp));
      if (tNow >= res.t) { playing = false; setPlay(); }
      draw();
    });
    setPlay();
    $('#mc-scen').dispatchEvent(new Event('change'));
  }
})();
