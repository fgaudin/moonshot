/* Chapter 7 — Powered descent, landing, ascent. Lab: lunar lander with real LM numbers. */
(function () {
  'use strict';
  const { C } = Phys;
  const GM = C.muM / (C.RM * C.RM);          // 1.624 m/s²
  const DPS = { F: 45040, isp: 311 };

  App.chapter({
    id: 'landing', phase: N`Descent`, title: N`Landing on the Moon`, lab: N`Lunar lander`,
    blurb: N`Take over from the computer 150 m above a boulder field, with 60 seconds of fuel and a 1202 alarm.`,
    render(page) {
      page.innerHTML = `
        ${App.header({
          eyebrow: T`Training module TM-8 · Powered descent & ascent`,
          title: T`Landing on the Moon`,
          lede: T`Twelve and a half minutes from 15 km altitude and 1.7 km/s to standstill on the surface, paid for with 2 km/s of Δv. The Moon has no air, so every metre per second comes from the engine.`,
          refs: [T`Sellers · Rockets and Launch Vehicles`, T`Apollo 11 Mission Report (MSC-00171) §5`],
        })}
        ${Progress.briefing('landing', { theory: 'theory', lab: 'ld', math: 'refresher', mathLabel: N`Logarithms.` })}

        <section class="section" id="theory">
          <h2><span class="idx">8.1</span>${T`Powered descent`}</h2>
          <div class="prose">
            <p>${T`After undocking, the Lunar Module <i>Eagle</i> lowered its perilune to 15 km with a 23 m/s descent orbit insertion burn. At perilune it lit the Descent Propulsion System (DPS) for <b>powered descent initiation</b> and flew three guidance programs:`}</p>
            <ol>
              <li>${T`<b>P63, braking.</b> Full thrust, pointed against the velocity. It removes nearly all of the 1.7 km/s orbital speed while the LM flies face-up, watching the landing radar.`}</li>
              <li>${T`<b>P64, approach.</b> From <i>high gate</i>, about 2.3 km up, the LM pitches upright so the commander can see the landing site through a scale etched on his window. The computer flies to the designated point.`}</li>
              <li>${T`<b>P66, landing.</b> From <i>low gate</i>, about 150 m, semi-manual. Each click of the rate-of-descent switch changes the commanded sink rate by 0.3 m/s. The commander steers horizontally by tilting the LM.`}</li>
            </ol>
            <p>${T`The descent cost about 2 050 m/s. The theoretical minimum is about 1.7 km/s, the orbital speed itself; the rest is <b>gravity loss</b>. Every second spent hovering costs \\(g_☾ = 1.62\\) m/s of Δv for nothing:`}</p>
            <div class="eq">\\[ t_{hover} = \\frac{I_{sp}\\,g_0}{g_☾}\\,\\ln\\frac{m_0}{m_0 - m_{prop}} \\]</div>
            ${Sym.where(['thover', 'isp', 'g0', 'gM', 'ln', 'm0h', 'mprop'])}
            ${Primer.box('log', false, 'refresher')}
            <div class="callout history"><b>1202</b>${T`Five minutes into Apollo 11's descent the guidance computer raised program alarms 1202 and 1201: “executive overflow”. The rendezvous radar, left on as a safety backup, was stealing CPU cycles through a hardware quirk. The software, designed by Margaret Hamilton's team at MIT, restarted and dropped low-priority tasks while it kept flying. Twenty-six-year-old guidance officer Steve Bales made the “go” call. Then Armstrong saw that P64 was heading for a boulder field beside West crater. He took over in P66, flew 400 m further, and landed with about 45 seconds of propellant before the bingo call.`}</div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">8.2</span>${T`Lab: you have the stick`}</h2>
          <div class="prose"><p>${T`You start at low gate: 500 m up, sinking at 12 m/s and drifting forward at 18 m/s over a boulder field. Real numbers: 8 t lander, 45 kN engine throttleable 10–60% (plus 100%), I<sub>sp</sub> 311 s, lunar gravity 1.62 m/s². Land on the flat pad: sink rate under 3 m/s, drift under 1.2 m/s, tilt under 6°.`}</p>
          <p class="mono note">${T`Keyboard: ↑/↓ or W/S throttle (or descent rate in P66) · ←/→ or A/D tilt · P toggles P66 · R restart. Buttons work on touch screens.`}</p></div>
          <div class="lab" id="ld">
            <div class="lab-head"><span class="tag">${T`Lab`}</span><h3>${T`Lunar lander`}</h3><span class="spacer"></span>
              <label class="mono note" style="display:flex;gap:.4rem;align-items:center"><input type="checkbox" id="ld-p66"> ${T`P66 rate-of-descent mode`}</label>
              <button class="btn primary" id="ld-start">${T`▸ Start descent`}</button></div>
            <div class="stage" style="min-height:460px" tabindex="0" id="ld-stage" aria-label="${T`Lunar lander simulation. Use arrow keys.`}"><canvas id="ld-cv"></canvas><div class="overlay" id="ld-ov" style="color:#c9d2df"></div><div class="badge" id="ld-badge">${T`Ready`}</div></div>
            <div class="controls">
              <dl class="readout" id="ld-ro" style="font-size:.9rem"></dl>
              <div class="btn-row" style="justify-content:center">
                <button class="btn" data-k="left" aria-label="${T`Tilt left`}">${T`◀ tilt`}</button>
                <button class="btn" data-k="up" aria-label="${T`More thrust`}">▲</button>
                <button class="btn" data-k="down" aria-label="${T`Less thrust`}">▼</button>
                <button class="btn" data-k="right" aria-label="${T`Tilt right`}">${T`tilt ▶`}</button>
              </div>
              <div class="ctl"><label for="ld-thr"><span>${T`Throttle`}</span><output id="ld-thr-out"></output></label><input type="range" id="ld-thr" min="0" max="100" step="1" value="40"></div>
              <p class="note" id="ld-call" style="margin:0;min-height:3em;font-family:var(--f-mono);font-size:.8rem" aria-live="polite"></p>
            </div>
          </div>
        </section>

        <section class="section">
          <h2><span class="idx">8.3</span>${T`Ascent and rendezvous`}</h2>
          <div class="prose">
            <p>${T`The ascent stage used the descent stage as its launch pad. Its Ascent Propulsion System had one fixed-thrust engine (15.6 kN, I<sub>sp</sub> 311 s) with no throttle and no gimbal. It was built as simply as possible: pressure-fed, with hypergolic propellants that ignite on contact. There was no backup. A 7-minute burn delivered about 1 850 m/s, into a 17 × 83 km orbit. From there, the CSI, CDH and TPI manoeuvres of Chapter 5 brought <i>Eagle</i> back to <i>Columbia</i>.`}</p>
          </div>
          <div class="scroll-x" style="max-width:48rem"><table class="data"><thead><tr><th>${T`Lunar Module (Apollo 11)`}</th><th>${T`Mass (kg)`}</th><th>${T`Engine`}</th><th>${T`Thrust`}</th><th>I<sub>sp</sub></th></tr></thead><tbody>
            <tr><td>${T`Descent stage, dry`}</td><td>2 030</td><td rowspan="1">DPS</td><td>${T`45.0 kN, 10–60% + 100%`}</td><td>311 s</td></tr>
            <tr><td>${T`Descent propellant`}</td><td>8 200</td><td></td><td></td><td></td></tr>
            <tr><td>${T`Ascent stage, dry (with crew)`}</td><td>2 450</td><td>APS</td><td>${T`15.6 kN fixed`}</td><td>311 s</td></tr>
            <tr><td>${T`Ascent propellant`}</td><td>2 350</td><td></td><td></td><td></td></tr>
            <tr><td>${T`<b>Total at separation</b>`}</td><td><b>15 030</b></td><td></td><td></td><td></td></tr>
          </tbody></table></div>
        </section>

        <section class="section">
          <h2><span class="idx">✓</span>${T`Check yourself`}</h2>
          <div id="practice-slot"></div>
        </section>
        ${Progress.debrief('landing', { math: 'log', mathLabel: N`Exponentials and logarithms.` })}`;

      mountLander(page.querySelector('#ld'));
      Practice.embed(page.querySelector('#practice-slot'), 'landing', 2);
    },
  });

  function mountLander(root) {
    // terrain: deterministic, a boulder field followed by a flat landing pad
    const TER = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let x = -600; x <= 1400; x += 4) {
      let y = 6 * Math.sin(x / 90) + 3 * Math.sin(x / 23 + 1);
      // West-crater-like depression
      const dc = (x - 180) / 110; if (Math.abs(dc) < 1) y -= 28 * (1 - dc * dc) - (Math.abs(dc) > 0.8 ? 10 * (Math.abs(dc) - 0.8) / 0.2 : 0);
      if (x > 520 && x < 640) y = 2;                                 // landing pad
      TER.push([x, y]);
    }
    const BOULDERS = [];
    for (let i = 0; i < 40; i++) { const x = 0 + rnd() * 480; if (x > 70 && x < 290 && rnd() < 0.5) continue; BOULDERS.push([x, 1.5 + rnd() * 3.5]); }
    const PAD = [520, 640];
    const groundAt = (x) => {
      const i = Math.max(0, Math.min(TER.length - 2, Math.floor((x + 600) / 4)));
      const [x0, y0] = TER[i], [x1, y1] = TER[i + 1];
      let y = y0 + (y1 - y0) * (x - x0) / (x1 - x0);
      for (const [bx, br] of BOULDERS) if (Math.abs(x - bx) < br) y = Math.max(y, groundAt0(bx) + Math.sqrt(br * br - (x - bx) ** 2));
      return y;
    };
    const groundAt0 = (x) => { const i = Math.max(0, Math.min(TER.length - 2, Math.floor((x + 600) / 4))); const [x0, y0] = TER[i], [x1, y1] = TER[i + 1]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); };

    let S, running = false, ended = false, keys = {}, calls = [], camG = 0;
    const reset = () => {
      S = { t: 0, x: 0, h: 500, vx: 18, vh: -12, m: 8000, prop: 500, pitch: 0, pitchCmd: 0, thr: 40, rodCmd: -1.0, flame: 0 };
      calls = []; ended = false;
      root.querySelector('#ld-thr').value = 40;
      say(T`Eagle, Houston. You are go for landing.`);
      setBadge(T`Ready`, '');
    };
    const setBadge = (txt, cls) => { const b = root.querySelector('#ld-badge'); b.textContent = txt; b.className = 'badge ' + cls; };
    const say = (txt) => { root.querySelector('#ld-call').textContent = txt; };
    const p66 = () => root.querySelector('#ld-p66').checked;

    const view = UI.canvas(root.querySelector('#ld-cv'), null);
    const stage = root.querySelector('#ld-stage');

    const startBtn = root.querySelector('#ld-start');
    startBtn.addEventListener('click', () => { reset(); running = true; startBtn.textContent = T`⟲ Restart`; stage.focus({ preventScroll: true }); });
    const thrEl = root.querySelector('#ld-thr');
    const thrOut = root.querySelector('#ld-thr-out');
    thrEl.addEventListener('input', () => { S.thr = snapThr(+thrEl.value); });
    // DPS could not run between 65% and 92.5% (throat erosion); snap out of that band
    const snapThr = (v) => (v > 65 && v < 92.5 ? (v < 79 ? 65 : 92.5) : v);

    const onKey = (e, down) => {
      if (!running) return;
      const k = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' }[e.code];
      if (k) { keys[k] = down; e.preventDefault(); if (down && (k === 'up' || k === 'down')) nudge(k); }
      if (down && e.code === 'KeyP') root.querySelector('#ld-p66').click();
      if (down && e.code === 'KeyR') startBtn.click();
    };
    const kd = (e) => onKey(e, true), ku = (e) => onKey(e, false);
    stage.addEventListener('keydown', kd); stage.addEventListener('keyup', ku);
    // also accept keys when nothing else has focus and the lab is on screen
    const wkd = (e) => { const r = root.getBoundingClientRect(); if (document.activeElement === document.body && running && r.top < innerHeight && r.bottom > 0) kd(e); };
    window.addEventListener('keydown', wkd); window.addEventListener('keyup', ku);
    UI.onCleanup(() => { running = false; window.removeEventListener('keydown', wkd); window.removeEventListener('keyup', ku); });
    const nudge = (k) => {
      if (p66()) S.rodCmd = Math.max(-8, Math.min(2, S.rodCmd + (k === 'up' ? 0.3 : -0.3)));
      else { S.thr = snapThr(Math.max(0, Math.min(100, S.thr + (k === 'up' ? 5 : -5)))); thrEl.value = S.thr; }
    };
    root.querySelectorAll('[data-k]').forEach((b) => {
      const k = b.dataset.k;
      const on = (e) => { e.preventDefault(); if (!running) return; keys[k] = true; if (k === 'up' || k === 'down') nudge(k); };
      const off = () => { keys[k] = false; };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off);
    });

    function step(dt) {
      if (keys.left) S.pitchCmd = Math.max(-45, S.pitchCmd - 20 * dt);
      if (keys.right) S.pitchCmd = Math.min(45, S.pitchCmd + 20 * dt);
      if (!keys.left && !keys.right) S.pitchCmd *= Math.pow(0.4, dt);   // attitude hold drifts back upright
      S.pitch += Math.max(-10 * dt, Math.min(10 * dt, S.pitchCmd - S.pitch));
      if (p66()) {
        // P66: computer throttles to null the error between commanded and actual sink rate
        const aNeed = GM + 1.5 * (S.rodCmd - S.vh);
        S.thr = snapThr(Math.max(10, Math.min(100, 100 * aNeed * S.m / (DPS.F * Math.cos(S.pitch * Math.PI / 180)))));
        thrEl.value = S.thr;
      }
      const F = S.prop > 0 ? DPS.F * S.thr / 100 : 0;
      const mdot = F / (DPS.isp * C.g0);
      const a = F / S.m, th = S.pitch * Math.PI / 180;
      S.vx += a * Math.sin(th) * dt;
      S.vh += (a * Math.cos(th) - GM) * dt;
      S.x += S.vx * dt; S.h += S.vh * dt;
      S.m -= mdot * dt; S.prop = Math.max(0, S.prop - mdot * dt);
      S.t += dt;
      S.flame = F / DPS.F;
      // touchdown: contact probes ~1.7 m below the footpads; use the pad height
      const g = groundAt(S.x);
      if (S.h - g <= 0) {
        const slope = Math.abs(groundAt(S.x + 4) - groundAt(S.x - 4)) / 8;
        const ok = Math.abs(S.vh) < 3 && Math.abs(S.vx) < 1.2 && Math.abs(S.pitch) < 6 && slope < 0.14;
        const onPad = S.x > PAD[0] && S.x < PAD[1];
        S.h = g; running = false; ended = true;
        if (ok) {
          Progress.done('landing', 'land');
          if (onPad && hoverLeft() >= 30) Progress.done('landing', 'pad');
          setBadge(onPad ? T`The Eagle has landed` : T`Landed, off the pad`, onPad ? 'good' : 'warn');
          say(T`Contact light. Engine stop. Touchdown at ${UI.fmt(-S.vh, 2)} m/s with ${UI.fmt(S.prop, 0)} kg (${UI.fmt(hoverLeft(), 0)} s) of propellant left. ${onPad ? T`Houston, Tranquility Base here.` : T`Safe, but outside the planned area.`}`);
        } else {
          const why = Math.abs(S.vh) >= 3 ? T`sink rate ${UI.fmt(-S.vh, 1)} m/s` : Math.abs(S.vx) >= 1.2 ? T`drift ${UI.fmt(S.vx, 1)} m/s` : Math.abs(S.pitch) >= 6 ? T`tilt ${UI.fmt(S.pitch, 1)}°` : T`slope too steep (boulder?)`;
          setBadge(T`Crash: ${why}`, 'bad');
          say(T`Landing gear failure: ${why}. Press restart and try again.`);
        }
      }
      if (S.h - g > 2500 || Math.abs(S.x) > 3000) { running = false; ended = true; setBadge(T`Abort: out of range`, 'bad'); }
    }
    const hoverLeft = () => S.prop / ((S.m * GM) / (DPS.isp * C.g0));

    function callouts() {
      const tl = hoverLeft(), alt = S.h - groundAt(S.x);
      const once = (k, txt) => { if (!calls.includes(k)) { calls.push(k); say(txt); } };
      if (S.t > 1) once('1202', T`PROGRAM ALARM 1202… Houston: “We’re go on that alarm.”`);
      if (S.prop < 120) once('low', T`LOW LEVEL light: about 5% of the descent propellant left.`);
      if (tl < 60) once('60', T`Houston: “Sixty seconds.”`);
      if (tl < 30) once('30', T`Houston: “Thirty seconds.” Bingo comes after this: land or abort.`);
      if (S.prop <= 0) once('dry', T`Descent propellant depleted. Fire the ascent engine to abort!`);
      if (alt < 30 && Math.abs(S.vh) < 2) once('dust', T`“${UI.fmt(alt, 0)} m, down ${UI.fmt(-S.vh, 1)}, picking up some dust.”`);
    }

    view.draw = (ctx, w, h) => {
      const K = UI.tok();
      ctx.clearRect(0, 0, w, h);
      // the lunar sky is black in daylight, whatever the page theme
      ctx.fillStyle = '#05080d'; ctx.fillRect(0, 0, w, h);
      UI.stars(ctx, w, h * 0.6, { ...K, muted: '#c9d2df' }, 60);
      const alt = S.h - groundAt(S.x);
      // camera: zoom in as altitude falls
      const span = Math.max(160, Math.min(900, alt * 2.2 + 120));
      const s = Math.min(w / span, (h * 0.7) / (Math.max(alt, 0) + 30));
      camG += (groundAt(S.x) - camG) * 0.05;          // smoothed ground reference, no jumps over the crater
      const camX = S.x + (w / s) * 0.12;
      const P = (x, y) => [w / 2 + (x - camX) * s, h * 0.82 - (y - camG) * s];
      // Earth hanging in the black sky
      UI.drawEarth(ctx, w * 0.85, h * 0.14, 14, K);
      // terrain
      ctx.fillStyle = '#8b8d91'; ctx.beginPath();
      const [sx0] = P(camX - span, 0);
      ctx.moveTo(sx0, h);
      for (let x = camX - span; x <= camX + span; x += Math.max(1, span / 300)) { const [px, py] = P(x, groundAt(x)); ctx.lineTo(px, py); }
      ctx.lineTo(w * 2, h); ctx.closePath(); ctx.fill();
      // pad
      const [pa, pya] = P(PAD[0], 2), [pb] = P(PAD[1], 2);
      ctx.strokeStyle = '#5fd39a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(pa, pya); ctx.lineTo(pb, pya); ctx.stroke();
      ctx.fillStyle = '#5fd39a'; ctx.font = `11px ${K.mono}`; ctx.textAlign = 'center'; ctx.fillText(T`LANDING SITE`, (pa + pb) / 2, pya + 16);
      const [bfx, bfy] = P(240, -10); ctx.fillStyle = '#ff8a7a'; ctx.fillText(T`boulder field`, bfx, bfy + 26);
      // LM
      const [lx, ly] = P(S.x, S.h);
      const k = Math.max(1.8, s);                       // LM is ~9 m wide incl. legs; enlarged when far away
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(S.pitch * Math.PI / 180);
      const u = 1 * k;
      if (S.flame > 0.01 && S.prop > 0) {
        const fl = (6 + 10 * S.flame + Math.random() * 2) * u;
        const g = ctx.createLinearGradient(0, -2 * u, 0, fl); g.addColorStop(0, K.warn); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-1.6 * u, -2.2 * u); ctx.lineTo(1.6 * u, -2.2 * u); ctx.lineTo(0, fl); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = '#d9dde3'; ctx.lineWidth = Math.max(1, 0.35 * u);
      // legs
      ctx.beginPath(); ctx.moveTo(-2.5 * u, -3.5 * u); ctx.lineTo(-4.5 * u, 0); ctx.moveTo(2.5 * u, -3.5 * u); ctx.lineTo(4.5 * u, 0);
      ctx.moveTo(-5.2 * u, 0); ctx.lineTo(-3.8 * u, 0); ctx.moveTo(3.8 * u, 0); ctx.lineTo(5.2 * u, 0); ctx.stroke();
      ctx.fillStyle = K.warn; ctx.fillRect(-2.6 * u, -5.4 * u, 5.2 * u, 2.6 * u);          // descent stage (gold foil)
      ctx.fillStyle = '#b9bec6'; ctx.fillRect(-2.2 * u, -8.6 * u, 4.4 * u, 3.2 * u);         // ascent stage
      ctx.fillStyle = '#20262e'; ctx.fillRect(-1.2 * u, -7.8 * u, 0.9 * u, 0.9 * u);
      ctx.restore();
      // altitude tape
      ctx.fillStyle = '#c9d2df'; ctx.textAlign = 'left'; ctx.fillText(T`${UI.fmt(w / s, 0)} m across`, 10, h - 10);
      root.querySelector('#ld-ov').innerHTML = running || ended ? '' : T`Press Start descent. Keys: ↑↓ throttle · ←→ tilt`;
    };

    function readout() {
      const alt = S.h - groundAt(S.x), tl = hoverLeft();
      const warn = (c, txt) => `<span style="color:var(--${c})">${txt}</span>`;
      root.querySelector('#ld-ro').innerHTML = `
        <dt>MET</dt><dd>${UI.fmtTime(S.t)}</dd>
        <dt>${T`Altitude`}</dt><dd class="hl">${UI.fmt(alt, 1)} m</dd>
        <dt>${T`Altitude rate`}</dt><dd>${Math.abs(S.vh) > 3 && alt < 50 ? warn('bad', UI.fmt(S.vh, 2)) : UI.fmt(S.vh, 2)} m/s</dd>
        <dt>${T`Horizontal velocity`}</dt><dd>${Math.abs(S.vx) > 1.2 && alt < 30 ? warn('warn', UI.fmt(S.vx, 2)) : UI.fmt(S.vx, 2)} m/s</dd>
        <dt>${T`Tilt`}</dt><dd>${UI.fmt(S.pitch, 1)}°</dd>
        <dt>${T`Throttle`}</dt><dd>${UI.fmt(S.thr, 0)} %${p66() ? ` (P66 ROD ${UI.fmt(S.rodCmd, 1)})` : ''}</dd>
        <dt>${T`Thrust / weight`}</dt><dd>${UI.fmt(DPS.F * S.thr / 100 / (S.m * GM), 2)}</dd>
        <dt>${T`Propellant`}</dt><dd>${UI.fmt(S.prop, 0)} kg</dd>
        <dt>${T`Hover time left`}</dt><dd>${tl < 30 ? warn('bad', UI.fmt(tl, 0)) : tl < 60 ? warn('warn', UI.fmt(tl, 0)) : UI.fmt(tl, 0)} s</dd>
        <dt>${T`Downrange to site`}</dt><dd>${UI.fmt((PAD[0] + PAD[1]) / 2 - S.x, 0)} m</dd>`;
      thrOut.textContent = UI.fmt(S.thr, 0) + ' %';
    }

    reset();
    UI.loop((dt) => {
      if (running) {
        const n = 4; for (let i = 0; i < n && running; i++) step(dt / n);
        callouts();
      }
      view.redraw(); readout();
    });
  }
})();
